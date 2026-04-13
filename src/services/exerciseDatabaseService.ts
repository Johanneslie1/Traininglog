import { Exercise, MuscleGroup } from '../types/exercise';
import { ActivityType } from '../types/activityTypes';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

type ExerciseType = Exercise['type'];

type ActivityDatasetMeta = {
  categories?: Record<string, { name: string; description: string; icon: string }>;
  metadata?: unknown;
};

const DEFAULT_UNITS: Record<ActivityType, Exercise['defaultUnit']> = {
  [ActivityType.RESISTANCE]: 'kg',
  [ActivityType.ENDURANCE]: 'distance',
  [ActivityType.SPORT]: 'time',
  [ActivityType.STRETCHING]: 'time',
  [ActivityType.SPEED_AGILITY]: 'time',
  [ActivityType.OTHER]: 'time'
};

const ACTIVITY_TYPE_ORDER: ActivityType[] = [
  ActivityType.RESISTANCE,
  ActivityType.ENDURANCE,
  ActivityType.SPORT,
  ActivityType.STRETCHING,
  ActivityType.SPEED_AGILITY,
  ActivityType.OTHER
];

const MUSCLE_ALIASES: Record<string, string> = {
  pectorals: 'chest',
  deltoids: 'shoulders',
  abs: 'core',
  abdominals: 'core',
  lats: 'lats',
  latissimus: 'lats',
  traps: 'traps',
  trapezius: 'traps',
  gluteus: 'glutes',
  quadricep: 'quadriceps',
  quadriceps: 'quadriceps',
  hamstring: 'hamstrings',
  calf: 'calves',
  forearm: 'forearms',
  bicep: 'biceps',
  tricep: 'triceps',
  'lower back': 'lower_back',
  lower_back: 'lower_back',
  'hip flexors': 'hip_flexors',
  hip_flexors: 'hip_flexors',
  fullbody: 'full_body',
  'full body': 'full_body'
};

const emptyExerciseMap = (): Record<ActivityType, Exercise[]> => ({
  [ActivityType.RESISTANCE]: [],
  [ActivityType.ENDURANCE]: [],
  [ActivityType.SPORT]: [],
  [ActivityType.STRETCHING]: [],
  [ActivityType.SPEED_AGILITY]: [],
  [ActivityType.OTHER]: []
});

const cachedExercisesByType: Partial<Record<ActivityType, Exercise[]>> = {};
const loadingExercisesByType: Partial<Record<ActivityType, Promise<Exercise[]>>> = {};
const cachedDatasetMetaByType: Partial<Record<ActivityType, ActivityDatasetMeta>> = {};

const readDatasetMeta = (datasetModule: unknown): ActivityDatasetMeta => {
  const moduleRecord = datasetModule as { categories?: ActivityDatasetMeta['categories']; metadata?: unknown };
  return {
    categories: moduleRecord.categories,
    metadata: moduleRecord.metadata,
  };
};

function normalizeActivityTypeFromValue(value: string): ActivityType | undefined {
  const normalized = value.trim().replace(/^['"]+|['"]+$/g, '').toLowerCase();

  switch (normalized) {
    case ActivityType.RESISTANCE:
    case 'strength':
    case 'bodyweight':
    case 'plyometric':
    case 'plyometrics':
      return ActivityType.RESISTANCE;
    case ActivityType.ENDURANCE:
    case 'cardio':
      return ActivityType.ENDURANCE;
    case ActivityType.SPORT:
    case 'team_sports':
    case 'teamsports':
      return ActivityType.SPORT;
    case ActivityType.STRETCHING:
    case 'flexibility':
      return ActivityType.STRETCHING;
    case ActivityType.SPEED_AGILITY:
    case 'speed_agility':
    case 'speedagility':
      return ActivityType.SPEED_AGILITY;
    case ActivityType.OTHER:
    case 'outdoor':
      return ActivityType.OTHER;
    default:
      return undefined;
  }
}

const normalizeExerciseName = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'exercise';

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
};

const normalizeCategory = (value: unknown, fallback: string): string => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || fallback;
};

const normalizeEquipment = (value: unknown): string[] =>
  toArray(value).map((item) => item.toLowerCase());

const normalizeMuscles = (value: unknown): MuscleGroup[] =>
  toArray(value).map((rawMuscle) => {
    const normalized = rawMuscle.toLowerCase().replace(/\s+/g, ' ').trim();
    return (MUSCLE_ALIASES[normalized] || normalized.replace(/\s+/g, '_')) as MuscleGroup;
  });

