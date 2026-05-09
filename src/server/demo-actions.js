const Artifacts = require('../repos/artifacts');
const { buildRelations } = require('../repos/artifact-relations');

const KIND_TO_TYPE = {
  'IC memo': 'IC Memo',
  'Sourcing sheet': 'Sourcing Sheet',
  'Founder background': 'Founder Background',
  'Comp table': 'Comp Table',
  'Deal card': 'Deal Card',
};

const DEFAULT_COMPANY = 'Acme Inc';

function html(strings, ...values) {
  return strings.reduce((out, s, i) => out + s + escapeHtml(values[i] ?? ''), '');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function timeAgoLabel() {
  return 'just now';
}

function baseArtifact({ kind, company, verdict, read, body }) {
  return {
    company,
    type: KIND_TO_TYPE[kind] || kind,
    kind: `demo_${kind.toLowerCase().replace(/\W+/g, '_')}`,
    mode: 'VC',
    time: timeAgoLabel(),
    authorId: 'me',
    reviewerIds: [],
    verdict,
    read,
    body,
    bodyKind: 'html',
    sources: ['prior'],
    flags: ['demo-mode scaffold: replace with live Hyperspell/Nia action output before production'],
    relations: buildRelations({ company, kind, authorId: 'me' }),
    raw: {
      demo: true,
      hyperspell_total: 24,
      hyperspell_by_scope: { partner: 17, firm: 7 },
      nia_total: 6,
    },
    createdAt: Date.now(),
  };
}

function icMemo(company) {
  return baseArtifact({
    kind: 'IC memo',
    company,
    verdict: 'investigate',
    read: 'Lean in, but price and repeatable GTM need one more pass before an invest call.',
    body: html`
      <h2>Read</h2>
      <p>${company} matches the partner pattern Shadow has been learning: technical founder, B2B infrastructure wedge, and early design-partner pull.</p>
      <h2>Reasons to keep going</h2>
      <ul>
        <li>CTO profile maps to the partner's repeated Stripe-alumni signal.</li>
        <li>Three design partners are more useful than broad LOIs for this stage.</li>
        <li>The market shape resembles prior infrastructure winners the firm has indexed heavily.</li>
      </ul>
      <h2>Risks</h2>
      <ul>
        <li>$40B TAM is category-level and needs tighter bottom-up proof.</li>
        <li>Burn plan should be tied to customer milestones, not headcount growth.</li>
        <li>Pricing power is not proven yet.</li>
      </ul>
      <h2>Open questions</h2>
      <ul>
        <li>Can the CTO explain inference cost tradeoffs without notes?</li>
        <li>Which design partner converts first, and on what paid contract?</li>
        <li>What valuation still leaves room for the Series B?</li>
      </ul>
    `,
  });
}

function sourcingSheet(company) {
  return baseArtifact({
    kind: 'Sourcing sheet',
    company,
    verdict: 'investigate',
    read: 'Strong enough for a first call; team depth is the main reason to spend time.',
    body: html`
      <h2>Company</h2>
      <p>${company} is framed as agent infrastructure for enterprise workflow automation. Current materials imply an $8M Series A ask and early design-partner traction.</p>
      <h2>Team</h2>
      <ul>
        <li>CEO: repeat founder with one small acquisition.</li>
        <li>CTO: ex-Stripe engineering lead, infra-heavy background.</li>
        <li>Cofounder history needs verification; Shadow flags relationship depth as material.</li>
      </ul>
      <h2>Market</h2>
      <ul>
        <li>Comparable references: Datadog, Honeycomb, New Relic, and newer AI-runtime monitoring tools.</li>
        <li>TAM should be reframed around observable workflow spend instead of all enterprise automation.</li>
      </ul>
      <h2>Next moves</h2>
      <ul>
        <li>Founder call focused on cost model, buyer urgency, and implementation drag.</li>
        <li>Ask for customer references from paying design partners.</li>
        <li>Run comp table before agreeing to lead terms.</li>
      </ul>
    `,
  });
}

function founderBackground(company) {
  return baseArtifact({
    kind: 'Founder background',
    company,
    verdict: 'investigate',
    read: 'Technical signal is strong; founder-market fit needs customer proof.',
    body: html`
      <h2>Profile</h2>
      <p>James Chen is presented as the technical founder behind ${company}, with prior Stripe infrastructure experience and a visible shipping history.</p>
      <h2>Signals</h2>
      <ul>
        <li>Recent commit velocity suggests active product ownership.</li>
        <li>Background matches the partner's learned preference for infra builders.</li>
        <li>Prior failed startup is not disqualifying; the useful question is what changed.</li>
      </ul>
      <h2>Call prompts</h2>
      <ul>
        <li>Walk through the hardest scalability tradeoff in the product.</li>
        <li>Explain cost-per-workflow and how it changes at 10x usage.</li>
        <li>Name the customer who would be upset if the product disappeared.</li>
      </ul>
    `,
  });
}

function compTable(company) {
  return baseArtifact({
    kind: 'Comp table',
    company,
    verdict: 'investigate',
    read: 'Best comps support the category, but not the proposed price without clearer traction.',
    body: html`
      <h2>Relevant comps</h2>
      <ul>
        <li>Datadog: infrastructure observability, durable expansion motion.</li>
        <li>Honeycomb: developer-led observability with sharper technical buyer fit.</li>
        <li>New Relic: legacy category reference, useful for pricing ceilings.</li>
      </ul>
      <h2>What transfers</h2>
      <ul>
        <li>Technical buyer pain can compound into platform spend.</li>
        <li>Usage-based pricing only works if customers can predict cost.</li>
        <li>Developer love matters, but enterprise urgency closes the round.</li>
      </ul>
      <h2>Valuation note</h2>
      <p>Use comps to defend continued diligence, not to justify the full ask. Shadow would push for sharper traction or a lower post-money.</p>
    `,
  });
}

function dealCard(company) {
  return baseArtifact({
    kind: 'Deal card',
    company,
    verdict: 'investigate',
    read: 'Watchlist entry created with team, market, and diligence prompts.',
    body: html`
      <h2>Snapshot</h2>
      <p>${company} is now tracked as an active infrastructure opportunity.</p>
      <h2>Why it is on the list</h2>
      <ul>
        <li>Technical founder signal.</li>
        <li>Enterprise infrastructure buyer.</li>
        <li>Potential fit with the firm's prior infra thesis.</li>
      </ul>
      <h2>Needs before partner meeting</h2>
      <ul>
        <li>Customer reference notes.</li>
        <li>Burn-to-milestone plan.</li>
        <li>Founder relationship check.</li>
      </ul>
    `,
  });
}

function buildDemoArtifact(kind, company = DEFAULT_COMPANY) {
  const normalized = KIND_TO_TYPE[kind] ? kind : 'IC memo';
  const builders = {
    'IC memo': icMemo,
    'Sourcing sheet': sourcingSheet,
    'Founder background': founderBackground,
    'Comp table': compTable,
    'Deal card': dealCard,
  };
  return builders[normalized](company);
}

function createDemoArtifact({ kind, company } = {}) {
  return Artifacts.add(buildDemoArtifact(kind || 'IC memo', company || DEFAULT_COMPANY));
}

module.exports = { createDemoArtifact, buildDemoArtifact };
