import type { ProgramExercise, SharedSessionAssignment } from '@/types/program';
import type { SupersetGroup } from '@/types/session';
import { compareByExerciseOrder } from '@/utils/exerciseOrderTimestamps';
import type { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';

export interface AssignedLogLink {
  sharedSessionAssignmentId?: string;
  sharedSessionDateKey?: string;
  sessionDateKey?: string;
  sourceProgramSessionId?: string;
}

export function assignmentStartedOnDate(
  assignment: Pick<SharedSessionAssignment, 'id' | 'sessionData'>,
  dateKey: string,
  logs: AssignedLogLink[]
): boolean {
  const sessionId = assignment.sessionData?.id;
  return logs.some((log) => {
    const onDate = log.sharedSessionDateKey === dateKey || log.sessionDateKey === dateKey;
    if (!onDate) return false;
    if (log.sharedSessionAssignmentId === assignment.id) return true;
    return Boolean(sessionId && log.sourceProgramSessionId === sessionId);
  });
}

export function openAssignmentsForDate(
  assignments: SharedSessionAssignment[],
  dateKey: string,
  logs: AssignedLogLink[]
): SharedSessionAssignment[] {
  return assignments
    .filter((assignment) => (assignment.plannedDates ?? []).includes(dateKey))
    .filter((assignment) => !assignmentStartedOnDate(assignment, dateKey, logs))
    .sort((a, b) => a.assignedAt.localeCompare(b.assignedAt) || a.sessionData.name.localeCompare(b.sessionData.name));
}

export function orderedSessionExercises(assignment: SharedSessionAssignment): ProgramExercise[] {
  const exercises = assignment.sessionData.exercises ?? [];
  const order = assignment.sessionData.exerciseOrder ?? [];
  if (order.length === 0) return exercises;
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const ordered = order.flatMap((id) => {
    const exercise = byId.get(id);
    return exercise ? [exercise] : [];
  });
  const leftovers = exercises.filter((exercise) => !order.includes(exercise.id));
  return [...ordered, ...leftovers];
}

export function importedSessionUiState(input: {
  previous: UnifiedExerciseData[];
  imported: Array<{ sourceExerciseId: string; exercise: UnifiedExerciseData }>;
  sessionSupersets: SupersetGroup[];
  sourceExerciseOrder: string[];
  importKey: string;
  persisted: { supersets: SupersetGroup[]; exerciseOrder: string[] };
}): {
  exercises: UnifiedExerciseData[];
  supersets: SupersetGroup[] | null;
  exerciseOrder: string[] | null;
} {
  const mergedById = new Map<string, UnifiedExerciseData>();
  input.previous.forEach((exercise) => {
    if (exercise.id) mergedById.set(exercise.id, exercise);
  });
  input.imported.forEach(({ exercise }) => {
    if (exercise.id) mergedById.set(exercise.id, exercise);
  });

  const sourceToCreated = new Map(
    input.imported
      .filter((item) => item.exercise.id)
      .map((item) => [item.sourceExerciseId, item.exercise.id as string])
  );

  const mappedSessionSupersets = input.sessionSupersets.reduce<SupersetGroup[]>((acc, superset, index) => {
    const mappedExerciseIds = superset.exerciseIds
      .map((sourceExerciseId) => sourceToCreated.get(sourceExerciseId))
      .filter((exerciseId): exerciseId is string => Boolean(exerciseId));
    if (mappedExerciseIds.length < 2) return acc;
    acc.push({
      id: `${superset.id}-${input.importKey}`,
      name: superset.name,
      order: superset.order ?? index,
      exerciseIds: mappedExerciseIds,
    });
    return acc;
  }, []);

  const mappedPerExerciseSupersets: SupersetGroup[] = [];
  if (mappedSessionSupersets.length === 0) {
    const grouped = new Map<string, { name?: string; exerciseIds: string[] }>();
    input.imported.forEach(({ exercise }) => {
      if (!exercise.id || !exercise.supersetId) return;
      const existing = grouped.get(exercise.supersetId);
      if (existing) existing.exerciseIds.push(exercise.id);
      else grouped.set(exercise.supersetId, { name: exercise.supersetName, exerciseIds: [exercise.id] });
    });
    let generatedOrder = 0;
    grouped.forEach((value, key) => {
      if (value.exerciseIds.length < 2) return;
      mappedPerExerciseSupersets.push({
        id: `${key}-${input.importKey}`,
        name: value.name,
        order: generatedOrder,
        exerciseIds: value.exerciseIds,
      });
      generatedOrder += 1;
    });
  }

  const supersetsToPersist = mappedSessionSupersets.length > 0 ? mappedSessionSupersets : mappedPerExerciseSupersets;
  if (supersetsToPersist.length === 0) {
    return {
      exercises: Array.from(mergedById.values()).sort(compareByExerciseOrder),
      supersets: null,
      exerciseOrder: null,
    };
  }

  const importedExerciseOrder = input.sourceExerciseOrder
    .map((sourceExerciseId) => sourceToCreated.get(sourceExerciseId))
    .filter((exerciseId): exerciseId is string => Boolean(exerciseId));

  return {
    exercises: Array.from(mergedById.values()).sort(compareByExerciseOrder),
    supersets: [...input.persisted.supersets, ...supersetsToPersist],
    exerciseOrder: [
      ...input.persisted.exerciseOrder.filter((exerciseId) => !importedExerciseOrder.includes(exerciseId)),
      ...importedExerciseOrder,
    ],
  };
}
