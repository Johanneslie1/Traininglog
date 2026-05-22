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
}

export interface SaveSrpeLogInput {
  rpe: number;
  durationMinutes: number;
}
