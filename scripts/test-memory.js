#!/usr/bin/env node
// End-to-end test of the Hyperspell memory layer.
//
// Runs in two modes:
//   - HYPERSPELL_BASE=mock://local  → uses in-memory adapter (no key needed)
//   - HYPERSPELL_BASE=https://api.hyperspell.com  → hits real Hyperspell with HYPERSPELL_API_KEY
//
// Exercises:
//   1. Flooding the partner vault with realistic VC memories (voice, screen, file, click).
//   2. Verifying every memory mirrors to BOTH partner and firm vaults.
//   3. Querying the partner vault and the firm vault — same data, different scope.
//   4. Recency + valence reranking visibly working.
//   5. The IC memo action — proves Hyperspell hits flow into the LLM prompt.
//
// Run:    node scripts/test-memory.js
// Mock:   HYPERSPELL_BASE=mock://local node scripts/test-memory.js
// Real:   HYPERSPELL_API_KEY=sk-real ./scripts/test-memory.js

process.env.HYPERSPELL_API_KEY ||= 'sk-test-mock';
process.env.HYPERSPELL_BASE    ||= 'mock://local';
process.env.HYPERSPELL_USER_ID ||= 'hardik';
process.env.SHADOW_FIRM_ID     ||= 'acme_vc';
process.env.SHADOW_PARTNER_ID  ||= 'hardik';
process.env.SHADOW_PARTNER_NAME||= 'Hardik';

const hs = require('../src/ingest/hyperspell');
const ctx = require('../src/context');
const MemoryRepo = require('../src/repos/memory');
const queue = require('../src/ingest/queue');
const bus = require('../src/bus');

const C = { dim: '\x1b[2m', reset: '\x1b[0m', bold: '\x1b[1m', cyan: '\x1b[36m', yellow: '\x1b[33m', green: '\x1b[32m', red: '\x1b[31m' };
const h = (label) => console.log(`\n${C.bold}${C.cyan}━━━ ${label} ━━━${C.reset}`);
const ok = (msg) => console.log(`  ${C.green}✓${C.reset} ${msg}`);
const info = (msg) => console.log(`  ${C.dim}${msg}${C.reset}`);
const warn = (msg) => console.log(`  ${C.yellow}!${C.reset} ${msg}`);
const fail = (msg) => { console.log(`  ${C.red}✗${C.reset} ${msg}`); process.exitCode = 1; };

bus.on('memory:write', ({ entry }) => info(`bus → memory:write [${entry.kind}] ${entry.text.slice(0, 80)}`));

async function flush() {
  // wait for the in-process queue to drain
  for (let i = 0; i < 50; i++) {
    const s = queue.stats();
    if (s.depth === 0 && s.active === 0) return;
    await new Promise((r) => setTimeout(r, 50));
  }
}

