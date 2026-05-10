import {
  Artifact,
  Company,
  Deal,
  Person,
  companies,
  deals,
  meetings,
  people,
} from '../mock/data';

export type RelationCounts = {
  artifacts: number;
  founders: number;
  meetings: number;
  teammates: number;
};

const byCompanyName = (name: string) => (a: Artifact) =>
  a.company.trim().toLowerCase() === name.trim().toLowerCase();

export function artifactsForDeal(deal: Deal, artifacts: Artifact[]): Artifact[] {
  const explicit = new Set([deal.yourArtifactId, ...deal.relatedArtifactIds].filter(Boolean));
  const seen = new Set<string>();
  return artifacts.filter((a) => {
    if (!explicit.has(a.id) && !byCompanyName(deal.company)(a)) return false;
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

export function artifactsForCompany(company: Company, artifacts: Artifact[]): Artifact[] {
  const deal = company.dealId ? dealById(company.dealId) : null;
  if (deal) return artifactsForDeal(deal, artifacts);
  return artifacts.filter(byCompanyName(company.name));
}

export function relationsForDeal(deal: Deal, artifacts: Artifact[]) {
  const company = companies.find((c) => c.dealId === deal.id || c.name === deal.company) ?? null;
  const founders = company ? company.founderIds.map(personById).filter(Boolean) as Person[] : [];
  const dealMeetings = meetings.filter((m) => m.dealId === deal.id);
  const dealArtifacts = artifactsForDeal(deal, artifacts);
  const teammateIds = new Set<string>();
  for (const v of deal.verdicts) teammateIds.add(v.teammateId);
  for (const a of dealArtifacts) {
    teammateIds.add(a.authorId);
    for (const id of a.reviewerIds) teammateIds.add(id);
  }
  return {
    company,
    founders,
    meetings: dealMeetings,
    artifacts: dealArtifacts,
    counts: {
      artifacts: dealArtifacts.length,
      founders: founders.length,
      meetings: dealMeetings.length,
      teammates: teammateIds.size,
    } satisfies RelationCounts,
  };
}

export function relationCountsForCompany(company: Company, artifacts: Artifact[]): RelationCounts {
  const companyArtifacts = artifactsForCompany(company, artifacts);
  const companyMeetings = meetings.filter((m) =>
    (company.dealId && m.dealId === company.dealId) ||
    m.attendeeIds.some((id) => company.founderIds.includes(id)),
  );
  const teammateIds = new Set<string>();
  for (const a of companyArtifacts) {
    teammateIds.add(a.authorId);
    for (const id of a.reviewerIds) teammateIds.add(id);
  }
  return {
    artifacts: companyArtifacts.length,
    founders: company.founderIds.length,
    meetings: companyMeetings.length,
    teammates: teammateIds.size,
  };
}

export function relationCountsForPerson(person: Person, artifacts: Artifact[]): RelationCounts {
  const company = person.companyId ? companies.find((c) => c.id === person.companyId) : null;
  const personMeetings = meetings.filter((m) => m.attendeeIds.includes(person.id));
  const personArtifacts = company
    ? artifactsForCompany(company, artifacts)
    : artifacts.filter((a) => a.authorId === person.teammateId || a.reviewerIds.includes(person.teammateId || ''));
  const teammateIds = new Set<string>();
  for (const a of personArtifacts) {
    teammateIds.add(a.authorId);
    for (const id of a.reviewerIds) teammateIds.add(id);
  }
  return {
    artifacts: personArtifacts.length,
    founders: company?.founderIds.length ?? 0,
    meetings: personMeetings.length,
    teammates: teammateIds.size,
  };
}

function dealById(id: string): Deal | null {
  return deals.find((d) => d.id === id) ?? null;
}

function personById(id: string) {
  return people.find((p) => p.id === id);
}
