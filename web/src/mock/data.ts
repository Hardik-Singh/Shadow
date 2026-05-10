export type Mode = 'VC' | 'Hedge Fund' | 'PE' | 'IB';
export type View = 'mine' | 'firm';
export type Verdict = 'invest' | 'investigate' | 'pass';
export type SourceKind = 'slack' | 'email' | 'notion' | 'calendar' | 'prior' | 'nia';

export type Citation = {
  id?: string;
  kind: 'web' | 'github' | 'doc';
  url: string;
  title: string;
  summary?: string;
};

export type ArtifactRelation = {
  type: 'company' | 'deal' | 'person' | 'teammate' | 'artifact-kind';
  id: string;
  label: string;
  source?: 'inferred' | 'author' | 'reviewer' | string;
};

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
  { id: 'm12', source: 'voice',  text: '"infra is the only place i actually understand the moat"',                     time: '6 hr ago'   },
  { id: 'm13', source: 'screen', text: 'LinkedIn search "ex-Stripe infra" · 4 sessions this week',                     time: '1 day ago'  },
  { id: 'm14', source: 'voice',  text: '"if they\'ve worked together 4+ years i don\'t worry about cofounder split"',  time: '1 day ago'  },
  { id: 'm15', source: 'voice',  text: '"two founders who met at YC last quarter — that\'s a hard pass"',              time: '1 day ago'  },
  { id: 'm16', source: 'voice',  text: '"paying design partners > LOIs every time"',                                   time: '2 days ago' },
  { id: 'm17', source: 'screen', text: 'Stripe alumni deck · burn-vs-milestone table · 3 min dwell',                   time: '2 days ago' },
  { id: 'm18', source: 'voice',  text: '"if your CTO can\'t tell me cost-per-token off the top of their head, i\'m out"', time: '3 days ago' },
  { id: 'm19', source: 'file',   text: 'Annotated 2017 Snowflake memo · 14 highlights · re-opened twice',              time: '3 days ago' },
  { id: 'm20', source: 'voice',  text: '"another consumer copilot — i don\'t see the wedge"',                          time: '4 days ago' },
  { id: 'm21', source: 'screen', text: 'Pre-Series-A ARR filter set to ≥ $250k · saved view',                          time: '4 days ago' },
  { id: 'm22', source: 'voice',  text: '"hospital procurement is a year of nothing, i keep saying it"',                time: '5 days ago' },
  { id: 'm23', source: 'screen', text: '3-year burn model · 22 min dwell · scrolled milestone column 6×',              time: '6 days ago' },
  { id: 'm24', source: 'voice',  text: '"write it lowercase, direct, no formalities — end with the point"',             time: '1 wk ago'   },
  { id: 'm25', source: 'file',   text: 'edited founder email: removed "hope you are well", cut 42%, added one clear ask', time: '1 wk ago'   },
];

/* ── how-shadow-sees-you: highlightable segments ──────────────────────── */

export type SummarySegment = {
  id: string;
  /** exact substring inside model.summaryParagraph (must match once) */
  quote: string;
  /** plain-language restatement of what Shadow believes about you */
  claim: string;
  /** memory ids that justify this claim */
  memoryIds: string[];
  /** confidence 0–100 */
  confidence: number;
};

export const summarySegments: SummarySegment[] = [
  {
    id: 's1',
    quote: 'technical founders shipping B2B infrastructure',
    claim: 'You consistently invest in technical founders building B2B infra.',
    memoryIds: ['m3', 'm7', 'm8', 'm12', 'm13'],
    confidence: 92,
  },
  {
    id: 's2',
    quote: 'eng leads at Stripe, Anthropic, or DeepMind',
    claim: 'A few specific alumni networks meaningfully raise your interest.',
    memoryIds: ['m3', 'm7', 'm13', 'm17'],
    confidence: 81,
  },
  {
    id: 's3',
    quote: 'team has shipped together for 4+ years',
    claim: 'Long-tenure cofounder relationships materially de-risk a deal for you.',
    memoryIds: ['m14', 'm15'],
    confidence: 86,
  },
  {
    id: 's4',
    quote: 'cofounders met last quarter',
    claim: 'New cofounder relationships are a near-automatic concern.',
    memoryIds: ['m15'],
    confidence: 78,
  },
  {
    id: 's5',
    quote: 'distrust slide-heavy decks and clean CAC numbers',
    claim: 'You read polish as a warning sign more than a signal.',
    memoryIds: ['m1', 'm2'],
    confidence: 72,
  },
  {
    id: 's6',
    quote: 'paying design partners and a 3-year burn plan that maps to milestones',
    claim: 'You weight commercial proof and disciplined burn over narrative.',
    memoryIds: ['m16', 'm17', 'm23'],
    confidence: 84,
  },
  {
    id: 's7',
    quote: 'pass on hospital-procurement healthcare almost reflexively',
    claim: 'Hospital-sale healthcare is functionally a no.',
    memoryIds: ['m5', 'm6', 'm22'],
    confidence: 90,
  },
  {
    id: 's8',
    quote: 'cool quickly on consumer copilots',
    claim: 'Consumer copilots lose your attention fast.',
    memoryIds: ['m20'],
    confidence: 65,
  },
  {
    id: 's9',
    quote: '2014–2019 infra wave as your reference shape',
    claim: 'You benchmark new deals against the last infra cycle.',
    memoryIds: ['m12', 'm19'],
    confidence: 70,
  },
  {
    id: 's10',
    quote: 'pre-Series-A ARR above $250k from real customers',
    claim: 'A specific ARR floor is becoming a hard filter.',
    memoryIds: ['m16', 'm21'],
    confidence: 76,
  },
  {
    id: 's11',
    quote: 'CTO who can answer the inference-cost question without checking notes',
    claim: 'Cost-per-token fluency is your favorite live test for technical depth.',
    memoryIds: ['m18'],
    confidence: 68,
  },
  {
    id: 's12',
    quote: 'Your communication style is all lowercase, direct, and straight to the point',
    claim: 'Generated emails should sound like you: lowercase, short, no formalities, clear ask at the end.',
    memoryIds: ['m24', 'm25'],
    confidence: 88,
  },
];

/* ── artifacts ────────────────────────────────────────────────────────── */

export type Status = 'final' | 'generating' | 'related';

export type EmailMessage = {
  from: string;
  to?: string;
  time: string;
  body: string;
};

