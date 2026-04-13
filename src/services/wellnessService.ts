import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  doc,
  deleteField,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/services/firebase/config';
import { WellnessLog, WellnessMetricKey } from '@/types/wellness';

const WELLNESS_KEYS: WellnessMetricKey[] = [
  'sleepQuality',
  'fatigue',
  'muscleSoreness',
  'stress',
  'mood',
];

const MS_PER_DAY = 86400000;

function getDateEpochDay(dateKey: string): number {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error('Invalid wellness date format. Expected YYYY-MM-DD');
  }

  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function assertNotFutureDate(date: string): void {
  const todayKey = new Date().toISOString().slice(0, 10);
  if (date > todayKey) {
    throw new Error('Cannot log wellness for a future date');
  }
}

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
  assertNotFutureDate(date);
  const userId = ensureAuth();
  const ref = collection(db, 'users', userId, 'wellnessLogs');
  const dateEpochDay = getDateEpochDay(date);

  // Check for an existing entry for this date
  const q = query(ref, where('date', '==', date));
  const snap = await getDocs(q);

  const basePayload = removeUndefined({
    userId,
    date,
    dateEpochDay,
    sleepQuality: metrics.sleepQuality,
    fatigue: metrics.fatigue,
    muscleSoreness: metrics.muscleSoreness,
    stress: metrics.stress,
    mood: metrics.mood,
    notes,
  });

  if (snap.empty) {
    await addDoc(ref, { ...basePayload, timestamp: serverTimestamp() });
  } else {
    const existingDoc = snap.docs[0];
    const updatePayload: Record<string, any> = {
      userId,
      date,
      dateEpochDay,
      timestamp: serverTimestamp(),
    };

    WELLNESS_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(metrics, key)) {
        updatePayload[key] = metrics[key] === undefined ? deleteField() : metrics[key];
      }
    });

    updatePayload.notes = notes === undefined ? deleteField() : notes;

    await updateDoc(doc(db, 'users', userId, 'wellnessLogs', existingDoc.id), {
      ...updatePayload,
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
