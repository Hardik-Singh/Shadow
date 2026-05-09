export type Mode = 'VC' | 'Hedge Fund' | 'PE' | 'IB';
export type View = 'mine' | 'firm';
export type Verdict = 'invest' | 'investigate' | 'pass';
export type SourceKind = 'slack' | 'email' | 'notion' | 'calendar' | 'prior';

export const modes: Mode[] = ['VC', 'Hedge Fund', 'PE', 'IB'];

export const newOptionsByMode: Record<Mode, string[]> = {
  'VC': ['IC memo', 'Sourcing sheet', 'Founder background', 'Comp table', 'Deal card'],
  'Hedge Fund': ['Position thesis', 'Trade note', 'Risk summary', 'Earnings breakdown'],
  'PE': ['Diligence summary', 'LBO note', 'Mgmt assessment'],
  'IB': ['Pitchbook section', 'Comp table', 'Deal comps', 'Precedent transactions'],
};

/* ── teammates ────────────────────────────────────────────────────────── */

export type Teammate = {
  id: string;
  name: string;
  role: string;
  initials: string;
  hue: number; // for avatar gradient
};

export const me: Teammate = {
  id: 'me', name: 'You', role: 'Partner', initials: 'YO', hue: 270,
};

export const teammates: Teammate[] = [
  { id: 'sk', name: 'Sarah K.',  role: 'Partner',         initials: 'SK', hue: 18  },
  { id: 'jp', name: 'Jin P.',    role: 'Partner',         initials: 'JP', hue: 200 },
  { id: 'mt', name: 'Marcus T.', role: 'Analyst',         initials: 'MT', hue: 150 },
  { id: 'lr', name: 'Linda R.',  role: 'Partner (emer.)', initials: 'LR', hue: 320 },
  { id: 'hc', name: 'Henry C.',  role: 'Partner (emer.)', initials: 'HC', hue: 80  },
];

export const teammateById = (id: string): Teammate | undefined =>
  id === 'me' ? me : teammates.find((t) => t.id === id);

/* ── memory log ───────────────────────────────────────────────────────── */

export type MemoryEntry = {
  id: string;
  source: 'screen' | 'voice' | 'file';
  text: string;
  time: string;
};

export const initialMemory: MemoryEntry[] = [
  { id: 'm1', source: 'voice',  text: '"i don\'t trust this CAC number — feels too clean"',                            time: '4 min ago'  },
  { id: 'm2', source: 'screen', text: 'Acme Inc deck · team slide · 38 sec dwell',                                     time: '8 min ago'  },
  { id: 'm3', source: 'voice',  text: '"if the CTO came from Stripe i want to talk to them"',                          time: '12 min ago' },
  { id: 'm4', source: 'file',   text: 'Acme Inc Series A deck ingested · 22 pages',                                    time: '14 min ago' },
  { id: 'm5', source: 'screen', text: 'Mira Health team slide · 4 sec dwell · scrolled past',                          time: '1 hr ago'   },
  { id: 'm6', source: 'voice',  text: '"healthcare sales cycle, this is going to be a year of nothing"',               time: '1 hr ago'   },
  { id: 'm7', source: 'screen', text: 'Helix Compute · GitHub profile · 6 min dwell on commits',                       time: '2 hr ago'   },
  { id: 'm8', source: 'voice',  text: '"this founder type — i invest in this guy every time"',                         time: '2 hr ago'   },
  { id: 'm9', source: 'file',   text: 'Volt AI one-pager ingested · 3 pages',                                          time: '3 hr ago'   },
  { id: 'm10', source: 'screen', text: 'Bolt Robotics financials · 12 sec dwell · closed tab',                         time: '5 hr ago'   },
  { id: 'm11', source: 'voice',  text: '"hardware dilution risk — never works the way the deck says"',                 time: '5 hr ago'   },
];

/* ── artifacts ────────────────────────────────────────────────────────── */

export type Artifact = {
  id: string;
  company: string;
  type: string;
  mode: Mode;
  time: string;
  authorId: string;        // who generated it
  reviewerIds: string[];   // shadows that have reviewed
  verdict: Verdict;
  read: string;            // one-line shadow read
  body: string;            // expanded body shown in detail drawer
  sources: SourceKind[];
};

