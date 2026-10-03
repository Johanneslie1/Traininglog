import { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';
import {
  formatDurationSeconds,
  normalizeDistanceMeters,
  normalizeDurationSeconds,
} from '@/utils/activityFieldContract';

const hasNumeric = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function buildResistanceSummary(sets: ExerciseSet[] | undefined): string {
  if (!sets || sets.length === 0) {
    return 'No sets';
  }

  const setCount = sets.length;
  const reps = sets.map((set) => set.reps).filter(hasNumeric);
  const weights = sets.map((set) => set.weight).filter(hasNumeric);

  const repsPart = (() => {
    if (reps.length === 0) {
      return `${setCount} set${setCount === 1 ? '' : 's'}`;
    }
    const minReps = Math.min(...reps);
    const maxReps = Math.max(...reps);
    const repsLabel = minReps === maxReps ? `${minReps}` : `${minReps}–${maxReps}`;
    return `${setCount} × ${repsLabel}`;
  })();

  if (weights.length === 0) {
    return repsPart;
  }

  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightLabel = minWeight === maxWeight ? `${minWeight} kg` : `${minWeight}–${maxWeight} kg`;
  return `${repsPart} · ${weightLabel}`;
}

export function buildActivitySummary(
  sets: ExerciseSet[] | undefined,
  activityType?: ActivityType | string
): string {
  if (!sets || sets.length === 0) {
    return 'No sets';
  }

  const parts: string[] = [];
  const setCount = sets.length;
  const resolvedType = (activityType as ActivityType) || ActivityType.OTHER;

  const repsTotal = sets.reduce((sum, set) => sum + (hasNumeric(set.reps) ? set.reps : 0), 0);
  if (repsTotal > 0) {
    parts.push(`${repsTotal} rep${repsTotal === 1 ? '' : 's'}`);
  } else {
    parts.push(`${setCount} set${setCount === 1 ? '' : 's'}`);
  }

  const distances = sets
    .map((set) => normalizeDistanceMeters(set.distance, resolvedType))
    .filter((value) => value > 0);
  if (distances.length > 0) {
    const totalDistance = distances.reduce((sum, value) => sum + value, 0);
    parts.push(`${totalDistance} m`);
  }

  const durations = sets
    .map((set) => normalizeDurationSeconds(set.duration, resolvedType))
    .filter((value): value is number => hasNumeric(value) && value > 0);
  if (durations.length > 0) {
    const best = Math.min(...durations);
    const label = durations.length === 1 ? formatDurationSeconds(best) : `best ${formatDurationSeconds(best)}`;
    parts.push(label);
  }

  const heights = sets.map((set) => set.height).filter(hasNumeric);
  if (heights.length > 0) {
    parts.push(`${Math.max(...heights)} cm`);
  }

  return parts.slice(0, 3).join(' · ');
}

export function buildExerciseLogSummary(params: {
  sets?: ExerciseSet[];
  activityType?: ActivityType | string;
  isNonResistance: boolean;
}): string {
  if (params.isNonResistance) {
    return buildActivitySummary(params.sets, params.activityType);
  }
  return buildResistanceSummary(params.sets);
}
