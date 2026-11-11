/** One Garmin Connect activity, stored under the signed-in user. */
export interface GarminActivityRecord {
  garminActivityId: string;
  userId: string;
  activityName: string;
  activityTypeKey: string;
  /** Device-local calendar date, YYYY-MM-DD. */
  dateKey: string;
  /** Device-local start, as Garmin sends it (YYYY-MM-DD HH:mm:ss). */
  startTimeLocal: string;
  durationSeconds: number;
  distanceMeters?: number;
  calories?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  syncedAt: string;
}

/** One calendar day of Garmin recovery and daily stats. */
export interface GarminDayRecord {
  userId: string;
  /** YYYY-MM-DD */
  date: string;
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
  steps?: number;
  syncedAt: string;
}

/** Last successful sync. The personal API key is never stored. */
export interface GarminConnectionStatus {
  userId: string;
  lastSyncedAt: string;
  rangeStart: string;
  rangeEnd: string;
  activityCount: number;
  dayCount: number;
}

export interface GarminSyncPlan {
  activities: GarminActivityRecord[];
  days: GarminDayRecord[];
  status: GarminConnectionStatus;
}

export interface GarminSyncSource {
  activities: unknown;
  sleep: unknown;
  hrv: unknown;
  bodyBattery: unknown;
  dailySummaries: unknown;
  userId: string;
  rangeStart: string;
  rangeEnd: string;
  syncedAt: string;
}
