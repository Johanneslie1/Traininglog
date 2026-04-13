import { ResistanceExercise } from '@/types/activityTypes';

export function enrich(list: ResistanceExercise[]): (ResistanceExercise & { tags: string[] })[] {
  return list.map(e => ({
    ...e,
    tags: [
      ...(e.primaryMuscles || []),
      ...(e.secondaryMuscles || []),
      ...(e.equipment || []),
      ...(e.tips || []),
      e.category,
      e.defaultUnit,
      'resistance'
    ].filter(Boolean)
  }));
}

export function collectFacets(list: ResistanceExercise[]) {
  const facets = {
    type: new Set<string>(),
    equipment: new Set<string>(),
    category: new Set<string>(),
    tags: new Set<string>()
  };
  list.forEach(e => {
    facets.type.add('resistance');
    (e.equipment || []).forEach(eq => facets.equipment.add(eq));
    facets.category.add(e.category);
    (e.primaryMuscles || []).forEach(m => facets.tags.add(m));
    (e.secondaryMuscles || []).forEach(m => facets.tags.add(m));
    (e.tips || []).forEach(t => facets.tags.add(t));
    facets.tags.add(e.defaultUnit);
  });
  return facets;
}

export function applyFilters(list: (ResistanceExercise & { tags: string[] })[], f: any): (ResistanceExercise & { tags: string[] })[] {
  return list.filter(e => {
    if (f.search) {
      const q = f.search.toLowerCase();
      if (!(e.name.toLowerCase().includes(q) || (e.instructions || []).join(' ').toLowerCase().includes(q))) return false;
    }
    if (f.equipment && f.equipment.size && !e.equipment.some(eq => f.equipment.has(eq))) return false;
    if (f.category && f.category.size && !f.category.has(e.category)) return false;
    if (f.includeTags && f.includeTags.size && !(e.tags as string[]).some((t: string) => f.includeTags.has(t))) return false;
    if (f.excludeTags && (e.tags as string[]).some((t: string) => f.excludeTags.has(t))) return false;
    return true;
  });
}
