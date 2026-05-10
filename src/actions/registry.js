const handlers = new Map();

function register(action) {
  handlers.set(action.id, action);
}

function get(id) {
  return handlers.get(id);
}

function list() {
  return Array.from(handlers.values()).map((a) => ({
    id: a.id,
    label: a.label,
    triggers: a.triggers || [],
    docTypes: a.docTypes || [],
    intents: a.intents || [],
    entityTypes: a.entityTypes || [],
  }));
}

async function run(actionId, ctx) {
  const a = handlers.get(actionId);
  if (!a) throw new Error(`unknown action ${actionId}`);
  return a.run(ctx);
}

module.exports = { register, get, list, run };
