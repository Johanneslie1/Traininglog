import type { ActivityType } from '@/types/activityTypes';

export const MOVEMENT_PATTERNS = [
  'squat',
  'hinge',
  'horizontal_push',
  'vertical_push',
  'horizontal_pull',
  'vertical_pull',
  'unilateral_lower_body',
  'carry',
  'rotation',
  'anti_rotation',
  'anti_extension',
  'anti_lateral_flexion',
  'ground_work',
] as const;

export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

export type ExerciseLaterality = 'bilateral' | 'unilateral';

export type DimLaterality = ExerciseLaterality | 'unknown';

export const MOVEMENT_PATTERN_LABELS: Record<MovementPattern, string> = {
  squat: 'Squat / knee dominant',
  hinge: 'Hinge / hip dominant',
  horizontal_push: 'Horizontal push',
  vertical_push: 'Vertical push',
  horizontal_pull: 'Horizontal pull',
  vertical_pull: 'Vertical pull',
  unilateral_lower_body: 'Unilateral lower body',
  carry: 'Carry / loaded carry',
  rotation: 'Rotation',
  anti_rotation: 'Anti-rotation',
  anti_extension: 'Anti-extension',
  anti_lateral_flexion: 'Anti-lateral flexion',
  ground_work: 'Ground work / floor-based',
};

export const LATERALITY_LABELS: Record<ExerciseLaterality, string> = {
  bilateral: 'Bilateral',
  unilateral: 'Unilateral',
};

export const shortMovementPatternLabel = (pattern: MovementPattern): string =>
  MOVEMENT_PATTERN_LABELS[pattern].split(' / ')[0];

export interface MovementPatternInferenceInput {
  name: string;
  catalogId?: string;
  activityType?: string;
  category?: string;
  type?: string;
  laterality?: ExerciseLaterality | string;
  primaryMovementPattern?: MovementPattern | string;
  secondaryMovementPattern?: MovementPattern | string;
  primaryMuscles?: readonly string[];
  secondaryMuscles?: readonly string[];
}

export interface InferredMovementPatterns {
  primary: MovementPattern | '';
  secondary: MovementPattern | '';
  laterality: DimLaterality;
}

const normalize = (value: string | undefined): string =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const asMovementPattern = (value: string | undefined): MovementPattern | '' => {
  const normalized = normalize(value).replace(/[\s-]+/g, '_');
  return (MOVEMENT_PATTERNS as readonly string[]).includes(normalized)
    ? (normalized as MovementPattern)
    : '';
};

const asLaterality = (value: string | undefined): ExerciseLaterality | '' => {
  const normalized = normalize(value);
  if (normalized === 'unilateral' || normalized === 'bilateral') {
    return normalized;
  }
  return '';
};

const PATTERN_OVERRIDES_BY_ID: Record<string, { primary: MovementPattern; secondary?: MovementPattern }> = {
  'deadlift-1': { primary: 'hinge' },
  'squat-1': { primary: 'squat' },
  'bench-press-1': { primary: 'horizontal_push' },
};

const PATTERN_OVERRIDES_BY_NAME: Record<string, { primary: MovementPattern; secondary?: MovementPattern }> = {
  'turkish get-up': { primary: 'ground_work' },
  'turkish get up': { primary: 'ground_work' },
  tgu: { primary: 'ground_work' },
  'pallof press': { primary: 'anti_rotation' },
  'farmer carry': { primary: 'carry' },
  "farmer's walk": { primary: 'carry' },
  'farmers walk': { primary: 'carry' },
};

const UNILATERAL_NAME = /split squat|lunge|step.?up|single.?leg|single leg|single.?arm|one.?arm|pistol|bulgarian|unilateral|suitcase/;

const shouldInferFromName = (activityType: string): boolean => {
  const type = normalize(activityType);
  return (
    type === '' ||
    type === 'resistance' ||
    type === 'strength' ||
    type === 'bodyweight' ||
    type === 'plyometric' ||
    type === 'plyometrics' ||
    type === 'speedagility' ||
    type === 'speed_agility'
  );
};

