import { addDays, toLocalDateString } from '@/utils/dateUtils';
import type { GarminActivityRecord, GarminDayRecord } from '@/types/garmin';

export type MonitorSpan = 'day' | '7' | '14' | '28';
export type MorningFlag = 'Clear' | 'Watch' | 'Ease';

export const MONITOR_SPANS: Array<{ id: MonitorSpan; label: string; days: number }> = [
  { id: 'day', label: 'Day', days: 1 },
  { id: '7', label: '7 days', days: 7 },
  { id: '14', label: '14 days', days: 14 },
  { id: '28', label: '28 days', days: 28 },
];

export function spanDateKeys(endDate: Date, days: number): string[] {
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    keys.push(toLocalDateString(addDays(endDate, -offset)));
  }
  return keys;
}

function positiveAverage(values: Array<number | undefined>): number | null {
  const known = values.filter((value): value is number => value !== undefined && value > 0);
  if (known.length === 0) return null;
  return Math.round(known.reduce((sum, value) => sum + value, 0) / known.length);
}

export function hrvBaseline(days: GarminDayRecord[]): number | null {
  return positiveAverage(days.map((day) => day.hrvLastNight));
}

export function restingHeartRateBaseline(days: GarminDayRecord[]): number | null {
  return positiveAverage(days.map((day) => day.restingHeartRate));
}

export function morningFlag(
  day: Pick<GarminDayRecord, 'sleepScore' | 'hrvLastNight' | 'bodyBatteryLatest'>,
  baseline: number,
): MorningFlag | null {
  const { sleepScore, hrvLastNight, bodyBatteryLatest } = day;
  if (sleepScore === undefined || hrvLastNight === undefined || bodyBatteryLatest === undefined) return null;
  if (sleepScore < 75 || baseline - hrvLastNight >= 10 || bodyBatteryLatest < 40) return 'Ease';
  if (sleepScore >= 85 && hrvLastNight >= baseline - 2 && bodyBatteryLatest >= 60) return 'Clear';
  return 'Watch';
}

export function latestRecordedDay(days: GarminDayRecord[], dateKeys: string[]): GarminDayRecord | null {
  const byDate = new Map(days.map((day) => [day.date, day]));
  for (let index = dateKeys.length - 1; index >= 0; index -= 1) {
    const day = byDate.get(dateKeys[index]);
    if (day) return day;
  }
  return null;
}

export function activityMinutesOn(activities: GarminActivityRecord[], dateKey: string): number {
  return activities
    .filter((activity) => activity.dateKey === dateKey)
    .reduce((sum, activity) => sum + Math.round(activity.durationSeconds / 60), 0);
}

export function daysInWindow(days: GarminDayRecord[], dateKeys: string[]): GarminDayRecord[] {
  const allowed = new Set(dateKeys);
  return days
    .filter((day) => allowed.has(day.date))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export interface WellnessSnapshot {
  date: string;
  sleepQuality?: number;
  fatigue?: number;
  muscleSoreness?: number;
  stress?: number;
  mood?: number;
  readiness?: number;
  wellnessScaleVersion?: number;
}

const WELLNESS_SCORE_KEYS = [
  'sleepQuality',
  'fatigue',
  'muscleSoreness',
  'stress',
  'mood',
  'readiness',
] as const satisfies ReadonlyArray<keyof WellnessSnapshot>;

export type WellnessScoreKey = (typeof WELLNESS_SCORE_KEYS)[number];
export type WellnessScores = Partial<Record<WellnessScoreKey, number>>;

function fivePointLog(log: WellnessSnapshot): boolean {
  if (log.wellnessScaleVersion === 3) return true;
  if (log.wellnessScaleVersion !== undefined) return false;
  return WELLNESS_SCORE_KEYS.every((key) => {
    const value = log[key];
    return value === undefined || (value >= 1 && value <= 5);
  });
}

function scoresFrom(log: WellnessSnapshot): WellnessScores {
  const scores: WellnessScores = {};
  WELLNESS_SCORE_KEYS.forEach((key) => {
    const value = log[key];
    if (value !== undefined) scores[key] = value;
  });
  return scores;
}

/** Day windows keep that check-in. Longer windows average the 1–5 check-ins inside the span. */
export function wellnessWindowScores(logs: WellnessSnapshot[], dateKeys: string[]): WellnessScores | null {
  const allowed = new Set(dateKeys);
  const inWindow = logs
    .filter((log) => allowed.has(log.date) && fivePointLog(log))
    .sort((left, right) => right.date.localeCompare(left.date));
  if (inWindow.length === 0) return null;
  if (dateKeys.length <= 1) return scoresFrom(inWindow[0]);

  const scores: WellnessScores = {};
  WELLNESS_SCORE_KEYS.forEach((key) => {
    const values = inWindow
      .map((log) => log[key])
      .filter((value): value is number => value !== undefined);
    if (values.length === 0) return;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    scores[key] = Math.round(mean * 10) / 10;
  });
  return Object.keys(scores).length > 0 ? scores : null;
}
