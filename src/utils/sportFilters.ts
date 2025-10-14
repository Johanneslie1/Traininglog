import { SportActivity } from '@/types/activityTypes';

export function enrich(list: SportActivity[]): (SportActivity & { tags: string[] })[] {
  return list.map(e => {
    // Ensure equipment is always an array
    const equipment = Array.isArray(e.equipment) ? e.equipment : (e.equipment ? [e.equipment] : []);
    const primarySkills = Array.isArray(e.primarySkills) ? e.primarySkills : (e.primarySkills ? [e.primarySkills] : []);
    return { ...e, tags: [...primarySkills, ...equipment, e.category, 'sport'].filter(Boolean) };
  });
}

export function collectFacets(list: (SportActivity & { tags: string[] })[]) {
  const facets = { type: new Set<string>(), equipment: new Set<string>(), skills: new Set<string>(), tags: new Set<string>() };
  list.forEach(e => { 
    facets.type.add('sport'); 
    // Ensure equipment is an array before calling forEach
    const equipment = Array.isArray(e.equipment) ? e.equipment : (e.equipment ? [e.equipment] : []);
    equipment.forEach((eq:string)=>facets.equipment.add(eq)); 
    // Ensure primarySkills is an array before calling forEach
    const skills = Array.isArray(e.primarySkills) ? e.primarySkills : (e.primarySkills ? [e.primarySkills] : []);
    skills.forEach((s:string)=>facets.skills.add(s)); 
    // Ensure tags is an array before calling forEach
    const tags = Array.isArray(e.tags) ? e.tags : [];
    tags.forEach((t:string)=>facets.tags.add(t)); 
  });
  return facets;
}

export function applyFilters(list: (SportActivity & { tags: string[] })[], f: any) {
  return list.filter(e => {
    if (f.search) { const q = f.search.toLowerCase(); if (!(e.name.toLowerCase().includes(q) || (e.primarySkills||[]).join(' ').toLowerCase().includes(q))) return false; }
    if (f.includeTags && f.includeTags.size && !(e.tags||[]).some((t:string)=>f.includeTags.has(t))) return false;
    return true;
  });
}