const inferFromName = (
  name: string
): { primary: MovementPattern | ''; secondary: MovementPattern | '' } => {
  if (!name) {
    return { primary: '', secondary: '' };
  }

  if (/turkish get-?up|\btgu\b|get-?up|bear crawl|lizard crawl|animal crawl|alligator crawl|spider crawl|crawl/.test(name)) {
    return { primary: 'ground_work', secondary: '' };
  }

  if (/side plank|side bridge|copenhagen|side bend/.test(name)) {
    return { primary: 'anti_lateral_flexion', secondary: '' };
  }

  if (/pallof|anti.?rotation|shoulder tap/.test(name)) {
    return { primary: 'anti_rotation', secondary: '' };
  }

  if (
    /wood.?chop|russian twist|rotational|landmine twist|med(?:icine)? ball twist|seated twist|oblique|heel-?touch|bicycle|windmill/.test(
      name
    )
  ) {
    return { primary: 'rotation', secondary: '' };
  }

  if (/farmer|carry|yoke|waiter walk|\bdrag\b/.test(name)) {
    const secondary: MovementPattern | '' = /suitcase/.test(name) ? 'anti_lateral_flexion' : '';
    return { primary: 'carry', secondary };
  }

  if (/suitcase/.test(name) && !/carry|walk/.test(name)) {
    return { primary: 'anti_lateral_flexion', secondary: '' };
  }

  if (
    /dead bug|ab wheel|ab roller|hollow|bird dog|roll.?out|\bplank\b|sit-?up|crunch|v-?up|flutter|toes?-to-bar|hanging (leg|knee|toes)|leg (raise|lift|tuck)|knee (raise|tuck)|decline abs/.test(
      name
    )
  ) {
    return { primary: 'anti_extension', secondary: '' };
  }

  const unilateralLower = UNILATERAL_NAME.test(name);

  if (/glute.?ham|ghr|back extension|hyper.?extension|rack pull|good morning|hip thrust|hip hinge|nordic|atlas stone/.test(name)) {
    return {
      primary: 'hinge',
      secondary: unilateralLower ? 'unilateral_lower_body' : '',
    };
  }

  if (/deadlift|rdl|romanian|\bswing\b|clean|snatch|med(?:icine)? ball slam/.test(name)) {
    return {
      primary: 'hinge',
      secondary: unilateralLower ? 'unilateral_lower_body' : '',
    };
  }

  if (/face pull|inverted row|seal row|\brow\b|pull.?over|pull apart|rear delt|reverse fly/.test(name) && !/upright row/.test(name)) {
    return {
      primary: 'horizontal_pull',
      secondary: unilateralLower ? 'unilateral_lower_body' : '',
    };
  }

  if (/upright row|pull.?up|chin.?up|lat pull|pull.?down|pulldown/.test(name) && !/push-?down/.test(name)) {
    return { primary: 'vertical_pull', secondary: '' };
  }

  if (/\bshrug\b/.test(name)) {
    return { primary: 'vertical_pull', secondary: '' };
  }

  if (/\bcurl\b|bicep/.test(name) && !/leg curl/.test(name)) {
    return { primary: 'horizontal_pull', secondary: '' };
  }

  if (/leg curl/.test(name)) {
    return { primary: 'hinge', secondary: '' };
  }

  if (/overhead|ohp|arnold|military press|push-?press|shoulder press|jerk|pike push|behind-?the-?head press|standing barbell press/.test(name)) {
    return { primary: 'vertical_push', secondary: '' };
  }

  if (/front raise|lateral raise|side raise|delt raise/.test(name)) {
    return { primary: 'vertical_push', secondary: '' };
  }

  if (/skull.?crusher|kick-?back|push-?down|pushdown|tricep|overhead extension/.test(name)) {
    return { primary: 'horizontal_push', secondary: '' };
  }

  if (/bench|push-?up|pushup|dips?|chest press|floor press|pec dec|peck deck|chest fly|cable fly|dumbbell fly|machine fly/.test(name)) {
    return { primary: 'horizontal_push', secondary: '' };
  }

  if (/\bpress\b/.test(name) && !/sit-?up/.test(name)) {
    return { primary: 'horizontal_push', secondary: '' };
  }

  if (/calf raise|tibialis/.test(name)) {
    return { primary: 'squat', secondary: '' };
  }

  if (/squat|leg press|hack squat|sissy|box jump|jump squat|\blunge|jump|hop|bound|skip/.test(name)) {
    return {
      primary: 'squat',
      secondary: unilateralLower ? 'unilateral_lower_body' : '',
    };
  }

  if (/abduct|adduct|clam|monster walk|hip airplane/.test(name)) {
    return {
      primary: 'squat',
      secondary: 'unilateral_lower_body',
    };
  }

  if (unilateralLower && /leg|lunge|step/.test(name)) {
    return { primary: 'unilateral_lower_body', secondary: '' };
  }

  return { primary: '', secondary: '' };
};

