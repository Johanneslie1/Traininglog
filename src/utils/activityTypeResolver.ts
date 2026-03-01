import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';

type ActivityTypeLike = {
  activityType?: unknown;
  type?: unknown;
  trainingType?: unknown;
  exerciseType?: unknown;
  drillType?: unknown;
  stretchType?: unknown;
  sportType?: unknown;
  enduranceType?: unknown;
  teamBased?: unknown;
  defaultUnit?: unknown;
  metrics?: Record<string, unknown>;
};

type ResolveOptions = {
  fallback?: ActivityType;
  preferHintOverOther?: boolean;
};

const toLowerString = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .toLowerCase();

const fromHintValue = (value: unknown): ActivityType | undefined => {
  const normalized = toLowerString(value);
  if (!normalized) return undefined;

  switch (normalized) {
    case 'strength':
    case 'resistance':
    case 'bodyweight':
    case 'plyometric':
    case 'plyometrics':
      return ActivityType.RESISTANCE;
    case 'cardio':
    case 'endurance':
      return ActivityType.ENDURANCE;
    case 'sport':
    case 'teamsport':
    case 'teamsports':
    case 'team_sports':
      return ActivityType.SPORT;
    case 'stretching':
    case 'flexibility':
      return ActivityType.STRETCHING;
    case 'speedagility':
    case 'speed_agility':
    case 'speed-agility':
      return ActivityType.SPEED_AGILITY;
    case 'other':
    case 'outdoor':
      return ActivityType.OTHER;
    default:
      return undefined;
  }
};

const fromShapeHints = (value: ActivityTypeLike): ActivityType | undefined => {
  if (value.drillType) return ActivityType.SPEED_AGILITY;
  if (value.stretchType) return ActivityType.STRETCHING;
  if (value.sportType || value.teamBased === true) return ActivityType.SPORT;
  if (value.enduranceType) return ActivityType.ENDURANCE;

  const metrics = value.metrics || {};
  const trackWeight = Boolean(metrics.trackWeight);
  const trackReps = Boolean(metrics.trackReps);
  const trackTime = Boolean(metrics.trackTime || metrics.trackDuration);
  const trackDistance = Boolean(metrics.trackDistance || metrics.trackPace);

  if (trackWeight || (trackReps && !trackTime && !trackDistance)) {
    return ActivityType.RESISTANCE;
  }

  if (trackDistance) return ActivityType.ENDURANCE;
  if (trackTime) {
    const unit = toLowerString(value.defaultUnit);
    if (unit === 'kg' || unit === 'lbs' || unit === 'reps') {
      return ActivityType.RESISTANCE;
    }
    return ActivityType.ENDURANCE;
  }

  const unit = toLowerString(value.defaultUnit);
  if (unit === 'kg' || unit === 'lbs' || unit === 'reps') {
    return ActivityType.RESISTANCE;
  }

  return undefined;
};

export const resolveActivityTypeFromExerciseLike = (
  value: ActivityTypeLike | null | undefined,
  options?: ResolveOptions
): ActivityType => {
  const fallback = options?.fallback ?? ActivityType.OTHER;
  if (!value) return fallback;

  const explicit = value.activityType ? normalizeActivityType(value.activityType as string) : undefined;
  const hintType =
    fromHintValue(value.trainingType) ||
    fromHintValue(value.type) ||
    fromHintValue(value.exerciseType) ||
    fromShapeHints(value);

  if (explicit) {
    if (
      explicit === ActivityType.OTHER &&
      (options?.preferHintOverOther ?? true) &&
      hintType &&
      hintType !== ActivityType.OTHER
    ) {
      return hintType;
    }
    return explicit;
  }

  return hintType || fallback;
};
