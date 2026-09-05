import {
  inferExerciseFactorCategory,
  type ExerciseFactorCategory,
} from '@/data/exerciseFactors';
import {
  normalizeExerciseLookupName,
  resolveExerciseNameAlias,
} from '@/data/exerciseNameAliases';
import { inferMovementPatterns } from '@/data/movementPatterns';
import type { Exercise } from '@/types/exercise';
import type { DimExerciseRow } from '@/types/powerBiExport';

const DISPLAY_NAME_FIXES = new Map<string, string>([
  ['uprigth row', 'Upright Row'],
]);

export const normalizeExerciseDisplayName = (name: string): string => {
  const trimmed = name.trim();
  return DISPLAY_NAME_FIXES.get(trimmed.toLowerCase()) ?? trimmed;
};

export const toPowerBiExerciseSlug = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const toExerciseId = (name: string, activityType: string): string => {
  const base = toPowerBiExerciseSlug(name);
  const type = toPowerBiExerciseSlug(activityType || 'unknown');
  return type ? `${base}__${type}` : base;
};

export const pipeJoin = (values?: readonly string[] | string): string => {
  if (Array.isArray(values)) {
    return values.map((value) => String(value).trim()).filter(Boolean).join('|');
  }
  return String(values ?? '').trim();
};

const emptyDimRow = (
  name: string,
  activityType: string,
  exerciseType = ''
): DimExerciseRow => ({
  exercise_id: toExerciseId(name, activityType),
  exercise_name: name,
  exercise_type: exerciseType,
  activity_type: activityType,
  catalog_id: '',
  is_custom: false,
  in_catalog: false,
  category: '',
  difficulty: '',
  primary_muscles: '',
  secondary_muscles: '',
  equipment: '',
  laterality: 'unknown',
  exercise_factor_category: '',
  primary_movement_pattern: '',
  secondary_movement_pattern: '',
});

const resolveFactorCategory = (
  name: string,
  category?: string,
  type?: string,
  stored?: ExerciseFactorCategory
): string => stored ?? inferExerciseFactorCategory(name, category, type);

export const mapCatalogExerciseToDimRow = (exercise: Exercise): DimExerciseRow => {
  const name = normalizeExerciseDisplayName(exercise.name || '');
  const activityType = String(exercise.activityType || 'unknown');
  const patterns = inferMovementPatterns({
    name,
    catalogId: exercise.id,
    activityType,
    category: exercise.category,
    type: exercise.type,
    laterality: exercise.laterality,
    primaryMovementPattern: exercise.primaryMovementPattern,
    secondaryMovementPattern: exercise.secondaryMovementPattern,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
  });

  return {
    ...emptyDimRow(name, activityType, String(exercise.type ?? '')),
    catalog_id: exercise.id || '',
    is_custom: exercise.customExercise === true,
    in_catalog: true,
    category: exercise.category || '',
    difficulty: exercise.difficulty || '',
    primary_muscles: pipeJoin(exercise.primaryMuscles),
    secondary_muscles: pipeJoin(exercise.secondaryMuscles),
    equipment: pipeJoin(exercise.equipment),
    laterality: patterns.laterality,
    exercise_factor_category: resolveFactorCategory(
      name,
      exercise.category,
      exercise.type,
      exercise.exerciseFactorCategory
    ),
    primary_movement_pattern: patterns.primary,
    secondary_movement_pattern: patterns.secondary,
  };
};

export const catalogLookupKey = (name: string, activityType: string): string =>
  `${String(activityType || 'unknown')}::${normalizeExerciseLookupName(name)}`;

export const indexCatalogExercises = (exercises: Exercise[]): Map<string, Exercise> => {
  const index = new Map<string, Exercise>();
  exercises.forEach((exercise) => {
    if (!exercise.name?.trim()) {
      return;
    }
    const key = catalogLookupKey(exercise.name, String(exercise.activityType || 'unknown'));
    if (!index.has(key)) {
      index.set(key, exercise);
    }
  });
  return index;
};

export const findCatalogExercise = (
  name: string,
  activityType: string,
  catalogIndex: Map<string, Exercise>
): Exercise | undefined => {
  const lookupName = resolveExerciseNameAlias(name);
  return (
    catalogIndex.get(catalogLookupKey(lookupName, activityType)) ??
    catalogIndex.get(catalogLookupKey(name, activityType))
  );
};

export const mapLoggedExerciseToDimRow = (
  input: {
    name: string;
    activityType: string;
    exerciseType?: string;
  },
  catalogExercise?: Exercise
): DimExerciseRow => {
  const name = normalizeExerciseDisplayName(input.name);
  const activityType = input.activityType || 'unknown';

  if (catalogExercise) {
    return {
      ...mapCatalogExerciseToDimRow(catalogExercise),
      exercise_id: toExerciseId(name, activityType),
      exercise_name: name,
      exercise_type: input.exerciseType || String(catalogExercise.type ?? ''),
      activity_type: activityType,
    };
  }

  const patterns = inferMovementPatterns({
    name,
    activityType,
    type: input.exerciseType,
  });

  return {
    ...emptyDimRow(name, activityType, input.exerciseType || ''),
    laterality: patterns.laterality,
    exercise_factor_category: inferExerciseFactorCategory(name, undefined, input.exerciseType),
    primary_movement_pattern: patterns.primary,
    secondary_movement_pattern: patterns.secondary,
  };
};

export const mergeDimExerciseRows = (
  catalogRows: DimExerciseRow[],
  loggedRows: DimExerciseRow[]
): DimExerciseRow[] => {
  const seen = new Map<string, DimExerciseRow>();

  catalogRows.forEach((row) => {
    if (!row.exercise_id || !row.exercise_name) {
      return;
    }
    if (!seen.has(row.exercise_id)) {
      seen.set(row.exercise_id, row);
    }
  });

  loggedRows.forEach((row) => {
    if (!row.exercise_id || !row.exercise_name) {
      return;
    }
    if (!seen.has(row.exercise_id)) {
      seen.set(row.exercise_id, row);
    }
  });

  return Array.from(seen.values()).sort((left, right) =>
    left.exercise_name.localeCompare(right.exercise_name)
  );
};
