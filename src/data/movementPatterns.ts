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

  if (/turkish get-?up|\btgu\b|get-?up|bear crawl|lizard crawl|animal crawl/.test(name)) {
    return { primary: 'ground_work', secondary: '' };
  }

  if (/side plank|side bridge|suiter|copenhagen|side bend/.test(name)) {
    return { primary: 'anti_lateral_flexion', secondary: '' };
  }

  if (/pallof|anti.?rotation/.test(name)) {
    return { primary: 'anti_rotation', secondary: '' };
  }

  if (/wood.?chop|russian twist|rotational|landmine twist|med(?:icine)? ball twist/.test(name)) {
    return { primary: 'rotation', secondary: '' };
  }

  if (/farmer|carry|yoke|waiter walk/.test(name)) {
    const secondary: MovementPattern | '' = /suitcase/.test(name) ? 'anti_lateral_flexion' : '';
    return { primary: 'carry', secondary };
  }

  if (/suitcase/.test(name) && !/carry|walk/.test(name)) {
    return { primary: 'anti_lateral_flexion', secondary: '' };
  }

  if (/dead bug|ab wheel|hollow|bird dog|roll.?out|\bplank\b/.test(name)) {
    return { primary: 'anti_extension', secondary: '' };
  }

  const unilateralLower = UNILATERAL_NAME.test(name);

  if (/face pull|inverted row|seal row|\brow\b/.test(name) && !/upright row/.test(name)) {
    return {
      primary: 'horizontal_pull',
      secondary: unilateralLower ? 'unilateral_lower_body' : '',
    };
  }

  if (/upright row|pull.?up|chin.?up|lat pull|pull.?down|pulldown/.test(name)) {
    return { primary: 'vertical_pull', secondary: '' };
  }

  if (/overhead|ohp|military press|push press|shoulder press|jerk|pike push/.test(name)) {
    return { primary: 'vertical_push', secondary: '' };
  }

  if (/bench|push.?up|pushup|\bdip\b|chest press|floor press/.test(name)) {
    return { primary: 'horizontal_push', secondary: '' };
  }

  if (/deadlift|rdl|romanian|hip thrust|good morning|swing|back extension|hip hinge|nordic/.test(name)) {
    return {
      primary: 'hinge',
      secondary: unilateralLower ? 'unilateral_lower_body' : '',
    };
  }

  if (/squat|leg press|hack squat|sissy|box jump|jump squat|\blunge/.test(name)) {
    return {
      primary: 'squat',
      secondary: unilateralLower ? 'unilateral_lower_body' : '',
    };
  }

  if (unilateralLower && /leg|lunge|step/.test(name)) {
    return { primary: 'unilateral_lower_body', secondary: '' };
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
