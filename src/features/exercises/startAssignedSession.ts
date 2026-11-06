import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { generateExercisePrescriptionAssistant } from '@/services/exercisePrescriptionAssistantService';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { listLogTimestampsForDate } from '@/services/firebase/logTimestamps';
import { normalizeActivityType } from '@/types/activityLog';
import type { SharedSessionAssignment } from '@/types/program';
import type { SupersetGroup } from '@/types/session';
import type { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { buildOrderedImportTimestamps } from '@/utils/exerciseOrderTimestamps';
import { buildSupersetLabels } from '@/utils/supersetUtils';

export interface StartedAssignedSession {
  alreadyStarted: boolean;
  imported: Array<{ sourceExerciseId: string; exercise: UnifiedExerciseData }>;
  sessionSupersets: SupersetGroup[];
  sourceExerciseOrder: string[];
}

function instructionText(instructions: unknown): string | undefined {
  if (typeof instructions === 'string') return instructions;
  if (Array.isArray(instructions) && typeof instructions[0] === 'string') return instructions[0];
  return undefined;
}

export async function assignmentHasLogs(userId: string, assignmentId: string, dateKey: string): Promise<boolean> {
  const collections = ['exercises', 'activities'];
  const matches = await Promise.all(collections.map(async (name) => {
    const snap = await getDocs(query(
      collection(db, 'users', userId, name),
      where('sharedSessionAssignmentId', '==', assignmentId)
    ));
    return snap.docs.some((docSnap) => docSnap.data().sharedSessionDateKey === dateKey);
  }));
  return matches.some(Boolean);
}

/** The signed-in athlete writes one empty exercise per movement for this planned day. */
export async function startAssignedSession(input: {
  assignment: SharedSessionAssignment;
  userId: string;
  date: Date;
  dateKey: string;
}): Promise<StartedAssignedSession> {
  const { assignment, userId, date, dateKey } = input;
  const sourceExercises = assignment.sessionData.exercises || [];
  const sourceExerciseOrder = assignment.sessionData.exerciseOrder?.length
    ? assignment.sessionData.exerciseOrder
    : sourceExercises.map((exercise) => exercise.id);
  const sessionSupersets = Array.isArray(assignment.sessionData.supersets)
    ? assignment.sessionData.supersets
    : [];

  if (await assignmentHasLogs(userId, assignment.id, dateKey)) {
    return { alreadyStarted: true, imported: [], sessionSupersets, sourceExerciseOrder };
  }

  const sourceLabelsByExerciseId = buildSupersetLabels(sessionSupersets, sourceExerciseOrder);
  const sourceSupersetByExerciseId = new Map<string, {
    supersetId?: string;
    supersetLabel?: string;
    supersetName?: string;
  }>();
  sessionSupersets.forEach((superset) => {
    superset.exerciseIds.forEach((exerciseId) => {
      const labelInfo = sourceLabelsByExerciseId[exerciseId];
      sourceSupersetByExerciseId.set(exerciseId, {
        supersetId: superset.id,
        supersetLabel: labelInfo?.label,
        supersetName: superset.name,
      });
    });
  });

  const existingTimestamps = await listLogTimestampsForDate(userId, date);
  const orderedTimestamps = buildOrderedImportTimestamps(date, existingTimestamps, sourceExercises.length);
  const imported: StartedAssignedSession['imported'] = [];

  for (const [index, exercise] of sourceExercises.entries()) {
    const activityType = normalizeActivityType(exercise.activityType);
    const sourceSupersetMeta = sourceSupersetByExerciseId.get(exercise.id);
    const prescriptionAssistant = await generateExercisePrescriptionAssistant({
      exercise: {
        id: exercise.id,
        name: exercise.name,
        activityType,
        prescription: exercise.prescription,
      },
      userId,
      sessionContext: {
        date: dateKey,
        warmupDone: false,
      },
    });
    const instructions = instructionText(exercise.instructions);
    const createdExerciseId = await addExerciseLog(
      {
        exerciseName: exercise.name,
        userId,
        sets: [],
        activityType,
        prescription: exercise.prescription,
        instructionMode: exercise.instructionMode,
        instructions,
        prescriptionAssistant,
        isWarmup: false,
        sessionType: 'main',
        sharedSessionAssignmentId: assignment.id,
        sharedSessionId: assignment.sharedSessionId,
        sharedSessionExerciseId: exercise.id,
        sharedSessionDateKey: dateKey,
        sharedSessionExerciseCompleted: false,
        sourceProgramId: assignment.sourceProgramId,
        sourceProgramName: assignment.sourceProgramName,
        sourceProgramSessionId: assignment.sessionData.id,
        sourceProgramSessionName: assignment.sessionData.name,
        sourceProgramExerciseId: exercise.id,
        supersetId: exercise.supersetId ?? sourceSupersetMeta?.supersetId,
        supersetLabel: exercise.supersetLabel ?? sourceSupersetMeta?.supersetLabel,
        supersetName: exercise.supersetName ?? sourceSupersetMeta?.supersetName,
      },
      orderedTimestamps[index]
    );

    imported.push({
      sourceExerciseId: exercise.id,
      exercise: {
        id: createdExerciseId,
        exerciseName: exercise.name,
        timestamp: orderedTimestamps[index],
        userId,
        sets: [],
        activityType,
        isWarmup: false,
        sessionType: 'main',
        sharedSessionAssignmentId: assignment.id,
        sharedSessionId: assignment.sharedSessionId,
        sharedSessionExerciseId: exercise.id,
        sharedSessionDateKey: dateKey,
        sharedSessionExerciseCompleted: false,
        sourceProgramId: assignment.sourceProgramId,
        sourceProgramName: assignment.sourceProgramName,
        sourceProgramSessionId: assignment.sessionData.id,
        sourceProgramSessionName: assignment.sessionData.name,
        sourceProgramExerciseId: exercise.id,
        supersetId: exercise.supersetId ?? sourceSupersetMeta?.supersetId,
        supersetLabel: exercise.supersetLabel ?? sourceSupersetMeta?.supersetLabel,
        supersetName: exercise.supersetName ?? sourceSupersetMeta?.supersetName,
        prescription: exercise.prescription,
        instructionMode: exercise.instructionMode,
        instructions,
        prescriptionAssistant,
      },
    });
  }

  return { alreadyStarted: false, imported, sessionSupersets, sourceExerciseOrder };
}
