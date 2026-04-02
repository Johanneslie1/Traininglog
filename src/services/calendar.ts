import { ExerciseLog } from '@/types/exercise';
import { getExerciseLogsByDate, saveExerciseLog } from '@/utils/localStorageUtils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/services/firebase/config';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { toLocalDateString } from '@/utils/dateUtils';

export interface CalendarDaySummary {
  date: Date;
  sessionDateKey: string;
  sessionCount: number;
  hasSessions: boolean;
}

const getCurrentUserId = (): string | null => {
  const auth = getAuth();
  return auth.currentUser?.uid || null;
};

export const getMonthSessionSummaries = async (month: Date): Promise<CalendarDaySummary[]> => {
  const userId = getCurrentUserId();
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  if (!userId) {
    return monthDays.map((date) => ({
      date,
      sessionDateKey: toLocalDateString(date),
      sessionCount: 0,
      hasSessions: false,
    }));
  }

  try {
    const startDateKey = toLocalDateString(startDate);
    const endDateKey = toLocalDateString(endDate);
    const sessionsQuery = query(
      collection(db, 'users', userId, 'sessions'),
      where('sessionDateKey', '>=', startDateKey),
      where('sessionDateKey', '<=', endDateKey)
    );
    const snapshot = await getDocs(sessionsQuery);
    const sessionCounts = new Map<string, number>();

    snapshot.docs.forEach((sessionDoc) => {
      const sessionData = sessionDoc.data() as { sessionDateKey?: unknown; sessionType?: unknown; isWarmup?: unknown };
      if (sessionData.sessionType === 'warmup' || sessionData.isWarmup === true) {
        return;
      }

      const sessionDateKey = sessionData.sessionDateKey;
      if (typeof sessionDateKey !== 'string' || sessionDateKey.length === 0) {
        return;
      }

      sessionCounts.set(sessionDateKey, (sessionCounts.get(sessionDateKey) || 0) + 1);
    });

    return monthDays.map((date) => {
      const sessionDateKey = toLocalDateString(date);
      const sessionCount = sessionCounts.get(sessionDateKey) || 0;

      return {
        date,
        sessionDateKey,
        sessionCount,
        hasSessions: sessionCount > 0,
      };
    });
  } catch (error) {
    console.error('Error fetching month session summaries:', error);
    return monthDays.map((date) => ({
      date,
      sessionDateKey: toLocalDateString(date),
      sessionCount: 0,
      hasSessions: false,
    }));
  }
};

export const getWeekSessionSummaries = async (weekStart: Date): Promise<CalendarDaySummary[]> => {
  const userId = getCurrentUserId();
  const startDate = startOfWeek(weekStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

  if (!userId) {
    return weekDays.map((date) => ({
      date,
      sessionDateKey: toLocalDateString(date),
      sessionCount: 0,
      hasSessions: false,
    }));
  }

  try {
    const startDateKey = toLocalDateString(startDate);
    const endDateKey = toLocalDateString(endDate);
    const sessionsQuery = query(
      collection(db, 'users', userId, 'sessions'),
      where('sessionDateKey', '>=', startDateKey),
      where('sessionDateKey', '<=', endDateKey)
    );
    const snapshot = await getDocs(sessionsQuery);
    const sessionCounts = new Map<string, number>();

    snapshot.docs.forEach((sessionDoc) => {
      const sessionData = sessionDoc.data() as { sessionDateKey?: unknown; sessionType?: unknown; isWarmup?: unknown };
      if (sessionData.sessionType === 'warmup' || sessionData.isWarmup === true) {
        return;
      }

      const sessionDateKey = sessionData.sessionDateKey;
      if (typeof sessionDateKey !== 'string' || sessionDateKey.length === 0) {
        return;
      }

      sessionCounts.set(sessionDateKey, (sessionCounts.get(sessionDateKey) || 0) + 1);
    });

    return weekDays.map((date) => {
      const sessionDateKey = toLocalDateString(date);
      const sessionCount = sessionCounts.get(sessionDateKey) || 0;

      return {
        date,
        sessionDateKey,
        sessionCount,
        hasSessions: sessionCount > 0,
      };
    });
  } catch (error) {
    console.error('Error fetching week session summaries:', error);
    return weekDays.map((date) => ({
      date,
      sessionDateKey: toLocalDateString(date),
      sessionCount: 0,
      hasSessions: false,
    }));
  }
};

export const getWorkoutsByDate = async (date: Date): Promise<ExerciseLog[]> => {
  try {
    const logs = await getExerciseLogsByDate(date);
    // Filter out logs without IDs and ensure all required properties are present
    return logs.filter((log): log is ExerciseLog => {
      return !!log.id && !!log.exerciseName && !!log.sets && !!log.timestamp;
    });
  } catch (error) {
    console.error('Error getting workouts by date:', error);
    return [];
  }
};

export const getWorkoutDays = async (month: Date): Promise<Date[]> => {
  const summaries = await getMonthSessionSummaries(month);
  return summaries
    .filter((summary) => summary.hasSessions)
    .map((summary) => summary.date);
};

export const getWorkoutDaysForWeek = async (weekStart: Date): Promise<Date[]> => {
  const summaries = await getWeekSessionSummaries(weekStart);
  return summaries
    .filter((summary) => summary.hasSessions)
    .map((summary) => summary.date);
};

export const copyWorkoutFromDate = async (sourceDate: Date, targetDate: Date): Promise<boolean> => {
  try {
    const workouts = await getExerciseLogsByDate(sourceDate);
    if (workouts.length === 0) return false;

    const targetWorkouts = workouts.map(workout => ({
      ...workout,
      id: crypto.randomUUID(),
      timestamp: targetDate
    }));

    // Save each workout to the target date
    for (const workout of targetWorkouts) {
      await saveExerciseLog(workout);
    }

    return true;
  } catch (error) {
    console.error('Error copying workout:', error);
    return false;
  }
};
