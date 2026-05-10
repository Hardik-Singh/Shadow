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
    { atMs: 3000, action: 'chat', text: 'people at the firm have already talked to arlan — pulling the slack thread and email below.' },
    { atMs: 3500, action: 'artifact', artifactId: 'n12', name: 'Nozomio · slack thread (jin + marcus)', tag: 'PRIOR', route: '/artifact/' + slugFor('n12', 'Slack Thread') },
    { atMs: 3800, action: 'artifact', artifactId: 'n13', name: 'Nozomio · sarah ↔ arlan email', tag: 'PRIOR', route: '/artifact/' + slugFor('n13', 'Email') },
    {
      atMs: 5500,
      action: 'suggestions',
      suggestions: [
        { id: 'arlan-founder-background', label: "arlan's founder background", artifactId: 'n4', name: 'Arlan · founder background', route: '/artifact/' + slugFor('n4', 'Founder Background'), delayMs: 4000 },
        { id: 'arlan-network-paths', label: 'people who know arlan', artifactId: 'n11', name: 'Arlan · network paths', route: '/artifact/' + slugFor('n11', 'Network Map'), delayMs: 3500 },
        { id: 'nozomio-source-sheet', label: 'source sheet on nozomio', artifactId: 'n6', name: 'Nozomio · source sheet from LinkedIn', route: '/artifact/' + slugFor('n6', 'Sourcing Sheet'), delayMs: 7000 },
      ],
    },
  ],
  stage2: [
    { atMs: 0, action: 'seeing', text: 'Nozomio_deck.pdf · slide deck · Arlan Rakhmetzhanov' },
    { atMs: 5000, action: 'chat', text: 'what do you think about the deck?' },
    { atMs: 5000, action: 'awaitDeckReaction' },
  ],
};
