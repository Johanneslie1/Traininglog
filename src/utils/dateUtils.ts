export function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Returns YYYY-MM-DD in the user's LOCAL timezone.
 * Using toISOString() would convert to UTC first, shifting the date
 * backwards for users in UTC+ timezones (e.g. CET: March 29 00:00 → March 28 23:00 UTC).
 */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export interface WeekDateRange {
  startDate: Date;
  endDate: Date;
  startDateKey: string;
  endDateKey: string;
  dateKeys: string[];
}

export function startOfLocalWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  return addDays(start, -diff);
}

export function getLocalWeekDateRange(date: Date, weekStartsOn: 0 | 1 = 1): WeekDateRange {
  const startDate = startOfLocalWeek(date, weekStartsOn);
  const endDate = endOfDay(addDays(startDate, 6));
  const dateKeys = Array.from({ length: 7 }, (_, index) =>
    toLocalDateString(addDays(startDate, index))
  );

  return {
    startDate,
    endDate,
    startDateKey: dateKeys[0],
    endDateKey: dateKeys[dateKeys.length - 1],
    dateKeys,
  };
}

export function dateKeyToLocalDate(dateKey: string): Date | null {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const MS_PER_DAY = 86400000;

export function getDateEpochDay(dateKey: string, label = 'date'): number {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error(`Invalid ${label} format. Expected YYYY-MM-DD`);
  }

  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

/**
 * Returns a local ISO-like timestamp string: YYYY-MM-DDTHH:mm:ss (no Z suffix).
 * Preserves the local date so the day is never shifted by timezone offset.
 */
export function toLocalTimestamp(date: Date): string {
  const datePart = toLocalDateString(date);
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${datePart}T${h}:${min}:${sec}`;
}

/** @deprecated Use toLocalDateString instead — this uses UTC which shifts dates in UTC+ timezones */
export function formatDate(date: Date): string {
  return toLocalDateString(date);
}

export function parseDate(dateString: string): Date {
  return new Date(dateString);
}
