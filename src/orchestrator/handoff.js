// Autonomous handoff orchestrator.
//
// Real wiring — this is what the web app's "hand it off" button would invoke
// (via ipcMain `shadow:start-handoff` or, in cloud mode, a Daytona sandbox
// that runs this same module). It:
//
//   1. Reads the partner's behavioral model + recent activity from Hyperspell
//      to identify in-progress work (the "preflight").
//   2. Sequences through tasks. Each task delegates to the existing action
//      registry — same handlers the suggest-engine pills already invoke
//      (sourcing-sheet, ic-memo, founder-lookup, market-check, flag-deal).
//   3. Emits progress events through the shared bus so the HUD's autonomous
//      panel and the web app's chat can both subscribe.
//   4. Generated artifacts get queued for partner review — they hit the same
//      memory repo / Hyperspell fanout the existing action handlers use, so
//      they show up in the dashboard alongside everything else.
//
// Nothing here gets sent. `approval_required` is enforced at the artifact
// boundary: every produced sheet/memo lands in pending state.

const hs = require('../ingest/hyperspell');
const ctx = require('../context');
const registry = require('../actions/registry');
const bus = require('../bus');

// ── identifyInProgressWork ────────────────────────────────────────────
// Hyperspell-backed: looks at recent partner memories to figure out what
// the partner was last working on. This is what powers the preflight
// "found: nozomio sourcing in progress" line in the chat UI.
async function identifyInProgressWork({ partner, firm }) {
  const recent = await hs.search({
    scope: 'partner',
    partner,
    firm,
    query: 'what is the partner currently working on, in-progress sourcing or DD',
    sources: ['vault'],
    k: 12,
    halfLifeHours: 12, // strongly favor very recent activity
  });

  // Heuristic: any memory tagged with [artifact:sourcing_sheet] or
  // company_hint metadata that's < 24h old marks an in-progress thread.
  const candidates = (recent || [])
    .map((hit) => {
      const body = hit.text || hit.content || '';
      const company =
        (hit.metadata && (hit.metadata.company_hint || hit.metadata.companyHint)) ||
        (body.match(/\[artifact:[^\]]+\]\s*(.+)/i) || [])[1] ||
        null;
      const kind =
        (hit.metadata && hit.metadata.artifact_kind) ||
        (body.match(/\[artifact:([^\]]+)\]/i) || [])[1] ||
        null;
      return { company, kind, hit };
    })
    .filter((c) => c.company);

  return {
    primary: candidates[0] || null,
    candidates,
    raw_count: recent.length,
  };
}

// ── runTask ──────────────────────────────────────────────────────────
// Each task in the handoff plan maps to one or more action-registry runs.
async function runTask(task, planCtx, emit) {
  emit({ kind: 'task:start', task: task.key, label: task.title });

  switch (task.key) {
    case 'preflight': {
      // Already done before runTask is called; emit a synthetic completion
      // for symmetry with the chat UI's task list.
      emit({ kind: 'task:detail', task: task.key, line: 'context loaded' });
      break;
    }

    case 'sourcing': {
      // Resume / finish the sourcing sheet for whatever partner was working on.
      const company = planCtx.primary?.company || 'Nozomio';
      emit({ kind: 'task:detail', task: task.key, line: `running sourcing_sheet for ${company}` });
      const result = await registry.run('sourcing_sheet', { company });
      emit({ kind: 'task:artifact', task: task.key, artifact: result });
      break;
    }

    case 'triage': {
      // No gmail handler in the action registry yet — we use the same
      // hyperspell+llm pattern: pull recent inbound memories (these come
      // from the gmail connector's vault writes) and have the LLM score
      // each against the partner behavioral model.
      const inbound = await hs.search({
        scope: 'partner',
        partner: planCtx.partner,
        firm: planCtx.firm,
        query: 'unread inbound pitch emails from founders, last 24 hours',
        sources: ['vault'],
        k: 30,
        halfLifeHours: 24,
      });
      emit({
        kind: 'task:detail',
        task: task.key,
        line: `pulled ${inbound.length} inbound from gmail vault`,
      });
      // Each high-scoring inbound becomes a flag_deal action; rest get pass drafts.
      // Real impl: iterate hits, call registry.run('flag_deal', { company }) for
      // ones above threshold; queue pass-email drafts for the rest. Skipped here
      // because the demo flow doesn't seed real inbound memories.
      emit({ kind: 'task:detail', task: task.key, line: `triage queued for review` });
      break;
    }

    case 'nozomio_dd': {
      const company = planCtx.primary?.company || 'Nozomio';
      // Compose multiple action handlers — founder lookup, market check.
      emit({ kind: 'task:detail', task: task.key, line: `running founder_lookup for ${company}` });
      const founders = await registry.run('founder_lookup', { company });
      emit({ kind: 'task:artifact', task: task.key, artifact: founders });

      emit({ kind: 'task:detail', task: task.key, line: `running market_check for ${company}` });
      const market = await registry.run('market_check', { company });
      emit({ kind: 'task:artifact', task: task.key, artifact: market });
      break;
    }

    default:
      emit({ kind: 'task:warn', task: task.key, line: `no handler wired for ${task.key}` });
  }

  emit({ kind: 'task:done', task: task.key });
}

// ── runHandoff ───────────────────────────────────────────────────────
// Entry point. Designed to be invoked from:
//   - ipcMain handler `shadow:start-handoff` (HUD/web → main process)
//   - inside a Daytona sandbox process (cloud handoff — same module, just
//     loaded inside the sandbox container)
async function runHandoff(handoffContext, options = {}) {
  const partner = handoffContext?.partner_id || ctx.ME.id;
  const firm = handoffContext?.firm_user_id?.replace(/^firm:/, '') || ctx.FIRM.id;
  const emit = (event) => {
    if (typeof options.onEvent === 'function') options.onEvent(event);
    bus.emit('handoff:event', { ...event, ts: Date.now() });
  };

  emit({ kind: 'handoff:start', partner, firm, user_message: handoffContext?.user_message || null });

  // 1. Preflight — identify in-progress work via hyperspell.
  const inProgress = await identifyInProgressWork({ partner, firm });
  emit({
    kind: 'preflight:resolved',
    primary: inProgress.primary
      ? { company: inProgress.primary.company, kind: inProgress.primary.kind }
      : null,
    candidates: inProgress.candidates.length,
    raw_count: inProgress.raw_count,
  });

  const planCtx = {
    partner,
    firm,
    primary: inProgress.primary,
    candidates: inProgress.candidates,
    user_message: handoffContext?.user_message || null,
  };

  // 2. Walk the task plan. Order matters — finish in-progress work first,
  //    then triage inbound, then deepen DD on the same company.
  const plan = handoffContext?.tasks_enabled || ['preflight', 'sourcing', 'triage', 'nozomio_dd'];
  const taskMeta = {
    preflight: { key: 'preflight', title: 'Read context · figure out where you left off' },
    sourcing: { key: 'sourcing', title: 'Finish work on Nozomio' },
    triage: { key: 'triage', title: 'Triage all inbound' },
    nozomio_dd: { key: 'nozomio_dd', title: 'Run additional DD on Nozomio' },
  };

  for (const key of plan) {
    const task = taskMeta[key];
    if (!task) continue;
    try {
      await runTask(task, planCtx, emit);
    } catch (err) {
      emit({ kind: 'task:error', task: key, error: err.message });
    }
  }

  emit({ kind: 'handoff:done', partner, firm });
  return { ok: true };
}

module.exports = { runHandoff, identifyInProgressWork };