const normalizeExerciseType = (value: unknown, activityType: ActivityType): ExerciseType => {
  const normalized = String(value || '').trim().toLowerCase();

  switch (normalized) {
    case 'strength':
    case 'bodyweight':
    case 'plyometric':
    case 'plyometrics':
      return activityType === ActivityType.RESISTANCE ? normalized as ExerciseType : 'strength';
    case 'cardio':
      return activityType === ActivityType.ENDURANCE ? 'endurance' : 'cardio';
    case 'endurance':
      return 'endurance';
    case 'flexibility':
      return 'flexibility';
    case 'teamsports':
    case 'team_sports':
    case 'team-sports':
      return 'teamSports';
    case 'speedagility':
    case 'speed_agility':
    case 'speed-agility':
      return 'speedAgility';
    case 'other':
      return 'other';
    default:
      switch (activityType) {
        case ActivityType.RESISTANCE:
          return 'strength';
        case ActivityType.ENDURANCE:
          return 'endurance';
        case ActivityType.SPORT:
          return 'teamSports';
        case ActivityType.STRETCHING:
          return 'flexibility';
        case ActivityType.SPEED_AGILITY:
          return 'speedAgility';
        case ActivityType.OTHER:
        default:
          return 'other';
      }
  }
};

const getDefaultMetrics = (activityType: ActivityType): Required<NonNullable<Exercise['metrics']>> => {
  switch (activityType) {
    case ActivityType.RESISTANCE:
      return {
        trackWeight: true,
        trackReps: true,
        trackSets: true,
        trackTime: false,
        trackDistance: false,
        trackRPE: true,
        trackDuration: false,
        trackHeight: false,
        trackPower: false,
        trackIntensity: false,
        trackIncline: false,
        trackElevation: false,
        trackFloors: false
      };
    case ActivityType.ENDURANCE:
      return {
        trackWeight: false,
        trackReps: false,
        trackSets: false,
        trackTime: true,
        trackDistance: true,
        trackRPE: true,
        trackDuration: true,
        trackHeight: false,
        trackPower: false,
        trackIntensity: false,
        trackIncline: false,
        trackElevation: true,
        trackFloors: false
      };
    case ActivityType.SPORT:
    case ActivityType.STRETCHING:
    case ActivityType.SPEED_AGILITY:
    case ActivityType.OTHER:
    default:
      return {
        trackWeight: false,
        trackReps: true,
        trackSets: true,
        trackTime: true,
        trackDistance: false,
        trackRPE: true,
        trackDuration: true,
        trackHeight: false,
        trackPower: false,
        trackIntensity: false,
        trackIncline: false,
        trackElevation: false,
        trackFloors: false
      };
  }
};

const buildStableId = (
  sourcePrefix: string,
  activityType: ActivityType,
  name: string,
  rawId?: unknown,
  preserveRawId = false
): string => {
  const provided = String(rawId || '').trim();
  if (provided && preserveRawId) {
    return provided;
  }

  if (provided) {
    return `${sourcePrefix}-${slugify(provided)}`;
  }

  return `${activityType}-${slugify(name)}`;
};

const normalizeExerciseRecord = (
  input: any,
  fallbackActivityType: ActivityType,
  sourcePrefix: string,
  preserveRawId = false
): Exercise => {
  const name = String(input?.name || '').trim();
  const activityType =
    normalizeActivityTypeFromValue(String(input?.activityType || '')) ||
    normalizeActivityTypeFromValue(String(input?.type || '')) ||
    fallbackActivityType;
  const type = normalizeExerciseType(input?.type, activityType);
  const defaultMetrics = getDefaultMetrics(activityType);
  const inputMetrics = (input?.metrics || {}) as NonNullable<Exercise['metrics']>;

  const normalizedName = name || 'Unnamed Exercise';
  const id = buildStableId(sourcePrefix, activityType, normalizedName, input?.id, preserveRawId);

  return {
    id,
    name: normalizedName,
    nameLower: normalizeExerciseName(normalizedName),
    description: String(input?.description || '').trim(),
    type,
    activityType,
    category: normalizeCategory(input?.category, activityType === ActivityType.RESISTANCE ? 'compound' : 'general'),
    difficulty: (String(input?.difficulty || '').toLowerCase() as Exercise['difficulty']) || 'intermediate',
    equipment: normalizeEquipment(input?.equipment),
    instructions: toArray(input?.instructions),
    tips: toArray(input?.tips),
    tags: toArray(input?.tags),
    isDefault: input?.isDefault !== undefined ? Boolean(input?.isDefault) : true,
    createdBy: String(input?.createdBy || 'system'),
    primaryMuscles: normalizeMuscles(input?.primaryMuscles),
    secondaryMuscles: normalizeMuscles(input?.secondaryMuscles),
    targetAreas: toArray(input?.targetAreas),
    primaryMetrics: toArray(input?.primaryMetrics),
    optionalMetrics: toArray(input?.optionalMetrics),
    skills: toArray(input?.skills),
    defaultUnit: (input?.defaultUnit as Exercise['defaultUnit']) || DEFAULT_UNITS[activityType],
    metrics: {
      ...defaultMetrics,
      ...inputMetrics
    },
    teamBased: Boolean(input?.teamBased),
    sportType: input?.sportType,
    drillType: input?.drillType,
    space: input?.space,
    environment: input?.environment,
    setup: toArray(input?.setup),
    userId: input?.userId
  };
};

