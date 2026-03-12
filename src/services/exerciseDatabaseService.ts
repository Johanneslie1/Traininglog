import { Exercise, MuscleGroup } from '../types/exercise';
import { ActivityType } from '../types/activityTypes';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

// Import JSON exercise databases for new activity types
import enduranceExercises from '../data/exercises/endurance.json';
import sportsExercises from '../data/exercises/sports.json';
import flexibilityExercises from '../data/exercises/flexibility.json';
import speedAgilityExercises from '../data/exercises/speedAgility.json';
import otherActivitiesExercises from '../data/exercises/other.json';
import resistanceExercisesJson from '../data/exercises/resistance.json';

// Import your existing resistance training system
import { allExercises } from '../data/exercises';
import { importedExercises } from '../data/importedExercises';

type ExerciseType = Exercise['type'];

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

// Convert JSON exercise to internal Exercise type
function convertToExercise(jsonExercise: any, fallbackActivityType?: ActivityType): Exercise {
  return normalizeExerciseRecord(
    jsonExercise,
    fallbackActivityType || ActivityType.OTHER,
    'builtin',
    true
  );
}

// Load and convert all exercise databases
let cachedExercises: Record<ActivityType, Exercise[]> | null = null;

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

export function loadExerciseDatabases(): Record<ActivityType, Exercise[]> {
  if (cachedExercises) return cachedExercises;

  const loaded: Record<ActivityType, Exercise[]> = {
    [ActivityType.RESISTANCE]: [],
    [ActivityType.ENDURANCE]: [],
    [ActivityType.SPORT]: [],
    [ActivityType.STRETCHING]: [],
    [ActivityType.SPEED_AGILITY]: [],
    [ActivityType.OTHER]: []
  };

  try {
    if (Array.isArray(allExercises)) {
      loaded[ActivityType.RESISTANCE] = allExercises.map((exercise) =>
        normalizeExerciseRecord(exercise, ActivityType.RESISTANCE, 'resistance-curated')
      );
    }

    if (Array.isArray(resistanceExercisesJson)) {
      loaded[ActivityType.RESISTANCE] = [
        ...loaded[ActivityType.RESISTANCE],
        ...resistanceExercisesJson.map((exercise) =>
          normalizeExerciseRecord(exercise, ActivityType.RESISTANCE, 'resistance-json', true)
        )
      ];
    }

    if (Array.isArray(importedExercises)) {
      loaded[ActivityType.RESISTANCE] = [
        ...loaded[ActivityType.RESISTANCE],
        ...importedExercises.map((exercise) =>
          normalizeExerciseRecord(exercise, ActivityType.RESISTANCE, 'resistance-legacy')
        )
      ];
    }

    if (Array.isArray(enduranceExercises)) {
      loaded[ActivityType.ENDURANCE] = enduranceExercises.map(ex => convertToExercise(ex, ActivityType.ENDURANCE));
    }
    if (Array.isArray(sportsExercises)) {
      loaded[ActivityType.SPORT] = sportsExercises.map(ex => convertToExercise(ex, ActivityType.SPORT));
    }
    if (Array.isArray(flexibilityExercises)) {
      loaded[ActivityType.STRETCHING] = flexibilityExercises.map(ex => convertToExercise(ex, ActivityType.STRETCHING));
    }
    if (Array.isArray(speedAgilityExercises)) {
      loaded[ActivityType.SPEED_AGILITY] = speedAgilityExercises.map(ex => convertToExercise(ex, ActivityType.SPEED_AGILITY));
    }
    if (Array.isArray(otherActivitiesExercises)) {
      loaded[ActivityType.OTHER] = otherActivitiesExercises.map(ex => convertToExercise(ex, ActivityType.OTHER));
    }

    ACTIVITY_TYPE_ORDER.forEach((type) => {
      loaded[type] = dedupeExercises(loaded[type]);
    });
  } catch (err) {
    console.error('Error loading exercise databases:', err);
  }

  cachedExercises = loaded;
  return loaded;
}

