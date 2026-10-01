/**
 * Athlete progress for a criteria-based rehab program.
 * Stored at users/{uid}/rehabProgress/{programId}.
 * Program templates stay in the existing program/session documents.
 */
export interface RehabPainLog {
  id: string;
  /** Stable session key such as "daily" or "week-1". Survives session id changes. */
  sessionKey: string;
  sessionName: string;
  week?: number;
  /** Local calendar date of the session, YYYY-MM-DD. */
  date: string;
  /** Pain 0–10 before the session. Used to judge next-morning change. */
  painBefore: number;
  /** Pain 0–10 during the session. */
  painDuring: number;
  /** Pain 0–10 the next morning. Empty until the athlete logs it. */
  painNextMorning?: number;
  createdAt: string;
}

export interface SymmetryTestResult {
  id: string;
  date: string;
  weightKg: number;
  healthyReps: number;
  injuredReps: number;
  /** injuredReps / healthyReps × 100, rounded. */
  symmetryPercent: number;
}

export interface RehabProgress {
  userId: string;
  programId: string;
  programKey: string;
  /** Week numbers whose checkpoints have been confirmed. Week 1 does not need an entry to be available. */
  confirmedWeeks: number[];
  /** Keys are `${week}:${itemIndex}`. */
  checkpointChecks: Record<string, boolean>;
  painLogs: RehabPainLog[];
  symmetryTests: SymmetryTestResult[];
  updatedAt: string;
}

export interface RehabSessionNotice {
  programId: string;
  sessionKey: string;
  sessionName: string;
  rules: string[];
  stopSigns: string;
}

export interface RehabPainLogInput {
  sessionKey: string;
  sessionName: string;
  week?: number;
  date: string;
  painBefore: number;
  painDuring: number;
  painNextMorning?: number;
}

export interface SymmetryTestInput {
  date: string;
  weightKg: number;
  healthyReps: number;
  injuredReps: number;
}