export type SlackMessage = {
  who: string;
  initials: string;
  hue: number;
  time: string;
  text: string;
  reactions?: string[];
};

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
  status?: Status;         // tag — final by default
  bodyKind?: 'text' | 'email' | 'slack' | 'html';
  email?: { subject: string; messages: EmailMessage[] };
  slack?: { channel: string; messages: SlackMessage[] };
  // Real artifacts produced by the Electron action handlers carry these:
  citations?: Citation[];
  flags?: string[];
  relations?: ArtifactRelation[];
  raw?: { hyperspell_total?: number; nia_total?: number; [key: string]: unknown };
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
  {
    id: 'a7',
    company: 'Acme Inc',
    type: 'Founder Background',
    mode: 'VC',
    time: '45 min ago',
    authorId: 'sk',
    reviewerIds: ['me'],
    verdict: 'invest',
    read: 'James Chen profile matches 4 of last 5 firm wins on technical-founder thesis.',
    body:
      'Sarah\'s shadow pulled the founder pattern: ex-Stripe (4y eng lead), 340 GitHub commits last 90 days, 2 prior startups (1 acq, 1 shutdown). Cross-references against Sarah\'s 2019 infra wave thesis: NewRelic, Datadog, Honeycomb founders all had this exact shape.',
    sources: ['notion', 'prior'],
  },
  {
    id: 'a8',
    company: 'Acme Inc',
    type: 'Comp Table',
    mode: 'VC',
    time: '1 hr ago',
    authorId: 'lr',
    reviewerIds: ['me', 'sk'],
    verdict: 'investigate',
    read: 'TAM defensible at category level — 3 comparable exits in firm history.',
    body:
      'Linda\'s shadow surfaced the historical comp set: Datadog Series B 2014 (22× at IPO), NewRelic Series A 2014 (8.4× exit), Honeycomb Seed 2018 (~$200M acq). Acme reads cleaner than NewRelic at the same stage.',
    sources: ['prior'],
  },
  {
    id: 'a9',
    company: 'Mira Health',
    type: 'IC Memo',
    mode: 'VC',
    time: '2 hr ago',
    authorId: 'sk',
    reviewerIds: ['jp'],
    verdict: 'invest',
    read: 'Clinical co-founder is rare; reimbursement angle worth a deeper look.',
    body:
      'Sarah\'s read diverges from yours: she\'s seen 3 healthcare deals in last 18 months where clinical co-founder + reimbursement angle compounded into 4×+ outcomes. Wants the meeting before passing.',
    sources: ['email', 'notion'],
  },
  {
    id: 'a10',
    company: 'Helix Compute',
    type: 'IC Memo',
    mode: 'VC',
    time: '50 min ago',
    authorId: 'jp',
    reviewerIds: ['me', 'sk', 'lr'],
    verdict: 'invest',
    read: 'Lead the round. Design partners at $80k+ ARR before Series A is rare.',
    body:
      'Jin\'s read: Replicate and Together are paying $80k+ ARR each, plus an unnamed F500. That ARR shape pre-Series-A is the strongest signal Jin has seen this year. Recommends firm leads.',
    sources: ['slack', 'email', 'notion', 'prior'],
  },
  {
    id: 'a11',
    company: 'Acme Inc',
    type: 'Email Thread',
    mode: 'VC',
    time: '20 min ago',
    authorId: 'me',
    reviewerIds: ['sk'],
    verdict: 'investigate',
    read: 'Warm intro thread from Patrick Collison · 3 replies · Acme founder loops in CTO.',
    body: '',
    sources: ['email'],
    bodyKind: 'email',
    email: {
      subject: 'Series A intro — Acme Inc',
      messages: [
        {
          from: 'Patrick Collison <patrick@stripe.com>',
          to: 'you@firm.vc',
          time: 'Mon, 9:42 AM',
          body:
            'Wanted to put you in touch with James Chen at Acme — he was eng lead on the connect team for 4 years and is now building agent infra. Pulling him in. He has a deck ready.',
        },
        {
          from: 'James Chen <james@acme.dev>',
          time: 'Mon, 10:08 AM',
          body:
            'Thanks Patrick. Deck attached. We have 3 paying design partners ($40k ARR each) and are raising $8M Series A. Happy to walk through whenever works.',
        },
        {
          from: 'you@firm.vc',
          time: 'Mon, 10:31 AM',
          body:
            'James — looks compelling. Free Wed afternoon for a 30-min call? Want to dig into the design partner pipeline and the inference cost model.',
        },
      ],
    },
  },
  {
    id: 'a12',
    company: 'Helix Compute',
    type: 'Slack Thread',
    mode: 'VC',
    time: '1 hr ago',
    authorId: 'jp',
    reviewerIds: ['me', 'sk', 'lr'],
    verdict: 'invest',
    read: 'Sarah and Jin aligned · firm should lead · Linda surfaces 2018 precedent.',
    body: '',
    sources: ['slack'],
    bodyKind: 'slack',
    slack: {
      channel: '#deals-infra',
      messages: [
        {
          who: 'Jin P.', initials: 'JP', hue: 200, time: '10:42 AM',
          text: 'shadow synthesis on Helix just landed. design partners paying $80k+ ARR pre-Series-A. this is the cleanest founder profile we\'ve seen this year.',
        },
        {
          who: 'Sarah K.', initials: 'SK', hue: 18, time: '10:44 AM',
          text: 'agreed. matches my 2019 infra wave thesis exactly. team is the thesis here.',
          reactions: ['🔥', '+1'],
        },
        {
          who: 'Linda R.', initials: 'LR', hue: 320, time: '10:51 AM',
          text: 'historical comp from my shadow: 2018 inference wave winners (Modal, Banana early days) had this exact profile. firm got into Modal at 8x our pre.',
        },
        {
          who: 'You', initials: 'YO', hue: 270, time: '10:54 AM',
          text: 'lining up the IC memo now. proposing we lead at $8M of $12M, board seat.',
          reactions: ['👀', '+1', '+1', '+1'],
        },
      ],
    },
  },
  {
    id: 'a13',
    company: 'Mira Health',
    type: 'Email Thread',
    mode: 'VC',
    time: '2 hr ago',
    authorId: 'sk',
    reviewerIds: ['me', 'jp'],
    verdict: 'investigate',
    read: 'Founder pitch follow-up · Sarah pushing for first meeting before pass.',
    body: '',
    sources: ['email'],
    bodyKind: 'email',
    email: {
      subject: 'Mira Health — would love 30 min',
      messages: [
        {
          from: 'Dr. Aisha Rao <aisha@mirahealth.io>',
          to: 'sarah@firm.vc',
          time: 'Sun, 6:14 PM',
          body:
            'Sarah — really enjoyed our conversation at the AAFP conference. Mira just closed pilots with 3 hospital systems and we\'re raising a $5M Series A. Would love 30 min before we go broader.',
        },
        {
          from: 'Sarah K. <sarah@firm.vc>',
          time: 'Mon, 8:02 AM',
          body:
            'Aisha — happy to. Looping in our partner who covers healthcare. Send the deck and a few times this week.',
        },
      ],
    },
  },
  {
    id: 'a14',
    company: 'Acme Inc',
    type: 'Sourcing Sheet',
    mode: 'VC',
    time: '1 hr ago',
    authorId: 'sk',
    reviewerIds: ['me'],
    verdict: 'invest',
    read: 'Sarah\'s sheet · team / market / paying design partners / 3-yr forecast.',
    body:
      'Sarah\'s shadow built a parallel sourcing sheet on Acme covering team, market, design partners, and a 3-year revenue forecast. Aligned with your read on the founder; diverges on the price — Sarah thinks the round can clear at $40M post.',
    sources: ['notion', 'prior'],
  },
  {
    id: 'a15',
    company: 'Helix Compute',
    type: 'Sourcing Sheet',
    mode: 'VC',
    time: '40 min ago',
    authorId: 'lr',
    reviewerIds: ['me', 'sk'],
    verdict: 'invest',
    read: 'Linda\'s sheet · 2018 inference-wave precedents · Modal comp · Banana comp.',
    body:
      'Linda\'s historical sheet pulls every distributed-inference deal the firm saw 2017-2021, side-by-side with Helix on team, ARR shape, and design partners. Helix reads stronger than Modal at the same stage.',
    sources: ['prior', 'notion'],
  },
  {
    id: 'a16',
    company: 'Mira Health',
    type: 'Founder Background',
    mode: 'VC',
    time: '3 hr ago',
    authorId: 'mt',
    reviewerIds: ['sk'],
    verdict: 'investigate',
    read: 'Co-founder pair · clinical depth · 8 yrs working together at Kaiser.',
    body:
      'CEO Dr. Aisha Rao: ex-Kaiser internal medicine (8 yrs), board-certified. CTO Mark Levin: ex-Epic (5 yrs) + Olive AI (2 yrs). Worked together on a Kaiser internal pilot that became the foundation for Mira. Strong relationship, real domain depth.',
    sources: ['notion', 'prior'],
  },
  {
    id: 'a17',
    company: 'Vector Sec',
    type: 'Founder Background',
    mode: 'VC',
    time: '2 hr ago',
    authorId: 'sk',
    reviewerIds: ['me', 'jp'],
    verdict: 'investigate',
    read: 'CEO from CrowdStrike · CTO ex-OpenAI safety team.',
    body:
      'CEO Priya Shah: 6 yrs at CrowdStrike on the threat-intel side, then 2 yrs at Anthropic on enterprise. CTO Alex Tran: ex-OpenAI safety team (3 yrs). Solid pedigree on both axes. The question is distribution — they don\'t have a clear go-to-market yet.',
    sources: ['prior'],
  },
  {
    id: 'a18',
    company: 'Vector Sec',
    type: 'Comp Table',
    mode: 'VC',
    time: '1 hr ago',
    authorId: 'jp',
    reviewerIds: ['me'],
    verdict: 'investigate',
    read: 'AI security comps · Lakera · Robust Intelligence · Protect AI — all early.',
    body:
      'Public comps for AI security infra: Lakera (Series A $20M), Robust Intelligence (Series B $30M), Protect AI (Series A $35M). All early, all pre-revenue scale. Vector\'s ask is on the lower end which is good, but the category is unproven.',
    sources: ['prior', 'notion'],
  },
  {
    id: 'a19',
    company: 'Bolt Robotics',
    type: 'Founder Background',
    mode: 'VC',
    time: '4 hr ago',
    authorId: 'sk',
    reviewerIds: ['me'],
    verdict: 'investigate',
    read: 'Hardware-experienced team · ex-Boston Dynamics · realistic about capital intensity.',
    body:
      'CEO Maya Choudhary: 7 yrs at Boston Dynamics on the manipulation team. CTO Kenji Wright: ex-Cruise (4 yrs). They explicitly call out hardware capital intensity in the deck and have a phased burn plan that maps to milestones — that\'s rare and good.',
    sources: ['notion', 'prior'],
  },
  {
    id: 'a20',
    company: 'Volt AI',
    type: 'Sourcing Sheet',
    mode: 'VC',
    time: '3 hr ago',
    authorId: 'mt',
    reviewerIds: ['me'],
    verdict: 'investigate',
    read: 'Marcus\'s sheet · solo founder · 4 mo from idea · 0 paying users · ambitious.',
    body:
      'Marcus surfaced this one. Solo technical founder, ex-Stripe (2 yrs), shipping fast — but no paying customers, no design partners, and consumer copilot is a crowded space. Marcus\'s read: "founder is real, idea is wrong." Worth tracking for what they build next.',
    sources: ['email', 'prior'],
  },

  /* ── Nozomio (live demo case) ─────────────────────────────────────── */
  {
    id: 'n4',
    company: 'Nozomio',
    type: 'Founder Background',
    mode: 'VC',
    time: 'just now',
    authorId: 'me',
    reviewerIds: ['jp', 'sk'],
    verdict: 'invest',
    read: 'Arlan: Cobra researcher → solo founder. Four years on the same problem.',
    body:
      'Arlan Rakhmetzhanov. 18. Solo founder. Kazakhstan immigrant. Dropped out of 11th grade after taking investor calls during school hours got him sent to the principal\'s office.\n\nThe lineage: at 15 he shipped his first startup, hit 20k users. Cold-emailed his way into Stanford research, worked closely with a Caltech professor on *Cobra*, an interactive static-analysis tool for identifying defects and suspicious patterns in source code. Nia — Nozomio\'s product — is the commercial generalization of that work. Same primitive (structured indexing of code), broader surface (any context, served live to AI agents).\n\nFootprint: GitHub @arlanrakh, personal site arlanrakh.com, recent YouTube interview on the round. Forbes 30u30. Press in TechCrunch and Yahoo Finance\'s 8-pitch-deck roundup. Backers include Paul Graham (re-up) and Thomas Wolf (HuggingFace).\n\nProfile-fit on your model: matches your "young technical founder, ships, conviction-driven" archetype that has produced 3 of your last 5 invests. Diverges from the firm\'s usual pattern (older, repeat founder, prior infra exit) — which is where the partner disagreement will come from.',
    sources: ['notion', 'prior'],
  },
  {
    id: 'n5',
    company: 'Nozomio',
    type: 'Slack Thread',
    mode: 'VC',
    time: '2 weeks ago',
    authorId: 'mt',
    reviewerIds: ['me', 'jp'],
    verdict: 'investigate',
    read: 'Marcus dropped the YC link 2 weeks ago · started a sourcing sheet · no partner pickup yet.',
    body: '',
    sources: ['slack'],
    bodyKind: 'slack',
    slack: {
      channel: '#sourcing',
      messages: [
        {
          who: 'Marcus T.', initials: 'MT', hue: 150, time: '2 wks ago',
          text: 'YC S25 batch dropped — flagging Nozomio. founder is 18, solo, ex-Stanford research, building context infra for coding agents. starting a sourcing sheet.',
        },
        {
          who: 'Jin P.', initials: 'JP', hue: 200, time: '2 wks ago',
          text: 'noted. context layer is the right wedge. ping me when you have the sheet, want to read.',
          reactions: ['+1'],
        },
        {
          who: 'Marcus T.', initials: 'MT', hue: 150, time: '2 wks ago',
          text: 'sheet up. didn\'t fill in firm cross-refs or verdict — wanted a partner to take it from here.',
        },
      ],
    },
  },
  {
    id: 'n6',
    company: 'Nozomio',
    type: 'Sourcing Sheet',
    mode: 'VC',
    time: 'just now',
    authorId: 'me',
    reviewerIds: [],
    verdict: 'investigate',
    read: 'live source sheet · linkedin-triggered · Nia searched public web, company data, social, code, press, and firm memory.',
    bodyKind: 'html',
    body:
      '<div style="display:grid;gap:14px">' +
      '<section style="border:1px solid hsl(var(--border));border-radius:10px;padding:14px;background:hsl(var(--card))">' +
      '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:hsl(var(--muted-foreground));font-weight:700">source sheet · generated from linkedin profile</div>' +
      '<h2 style="margin:8px 0 6px;font-size:18px;line-height:1.2">Nozomio · Arlan Rakhmetzhanov</h2>' +
      '<p style="margin:0;color:hsl(var(--muted-foreground))">angle: technical depth · comp set: pinecone / modal / replit · generated after viewing Arlan on LinkedIn.</p>' +
      '</section>' +
      '<section style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="font-weight:700">company</div><p>Nozomio · YC S25 · SF · ~3 employees · founded 2025. Nia gives AI coding agents live context from docs, papers, datasets, and private repos.</p></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="font-weight:700">round</div><p>$6.2M seed · CRV led · BoxGroup, LocalGlobe, Paul Graham, Thomas Wolf and angels.</p></div>' +
      '</section>' +
      '<h2>source graph</h2>' +
      '<div style="display:grid;gap:10px">' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="display:flex;gap:8px;align-items:center"><span style="width:28px;height:28px;border-radius:7px;display:grid;place-items:center;background:#0a66c2;color:white;font-weight:800">in</span><strong>LinkedIn</strong></div><p>Arlan profile, current Nozomio role, Stanford AI lab overlap, one-hop paths through Sarah Chen.</p><code>arlan rakhmetzhanov linkedin nozomio stanford cobra</code></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="display:flex;gap:8px;align-items:center"><span style="width:28px;height:28px;border-radius:7px;display:grid;place-items:center;background:#111;color:white;font-weight:800">X</span><strong>X / social</strong></div><p>Launch thread, follower spike, developer replies asking for private-repo indexing and fresh-doc context.</p><code>nozomio nia launch private repos agent context</code></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="display:flex;gap:8px;align-items:center"><span style="width:28px;height:28px;border-radius:7px;display:grid;place-items:center;background:#146aff;color:white;font-weight:800">CB</span><strong>Crunchbase</strong></div><p>co-investors: <strong>CRV</strong> lead $4M · <strong>BoxGroup</strong> $750k · <strong>LocalGlobe</strong> $750k · angels: Paul Graham, Thomas Wolf, Sam Altman SAFE. <em style="opacity:.65">(modeled — round detail not all public)</em></p><code>nozomio seed crv boxgroup localglobe paul graham thomas wolf altman</code></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="display:flex;gap:8px;align-items:center"><span style="width:28px;height:28px;border-radius:7px;display:grid;place-items:center;background:#24292f;color:white;font-weight:800">GH</span><strong>GitHub</strong></div><p>repos: <code>@arlanrakh/cobra-static</code>, <code>@arlanrakh/nia-context</code>, <code>@arlanrakh/agent-ctx-bench</code>. 47 commits last 30 days, 4 of which are weekend pushes — solo cadence.</p><code>arlanrakh github cobra-static nia-context agent-ctx-bench</code></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="display:flex;gap:8px;align-items:center"><span style="width:28px;height:28px;border-radius:7px;display:grid;place-items:center;background:#d9892f;color:white;font-weight:800">N</span><strong>Nozomio docs / site</strong></div><p>Nia positioned as context infrastructure, not a coding assistant. Source types: docs, papers, datasets, private repos.</p><code>nozomio nia api docs papers datasets private repos</code></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="display:flex;gap:8px;align-items:center"><span style="width:28px;height:28px;border-radius:7px;display:grid;place-items:center;background:#6b7280;color:white;font-weight:800">FM</span><strong>firm memory</strong></div><p>Pinecone March visit, Modal Feb visit, Replit buyer note. Same context-layer wedge, earlier and more founder-driven.</p><code>firm memory pinecone modal replit context layer devtools</code></div>' +
      '</div>' +
      '<h2>synthesis</h2>' +
      '<ul><li>founder signal is real: Cobra to Nia is a coherent technical line, not a pitch story.</li><li>round signal is loud: CRV, PG, and Wolf make price the key risk.</li><li>distribution shape matches bottom-up dev infra, especially Pinecone and Modal memories.</li><li>network paths: Sarah Chen for Stanford diligence, Marcus Liu for Cobra/founder-risk calibration.</li></ul>' +
      '<h2>prior customer echoes</h2>' +
      '<blockquote>Pinecone customer call, 2024: "the database mattered once the model needed live company context, not toy data."</blockquote>' +
      '<blockquote>Modal user interview, 2025: "we picked the tool that let our agents reach fresh compute and code without ceremony."</blockquote>' +
      '<blockquote>Replit buyer note, 2023: "developers adopt infra when it removes setup from the loop. anything else is sales theater."</blockquote>' +
      '<h3>comparison vs prior firm deals</h3>' +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="font-weight:700">Pinecone</div><div style="color:hsl(var(--muted-foreground));font-size:12.5px">traction: 200+ paying teams at the time<br/>founder: repeat, prior infra exit<br/>wedge: vector db for retrieval<br/>our take: passed mar 2024 — wedge unclear at the time, in retrospect we underweighted bottoms-up dev-tools</div></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="font-weight:700">Modal</div><div style="color:hsl(var(--muted-foreground));font-size:12.5px">traction: serverless gpu wedge<br/>founder: erikbern, repeat<br/>wedge: gpu infra for ml<br/>our take: passed late, still watching</div></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="font-weight:700">Replit</div><div style="color:hsl(var(--muted-foreground));font-size:12.5px">traction: huge user base, weak monetization<br/>founder: amjad, very known<br/>wedge: in-browser ide<br/>our take: early conversation that went cold on price</div></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="font-weight:700">Cursor</div><div style="color:hsl(var(--muted-foreground));font-size:12.5px">traction: viral dev adoption<br/>founder: technical, young<br/>wedge: assistant ux on top of llms<br/>our take: passed at seed, would do differently now</div></div>' +
      '</div>' +
      '<h3>recent posts</h3>' +
      '<div style="display:grid;gap:10px">' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="font-weight:700">X · launch thread "introducing nia · context for coding agents"</div><div style="color:hsl(var(--muted-foreground));font-size:12.5px">3 days ago — wedge is private repo + fresh docs, not assistant ux.</div></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="font-weight:700">YouTube · interview on the round</div><div style="color:hsl(var(--muted-foreground));font-size:12.5px">1 week ago — cobra → nia framing is rehearsed and crisp.</div></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="font-weight:700">Hacker News · top comment by founder</div><div style="color:hsl(var(--muted-foreground));font-size:12.5px">2 weeks ago — fresh-context-for-agents thread; competing claims call out cursor + pinecone limits.</div></div>' +
      '<div style="border:1px solid hsl(var(--border));border-radius:10px;padding:12px"><div style="font-weight:700">Personal blog · "context windows vs context retrieval"</div><div style="color:hsl(var(--muted-foreground));font-size:12.5px">3 weeks ago — this is the thesis post, not marketing.</div></div>' +
      '</div>' +
      '<h3>synthesis</h3>' +
      '<p>arlan has been on this single thread for four years. cobra → nia is one continuous research line, and CRV re-upping after seeing the commercial generalization is the loudest signal in the file. the dev-tool wedge — fresh context for coding agents, including private repos — sits exactly where our pinecone/modal pattern said the next layer would form. the disagreement won\'t be on whether the work is real, it will be on solo-founder load and price.</p>' +
      '</div>',
    sources: ['nia', 'notion', 'prior'],
  },
  {
    id: 'n7',
    company: 'Nozomio',
    type: 'Investment Memo',
    mode: 'VC',
    time: 'just now',
    authorId: 'me',
    reviewerIds: ['jp', 'sk', 'mt', 'lr', 'hc'],
    verdict: 'invest',
    read: 'invest · $2m · cobra→nia is real conviction · references pinecone + modal.',
    body:
      'investment memo · nozomio · arlan rakhmetzhanov\n\n' +
      'why now\n' +
      'context layer for ai coding agents is the next infra fight. foundation models are commoditizing — what compounds is what the agent can reach: live code, private docs, structured datasets. nia ships an api the consuming side already wants (cursor-style, claude-style, in-house rag stacks).\n\n' +
      'source synthesis\n' +
      '- linkedin: arlan profile + stanford research overlap\n' +
      '- crunchbase: yc s25, seed round, investor graph, headcount range\n' +
      '- x: launch thread, dev replies, follower spike after nia announcement\n' +
      '- github: @arlanrakh commit cadence, cobra lineage, python/typescript/rust mix\n' +
      '- company docs: nia indexes docs, papers, datasets, private repos for agents\n' +
      '- youtube / press: founder interview, techcrunch, yahoo finance, startupsunion, digitrendz\n' +
      '- firm memory: pinecone march visit, modal feb visit, replit dev-tools notes\n\n' +
      'comp set\n' +
      '- pinecone (march visit) — same context-layer wedge, but nozomio is earlier and the founder is more technical\n' +
      '- modal (feb visit) — same bottom-up dev distribution shape\n' +
      'both pattern-match. nozomio is the earlier, sharper version.\n\n' +
      'prior-customer echoes\n' +
      '- pinecone customer call, 2024: "the database mattered once the model needed live company context, not toy data."\n' +
      '- modal user interview, 2025: "we picked the tool that let our agents reach fresh compute and code without ceremony."\n' +
      '- replit buyer note, 2023: "developers adopt infra when it removes setup from the loop. anything else is sales theater."\n\n' +
      'why arlan\n' +
      '- four years on the same problem. cobra (stanford research, static analysis) → nia (commercial generalization, live agent context). same primitive, broader surface. not a pivot — a thesis he\'s refined since 16.\n' +
      '- shipped a 20k-user product at 15. github @arlanrakh shows steady output. this is a builder.\n' +
      '- pg + thomas wolf re-upping isn\'t hype. it\'s the people closest to dev-tool distribution betting on him.\n\n' +
      'what i like (pulled straight from how i invest)\n' +
      '- young technical founder who ships — my archetype, 3 of last 5 invests fit it\n' +
      '- conviction lineage: 4 years on one problem is the strongest founder-fit signal in the file\n' +
      '- dev-infra wedge timing — every coding agent stack needs this primitive\n' +
      '- bottom-up api distribution — how this category gets won\n\n' +
      'what gives me pause (also from how i invest)\n' +
      '- solo founder. i tolerate it when they\'re shipping (he is) but track whether he adds a technical co-founder in 6 months.\n' +
      '- round is hot. top of what i typically pay for unproven gtm. mitigant: ownership target 1.5–2%, not stretching for more.\n' +
      '- no gtm signal yet. standard for stage. watch for net new agent-stack integrations month over month.\n\n' +
      'verdict\n' +
      '- recommendation: invest\n' +
      '- conviction: high\n' +
      '- suggested check: $2m\n' +
      '- ownership target: 1.5–2%\n' +
      '- re-rate: month 9 on co-founder addition + integration count\n\n' +
      'pulled from: source sheet (n6) · marcus\'s starter sheet (n1) · founder background (n4).',
    sources: ['notion', 'prior'],
  },
  {
    id: 'n8',
    company: 'Nozomio',
    type: 'Pass Email',
    mode: 'VC',
    time: 'just now',
    authorId: 'me',
    reviewerIds: [],
    verdict: 'pass',
    read: 'pass / follow-up email to arlan · lowercase, direct, no formalities.',
    body: '',
    sources: ['email'],
    bodyKind: 'email',
    email: {
      subject: 'nozomio — quick follow-up',
      messages: [
        {
          from: 'you',
          to: 'arlan@nozom.io',
          time: 'just now',
          body:
            'arlan — i dug into nozomio and the cobra → nia line is real. strongest part of the story by far.\n\n' +
            'i am going to pass on this round as priced. too much of the risk is still around solo-founder load + no gtm proof, and the crv / pg / wolf signal is already doing a lot of work in the price.\n\n' +
            'what would change my mind: 3 commercial integrations or a technical co-founder who can own part of the platform. if either happens, i want the first look.\n\n' +
            'keep me posted on the next 60 days. especially usage, paid integrations, and what parts of cobra actually survive inside nia.\n\n' +
            'h.',
        },
      ],
    },
  },
  {
    id: 'n10',
    company: 'Nozomio',
    type: 'Meeting Prep',
    mode: 'VC',
    time: 'just now',
    authorId: 'me',
    reviewerIds: [],
    verdict: 'investigate',
    read: 'meeting prep · 20-min founder call plan · questions pulled from linkedin, deck, source sheet, and firm memory.',
    body:
      'meeting prep · nozomio / arlan\n\n' +
      'goal\n' +
      '- decide whether this is an exception to the firm pattern on solo young founders.\n' +
      '- test whether cobra → nia is durable technical edge or just a good origin story.\n\n' +
      'first 5 min — founder lineage\n' +
      '- walk me through cobra → nia. what code, architecture, or indexing primitive survived?\n' +
      '- what did the stanford / caltech work teach you that a normal rag founder would miss?\n\n' +
      'middle 10 min — product + demand\n' +
      '- which sources are actually indexed today: docs, papers, datasets, private repos, issues, slack, linear?\n' +
      '- who is using it in production, and what breaks when nia is removed?\n' +
      '- what is the sharpest developer quote from the last 10 users?\n\n' +
      'last 5 min — round + risk\n' +
      '- what is still open after crv, boxgroup, localglobe, pg, and thomas wolf?\n' +
      '- are you hiring a technical co-founder or senior infra lead? if not, why not?\n' +
      '- what metric makes this obviously working in 60 days?\n\n' +
      'firm-memory prompts\n' +
      '- pinecone customer call, 2024: "the database mattered once the model needed live company context, not toy data."\n' +
      '- modal user interview, 2025: "we picked the tool that let our agents reach fresh compute and code without ceremony."\n' +
      '- replit buyer note, 2023: "developers adopt infra when it removes setup from the loop. anything else is sales theater."\n\n' +
      'send style\n' +
      '- lowercase. direct. no formalities. one ask at the end.',
    sources: ['notion', 'prior', 'nia'],
  },
  {
    id: 'n11',
    company: 'Nozomio',
    type: 'Network Map',
    mode: 'VC',
    time: 'just now',
    authorId: 'me',
    reviewerIds: [],
    verdict: 'investigate',
    read: 'arlan network paths · 2 warm routes surfaced from linkedin + firm memory.',
    body:
      'arlan rakhmetzhanov · network paths\n\n' +
      '1. sarah chen\n' +
      '- path: you → sarah chen → arlan\n' +
      '- source: linkedin overlap + firm memory\n' +
      '- why useful: overlapped with arlan at the stanford ai lab and can speak to how much of cobra was arlan actually shipping vs. research scaffolding.\n' +
      '- ask: "can you sanity-check arlan\'s technical depth and whether cobra → nia is a real line?"\n\n' +
      '2. marcus liu\n' +
      '- path: you → marcus liu → arlan\n' +
      '- source: angel graph + prior cobra note\n' +
      '- why useful: angel in cobra, knows arlan\'s technical chops firsthand, likely has the cleanest read on founder maturity.\n' +
      '- ask: "would you back him again at this price, and what has to be true in 60 days?"\n\n' +
      'shadow read\n' +
      '- use sarah for technical diligence.\n' +
      '- use marcus for founder-risk / price calibration.\n' +
      '- do not ask either for a generic intro until after the deck read.',
    sources: ['prior', 'notion'],
  },
  {
    id: 'n12',
    company: 'Nozomio',
    type: 'Slack Thread',
    mode: 'VC',
    time: 'just now',
    authorId: 'jp',
    reviewerIds: ['me'],
    verdict: 'investigate',
    read: 'slack thread · jin and marcus both flag arlan as unusually technical.',
    body: '',
    sources: ['slack', 'prior'],
    bodyKind: 'slack',
    slack: {
      channel: '#sourcing',
      messages: [
        {
          who: 'Jin P.', initials: 'JP', hue: 200, time: 'just now',
          text: 'read the cobra notes. arlan is cracked. this is not a normal yc devtools founder doing wrapper infra.',
        },
        {
          who: 'Marcus T.', initials: 'MT', hue: 150, time: 'just now',
          text: 'agree. still worried about solo + age, but the technical line is real. cobra to nia is a real obsession, not a pitch-deck story.',
        },
        {
          who: 'Jin P.', initials: 'JP', hue: 200, time: 'just now',
          text: 'if we pass, it should be price or company-building risk. not founder technical depth.',
          reactions: ['+1', '100'],
        },
      ],
    },
  },
  {
    id: 'n13',
    company: 'Nozomio',
    type: 'Email',
    mode: 'VC',
    time: '6 months ago',
    authorId: 'sk',
    reviewerIds: [],
    verdict: 'investigate',
    read: 'sarah pinged arlan after stanford. casual reconnect, no commitment.',
    bodyKind: 'email',
    body: '',
    sources: ['email'],
    email: {
      subject: 're: cobra → nia',
      messages: [
        { from: 'arlan@nozom.io', to: 'sarah.k@firm.com', time: '6 mo ago', body: 'sarah — just saw your note. yeah, nia is the commercial generalization of cobra. building it solo for now. happy to send the latest demo if useful.' },
        { from: 'sarah.k@firm.com', to: 'arlan@nozom.io', time: '6 mo ago', body: 'love this. when you raise, i want to be in the conversation. ping me before the round closes.' },
      ],
    },
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
  originatorId: string;             // who first surfaced this deal at the firm
  yourArtifactId?: string;          // links to your artifact
  relatedArtifactIds: string[];     // artifacts about this deal from other shadows
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
    originatorId: 'me',
    yourArtifactId: 'a1',
    relatedArtifactIds: ['a7', 'a8', 'a11'],
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
    originatorId: 'jp',
    yourArtifactId: 'a2',
    relatedArtifactIds: ['a9', 'a13'],
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
    originatorId: 'me',
    yourArtifactId: 'a3',
    relatedArtifactIds: ['a10', 'a12'],
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
    originatorId: 'mt',
    yourArtifactId: 'a4',
    relatedArtifactIds: [],
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
    originatorId: 'jp',
    yourArtifactId: 'a6',
    relatedArtifactIds: [],
    consensus: 70,
    verdicts: [
      { teammateId: 'jp', verdict: 'invest',      conviction: 'medium', signals: ['infra thesis', 'AI security is timely'] },
      { teammateId: 'me', verdict: 'investigate', conviction: 'medium', signals: ['too early on design partners'] },
      { teammateId: 'sk', verdict: 'investigate', conviction: 'low',    signals: ['want to see how they handle the GDPR question'] },
    ],
  },
  {
    id: 'd6',
    company: 'Nozomio',
    mode: 'VC',
    thesis: 'Context layer for AI coding agents',
    ask: '$6.2M seed (CRV led)',
    lastActivity: 'just now',
    originatorId: 'mt',
    yourArtifactId: 'n7',
    relatedArtifactIds: ['n6', 'n7', 'n8', 'n10', 'n11', 'n12', 'n13', 'n4', 'n5'],
    consensus: 40,
    verdicts: [
      { teammateId: 'me', verdict: 'invest', conviction: 'high',   signals: ['Cobra → Nia 4-yr lineage', 'ships solo', 'PG + Wolf re-up'] },
      { teammateId: 'jp', verdict: 'invest', conviction: 'medium', signals: ['context layer is the right wedge', 'dev-tools bottom-up distribution'] },
      { teammateId: 'sk', verdict: 'pass',   conviction: 'medium', signals: ['no GTM signal yet', 'academic origins'] },
      { teammateId: 'mt', verdict: 'pass',   conviction: 'medium', signals: ['solo at 18', 'no prior infra ship', 'doesn\'t match firm winners'] },
      { teammateId: 'lr', verdict: 'pass',   conviction: 'high',   signals: ['round is hot', 'paying for PG + Wolf, not the company'] },
      { teammateId: 'hc', verdict: 'invest', conviction: 'medium', signals: ['Cobra → Nia is real conviction', 'ignore the round noise'] },
    ],
    firmVerdict: {
      call: 'investigate',
      consensus: '3 of 5 partners pass — solo founder, GTM gap, valuation. 2 lean invest on conviction lineage.',
      forSignals: ['Cobra → Nia 4-year obsession', 'Context layer is the right wedge for the next infra fight', 'Backers (PG, Wolf) are closest to dev-tool distribution'],
      againstSignals: ['Solo founder at 18 — no prior infra ship', 'GTM unproven, no design partner ARR yet', 'Round is hot at the top of firm range for unproven distribution'],
      recommendation: 'Pursue if Arlan adds a technical co-founder OR terms come in below $50M post · revisit at month 6 on net new agent-stack integrations.',
    },
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
  d6: {
    jp: [
      { q: 'Why are you invest on Nozomio?',
        a: 'Context layer is the right wedge. Foundation models are commoditizing — what compounds is what the agent can actually reach: live code, private docs, structured datasets. Nia ships an API the consuming side already wants. That\'s a category-winner shape.' },
      { q: 'What about the founder risk?',
        a: 'Real, but priced in by the round. PG and Wolf re-upping at this stage is a strong signal from people who know dev-tool distribution. I\'d take a smaller check than a pass.' },
    ],
    sk: [
      { q: 'Why pass?',
        a: 'Academic origins worry me when the next 18 months are a GTM fight. Cobra is a research artifact, not a shipped product with paying users. I want to see net-new agent-stack integrations — Cursor, Cognition, real shops paying — before I get to invest.' },
      { q: 'What would change your mind?',
        a: 'Three paying integration partners on commercial terms by Q3. Or Arlan brings on a GTM co-founder with infra distribution chops. Either flips me.' },
    ],
    lr: [
      { q: 'What valuation would change your mind?',
        a: '$30M post or below, with a technical co-founder added. Above that we\'re paying for Paul Graham and Thomas Wolf, not for the company. The angels make money on the markup; we don\'t.' },
      { q: 'So you\'d never do it at this round?',
        a: 'Never is strong. If the round closes hot and the next 6 months show real integration revenue, I\'ll re-rate. But buying into the round today at this price is buying hype, not signal.' },
    ],
    mt: [
      { q: 'Why pass?',
        a: 'Solo, 18, no prior infra company shipped. I like the builder signal, but it does not match the repeat-founder or co-founder-pair pattern in our winners.' },
      { q: 'What would change your mind?',
        a: 'A technical co-founder with infra production scars, or six months of real integration revenue. Either would move this from interesting founder to investable company.' },
    ],
    hc: [
      { q: 'Why are you for?',
        a: 'Cobra to Nia is real conviction. The age and round noise are distractions. If he has been grinding the same primitive since 16 and now the market finally wants it, that is exactly when you lean in.' },
    ],
    me: [
      { q: 'Walk me through your take.',
        a: 'Cobra to Nia is four years on the same problem. That\'s the strongest founder-fit signal in the file. Solo and 18 are real risks — but solo and shipping is not the same risk as solo and still-deciding. I\'m in at $2M, ownership target 1.5–2%, and I\'ll re-rate at month 9 on whether Arlan brings on a co-founder.' },
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
  summaryParagraph:
    "You back technical founders shipping B2B infrastructure — the kind who were eng leads at Stripe, Anthropic, or DeepMind before they started something. You weight execution risk low when the team has shipped together for 4+ years and you weight it sky-high when the cofounders met last quarter. You distrust slide-heavy decks and clean CAC numbers; you trust paying design partners and a 3-year burn plan that maps to milestones. You pass on hospital-procurement healthcare almost reflexively, you cool quickly on consumer copilots, and you keep coming back to the 2014–2019 infra wave as your reference shape. Your strongest tells are pre-Series-A ARR above $250k from real customers and a CTO who can answer the inference-cost question without checking notes. Your communication style is all lowercase, direct, and straight to the point.",
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

/* ── shadow updates & suggestions ─────────────────────────────────────── */

export type ShadowUpdate = {
  id: string;
  kind: 'applied' | 'suggestion';
  summary: string;          // one-liner shown in the panel
  rationale: string;        // expanded reasoning
  citedMemoryIds?: string[];
  createdAt: string;        // relative time
  diff?: { before?: string; after?: string };
};

export const shadowUpdates: ShadowUpdate[] = [
  {
    id: 'u1',
    kind: 'applied',
    summary: 'Strengthened: post-revenue preference (+3 signals this week)',
    rationale:
      'You\'ve passed on three pre-revenue deals in the last 5 days — Volt AI, a stealth consumer co, and a robotics seed — and explicitly named "no paying customers" each time. Bumped post-revenue weight 58 → 61.',
    citedMemoryIds: ['m6', 'm9', 'm10'],
    createdAt: '12 min ago',
    diff: { before: '58', after: '61' },
  },
  {
    id: 'u2',
    kind: 'applied',
    summary: 'New flag: hardware dilution risk (7/8 historical passes)',
    rationale:
      'Across your last 8 hardware pitches you\'ve flagged capital intensity 7 times. Added "hardware dilution risk" as an always-flag so I surface it the moment a hardware deal enters.',
    citedMemoryIds: ['m10', 'm11'],
    createdAt: '38 min ago',
  },
  {
    id: 'u3',
    kind: 'suggestion',
    summary: 'Soften "developer tools" preference?',
    rationale:
      'You weighted developer tools at 58 six months ago, but the last 4 dev-tools companies you reviewed all ended in pass within 15 minutes — and your voice notes have shifted from "interesting space" to "crowded, no moat." I think this preference is now closer to 40. Want me to adjust?',
    citedMemoryIds: ['m9'],
    createdAt: '1 hr ago',
    diff: { before: '58', after: '~40' },
  },
  {
    id: 'u4',
    kind: 'suggestion',
    summary: 'Add explicit thesis: "ex-Stripe eng leads"?',
    rationale:
      'Three of your last six invests had ex-Stripe engineers as a cofounder. You\'ve referenced "the Stripe shape" in voice notes twice this week. This isn\'t in your model yet — should I make it a first-class signal?',
    citedMemoryIds: ['m3', 'm8'],
    createdAt: '2 hr ago',
  },
  {
    id: 'u5',
    kind: 'applied',
    summary: 'Tightened "first-time CEO + first-time CTO" flag',
    rationale:
      'Past version flagged any pairing. New version only flags when neither founder has shipped to >$1M ARR before — closer to how you actually use it in conversation.',
    createdAt: '4 hr ago',
  },
];

/* ── companies ────────────────────────────────────────────────────────── */

export type CompanyStage = 'sourcing' | 'first-meeting' | 'diligence' | 'term-sheet' | 'invested' | 'passed';

export type Company = {
  id: string;
  name: string;
  sector: string;
  stage: CompanyStage;
  hq?: string;
  headcount?: number;
  arr?: string;
  dealId?: string;
  founderIds: string[];
  lastTouch: string;
  blurb: string;
};

export const companies: Company[] = [
  {
    id: 'c1', name: 'Acme Inc', sector: 'B2B agent infrastructure', stage: 'term-sheet',
    hq: 'San Francisco', headcount: 11, arr: '$120k',
    dealId: 'd1', founderIds: ['p1', 'p2'], lastTouch: '8 min ago',
    blurb: 'Agent infra for B2B workflows. 3 paying design partners at $40k ARR each. Raising $8M Series A.',
  },
  {
    id: 'c2', name: 'Mira Health', sector: 'Clinical AI', stage: 'first-meeting',
    hq: 'Boston', headcount: 14, arr: '$0',
    dealId: 'd2', founderIds: ['p3', 'p4'], lastTouch: '1 hr ago',
    blurb: 'Clinical AI assistant for primary care. 3 hospital pilots, no paid revenue yet.',
  },
  {
    id: 'c3', name: 'Helix Compute', sector: 'AI infrastructure', stage: 'diligence',
    hq: 'San Francisco', headcount: 7, arr: '$240k+',
    dealId: 'd3', founderIds: ['p5', 'p6'], lastTouch: '34 min ago',
    blurb: 'Distributed inference runtime. 3 design partners paying $80k+ ARR each. Replicate, Together, F500.',
  },
  {
    id: 'c4', name: 'Volt AI', sector: 'Consumer copilot', stage: 'passed',
    hq: 'Remote', headcount: 1, arr: '$0',
    dealId: 'd4', founderIds: ['p7'], lastTouch: '3 hr ago',
    blurb: 'Solo-founder consumer productivity copilot. 4 months from idea, no paying users.',
  },
  {
    id: 'c5', name: 'Vector Sec', sector: 'AI security', stage: 'sourcing',
    hq: 'New York', headcount: 5, arr: '$0',
    dealId: 'd5', founderIds: ['p8', 'p9'], lastTouch: 'this morning',
    blurb: 'Security infrastructure for AI agents. Strong team, early on design partners.',
  },
  {
    id: 'c6', name: 'Bolt Robotics', sector: 'Warehouse autonomy', stage: 'sourcing',
    hq: 'Pittsburgh', headcount: 9, arr: '$0',
    founderIds: ['p10', 'p11'], lastTouch: '5 hr ago',
    blurb: 'Warehouse manipulation. ex-Boston Dynamics + ex-Cruise. Phased burn plan tied to milestones.',
  },
  {
    id: 'c7', name: 'Nozomio', sector: 'Context layer for AI coding agents', stage: 'first-meeting',
    hq: 'San Francisco', headcount: 3, arr: '—',
    dealId: 'd6', founderIds: ['p12'], lastTouch: 'just now',
    blurb: 'YC S25. Nia — search/index API giving AI coding agents continuous live context. $6.2M seed, CRV led, PG + Wolf angels.',
  },
];

/* ── people ───────────────────────────────────────────────────────────── */

export type PersonRole = 'founder' | 'partner' | 'analyst' | 'operator';

export type Person = {
  id: string;
  name: string;
  role: PersonRole;
  title: string;
  companyId?: string;
  teammateId?: string;       // for firm partners — links to teammates above
  hue: number;
  initials: string;
  email?: string;
  lastInteraction: string;
  blurb: string;
};

export const people: Person[] = [
  // founders
  { id: 'p1', name: 'James Chen', role: 'founder', title: 'CEO, Acme', companyId: 'c1', hue: 200, initials: 'JC',
    email: 'james@acme.dev', lastInteraction: 'Wed call', blurb: 'ex-Stripe eng lead (4y connect team). 2 prior startups (1 acq).' },
  { id: 'p2', name: 'Priya Iyer', role: 'founder', title: 'CTO, Acme', companyId: 'c1', hue: 320, initials: 'PI',
    lastInteraction: 'Wed call', blurb: 'ex-Stripe infra. Worked with James for 3 yrs at Stripe.' },
  { id: 'p3', name: 'Dr. Aisha Rao', role: 'founder', title: 'CEO, Mira Health', companyId: 'c2', hue: 18, initials: 'AR',
    email: 'aisha@mirahealth.io', lastInteraction: 'Mon email', blurb: 'ex-Kaiser internal med (8y). Met Sarah at AAFP.' },
  { id: 'p4', name: 'Mark Levin', role: 'founder', title: 'CTO, Mira Health', companyId: 'c2', hue: 80, initials: 'ML',
    lastInteraction: 'Mon email', blurb: 'ex-Epic (5y) + ex-Olive AI (2y). 8y working with Aisha at Kaiser pilot.' },
  { id: 'p5', name: 'Anya Volkov', role: 'founder', title: 'CEO, Helix', companyId: 'c3', hue: 270, initials: 'AV',
    email: 'anya@helix.run', lastInteraction: 'Tue intro', blurb: 'ex-DeepMind research engineer (5y). Oxford CS PhD. 4 OSS inference libs.' },
  { id: 'p6', name: 'Raj Patel', role: 'founder', title: 'CTO, Helix', companyId: 'c3', hue: 150, initials: 'RP',
    lastInteraction: 'Tue intro', blurb: 'ex-Anthropic infra (3y). Knew Anya 6 yrs from grad school.' },
  { id: 'p7', name: 'Cole Reyes', role: 'founder', title: 'Solo, Volt AI', companyId: 'c4', hue: 30, initials: 'CR',
    lastInteraction: 'declined', blurb: 'ex-Stripe (2y), shipping fast, no paying users yet.' },
  { id: 'p8', name: 'Priya Shah', role: 'founder', title: 'CEO, Vector Sec', companyId: 'c5', hue: 120, initials: 'PS',
    lastInteraction: 'this morning', blurb: 'ex-CrowdStrike (6y) → ex-Anthropic enterprise (2y).' },
  { id: 'p9', name: 'Alex Tran', role: 'founder', title: 'CTO, Vector Sec', companyId: 'c5', hue: 220, initials: 'AT',
    lastInteraction: 'this morning', blurb: 'ex-OpenAI safety (3y).' },
  { id: 'p10', name: 'Maya Choudhary', role: 'founder', title: 'CEO, Bolt', companyId: 'c6', hue: 350, initials: 'MC',
    lastInteraction: '5 hr ago', blurb: 'ex-Boston Dynamics manipulation team (7y).' },
  { id: 'p11', name: 'Kenji Wright', role: 'founder', title: 'CTO, Bolt', companyId: 'c6', hue: 180, initials: 'KW',
    lastInteraction: '5 hr ago', blurb: 'ex-Cruise (4y).' },
  { id: 'p12', name: 'Arlan Rakhmetzhanov', role: 'founder', title: 'Solo founder, Nozomio', companyId: 'c7', hue: 38, initials: 'AR',
    email: 'arlan@nozom.io', lastInteraction: 'just now',
    blurb: 'ex-Stanford research (Cobra, static analysis). Forbes 30u30. 18, solo, Kazakhstan. Cobra → Nia is the 4-year lineage.' },
  // firm partners (mirror teammates so People view shows them too)
  { id: 'p-me', name: 'You', role: 'partner', title: 'Partner', teammateId: 'me', hue: 270, initials: 'YO',
    lastInteraction: 'now', blurb: 'Your shadow lives at the firm.' },
  { id: 'p-sk', name: 'Sarah K.', role: 'partner', title: 'Partner', teammateId: 'sk', hue: 18, initials: 'SK',
    lastInteraction: '8 min ago', blurb: '2019 infra-wave thesis owner.' },
  { id: 'p-jp', name: 'Jin P.', role: 'partner', title: 'Partner', teammateId: 'jp', hue: 200, initials: 'JP',
    lastInteraction: '34 min ago', blurb: 'Distributed-inference thesis owner.' },
  { id: 'p-mt', name: 'Marcus T.', role: 'analyst', title: 'Analyst', teammateId: 'mt', hue: 150, initials: 'MT',
    lastInteraction: '2 hr ago', blurb: 'Sourcing + comp tables.' },
  { id: 'p-lr', name: 'Linda R.', role: 'partner', title: 'Partner (emer.)', teammateId: 'lr', hue: 320, initials: 'LR',
    lastInteraction: '3 hr ago', blurb: 'Historical comp set across 12 years.' },
  { id: 'p-hc', name: 'Henry C.', role: 'partner', title: 'Partner (emer.)', teammateId: 'hc', hue: 80, initials: 'HC',
    lastInteraction: 'last week', blurb: 'Datadog Series B lead. 2014 infra-wave originator.' },
];

export const personById = (id: string) => people.find((p) => p.id === id);

/* ── meetings ─────────────────────────────────────────────────────────── */

export type Meeting = {
  id: string;
  title: string;
  when: string;            // human-readable
  type: 'first call' | 'follow-up' | 'partner meeting' | 'IC' | 'social';
  attendeeIds: string[];   // person ids
  dealId?: string;
  notes: string;
  upcoming?: boolean;
};

export const meetings: Meeting[] = [
  { id: 'mt1', title: 'Acme — Series A diligence call', when: 'Wed, 2:00 PM', type: 'follow-up',
    attendeeIds: ['p1', 'p2', 'p-me', 'p-sk'], dealId: 'd1', upcoming: true,
    notes: 'Push on inference cost model and design-partner pipeline tightness.' },
  { id: 'mt2', title: 'Helix Compute — partner meeting', when: 'Thu, 10:00 AM', type: 'partner meeting',
    attendeeIds: ['p5', 'p6', 'p-me', 'p-sk', 'p-jp', 'p-lr'], dealId: 'd3', upcoming: true,
    notes: 'Term sheet review. Lead at $8M of $12M, board seat.' },
  { id: 'mt3', title: 'Mira Health — first call', when: 'Fri, 11:00 AM', type: 'first call',
    attendeeIds: ['p3', 'p-sk'], dealId: 'd2', upcoming: true,
    notes: 'Sarah pushing for it before pass. Reimbursement angle worth a real look.' },
  { id: 'mt4', title: 'IC — Acme & Helix', when: 'Mon next week', type: 'IC',
    attendeeIds: ['p-me', 'p-sk', 'p-jp', 'p-lr'], upcoming: true,
    notes: 'Two memos up. Helix is unanimous; Acme has burn dissent from Jin.' },
  { id: 'mt5', title: 'Acme — first call', when: 'Mon, 10:30 AM', type: 'first call',
    attendeeIds: ['p1', 'p-me'], dealId: 'd1',
    notes: 'James walked through deck. Strong on team and design partners. Burn was the soft spot.' },
  { id: 'mt6', title: 'Vector Sec — intro', when: 'Tue, 4:00 PM', type: 'first call',
    attendeeIds: ['p8', 'p-jp'], dealId: 'd5',
    notes: 'Jin sourced. CrowdStrike + OpenAI pedigree. Distribution unclear.' },
  { id: 'mt7', title: 'Volt AI — intro (passed)', when: 'last Wed', type: 'first call',
    attendeeIds: ['p7', 'p-mt'], dealId: 'd4',
    notes: 'Marcus took it. Solo founder, no users. Passed within 20 min.' },
  { id: 'mt8', title: 'Founder dinner — infra wave', when: 'Sat, 7:30 PM', type: 'social',
    attendeeIds: ['p1', 'p5', 'p-me', 'p-sk', 'p-lr'],
    notes: 'James and Anya invited. Linda telling the 2014 Datadog story.' },
  { id: 'mt9', title: 'Nozomio — first call (Arlan)', when: 'Fri, 3:00 PM', type: 'first call',
    attendeeIds: ['p12', 'p-me', 'p-jp'], dealId: 'd6', upcoming: true,
    notes: 'Push on Cobra → Nia lineage, who the next hire is, and which agent stacks are wiring Nia in this quarter.' },
];

/* ── firm notes (lightweight free-form) ───────────────────────────────── */

export type FirmNote = {
  id: string;
  title: string;
  authorId: string;            // teammate id
  updated: string;
  body: string;
  tags: string[];
};

export const firmNotes: FirmNote[] = [
  { id: 'n1', title: '2026 thesis — agent infrastructure',
    authorId: 'me', updated: 'today',
    tags: ['thesis', 'infra'],
    body: 'Tighter focus this year on the orchestration / reliability layer above raw model APIs. Three companies fit the shape: Acme, Helix, Vector. Watch for ex-Stripe / ex-Anthropic pairs with paying design partners pre-Series-A.' },
  { id: 'n2', title: 'IC notes — Acme', authorId: 'sk', updated: '2 hr ago',
    tags: ['IC', 'Acme'],
    body: 'Aligned with you on team. Diverge on price — I think round clears at $40M post given the design-partner shape, not $32M. Worth the push.' },
  { id: 'n3', title: 'Healthcare procurement learning', authorId: 'jp', updated: 'yesterday',
    tags: ['post-mortem', 'health'],
    body: 'Reviewed the last 6 healthcare passes. Pattern is consistent: 12-month hospital procurement cycle kills any seed-stage burn plan. Updated firm-wide to flag clinical AI deals for IC review before any first call.' },
  { id: 'n4', title: 'Henry\'s Datadog playbook (2014)', authorId: 'hc', updated: 'archived',
    tags: ['legacy', 'precedent'],
    body: 'When the design-partner shape looked like Acme\'s, the right move was to lead at the price the founder asked for, not the price comps suggested. The valuation re-rated within 18 months. Don\'t over-optimize the entry.' },
];

export const firmNoteById = (id: string) => firmNotes.find((n) => n.id === id);

export const companyById = (id: string) => companies.find((c) => c.id === id);
export const companyByName = (name: string) => companies.find((c) => c.name === name);

/* ── source labels ────────────────────────────────────────────────────── */

export const sourceLabel: Record<SourceKind, string> = {
  slack:    'Slack',
  email:    'Email',
  notion:   'Notion',
  calendar: 'Calendar',
  prior:    'Prior deals',
  nia:      'World (Nia)',
};

/* ── opinions, inbound actions, prior contacts ──────────────────────── */

export type OpinionEvidence = { kind: string; label: string; artifactId?: string };
export type OpinionPrior = { kind: 'similar' | 'different'; label: string; artifactId?: string; outcome: string };
export type PartnerOpinion = {
  verdict: Verdict;
  verdictText: string;
  evidence: OpinionEvidence[];
  priors: OpinionPrior[];
};

export const opinions: Record<string, Record<string, PartnerOpinion>> = {
  n6: {
    sk: {
      verdict: 'invest',
      verdictText: 'cobra → nia is the strongest founder-fit signal in the file. i told him six months ago to ping me before the round closed. this is exactly the bet.',
      evidence: [
        { kind: 'email', label: 'reconnect email w/ arlan · 6 mo ago', artifactId: 'n13' },
        { kind: 'memory', label: '"young technical founder, ships, conviction-driven" — sarah\'s archetype' },
      ],
      priors: [
        { kind: 'similar', label: 'helix compute (led seed 2023)', outcome: 'series b, marked at 4.1x' },
        { kind: 'different', label: 'volt ai (passed 2024)', outcome: 'similar age but no shipping history — pattern broke' },
      ],
    },
    jp: {
      verdict: 'investigate',
      verdictText: 'i don\'t underwrite solo founders past a hot seed. the technical line is real but the company-building risk is unpriced.',
      evidence: [
        { kind: 'slack', label: '#sourcing — "cracked but solo"', artifactId: 'n12' },
        { kind: 'memory', label: '"two founders who met at YC last quarter — that\'s a hard pass"' },
      ],
      priors: [
        { kind: 'similar', label: 'mira health (passed 2024)', outcome: 'solo founder, raised at 2x our entry, then stalled at series A' },
        { kind: 'different', label: 'bolt robotics (led 2022)', outcome: 'two founders, 4 years together — clean execution' },
      ],
    },
    mt: {
      verdict: 'investigate',
      verdictText: 'flagged him in #vc-shared the day yc s25 dropped. cobra lineage is the best part. need a second technical reference before i\'d push harder.',
      evidence: [
        { kind: 'slack', label: '#sourcing — flagged after yc s25', artifactId: 'n12' },
        { kind: 'memory', label: '"if the CTO came from Stripe i want to talk to them"' },
      ],
      priors: [
        { kind: 'similar', label: 'helix compute sourcing memo', outcome: 'pushed for a second technical ref → unlocked the deal' },
        { kind: 'different', label: 'acme inc (passed 2024)', outcome: 'team slide checked out but no founder obsession' },
      ],
    },
    lr: {
      verdict: 'pass',
      verdictText: 'paying design partners > LOIs every time. nia has neither yet. i\'d wait two quarters.',
      evidence: [
        { kind: 'memory', label: '"paying design partners > LOIs every time"' },
        { kind: 'memory', label: '"hardware dilution risk — never works the way the deck says"' },
      ],
      priors: [
        { kind: 'similar', label: 'mira health pass memo', outcome: 'no paying customers at seed — stalled exactly as predicted' },
        { kind: 'different', label: 'helix compute', outcome: 'had 3 paying design partners pre-seed — different shape' },
      ],
    },
    hc: {
      verdict: 'investigate',
      verdictText: 'infra is the only place i actually understand the moat. context layer for agents is real. ownership target matters more than entry.',
      evidence: [
        { kind: 'memory', label: '"infra is the only place i actually understand the moat"' },
        { kind: 'memory', label: '"if they\'ve worked together 4+ years i don\'t worry about cofounder split"' },
      ],
      priors: [
        { kind: 'similar', label: 'datadog seed (passed 1990s-thinking)', outcome: 'lesson: at infra, the wedge is what matters, not founder count' },
        { kind: 'different', label: 'helix compute', outcome: 'won on ownership, not entry price — same playbook applies' },
      ],
    },
  },
  n7: {
    sk: { verdict: 'invest', verdictText: 'memo lines up with what i told arlan months ago. conviction high.', evidence: [{ kind: 'email', label: 'reconnect w/ arlan · 6 mo ago', artifactId: 'n13' }], priors: [{ kind: 'similar', label: 'helix compute ic memo', outcome: 'same pattern, 4.1x mark' }, { kind: 'different', label: 'volt ai pass', outcome: 'no shipping history, broke pattern' }] },
    jp: { verdict: 'investigate', verdictText: 'memo soft-pedals the solo-founder risk. fix the risks section before ic.', evidence: [{ kind: 'slack', label: '#sourcing thread', artifactId: 'n12' }], priors: [{ kind: 'similar', label: 'mira health', outcome: 'similar shape, stalled' }, { kind: 'different', label: 'bolt robotics', outcome: 'two founders, clean' }] },
    mt: { verdict: 'investigate', verdictText: 'memo is solid but i want a second technical ref before we push to ic.', evidence: [], priors: [{ kind: 'similar', label: 'helix compute', outcome: 'second ref unlocked it' }, { kind: 'different', label: 'acme inc', outcome: 'no obsession, passed' }] },
    lr: { verdict: 'pass', verdictText: 'memo doesn\'t address paying customers. i\'d wait.', evidence: [], priors: [{ kind: 'similar', label: 'mira health', outcome: 'no paying customers, stalled' }, { kind: 'different', label: 'helix compute', outcome: 'had design partners — different shape' }] },
    hc: { verdict: 'investigate', verdictText: 'wedge is right. ownership target $1.5–2M is the right bound.', evidence: [], priors: [{ kind: 'similar', label: 'datadog lesson', outcome: 'wedge > founder count' }, { kind: 'different', label: 'helix compute', outcome: 'won on ownership' }] },
  },
};

export type FirmInboundActionKind = 'inbound-pitch' | 'founder-raised' | 'portfolio-signal';
export type FirmInboundAction = {
  id: string;
  kind: FirmInboundActionKind;
  title: string;
  subtitle: string;
  artifactId?: string;
  reason: string;
};

export const firmInboundActions: FirmInboundAction[] = [
  { id: 'fa1', kind: 'inbound-pitch', title: 'lattice cli — dev-tool, api-first, $200k mrr', subtitle: 'series a · solo technical founder · ex-segment', reason: 'matches your "young technical founder, ships, conviction-driven" archetype — 3 of your last 5 invests fit this' },
  { id: 'fa2', kind: 'inbound-pitch', title: 'fresco — context layer for support agents', subtitle: 'seed · 2 founders, ex-anthropic and ex-stripe', reason: 'similar wedge to nozomio · "infra is the only place i actually understand the moat"' },
  { id: 'fa3', kind: 'inbound-pitch', title: 'meridian — eval framework for production llms', subtitle: 'seed · post-revenue · 12 paying design partners', reason: '"paying design partners > LOIs every time" — meridian has 12, mostly fortune-500' },
  { id: 'fa4', kind: 'founder-raised', title: 'priya menon raised series A', subtitle: 'rivet ai · you met her in oct 2025', reason: 'you flagged "rivet team is the strongest data ml team i\'ve seen this year" — round closed yesterday' },
  { id: 'fa5', kind: 'founder-raised', title: 'james wei raised seed', subtitle: 'forge robotics · met at ai infra summit', reason: 'you said "hardware dilution risk — never works the way the deck says" — they kept dilution at 18%, raising at $40m post' },
  { id: 'fa6', kind: 'portfolio-signal', title: 'helix compute · nps drop in last 30 days', subtitle: 'portfolio co · led seed 2023', reason: 'signal: 3 enterprise customers paused expansion · this is the second time this quarter — consider dropping a note to the founder' },
];

export type PartnerPriorContact = { partnerId: string; artifactId: string; summary: string };

export const partnerPriorContacts: Record<string, PartnerPriorContact[]> = {
  Nozomio: [
    { partnerId: 'sk', artifactId: 'n13', summary: 'pinged him after stanford' },
    { partnerId: 'mt', artifactId: 'n12', summary: 'flagged him in #sourcing after the yc batch dropped' },
  ],
};
