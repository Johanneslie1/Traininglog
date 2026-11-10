import type { ProgramExercise, ProgramSession } from '@/types/program';
import { addDays, dateKeyToLocalDate, startOfDay, startOfLocalWeek, toLocalDateString } from '@/utils/dateUtils';

export type CalendarRange = 'week' | 'biweek' | 'fourweek' | 'year';

export interface CoachPlacement {
  id: string;
  athleteId: string;
  plannedDates: string[];
  sessionId: string;
  sessionName: string;
  programName?: string;
  coachMessage?: string;
  assignedAt: string;
  exercises: ProgramExercise[];
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
  if (!DATE_KEY.test(value)) return false;
  const date = dateKeyToLocalDate(value);
  return date !== null && toLocalDateString(date) === value;
}

export function memberLabel(member: { firstName?: string; lastName?: string; email?: string }): string {
  const name = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
  return name || member.email || 'Athlete';
}

export function sessionsInProgramOrder<T extends { week?: number; order?: number }>(sessions: T[]): T[] {
  return [...sessions].sort((a, b) => (a.week ?? 0) - (b.week ?? 0) || (a.order ?? 0) - (b.order ?? 0));
}

export function programPlacementDates(startDate: string, sessionCount: number): string[] {
  const start = dateKeyToLocalDate(startDate);
  if (!start || sessionCount < 1) return [];
  return Array.from({ length: sessionCount }, (_, index) => toLocalDateString(addDays(start, index)));
}

function dateKeysBetween(start: Date, end: Date): string[] {
  const keys: string[] = [];
  for (let cursor = startOfDay(start); cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 1)) {
    keys.push(toLocalDateString(cursor));
  }
  return keys;
}

export function rangeDates(anchor: Date, range: CalendarRange): string[] {
  if (range === 'year') {
    const yearStart = new Date(anchor.getFullYear(), 0, 1);
    const gridStart = startOfLocalWeek(yearStart, 1);
    const yearEnd = new Date(anchor.getFullYear(), 11, 31);
    const lastWeekStart = startOfLocalWeek(yearEnd, 1);
    return dateKeysBetween(gridStart, addDays(lastWeekStart, 6));
  }

  const start = startOfLocalWeek(anchor, 1);
  const days = range === 'week' ? 7 : range === 'biweek' ? 14 : 28;
  return Array.from({ length: days }, (_, index) => toLocalDateString(addDays(start, index)));
}

export function shiftAnchor(anchor: Date, range: CalendarRange, direction: -1 | 1): Date {
  if (range === 'year') {
    return new Date(anchor.getFullYear() + direction, anchor.getMonth(), anchor.getDate());
  }
  const days = range === 'week' ? 7 : range === 'biweek' ? 14 : 28;
  return addDays(startOfDay(anchor), days * direction);
}

export function chunkWeeks(dates: string[]): string[][] {
  const weeks: string[][] = [];
  for (let index = 0; index < dates.length; index += 7) {
    weeks.push(dates.slice(index, index + 7));
  }
  return weeks;
}

export function rangeTitle(dates: string[]): string {
  if (dates.length === 0) return '';
  const first = dateKeyToLocalDate(dates[0]);
  const last = dateKeyToLocalDate(dates[dates.length - 1]);
  if (!first || !last) return '';
  const dayMonth = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
  if (first.getFullYear() === last.getFullYear()) {
    return `${dayMonth.format(first)} – ${dayMonth.format(last)} ${first.getFullYear()}`;
  }
  const withYear = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${withYear.format(first)} – ${withYear.format(last)}`;
}

export function weekdayLabel(dateKey: string): string {
  const date = dateKeyToLocalDate(dateKey);
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
}

export function dayCaption(dateKey: string): string {
  const date = dateKeyToLocalDate(dateKey);
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(date);
}

function readPlannedDates(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && isDateKey(item)))].sort();
}

function readExercises(value: unknown): ProgramExercise[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const exercise = item as ProgramExercise;
    if (typeof exercise.name !== 'string' || !exercise.name.trim()) return [];
    const id = typeof exercise.id === 'string' && exercise.id ? exercise.id : `exercise-${index}`;
    return [{ ...exercise, id, name: exercise.name.trim() }];
  });
}

export function toCoachPlacement(id: string, data: Record<string, unknown>): CoachPlacement | null {
  const sessionData = data.sessionData;
  if (!sessionData || typeof sessionData !== 'object' || typeof data.userId !== 'string' || !data.userId) {
    return null;
  }
  const session = sessionData as Partial<ProgramSession>;
  const sessionId = typeof session.id === 'string' && session.id ? session.id : '';
  if (!sessionId) return null;
  const programName = typeof data.sourceProgramName === 'string' && data.sourceProgramName.trim()
    ? data.sourceProgramName.trim()
    : undefined;
  const coachMessage = typeof data.coachMessage === 'string' && data.coachMessage.trim()
    ? data.coachMessage.trim()
    : undefined;
  return {
    id,
    athleteId: data.userId,
    plannedDates: readPlannedDates(data.plannedDates),
    sessionId,
    sessionName: typeof session.name === 'string' && session.name.trim() ? session.name.trim() : 'Session',
    programName,
    coachMessage,
    assignedAt: typeof data.assignedAt === 'string' ? data.assignedAt : '',
    exercises: readExercises(session.exercises),
  };
}
