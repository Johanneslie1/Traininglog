import { ActivityType } from '@/types/activityTypes';
import { Exercise } from '@/types/exercise';
import { NumberOrRange, Prescription, Program, ProgramExercise, ProgramSession } from '@/types/program';

export const SHOULDER_REHAB_3_WEEK_NAME = 'Shoulder Rehab – 3 Weeks';
export const SHOULDER_REHAB_3_WEEK_TAG = 'shoulder-rehab-3-week';
export const SHOULDER_REHAB_3_WEEK_REVISION = 4;
export const SHOULDER_REHAB_3_WEEK_REVISION_TAG = `shr3-rev-${SHOULDER_REHAB_3_WEEK_REVISION}`;

export const SHOULDER_REHAB_3_WEEK_DESCRIPTION =
  'Rehab after anterior shoulder dislocation. Daily activation plus three weeks of strength work.';

export const SHOULDER_REHAB_3_WEEK_RULES = [
  'Pain up to 3/10 during exercise is OK; it should be back to normal by the next morning.',
  "Stop an exercise if the shoulder slips, clunks, or feels like it's about to come out.",
  'Daily shoulder activation every day; strength sessions as listed per week.',
  "Legs, core and cardio can be trained freely as long as the arm isn't involved.",
];

export const SHOULDER_REHAB_3_WEEK_STOP_SIGNS =
  'Stop and contact a doctor if the shoulder slips or clicks, sudden sharp pain, or numbness/weakness.';

const DAILY_PROGRESSION_NOTE =
  'Week 1: increase isometric effort from 30-50% to 70-80% by end of week.';

type Draft = {
  id: string;
  catalogId?: string;
  name: string;
  activityType: ActivityType;
  prescription: Prescription;
  notes: string;
  category?: string;
  type?: Exercise['type'];
  defaultUnit?: Exercise['defaultUnit'];
};

const snapshotFor = (draft: Draft): NonNullable<ProgramExercise['exerciseSnapshot']> => {
  const isResistance = draft.activityType === ActivityType.RESISTANCE;
  const isCarry = draft.activityType === ActivityType.SPEED_AGILITY;
  return {
    id: draft.catalogId || draft.id,
    name: draft.name,
    activityType: draft.activityType,
    category: draft.category || (isResistance ? 'isolation' : 'mobility'),
    type: draft.type || (isResistance ? 'strength' : isCarry ? 'speedAgility' : 'flexibility'),
    defaultUnit: draft.defaultUnit || (isResistance ? 'kg' : isCarry ? 'distance' : 'time'),
    metrics: isResistance
      ? { trackWeight: true, trackReps: true, trackRPE: true }
      : isCarry
        ? { trackDistance: true, trackReps: true, trackSets: true, trackRPE: true, trackTime: true }
        : { trackTime: true, trackReps: true, trackRPE: true },
    primaryMuscles: [],
    secondaryMuscles: [],
    equipment: [],
  };
};

const toProgramExercise = (draft: Draft, order: number): ProgramExercise => ({
  id: draft.id,
  name: draft.name,
  activityType: draft.activityType,
  order,
  notes: draft.notes,
  instructionMode: 'structured',
  prescription: draft.prescription,
  instructions: draft.notes,
  exerciseSnapshot: snapshotFor(draft),
});

const strength = (
  id: string,
  name: string,
  sets: NumberOrRange,
  notes: string,
  options: {
    reps?: NumberOrRange;
    catalogId?: string;
    category?: string;
    type?: Exercise['type'];
    defaultUnit?: Exercise['defaultUnit'];
    distance?: number;
    activityType?: ActivityType;
  } = {}
): Draft => ({
  id,
  catalogId: options.catalogId || id,
  name,
  activityType: options.activityType || ActivityType.RESISTANCE,
  prescription: {
    sets,
    ...(options.reps !== undefined ? { reps: options.reps } : {}),
    ...(options.distance !== undefined ? { distance: options.distance } : {}),
    notes,
  },
  notes,
  category: options.category,
  type: options.type,
  defaultUnit: options.defaultUnit,
});

const bandEr = (
  id: string,
  sets: NumberOrRange,
  reps: NumberOrRange,
  notes: string
): Draft =>
  strength(id, 'External Rotation with Band', sets, notes, { reps, catalogId: '2432' });

