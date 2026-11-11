import { addDays, toLocalDateString } from '@/utils/dateUtils';
import type {
  GarminActivityRecord,
  GarminConnectionStatus,
  GarminDayRecord,
  GarminSyncPlan,
  GarminSyncSource,
} from '@/types/garmin';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const SYNC_WINDOW_DAYS = 30;

type DayDraft = {
  userId: string;
  date: string;
  syncedAt: string;
  sleepScore?: number;
  sleepSeconds?: number;
  hrvLastNight?: number;
  hrvWeeklyAverage?: number;
  hrvStatus?: string;
  restingHeartRate?: number;
  averageStress?: number;
  bodyBatteryCharged?: number;
  bodyBatteryDrained?: number;
  bodyBatteryLatest?: number;
  bodyBatteryAtWake?: number;
  bodyBatteryAtBed?: number;
  steps?: number;
};

export function garminSyncRange(today: Date): { start: string; end: string } {
  return {
    start: toLocalDateString(addDays(today, -SYNC_WINDOW_DAYS)),
    end: toLocalDateString(today),
  };
}

export function buildGarminSyncPlan(source: GarminSyncSource): GarminSyncPlan {
  const activities = mapActivities(source);
  const days = mapDays(source);
  const status: GarminConnectionStatus = {
    userId: source.userId,
    lastSyncedAt: source.syncedAt,
    rangeStart: source.rangeStart,
    rangeEnd: source.rangeEnd,
    activityCount: activities.length,
    dayCount: days.length,
  };
  return { activities, days, status };
}

