// Daytona.io sandbox client + handoff context builder.
// Stub-friendly: works with no keys (logs, returns null) so the demo never blocks.
// When VITE_DAYTONA_KEY / VITE_HYPERSPELL_BASE / VITE_NIA_BASE are populated, it
// hits the real endpoints — same wire format the Electron HUD already uses
// (src/ingest/hyperspell.js, src/ingest/nia.js).

export type Connector = {
  name: 'gmail' | 'calendar' | 'slack' | 'notion' | 'crunchbase' | 'twitter' | 'github' | 'linkedin';
  status: 'connected' | 'pending';
};

export type HandoffContext = {
  partner_id: string;
  user_message: string | null; // optional context the partner typed before handoff
  hyperspell: {
    base: string;
    user_id: string;       // "partner:hardik" — personal vault
    firm_user_id: string;  // "firm:nozomio-vc" — shared firm brain
    behavioral_model_ref: string;
  };
  nia: {
    base: string;
    enabled: boolean;
  };
  connectors: Connector[];
  tasks_enabled: string[];
  approval_required: boolean;
  handoff_time: string;
};

export type HandoffPayload = HandoffContext;

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const DAYTONA_API = env.VITE_DAYTONA_API ?? 'https://api.daytona.io/v1';
const DAYTONA_KEY = env.VITE_DAYTONA_KEY;
const HYPERSPELL_BASE = env.VITE_HYPERSPELL_BASE ?? 'https://api.hyperspell.com';
const NIA_BASE = env.VITE_NIA_BASE ?? 'https://apigcp.trynia.ai/v2';

const DEFAULT_CONNECTORS: Connector[] = [
  { name: 'gmail', status: 'connected' },
  { name: 'calendar', status: 'connected' },
  { name: 'slack', status: 'connected' },
  { name: 'notion', status: 'connected' },
  { name: 'crunchbase', status: 'connected' },
  { name: 'twitter', status: 'connected' },
  { name: 'github', status: 'connected' },
  { name: 'linkedin', status: 'connected' },
];

export function buildHandoffContext(opts: {
  partnerId: string;
  userMessage?: string | null;
  tasks: string[];
}): HandoffContext {
  return {
    partner_id: opts.partnerId,
    user_message: opts.userMessage ?? null,
    hyperspell: {
      base: HYPERSPELL_BASE,
      user_id: `partner:${opts.partnerId}`,
      firm_user_id: 'firm:nozomio-vc',
      behavioral_model_ref: `hyperspell:partner/${opts.partnerId}/model`,
    },
    nia: {
      base: NIA_BASE,
      enabled: true,
    },
    connectors: DEFAULT_CONNECTORS,
    tasks_enabled: opts.tasks,
    approval_required: true,
    handoff_time: new Date().toISOString(),
  };
}

export async function startSandbox(payload: HandoffPayload): Promise<{ sandboxId: string } | null> {
  if (!DAYTONA_KEY) {
    console.info('[daytona] no VITE_DAYTONA_KEY set — demo mode, would launch sandbox with:', payload);
    return null;
  }
  try {
    const res = await fetch(`${DAYTONA_API}/sandboxes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DAYTONA_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: 'shadow-agent:latest',
        env: payload,
      }),
    });
    if (!res.ok) {
      console.warn('[daytona] sandbox create failed', res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('[daytona] sandbox create error', err);
    return null;
  }
}
