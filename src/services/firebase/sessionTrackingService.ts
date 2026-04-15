import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { toLocalDateString } from '@/utils/dateUtils';
import { DEFAULT_SESSION_TYPE, normalizeSessionType, SessionType } from '@/types/sessionType';

export interface SessionContext {
  sessionId: string;
  sessionType: SessionType;
  sessionDateKey: string;
  sessionWeekKey: string;
  sessionNumberInDay: number;
  sessionNumberInWeek: number;
}

interface SessionDoc extends SessionContext {
  userId: string;
  name?: string;
  status: 'active' | 'completed';
  startedAt: Timestamp;
  /** Written when the session is explicitly completed or superseded by a new session. */
  endedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface EnsureSessionOptions {
  requestedSessionId?: string;
  requestedSessionType?: SessionType;
  forceNewSession?: boolean;
}

const toIsoWeekKey = (date: Date): string => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

const toSessionContext = (docId: string, data: Partial<SessionDoc>): SessionContext => ({
  sessionId: docId,
  sessionType: normalizeSessionType(data.sessionType),
  sessionDateKey: String(data.sessionDateKey || ''),
  sessionWeekKey: String(data.sessionWeekKey || ''),
  sessionNumberInDay: Number(data.sessionNumberInDay || 1),
  sessionNumberInWeek: Number(data.sessionNumberInWeek || 1),
});

const parseTimestamp = (value: unknown): number => {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in (value as Record<string, unknown>) &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
};

const getDefaultSessionDocId = (sessionDateKey: string, sessionType: SessionType): string => {
  return `default-${sessionDateKey}-${sessionType}`;
};

const hasLogsForSession = async (userId: string, sessionId: string): Promise<boolean> => {
  const LOG_COLLECTIONS = ['exercises', 'activities', 'strengthExercises'] as const;

  for (const collName of LOG_COLLECTIONS) {
    const snap = await getDocs(
      query(
        collection(db, 'users', userId, collName),
        where('sessionId', '==', sessionId)
      )
    );

    if (!snap.empty) {
      return true;
    }
  }

  return false;
};

export const ensureSessionContextForLog = async (
  userId: string,
  selectedDate: Date,
  options: EnsureSessionOptions = {}
): Promise<SessionContext> => {
  const sessionDateKey = toLocalDateString(selectedDate);
  const sessionWeekKey = toIsoWeekKey(selectedDate);
  const requestedSessionType = normalizeSessionType(options.requestedSessionType || DEFAULT_SESSION_TYPE);

  if (options.requestedSessionId) {
    const requestedRef = doc(db, 'users', userId, 'sessions', options.requestedSessionId);
    const requestedDoc = await getDoc(requestedRef);
    if (requestedDoc.exists()) {
      return toSessionContext(requestedDoc.id, requestedDoc.data() as Partial<SessionDoc>);
    }
  }

  const sessionsCollectionRef = collection(db, 'users', userId, 'sessions');

  const dayQuery = query(
    sessionsCollectionRef,
    where('userId', '==', userId),
    where('sessionDateKey', '==', sessionDateKey)
  );
  const daySnapshot = await getDocs(dayQuery);

  const daySessions: Array<{ id: string } & Partial<SessionDoc>> = daySnapshot.docs
    .map((snapshot) => ({ id: snapshot.id, ...(snapshot.data() as Partial<SessionDoc>) }))
    .sort((a, b) => {
      const createdDiff = parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt);
      if (createdDiff !== 0) return createdDiff;
      return parseTimestamp(b.startedAt) - parseTimestamp(a.startedAt);
    });

  const daySessionsOfType = daySessions.filter(
    (session) => normalizeSessionType(session.sessionType) === requestedSessionType
  );

  if (!options.forceNewSession && daySessionsOfType.length > 0) {
    const activeSession = daySessionsOfType.find((session) => session.status === 'active');
    if (activeSession) {
      return toSessionContext(activeSession.id, activeSession);
    }
    return toSessionContext(daySessionsOfType[0].id, daySessionsOfType[0]);
  }

  const weekQuery = query(
    sessionsCollectionRef,
    where('userId', '==', userId),
    where('sessionWeekKey', '==', sessionWeekKey),
    where('sessionType', '==', requestedSessionType)
  );
  const weekSnapshot = await getDocs(weekQuery);

  if (!options.forceNewSession) {
    const deterministicSessionRef = doc(
      sessionsCollectionRef,
      getDefaultSessionDocId(sessionDateKey, requestedSessionType)
    );

    return runTransaction(db, async (transaction) => {
      const deterministicSnap = await transaction.get(deterministicSessionRef);
      if (deterministicSnap.exists()) {
        return toSessionContext(deterministicSnap.id, deterministicSnap.data() as Partial<SessionDoc>);
      }

      const now = Timestamp.now();
      const sessionDoc: SessionDoc = {
        userId,
        sessionId: deterministicSessionRef.id,
        sessionType: requestedSessionType,
        sessionDateKey,
        sessionWeekKey,
        sessionNumberInDay: 1,
        sessionNumberInWeek: weekSnapshot.size + 1,
        status: 'active',
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      transaction.set(deterministicSessionRef, sessionDoc);

      return {
        sessionId: deterministicSessionRef.id,
        sessionType: requestedSessionType,
        sessionDateKey,
        sessionWeekKey,
        sessionNumberInDay: 1,
        sessionNumberInWeek: weekSnapshot.size + 1,
      };
    });
  }

  const sessionNumberInDay = daySessionsOfType.length + 1;
  const sessionNumberInWeek = weekSnapshot.size + 1;

  const previouslyActiveSessions = daySessionsOfType.filter((session) => session.status === 'active');
  const completedAt = Timestamp.now();
  await Promise.all(
    previouslyActiveSessions.map((session) =>
      updateDoc(doc(db, 'users', userId, 'sessions', session.id), {
        status: 'completed',
        endedAt: completedAt,
        updatedAt: completedAt,
      })
    )
  );

  const sessionRef = doc(sessionsCollectionRef);
  const now = Timestamp.now();

  const sessionDoc: SessionDoc = {
    userId,
    sessionId: sessionRef.id,
    sessionType: requestedSessionType,
    sessionDateKey,
    sessionWeekKey,
    sessionNumberInDay,
    sessionNumberInWeek,
    status: 'active',
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(sessionRef, sessionDoc);

  return {
    sessionId: sessionRef.id,
    sessionType: requestedSessionType,
    sessionDateKey,
    sessionWeekKey,
    sessionNumberInDay,
    sessionNumberInWeek,
  };
};

/** Deletes a session doc and all log documents (exercises/activities) that belonged to it. */
export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
  const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) return;

