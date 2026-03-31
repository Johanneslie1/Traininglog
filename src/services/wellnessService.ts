import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  doc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/services/firebase/config';
import { WellnessLog, WellnessMetricKey } from '@/types/wellness';

function ensureAuth(): string {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User must be logged in');
  return uid;
}

function removeUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

/**
 * Fetch the wellness log for a specific date (YYYY-MM-DD).
 * Returns null if no entry exists.
 */
export async function getWellnessByDate(
  userId: string,
  date: string
): Promise<WellnessLog | null> {
  const ref = collection(db, 'users', userId, 'wellnessLogs');
  const q = query(ref, where('date', '==', date));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<WellnessLog, 'id'>) };
}

/**
 * Save (upsert) a wellness log for a specific date.
 * Only the provided metrics are written — undefined values are omitted, which
 * allows partial saves without overwriting previously stored fields when using
 * updateDoc.  For a brand-new document (addDoc) all keys are persisted.
 */
export async function saveWellnessLog(
  date: string,
  metrics: Partial<Record<WellnessMetricKey, number | undefined>>,
  notes?: string
): Promise<void> {
  const userId = ensureAuth();
  const ref = collection(db, 'users', userId, 'wellnessLogs');

  // Check for an existing entry for this date
  const q = query(ref, where('date', '==', date));
  const snap = await getDocs(q);

  const payload = removeUndefined({
    userId,
    date,
    sleepQuality: metrics.sleepQuality,
    fatigue: metrics.fatigue,
    muscleSoreness: metrics.muscleSoreness,
    stress: metrics.stress,
    mood: metrics.mood,
    notes: notes ?? undefined,
  });

  if (snap.empty) {
    await addDoc(ref, { ...payload, timestamp: serverTimestamp() });
  } else {
    const existingDoc = snap.docs[0];
    await updateDoc(doc(db, 'users', userId, 'wellnessLogs', existingDoc.id), {
      ...payload,
      timestamp: serverTimestamp(),
    });
  }
}

/**
 * Fetch all wellness logs within a date range (inclusive).
 * startDate / endDate should be YYYY-MM-DD strings.
 */
export async function getWellnessByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WellnessLog[]> {
  const ref = collection(db, 'users', userId, 'wellnessLogs');
  const q = query(
    ref,
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<WellnessLog, 'id'>),
  }));
}