const bandIr = (
  id: string,
  sets: NumberOrRange,
  reps: NumberOrRange,
  notes: string
): Draft =>
  strength(id, 'Internal Rotation with Band', sets, notes, { reps, catalogId: '2427' });

const pushUps = (id: string, sets: NumberOrRange, reps: NumberOrRange, notes: string): Draft =>
  strength(id, 'Push-Ups', sets, notes, {
    reps,
    catalogId: 'push-ups-1',
    category: 'compound',
    type: 'bodyweight',
    defaultUnit: 'reps',
  });

const dailyActivationExercises = (): Draft[] => [
  strength('shr-pendulum', 'Pendulum', 1, '1-2 min'),
  strength('shr-iso-er', 'Isometric external rotation', { min: 5, max: 8 }, 'Elbow at side, 90°. Hold 10 sec.'),
  strength('shr-iso-ir', 'Isometric internal rotation', { min: 5, max: 8 }, 'Elbow at side, 90°. Hold 10 sec.'),
  strength('shr-iso-forward', 'Isometric forward press', { min: 5, max: 8 }, 'Elbow at side, 90°. Hold 10 sec.'),
  strength('shr-iso-outward', 'Isometric outward press', { min: 5, max: 8 }, 'Elbow at side, 90°. Hold 10 sec.'),
  strength('shr-iso-backward', 'Isometric backward press', { min: 5, max: 8 }, 'Elbow at side, 90°. Hold 10 sec.'),
];

const week1Exercises = (): Draft[] => [
  bandEr('2432', 3, 15, 'Towel under the elbow. 3 × 15.'),
  bandIr('2427', 3, 15, 'Towel under the elbow. 3 × 15.'),
  strength('shr-side-lying-er', 'Side-lying external rotation', 3, 'Light dumbbell. 3 × 12.', { reps: 12 }),
  strength('seated-row-1', 'Seated Row', 3, 'Band or cable. 3 × 12.', { reps: 12, category: 'compound' }),
  pushUps('push-ups-1', 3, 15, 'Wall push-up plus. 3 × 15.'),
  strength('shr-wall-slides', 'Wall slides', 3, 'Up to shoulder height only. 3 × 10.', {
    reps: 10,
    activityType: ActivityType.STRETCHING,
    category: 'mobility',
    type: 'flexibility',
    defaultUnit: 'time',
  }),
  strength('bicep-curls-1', 'Bicep Curls', 3, 'Elbows at sides. 3 × 12.', { reps: 12 }),
  strength('2838', 'Triceps Pushdown', 3, 'Elbows at sides. 3 × 12.', { reps: 12 }),
  strength('dead-bug-1', 'Dead Bug', 3, '3 × 10/side.', {
    reps: 10,
    category: 'core',
    type: 'bodyweight',
    defaultUnit: 'reps',
  }),
  strength('pallof-press-1', 'Pallof Press', 3, '3 × 10/side.', { reps: 10, category: 'core' }),
  strength('389', 'Side plank', 3, '30 sec. Healthy side.', { type: 'bodyweight', defaultUnit: 'reps' }),
];

const week2Exercises = (): Draft[] => [
  bandEr('2432', 4, 12, 'Heavier band. 4 × 12.'),
  bandIr('2427', 4, 12, 'Heavier band. 4 × 12.'),
  bandEr(
    '2432-45',
    3,
    12,
    '45° abduction. Try 90° at the end of the week if there is no instability. 3 × 12.'
  ),
  strength('single-arm-dumbbell-row-1', 'Single-Arm Dumbbell Row', 4, '4 × 10.', {
    reps: 10,
    category: 'compound',
  }),
  pushUps(
    'push-ups-1',
    3,
    { min: 10, max: 15 },
    'Progress incline → knees → full push-up plus. Do not go to the bottom. 3 × 10-15.'
  ),
  strength('1504', 'Robertson Half-Kneeling Landmine Press', 3, '3 × 10.', { reps: 10, category: 'compound' }),
  strength('shr-prone-ty', 'Prone T and Y raises', 3, 'Partial range. 3 × 12.', { reps: 12 }),
  strength('255', 'Shoulder tap', 3, 'Plank. 3 × 20.', {
    reps: 20,
    category: 'core',
    type: 'bodyweight',
    defaultUnit: 'reps',
  }),
  strength('shr-quadruped-shifts', 'Quadruped weight shifts', 3, 'Onto the injured arm. 3 × 30 sec.'),
  strength('shr-rhythmic-stab', 'Partner rhythmic stabilization', 3, 'Arm at shoulder height. 3 × 30 sec.'),
  strength('farmer-carry-1', 'Farmer Carry', 3, '3 × 30 m.', {
    distance: 30,
    category: 'carry',
    defaultUnit: 'distance',
  }),
];

