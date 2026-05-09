#!/usr/bin/env node
// Seed a *thick* Hyperspell vault for the demo: every named teammate gets
// their own personal memory stream tied to specific deals, and the firm
// vault gets institutional memory (past pass reasons, comp tables, market
// maps, co-investor sentiment, analyst notes).
//
// Reads cleanly off `web/src/mock/data.ts` so when an artifact handler runs
// against "Acme Inc" / "Mira Health" / "Helix Compute" / etc, the resulting
// IC memo, founder profile, market check, and sourcing sheet have real
// partner voice + real firm history to pull from.
//
// Run:   node scripts/seed-thick-memories.js
// Mock:  HYPERSPELL_BASE=mock://local node scripts/seed-thick-memories.js
// Real:  ensure HYPERSPELL_API_KEY + HYPERSPELL_BASE in env (or .env)

process.env.HYPERSPELL_API_KEY ||= 'sk-test-mock';
process.env.HYPERSPELL_BASE    ||= 'mock://local';
process.env.HYPERSPELL_USER_ID ||= 'me';
process.env.SHADOW_FIRM_ID     ||= 'acme_vc';
process.env.SHADOW_FIRM_NAME   ||= 'Acme Ventures';
process.env.SHADOW_PARTNER_ID  ||= 'me';
process.env.SHADOW_PARTNER_NAME||= 'You';

const hs = require('../src/ingest/hyperspell');
const ctx = require('../src/context');
const MemoryRepo = require('../src/repos/memory');
const queue = require('../src/ingest/queue');
const bus = require('../src/bus');

