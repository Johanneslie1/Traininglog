import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { ActivityType } from '@/types/activityTypes';
import { Exercise, MuscleGroup } from '@/types/exercise';

export interface CreateCustomExerciseInput {
  name: string;
  description: string;
  targetAreas: string[];
  equipment: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instructions: string;
  tips?: string;
  sportType?: string;
  enduranceCategory?: string;
  drillType?: string;
  flexibilityType?: string;
}

export class DuplicateExerciseNameError extends Error {
  readonly duplicateExercise: Exercise;

  constructor(duplicateExercise: Exercise) {
    super('An exercise with the same name already exists for this activity type.');
    this.name = 'DuplicateExerciseNameError';
    this.duplicateExercise = duplicateExercise;
  }
}

const normalizeExerciseName = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

const mapTargetAreasToMuscleGroups = (areas: string[]): MuscleGroup[] => {
  const mapping: Record<string, MuscleGroup> = {
    Chest: 'chest',
    Back: 'back',
    Shoulders: 'shoulders',
    Biceps: 'biceps',
    Triceps: 'triceps',
    Forearms: 'forearms',
    Core: 'core',
    Legs: 'quadriceps',
    Quadriceps: 'quadriceps',
    Hamstrings: 'hamstrings',
    Calves: 'calves',
    Glutes: 'glutes',
    'Full Body': 'full_body',
    'Upper Body': 'full_body',
    'Lower Body': 'quadriceps',
    Cardiovascular: 'full_body'
  };

  return areas.map(area => mapping[area] || 'full_body');
};

const getSanitizedBase = (
  input: CreateCustomExerciseInput,
  activityType: ActivityType,
  userId: string
): Omit<Exercise, 'id'> => ({
  name: input.name.trim(),
  nameLower: normalizeExerciseName(input.name),
  description: input.description.trim(),
  activityType,
  category: 'other',
  primaryMuscles: mapTargetAreasToMuscleGroups(input.targetAreas),
  secondaryMuscles: [],
  instructions: input.instructions.trim() ? [input.instructions.trim()] : [],
  tips: input.tips?.trim() ? [input.tips.trim()] : [],
  equipment: input.equipment.map(eq => eq.replace(' (Bodyweight)', '')),
  difficulty: input.difficulty.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
  customExercise: true,
  isDefault: false,
  createdBy: userId,
  userId
});

const persistExercise = async (exercise: Omit<Exercise, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'exercises'), exercise);
  return docRef.id;
};

export const findDuplicateExerciseByName = async (
  activityType: ActivityType,
  name: string,
  userId: string,
  excludeExerciseId?: string
): Promise<Exercise | null> => {
  const normalizedName = normalizeExerciseName(name);
  const duplicateQuery = query(
    collection(db, 'exercises'),
    where('userId', '==', userId),
    where('activityType', '==', activityType),
    limit(50)
  );

  const duplicateSnapshot = await getDocs(duplicateQuery);
  const duplicate = duplicateSnapshot.docs
    .map((exerciseDoc) => ({ id: exerciseDoc.id, ...exerciseDoc.data() } as Exercise))
    .find((exercise) => {
      if (excludeExerciseId && exercise.id === excludeExerciseId) {
        return false;
      }

      return normalizeExerciseName(exercise.name) === normalizedName;
    });

  return duplicate ?? null;
};

const ensureNoDuplicateExerciseName = async (
  activityType: ActivityType,
  input: CreateCustomExerciseInput,
  userId: string,
  excludeExerciseId?: string
): Promise<void> => {
  const duplicateExercise = await findDuplicateExerciseByName(
    activityType,
    input.name,
    userId,
    excludeExerciseId
  );

  if (duplicateExercise) {
    throw new DuplicateExerciseNameError(duplicateExercise);
  }
};

export const createResistanceExercise = async (
  input: CreateCustomExerciseInput,
  userId: string
): Promise<string> => {
  await ensureNoDuplicateExerciseName(ActivityType.RESISTANCE, input, userId);
  const base = getSanitizedBase(input, ActivityType.RESISTANCE, userId);
  return persistExercise({
    ...base,
    type: 'strength',
    category: input.targetAreas.length > 1 ? 'compound' : 'isolation',
    defaultUnit: 'kg',
    metrics: {
      trackWeight: true,
      trackReps: true,
      trackSets: true,
      trackTime: false,
      trackDistance: false,
      trackRPE: true
    }
  });
};