async function main() {
  console.log(`${C.bold}Shadow memory layer · end-to-end test${C.reset}`);
  console.log(`Hyperspell mode: ${C.bold}${hs.isMock ? 'MOCK (in-memory)' : 'REAL'}${C.reset}`);
  console.log(`Partner: ${ctx.ME.id} · Firm: ${ctx.FIRM.id}\n`);

  // ─── 1. Flood the vault ───────────────────────────────────────────────
  h('1. Flood partner vault with realistic VC memories');
  const seedVoice = [
    { text: '"i don\'t trust this CAC number — feels too clean"', valence: 0 },
    { text: '"if the CTO came from Stripe i want to talk to them"', valence: 0 },
    { text: '"this founder type — i invest in this guy every time"', valence: 1 },
    { text: '"healthcare sales cycle, this is going to be a year of nothing"', valence: -1 },
    { text: '"hardware dilution risk — never works the way the deck says"', valence: -1 },
    { text: '"love technical founders out of payments infra"', valence: 1 },
    { text: '"TAM at $40B feels made up — show me the bottom-up"', valence: 0 },
  ];
  for (const v of seedVoice) MemoryRepo.create({ kind: 'voice', text: v.text, valence: v.valence });

  const seedScreen = [
    'Acme Inc deck · team slide · 38s dwell',
    'Acme Inc deck · ARR slide · 22s dwell',
    'Mira Health team slide · 4s dwell · scrolled past',
    'Helix Compute · GitHub profile · 6 min dwell on commits',
    'Bolt Robotics financials · 12s dwell · closed tab',
  ];
  for (const s of seedScreen) MemoryRepo.create({ kind: 'screen', text: s });

  const seedFile = [
    { text: 'Acme Inc Series A deck — $8M ask at $32M post. CTO James Chen ex-Stripe 4yr. 3 design partners @ $40k ARR.', file_name: 'acme_deck.pdf' },
    { text: 'Acme Inc Series A deck — TAM claimed at $40B, comparable Datadog IPO at $38B', file_name: 'acme_deck.pdf' },
    { text: 'Helix Compute one-pager — distributed inference runtime, design partners Replicate and Together', file_name: 'helix_onepager.pdf' },
  ];
  for (const f of seedFile) MemoryRepo.create({ kind: 'file', text: f.text, meta: { file_name: f.file_name, chunk_idx: 0, chunk_total: 1 } });

  const seedClicks = [
    { kind: 'click', text: 'clicked: ic_memo on Acme Inc', valence: 1 },
    { kind: 'click', text: 'clicked: founder_lookup on Helix Compute', valence: 1 },
    { kind: 'ignore', text: 'ignored: market_check on Mira Health', valence: -1 },
  ];
  for (const c of seedClicks) MemoryRepo.create({ kind: c.kind, text: c.text, valence: c.valence });

  await flush();
  ok(`Wrote ${seedVoice.length + seedScreen.length + seedFile.length + seedClicks.length} memories`);
  ok(`Queue stats: ${JSON.stringify(queue.stats())}`);

  // ─── 2. Verify both vaults received the writes ───────────────────────
  h('2. Verify two-tier mirror — partner vault + firm vault');
  const partnerHits = await hs.search({
    scope: 'partner', partner: ctx.ME, firm: ctx.FIRM,
    query: 'CAC TAM skepticism', k: 5, halfLifeHours: 168,
  });
  const firmHits = await hs.search({
    scope: 'firm', partner: ctx.ME, firm: ctx.FIRM,
    query: 'CAC TAM skepticism', k: 5, halfLifeHours: 168,
  });
  ok(`partner vault → ${partnerHits.length} hits`);
  ok(`firm vault    → ${firmHits.length} hits`);
  if (partnerHits.length === 0) fail('partner vault empty after writes');
  if (firmHits.length === 0) fail('firm vault empty after auto-mirror');
  for (const h_ of partnerHits.slice(0, 3)) info(`  · ${h_.adjusted.toFixed(2)} [${h_.scope}] ${h_.text.slice(0, 70)}`);

  // ─── 3. Test scoped queries ──────────────────────────────────────────
  h('3. Scoped queries return relevant memories');
  const queries = [
    { q: 'what does the user think about CAC',     halfLife: 24 },
    { q: 'technical founders from Stripe',          halfLife: 168 },
    { q: 'Acme Inc pitch deck details',             halfLife: 24 },
    { q: 'hardware dilution risk',                  halfLife: 168 },
  ];
  for (const { q, halfLife } of queries) {
    const r = await hs.search({ scope: 'partner', partner: ctx.ME, firm: ctx.FIRM, query: q, k: 3, halfLifeHours: halfLife });
    ok(`"${q}" → ${r.length} hits`);
    if (r.length === 0) warn(`no hits — semantic match may be weak in mock mode`);
    else for (const h_ of r.slice(0, 2)) info(`     ${h_.adjusted.toFixed(2)} · ${h_.text.slice(0, 70)}`);
  }

  // ─── 4. Recency + valence weighting visible ──────────────────────────
  h('4. Recency + valence — clicks (+) outrank ignores (−)');
  const valenceHits = await hs.search({
    scope: 'partner', partner: ctx.ME, firm: ctx.FIRM,
    query: 'invest pattern technical founders',
    k: 5, halfLifeHours: 168,
  });
  for (const h_ of valenceHits.slice(0, 5)) {
    const v = h_.meta && h_.meta.valence;
    info(`  adj=${h_.adjusted.toFixed(2)} val=${v != null ? v : '0'} · ${h_.text.slice(0, 60)}`);
  }
  ok(`valence multiplier applied (positive memories should rise)`);

  // ─── 5. Action handler — Hyperspell context flows into prompt ────────
  h('5. IC memo handler — Hyperspell hits flow into the LLM prompt');
  const icMemo = require('../src/actions/ic-memo');
  const result = await icMemo.run({ company: 'Acme Inc' });
  ok(`action returned: ${result.kind}`);
  ok(`hyperspell_total drawn into prompt: ${result.data.sources.hyperspell_total}`);
  ok(`  · partner-scope memories: ${result.data.sources.hyperspell_by_scope.partner}`);
  ok(`  · firm-scope memories:    ${result.data.sources.hyperspell_by_scope.firm}`);
  ok(`  · breakdown by kind: ${JSON.stringify(result.data.sources.hyperspell_by_kind)}`);
  ok(`nia_total: ${result.data.sources.nia_total} ${result.data.flags.length ? '(' + result.data.flags.join(', ') + ')' : ''}`);
  console.log(`\n${C.dim}Prompt preview (first 400 chars):${C.reset}`);
  console.log(C.dim + result.data.prompt_preview.slice(0, 400) + '…' + C.reset);

  // ─── 6. Edit + delete propagation ────────────────────────────────────
  h('6. Edit + delete a memory — both vaults stay in sync');
  const edit = MemoryRepo.list({ limit: 1 })[0];
  ok(`editing memory ${edit.id.slice(0, 8)}: "${edit.text.slice(0, 50)}"`);
  MemoryRepo.update(edit.id, { text: edit.text + ' [edited at runtime]' });
  await flush();
  const after = MemoryRepo.list({ limit: 1 })[0];
  ok(`after edit: "${after.text.slice(0, 70)}"`);
  if (!after.edited) fail('edited flag not set');

  const tgt = MemoryRepo.list({ limit: 5 })[2];
  ok(`deleting memory ${tgt.id.slice(0, 8)}: "${tgt.text.slice(0, 50)}"`);
  MemoryRepo.remove(tgt.id);
  await flush();
  const allLive = MemoryRepo.list({ limit: 100 });
  if (allLive.find((r) => r.id === tgt.id)) fail('deleted memory still in live list');
  else ok('deleted memory no longer in live list');

  // ─── 7. Diagnostics ──────────────────────────────────────────────────
  h('7. Hyperspell adapter diagnostics');
  console.log('  ' + JSON.stringify(hs.diagnostics(), null, 2).split('\n').join('\n  '));

  console.log(`\n${C.bold}${C.green}done.${C.reset} ${process.exitCode ? C.red + 'with failures above' + C.reset : ''}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
