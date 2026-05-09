#!/usr/bin/env node
// Tests the full action loop: Hyperspell behavioral context + Nia world knowledge
// → assembled into the LLM prompt → artifact rendered.
//
// Run: HYPERSPELL_API_KEY=hs2-... NIA_API_KEY=nk_... node scripts/test-action-loop.js

process.env.HYPERSPELL_API_KEY ||= 'sk-test-mock';
process.env.HYPERSPELL_BASE    ||= process.env.HYPERSPELL_API_KEY.startsWith('hs2-') ? 'https://api.hyperspell.com' : 'mock://local';
process.env.HYPERSPELL_USER_ID ||= 'hardik';
process.env.SHADOW_FIRM_ID     ||= 'acme_vc';
process.env.SHADOW_PARTNER_ID  ||= 'hardik';
process.env.SHADOW_PARTNER_NAME||= 'Hardik';
process.env.NIA_BASE           ||= 'https://apigcp.trynia.ai/v2';

const hs = require('../src/ingest/hyperspell');
const nia = require('../src/ingest/nia');
const ctx = require('../src/context');

const C = { dim: '\x1b[2m', reset: '\x1b[0m', bold: '\x1b[1m', cyan: '\x1b[36m', yellow: '\x1b[33m', green: '\x1b[32m', red: '\x1b[31m' };
const h = (label) => console.log(`\n${C.bold}${C.cyan}━━━ ${label} ━━━${C.reset}`);
const ok = (msg) => console.log(`  ${C.green}✓${C.reset} ${msg}`);
const info = (msg) => console.log(`  ${C.dim}${msg}${C.reset}`);
const warn = (msg) => console.log(`  ${C.yellow}!${C.reset} ${msg}`);

async function main() {
  console.log(`${C.bold}Shadow action loop · Hyperspell + Nia${C.reset}`);
  console.log(`Hyperspell: ${hs.diagnostics().mode} · Nia: ${nia.diagnostics().enabled ? 'enabled' : 'disabled'}\n`);

  // ─── 1. Direct Nia probes ───────────────────────────────────────────
  h('1. Direct Nia probes — proves world knowledge is reachable');

  const niaQueries = [
    { fn: () => nia.web('Datadog Series B 2014 fundraise', 'news'),         label: 'web/news · "Datadog Series B 2014"' },
    { fn: () => nia.web('Stripe alumni founders engineering', 'company'),    label: 'web/company · "Stripe alumni founders"' },
    { fn: () => nia.web('AI agent infrastructure startups', 'company'),      label: 'web/company · "AI agent infrastructure"' },
    { fn: () => nia.web('Honeycomb observability acquisition', 'news'),      label: 'web/news · "Honeycomb acquisition"' },
  ];
  for (const { fn, label } of niaQueries) {
    const hits = await fn();
    ok(`${label} → ${hits.length} hits`);
    for (const hit of hits.slice(0, 2)) {
      info(`    [${hit.kind}] ${(hit.title || '').slice(0, 70)}`);
      info(`       ${(hit.summary || '').replace(/\s+/g, ' ').slice(0, 100)}…`);
    }
  }

  // ─── 2. Universal search ────────────────────────────────────────────
  h('2. Nia universal search — code + docs + web combined');
  const u = await nia.universal('distributed inference runtime architecture', 10);
  ok(`universal → ${u.length} hits`);
  for (const hit of u.slice(0, 3)) info(`    [${hit.kind}] ${(hit.title || hit.url || '').slice(0, 80)}`);

  // ─── 3. Hyperspell partner-vault sanity (uses what we wrote earlier) ─
  h('3. Hyperspell — partner vault still has memories from the prior test');
  const hsHits = await hs.search({
    scope: 'partner', partner: ctx.ME, firm: ctx.FIRM,
    query: 'Acme Inc CTO ex-Stripe', sources: ['vault'], k: 5, halfLifeHours: 168,
  });
  ok(`partner vault → ${hsHits.length} hits`);
  for (const hit of hsHits.slice(0, 3)) info(`    ${hit.adjusted.toFixed(2)} · ${hit.text.slice(0, 80)}`);

  // ─── 4. The full IC memo action — both systems together ─────────────
  h('4. IC memo action — Hyperspell + Nia merged into the LLM prompt');
  const icMemo = require('../src/actions/ic-memo');
  const result = await icMemo.run({ company: 'Acme Inc' });

  ok(`action returned: ${result.kind}`);
  ok(`hyperspell_total: ${result.data.sources.hyperspell_total}`);
  info(`  ${result.data.sources.hyperspell_by_scope.partner} personal · ${result.data.sources.hyperspell_by_scope.firm} firm-wide`);
  info(`  by kind: ${JSON.stringify(result.data.sources.hyperspell_by_kind)}`);
  ok(`nia_total: ${result.data.sources.nia_total}`);
  if (result.data.flags && result.data.flags.length) warn(`flags: ${result.data.flags.join(', ')}`);

  console.log(`\n${C.dim}── Prompt that went to the LLM (first 800 chars) ──${C.reset}`);
  console.log(C.dim + (result.data.prompt_preview || '').slice(0, 800) + (result.data.prompt_preview && result.data.prompt_preview.length > 800 ? '…' : '') + C.reset);

  // ─── 5. Founder lookup — Nia-heavy action ────────────────────────────
  h('5. Founder lookup — Nia-heavy (code + people search)');
  const founder = require('../src/actions/founder-lookup');
  const fres = await founder.run({ company: 'Stripe' });
  ok(`action returned: ${fres.kind}`);
  ok(`hyperspell_total: ${fres.data.sources.hyperspell_total}`);
  if (fres.data.flags && fres.data.flags.length) warn(`flags: ${fres.data.flags.join(', ')}`);

  // ─── 6. Market check — Nia for comps ─────────────────────────────────
  h('6. Market check — Nia comps + Hyperspell skepticism');
  const mc = require('../src/actions/market-check');
  const mcres = await mc.run({ company: 'Datadog' });
  ok(`action returned: ${mcres.kind}`);
  ok(`hyperspell_total: ${mcres.data.sources.hyperspell_total}`);

  console.log(`\n${C.bold}${C.green}done.${C.reset}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
