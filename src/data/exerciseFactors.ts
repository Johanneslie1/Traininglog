// Exercise factor lookup for normalized resistance-set load export.
// 1.0 is the bilateral-compound reference point.

export type ExerciseFactorCategory =
  | 'bilateral_compound'
  | 'unilateral_compound'
  | 'eccentric_dominant'
  | 'bodyweight_relative'
  | 'plyometric_power'
  | 'isolation_accessory'
  | 'core_stability'
  | 'unknown';

export const EXERCISE_FACTORS: Record<ExerciseFactorCategory, number> = {
  bilateral_compound: 1.0,
  unilateral_compound: 1.2,
  eccentric_dominant: 1.5,
  bodyweight_relative: 1.1,
  plyometric_power: 1.4,
  isolation_accessory: 0.6,
  core_stability: 0.5,
  unknown: 1.0,
};

const normalize = (val: string): string => val.trim().toLowerCase();

export const inferExerciseFactorCategory = (
  exerciseName: string,
  existingCategory?: string,
  existingType?: string
): ExerciseFactorCategory => {
  const name = normalize(exerciseName);
  const category = normalize(existingCategory ?? '');
  const type = normalize(existingType ?? '');

  if (/nordic|reverse nordic|glute\s*ham|slow eccentric|tempo eccentric|negative/.test(name)) {
    return 'eccentric_dominant';
  }

  if (
    /pull.?up|chin.?up|dip|push.?up|ring|muscle.?up|inverted row|trx/.test(name) ||
    type === 'bodyweight' ||
    category === 'bodyweight'
  ) {
    return 'bodyweight_relative';
  }

  if (/split squat|lunge|step.?up|single.?leg|single leg|pistol|bulgarian/.test(name)) {
    return 'unilateral_compound';
  }

  if (/jump|plyom|box jump|hurdle|med ball|power clean|snatch/.test(name)) {
    return 'plyometric_power';
  }

  if (/plank|pallof|copenhagen|dead bug|bird dog|hollow|ab wheel|anti.?rotation/.test(name)) {
    return 'core_stability';
  }

  if (
    /curl|raise|fly|extension|shrug|calf|face pull|external rot|adduction|abduction/.test(name) ||
    category === 'isolation'
  ) {
    return 'isolation_accessory';
  }

  if (
    /squat|deadlift|bench|press|row|pull.?down|pulldown|hip thrust|rdl|romanian/.test(name) ||
    category === 'compound'
  ) {
    return 'bilateral_compound';
  }

  return 'unknown';
};

export const getExerciseFactor = (
  exerciseName: string,
  overrideCategory?: ExerciseFactorCategory,
  existingCategory?: string,
  existingType?: string
): number => {
  const category =
    overrideCategory ?? inferExerciseFactorCategory(exerciseName, existingCategory, existingType);
  return EXERCISE_FACTORS[category];
};
