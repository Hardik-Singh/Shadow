function slugFor(id, type) {
  const base = ('Nozomio-' + type).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const suf = h.toString(36).padStart(5, '0').slice(-5);
  return `${base}-${suf}`;
}
window.nozomioArtifactSlug = slugFor;

window.NOZOMIO_DEMO_TIMELINES = {
  stage1: [
    { atMs: 0, action: 'seeing', text: 'LinkedIn profile · Arlan Rakhmetzhanov · Nozomio founder' },
    {
      atMs: 2500,
      action: 'suggestions',
      suggestions: [
        { id: 'arlan-founder-background', label: "arlan's founder background", artifactId: 'n4', name: 'Arlan · founder background', route: '/artifact/' + slugFor('n4', 'Founder Background'), delayMs: 1200 },
        { id: 'arlan-network-paths', label: 'people who know arlan', artifactId: 'n11', name: 'Arlan · network paths', route: '/artifact/' + slugFor('n11', 'Network Map'), delayMs: 1200 },
        { id: 'nozomio-source-sheet', label: 'source sheet on nozomio', artifactId: 'n6', name: 'Nozomio · source sheet from LinkedIn', route: '/artifact/' + slugFor('n6', 'Sourcing Sheet'), delayMs: 2200 },
      ],
    },
    { atMs: 1800, action: 'chat', text: 'you seem to be looking at a new founder.' },
    { atMs: 2200, action: 'write', verb: 'profile', text: 'Arlan Rakhmetzhanov · profile viewed' },
    { atMs: 4600, action: 'write', verb: 'behavior', text: 'short linkedin skim · founder looked interesting enough to go straight to deck' },
    { atMs: 6200, action: 'chat', text: "i can pull arlan's github, x, news, cobra paper, prior startup, and firm memory." },
    { atMs: 6600, action: 'write', verb: 'cross-ref', text: 'similar to Pinecone, Modal lookups from last month' },
    { atMs: 11200, action: 'chat', text: 'i am framing this around technical depth and dev-tools infra comps.' },
    { atMs: 14500, action: 'write', verb: 'angle', text: 'technical depth · comp set: dev-tools infra' },
    { atMs: 15000, action: 'chat', text: 'click source sheet when you want me to generate it from the linkedin profile and Nia searches.' },
    { atMs: 41000, action: 'chat', text: 'also, 2 people in your network know arlan. i can surface them in the sheet.' },
  ],
  stage2: [
    { atMs: 0, action: 'seeing', text: 'Nozomio_deck.pdf · slide deck · Arlan Rakhmetzhanov' },
    { atMs: 1800, action: 'chat', text: "you opened a deck. looks like you're getting ready for an ic meeting on this one." },
    { atMs: 3000, action: 'write', verb: 'behavior', text: 'moved from linkedin to deck quickly · seems to be contemplating the deck, not just browsing profile' },
    { atMs: 5200, action: 'chat', text: 'what do you think about the deck?' },
    { atMs: 5200, action: 'awaitDeckReaction' },
  ],
};
