// Utility functions for Speed, Agility & Plyometrics exercise filtering
// Derived from speedAgility.json structure
// PROMPT BOOSTER: Implements tag derivation and multi-facet filtering (type, lateralization, equipment, semantic tags, muscle groups)

export interface SpeedAgilityExercise {
  id: string;
  name: string;
  category: string; // e.g., full-body, legs, upper-body
  type: string; // sprint | agility | plyometric
  lateralization: string; // unilateral | bilateral
  equipment: string; // bodyweight | box | cones | ladder | hurdle | other | dumbbell
  muscleGroups: string[];
  instructions: string;
  tags?: string[];
}

// Patterns to infer semantic tags from exercise names
const NAME_TAG_RULES: Array<[RegExp, string]> = [
  [/jump/i, 'jump'],
  [/sprint/i, 'sprint'],
  [/skip/i, 'skip'],
  [/bound/i, 'bound'],
  [/shuffle/i, 'shuffle'],
  [/hurdle/i, 'hurdle'],
  [/ladder/i, 'ladder'],
  [/sled/i, 'sled'],
  [/reaction|reactive/i, 'reaction'],
  [/start/i, 'start'],
  [/accel|flying|build-up|build up|ins and outs|rolling/i, 'acceleration'],
  [/decel|stop/i, 'deceleration'],
  [/crossover/i, 'crossover'],
  [/parachute/i, 'parachute'],
  [/box/i, 'box'],
  [/medicine ball|med ball|ball slam|chest pass/i, 'medicine-ball'],
  [/figure 8|figure-8/i, 'figure-8'],
  [/hexagon|hex/i, 'hex'],
  [/wicket/i, 'wicket'],
  [/mirror/i, 'mirror'],
  [/assisted/i, 'assisted'],
  [/resisted|resisted sprint|partner-resisted/i, 'resisted'],
  [/depth/i, 'depth'],
  [/tuck/i, 'tuck'],
  [/pogo/i, 'pogo'],
  [/ankle|ankling/i, 'ankle'],
];

function norm(str: unknown): string {
  if (str == null) return '';
  if (typeof str === 'string') return str.toLowerCase().replace(/\s+/g, '-');
  try { 
    return String(str).toLowerCase().replace(/\s+/g, '-'); 
  } catch { 
    return ''; 
  }
}

export function deriveTags(e: SpeedAgilityExercise): string[] {
  const tags = new Set<string>();

  // Base structural facets
  tags.add(norm(e.type)); // sprint | agility | plyometric
  tags.add(norm(e.lateralization)); // unilateral | bilateral
  tags.add(norm(e.category));
  tags.add('speed-agility-plyometrics');

  // Equipment normalization
  const equipNorm = norm(e.equipment);
  tags.add(equipNorm);

  // Name based tags
  NAME_TAG_RULES.forEach(([re, t]) => { if (re.test(e.name)) tags.add(t); });

  // Semantic grouping
  if (tags.has('jump')) {
    tags.add('power');
    if (e.lateralization === 'unilateral') tags.add('unilateral-jump');
    if (e.lateralization === 'bilateral') tags.add('bilateral-jump');
  }
  if (['plyometric', 'sprint'].some(t => tags.has(t))) tags.add('explosive');
  if (/resisted|sled|parachute|band/.test(e.name.toLowerCase())) tags.add('resisted');
  if (/assisted|downhill/.test(e.name.toLowerCase())) tags.add('assisted');
  if (/reaction|mirror|ball drop/.test(e.name.toLowerCase())) tags.add('reaction');
  if (/accel|start|flying|build-up|rolling|ins and outs/i.test(e.name)) tags.add('acceleration');

  return Array.from(tags);
}

export interface FilterState {
  search?: string;
  includeTags?: Set<string>;
  excludeTags?: Set<string>;
  equipment?: Set<string>;
  muscleGroups?: Set<string>;
  lateralization?: Set<string>;
  type?: Set<string>;
}

export function enrich(list: SpeedAgilityExercise[]): SpeedAgilityExercise[] {
  return list.map(e => ({ ...e, tags: deriveTags(e) }));
}

export function applyFilters(list: SpeedAgilityExercise[], f: FilterState): SpeedAgilityExercise[] {
  return list.filter(e => {
    if (f.search) {
      const q = f.search.toLowerCase();
      if (!(e.name.toLowerCase().includes(q) || e.instructions.toLowerCase().includes(q))) return false;
    }
    if (f.type && f.type.size && !f.type.has(norm(e.type))) return false;
    if (f.lateralization && f.lateralization.size && !f.lateralization.has(norm(e.lateralization))) return false;
    if (f.equipment && f.equipment.size && !f.equipment.has(norm(e.equipment))) return false;
    if (f.muscleGroups && f.muscleGroups.size && !e.muscleGroups.some(m => f.muscleGroups!.has(norm(m)))) return false;
    if (f.includeTags && f.includeTags.size && !e.tags!.some(t => f.includeTags!.has(t))) return false;
    if (f.excludeTags && e.tags!.some(t => f.excludeTags!.has(t))) return false;
    return true;
  });
}

export function collectFacets(list: SpeedAgilityExercise[]) {
  const facets = {
    type: new Set<string>(),
    lateralization: new Set<string>(),
    equipment: new Set<string>(),
    muscleGroups: new Set<string>(),
    tags: new Set<string>()
  };
  list.forEach(e => {
    facets.type.add(norm(e.type));
    facets.lateralization.add(norm(e.lateralization));
    facets.equipment.add(norm(e.equipment));
    e.muscleGroups.forEach(m => facets.muscleGroups.add(norm(m)));
    e.tags?.forEach(t => facets.tags.add(t));
  });
  return facets;
}