const C = { dim: '\x1b[2m', reset: '\x1b[0m', bold: '\x1b[1m', cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m' };
const h = (s) => console.log(`\n${C.bold}${C.cyan}━━ ${s} ━━${C.reset}`);
const ok = (s) => console.log(`  ${C.green}✓${C.reset} ${s}`);
const dim = (s) => console.log(`  ${C.dim}${s}${C.reset}`);

const FIRM = ctx.FIRM;
const ME = ctx.ME;
const TEAM = Object.fromEntries(ctx.TEAMMATES.map((t) => [t.id, t]));

let writes = 0;
function W(partner, mem) {
  MemoryRepo.create({ ...mem, partner, firm: FIRM });
  writes += 1;
}

// ──────────────────────────────────────────────────────────────────────
// Helper: write a batch of memories with optional shared meta + valence.
// ──────────────────────────────────────────────────────────────────────
function batch(partner, kind, items, baseMeta = {}) {
  for (const item of items) {
    const text = typeof item === 'string' ? item : item.text;
    const valence = typeof item === 'object' ? item.valence || 0 : 0;
    const meta = typeof item === 'object' ? { ...baseMeta, ...(item.meta || {}) } : baseMeta;
    W(partner, { kind, text, valence, meta });
  }
}

// ══════════════════════════════════════════════════════════════════════
// PARTNER: ME ("You")
// Voice, screen dwell, files ingested, action clicks. Anchored on Acme,
// Mira, Helix, Volt, Bolt — the same companies the dashboard mock uses.
// ══════════════════════════════════════════════════════════════════════

h('seeding ME (You) — partner voice + screen + files');

batch(ME, 'voice', [
  // Company-specific reactions
  { text: '"i don\'t trust this CAC number on Acme — feels too clean"', meta: { company_hint: 'Acme Inc' } },
  { text: '"if the CTO came from Stripe i want to talk to them"', valence: 1, meta: { company_hint: 'Acme Inc' } },
  { text: '"James Chen 340 commits in 90 days — that\'s the shape i fund"', valence: 1, meta: { company_hint: 'Acme Inc' } },
  { text: '"Acme TAM at $40B feels made up — show me the bottom-up"', meta: { company_hint: 'Acme Inc' } },
  { text: '"healthcare sales cycle, this is going to be a year of nothing"', valence: -1, meta: { company_hint: 'Mira Health' } },
  { text: '"Mira clinical co-founder is interesting but distribution kills it"', valence: -1, meta: { company_hint: 'Mira Health' } },
  { text: '"Helix is the cleanest infra deal i\'ve seen this quarter"', valence: 1, meta: { company_hint: 'Helix Compute' } },
  { text: '"Anya Volkov out of DeepMind — pattern matches our last 4 wins"', valence: 1, meta: { company_hint: 'Helix Compute' } },
  { text: '"hardware dilution risk — never works the way the deck says"', valence: -1, meta: { company_hint: 'Bolt Robotics' } },
  { text: '"consumer copilot solo founder no users, hard pass"', valence: -1, meta: { company_hint: 'Volt AI' } },
  { text: '"Vector Sec is on-thesis but it\'s too early — 2 design partners isn\'t enough"', meta: { company_hint: 'Vector Sec' } },
  // Long-running thesis statements (older, stable)
  { text: '"i invest in technical co-founders out of payments infra every time"', valence: 1 },
  { text: '"design partners paying $40k+ ARR pre-Series-A is the strongest signal i know"', valence: 1 },
  { text: '"i pass on healthcare unless there\'s a reimbursement angle in week one"', valence: -1 },
  { text: '"hardware deals — 7 of 8 we\'ve done diluted to nothing by Series B"', valence: -1 },
  { text: '"consumer plays score 18% in our model — almost always a pass"', valence: -1 },
  { text: '"if there\'s no defensible distribution thesis in the deck, i\'m out"', valence: -1 },
  { text: '"infra moat + technical pair is what i look for — Datadog, Honeycomb shape"', valence: 1 },
]);

batch(ME, 'screen', [
  { text: 'Acme Inc Series A deck · slide 4 "Team" · 38s dwell · CTO James Chen bio', meta: { company_hint: 'Acme Inc', dwell_ms: 38000 } },
  { text: 'Acme Inc Series A deck · slide 7 "ARR" · 22s dwell · 3 design partners @ $40k', meta: { company_hint: 'Acme Inc', dwell_ms: 22000 } },
  { text: 'Acme Inc Series A deck · slide 11 "Market" · 9s dwell · scrolled past', meta: { company_hint: 'Acme Inc', dwell_ms: 9000 } },
  { text: 'Mira Health team slide · 4s dwell · scrolled past', meta: { company_hint: 'Mira Health', dwell_ms: 4000 } },
  { text: 'Mira Health competitors slide · 6s dwell · Abridge / Suki / Nuance listed', meta: { company_hint: 'Mira Health' } },
  { text: 'Helix Compute · GitHub profile of Anya Volkov · 6 min dwell on commits', valence: 1, meta: { company_hint: 'Helix Compute', dwell_ms: 360000 } },
  { text: 'Helix Compute · DeepMind alumni page · 90s dwell', meta: { company_hint: 'Helix Compute' } },
  { text: 'Helix Compute · design partners section · Replicate / Together names', meta: { company_hint: 'Helix Compute' } },
  { text: 'Volt AI one-pager · 12s dwell · closed tab', meta: { company_hint: 'Volt AI', dwell_ms: 12000 } },
  { text: 'Bolt Robotics financials · 12s dwell · closed tab', meta: { company_hint: 'Bolt Robotics', dwell_ms: 12000 } },
  { text: 'YC W24 batch directory · scrolled past 30 cards · stopped on Vector Sec', meta: { company_hint: 'Vector Sec' } },
  { text: 'Vector Sec deck · slide 3 "Architecture" · 45s dwell · diagram of agent middleware', meta: { company_hint: 'Vector Sec' } },
]);

batch(ME, 'file', [
  { text: 'Acme Inc Series A deck — $8M ask at $32M post. CTO James Chen ex-Stripe 4yr eng lead. 3 paying design partners at $40k ARR each. 340 GitHub commits last 90 days.', meta: { company_hint: 'Acme Inc', file_name: 'acme_series_a_deck.pdf', chunk_idx: 0, chunk_total: 4 } },
  { text: 'Acme Inc Series A deck — TAM claimed $40B. Datadog comp at $38B IPO supports category-level. Tighter at agent-infra niche.', meta: { company_hint: 'Acme Inc', file_name: 'acme_series_a_deck.pdf', chunk_idx: 1, chunk_total: 4 } },
  { text: 'Acme Inc Series A deck — Founder James Chen, 2 prior startups (1 acq to Plaid, 1 shutdown), Stanford CS, ex-Stripe Connect team 4yr.', meta: { company_hint: 'Acme Inc', file_name: 'acme_series_a_deck.pdf', chunk_idx: 2, chunk_total: 4 } },
  { text: 'Acme Inc Series A deck — Use of funds: 60% eng hires, 25% GTM, 15% infra. Burn $300k/mo, runway 22 months at close.', meta: { company_hint: 'Acme Inc', file_name: 'acme_series_a_deck.pdf', chunk_idx: 3, chunk_total: 4 } },
  { text: 'Helix Compute one-pager — Distributed inference runtime. Founders Anya Volkov (ex-DeepMind 5yr, Oxford CS PhD) and Raj Patel (ex-Anthropic infra 3yr).', meta: { company_hint: 'Helix Compute', file_name: 'helix_onepager.pdf', chunk_idx: 0, chunk_total: 2 } },
  { text: 'Helix Compute one-pager — Design partners: Replicate, Together AI, unnamed Fortune-500. ARR run-rate $240k pre-Series-A.', meta: { company_hint: 'Helix Compute', file_name: 'helix_onepager.pdf', chunk_idx: 1, chunk_total: 2 } },
  { text: 'Mira Health pre-seed deck — Clinical AI assistant for primary care. Founded 2022, 14 employees, 3 hospital pilots (Cedars-Sinai, NYU Langone, Stanford).', meta: { company_hint: 'Mira Health', file_name: 'mira_preseed.pdf', chunk_idx: 0, chunk_total: 1 } },
  { text: 'Volt AI one-pager — Consumer productivity copilot, $3M seed ask, solo founder Maya Lin (ex-Notion design 2yr).', meta: { company_hint: 'Volt AI', file_name: 'volt_onepager.pdf', chunk_idx: 0, chunk_total: 1 } },
  { text: 'Bolt Robotics seed deck — Warehouse autonomy, $6M ask. Strong ex-Boston Dynamics team. 2 LOIs from 3PL operators.', meta: { company_hint: 'Bolt Robotics', file_name: 'bolt_seed.pdf', chunk_idx: 0, chunk_total: 1 } },
  { text: 'Vector Sec deck — Security infrastructure for AI agents, $4M seed. 2 design partners (Anthropic and an unnamed enterprise).', meta: { company_hint: 'Vector Sec', file_name: 'vector_sec_deck.pdf', chunk_idx: 0, chunk_total: 1 } },
]);

batch(ME, 'click', [
  { text: 'clicked: ic_memo on Acme Inc', valence: 1, meta: { company_hint: 'Acme Inc', action_id: 'ic_memo' } },
  { text: 'clicked: founder_lookup on Helix Compute', valence: 1, meta: { company_hint: 'Helix Compute', action_id: 'founder_lookup' } },
  { text: 'clicked: market_check on Acme Inc', valence: 1, meta: { company_hint: 'Acme Inc', action_id: 'market_check' } },
  { text: 'ignored: ic_memo on Mira Health', valence: -1, meta: { company_hint: 'Mira Health', action_id: 'ic_memo' } },
  { text: 'ignored: founder_lookup on Volt AI', valence: -1, meta: { company_hint: 'Volt AI', action_id: 'founder_lookup' } },
]);

// ══════════════════════════════════════════════════════════════════════
// PARTNER: Sarah K. (sk) — healthcare + infra wave thesis
// ══════════════════════════════════════════════════════════════════════

h('seeding Sarah K. — healthcare + 2019 infra wave thesis');

batch(TEAM.sk, 'voice', [
  { text: '"i\'ve seen 3 healthcare deals in 18 months where clinical co-founder + reimbursement angle hit 4x+"', valence: 1, meta: { company_hint: 'Mira Health' } },
  { text: '"Mira is the meeting i actually want to take this week"', valence: 1, meta: { company_hint: 'Mira Health' } },
  { text: '"Acme founder profile is a textbook ex-Stripe pattern — 4 of last 5 firm wins look like this"', valence: 1, meta: { company_hint: 'Acme Inc' } },
  { text: '"my 2019 infra wave thesis: NewRelic / Datadog / Honeycomb founders all had this exact shape"', valence: 1 },
  { text: '"i pattern-match on technical-pair-out-of-Stanford or Stanford-adjacent — keeps working"', valence: 1 },
  { text: '"if a clinical co-founder is on the cap table at 30%+, that\'s table stakes for my deals"', valence: 1 },
  { text: '"i need to see physician design partners on day one or i pass"', valence: -1 },
]);

batch(TEAM.sk, 'screen', [
  'Mira Health deck · clinical workflow demo · 3 min dwell · multiple replays',
  'Mira Health competitor matrix · Abridge / Suki / Nuance / DeepScribe — Mira wins on reimbursement rail',
  'Acme Inc · CTO James Chen LinkedIn · 2 min dwell',
  'NewRelic 2014 cap table · pulled from firm Notion · cross-reference',
  'Datadog Series B 2014 deck · firm archive · 8 min dwell on team slide',
]);

batch(TEAM.sk, 'file', [
  { text: 'Sarah\'s 2019 infra wave thesis memo — pattern: technical co-founder pair, ex-cloud-platform (Stripe/Cloudflare/Datadog), GitHub commit cadence > 5/wk, design partners @ paying tier within 6mo.', meta: { file_name: 'sk_infra_thesis_2019.md', chunk_idx: 0, chunk_total: 1 } },
  { text: 'Sarah\'s healthcare playbook — only deal if (a) clinical co-founder, (b) reimbursement angle in deck, (c) 3+ physician design partners. Rejected 12 deals in 2024 that missed any one.', meta: { file_name: 'sk_healthcare_playbook.md', chunk_idx: 0, chunk_total: 1 } },
]);

batch(TEAM.sk, 'note', [
  { text: '[teammate-take] Mira Health — Sarah recommends meeting before passing. Diverges from your read.', meta: { company_hint: 'Mira Health' } },
  { text: '[teammate-take] Acme Inc — Sarah aligned, Acme founder shape matches her infra-wave thesis.', valence: 1, meta: { company_hint: 'Acme Inc' } },
]);

// ══════════════════════════════════════════════════════════════════════
// PARTNER: Jin P. (jp) — agent infra + dev tools, deals-infra Slack
// ══════════════════════════════════════════════════════════════════════

h('seeding Jin P. — agent infra + dev tools');

batch(TEAM.jp, 'voice', [
  { text: '"Helix at $80k+ ARR per design partner pre-Series-A is the strongest signal i\'ve seen this year"', valence: 1, meta: { company_hint: 'Helix Compute' } },
  { text: '"Replicate AND Together paying — that\'s validation we don\'t fake"', valence: 1, meta: { company_hint: 'Helix Compute' } },
  { text: '"firm should lead Helix, not follow"', valence: 1, meta: { company_hint: 'Helix Compute' } },
  { text: '"Vector Sec is on-thesis for me but they need 4+ design partners before i write"', meta: { company_hint: 'Vector Sec' } },
  { text: '"agent infra is where my next 3 checks go — if the moat is distributed runtime, i\'m in"', valence: 1 },
  { text: '"open source contributor cadence is the leading indicator i actually trust"', valence: 1 },
  { text: '"Anthropic alumni building infra — that\'s a free option"', valence: 1, meta: { company_hint: 'Helix Compute' } },
]);

batch(TEAM.jp, 'screen', [
  'Helix Compute · #deals-infra Slack channel · multiple threads · 12 min dwell',
  'Helix Compute · GitHub org · open-source inference libraries · 8 min dwell',
  'Vector Sec · agent middleware architecture · diagram replays',
  'Replicate ARR dashboard · public · cross-checking Helix design partner claim',
]);

batch(TEAM.jp, 'note', [
  { text: '[slack:#deals-infra] "shadow synthesis on Helix just landed. design partners paying $80k+ ARR pre-Series-A. cleanest founder profile we\'ve seen this year."', valence: 1, meta: { company_hint: 'Helix Compute' } },
  { text: '[slack:#deals-infra] "if Sarah agrees on the founder profile + Linda surfaces the 2018 inference precedent, this should be a same-day term sheet."', valence: 1, meta: { company_hint: 'Helix Compute' } },
  { text: '[teammate-take] Vector Sec — Jin sees infrastructure thesis match but flags too-early. Wants a second meeting in 6 weeks.', meta: { company_hint: 'Vector Sec' } },
]);

// ══════════════════════════════════════════════════════════════════════
// PARTNER: Marcus T. (mt) — analyst, sourcing pipeline + comp tables
// ══════════════════════════════════════════════════════════════════════

h('seeding Marcus T. (analyst) — sourcing + comps');

batch(TEAM.mt, 'voice', [
  { text: '"Volt AI is a textbook pass — solo founder, no users, consumer with no moat"', valence: -1, meta: { company_hint: 'Volt AI' } },
  { text: '"i dug on the Acme cap table — clean, no awkward dilution from prior rounds"', valence: 1, meta: { company_hint: 'Acme Inc' } },
  { text: '"YC W24 batch has 3 agent-infra plays worth flagging — Acme is one"', meta: { company_hint: 'Acme Inc' } },
]);

batch(TEAM.mt, 'screen', [
  'YC W24 batch directory · 90 min dwell · flagged 6 companies for partner review',
  'Crunchbase · Acme Inc · cap table cross-check · clean',
  'Volt AI · LinkedIn of Maya Lin · solo founder confirmed',
  'Bolt Robotics · pulled industry comps for warehouse autonomy · 18 deals last 24mo',
]);

batch(TEAM.mt, 'file', [
  { text: 'Sourcing pipeline week of 2026-05-05 — 14 inbound, 6 flagged for partner review (Acme, Helix, Vector Sec, Mira, Bolt, Volt). Top score: Acme (12/15), Helix (11/15).', meta: { file_name: 'sourcing_pipeline_w20.md', chunk_idx: 0, chunk_total: 1 } },
  { text: 'Comp table — agent infrastructure plays last 18mo. Acme reads cleaner than Crew AI at the same stage. ARR/employee ratio is 2x category median.', meta: { company_hint: 'Acme Inc', file_name: 'comp_table_agent_infra.md', chunk_idx: 0, chunk_total: 1 } },
  { text: 'Comp table — warehouse autonomy. Bolt Robotics is at unit economics roughly 0.7x of Symbotic at same stage. Hardware dilution flagged across 7 of 8 firm-historical comps.', meta: { company_hint: 'Bolt Robotics', file_name: 'comp_table_warehouse.md', chunk_idx: 0, chunk_total: 1 } },
]);

// ══════════════════════════════════════════════════════════════════════
// PARTNER: Linda R. (lr, emer.) — historical comps + 2014-2018 wave
// ══════════════════════════════════════════════════════════════════════

h('seeding Linda R. (emeritus) — institutional history');

batch(TEAM.lr, 'voice', [
  { text: '"Acme reads cleaner than NewRelic did at the same stage in 2014"', valence: 1, meta: { company_hint: 'Acme Inc' } },
  { text: '"the 2018 Honeycomb seed is the closest historical precedent for Helix"', valence: 1, meta: { company_hint: 'Helix Compute' } },
  { text: '"i\'ve seen this hardware dilution story 7 times — it ends the same way"', valence: -1, meta: { company_hint: 'Bolt Robotics' } },
  { text: '"firm history: technical co-founder pairs out of cloud platforms have a 38% IRR"', valence: 1 },
  { text: '"in 2014 we passed on Datadog\'s seed — it\'s why we have a hard rule about infra now"', valence: 1 },
]);

batch(TEAM.lr, 'file', [
  { text: 'Firm historical comp set — 2014-2018 infra wave. Datadog Series B 2014 (22x at IPO), NewRelic Series A 2014 (8.4x exit), Honeycomb Seed 2018 (~$200M acq target).', meta: { file_name: 'firm_comps_2014_2018.md', chunk_idx: 0, chunk_total: 2 } },
  { text: 'Firm historical comp set — pattern: technical co-founder pair, infra moat, design partners pre-Series-A. 14 deals matched profile, 11 returned >3x.', meta: { file_name: 'firm_comps_2014_2018.md', chunk_idx: 1, chunk_total: 2 } },
  { text: 'Firm pass-reasons archive 2018-2024 — hardware: 7 of 8 diluted by Series B. Healthcare without reimbursement: 6 of 6 stuck at pilot. Consumer copilots: 14 of 17 sub-1x.', meta: { file_name: 'firm_pass_reasons.md', chunk_idx: 0, chunk_total: 1 } },
]);

batch(TEAM.lr, 'note', [
  { text: '[teammate-take] Helix Compute — Linda surfaces 2018 Honeycomb seed precedent: same technical-pair-from-infra-co shape, same kind of design-partner ARR. Honeycomb returned ~5x in 4 years.', valence: 1, meta: { company_hint: 'Helix Compute' } },
  { text: '[teammate-take] Acme Inc — Linda\'s read: cleaner than NewRelic 2014. TAM defensible at category level. Recommends term sheet.', valence: 1, meta: { company_hint: 'Acme Inc' } },
]);

// ══════════════════════════════════════════════════════════════════════
// PARTNER: Henry C. (hc, emer.) — older firm thesis + sector context
// ══════════════════════════════════════════════════════════════════════

h('seeding Henry C. (emeritus) — older sector context');

batch(TEAM.hc, 'voice', [
  { text: '"the agent infrastructure category is what dev tools was in 2013 — early but inevitable"', valence: 1 },
  { text: '"distributed inference is the right wedge — every cycle the compute layer wins"', valence: 1, meta: { company_hint: 'Helix Compute' } },
  { text: '"healthcare without distribution is dead capital — i learned this the hard way in 2015"', valence: -1 },
]);

batch(TEAM.hc, 'file', [
  { text: 'Henry\'s 2017 sector memo — "every cycle the compute layer wins, the application layer churns." Citations: AWS 2006, Snowflake 2014, Databricks 2015.', meta: { file_name: 'hc_compute_thesis_2017.md', chunk_idx: 0, chunk_total: 1 } },
]);

// ══════════════════════════════════════════════════════════════════════
// FIRM VAULT — institutional memory that doesn't belong to any one
// partner. We write these AS ME but tag them with `kind: 'note'` and
// scope context so they show up in firm-scope queries.
// (MemoryRepo always mirrors to both vaults — these will be findable
// from firm queries via the auto-mirror.)
// ══════════════════════════════════════════════════════════════════════

h('seeding firm vault — institutional memory');

batch(ME, 'note', [
  // Past pass reasons — concrete, with companies
  { text: '[firm:pass-archive] Passed on Forge AI seed 2024 — clinical data play with no reimbursement angle. Sarah\'s flag.', valence: -1 },
  { text: '[firm:pass-archive] Passed on Lattice Robotics 2023 — hardware capital intensity, projected dilution to <0.5x by Series C.', valence: -1 },
  { text: '[firm:pass-archive] Passed on Pulse Chat 2024 — consumer copilot, no defensible distribution. Same shape as Volt AI.', valence: -1, meta: { company_hint: 'Volt AI' } },
  { text: '[firm:pass-archive] Passed on Synth Health 2023 — healthcare, no clinical co-founder, distribution-via-hospital-procurement which we don\'t fund.', valence: -1 },
  { text: '[firm:pass-archive] Passed on RoboPick 2022 — warehouse autonomy, weak unit economics vs Symbotic comp set.', valence: -1, meta: { company_hint: 'Bolt Robotics' } },
  // Co-investor sentiment — how the firm views other funds
  { text: '[firm:co-investor] a16z bio — strong on healthcare, but their portfolio overlaps painfully with ours on procurement-cycle deals. Conflict-prone.' },
  { text: '[firm:co-investor] Sequoia — clean co-investor on infra plays. Same diligence bar as us. Last 4 co-invests with them returned >2x.' },
  { text: '[firm:co-investor] Founders Fund — aggressive on consumer, clashes with our pass-on-consumer rule. Avoid syndicates with them on consumer.' },
  { text: '[firm:co-investor] Greylock — co-led 3 of our last 5 infra deals (Datadog, Honeycomb, Sourcegraph). Strong alignment on technical-founder thesis.' },
  { text: '[firm:co-investor] Khosla — they led the Helix seed and they want us in the A. Long history of infra wins. Pro signal.', meta: { company_hint: 'Helix Compute' } },
  // Internal market maps
  { text: '[firm:market-map] Agent infrastructure 2026 — segments: orchestration (LangChain/LlamaIndex), runtime (Modal, Replicate, Helix), middleware (Vector Sec, Steamship), observability (Helicone, Arize).' },
  { text: '[firm:market-map] Clinical AI for primary care 2026 — segments: scribe (Abridge, Suki, Nuance, DeepScribe, Mira), reimbursement-rail (Mira leads), workflow (Notable, Augmedix).' },
  { text: '[firm:market-map] Warehouse autonomy 2026 — incumbents Symbotic, AutoStore. Challengers Bolt Robotics, GreyOrange, Locus. Capex is the gating factor.' },
  // Analyst notes feeding firm brain
  { text: '[firm:analyst-note] Marcus dug on the Acme cap table — clean, no awkward dilution. Uncommon for a $32M post.', valence: 1, meta: { company_hint: 'Acme Inc' } },
  { text: '[firm:analyst-note] Marcus comp table on agent infra — Acme ARR/employee 2x category median.', valence: 1, meta: { company_hint: 'Acme Inc' } },
  { text: '[firm:analyst-note] Marcus comp table on warehouse autonomy — Bolt at 0.7x Symbotic unit economics at same stage.', valence: -1, meta: { company_hint: 'Bolt Robotics' } },
  // Long-running firm thesis
  { text: '[firm:thesis] Compute-layer wins every cycle — AWS, Snowflake, Databricks, now agent runtime. Helix fits.', valence: 1 },
  { text: '[firm:thesis] Technical co-founder pairs out of cloud-platform companies (Stripe / Cloudflare / Datadog / Anthropic) returned 38% IRR over 14 firm deals.', valence: 1 },
  { text: '[firm:thesis] Healthcare needs reimbursement angle on day one — without it, 6 of 6 firm deals stuck at pilot stage indefinitely.', valence: -1 },
  { text: '[firm:thesis] Hardware dilution rule — projected dilution to <0.5x by Series C in 7 of 8 hardware deals 2018-2024. Hard pass without disruptive unit economics.', valence: -1 },
]);

// ══════════════════════════════════════════════════════════════════════
// FIRM VAULT — calendar / meeting history with founders
// ══════════════════════════════════════════════════════════════════════

h('seeding firm vault — calendar + meeting history');

batch(ME, 'calendar', [
  { text: '[meeting] James Chen (Acme Inc CEO) · Series A intro · Wed 2pm · 30min · Patrick Collison warm intro', meta: { company_hint: 'Acme Inc' } },
  { text: '[meeting] Anya Volkov + Raj Patel (Helix Compute) · Series A pitch · 60min · 4 of us in the room', valence: 1, meta: { company_hint: 'Helix Compute' } },
  { text: '[meeting] Mira Health founders · 30min screen · Sarah and you, partner-call follow-up', meta: { company_hint: 'Mira Health' } },
  { text: '[meeting] Maya Lin (Volt AI) · 30min screen · Marcus passed before partner call', valence: -1, meta: { company_hint: 'Volt AI' } },
  { text: '[meeting] Bolt Robotics CEO · 45min · post-meeting email: "we should pass — capital intensity"', valence: -1, meta: { company_hint: 'Bolt Robotics' } },
  { text: '[meeting] Vector Sec founder · 30min screen · Jin sat in · "interesting, too early"', meta: { company_hint: 'Vector Sec' } },
]);

// ──────────────────────────────────────────────────────────────────────
// Drain queue + verify
// ──────────────────────────────────────────────────────────────────────

async function flush(timeoutMs) {
  const max = Math.ceil(timeoutMs / 100);
  for (let i = 0; i < max; i++) {
    const s = queue.stats();
    if (s.depth === 0 && s.active === 0) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log(`  ${C.yellow}!${C.reset} flush timeout · queue: ${JSON.stringify(queue.stats())}`);
}

(async () => {
  const indexWait = hs.isMock ? 0 : 20;
  await flush(hs.isMock ? 30000 : 600000);
  ok(`wrote ${writes} memories across ${ctx.ALL_PARTNERS.length} partners`);

  if (indexWait) {
    process.stdout.write(`  ${C.dim}waiting ${indexWait}s for Hyperspell to index…${C.reset}`);
    for (let i = 0; i < indexWait; i++) { await new Promise((r) => setTimeout(r, 1000)); process.stderr.write('.'); }
    process.stderr.write('\n');
  }

  // Sanity-check queries — exercise each retrieval path used by the action handlers.
  h('verify — sanity queries');
  const checks = [
    { scope: 'partner', partner: ME,        query: 'what does You think about Acme Inc',           expectMin: 3 },
    { scope: 'partner', partner: ME,        query: 'investment thesis and skepticisms',            expectMin: 3 },
    { scope: 'partner', partner: ME,        query: 'Acme Inc pitch deck details',                  expectMin: 2 },
    { scope: 'partner', partner: TEAM.sk,   query: 'healthcare clinical co-founder reimbursement', expectMin: 2 },
    { scope: 'partner', partner: TEAM.jp,   query: 'agent infrastructure design partners ARR',     expectMin: 2 },
    { scope: 'partner', partner: TEAM.lr,   query: 'historical infra wave comps 2014-2018',        expectMin: 1 },
    { scope: 'firm',    partner: ME,        query: 'pass reasons hardware healthcare consumer',    expectMin: 3 },
    { scope: 'firm',    partner: ME,        query: 'co-investor sentiment Sequoia Khosla a16z',    expectMin: 2 },
    { scope: 'firm',    partner: ME,        query: 'agent infrastructure market map segments',     expectMin: 1 },
  ];
  for (const c of checks) {
    const hits = await hs.search({ scope: c.scope, partner: c.partner || ME, firm: FIRM, query: c.query, k: 5, halfLifeHours: 720 });
    const status = hits.length >= c.expectMin ? `${C.green}✓${C.reset}` : `${C.yellow}!${C.reset}`;
    console.log(`  ${status} ${C.bold}[${c.scope}/${(c.partner || ME).name}]${C.reset} "${c.query}" → ${hits.length} hits (expect ≥${c.expectMin})`);
    for (const h_ of hits.slice(0, 2)) dim(`     ${h_.adjusted.toFixed(2)} · ${h_.text.slice(0, 80)}`);
  }

  console.log(`\n${C.bold}${C.green}seed complete.${C.reset}`);
  console.log(`${C.dim}run an action to see the thick context show up in the artifact body:${C.reset}`);
  console.log(`${C.dim}  node -e "require('./src/actions/ic-memo').run({company: 'Acme Inc'}).then(r => console.log(JSON.stringify(r,null,2)))"${C.reset}`);
})().catch((err) => { console.error(err); process.exit(1); });
