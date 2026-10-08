import { Habit, HabitDayEntry } from '@/types/habit';
import { addDays, dateKeyToLocalDate, toLocalDateString } from '@/utils/dateUtils';

export type HabitDayMark = 'met' | 'miss' | 'future' | 'inactive';

export interface HabitRate {
  met: number;
  expected: number;
  rate: number;
}

export function addDateKey(dateKey: string, days: number): string {
  const date = dateKeyToLocalDate(dateKey);
  if (!date) throw new Error('Invalid habit date');
  return toLocalDateString(addDays(date, days));
}

export function eachDateKey(start: string, end: string): string[] {
  if (start > end) return [];
  const keys: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    keys.push(cursor);
    cursor = addDateKey(cursor, 1);
  }
  return keys;
}

export function isEntryMet(habit: Pick<Habit, 'kind' | 'target'>, entry: HabitDayEntry | undefined): boolean {
  if (!entry) return false;
  if (habit.kind === 'count') {
    const target = habit.target ?? 1;
    return (entry.value ?? 0) >= target;
  }
  return entry.completed === true;
}

/** Days this habit is expected to be logged. Future days and the archive date onward are excluded. */
export function isHabitExpectedOnDate(habit: Pick<Habit, 'activeFrom' | 'archived' | 'archivedOn'>, dateKey: string, todayKey: string): boolean {
  if (dateKey < habit.activeFrom || dateKey > todayKey) return false;
  if (habit.archived) {
    if (!habit.archivedOn) return false;
    if (dateKey >= habit.archivedOn) return false;
  }
  return true;
}

export function habitDayMark(
  habit: Pick<Habit, 'kind' | 'target' | 'activeFrom' | 'archived' | 'archivedOn'>,
  dateKey: string,
  todayKey: string,
  entry: HabitDayEntry | undefined,
): HabitDayMark {
  if (dateKey > todayKey) return 'future';
  if (!isHabitExpectedOnDate(habit, dateKey, todayKey)) return 'inactive';
  return isEntryMet(habit, entry) ? 'met' : 'miss';
}

export function habitCompletion(
  habit: Pick<Habit, 'kind' | 'target' | 'activeFrom' | 'archived' | 'archivedOn'>,
  entriesByDate: Record<string, HabitDayEntry | undefined>,
  todayKey: string,
  rangeStart?: string,
  rangeEnd?: string,
): HabitRate {
  const lastExpected = lastExpectedDate(habit, todayKey);
  if (!lastExpected) return { met: 0, expected: 0, rate: 0 };

  const start = rangeStart && rangeStart > habit.activeFrom ? rangeStart : habit.activeFrom;
  const end = rangeEnd && rangeEnd < lastExpected ? rangeEnd : lastExpected;
  if (start > end) return { met: 0, expected: 0, rate: 0 };

  let met = 0;
  let expected = 0;
  for (const dateKey of eachDateKey(start, end)) {
    if (!isHabitExpectedOnDate(habit, dateKey, todayKey)) continue;
    expected += 1;
    if (isEntryMet(habit, entriesByDate[dateKey])) met += 1;
  }

  return {
    met,
    expected,
    rate: expected === 0 ? 0 : met / expected,
  };
}

/**
 * Consecutive met days ending today, or ending yesterday when today is still open.
 * An open today does not break the streak.
 */
export function currentStreak(
  habit: Pick<Habit, 'kind' | 'target' | 'activeFrom' | 'archived' | 'archivedOn'>,
  entriesByDate: Record<string, HabitDayEntry | undefined>,
  todayKey: string,
): number {
  let cursor = lastExpectedDate(habit, todayKey);
  if (!cursor) return 0;
  if (cursor === todayKey && !isEntryMet(habit, entriesByDate[cursor])) {
    cursor = addDateKey(cursor, -1);
  }

  let streak = 0;
  while (isHabitExpectedOnDate(habit, cursor, todayKey)) {
    if (!isEntryMet(habit, entriesByDate[cursor])) break;
    streak += 1;
    cursor = addDateKey(cursor, -1);
  }
  return streak;
}

export function bestStreak(
  habit: Pick<Habit, 'kind' | 'target' | 'activeFrom' | 'archived' | 'archivedOn'>,
  entriesByDate: Record<string, HabitDayEntry | undefined>,
  todayKey: string,
): number {
  const last = lastExpectedDate(habit, todayKey);
  if (!last || habit.activeFrom > last) return 0;

  let best = 0;
  let run = 0;
  for (const dateKey of eachDateKey(habit.activeFrom, last)) {
    if (!isHabitExpectedOnDate(habit, dateKey, todayKey)) {
      run = 0;
      continue;
    }
    if (isEntryMet(habit, entriesByDate[dateKey])) {
      run += 1;
      if (run > best) best = run;
    } else if (dateKey === todayKey) {
      continue;
    } else {
      run = 0;
    }
  }
  return best;
}

function lastExpectedDate(habit: Pick<Habit, 'activeFrom' | 'archived' | 'archivedOn'>, todayKey: string): string | null {
  let end = todayKey;
  if (habit.archived) {
    if (!habit.archivedOn) return null;
    end = addDateKey(habit.archivedOn, -1);
    if (end > todayKey) end = todayKey;
  }
  if (habit.activeFrom > end) return null;
  return end;
}