function convertToExercise(jsonExercise: any, fallbackActivityType?: ActivityType): Exercise {
  return normalizeExerciseRecord(
    jsonExercise,
    fallbackActivityType || ActivityType.OTHER,
    'builtin',
    true
  );
}

const withNormalizedName = (exercise: Exercise): Exercise => ({
  ...exercise,
  nameLower: exercise.nameLower || normalizeExerciseName(exercise.name)
});

const dedupeExercises = (exercises: Exercise[]): Exercise[] => {
  const deduped: Exercise[] = [];
  const byId = new Set<string>();
  const byNameAndType = new Set<string>();

  exercises.forEach((exercise) => {
    if (!exercise?.name) {
      return;
    }

    const normalizedExercise = withNormalizedName(exercise);
    const nameKey = `${normalizedExercise.activityType}::${normalizedExercise.nameLower}`;

    if (normalizedExercise.id && byId.has(normalizedExercise.id)) {
      return;
    }

    if (byNameAndType.has(nameKey)) {
      return;
    }

    if (normalizedExercise.id) {
      byId.add(normalizedExercise.id);
    }
    byNameAndType.add(nameKey);
    deduped.push(normalizedExercise);
  });

  return deduped;
};

const mapFirestoreExercise = (exerciseId: string, data: any): Exercise => {
  return normalizeExerciseRecord(
    {
      ...data,
      id: exerciseId,
      createdBy: data.createdBy || 'system',
      isDefault: data.isDefault ?? false,
    },
    normalizeActivityTypeFromValue(String(data.activityType || '')) || ActivityType.OTHER,
    'firestore',
    true
  );
};

const loadFirestoreExercises = async (
  collectionName: 'globalExercises' | 'exercises',
  activityType: ActivityType,
  userId?: string
): Promise<Exercise[]> => {
  const base = collection(db, collectionName);
  const constraints = [where('activityType', '==', activityType)];

  if (collectionName === 'exercises' && userId) {
    constraints.push(where('userId', '==', userId));
  }

  const snapshot = await getDocs(query(base, ...constraints));
  return snapshot.docs.map((exerciseDoc) => mapFirestoreExercise(exerciseDoc.id, exerciseDoc.data()));
};

