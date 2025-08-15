import { EnduranceExercise } from '@/types/activityTypes';

export function enrich(list: EnduranceExercise[]): (EnduranceExercise & { tags: string[] })[] {
  return list.map(e => ({ ...e, tags: [(e.enduranceType || ''), ...(e.equipment || []), e.category, 'endurance'].filter(Boolean) }));
}

export function collectFacets(list: (EnduranceExercise & { tags: string[] })[]) {
  const facets = { type: new Set<string>(), equipment: new Set<string>(), category: new Set<string>(), tags: new Set<string>() };
  list.forEach(e => { facets.type.add('endurance'); (e.equipment||[]).forEach(eq=>facets.equipment.add(eq)); facets.category.add(e.category); (e.tags||[]).forEach((t: string)=>facets.tags.add(t)); });
  return facets;
}

export function applyFilters(list: (EnduranceExercise & { tags: string[] })[], f: any) {
  return list.filter(e => {
    if (f.search) { const q = f.search.toLowerCase(); if (!(e.name.toLowerCase().includes(q) || (e.environment||'').toLowerCase().includes(q))) return false; }
    if (f.equipment && f.equipment.size && !(e.equipment||[]).some(eq=>f.equipment.has(eq))) return false;
    if (f.includeTags && f.includeTags.size && !(e.tags||[]).some((t:string)=>f.includeTags.has(t))) return false;
    return true;
  });
}
