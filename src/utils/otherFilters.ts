import { OtherActivity } from '@/types/activityTypes';

export function enrich(list: OtherActivity[]): (OtherActivity & { tags: string[] })[] {
  return list.map(e => ({ ...e, tags: [e.customCategory, ...(Object.keys(e.customFields||{})), e.category, 'other'].filter(Boolean) }));
}

export function collectFacets(list: (OtherActivity & { tags: string[] })[]) {
  const facets = { type: new Set<string>(), categories: new Set<string>(), tags: new Set<string>() };
  list.forEach(e => { facets.type.add('other'); facets.categories.add(e.customCategory || e.category); (e.tags||[]).forEach((t:string)=>facets.tags.add(t)); });
  return facets;
}

export function applyFilters(list: (OtherActivity & { tags: string[] })[], f: any) {
  return list.filter(e => {
    if (f.search) { const q = f.search.toLowerCase(); if (!(e.name.toLowerCase().includes(q) || (e.instructions||[]).join(' ').toLowerCase().includes(q))) return false; }
    if (f.includeTags && f.includeTags.size && !(e.tags||[]).some((t:string)=>f.includeTags.has(t))) return false;
    return true;
  });
}