export const artifacts: Artifact[] = [
  {
    id: 'a1',
    company: 'Acme Inc',
    type: 'IC Memo',
    mode: 'VC',
    time: '32 min ago',
    authorId: 'me',
    reviewerIds: ['sk', 'jp'],
    verdict: 'invest',
    read: 'Lean invest. Strong technical founder, TAM defensible at category level.',
    body:
      'Acme is a B2B agent infrastructure play with $8M Series A ask. Founder James Chen is ex-Stripe (4y eng lead), 340 commits last 90 days, two prior startups (1 acq, 1 shutdown). 3 paying design partners already at $40k ARR each. TAM claim of $40B is generous at the category level (Datadog comp at $38B IPO supports it) but tight at the agent-infra niche. Push for tighter price at $32M post given stage and burn — recommend term sheet at $7M / $32M.',
    sources: ['slack', 'email', 'notion', 'calendar', 'prior'],
  },
  {
    id: 'a2',
    company: 'Mira Health',
    type: 'Sourcing Sheet',
    mode: 'VC',
    time: '1 hr ago',
    authorId: 'me',
    reviewerIds: ['jp'],
    verdict: 'pass',
    read: 'Likely pass. Clinical depth strong, but pattern-mismatch on sales cycle.',
    body:
      'Mira Health is clinical AI assistant for primary care. Founded 2022, 14 employees, 3 hospital pilots, $2.1M pre-seed (a16z bio). Competitors: Abridge, Suki, Nuance. Strong clinical depth from medical co-founder, but distribution requires hospital procurement cycles you have consistently flagged as deal-breakers (last 6 healthcare meetings → pass).',
    sources: ['email', 'notion', 'prior'],
  },
  {
    id: 'a3',
    company: 'Helix Compute',
    type: 'Founder Background',
    mode: 'VC',
    time: '2 hr ago',
    authorId: 'me',
    reviewerIds: ['sk', 'jp', 'lr'],
    verdict: 'invest',
    read: 'Strong fit. Ex-DeepMind, 3 design partners already paying.',
    body:
      'CEO Anya Volkov: ex-DeepMind research engineer (5 yrs), Oxford CS PhD, contributor to 4 major OSS inference libraries. CTO Raj Patel: ex-Anthropic infra (3 yrs), known each other 6 yrs from grad school. Distributed inference runtime — 3 design partners (Replicate, Together, an unnamed Fortune-500). Pattern matches your last 4 invests in technical co-founder pairs with clear infra moats.',
    sources: ['slack', 'notion', 'prior'],
  },
  {
    id: 'a4',
    company: 'Volt AI',
    type: 'Deal Card',
    mode: 'VC',
    time: '3 hr ago',
    authorId: 'me',
    reviewerIds: ['mt'],
    verdict: 'pass',
    read: 'Pass. Consumer copilot, no defensible moat in your read.',
    body:
      'Volt AI is a consumer productivity copilot, $3M seed ask. Solo founder, 4 months from idea, no paying users. Consumer plays score 18% on your model. No defensible distribution thesis surfaced in deck.',
    sources: ['email'],
  },
  {
    id: 'a5',
    company: 'Bolt Robotics',
    type: 'IC Memo',
    mode: 'VC',
    time: '5 hr ago',
    authorId: 'me',
    reviewerIds: ['sk'],
    verdict: 'investigate',
    read: 'Watch. Hardware dilution risk you usually flag — needs follow-up.',
    body:
      'Bolt Robotics: warehouse autonomy, $6M seed. Strong technical team but capital intensity is a concern. Your model has flagged hardware dilution risk on 7/8 prior hardware deals. Recommend a second meeting before passing.',
    sources: ['slack', 'calendar'],
  },
  {
    id: 'a6',
    company: 'Vector Sec',
    type: 'Sourcing Sheet',
    mode: 'VC',
    time: 'this morning',
    authorId: 'jp',
    reviewerIds: ['me', 'sk'],
    verdict: 'investigate',
    read: 'Investigate further. Strong infrastructure thesis match.',
    body:
      'Vector Sec is security infrastructure for AI agents. Strong technical team, infra thesis match, but early — only 2 design partners. Worth a first call. Generated by Jin\'s shadow this morning.',
    sources: ['email', 'notion', 'prior'],
  },
];

/* ── deals (firm pipeline) ────────────────────────────────────────────── */

export type DealVerdict = {
  teammateId: string;
  verdict: Verdict;
  conviction: 'low' | 'medium' | 'high';
  signals: string[];
};

export type Deal = {
  id: string;
  company: string;
  mode: Mode;
  thesis: string;
  ask: string;
  lastActivity: string;
  yourArtifactId?: string;          // links to your artifact
  verdicts: DealVerdict[];
  consensus: number;                // 0-100, % alignment
  firmVerdict?: FirmVerdictData;
};

