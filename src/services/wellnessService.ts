import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  doc,
  deleteField,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/services/firebase/config';
import { WellnessLog, WellnessMetricKey } from '@/types/wellness';
import { getDateEpochDay, toLocalDateString } from '@/utils/dateUtils';

const WELLNESS_KEYS: WellnessMetricKey[] = [
  'sleepQuality',
  'fatigue',
  'muscleSoreness',
  'stress',
  'mood',
  'readiness',
];

const WELLNESS_SCALE_VERSION = 3;

function assertNotFutureDate(date: string): void {
  const todayKey = toLocalDateString(new Date());
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
 * updateDoc. For a brand-new document, the local date key is used as the doc id
 * to prevent duplicate entries for the same day.
 */
export async function saveWellnessLog(
  date: string,
  metrics: Partial<Record<WellnessMetricKey, number | undefined>>,
  notes?: string
): Promise<void> {
  assertNotFutureDate(date);
  const userId = ensureAuth();
  const ref = collection(db, 'users', userId, 'wellnessLogs');
  const dateEpochDay = getDateEpochDay(date, 'wellness date');

  // Check for an existing entry for this date
  const q = query(ref, where('date', '==', date));
  const snap = await getDocs(q);

  const basePayload = removeUndefined({
    userId,
    date,
    dateEpochDay,
    wellnessScaleVersion: WELLNESS_SCALE_VERSION,
    sleepQuality: metrics.sleepQuality,
    fatigue: metrics.fatigue,
    muscleSoreness: metrics.muscleSoreness,
    stress: metrics.stress,
    mood: metrics.mood,
    readiness: metrics.readiness,
    notes,
  });

  if (snap.empty) {
    await setDoc(doc(ref, date), { ...basePayload, timestamp: serverTimestamp() });
  } else {
    const existingDoc = snap.docs[0];
    const updatePayload: Record<string, any> = {
      userId,
      date,
      dateEpochDay,
      wellnessScaleVersion: WELLNESS_SCALE_VERSION,
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