export function garminActivityLabel(typeKey: string): string {
  const spaced = typeKey
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
  if (!spaced) return 'Activity';
  return spaced.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatGarminDuration(durationSeconds: number): string {
  const totalMinutes = Math.max(0, Math.round(durationSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatGarminDistance(distanceMeters: number | undefined): string | null {
  if (distanceMeters === undefined || distanceMeters <= 0) return null;
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

export function formatGarminSleep(sleepSeconds: number | undefined): string | null {
  if (sleepSeconds === undefined || sleepSeconds <= 0) return null;
  const totalMinutes = Math.round(sleepSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatGarminDateKey(dateKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateKey);
  if (!match) return dateKey;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatGarminClock(startTimeLocal: string): string {
  const match = /\d{2}:\d{2}/.exec(startTimeLocal.slice(11));
  return match ? match[0] : '';
}

function mapActivities(source: GarminSyncSource): GarminActivityRecord[] {
  const byId = new Map<string, GarminActivityRecord>();
  for (const entry of asList(source.activities, ['activities'])) {
    const record = asRecord(entry);
    if (!record) continue;
    const activity = mapActivity(record, source);
    if (activity) byId.set(activity.garminActivityId, activity);
  }
  return [...byId.values()].sort((left, right) => right.startTimeLocal.localeCompare(left.startTimeLocal));
}

function mapActivity(record: Record<string, unknown>, source: GarminSyncSource): GarminActivityRecord | null {
  const garminActivityId = idString(record.activityId);
  const startTimeLocal = typeof record.startTimeLocal === 'string' ? record.startTimeLocal.trim() : '';
  const dateKey = startTimeLocal.slice(0, 10);
  if (!garminActivityId || !DATE_KEY.test(dateKey) || !inRange(dateKey, source.rangeStart, source.rangeEnd)) {
    return null;
  }

  const activityType = asRecord(record.activityType);
  const activityTypeKey = stringValue(activityType?.typeKey) ?? stringValue(record.activityTypeKey) ?? 'other';
  const activityName = stringValue(record.activityName) ?? garminActivityLabel(activityTypeKey);
  const durationSeconds = nonNegative(record.duration) ?? nonNegative(record.durationInSeconds) ?? 0;

  return omitEmpty({
    garminActivityId,
    userId: source.userId,
    activityName,
    activityTypeKey,
    dateKey,
    startTimeLocal,
    durationSeconds,
    distanceMeters: positive(record.distance),
    calories: positive(record.calories),
    averageHeartRate: positive(record.averageHR) ?? positive(record.averageHeartRate),
    maxHeartRate: positive(record.maxHR) ?? positive(record.maxHeartRate),
    syncedAt: source.syncedAt,
  });
}

function mapDays(source: GarminSyncSource): GarminDayRecord[] {
  const days = new Map<string, DayDraft>();
  const samples: ClockSample[] = [];
  const sleepBounds: SleepBound[] = [];
  let deviceOffsetMs = 0;
  const draftFor = (date: string): DayDraft => {
    const existing = days.get(date);
    if (existing) return existing;
    const created: DayDraft = { userId: source.userId, date, syncedAt: source.syncedAt };
    days.set(date, created);
    return created;
  };

  for (const entry of asList(source.sleep, ['sleepSummaries', 'dailySleepSummaries'])) {
    const record = asRecord(entry);
    const date = record ? dateKeyOf(record) : undefined;
    if (!record || !date || !inRange(date, source.rangeStart, source.rangeEnd)) continue;
    fillMissing(draftFor(date), {
      sleepScore: positive(sleepScoreOf(record)) ?? nonNegative(sleepScoreOf(record)),
      sleepSeconds: positive(record.sleepTimeSeconds),
    });
    sleepBounds.push({
      startLocal: stringValue(record.sleepStartTimestampLocal),
      endLocal: stringValue(record.sleepEndTimestampLocal),
      startGmt: stringValue(record.sleepStartTimestampGMT),
      endGmt: stringValue(record.sleepEndTimestampGMT),
    });
  }

  for (const entry of asList(source.hrv, ['hrvSummaries'])) {
    const record = asRecord(entry);
    const date = record ? dateKeyOf(record) : undefined;
    if (!record || !date || !inRange(date, source.rangeStart, source.rangeEnd)) continue;
    fillMissing(draftFor(date), {
      hrvLastNight: positive(record.lastNightAvg),
      hrvWeeklyAverage: positive(record.weeklyAvg),
      hrvStatus: stringValue(record.status),
    });
  }

  for (const entry of asList(source.bodyBattery, ['bodyBatteryValues', 'bodyBatteryDailyValues'])) {
    const record = asRecord(entry);
    const date = record ? dateKeyOf(record) : undefined;
    if (!record || !date || !inRange(date, source.rangeStart, source.rangeEnd)) continue;
    fillMissing(draftFor(date), {
      bodyBatteryCharged: nonNegative(record.charged),
      bodyBatteryDrained: nonNegative(record.drained),
      bodyBatteryLatest: batteryLatest(record),
    });
    const offset = timestampOffsetMs(record);
    if (offset !== undefined) deviceOffsetMs = offset;
    samples.push(...batterySamples(record, offset ?? deviceOffsetMs));
  }

  for (const entry of asList(source.dailySummaries, ['data', 'dailySummaries'])) {
    const record = asRecord(entry);
    const date = record ? dateKeyOf(record) : undefined;
    if (!record || !date || !inRange(date, source.rangeStart, source.rangeEnd)) continue;
    const heartRate = asRecord(record.heartRate);
    const stress = asRecord(record.stress);
    const movement = asRecord(record.movement);
    const summaryBattery = asRecord(record.bodyBattery);
    fillMissing(draftFor(date), {
      restingHeartRate: positive(heartRate?.restingValue) ?? positive(record.restingHeartRate),
      averageStress: nonNegative(stress?.avgLevel) ?? nonNegative(record.averageStressLevel),
      steps: nonNegative(quantityValue(movement?.steps)) ?? nonNegative(record.totalSteps),
      bodyBatteryCharged: nonNegative(summaryBattery?.chargedValue) ?? nonNegative(record.bodyBatteryChargedValue),
      bodyBatteryDrained: nonNegative(summaryBattery?.drainedValue) ?? nonNegative(record.bodyBatteryDrainedValue),
      bodyBatteryLatest: nonNegative(summaryBattery?.latestValue) ?? nonNegative(record.bodyBatteryMostRecentValue),
    });
  }

  assignWakeAndBed(days, samples, sleepMoments(sleepBounds, deviceOffsetMs));

  return [...days.values()]
    .filter(hasDayMetric)
    .map((day) => omitEmpty(day))
    .sort((left, right) => right.date.localeCompare(left.date));
}

function hasDayMetric(day: DayDraft): boolean {
  return (
    day.sleepScore !== undefined ||
    day.sleepSeconds !== undefined ||
    day.hrvLastNight !== undefined ||
    day.hrvWeeklyAverage !== undefined ||
    day.restingHeartRate !== undefined ||
    day.averageStress !== undefined ||
    day.bodyBatteryCharged !== undefined ||
    day.bodyBatteryDrained !== undefined ||
    day.bodyBatteryLatest !== undefined ||
    day.bodyBatteryAtWake !== undefined ||
    day.bodyBatteryAtBed !== undefined ||
    day.steps !== undefined
  );
}

function fillMissing(day: DayDraft, patch: Partial<DayDraft>): void {
  (Object.keys(patch) as Array<keyof DayDraft>).forEach((key) => {
    if (day[key] === undefined && patch[key] !== undefined) {
      Object.assign(day, { [key]: patch[key] });
    }
  });
}

function asList(value: unknown, nestedKeys: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];
  for (const key of nestedKeys) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function quantityValue(value: unknown): unknown {
  const record = asRecord(value);
  if (record && 'value' in record) return record.value;
  return value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function dateKeyOf(record: Record<string, unknown>): string | undefined {
  for (const key of ['calendarDate', 'date', 'summaryDate']) {
    const value = record[key];
    if (typeof value === 'string' && DATE_KEY.test(value.slice(0, 10))) return value.slice(0, 10);
  }
  return undefined;
}

function sleepScoreOf(record: Record<string, unknown>): unknown {
  const scores = asRecord(record.sleepScores);
  if (!scores) return record.sleepScore;
  const overall = scores.overall;
  if (typeof overall === 'number') return overall;
  return asRecord(overall)?.value;
}

interface ClockSample {
  /** Device-local clock stored as UTC components, so it compares with other local timestamps. */
  at: number;
  level: number;
}

interface SleepBound {
  startLocal?: string;
  endLocal?: string;
  startGmt?: string;
  endGmt?: string;
}

function assignWakeAndBed(
  days: Map<string, DayDraft>,
  samples: ClockSample[],
  sleeps: Array<{ start?: number; end?: number }>,
): void {
  if (samples.length === 0) return;
  days.forEach((day) => {
    const wakeTarget = sleeps.find((sleep) => sleep.end !== undefined && localDateKey(sleep.end) === day.date)?.end;
    const bedTarget = sleeps.find((sleep) => sleep.start !== undefined && localDateKey(sleep.start) === day.date)?.start;
    const onDate = samples.filter((sample) => localDateKey(sample.at) === day.date);
    const wake = nearestLevel(samples, wakeTarget) ?? peakLevel(onDate, 5, 11);
    const bed = nearestLevel(samples, bedTarget) ?? lastLevel(onDate, 20, 24);
    if (wake !== undefined) day.bodyBatteryAtWake = wake;
    if (bed !== undefined) day.bodyBatteryAtBed = bed;
  });
}

function sleepMoments(bounds: SleepBound[], offsetMs: number): Array<{ start?: number; end?: number }> {
  return bounds.flatMap((bound) => {
    const start = parseLocalMs(bound.startLocal) ?? shiftGmt(bound.startGmt, offsetMs);
    const end = parseLocalMs(bound.endLocal) ?? shiftGmt(bound.endGmt, offsetMs);
    return start === undefined && end === undefined ? [] : [{ start, end }];
  });
}

function batterySamples(record: Record<string, unknown>, offsetMs: number): ClockSample[] {
  const array = record.bodyBatteryValuesArray;
  if (!Array.isArray(array)) return [];
  const startLocal = parseLocalMs(record.startTimestampLocal);
  return array.flatMap((entry) => {
    const sample = clockSample(entry, startLocal, offsetMs);
    return sample ? [sample] : [];
  });
}

function clockSample(entry: unknown, startLocal: number | undefined, offsetMs: number): ClockSample | undefined {
  if (Array.isArray(entry)) {
    const stamp = finiteNumber(entry[0]);
    const level = batteryLevel(entry[1] ?? entry[2]);
    if (stamp === undefined || level === undefined) return undefined;
    if (stamp > 1e12) return { at: stamp + offsetMs, level };
    if (stamp > 1e9) return { at: stamp * 1000 + offsetMs, level };
    if (startLocal !== undefined && stamp >= 0 && stamp < 48 * 3600) return { at: startLocal + stamp * 1000, level };
    return undefined;
  }
  const sample = asRecord(entry);
  if (!sample) return undefined;
  const level = batteryLevel(sample.level) ?? batteryLevel(sample.value) ?? batteryLevel(sample.bodyBatteryLevel);
  if (level === undefined) return undefined;
  const local = parseLocalMs(sample.timestampLocal) ?? parseLocalMs(sample.startTimestampLocal);
  if (local !== undefined) return { at: local, level };
  const epoch = finiteNumber(sample.timestamp);
  if (epoch !== undefined && epoch > 1e12) return { at: epoch + offsetMs, level };
  return undefined;
}

function timestampOffsetMs(record: Record<string, unknown>): number | undefined {
  const local = parseLocalMs(record.startTimestampLocal);
  const gmt = parseLocalMs(record.startTimestampGMT);
  if (local === undefined || gmt === undefined) return undefined;
  return local - gmt;
}

function nearestLevel(samples: ClockSample[], target: number | undefined): number | undefined {
  if (target === undefined) return undefined;
  const maxGap = 2 * 60 * 60 * 1000;
  let best: ClockSample | undefined;
  let gap = maxGap;
  samples.forEach((sample) => {
    const distance = Math.abs(sample.at - target);
    if (distance <= gap) {
      best = sample;
      gap = distance;
    }
  });
  return best?.level;
}

function peakLevel(samples: ClockSample[], fromHour: number, toHour: number): number | undefined {
  const levels = samples.filter((sample) => {
    const hour = new Date(sample.at).getUTCHours();
    return hour >= fromHour && hour < toHour;
  }).map((sample) => sample.level);
  if (levels.length === 0) return undefined;
  return Math.max(...levels);
}

function lastLevel(samples: ClockSample[], fromHour: number, toHour: number): number | undefined {
  const inWindow = samples.filter((sample) => {
    const hour = new Date(sample.at).getUTCHours();
    return hour >= fromHour && hour < toHour;
  }).sort((left, right) => left.at - right.at);
  return inWindow[inWindow.length - 1]?.level;
}

function shiftGmt(value: string | undefined, offsetMs: number): number | undefined {
  const gmt = parseLocalMs(value);
  return gmt === undefined ? undefined : gmt + offsetMs;
}

function parseLocalMs(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!match) return undefined;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6] ?? 0));
}

function localDateKey(localMs: number): string {
  const date = new Date(localMs);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

function batteryLevel(value: unknown): number | undefined {
  const level = nonNegative(value);
  if (level === undefined || level > 100) return undefined;
  return level;
}

function batteryLatest(record: Record<string, unknown>): number | undefined {
  const samples = record.bodyBatteryValuesArray;
  if (Array.isArray(samples) && samples.length > 0) {
    const last = samples[samples.length - 1];
    if (Array.isArray(last)) return nonNegative(last[1]);
    const sample = asRecord(last);
    if (sample) return nonNegative(sample.level) ?? nonNegative(sample.value);
  }
  return nonNegative(record.bodyBatteryMostRecentValue);
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function idString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return value;
  return null;
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function nonNegative(value: unknown): number | undefined {
  const number = finiteNumber(value);
  if (number === undefined || number < 0) return undefined;
  return Math.round(number);
}

function positive(value: unknown): number | undefined {
  const number = nonNegative(value);
  if (number === undefined || number <= 0) return undefined;
  return number;
}

function omitEmpty<T extends object>(value: T): T {
  const cleaned: Record<string, unknown> = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (entry !== undefined) cleaned[key] = entry;
  });
  return cleaned as T;
}
