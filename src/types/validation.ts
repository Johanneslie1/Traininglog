import { z } from 'zod';
import { DifficultyCategory } from './difficulty';
import type { Exercise } from './exercise';
import type { ExerciseSet as ExerciseSetType } from './sets';

export const ExerciseMetricsSchema = z.object({
  trackWeight: z.boolean().optional().default(false),
  trackReps: z.boolean().optional().default(false),
  trackTime: z.boolean().optional().default(false),
  trackDistance: z.boolean().optional().default(false),
  trackRPE: z.boolean().optional().default(false),
}) satisfies z.ZodType<Exercise['metrics']>;

export const ExerciseSetSchema = z.object({
  reps: z.number(),
  weight: z.number(),
  difficulty: z.nativeEnum(DifficultyCategory),
  rpe: z.number().optional(),
}) satisfies z.ZodType<ExerciseSetType>;

const exerciseTypeEnum = z.enum(['strength', 'cardio', 'flexibility', 'bodyweight'] as const);
const exerciseCategoryEnum = z.enum(['compound', 'isolation', 'olympic', 'cardio', 'stretching', 'power'] as const);
const unitTypeEnum = z.enum(['kg', 'lbs', 'time', 'distance', 'reps'] as const);
const muscleGroupEnum = z.enum([
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'quadriceps', 'hamstrings', 'calves', 'glutes', 'core',
  'traps', 'lats', 'lower_back', 'full_body'
] as const);

export const ExerciseDataSchema = z.object({
  id: z.string(),
  exerciseName: z.string(),
  name: z.string(),
  timestamp: z.date(),
  sets: z.array(ExerciseSetSchema),
  deviceId: z.string().optional(),
  type: exerciseTypeEnum,
  category: exerciseCategoryEnum,
  primaryMuscles: z.array(muscleGroupEnum),
  secondaryMuscles: z.array(muscleGroupEnum),
  defaultUnit: unitTypeEnum,
  metrics: ExerciseMetricsSchema,
});

export type ValidatedExerciseData = z.infer<typeof ExerciseDataSchema>;
