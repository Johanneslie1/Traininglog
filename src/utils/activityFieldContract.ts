import { ActivityType } from '@/types/activityTypes';
import { ExerciseSet } from '@/types/sets';

export const NON_RESISTANCE_ACTIVITY_TYPES: ActivityType[] = [
  ActivityType.SPORT,
  ActivityType.STRETCHING,
  ActivityType.ENDURANCE,
  ActivityType.SPEED_AGILITY,
  ActivityType.OTHER,
];

export const ESSENTIAL_SET_FIELDS_BY_ACTIVITY: Record<ActivityType, Array<keyof ExerciseSet>> = {
  [ActivityType.RESISTANCE]: ['reps'],
  [ActivityType.ENDURANCE]: ['duration'],
  [ActivityType.SPORT]: ['duration'],
  [ActivityType.STRETCHING]: ['holdTime'],
  [ActivityType.SPEED_AGILITY]: ['reps'],
  [ActivityType.OTHER]: ['duration'],
};

export const isNonResistanceActivityType = (activityType: ActivityType): boolean =>
  NON_RESISTANCE_ACTIVITY_TYPES.includes(activityType);

const isPositiveFiniteNumber = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export const normalizeDurationSeconds = (
  duration: number | undefined,
  activityType: ActivityType
): number => {
  if (!isPositiveFiniteNumber(duration)) {
    return 0;
  }

  if (activityType === ActivityType.ENDURANCE || activityType === ActivityType.SPORT || activityType === ActivityType.OTHER) {
    const hasDecimal = Math.abs(duration % 1) > 0;
    const likelyLegacyMinutes = hasDecimal || duration <= 90;

    if (likelyLegacyMinutes) {
      return Math.round(duration * 60);
    }
  }

  return Math.round(duration);
};

export const normalizeDistanceMeters = (
  distance: number | undefined,
  activityType: ActivityType
): number => {
  if (!isPositiveFiniteNumber(distance)) {
    return 0;
  }

  if (activityType === ActivityType.ENDURANCE || activityType === ActivityType.SPORT) {
    const likelyLegacyKilometers = distance <= 100;
    if (likelyLegacyKilometers) {
      return Math.round(distance * 1000);
    }
  }

  return Math.round(distance);
};

export const toMinutesSeconds = (totalSeconds: number | undefined): { minutes: number; seconds: number } => {
  const normalized = Math.max(0, Math.floor(totalSeconds || 0));
  return {
    minutes: Math.floor(normalized / 60),
    seconds: normalized % 60,
  };
};

export const fromMinutesSeconds = (minutes: number | undefined, seconds: number | undefined): number => {
  const safeMinutes = Math.max(0, Math.floor(minutes || 0));
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  return (safeMinutes * 60) + safeSeconds;
};

export const formatDurationSeconds = (totalSeconds: number | undefined): string => {
  if (!isPositiveFiniteNumber(totalSeconds)) {
    return '0s';
  }

  const seconds = Math.round(totalSeconds);
  const minutesPart = Math.floor(seconds / 60);
  const secondsPart = seconds % 60;

  if (minutesPart === 0) {
    return `${secondsPart}s`;
  }

  if (secondsPart === 0) {
    return `${minutesPart}m`;
  }

  return `${minutesPart}m ${secondsPart}s`;
};

export const hasEssentialFields = (set: ExerciseSet, activityType: ActivityType): boolean => {
  const fields = ESSENTIAL_SET_FIELDS_BY_ACTIVITY[activityType] || [];
  return fields.some((field) => {
    const value = set[field];
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  });
};
