import { Program, ProgramSession } from '@/types/program';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';
import { resolveActivityTypeFromExerciseLike } from '@/utils/activityTypeResolver';

export type ProgramExerciseSelectionKey = {
  sessionId: string;
  exerciseIndex: number;
};

export interface ResolvedProgramExerciseSelection {
  exercise: Exercise;
  sets: ExerciseSet[];
  sourceProgramId?: string;
  sourceProgramName?: string;
  sourceSessionId?: string;
  sourceSessionName?: string;
  sourceIsWarmup?: boolean;
  sourceProgramExerciseId?: string;
  sourceProgramSupersetId?: string;
  sourceProgramSupersetLabel?: string;
  sourceProgramSupersetName?: string;
}

const mapActivityTypeToExerciseType = (activityType: ActivityType): Exercise['type'] => {
  switch (activityType) {
    case ActivityType.RESISTANCE:
      return 'strength';
    case ActivityType.ENDURANCE:
      return 'endurance';
    case ActivityType.STRETCHING:
      return 'flexibility';
    case ActivityType.SPORT:
      return 'teamSports';
    case ActivityType.SPEED_AGILITY:
      return 'speedAgility';
    case ActivityType.OTHER:
    default:
      return 'other';
  }
};

/**
 * Resolve picker selections by session array index (not library exercise id).
 * Duplicate library ids in one session must each resolve to their own row.
 */
export const resolveProgramExerciseSelections = (
  program: Pick<Program, 'id' | 'name' | 'sessions'>,
  selectedExercises: ProgramExerciseSelectionKey[]
): ResolvedProgramExerciseSelection[] => {
  const resolved: ResolvedProgramExerciseSelection[] = [];

  for (const sel of selectedExercises) {
    const session = program.sessions?.find((s) => s.id === sel.sessionId);
    const exercise = session?.exercises[sel.exerciseIndex];
    if (!session || !exercise) {
      continue;
    }

    const activityType = resolveActivityTypeFromExerciseLike(exercise, {
      fallback: ActivityType.RESISTANCE,
    });
    const isResistance = activityType === ActivityType.RESISTANCE;
    const sets: ExerciseSet[] = [];

    resolved.push({
      exercise: {
        id: exercise.id,
        name: exercise.name,
        type: mapActivityTypeToExerciseType(activityType),
        category: 'compound' as const,
        primaryMuscles: [],
        secondaryMuscles: [],
        instructions: exercise.instructions ? [exercise.instructions] : [],
        description: exercise.notes || '',
        defaultUnit: isResistance ? ('kg' as const) : ('time' as const),
        metrics: {
          trackWeight: isResistance,
          trackReps: isResistance,
          trackTime: !isResistance,
        },
        activityType,
        prescription: exercise.prescription,
        instructionMode: exercise.instructionMode,
        supersetId: exercise.supersetId,
        supersetLabel: exercise.supersetLabel,
        supersetName: exercise.supersetName,
      },
      sets,
      sourceProgramId: program.id,
      sourceProgramName: program.name,
      sourceSessionId: session.id,
      sourceSessionName: session.name,
      sourceIsWarmup: session.isWarmupSession === true,
      sourceProgramExerciseId: exercise.id,
      sourceProgramSupersetId: exercise.supersetId,
      sourceProgramSupersetLabel: exercise.supersetLabel,
      sourceProgramSupersetName: exercise.supersetName,
    });
  }

  return resolved;
};

export const buildSelectAllKeysForSession = (
  sessionId: string,
  exercises: ProgramSession['exercises']
): ProgramExerciseSelectionKey[] =>
  exercises.map((_, exerciseIndex) => ({ sessionId, exerciseIndex }));
