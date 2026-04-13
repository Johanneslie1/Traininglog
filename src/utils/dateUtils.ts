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