export type FirmVerdictData = {
  call: Verdict;
  consensus: string;
  forSignals: string[];
  againstSignals: string[];
  historicalMatch?: { company: string; year: number; outcome: string };
  recommendation: string;
};

export const deals: Deal[] = [
  {
    id: 'd1',
    company: 'Acme Inc',
    mode: 'VC',
    thesis: 'B2B agent infrastructure',
    ask: '$8M Series A',
    lastActivity: '8 min ago',
    yourArtifactId: 'a1',
    consensus: 78,
    verdicts: [
      { teammateId: 'me', verdict: 'invest',     conviction: 'medium', signals: ['ex-Stripe CTO', 'design partners paying', 'TAM at category level'] },
      { teammateId: 'sk', verdict: 'invest',     conviction: 'high',   signals: ['pattern match to 2019 infra wave', 'execution risk low'] },
      { teammateId: 'jp', verdict: 'investigate',conviction: 'medium', signals: ['burn rate concern', 'price tight at this stage'] },
      { teammateId: 'lr', verdict: 'invest',     conviction: 'medium', signals: ['legacy comparable: 2014 NewRelic-stage company'] },
    ],
    firmVerdict: {
      call: 'invest',
      consensus: '3 of 4 partners lean invest, 1 wants to investigate further on burn',
      forSignals: ['Technical founder profile (4/4 partners)', 'Infrastructure thesis match', '3 design partners paying ARR'],
      againstSignals: ['Burn rate at pre-revenue scale', 'TAM tight at niche level'],
      historicalMatch: { company: 'NewRelic', year: 2014, outcome: 'invested at Series A · 8.4× return' },
      recommendation: 'Term sheet at $7M / $32M post · push for board observer · revisit burn at month 6',
    },
  },
  {
    id: 'd2',
    company: 'Mira Health',
    mode: 'VC',
    thesis: 'Clinical AI assistant',
    ask: '$5M Series A',
    lastActivity: '1 hr ago',
    yourArtifactId: 'a2',
    consensus: 42,
    verdicts: [
      { teammateId: 'me', verdict: 'pass',        conviction: 'high',   signals: ['hospital sales cycle', 'pattern match to 6 prior passes'] },
      { teammateId: 'sk', verdict: 'invest',      conviction: 'medium', signals: ['clinical co-founder is rare', 'reimbursement angle'] },
      { teammateId: 'jp', verdict: 'pass',        conviction: 'medium', signals: ['too early on distribution'] },
      { teammateId: 'mt', verdict: 'investigate', conviction: 'low',    signals: ['liked the product demo'] },
    ],
  },
  {
    id: 'd3',
    company: 'Helix Compute',
    mode: 'VC',
    thesis: 'Distributed inference runtime',
    ask: '$12M Series A',
    lastActivity: '34 min ago',
    yourArtifactId: 'a3',
    consensus: 91,
    verdicts: [
      { teammateId: 'me', verdict: 'invest', conviction: 'high', signals: ['ex-DeepMind founder', 'OSS contribution depth', 'co-founder relationship 6 yrs'] },
      { teammateId: 'sk', verdict: 'invest', conviction: 'high', signals: ['firm thesis on inference', 'team is the thesis'] },
      { teammateId: 'jp', verdict: 'invest', conviction: 'high', signals: ['paying design partners at $80k+ ARR'] },
      { teammateId: 'lr', verdict: 'invest', conviction: 'medium', signals: ['legacy precedent: 2018 infra wave winners had this profile'] },
    ],
    firmVerdict: {
      call: 'invest',
      consensus: '4 of 4 partners aligned invest, conviction high across the board',
      forSignals: ['Founder profile matches 4 of last 5 firm wins', 'Distributed inference is firm thesis', 'Design partners paying at scale'],
      againstSignals: ['Valuation could compress in current macro'],
      historicalMatch: { company: 'Datadog', year: 2014, outcome: 'led Series B · 22× return at IPO' },
      recommendation: 'Lead the round · push for board seat · firm should commit $8M of $12M',
    },
  },
  {
    id: 'd4',
    company: 'Volt AI',
    mode: 'VC',
    thesis: 'Consumer productivity copilot',
    ask: '$3M seed',
    lastActivity: '3 hr ago',
    yourArtifactId: 'a4',
    consensus: 68,
    verdicts: [
      { teammateId: 'me', verdict: 'pass', conviction: 'high', signals: ['no moat', 'consumer is not your thesis'] },
      { teammateId: 'jp', verdict: 'pass', conviction: 'medium', signals: ['solo founder', 'no paying users'] },
      { teammateId: 'mt', verdict: 'investigate', conviction: 'low', signals: ['founder is technical and hungry'] },
    ],
  },
  {
    id: 'd5',
    company: 'Vector Sec',
    mode: 'VC',
    thesis: 'Security infra for AI agents',
    ask: '$6M Series A',
    lastActivity: 'this morning',
    yourArtifactId: 'a6',
    consensus: 70,
    verdicts: [
      { teammateId: 'jp', verdict: 'invest',      conviction: 'medium', signals: ['infra thesis', 'AI security is timely'] },
      { teammateId: 'me', verdict: 'investigate', conviction: 'medium', signals: ['too early on design partners'] },
      { teammateId: 'sk', verdict: 'investigate', conviction: 'low',    signals: ['want to see how they handle the GDPR question'] },
    ],
  },
];