export const createSportExercise = async (
  input: CreateCustomExerciseInput,
  userId: string
): Promise<string> => {
  await ensureNoDuplicateExerciseName(ActivityType.SPORT, input, userId);
  const base = getSanitizedBase(input, ActivityType.SPORT, userId);
  return persistExercise({
    ...base,
    type: 'teamSports',
    category: 'sport',
    defaultUnit: 'time',
    metrics: {
      trackWeight: false,
      trackReps: true,
      trackSets: true,
      trackTime: true,
      trackDistance: true,
      trackRPE: true
    },
    ...(input.sportType && {
      sportType: input.sportType,
      teamBased: ['Football', 'Basketball', 'Soccer', 'Hockey', 'Volleyball'].includes(input.sportType)
    })
  });
};

export const createStretchingExercise = async (
  input: CreateCustomExerciseInput,
  userId: string
): Promise<string> => {
  await ensureNoDuplicateExerciseName(ActivityType.STRETCHING, input, userId);
  const base = getSanitizedBase(input, ActivityType.STRETCHING, userId);
  return persistExercise({
    ...base,
    type: 'flexibility',
    category: 'stretching',
    defaultUnit: 'time',
    metrics: {
      trackWeight: false,
      trackReps: true,
      trackSets: true,
      trackTime: true,
      trackDistance: false,
      trackRPE: true
    },
    ...(input.flexibilityType && {
      flexibilityType: input.flexibilityType
    })
  });
};

export const createEnduranceExercise = async (
  input: CreateCustomExerciseInput,
  userId: string
): Promise<string> => {
  await ensureNoDuplicateExerciseName(ActivityType.ENDURANCE, input, userId);
  const base = getSanitizedBase(input, ActivityType.ENDURANCE, userId);
  return persistExercise({
    ...base,
    type: 'endurance',
    category: input.enduranceCategory?.toLowerCase().replace(/\s+/g, '_') || 'cardio',
    defaultUnit: 'time',
    metrics: {
      trackWeight: false,
      trackReps: true,
      trackSets: true,
      trackTime: true,
      trackDistance: true,
      trackRPE: true,
      trackIntensity: true
    }
  });
};

export const createSpeedAgilityExercise = async (
  input: CreateCustomExerciseInput,
  userId: string
): Promise<string> => {
  await ensureNoDuplicateExerciseName(ActivityType.SPEED_AGILITY, input, userId);
  const base = getSanitizedBase(input, ActivityType.SPEED_AGILITY, userId);
  return persistExercise({
    ...base,
    type: 'speedAgility',
    category: 'plyometric',
    defaultUnit: 'time',
    metrics: {
      trackWeight: false,
      trackReps: true,
      trackSets: true,
      trackTime: true,
      trackDistance: true,
      trackRPE: true,
      trackHeight: true
    },
    ...(input.drillType && {
      drillType: input.drillType
    })
  });
};

export const createOtherExercise = async (
  input: CreateCustomExerciseInput,
  userId: string
): Promise<string> => {
  await ensureNoDuplicateExerciseName(ActivityType.OTHER, input, userId);
  const base = getSanitizedBase(input, ActivityType.OTHER, userId);
  return persistExercise({
    ...base,
    type: 'other',
    category: 'other',
    defaultUnit: 'time',
    metrics: {
      trackWeight: false,
      trackReps: true,
      trackSets: true,
      trackTime: true,
      trackDistance: false,
      trackRPE: true
    }
  });
};

export const createExerciseByActivityType = async (
  activityType: ActivityType,
  input: CreateCustomExerciseInput,
  userId: string
): Promise<string> => {
  switch (activityType) {
    case ActivityType.RESISTANCE:
      return createResistanceExercise(input, userId);
    case ActivityType.SPORT:
      return createSportExercise(input, userId);
    case ActivityType.STRETCHING:
      return createStretchingExercise(input, userId);
    case ActivityType.ENDURANCE:
      return createEnduranceExercise(input, userId);
    case ActivityType.SPEED_AGILITY:
      return createSpeedAgilityExercise(input, userId);
    case ActivityType.OTHER:
    default:
      return createOtherExercise(input, userId);
  }
};

export const updateExerciseByActivityType = async (
  exerciseId: string,
  activityType: ActivityType,
  input: CreateCustomExerciseInput,
  userId: string
): Promise<void> => {
  await ensureNoDuplicateExerciseName(activityType, input, userId, exerciseId);

  const base = getSanitizedBase(input, activityType, userId);
  await updateDoc(doc(db, 'exercises', exerciseId), {
    ...base,
    updatedAt: new Date(),
    userId
  });
};

export const deleteCustomExerciseById = async (
  exerciseId: string,
  userId: string
): Promise<void> => {
  const exerciseRef = doc(db, 'exercises', exerciseId);
  const exerciseSnapshot = await getDoc(exerciseRef);

  if (!exerciseSnapshot.exists()) {
    throw new Error('Exercise not found or access denied.');
  }

  const exerciseData = exerciseSnapshot.data() as Exercise;
  if (exerciseData.userId !== userId) {
    throw new Error('Exercise not found or access denied.');
  }

  await deleteDoc(exerciseRef);
};