const MUSCLE_PATTERN_FALLBACK: Record<string, MovementPattern> = {
  chest: 'horizontal_push',
  pectorals: 'horizontal_push',
  shoulders: 'vertical_push',
  deltoids: 'vertical_push',
  triceps: 'horizontal_push',
  back: 'horizontal_pull',
  lats: 'vertical_pull',
  traps: 'vertical_pull',
  middle_back: 'horizontal_pull',
  biceps: 'horizontal_pull',
  forearms: 'horizontal_pull',
  quadriceps: 'squat',
  quads: 'squat',
  hip_flexors: 'squat',
  calves: 'squat',
  hamstrings: 'hinge',
  glutes: 'hinge',
  lower_back: 'hinge',
  core: 'anti_extension',
  abs: 'anti_extension',
  abdominals: 'anti_extension',
  obliques: 'rotation',
  abductors: 'squat',
  adductors: 'squat',
};

const inferFromMuscles = (
  primaryMuscles?: readonly string[],
  secondaryMuscles?: readonly string[]
): { primary: MovementPattern | ''; secondary: MovementPattern | '' } => {
  const muscles = [...(primaryMuscles ?? []), ...(secondaryMuscles ?? [])]
    .map((muscle) => normalize(muscle).replace(/\s+/g, '_'))
    .filter(Boolean);

  for (const muscle of muscles) {
    const pattern = MUSCLE_PATTERN_FALLBACK[muscle];
    if (pattern) {
      return { primary: pattern, secondary: '' };
    }
  }

  return { primary: '', secondary: '' };
};

const inferLaterality = (
  name: string,
  stored: ExerciseLaterality | '',
  primary: MovementPattern | ''
): DimLaterality => {
  if (stored) {
    return stored;
  }

  if (UNILATERAL_NAME.test(name)) {
    return 'unilateral';
  }

  if (primary && primary !== 'unilateral_lower_body' && primary !== 'ground_work') {
    return 'bilateral';
  }

  return 'unknown';
};

export const inferMovementPatterns = (
  input: MovementPatternInferenceInput
): InferredMovementPatterns => {
  const name = normalize(input.name);
  const activityType = normalize(input.activityType);
  const storedPrimary = asMovementPattern(input.primaryMovementPattern);
  const storedSecondary = asMovementPattern(input.secondaryMovementPattern);
  const storedLaterality = asLaterality(input.laterality);

  const override =
    PATTERN_OVERRIDES_BY_ID[normalize(input.catalogId)] ||
    PATTERN_OVERRIDES_BY_NAME[name];

  let primary: MovementPattern | '' = storedPrimary;
  let secondary: MovementPattern | '' = storedSecondary;

  if (!primary && override) {
    primary = override.primary;
    secondary = secondary || override.secondary || '';
  }

  if (!primary && (shouldInferFromName(activityType) || shouldInferFromName(input.type ?? ''))) {
    const inferred = inferFromName(name);
    primary = inferred.primary;
    secondary = secondary || inferred.secondary;
  }

  if (!primary && (shouldInferFromName(activityType) || shouldInferFromName(input.type ?? ''))) {
    const fromMuscles = inferFromMuscles(input.primaryMuscles, input.secondaryMuscles);
    primary = fromMuscles.primary;
    secondary = secondary || fromMuscles.secondary;
  }

  if (primary && secondary === primary) {
    secondary = '';
  }

  return {
    primary,
    secondary,
    laterality: inferLaterality(name, storedLaterality, primary),
  };
};

export const isMovementPattern = (value: string): value is MovementPattern =>
  (MOVEMENT_PATTERNS as readonly string[]).includes(value);

export const activitySupportsMovementPatterns = (activityType?: ActivityType | string): boolean =>
  shouldInferFromName(String(activityType ?? ''));
