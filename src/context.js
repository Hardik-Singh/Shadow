// Single-tenant runtime context. The HUD always runs as exactly one Partner
// inside one Firm. Everything else (teammate fixtures, firm-brain queries) is
// derived from this anchor.

const config = require('./config');

const FIRM = {
  id: process.env.SHADOW_FIRM_ID || 'acme_vc',
  name: process.env.SHADOW_FIRM_NAME || 'Acme Ventures',
  mode: 'VC',
};

const ME = {
  id: process.env.SHADOW_PARTNER_ID || config.hyperspell.userId || 'me',
  firm_id: FIRM.id,
  name: process.env.SHADOW_PARTNER_NAME || 'You',
  initials: 'YO',
  role: 'Partner',
  hue: 270,
  is_me: true,
};

// Seeded teammate fixtures — get their own Hyperspell users at first boot.
// Same ids/avatars the dashboard mock already expects.
const TEAMMATES = [
  { id: 'sk', firm_id: FIRM.id, name: 'Sarah K.',  initials: 'SK', role: 'Partner',         hue: 18,  is_me: false },
  { id: 'jp', firm_id: FIRM.id, name: 'Jin P.',    initials: 'JP', role: 'Partner',         hue: 200, is_me: false },
  { id: 'mt', firm_id: FIRM.id, name: 'Marcus T.', initials: 'MT', role: 'Analyst',         hue: 150, is_me: false },
  { id: 'lr', firm_id: FIRM.id, name: 'Linda R.',  initials: 'LR', role: 'Partner (emer.)', hue: 320, is_me: false },
  { id: 'hc', firm_id: FIRM.id, name: 'Henry C.',  initials: 'HC', role: 'Partner (emer.)', hue: 80,  is_me: false },
];

const ALL_PARTNERS = [ME, ...TEAMMATES];

function partnerById(id) {
  return ALL_PARTNERS.find((p) => p.id === id);
}

module.exports = { FIRM, ME, TEAMMATES, ALL_PARTNERS, partnerById };