/* ── teammate Q&A (pre-scripted) ──────────────────────────────────────── */

export type TeammateExchange = { q: string; a: string };

export const teammateChats: Record<string, Record<string, TeammateExchange[]>> = {
  // dealId → teammateId → exchanges
  d1: {
    sk: [
      { q: 'Why are you so high conviction on Acme?',
        a: 'Same shape as the 2019 infra wave I funded — technical founder out of payments, paying design partners at meaningful ARR before Series A. I weighted execution risk low because Stripe alums historically ship. I\'d push the round at $7M and take board obs.' },
      { q: 'What kills this deal for you?',
        a: 'Two things — burn over $400k/mo with no path to GM expansion, or a co-founder split in the next 6 months. Either of those and I pass at any price.' },
    ],
    jp: [
      { q: 'Why investigate vs invest?',
        a: 'I like the team but the price is tight. They\'re burning $350k/mo against $480k ARR. I\'d want to see them at $750k ARR before a Series A — happy to put in a small SAFE now and re-evaluate in 4 months.' },
    ],
    lr: [
      { q: 'What\'s the legacy comp here?',
        a: 'NewRelic at Series A in 2014. Same shape — infrastructure layer, ex-payments founder, 3 paying customers. I led that round and we made 8.4×. Acme reads cleaner than that one did at the same stage.' },
    ],
  },
  d3: {
    sk: [
      { q: 'How big can Helix get?',
        a: 'Inference is the largest spend line in AI infra and growing fastest. Anya and Raj are the team I\'d back to win it. I think this is a $10B+ outcome if they execute.' },
    ],
    jp: [
      { q: 'What\'s the risk?',
        a: 'Hyperscalers commoditize inference at the foundation layer. But Helix is one layer up — orchestration and reliability — and the design partners are paying for that, not the raw inference. Risk is real, not deal-breaking.' },
    ],
  },
};

/* ── memory ↔ artifact citations ──────────────────────────────────────── */

export type Exchange = {
  id: string;
  question: string;
  answer: string;
  citedMemoryIds?: string[];
  time: string;
};

export const conversation: Exchange[] = [
  {
    id: 'q1',
    question: 'What would I think about a B2B agent infra play with a first-time CEO?',
    answer:
      'You\'d be skeptical of the CEO inexperience but lean toward "investigate" given the infra thesis match. You\'ve invested in 4 first-time CEOs before, all with strong technical co-founders. You\'d ask: who is the CTO and how long have they known each other?',
    citedMemoryIds: ['m3', 'm8'],
    time: '12 min ago',
  },
  {
    id: 'q2',
    question: 'Why did I pass on Mira Health so fast?',
    answer:
      'Pattern match. Last 6 healthcare deals you took meetings on ended in pass within 30 minutes. You said it explicitly today: "this is going to be a year of nothing." Distribution risk through hospital procurement is the recurring trigger.',
    citedMemoryIds: ['m5', 'm6'],
    time: '1 hr ago',
  },
  {
    id: 'q3',
    question: 'Am I being consistent with my thesis right now?',
    answer:
      'Mostly yes. Your model favors technical founders + B2B infra + post-revenue, and 4 of 6 deals you reviewed today fit that shape. The one inconsistency: you spent 12 sec on Bolt before closing the tab — but flagged it for follow-up. That\'s either lazy or intentional. Worth checking.',
    citedMemoryIds: ['m10', 'm11'],
    time: '2 hr ago',
  },
];

/* ── firm-level data ──────────────────────────────────────────────────── */

