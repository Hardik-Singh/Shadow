// Reasoning loop entry point.
//
// Wires registered agents through observe → hypothesize → updateBelief on
// every tick. Tick is driven by src/proactive/scheduler.js.

const registry = require('./registry');
const beliefs = require('../repos/beliefs');

function buildObservation({ MemoryRepo, suggest }) {
  let recentMemory = [];
  try { recentMemory = MemoryRepo.list({ limit: 30 }) || []; } catch {}
  const lastCaption = (suggest && typeof suggest.getLastScreen === 'function')
    ? suggest.getLastScreen() : '';
  const lastSuggestions = (suggest && typeof suggest.getLastSuggestions === 'function')
    ? suggest.getLastSuggestions() : [];
  return { recentMemory, lastCaption, lastSuggestions, now: Date.now() };
}

async function tickAll(deps, { bus } = {}) {
  const obs = buildObservation(deps);
  const results = [];
  for (const agent of registry.list()) {
    try {
      const updated = await agent.tick(obs);
      results.push({ agent_id: agent.id, updated });
      if (bus && updated && updated.length) {
        const t = agent.top(1)[0];
        if (t) bus.emit('beliefs:updated', { agent_id: agent.id, top: t });
      }
    } catch (err) {
      console.warn(`[reason] ${agent.id} failed`, err && err.message);
    }
  }
  return results;
}

module.exports = { registry, beliefs, tickAll, buildObservation };
