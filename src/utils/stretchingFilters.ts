import { StretchingExercise } from '@/types/activityTypes';

export function enrich(list: StretchingExercise[]): (StretchingExercise & { tags: string[]; _targets: string[]; _regions: string[] })[] {
  return list.map(e => {
    const targets = (e as any).targetMuscles || (e as any).primaryMuscles || [];
    const regions = (e as any).bodyRegion || (e as any).secondaryMuscles || [];
    const equip = (e as any).equipment || [];
    const cat = (e as any).category;
    const tags = [
      ...(Array.isArray(targets) ? targets : []),
      ...(Array.isArray(regions) ? regions : []),
      ...(Array.isArray(equip) ? equip : []),
      cat,
      'flexibility'
    ].filter(Boolean);
    return { ...(e as any), tags, _targets: targets, _regions: regions };
  });
}

export function collectFacets(list: (StretchingExercise & { tags: string[]; _targets: string[]; _regions: string[] })[]) {
  const facets = { type: new Set<string>(), equipment: new Set<string>(), tags: new Set<string>() };
  list.forEach(e => {
    facets.type.add('stretching');
    (e as any).equipment?.forEach((eq: string) => facets.equipment.add(eq));
    (e.tags || []).forEach((t: string) => facets.tags.add(t));
  });
  return facets;
}

export function applyFilters(list: (StretchingExercise & { tags: string[]; _targets: string[]; _regions: string[] })[], f: any) {
  return list.filter(e => {
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = [e.name, e.description, (e as any).instructions?.join(' ')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.equipment && f.equipment.size) {
      const eq: string[] = (e as any).equipment || [];
      const required = Array.from(f.equipment) as string[];
      if (!required.every(v => eq.includes(v))) return false;
    }
    if (f.includeTags && f.includeTags.size && !(e.tags || []).some(t => f.includeTags.has(t))) return false;
    return true;
  });
}
