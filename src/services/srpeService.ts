import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/services/firebase/config';
import { SaveSrpeLogInput, SportsLoadSession, SrpeLog } from '@/types/srpe';
import { getDateEpochDay, toLocalDateString } from '@/utils/dateUtils';

function ensureAuth(): string {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User must be logged in');
  return uid;
}

function assertNotFutureDate(date: string): void {
  const todayKey = toLocalDateString(new Date());
  if (date > todayKey) {
    throw new Error('Cannot log RPE for a future date');
  }
}

function assertValidSrpeInput(input: SaveSrpeLogInput): void {
  if (!Number.isInteger(input.rpe) || input.rpe < 1 || input.rpe > 10) {
    throw new Error('RPE must be an integer from 1 to 10');
  }

  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error('Session duration must be a positive whole number of minutes');
  }

  if (input.sportType !== undefined && input.sportType.trim().length === 0) {
    throw new Error('Sport type must not be empty');
  }

  if (input.sportName !== undefined && input.sportName.trim().length === 0) {
    throw new Error('Sport name must not be empty');
  }

  if (input.sessionName !== undefined && input.sessionName.trim().length === 0) {
    throw new Error('Session name must not be empty');
  }

  const optionalPositiveWholeNumbers: Array<[keyof SaveSrpeLogInput, string]> = [
    ['distanceMeters', 'Distance'],
    ['calories', 'Calories'],
    ['averageHeartRate', 'Average heart rate'],
    ['maxHeartRate', 'Max heart rate'],
  ];

  optionalPositiveWholeNumbers.forEach(([key, label]) => {
    const value = input[key] as number | undefined;
    if (value !== undefined && (!Number.isInteger(value) || value <= 0)) {
      throw new Error(`${label} must be a positive whole number when provided`);
    }
  });

  if (input.notes !== undefined && input.notes.trim().length > 1000) {
    throw new Error('Notes must be 1000 characters or fewer');
  }
}

export function calculateSessionLoad(input: SaveSrpeLogInput): number {
  return input.rpe * input.durationMinutes;
}

function mapSportsLoadSession(id: string, data: Omit<SportsLoadSession, 'id'>): SportsLoadSession {
  const sportName = data.sportName || 'Football';
  return {
    id,
    ...data,
    sportType: data.sportType || 'football',
    sportName,
    sessionName: data.sessionName || sportName,
  };
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function isPermissionDenied(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code?: string }).code === 'permission-denied';
  }

  return error instanceof Error && error.message.toLowerCase().includes('insufficient permissions');
}

function aggregateSportsLoadSessions(
  userId: string,
  date: string,
  sessions: SportsLoadSession[]
): SrpeLog | null {
  if (sessions.length === 0) return null;

  const durationMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const sessionLoad = sessions.reduce((sum, session) => sum + session.sessionLoad, 0);
  const weightedRpe = durationMinutes > 0
    ? roundOne(sessions.reduce((sum, session) => sum + session.rpe * session.durationMinutes, 0) / durationMinutes)
    : roundOne(sessions.reduce((sum, session) => sum + session.rpe, 0) / sessions.length);
  const firstSession = sessions[0];
  const hasOneSport = sessions.every((session) => (session.sportType || 'football') === (firstSession.sportType || 'football'));
  const aggregateSportName = hasOneSport ? firstSession.sportName || 'Football' : 'Multiple sports';

  return {
    id: date,
    userId,
    date,
    dateEpochDay: firstSession.dateEpochDay,
    timestamp: firstSession.timestamp,
    rpe: weightedRpe,
    durationMinutes,
    sessionLoad,
    sportType: hasOneSport ? firstSession.sportType || 'football' : 'multiple',
    sportName: aggregateSportName,
    sessionName: sessions.length === 1 ? sessions[0].sessionName || aggregateSportName : aggregateSportName,
    sessionCount: sessions.length,
    isAggregate: true,
  };
}

async function getLegacySrpeByDate(userId: string, date: string): Promise<SrpeLog | null> {
  const ref = doc(db, 'users', userId, 'srpeLogs', date);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    sessionCount: 1,
    ...(snap.data() as Omit<SrpeLog, 'id'>),
  };
}

export async function getSportsLoadSessionsByDate(
  userId: string,
  date: string
): Promise<SportsLoadSession[]> {
  const ref = collection(db, 'users', userId, 'sportsLoadSessions');
  const q = query(ref, where('date', '==', date));
  const snap = await getDocs(q);

  return snap.docs
    .map((d) => mapSportsLoadSession(d.id, d.data() as Omit<SportsLoadSession, 'id'>))
    .sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
      return aTime - bTime;
    });
}

