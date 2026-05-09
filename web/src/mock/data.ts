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
  bodyKind?: 'text' | 'email' | 'slack';
  email?: { subject: string; messages: EmailMessage[] };
  slack?: { channel: string; messages: SlackMessage[] };
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
