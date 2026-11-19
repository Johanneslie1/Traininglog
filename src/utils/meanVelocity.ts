import type { ExerciseSet } from '@/types/sets';

/** Mean concentric bar speed stays in the range a barbell tracker reports. */
export const MEAN_VELOCITY_MAX_MPS = 5;

export function normalizeMeanVelocity(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > MEAN_VELOCITY_MAX_MPS) {
    return undefined;
  }
  return Math.round(value * 100) / 100;
}

export function formatMeanVelocity(value: unknown): string | null {
  const normalized = normalizeMeanVelocity(value);
  return normalized === undefined ? null : `${normalized.toFixed(2)} m/s`;
}

/** Drop an empty or out-of-range velocity so it is not written to the log. */
export function sanitizeLoggedMeanVelocity(set: ExerciseSet): ExerciseSet {
  const meanVelocity = normalizeMeanVelocity(set.meanVelocity);
  const next: ExerciseSet = { ...set };
  if (meanVelocity === undefined) {
    delete next.meanVelocity;
    delete next.velocitySource;
    return next;
  }
  next.meanVelocity = meanVelocity;
  next.velocitySource = set.velocitySource === 'device' ? 'device' : 'manual';
  return next;
}
