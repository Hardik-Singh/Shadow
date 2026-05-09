// MemoryRepo — the only path that creates a Memory.
// Every call:
//   1. inserts into the in-memory store (sync)
//   2. emits `memory:write` on the bus (HUD live feed renders this)
//   3. queues a Hyperspell mirror to BOTH partner and firm vaults
//   4. backfills hs_resource_id_partner/firm onto the row when the mirror lands

const bus = require('../bus');
const queue = require('../ingest/queue');
const hs = require('../ingest/hyperspell');
const store = require('../store/memory-store');
const ctx = require('../context');

function create({ kind, text, valence = 0, meta = {}, partner = ctx.ME, firm = ctx.FIRM }) {
  const trimmed = (text || '').toString().trim();
  if (!trimmed) return null;
  const row = store.add({
    partner_id: partner.id,
    firm_id: firm.id,
    kind,
    text: trimmed,
    valence,
    meta,
  });
  bus.emit('memory:write', { entry: rowForBus(row) });

  // Mirror to Hyperspell — both vaults in parallel.
  queue.enqueue(`memory:${kind}`, async () => {
    const ids = await hs.addMemory({
      partner, firm,
      text: trimmed,
      kind,
      valence,
      sqlId: row.id,
      ts: row.created_at,
      dealId: meta.deal_id,
      companyHint: meta.company_hint,
      fileName: meta.file_name,
      chunkIdx: meta.chunk_idx,
      chunkTotal: meta.chunk_total,
    });
    store.setHsIds(row.id, { partner: ids.hs_resource_id_partner, firm: ids.hs_resource_id_firm });
    bus.emit('memory:indexed', { id: row.id, ...ids });
  });

  return row;
}

function update(id, { text }) {
  const row = store.update(id, { text });
  if (!row) return null;
  bus.emit('memory:edit', { entry: rowForBus(row) });
  queue.enqueue('memory:update', () =>
    hs.updateMemory({
      partner: ctx.partnerById(row.partner_id) || ctx.ME,
      firm: ctx.FIRM,
      partnerResourceId: row.hs_resource_id_partner,
      firmResourceId: row.hs_resource_id_firm,
      text,
      kind: row.kind,
      valence: row.valence,
      sqlId: row.id,
      dealId: row.meta && row.meta.deal_id,
      companyHint: row.meta && row.meta.company_hint,
    })
  );
  return row;
}

function remove(id) {
  const row = store.softDelete(id);
  if (!row) return null;
  bus.emit('memory:delete', { id, partner_id: row.partner_id });
  queue.enqueue('memory:delete', () =>
    hs.tombstoneMemory({
      partner: ctx.partnerById(row.partner_id) || ctx.ME,
      firm: ctx.FIRM,
      partnerResourceId: row.hs_resource_id_partner,
      firmResourceId: row.hs_resource_id_firm,
    })
  );
  return row;
}

function list(opts) {
  return store.list(opts).map(rowForBus);
}

function rowForBus(row) {
  return {
    id: row.id,
    partner_id: row.partner_id,
    kind: row.kind,
    text: row.text,
    valence: row.valence,
    created_at: row.created_at,
    updated_at: row.updated_at,
    edited: row.edited,
    deleted: row.deleted,
    hs_indexed: Boolean(row.hs_resource_id_partner && row.hs_resource_id_firm),
  };
}

module.exports = { create, update, remove, list };
