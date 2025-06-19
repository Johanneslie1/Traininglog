import { Exercise } from '@/types/exercise';

type ExerciseTemplate = Omit<Exercise, 'id'>;

const defaultMetrics = {
  trackWeight: true,
  trackReps: true,
  trackRPE: true,
};

// Chest Exercises
export const chestExercises: ExerciseTemplate[] = [
  {
    name: 'Bench Press',
    type: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: ['barbell', 'bench'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Incline Bench Press',
    type: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: ['barbell', 'bench'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Dumbbell Press',
    type: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: ['dumbbells', 'bench'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Push-Ups',
    type: 'bodyweight',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: ['bodyweight'],
    metrics: { trackReps: true, trackRPE: true },
    defaultUnit: 'reps'
  },
  {
    name: 'Cable Fly',
    type: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders'],
    equipment: ['cable'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Dumbbell Fly',
    type: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders'],
    equipment: ['dumbbells', 'bench'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  }
];

// Back Exercises
export const backExercises: ExerciseTemplate[] = [
  {
    name: 'Pull-Ups',
    type: 'bodyweight',
    primaryMuscles: ['back', 'lats'],
    secondaryMuscles: ['biceps'],
    equipment: ['pull-up-bar'],
    metrics: { trackReps: true, trackRPE: true },
    defaultUnit: 'reps'
  },
  {
    name: 'Barbell Row',
    type: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: ['barbell'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Lat Pulldown',
    type: 'strength',
    primaryMuscles: ['back', 'lats'],
    secondaryMuscles: ['biceps'],
    equipment: ['cable'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Seated Row',
    type: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: ['cable'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Single-Arm Dumbbell Row',
    type: 'strength',
    primaryMuscles: ['back', 'lats'],
    secondaryMuscles: ['biceps'],
    equipment: ['dumbbell', 'bench'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Inverted Row',
    type: 'bodyweight',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'core'],
    equipment: ['bar'],
    metrics: { trackReps: true, trackRPE: true },
    defaultUnit: 'reps'
  }
];

// Legs Exercises
export const legExercises: ExerciseTemplate[] = [
  {
    name: 'Squats',
    type: 'strength',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    equipment: ['barbell'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Deadlift',
    type: 'strength',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['back', 'core'],
    equipment: ['barbell'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Leg Press',
    type: 'strength',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    equipment: ['machine'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Romanian Deadlift',
    type: 'strength',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes', 'back'],
    equipment: ['barbell'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Bulgarian Split Squat',
    type: 'strength',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    equipment: ['dumbbells', 'bench'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Walking Lunges',
    type: 'strength',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    equipment: ['dumbbells'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Calf Raises',
    type: 'strength',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    equipment: ['bodyweight', 'dumbbells'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  }
];

// Shoulders Exercises
export const shoulderExercises: ExerciseTemplate[] = [
  {
    name: 'Overhead Press',
    type: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    equipment: ['barbell'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Lateral Raises',
    type: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: [],
    equipment: ['dumbbells'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Face Pulls',
    type: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['traps'],
    equipment: ['cable'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Arnold Press',
    type: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    equipment: ['dumbbells'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Front Raise',
    type: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: [],
    equipment: ['plate', 'dumbbells'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  }
];

// Arms Exercises
export const armExercises: ExerciseTemplate[] = [
  {
    name: 'Bicep Curls',
    type: 'strength',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    equipment: ['dumbbells'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Tricep Extensions',
    type: 'strength',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: ['cable'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Hammer Curls',
    type: 'strength',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: ['dumbbells'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Diamond Push-Ups',
    type: 'bodyweight',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'shoulders'],
    equipment: ['bodyweight'],
    metrics: { trackReps: true, trackRPE: true },
    defaultUnit: 'reps'
  },
  {
    name: 'Chin-Ups',
    type: 'bodyweight',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['back'],
    equipment: ['pull-up-bar'],
    metrics: { trackReps: true, trackRPE: true },
    defaultUnit: 'reps'
  }
];

// Core Exercises
export const coreExercises: ExerciseTemplate[] = [
  {
    name: 'Plank',
    type: 'bodyweight',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: ['bodyweight'],
    metrics: { trackTime: true, trackRPE: true },
    defaultUnit: 'time'
  },
  {
    name: 'Crunches',
    type: 'bodyweight',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: ['bodyweight'],
    metrics: { trackReps: true, trackRPE: true },
    defaultUnit: 'reps'
  },
  {
    name: 'Russian Twists',
    type: 'strength',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: ['dumbbell', 'plate'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  },
  {
    name: 'Dead Bug',
    type: 'bodyweight',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: ['bodyweight'],
    metrics: { trackReps: true, trackRPE: true },
    defaultUnit: 'reps'
  },
  {
    name: 'Bird Dog',
    type: 'bodyweight',
    primaryMuscles: ['core'],
    secondaryMuscles: ['lower_back'],
    equipment: ['bodyweight'],
    metrics: { trackReps: true, trackRPE: true },
    defaultUnit: 'reps'
  },
  {
    name: 'Pallof Press',
    type: 'strength',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: ['cable'],
    metrics: defaultMetrics,
    defaultUnit: 'kg'
  }
];

// Export all exercises
export const allExercises = [
  ...chestExercises,
  ...backExercises,
  ...legExercises,
  ...shoulderExercises,
  ...armExercises,
  ...coreExercises
];