export async function getSportsLoadSessionsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<SportsLoadSession[]> {
  const ref = collection(db, 'users', userId, 'sportsLoadSessions');
  const q = query(
    ref,
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snap = await getDocs(q);

  return snap.docs
    .map((d) => mapSportsLoadSession(d.id, d.data() as Omit<SportsLoadSession, 'id'>))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function saveSportsLoadSession(
  date: string,
  input: SaveSrpeLogInput,
  existingSessionId?: string
): Promise<string> {
  assertNotFutureDate(date);
  assertValidSrpeInput(input);

  const userId = ensureAuth();
  const dateEpochDay = getDateEpochDay(date, 'RPE date');
  const ref = existingSessionId
    ? doc(db, 'users', userId, 'sportsLoadSessions', existingSessionId)
    : doc(collection(db, 'users', userId, 'sportsLoadSessions'));
  const sessionLoad = calculateSessionLoad(input);
  const sportType = input.sportType?.trim() || 'football';
  const sportName = input.sportName?.trim() || 'Football';
  const sessionName = input.sessionName?.trim() || sportName;
  const sessionData: Record<string, unknown> = {
    userId,
    date,
    dateEpochDay,
    rpe: input.rpe,
    durationMinutes: input.durationMinutes,
    sessionLoad,
    sportType,
    sportName,
    sessionName,
    timestamp: serverTimestamp(),
  };

  if (input.distanceMeters !== undefined) {
    sessionData.distanceMeters = input.distanceMeters;
  }
  if (input.calories !== undefined) {
    sessionData.calories = input.calories;
  }
  if (input.averageHeartRate !== undefined) {
    sessionData.averageHeartRate = input.averageHeartRate;
  }
  if (input.maxHeartRate !== undefined) {
    sessionData.maxHeartRate = input.maxHeartRate;
  }
  const trimmedNotes = input.notes?.trim();
  if (trimmedNotes) {
    sessionData.notes = trimmedNotes;
  }

  await setDoc(ref, sessionData);

  return ref.id;
}

export async function deleteSportsLoadSession(sessionId: string): Promise<void> {
  if (!sessionId) {
    throw new Error('Sports load session id is required');
  }

  const userId = ensureAuth();
  const ref = doc(db, 'users', userId, 'sportsLoadSessions', sessionId);
  await deleteDoc(ref);
}

export async function deleteSrpeLog(date: string): Promise<void> {
  if (!date) {
    throw new Error('RPE date is required');
  }

  const userId = ensureAuth();
  const ref = doc(db, 'users', userId, 'srpeLogs', date);
  await deleteDoc(ref);
}

export async function getSrpeByDate(
  userId: string,
  date: string
): Promise<SrpeLog | null> {
  let sessions: SportsLoadSession[] = [];
  try {
    sessions = await getSportsLoadSessionsByDate(userId, date);
  } catch (error) {
    if (!isPermissionDenied(error)) throw error;
  }

  const aggregate = aggregateSportsLoadSessions(userId, date, sessions);
  return aggregate || getLegacySrpeByDate(userId, date);
}

export async function saveSrpeLog(
  date: string,
  input: SaveSrpeLogInput
): Promise<void> {
  await saveSportsLoadSession(date, input);
}

export async function getSrpeByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<SrpeLog[]> {
  let sessions: SportsLoadSession[] = [];
  try {
    sessions = await getSportsLoadSessionsByDateRange(userId, startDate, endDate);
  } catch (error) {
    if (!isPermissionDenied(error)) throw error;
  }

  const sessionsByDate = new Map<string, SportsLoadSession[]>();

  sessions.forEach((session) => {
    const dateSessions = sessionsByDate.get(session.date) || [];
    dateSessions.push(session);
    sessionsByDate.set(session.date, dateSessions);
  });

  const aggregates = Array.from(sessionsByDate.entries())
    .map(([date, dateSessions]) => aggregateSportsLoadSessions(userId, date, dateSessions))
    .filter((log): log is SrpeLog => Boolean(log));

  const legacyRef = collection(db, 'users', userId, 'srpeLogs');
  const legacyQuery = query(
    legacyRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const legacySnap = await getDocs(legacyQuery);
  const legacyRows = legacySnap.docs
    .map((d) => ({
      id: d.id,
      sessionCount: 1,
      ...(d.data() as Omit<SrpeLog, 'id'>),
    }))
    .filter((log) => !sessionsByDate.has(log.date));

  return [...aggregates, ...legacyRows].sort((a, b) => a.date.localeCompare(b.date));
}