export const firmBrain = {
  contributors: 47,
  yearsCaptured: 12,
  signalsContributedToday: 4128,
  queriesToday: 312,
  topConvergingPatterns: [
    { label: 'AI infrastructure',  value: 91 },
    { label: 'Vertical SaaS',      value: 78 },
    { label: 'Climate hardware',   value: 64 },
    { label: 'Crypto consumer',    value: 22 },
  ],
};

export const firmQueryAnswer = {
  body:
    'The firm has seen 14 deals fitting this shape (B2B agent infrastructure, ex-payments technical founder, paying design partners pre-Series-A) over the past 12 years. 9 were invested in, 4 returned >5×, 1 returned >20× (Datadog, 2014, Henry C.\'s lead). The pattern: when this shape comes through, the firm has been right 64% of the time and wrong 0% of the time on the misses (the 5 passes all underperformed expectations). Recommendation: this is a high-prior shape — invest unless something specific is broken.',
  cited: [
    { who: 'Henry C.',  detail: 'Datadog Series B · 2014 · 22×' },
    { who: 'Linda R.',  detail: 'NewRelic Series A · 2014 · 8.4×' },
    { who: 'Sarah K.',  detail: 'Honeycomb Seed · 2018 · acq ~$200M' },
    { who: 'firm memo', detail: '2019 infra thesis (Q3 partner offsite)' },
  ],
};

export type FirmEvent = {
  id: string;
  who: string;
  role: string;
  initials: string;
  text: string;
  time: string;
  tag?: 'agreement' | 'disagreement' | 'flag' | 'synthesis' | 'thesis';
};

export const firmActivity: FirmEvent[] = [
  { id: 'f1', who: 'Sarah K.',    role: 'Partner',           initials: 'SK', text: 'flagged TAM pattern on Acme Inc — your shadow agrees (4/4 partners aligned).',     time: '8 min ago',  tag: 'agreement' },
  { id: 'f2', who: 'Jin P.',      role: 'Partner',           initials: 'JP', text: 'IC memo on Helix Compute is now part of firm thesis on distributed inference.',  time: '34 min ago', tag: 'thesis'    },
  { id: 'f3', who: 'Firm Brain',  role: 'synthesis',         initials: '◈',  text: 'cross-shadow synthesis: 6 partners diverge on Mira Health (2 invest, 4 pass).',  time: '1 hr ago',   tag: 'synthesis' },
  { id: 'f4', who: 'Marcus T.',   role: 'Analyst',           initials: 'MT', text: 'queried your shadow on B2B infra deals 2014–2019 (legacy partner judgment).',    time: '2 hr ago' },
  { id: 'f5', who: 'Linda R.',    role: 'Partner (emer.)',   initials: 'LR', text: 'shadow contributed to comp set on Vector Sec — 9 yrs of relevant deals surfaced.', time: '3 hr ago', tag: 'synthesis' },
  { id: 'f6', who: 'Firm Brain',  role: 'notice',            initials: '◈',  text: 'your shadow disagrees with firm consensus on Volt AI — flagged for IC review.',   time: '4 hr ago',   tag: 'disagreement' },
];

export type Notification = { id: string; text: string; time: string };

export const notifications: Notification[] = [
  { id: 'n1', text: 'Sarah\'s shadow agreed with your read on Acme Inc.',          time: '8m'  },
  { id: 'n2', text: 'Marcus queried your shadow on legacy B2B infra deals.',       time: '2h'  },
  { id: 'n3', text: 'Your shadow contributed to firm thesis on distributed infer.',time: '34m' },
];

/* ── personal model ───────────────────────────────────────────────────── */

export const model = {
  preferences: [
    { label: 'Technical founders', value: 84 },
    { label: 'B2B infrastructure', value: 73 },
    { label: 'Post-revenue',       value: 61 },
    { label: 'Developer tools',    value: 58 },
    { label: 'Marketplaces',       value: 28 },
    { label: 'Consumer plays',     value: 18 },
  ],
  alwaysFlags: [
    'unverified TAM claims',
    'short cofounder relationships (<12mo)',
    'unverifiable CAC',
    'first-time CEO + first-time CTO',
  ],
  confidence: 74,
  signalsThisWeek: 1247,
  signalsLastWeek: 1083,
  totalSignals: 8412,
  monthsCaptured: 6,
};

/* ── source labels ────────────────────────────────────────────────────── */

export const sourceLabel: Record<SourceKind, string> = {
  slack:    'Slack',
  email:    'Email',
  notion:   'Notion',
  calendar: 'Calendar',
  prior:    'Prior deals',
};
