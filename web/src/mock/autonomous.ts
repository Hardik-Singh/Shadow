// Pre-built autonomous-mode demo data. Morning brief is mock; everything reveals
// after the handoff animation completes regardless of backend availability.

export type TaskKey = 'preflight' | 'sourcing' | 'triage' | 'nozomio_dd';

export type SessionStatus = 'idle' | 'running' | 'complete';

export type Session = {
  id: string;
  title: string;
  subtitle: string;
  startedAtLabel: string;
  status: SessionStatus;
};

export type AutonomousTask = {
  key: TaskKey;
  title: string;
  detailLines: string[]; // rotated mid-flight to add texture
  durationMs: number; // how long the task takes end-to-end (real-feeling, not demo-fast)
};

export const AUTONOMOUS_TASKS: AutonomousTask[] = [
  {
    key: 'preflight',
    title: 'Read context · figure out where you left off',
    detailLines: [
      'loading partner:hardik behavioral model from hyperspell…',
      'querying recent firm-brain activity for in-progress work…',
      'found: nozomio sourcing sheet · last touched 5:47pm',
      'cross-referencing nia for fresh signals on nozomio…',
      'plan locked: finish nozomio · triage inbox · run DD on nozomio',
    ],
    durationMs: 30 * 1000, // 30s preflight
  },
  {
    key: 'sourcing',
    title: 'Finish work on Nozomio',
    detailLines: [
      'reopening sourcing sheet you left at 5:47pm…',
      'completing comps section: Datadog · Honeycomb · NewRelic…',
      'pulling latest Crunchbase round data via nia…',
      'drafting team summary from LinkedIn + GitHub…',
      'sheet ready for your review',
    ],
    durationMs: 4 * 60 * 1000, // 4 minutes
  },
  {
    key: 'triage',
    title: 'Triage all inbound',
    detailLines: [
      'pulling 23 unread from gmail…',
      'scoring against your behavioral model…',
      'cross-checking against firm history in hyperspell…',
      'flagged 3 for review · 18 pass drafts queued · 2 snoozed',
    ],
    durationMs: 8 * 60 * 1000, // 8 minutes
  },
  {
    key: 'nozomio_dd',
    title: 'Run additional due diligence on Nozomio',
    detailLines: [
      'querying nia for recent press, hiring, github activity…',
      'pulled 4 customer references from your network graph…',
      'compared founders\' shipping cadence vs comps…',
      'flagged 2 risks worth your attention',
      'DD memo drafted',
    ],
    durationMs: 12 * 60 * 1000, // 12 minutes
  },
];

export type BriefItem = {
  id: string;
  title: string;
  meta: string;
  body: string;
  sources?: string[];
};

export type MorningBrief = {
  ranAt: string; // window
  inbound: {
    total: number;
    flagged: BriefItem[];
    passDrafts: number;
    snoozed: number;
  };
  found: BriefItem[];
  portfolio: BriefItem[];
  market: BriefItem[];
};

export const morningBrief: MorningBrief = {
  ranAt: 'last night · 6:04pm → 8:47am',
  inbound: {
    total: 23,
    passDrafts: 18,
    snoozed: 2,
    flagged: [
      {
        id: 'in-1',
        title: 'Hexline — agent observability for prod LLM systems',
        meta: 'score 87 · matches B2B infra thesis · ex-Datadog founders',
        body: 'Two ex-Datadog engineers. Customer is platform teams running >50 agents in prod. Pricing on traces, not seats. Asking $4M on $20M.',
        sources: ['gmail', 'nia', 'crunchbase'],
      },
      {
        id: 'in-2',
        title: 'Pivot Labs — vector index for code search',
        meta: 'score 81 · adjacent to your dev tools thesis',
        body: 'Solo technical founder, shipping fast. 14 design partners, 3 paying. Your past notes flag risk on solo founder + capital-heavy moat.',
        sources: ['gmail', 'github'],
      },
      {
        id: 'in-3',
        title: 'Northwind — durable workflows for AI agents',
        meta: 'score 79 · firm has prior context (passed seed)',
        body: 'You passed at seed in 2024 over team concerns. Team has since added a former Temporal eng. Worth a second look.',
        sources: ['gmail', 'prior'],
      },
    ],
  },
  found: [
    {
      id: 'fnd-1',
      title: 'Quill — eval infra for agentic systems',
      meta: 'B2B infra · YC W26 · launched 4 days ago',
      body: 'Two founders from Anthropic eval team. Open-sourced harness with 3.2k stars in week one. Sourcing sheet pre-built.',
      sources: ['nia', 'product hunt', 'github'],
    },
    {
      id: 'fnd-2',
      title: 'Capstan — typed config for LLM pipelines',
      meta: 'B2B infra · stealth · raising preseed',
      body: 'Caught via twitter signal — three of your trusted founder graph follow them in the last week. No website yet.',
      sources: ['twitter', 'nia'],
    },
    {
      id: 'fnd-3',
      title: 'Loomwork — agent reliability scoring',
      meta: 'B2B infra · raised $1.4M angel round last week',
      body: 'Mentioned by you in a screen-share two weeks ago. Now actively raising. Sourcing sheet pre-built.',
      sources: ['nia', 'crunchbase', 'prior'],
    },
  ],
  portfolio: [
    {
      id: 'pf-1',
      title: 'Acme Inc mentioned in TechCrunch',
      meta: 'positive · feature on enterprise rollout',
      body: 'Quoted CEO of largest customer. No funding implications, but useful for next board update.',
      sources: ['nia'],
    },
    {
      id: 'pf-2',
      title: 'Competitor of Beacon raised $20M Series B',
      meta: 'material · led by Sequoia',
      body: 'Direct overlap on midmarket segment. Beacon has 7 months runway. Recommend a check-in before friday.',
      sources: ['nia', 'crunchbase'],
    },
  ],
  market: [
    {
      id: 'mk-1',
      title: 'OpenAI shipped agent SDK',
      meta: 'thesis: agent infra',
      body: 'Reframes the build vs buy line for agent runtime. Implications for Hexline, Northwind, Loomwork.',
      sources: ['nia', 'twitter'],
    },
    {
      id: 'mk-2',
      title: 'New CISO guidance from NIST on agent autonomy',
      meta: 'thesis: B2B infra',
      body: 'Compliance-driven demand pull for guardrails + audit trail vendors.',
      sources: ['nia'],
    },
    {
      id: 'mk-3',
      title: 'Two new agent-eval open-source repos crossed 5k stars',
      meta: 'thesis: dev tools',
      body: 'Signal for category formation. Quill is one of them.',
      sources: ['github'],
    },
    {
      id: 'mk-4',
      title: 'Hiring spike at Anthropic for product researchers',
      meta: 'thesis: founder pipeline',
      body: 'Three former Anthropic ICs in your network changed status this week.',
      sources: ['linkedin'],
    },
  ],
};

// First-handoff state — no past sessions yet.
export const priorSessions: Session[] = [];
