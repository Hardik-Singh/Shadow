// In-memory mirror of every Memory we've written. The HUD's editable memory log
// reads from here. Each entry tracks both Hyperspell resource ids so edits/
// deletes propagate to both the partner vault and the firm vault.
//
// This is intentionally lightweight — when we add real SQLite later, the public
// API here (list/get/add/update/softDelete) is what the SQLite repo will replace.

const { randomUUID } = require('crypto');

const rows = []; // newest last

function add({ partner_id, firm_id, kind, text, valence = 0, meta = {}, hs_resource_id_partner, hs_resource_id_firm }) {
  const now = Date.now();
  const row = {
    id: randomUUID(),
    partner_id,
    firm_id,
    kind,
    text,
    valence,
    meta,
    hs_resource_id_partner: hs_resource_id_partner || null,
    hs_resource_id_firm: hs_resource_id_firm || null,
    created_at: now,
    updated_at: now,
    edited: false,
    deleted: false,
  };
  rows.push(row);
  return row;
}

function setHsIds(id, { partner, firm }) {
  const row = rows.find((r) => r.id === id);
  if (!row) return null;
  if (partner) row.hs_resource_id_partner = partner;
  if (firm) row.hs_resource_id_firm = firm;
  return row;
}

function get(id) {
  return rows.find((r) => r.id === id);
}

function update(id, { text }) {
  const row = rows.find((r) => r.id === id);
  if (!row) return null;
  row.text = text;
  row.edited = true;
  row.updated_at = Date.now();
  return row;
}

function softDelete(id) {
  const row = rows.find((r) => r.id === id);
  if (!row) return null;
  row.deleted = true;
  row.updated_at = Date.now();
  return row;
}

function list({ limit = 50, partner_id, kind, includeDeleted = false } = {}) {
  let out = rows;
  if (!includeDeleted) out = out.filter((r) => !r.deleted);
  if (partner_id) out = out.filter((r) => r.partner_id === partner_id);
  if (kind) out = out.filter((r) => r.kind === kind);
  return out.slice(-limit).reverse();
}

function size() {
  return rows.filter((r) => !r.deleted).length;
}

function totalSeen() {
  return rows.length;
}

module.exports = { add, setHsIds, get, update, softDelete, list, size, totalSeen };
