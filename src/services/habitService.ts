import {
  collection,
  deleteField,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/services/firebase/config';
import { Habit, HabitDay, HabitDayEntry, HabitKind } from '@/types/habit';
import { getDateEpochDay, toLocalDateString } from '@/utils/dateUtils';

export interface NewHabitInput {
  name: string;
  kind: HabitKind;
  target?: number;
  unit?: string;
  sortOrder: number;
}

function ensureAuth(): string {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error('User must be logged in');
  return uid;
}

function assertNotFutureDate(date: string): void {
  const todayKey = toLocalDateString(new Date());
  if (date > todayKey) {
    throw new Error('Cannot log a habit for a future date');
  }
}

function removeUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function mapHabit(id: string, data: Partial<Habit>): Habit {
  return {
    id,
    userId: String(data.userId ?? ''),
    name: String(data.name ?? ''),
    kind: data.kind === 'count' ? 'count' : 'check',
    target: typeof data.target === 'number' ? data.target : undefined,
    unit: typeof data.unit === 'string' ? data.unit : undefined,
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
    activeFrom: String(data.activeFrom ?? ''),
    archived: data.archived === true,
    archivedOn: typeof data.archivedOn === 'string' ? data.archivedOn : undefined,
  };
}

export async function listHabits(userId: string): Promise<Habit[]> {
  const ref = collection(db, 'users', userId, 'habits');
  const snap = await getDocs(ref);
  return snap.docs
    .map((item) => mapHabit(item.id, item.data() as Partial<Habit>))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function createHabit(input: NewHabitInput, activeFrom: string): Promise<string> {
  const userId = ensureAuth();
  const name = input.name.trim();
  if (!name) throw new Error('Habit name is required');
  if (input.kind === 'count' && (!input.target || input.target < 1)) {
    throw new Error('Count habits need a target of at least 1');
  }

  const ref = doc(collection(db, 'users', userId, 'habits'));
  await setDoc(ref, removeUndefined({
    userId,
    name,
    kind: input.kind,
    target: input.kind === 'count' ? Math.round(input.target ?? 1) : undefined,
    unit: input.kind === 'count' ? input.unit?.trim() || undefined : undefined,
    sortOrder: input.sortOrder,
    activeFrom,
    archived: false,
    createdAt: serverTimestamp(),
  }));
  return ref.id;
}

export async function updateHabit(habitId: string, patch: Partial<Pick<Habit, 'name' | 'sortOrder' | 'archived' | 'archivedOn' | 'target' | 'unit'>>): Promise<void> {
  const userId = ensureAuth();
  const ref = doc(db, 'users', userId, 'habits', habitId);
  await updateDoc(ref, removeUndefined({
    name: patch.name?.trim(),
    sortOrder: patch.sortOrder,
    archived: patch.archived,
    archivedOn: patch.archived === false ? deleteField() : patch.archivedOn,
    target: patch.target,
    unit: patch.unit,
    updatedAt: serverTimestamp(),
  }));
}

export async function getHabitDays(userId: string, startDate: string, endDate: string): Promise<HabitDay[]> {
  const ref = collection(db, 'users', userId, 'habitDays');
  const snap = await getDocs(query(ref, where('date', '>=', startDate), where('date', '<=', endDate)));
  return snap.docs.map((item) => {
    const data = item.data() as Omit<HabitDay, 'id' | 'entries'> & { entries?: HabitDay['entries'] };
    return {
      id: item.id,
      userId: data.userId,
      date: data.date,
      dateEpochDay: data.dateEpochDay,
      entries: data.entries ?? {},
    };
  });
}

export async function saveHabitEntry(date: string, habitId: string, entry: HabitDayEntry): Promise<void> {
  assertNotFutureDate(date);
  const userId = ensureAuth();
  const dateEpochDay = getDateEpochDay(date, 'habit date');
  const ref = doc(db, 'users', userId, 'habitDays', date);
  const payload = removeUndefined(entry);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const existing = snap.exists()
      ? ((snap.data().entries ?? {}) as Record<string, HabitDayEntry>)
      : {};
    transaction.set(ref, {
      userId,
      date,
      dateEpochDay,
      updatedAt: serverTimestamp(),
      entries: {
        ...existing,
        [habitId]: payload,
      },
    });
  });
}
