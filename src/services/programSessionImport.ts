import { Program, ProgramSession } from '@/types/program';
import { ActivityType } from '@/types/activityTypes';
import { resolveActivityTypeFromExerciseLike } from '@/utils/activityTypeResolver';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { ensureSessionContextForLog, getSessionsForDate } from '@/services/firebase/sessionTrackingService';
import { generateLocalExercisePrescriptionAssistant } from '@/services/exercisePrescriptionAssistantService';
import { toLocalDateString } from '@/utils/dateUtils';
import { prescriptionToSets } from '@/utils/prescriptionUtils';

export const importProgramSessionToDate = async (
  userId: string,
  program: Pick<Program, 'id' | 'name'>,
  session: ProgramSession,
  date: Date
): Promise<number> => {
  const exercises = session.exercises || [];
  if (exercises.length === 0) return 0;

  const existingSessions = await getSessionsForDate(userId, date);
  const hasMainSession = existingSessions.some((item) => item.sessionType === 'main');
  const sessionContext = await ensureSessionContextForLog(userId, date, {
    requestedSessionType: 'main',
    forceNewSession: hasMainSession,
    sessionName: session.name,
  });
  const dateKey = toLocalDateString(date);

  for (const exercise of exercises) {
    const activityType = resolveActivityTypeFromExerciseLike(exercise, {
      fallback: exercise.activityType || ActivityType.RESISTANCE,
    });
    const sets = activityType === ActivityType.RESISTANCE || !exercise.prescription
      ? []
      : prescriptionToSets(exercise.prescription, activityType);
    const prescriptionAssistant = generateLocalExercisePrescriptionAssistant({
      exercise: {
        id: exercise.id,
        name: exercise.name,
        activityType,
        prescription: exercise.prescription,
      },
      sessionContext: {
        date: dateKey,
        warmupDone: false,
      },
    });

    await addExerciseLog(
      {
        exerciseName: exercise.name,
        userId,
        sets,
        activityType,
        isWarmup: false,
        sessionId: sessionContext.sessionId,
        sessionType: sessionContext.sessionType,
        sessionDateKey: sessionContext.sessionDateKey,
        sessionWeekKey: sessionContext.sessionWeekKey,
        sessionNumberInDay: sessionContext.sessionNumberInDay,
        sessionNumberInWeek: sessionContext.sessionNumberInWeek,
        prescription: exercise.prescription,
        instructionMode: exercise.instructionMode,
        instructions: exercise.instructions || exercise.notes,
        sourceProgramId: program.id,
        sourceProgramName: program.name,
        sourceProgramSessionId: session.id,
        sourceProgramSessionName: session.name,
        sourceProgramExerciseId: exercise.id,
        prescriptionAssistant,
      },
      date
    );
  }

  return exercises.length;
};
