import {
  collection,
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
import { SaveSrpeLogInput, SrpeLog } from '@/types/srpe';
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
}

export function calculateSessionLoad(input: SaveSrpeLogInput): number {
  return input.rpe * input.durationMinutes;
}

export async function getSrpeByDate(
  userId: string,
  date: string
): Promise<SrpeLog | null> {
  const ref = doc(db, 'users', userId, 'srpeLogs', date);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<SrpeLog, 'id'>),
  };
}

export async function saveSrpeLog(
  date: string,
  input: SaveSrpeLogInput
): Promise<void> {
  assertNotFutureDate(date);
  assertValidSrpeInput(input);

  const userId = ensureAuth();
  const dateEpochDay = getDateEpochDay(date, 'RPE date');
  const ref = doc(collection(db, 'users', userId, 'srpeLogs'), date);
  const sessionLoad = calculateSessionLoad(input);

  await setDoc(ref, {
    userId,
    date,
    dateEpochDay,
    rpe: input.rpe,
    durationMinutes: input.durationMinutes,
    sessionLoad,
    timestamp: serverTimestamp(),
  });
}

export async function getSrpeByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<SrpeLog[]> {
  const ref = collection(db, 'users', userId, 'srpeLogs');
  const q = query(
    ref,
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<SrpeLog, 'id'>),
  }));
}
