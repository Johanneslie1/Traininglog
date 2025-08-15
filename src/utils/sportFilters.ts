import { SportActivity } from '@/types/activityTypes';

export function enrich(list: SportActivity[]): (SportActivity & { tags: string[] })[] {
  return list.map(e => ({ ...e, tags: [...(e.primarySkills||[]), ...(e.equipment||[]), e.category, 'sport'].filter(Boolean) }));
}

export function collectFacets(list: (SportActivity & { tags: string[] })[]) {
  const facets = { type: new Set<string>(), equipment: new Set<string>(), skills: new Set<string>(), tags: new Set<string>() };
  list.forEach(e => { facets.type.add('sport'); (e.equipment||[]).forEach((eq:string)=>facets.equipment.add(eq)); (e.primarySkills||[]).forEach((s:string)=>facets.skills.add(s)); (e.tags||[]).forEach((t:string)=>facets.tags.add(t)); });
  return facets;
}

export function applyFilters(list: (SportActivity & { tags: string[] })[], f: any) {
  return list.filter(e => {
    if (f.search) { const q = f.search.toLowerCase(); if (!(e.name.toLowerCase().includes(q) || (e.primarySkills||[]).join(' ').toLowerCase().includes(q))) return false; }
    if (f.includeTags && f.includeTags.size && !(e.tags||[]).some((t:string)=>f.includeTags.has(t))) return false;
    return true;
  });
}
