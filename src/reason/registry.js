// Reasoning agent registry — mirrors src/actions/registry.js.

const agents = new Map();

function register(agent) {
  if (!agent || !agent.id) throw new Error('reason/registry: agent.id required');
  agents.set(agent.id, agent);
}

function list() { return Array.from(agents.values()); }
function get(id) { return agents.get(id); }
function clear() { agents.clear(); }

module.exports = { register, list, get, clear };
