import { cellKey } from '@/features/coach-shell/calendarSelection';
import { toLocalDateString } from '@/utils/dateUtils';

export type CalendarLoggedChipKind = 'resistance' | 'endurance' | 'other' | 'sportsLoad';

export interface CalendarCellLogChip {
  kind: CalendarLoggedChipKind;
  label: string;
  count: number;
  sessionLoad?: number;
}

export interface CalendarCellDaySummary {
  athleteId: string;
  dateKey: string;
  chips: CalendarCellLogChip[];
  hasLoggedWork: boolean;
  totalSportsLoad?: number;
  collapsedTypeCount: number;
}

export interface CalendarGymLogInput {
  date: string;
  activityType?: string;
  sourceCollection?: string;
}

export interface CalendarSportsLoadInput {
  date: string;
  sessionLoad?: number;
}

const MAX_TYPE_CHIPS = 2;

function normalizeGymKind(log: CalendarGymLogInput): 'resistance' | 'endurance' | 'other' {
  const type = (log.activityType ?? '').trim();
  if (type === 'endurance') return 'endurance';
  if (type === 'resistance') return 'resistance';
  const resistanceSource =
    log.sourceCollection === 'exercises'
    || log.sourceCollection === 'strengthExercises'
    || log.sourceCollection === 'exerciseLogs';
  if (!type && resistanceSource) return 'resistance';
  return 'other';
}

function typeChipLabel(kind: 'resistance' | 'endurance' | 'other', count: number): string {
  const name = kind === 'resistance' ? 'Resistance' : kind === 'endurance' ? 'Endurance' : 'Other';
  return `${name} · ${count}`;
}

/** Build chips for one athlete-day from gym logs + sports load sessions. */
export function summarizeDayLogs(
  athleteId: string,
  dateKey: string,
  gymLogs: CalendarGymLogInput[],
  sportsLoadSessions: CalendarSportsLoadInput[]
): CalendarCellDaySummary {
  const counts: Record<'resistance' | 'endurance' | 'other', number> = {
    resistance: 0,
    endurance: 0,
    other: 0,
  };

  gymLogs.forEach((log) => {
    if (log.date !== dateKey) return;
    counts[normalizeGymKind(log)] += 1;
  });

  const typeOrder: Array<'resistance' | 'endurance' | 'other'> = ['resistance', 'endurance', 'other'];
  const presentTypes = typeOrder.filter((kind) => counts[kind] > 0);
  const visibleTypes = presentTypes.slice(0, MAX_TYPE_CHIPS);
  const collapsedTypeCount = Math.max(0, presentTypes.length - MAX_TYPE_CHIPS);

  const chips: CalendarCellLogChip[] = visibleTypes.map((kind) => ({
    kind,
    label: typeChipLabel(kind, counts[kind]),
    count: counts[kind],
  }));

  const daySessions = sportsLoadSessions.filter((session) => session.date === dateKey);
  const totalSportsLoad = daySessions.reduce((sum, session) => {
    const value = typeof session.sessionLoad === 'number' && Number.isFinite(session.sessionLoad)
      ? session.sessionLoad
      : 0;
    return sum + value;
  }, 0);

  if (totalSportsLoad > 0) {
    chips.push({
      kind: 'sportsLoad',
      label: `Load ${Math.round(totalSportsLoad)}`,
      count: daySessions.length,
      sessionLoad: totalSportsLoad,
    });
  }

  return {
    athleteId,
    dateKey,
    chips,
    hasLoggedWork: presentTypes.length > 0 || totalSportsLoad > 0,
    totalSportsLoad: totalSportsLoad > 0 ? totalSportsLoad : undefined,
    collapsedTypeCount,
  };
}

export function dateKeyFromGymLog(log: {
  date?: string;
  timestamp?: Date | string | number | null;
}): string | null {
  if (typeof log.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(log.date)) return log.date;
  if (log.timestamp instanceof Date && !Number.isNaN(log.timestamp.getTime())) {
    return toLocalDateString(log.timestamp);
  }
  if (typeof log.timestamp === 'string' || typeof log.timestamp === 'number') {
    const parsed = new Date(log.timestamp);
    if (!Number.isNaN(parsed.getTime())) return toLocalDateString(parsed);
  }
  return null;
}

/** Bucket gym + sports load into cellKey → day summary for the visible calendar. */
export function buildCalendarLogSummaries(input: {
  athleteIds: string[];
  dateKeys: string[];
  gymLogsByAthlete: Record<string, CalendarGymLogInput[]>;
  sportsLoadByAthlete: Record<string, CalendarSportsLoadInput[]>;
}): Map<string, CalendarCellDaySummary> {
  const dateSet = new Set(input.dateKeys);
  const map = new Map<string, CalendarCellDaySummary>();

  input.athleteIds.forEach((athleteId) => {
    const gym = (input.gymLogsByAthlete[athleteId] ?? []).filter((log) => dateSet.has(log.date));
    const sports = (input.sportsLoadByAthlete[athleteId] ?? []).filter((session) => dateSet.has(session.date));
    const dates = new Set<string>([
      ...gym.map((log) => log.date),
      ...sports.map((session) => session.date),
    ]);
    dates.forEach((dateKey) => {
      const summary = summarizeDayLogs(
        athleteId,
        dateKey,
        gym.filter((log) => log.date === dateKey),
        sports.filter((session) => session.date === dateKey)
      );
      if (summary.hasLoggedWork) {
        map.set(cellKey({ athleteId, date: dateKey }), summary);
      }
    });
  });

  return map;
}
