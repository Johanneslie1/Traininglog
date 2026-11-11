import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from './config';
import type { GarminActivityRecord, GarminConnectionStatus, GarminDayRecord } from '@/types/garmin';

export interface GarminStatsSnapshot {
  status: GarminConnectionStatus | null;
  days: GarminDayRecord[];
  activities: GarminActivityRecord[];
}

export async function loadGarminStats(userId: string): Promise<GarminStatsSnapshot> {
  if (!userId) {
    throw new Error('userId is required to load Garmin stats');
  }

  const statusRef = doc(db, 'users', userId, 'garminConnection', 'status');
  const daysQuery = query(collection(db, 'users', userId, 'garminDays'), orderBy('date', 'desc'), limit(31));
  const activitiesQuery = query(
    collection(db, 'users', userId, 'garminActivities'),
    orderBy('startTimeLocal', 'desc'),
    limit(40),
  );

  const [statusSnap, daysSnap, activitiesSnap] = await Promise.all([
    getDoc(statusRef),
    getDocs(daysQuery),
    getDocs(activitiesQuery),
  ]);

  return {
    status: statusSnap.exists() ? mapStatus(statusSnap.data()) : null,
    days: daysSnap.docs.map((entry) => mapDay(entry.data())).filter((day): day is GarminDayRecord => day !== null),
    activities: activitiesSnap.docs
      .map((entry) => mapActivity(entry.data()))
      .filter((activity): activity is GarminActivityRecord => activity !== null),
  };
}

function mapStatus(data: Record<string, unknown>): GarminConnectionStatus | null {
  if (typeof data.userId !== 'string' || typeof data.lastSyncedAt !== 'string') return null;
  if (typeof data.rangeStart !== 'string' || typeof data.rangeEnd !== 'string') return null;
  return {
    userId: data.userId,
    lastSyncedAt: data.lastSyncedAt,
    rangeStart: data.rangeStart,
    rangeEnd: data.rangeEnd,
    activityCount: numberValue(data.activityCount) ?? 0,
    dayCount: numberValue(data.dayCount) ?? 0,
  };
}

function mapDay(data: Record<string, unknown>): GarminDayRecord | null {
  if (typeof data.userId !== 'string' || typeof data.date !== 'string' || typeof data.syncedAt !== 'string') {
    return null;
  }
  return omitEmpty({
    userId: data.userId,
    date: data.date,
    syncedAt: data.syncedAt,
    sleepScore: optionalNumber(data.sleepScore),
    sleepSeconds: optionalNumber(data.sleepSeconds),
    hrvLastNight: optionalNumber(data.hrvLastNight),
    hrvWeeklyAverage: optionalNumber(data.hrvWeeklyAverage),
    hrvStatus: typeof data.hrvStatus === 'string' ? data.hrvStatus : undefined,
    restingHeartRate: optionalNumber(data.restingHeartRate),
    averageStress: optionalNumber(data.averageStress),
    bodyBatteryCharged: optionalNumber(data.bodyBatteryCharged),
    bodyBatteryDrained: optionalNumber(data.bodyBatteryDrained),
    bodyBatteryLatest: optionalNumber(data.bodyBatteryLatest),
    steps: optionalNumber(data.steps),
  });
}

function mapActivity(data: Record<string, unknown>): GarminActivityRecord | null {
  if (
    typeof data.garminActivityId !== 'string' ||
    typeof data.userId !== 'string' ||
    typeof data.activityName !== 'string' ||
    typeof data.activityTypeKey !== 'string' ||
    typeof data.dateKey !== 'string' ||
    typeof data.startTimeLocal !== 'string' ||
    typeof data.syncedAt !== 'string'
  ) {
    return null;
  }
  return omitEmpty({
    garminActivityId: data.garminActivityId,
    userId: data.userId,
    activityName: data.activityName,
    activityTypeKey: data.activityTypeKey,
    dateKey: data.dateKey,
    startTimeLocal: data.startTimeLocal,
    durationSeconds: numberValue(data.durationSeconds) ?? 0,
    distanceMeters: optionalNumber(data.distanceMeters),
    calories: optionalNumber(data.calories),
    averageHeartRate: optionalNumber(data.averageHeartRate),
    maxHeartRate: optionalNumber(data.maxHeartRate),
    syncedAt: data.syncedAt,
  });
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return numberValue(value);
}

function omitEmpty<T extends object>(value: T): T {
  const cleaned: Record<string, unknown> = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (entry !== undefined) cleaned[key] = entry;
  });
  return cleaned as T;
}