// Get exercises by activity type
export function getExercisesByActivityType(activityType: ActivityType): Exercise[] {
  const allExercises = loadExerciseDatabases();
  return allExercises[activityType] || [];
}

export async function getMergedExercisesByActivityType(
  activityType: ActivityType,
  userId?: string
): Promise<Exercise[]> {
  const builtInExercises = getExercisesByActivityType(activityType);

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

// Get exercises by category within an activity type
export function getExercisesByCategory(activityType: ActivityType, category: string): Exercise[] {
  const exercises = getExercisesByActivityType(activityType);
  return exercises.filter(exercise => exercise.category === category);
}

// Search exercises across all types
export function searchExercises(query: string, activityTypes?: ActivityType[]): Exercise[] {
  const allExercises = loadExerciseDatabases();
  const searchTerms = query.toLowerCase().split(' ');
  
  const typesToSearch = activityTypes || Object.values(ActivityType);
  let results: Exercise[] = [];
  
  typesToSearch.forEach(type => {
    const exercises = allExercises[type] || [];
    const matchingExercises = exercises.filter(exercise => {
      // Only search in exercise name
      const exerciseName = exercise.name.toLowerCase();
      
      // Check if all search terms are found in the exercise name
      return searchTerms.every(term => exerciseName.includes(term));
    });
    
    results = [...results, ...matchingExercises];
  });
  
  // Sort results by relevance
  const query_lower = query.toLowerCase();
  results.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    // Exact match comes first
    if (aName === query_lower && bName !== query_lower) return -1;
    if (bName === query_lower && aName !== query_lower) return 1;
    
    // Starts with query comes second
    if (aName.startsWith(query_lower) && !bName.startsWith(query_lower)) return -1;
    if (bName.startsWith(query_lower) && !aName.startsWith(query_lower)) return 1;
    
    // Alphabetical order for the rest
    return aName.localeCompare(bName);
  });
  
  // Limit results to prevent too many matches
  return results.slice(0, 30);
}

// Get exercise categories for an activity type
export function getExerciseCategories(activityType: ActivityType): Record<string, { name: string; description: string; icon: string }> {
  const databases: Record<string, any> = {
    [ActivityType.ENDURANCE]: enduranceExercises,
    [ActivityType.SPORT]: sportsExercises,
    [ActivityType.STRETCHING]: flexibilityExercises,
    [ActivityType.SPEED_AGILITY]: speedAgilityExercises,
    [ActivityType.OTHER]: otherActivitiesExercises
  };
  
  const database = databases[activityType];
  return database?.categories || {};
}

// Get database metadata
export function getDatabaseMetadata(activityType: ActivityType) {
  const databases: Record<string, any> = {
    [ActivityType.ENDURANCE]: enduranceExercises,
    [ActivityType.SPORT]: sportsExercises,
    [ActivityType.STRETCHING]: flexibilityExercises,
    [ActivityType.SPEED_AGILITY]: speedAgilityExercises,
    [ActivityType.OTHER]: otherActivitiesExercises
  };
  
  return databases[activityType]?.metadata;
}

// Initialize exercise databases (call this at app startup)
export function initializeExerciseDatabases(): void {
  try {
    const loadedExercises = loadExerciseDatabases();
    const totalExercises = Object.values(loadedExercises).reduce(
      (total, exercises) => total + exercises.length, 
      0
    );
    
    console.log(`Exercise databases initialized successfully`);
    console.log(`Total exercises loaded: ${totalExercises}`);
    
    // Log summary by type
    Object.entries(loadedExercises).forEach(([type, exercises]) => {
      if (exercises.length > 0) {
        console.log(`- ${type}: ${exercises.length} exercises`);
      }
    });
    
  } catch (error) {
    console.error('Failed to initialize exercise databases:', error);
  }
}

export default {
  loadExerciseDatabases,
  getExercisesByActivityType,
  getMergedExercisesByActivityType,
  getMergedExercisesByActivityTypes,
  getMergedExercisesByAllActivityTypes,
  getExercisesByCategory,
  searchExercises,
  getExerciseCategories,
  getDatabaseMetadata,
  initializeExerciseDatabases
};
