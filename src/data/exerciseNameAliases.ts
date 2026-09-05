/**
 * Curated logged-name → catalog-name aliases for Power BI dim matching.
 * Keys and values are normalized with normalizeExerciseLookupName().
 * Do not add fuzzy/partial matches here — only known exact synonyms.
 */
export const EXERCISE_NAME_ALIASES: Record<string, string> = {
  squat: 'squats',
  'back squat': 'squats',
  'barbell squat': 'squats',
  'barbell back squat': 'squats',
  bench: 'bench press',
  'bb bench': 'bench press',
  'barbell bench': 'bench press',
  'barbell bench press': 'bench press',
  dl: 'deadlift',
  'conventional deadlift': 'deadlift',
  rdl: 'romanian deadlift',
  'romanian dl': 'romanian deadlift',
  ohp: 'overhead press',
  'military press': 'overhead press',
  'shoulder press': 'overhead press',
  'pull up': 'pull ups',
  pullup: 'pull ups',
  pullups: 'pull ups',
  'chin up': 'chin ups',
  chinup: 'chin ups',
  chinups: 'chin ups',
  'push up': 'push ups',
  pushup: 'push ups',
  pushups: 'push ups',
};

export const normalizeExerciseLookupName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const resolveExerciseNameAlias = (name: string): string => {
  const normalized = normalizeExerciseLookupName(name);
  return EXERCISE_NAME_ALIASES[normalized] ?? normalized;
};
