const COMPLETED_SET_FIELDS = [
  'reps',
  'weight',
  'rpe',
  'duration',
  'durationSec',
  'distance',
  'distanceMeters',
  'holdTime',
  'averageHR',
  'averageHeartRate',
  'maxHR',
  'maxHeartRate',
  'calories',
  'intensity',
  'height',
  'heartRate',
] as const;

/** A set counts as completed training when the athlete saved a number for it. */
export function isCompletedTrainingSet(set: object): boolean {
  const record = set as Record<string, unknown>;
  return COMPLETED_SET_FIELDS.some((key) => {
    const value = record[key];
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  });
}