const loadExerciseDatasetForActivityType = async (activityType: ActivityType): Promise<Exercise[]> => {
  if (activityType === ActivityType.RESISTANCE) {
    const [curatedModule, legacyModule, resistanceJsonModule] = await Promise.all([
      import('../data/exercises'),
      import('../data/importedExercises'),
      import('../data/exercises/resistance.json'),
    ]);

    const curatedExercises = Array.isArray(curatedModule.allExercises)
      ? curatedModule.allExercises.map((exercise) =>
          normalizeExerciseRecord(exercise, ActivityType.RESISTANCE, 'resistance-curated')
        )
      : [];

    const resistanceJson = Array.isArray(resistanceJsonModule.default)
      ? resistanceJsonModule.default.map((exercise) =>
          normalizeExerciseRecord(exercise, ActivityType.RESISTANCE, 'resistance-json', true)
        )
      : [];

    const legacyExercises = Array.isArray(legacyModule.importedExercises)
      ? legacyModule.importedExercises.map((exercise) =>
          normalizeExerciseRecord(exercise, ActivityType.RESISTANCE, 'resistance-legacy')
        )
      : [];

    return dedupeExercises([...curatedExercises, ...resistanceJson, ...legacyExercises]);
  }

  if (activityType === ActivityType.ENDURANCE) {
    const datasetModule = await import('../data/exercises/endurance.json');
    const dataset = Array.isArray(datasetModule.default) ? datasetModule.default : [];
    cachedDatasetMetaByType[ActivityType.ENDURANCE] = readDatasetMeta(datasetModule);
    return dedupeExercises(dataset.map((exercise) => convertToExercise(exercise, ActivityType.ENDURANCE)));
  }

  if (activityType === ActivityType.SPORT) {
    const datasetModule = await import('../data/exercises/sports.json');
    const dataset = Array.isArray(datasetModule.default) ? datasetModule.default : [];
    cachedDatasetMetaByType[ActivityType.SPORT] = readDatasetMeta(datasetModule);
    return dedupeExercises(dataset.map((exercise) => convertToExercise(exercise, ActivityType.SPORT)));
  }

  if (activityType === ActivityType.STRETCHING) {
    const datasetModule = await import('../data/exercises/flexibility.json');
    const dataset = Array.isArray(datasetModule.default) ? datasetModule.default : [];
    cachedDatasetMetaByType[ActivityType.STRETCHING] = readDatasetMeta(datasetModule);
    return dedupeExercises(dataset.map((exercise) => convertToExercise(exercise, ActivityType.STRETCHING)));
  }

  if (activityType === ActivityType.SPEED_AGILITY) {
    const datasetModule = await import('../data/exercises/speedAgility.json');
    const dataset = Array.isArray(datasetModule.default) ? datasetModule.default : [];
    cachedDatasetMetaByType[ActivityType.SPEED_AGILITY] = readDatasetMeta(datasetModule);
    return dedupeExercises(dataset.map((exercise) => convertToExercise(exercise, ActivityType.SPEED_AGILITY)));
  }

  const datasetModule = await import('../data/exercises/other.json');
  const dataset = Array.isArray(datasetModule.default) ? datasetModule.default : [];
  cachedDatasetMetaByType[ActivityType.OTHER] = readDatasetMeta(datasetModule);
  return dedupeExercises(dataset.map((exercise) => convertToExercise(exercise, ActivityType.OTHER)));
};

const getCachedExerciseMap = (): Record<ActivityType, Exercise[]> => {
  const result = emptyExerciseMap();
  ACTIVITY_TYPE_ORDER.forEach((type) => {
    result[type] = cachedExercisesByType[type] || [];
  });
  return result;
};

const ensureActivityTypeLoaded = async (activityType: ActivityType): Promise<Exercise[]> => {
  if (cachedExercisesByType[activityType]) {
    return cachedExercisesByType[activityType] || [];
  }

  if (loadingExercisesByType[activityType]) {
    return loadingExercisesByType[activityType] as Promise<Exercise[]>;
  }

  loadingExercisesByType[activityType] = loadExerciseDatasetForActivityType(activityType)
    .then((loaded) => {
      cachedExercisesByType[activityType] = loaded;
      return loaded;
    })
    .catch((error) => {
      console.error(`Error loading exercise database for ${activityType}:`, error);
      return [];
    })
    .finally(() => {
      delete loadingExercisesByType[activityType];
    });

  return loadingExercisesByType[activityType] as Promise<Exercise[]>;
};

export function loadExerciseDatabases(): Record<ActivityType, Exercise[]> {
  ACTIVITY_TYPE_ORDER.forEach((type) => {
    if (!cachedExercisesByType[type] && !loadingExercisesByType[type]) {
      void ensureActivityTypeLoaded(type);
    }
  });

  return getCachedExerciseMap();
}

export async function loadExerciseDatabasesAsync(): Promise<Record<ActivityType, Exercise[]>> {
  await Promise.all(ACTIVITY_TYPE_ORDER.map((type) => ensureActivityTypeLoaded(type)));
  return getCachedExerciseMap();
}

export function getExercisesByActivityType(activityType: ActivityType): Exercise[] {
  if (!cachedExercisesByType[activityType] && !loadingExercisesByType[activityType]) {
    void ensureActivityTypeLoaded(activityType);
  }

  return cachedExercisesByType[activityType] || [];
}

export async function getExercisesByActivityTypeAsync(activityType: ActivityType): Promise<Exercise[]> {
  return ensureActivityTypeLoaded(activityType);
}

export async function getMergedExercisesByActivityType(
  activityType: ActivityType,
  userId?: string
): Promise<Exercise[]> {
  const builtInExercises = await getExercisesByActivityTypeAsync(activityType);

  try {
    const [globalExercises, userExercises] = await Promise.all([
      loadFirestoreExercises('globalExercises', activityType),
      userId ? loadFirestoreExercises('exercises', activityType, userId) : Promise.resolve([])
    ]);

    return dedupeExercises([
      ...builtInExercises,
      ...globalExercises,
      ...userExercises
    ]);
  } catch (error) {
    console.error('Failed to load merged exercises, falling back to built-ins only:', error);
    return dedupeExercises(builtInExercises);
  }
}