  const LOG_COLLECTIONS = ['exercises', 'activities', 'strengthExercises'] as const;
  const logRefs: ReturnType<typeof doc>[] = [];
  for (const collName of LOG_COLLECTIONS) {
    const q = query(
      collection(db, 'users', userId, collName),
      where('sessionId', '==', sessionId)
    );
    const snap = await getDocs(q);
    snap.docs.forEach((d) => logRefs.push(d.ref));
  }

  // Batch delete all logs + session doc
  const BATCH_SIZE = 498;
  let batch = writeBatch(db);
  let count = 0;

  for (const ref of logRefs) {
    batch.delete(ref);
    count++;
    if (count >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }

  batch.delete(sessionRef);
  await batch.commit();
};

/** Renames a session document. Pass an empty string to clear the name. */
export const renameSession = async (userId: string, sessionId: string, name: string): Promise<void> => {
  const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
  const trimmed = name.trim();
  await updateDoc(sessionRef, {
    ...(trimmed ? { name: trimmed } : { name: deleteField() }),
    updatedAt: Timestamp.now(),
  });
};

/**
 * Marks a session as completed and records its end time.
 * Safe to call multiple times — subsequent calls are no-ops if already completed.
 */
export const completeSession = async (userId: string, sessionId: string): Promise<void> => {
  const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) return;
  const data = snap.data() as Partial<SessionDoc>;
  if (data.status === 'completed') return;
  const now = Timestamp.now();
  await updateDoc(sessionRef, {
    status: 'completed',
    endedAt: now,
    updatedAt: now,
  });
};

/** Ensures a default (Session 1) exists for the given date without forcing a new one. */
export const ensureDefaultSessionForDate = (
  userId: string,
  date: Date,
  sessionType: SessionType = DEFAULT_SESSION_TYPE
): Promise<SessionContext> =>
  ensureSessionContextForLog(userId, date, { requestedSessionType: sessionType });

export const createNewSessionForDate = async (
  userId: string,
  selectedDate: Date,
  sessionType: SessionType = DEFAULT_SESSION_TYPE
): Promise<SessionContext> => {
  const normalizedType = normalizeSessionType(sessionType);
  const sessionDateKey = toLocalDateString(selectedDate);

  const dayQuery = query(
    collection(db, 'users', userId, 'sessions'),
    where('userId', '==', userId),
    where('sessionDateKey', '==', sessionDateKey),
    where('sessionType', '==', normalizedType)
  );
  const snapshot = await getDocs(dayQuery);
  const existingSessions = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() as Partial<SessionDoc>;
      return {
        sessionId: docSnap.id,
        sessionNumberInDay: Number(data.sessionNumberInDay || 1),
      };
    })
    .sort((a, b) => a.sessionNumberInDay - b.sessionNumberInDay);

  if (normalizedType === 'main' && existingSessions.length === 0) {
    throw new Error('Log your first exercise before creating another session.');
  }

  if (existingSessions.length > 0) {
    const previousSession = existingSessions[existingSessions.length - 1];
    const previousHasLogs = await hasLogsForSession(userId, previousSession.sessionId);

    if (!previousHasLogs) {
      throw new Error('Add at least one logged exercise before creating another session.');
    }
  }

  return ensureSessionContextForLog(userId, selectedDate, {
    forceNewSession: true,
    requestedSessionType: normalizedType,
  });
};

export interface SessionInfo extends SessionContext {
  name?: string;
  status: 'active' | 'completed';
}

export const getSessionsForDate = async (userId: string, date: Date): Promise<SessionInfo[]> => {
  const sessionDateKey = toLocalDateString(date);
  const dayQuery = query(
    collection(db, 'users', userId, 'sessions'),
    where('userId', '==', userId),
    where('sessionDateKey', '==', sessionDateKey)
  );
  const snapshot = await getDocs(dayQuery);
  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() as Partial<SessionDoc>;
      return {
        ...toSessionContext(docSnap.id, data),
        name: data.name,
        status: (data.status === 'active' ? 'active' : 'completed') as 'active' | 'completed',
        startedAtSortKey: parseTimestamp(data.startedAt) || parseTimestamp(data.createdAt),
      };
    })
    .sort((a, b) => a.startedAtSortKey - b.startedAtSortKey)
    .map(({ startedAtSortKey, ...session }) => session);
};