const week3Exercises = (): Draft[] => [
  bandEr('2432', 3, 15, 'Fast, at 90/90. 3 × 15.'),
  bandEr('2432-ecc', 3, 8, 'Lower for 3 seconds. 3 × 8.'),
  strength('shr-bottoms-up-press', 'Bottoms-up kettlebell press', 3, '3 × 8.', { reps: 8, category: 'compound' }),
  pushUps('push-ups-1', 3, 10, 'Full push-ups with partner perturbation. 3 × 10.'),
  strength('sap053', 'Medicine Ball Chest Pass', 3, '3 × 10.', {
    reps: 10,
    category: 'power',
    activityType: ActivityType.SPEED_AGILITY,
    type: 'plyometrics',
  }),
  strength('sap044', 'Medicine Ball Overhead Throws', 3, 'Light, two-handed. 3 × 10.', {
    reps: 10,
    category: 'power',
    activityType: ActivityType.SPEED_AGILITY,
    type: 'plyometrics',
  }),
  strength('shr-wall-ball', 'Ball against wall', 3, 'Arm at 90°. 3 × 30 sec.'),
];

const makeSession = (
  id: string,
  name: string,
  userId: string,
  order: number,
  notes: string,
  drafts: Draft[],
  meta: Pick<ProgramSession, 'week' | 'sessionsPerWeek' | 'sessionKind'>
): ProgramSession => {
  const exercises = drafts.map((draft, index) => toProgramExercise(draft, index));
  return {
    id,
    name,
    userId,
    order,
    notes,
    exercises,
    supersets: [],
    exerciseOrder: exercises.map((exercise) => exercise.id),
    ...meta,
  };
};

export const isShoulderRehabProgram = (program: Pick<Program, 'name' | 'tags'>): boolean =>
  program.name === SHOULDER_REHAB_3_WEEK_NAME ||
  Boolean(program.tags?.includes(SHOULDER_REHAB_3_WEEK_TAG));

export const isCurrentShoulderRehabRevision = (
  program: Pick<Program, 'name' | 'tags'>
): boolean =>
  isShoulderRehabProgram(program) &&
  Boolean(program.tags?.includes(SHOULDER_REHAB_3_WEEK_REVISION_TAG));

export const buildShoulderRehab3WeekProgram = (
  userId: string
): Omit<Program, 'id' | 'createdAt' | 'updatedAt'> => {
  const sessions = [
    makeSession(
      'session-daily-activation',
      'Daily shoulder activation',
      userId,
      0,
      `10-15 min every day. ${DAILY_PROGRESSION_NOTE}`,
      dailyActivationExercises(),
      { sessionKind: 'daily-activation' }
    ),
    makeSession(
      'session-week-1',
      'Week 1 · Calm and activate',
      userId,
      1,
      '4 strength sessions this week.',
      week1Exercises(),
      {
        sessionKind: 'strength',
        week: 1,
        sessionsPerWeek: 4,
      }
    ),
    makeSession(
      'session-week-2',
      'Week 2 · Build strength',
      userId,
      2,
      '4 strength sessions this week.',
      week2Exercises(),
      {
        sessionKind: 'strength',
        week: 2,
        sessionsPerWeek: 4,
      }
    ),
    makeSession(
      'session-week-3',
      'Week 3 · Power',
      userId,
      3,
      '3 strength sessions this week.',
      week3Exercises(),
      {
        sessionKind: 'strength',
        week: 3,
        sessionsPerWeek: 3,
      }
    ),
  ];

  return {
    name: SHOULDER_REHAB_3_WEEK_NAME,
    description: SHOULDER_REHAB_3_WEEK_DESCRIPTION,
    createdBy: userId,
    userId,
    sessions,
    isPublic: false,
    rules: [...SHOULDER_REHAB_3_WEEK_RULES],
    stopSigns: SHOULDER_REHAB_3_WEEK_STOP_SIGNS,
    tags: ['rehab', 'shoulder', SHOULDER_REHAB_3_WEEK_TAG, SHOULDER_REHAB_3_WEEK_REVISION_TAG],
  };
};