export async function getMergedExercisesByActivityTypes(
  activityTypes: ActivityType[],
  userId?: string
): Promise<Exercise[]> {
  const results = await Promise.all(
    activityTypes.map((activityType) => getMergedExercisesByActivityType(activityType, userId))
  );

  return dedupeExercises(results.flat());
}

export async function getMergedExercisesByAllActivityTypes(userId?: string): Promise<Exercise[]> {
  return getMergedExercisesByActivityTypes(ACTIVITY_TYPE_ORDER, userId);
}

export function getExercisesByCategory(activityType: ActivityType, category: string): Exercise[] {
  const exercises = getExercisesByActivityType(activityType);
  return exercises.filter((exercise) => exercise.category === category);
}

export async function getExercisesByCategoryAsync(activityType: ActivityType, category: string): Promise<Exercise[]> {
  const exercises = await getExercisesByActivityTypeAsync(activityType);
  return exercises.filter((exercise) => exercise.category === category);
}

export function searchExercises(queryText: string, activityTypes?: ActivityType[]): Exercise[] {
  const allExercises = getCachedExerciseMap();
  const searchTerms = queryText.toLowerCase().split(' ');

  const typesToSearch = activityTypes || Object.values(ActivityType);
  let results: Exercise[] = [];

  typesToSearch.forEach((type) => {
    const exercises = allExercises[type] || [];
    const matchingExercises = exercises.filter((exercise) => {
      const exerciseName = exercise.name.toLowerCase();
      return searchTerms.every((term) => exerciseName.includes(term));
    });

    results = [...results, ...matchingExercises];
  });

  const queryLower = queryText.toLowerCase();
  results.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    if (aName === queryLower && bName !== queryLower) return -1;
    if (bName === queryLower && aName !== queryLower) return 1;

    if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
    if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;

    return aName.localeCompare(bName);
  });

  return results.slice(0, 30);
}

export async function searchExercisesAsync(queryText: string, activityTypes?: ActivityType[]): Promise<Exercise[]> {
  const typesToSearch = activityTypes || Object.values(ActivityType);
  await Promise.all(typesToSearch.map((type) => ensureActivityTypeLoaded(type)));
  return searchExercises(queryText, activityTypes);
}

export function getExerciseCategories(activityType: ActivityType): Record<string, { name: string; description: string; icon: string }> {
  return cachedDatasetMetaByType[activityType]?.categories || {};
}

export async function getExerciseCategoriesAsync(activityType: ActivityType): Promise<Record<string, { name: string; description: string; icon: string }>> {
  await ensureActivityTypeLoaded(activityType);
  return cachedDatasetMetaByType[activityType]?.categories || {};
}

export function getDatabaseMetadata(activityType: ActivityType): unknown {
  return cachedDatasetMetaByType[activityType]?.metadata;
}

export async function getDatabaseMetadataAsync(activityType: ActivityType): Promise<unknown> {
  await ensureActivityTypeLoaded(activityType);
  return cachedDatasetMetaByType[activityType]?.metadata;
}

export function initializeExerciseDatabases(): void {
  void loadExerciseDatabasesAsync()
    .then((loadedExercises) => {
      const totalExercises = Object.values(loadedExercises).reduce(
        (total, exercises) => total + exercises.length,
        0
      );

      console.log('Exercise databases initialized successfully');
      console.log(`Total exercises loaded: ${totalExercises}`);

      Object.entries(loadedExercises).forEach(([type, exercises]) => {
        if (exercises.length > 0) {
          console.log(`- ${type}: ${exercises.length} exercises`);
        }
      });
    })
    .catch((error) => {
      console.error('Failed to initialize exercise databases:', error);
    });
}

export default {
  loadExerciseDatabases,
  loadExerciseDatabasesAsync,
  getExercisesByActivityType,
  getExercisesByActivityTypeAsync,
  getMergedExercisesByActivityType,
  getMergedExercisesByActivityTypes,
  getMergedExercisesByAllActivityTypes,
  getExercisesByCategory,
  getExercisesByCategoryAsync,
  searchExercises,
  searchExercisesAsync,
  getExerciseCategories,
  getExerciseCategoriesAsync,
  getDatabaseMetadata,
  getDatabaseMetadataAsync,
  initializeExerciseDatabases
};
