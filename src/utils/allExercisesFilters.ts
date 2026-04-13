import { getAllExercisesLocal, UnifiedLocalExercise } from './allExercises';

export function enrichAll(list: UnifiedLocalExercise[]) {
  return list.map(e => ({ ...e, tags: Array.isArray(e.tags) ? e.tags : [] }));
}

export function collectAllFacets(list: ReturnType<typeof enrichAll>) {
  const facets = { type: new Set<string>(), equipment: new Set<string>(), tags: new Set<string>() };
  list.forEach(e => {
    facets.type.add(e.activityType);
    (e.equipment || []).forEach(eq => facets.equipment.add(eq));
    (e.tags || []).forEach(t => facets.tags.add(t));
  });
  return facets;
}

export function applyAllFilters(list: ReturnType<typeof enrichAll>, f: any) {
  return list.filter(e => {
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = [e.name, e.description].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.type && f.type.size && !f.type.has(e.activityType)) return false;
    if (f.equipment && f.equipment.size) {
      const eq = e.equipment || [];
      const required = Array.from(f.equipment) as string[];
      if (!required.every(v => eq.includes(v))) return false;
    }
    if (f.includeTags && f.includeTags.size && !(e.tags || []).some(t => f.includeTags.has(t))) return false;
    return true;
  });
}

export function loadUnifiedEnriched() {
  const base = getAllExercisesLocal();
  const enriched = enrichAll(base);
  return { enriched, facets: collectAllFacets(enriched) };
}
