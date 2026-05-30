import { Timestamp } from 'firebase/firestore';

export interface SrpeLog {
  id: string;
  userId: string;
  /** Local calendar date key - YYYY-MM-DD */
  date: string;
  /** Epoch day derived from date key (UTC midnight days since Unix epoch). */
  dateEpochDay: number;
  /** Server timestamp for ordering */
  timestamp: Timestamp | Date;
  /** Session RPE, 1-10 */
  rpe: number;
  /** Football session duration in minutes */
  durationMinutes: number;
  /** RPE x durationMinutes */
  sessionLoad: number;
  /** Sport identifier used by the Sports Load UI. Legacy rows without this are treated as football. */
  sportType?: string;
  /** Human-readable sport label for exports and dashboards. */
  sportName?: string;
  /** Human-readable session label for exports and dashboards. */
  sessionName?: string;
  /** Number of sports sessions included in this daily aggregate. */
  sessionCount?: number;
  /** True when this row is aggregated from per-session sports load docs. */
  isAggregate?: boolean;
  /** Optional distance covered during a legacy single-session daily row, in meters. */
  distanceMeters?: number;
  /** Optional estimated energy expenditure, in kcal. */
  calories?: number;
  /** Optional average heart rate, in beats per minute. */
  averageHeartRate?: number;
  /** Optional maximum heart rate, in beats per minute. */
  maxHeartRate?: number;
  /** Optional free-text session notes. */
  notes?: string;
}

export interface SaveSrpeLogInput {
  rpe: number;
  durationMinutes: number;
  sportType?: string;
  sportName?: string;
  /** Optional name; defaults to sportName when omitted. */
  sessionName?: string;
  /** Optional distance covered during the sports session, in meters. */
  distanceMeters?: number;
  /** Optional estimated energy expenditure, in kcal. */
  calories?: number;
  /** Optional average heart rate, in beats per minute. */
  averageHeartRate?: number;
  /** Optional maximum heart rate, in beats per minute. */
  maxHeartRate?: number;
  /** Optional free-text session notes. */
  notes?: string;
}

export interface SportsLoadSession extends SaveSrpeLogInput {
  id: string;
  userId: string;
  /** Local calendar date key - YYYY-MM-DD */
  date: string;
  /** Epoch day derived from date key (UTC midnight days since Unix epoch). */
  dateEpochDay: number;
  /** Server timestamp for ordering */
  timestamp: Timestamp | Date;
  /** RPE x durationMinutes */
  sessionLoad: number;
}
