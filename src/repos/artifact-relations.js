const KNOWN_COMPANIES = {
  'acme inc': {
    id: 'company:acme-inc',
    dealId: 'd1',
    people: [
      { id: 'person:james-chen', label: 'James Chen' },
      { id: 'person:priya-iyer', label: 'Priya Iyer' },
    ],
  },
  'mira health': {
    id: 'company:mira-health',
    dealId: 'd2',
    people: [
      { id: 'person:aisha-rao', label: 'Dr. Aisha Rao' },
      { id: 'person:mark-levin', label: 'Mark Levin' },
    ],
  },
  'helix compute': {
    id: 'company:helix-compute',
    dealId: 'd3',
    people: [
      { id: 'person:anya-volkov', label: 'Anya Volkov' },
      { id: 'person:raj-patel', label: 'Raj Patel' },
    ],
  },
  'volt ai': { id: 'company:volt-ai', dealId: 'd4', people: [{ id: 'person:cole-reyes', label: 'Cole Reyes' }] },
  'vector sec': {
    id: 'company:vector-sec',
    dealId: 'd5',
    people: [
      { id: 'person:priya-shah', label: 'Priya Shah' },
      { id: 'person:alex-tran', label: 'Alex Tran' },
    ],
  },
  nozomio: {
    id: 'company:nozomio',
    dealId: 'd6',
    people: [{ id: 'person:arlan-rakhmetzhanov', label: 'Arlan Rakhmetzhanov' }],
  },
};

function slug(value) {
  return String(value || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown';
}

function relation(type, id, label, source = 'inferred') {
  return { type, id, label, source };
}

function buildRelations({ company, kind, authorId, reviewerIds = [] } = {}) {
  const out = [];
  const label = company || 'untitled';
  const known = KNOWN_COMPANIES[label.trim().toLowerCase()];
  out.push(relation('company', known?.id || `company:${slug(label)}`, label));
  if (known?.dealId) out.push(relation('deal', known.dealId, label));
  for (const person of known?.people || []) out.push(relation('person', person.id, person.label));
  if (kind) out.push(relation('artifact-kind', `artifact-kind:${slug(kind)}`, kind));
  if (authorId) out.push(relation('teammate', authorId, authorId, 'author'));
  for (const id of reviewerIds) out.push(relation('teammate', id, id, 'reviewer'));
  return dedupeRelations(out);
}

function dedupeRelations(relations = []) {
  const seen = new Set();
  return relations.filter((r) => {
    if (!r || !r.type || !r.id) return false;
    const key = `${r.type}:${r.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeRelations(...buckets) {
  return dedupeRelations(buckets.flat().filter(Boolean));
}

module.exports = { buildRelations, dedupeRelations, mergeRelations };
