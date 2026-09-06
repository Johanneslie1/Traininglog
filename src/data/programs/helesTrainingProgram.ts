import { ActivityType } from '@/types/activityTypes';
import { Exercise } from '@/types/exercise';
import { NumberOrRange, Prescription, Program, ProgramExercise, ProgramSession, WeightPrescription } from '@/types/program';

export const HELES_TRAINING_PROGRAM_NAME = "Hele's Training Program";
export const HELES_TRAINING_PROGRAM_TAG = 'heles-training-program';
export const HELES_TRAINING_PROGRAM_REVISION = 1;
export const HELES_TRAINING_PROGRAM_REVISION_TAG = `htp-rev-${HELES_TRAINING_PROGRAM_REVISION}`;

export const HELES_TRAINING_PROGRAM_DESCRIPTION = [
  'Eight-week hypertrophy block with four sessions: Lower 1, Lower 2, Upper 1, and Upper 2.',
  'The structured prescription is week 1. The full week 1–8 plan is in each exercise note.',
  'Do not increase load if RPE is already above the planned target. Double progression: add weight only after you hit the reps at the prescribed RPE.',
  'Unilateral work uses the prescribed set count per side. Do not double the set count.',
].join(' ');

const REST_MAIN = 120;
const REST_ACCESSORY = 90;

const MAIN_WEEKS = [
  '3 × 10–12 @ RPE 7',
  '3 × 8–10 @ RPE 7–8',
  '3 × 6–8 @ RPE 8',
  '3 × 6–8 @ RPE 8',
  '3 × 8–10 @ RPE 7',
  '3 × 6–8 @ RPE 7–8',
  '3 × 6–8 @ RPE 8',
  '3 × 6–8 @ RPE 8–9',
] as const;

const ACCESSORY_WEEKS = [
  '2 × 10–12 @ RPE 7',
  '2 × 8–10 @ RPE 7–8',
  '2 × 8–10 @ RPE 8',
  '2 × 8–10 @ RPE 8',
  '2 × 8–10 @ RPE 7',
  '2 × 8–10 @ RPE 7–8',
  '2 × 8–10 @ RPE 8',
  '2 × 8–10 @ RPE 8–9',
] as const;

const DIPS_WEEKS = [
  '2 × 10–12 @ RPE 7',
  '2 × 8–10 @ RPE 7–8',
  '2 × 6–8 @ RPE 8',
  '2 × 6–8 @ RPE 8',
  '2 × 8–10 @ RPE 7',
  '2 × 6–8 @ RPE 7–8',
  '2 × 6–8 @ RPE 8',
  '2 × 6–8 @ RPE 8–9',
] as const;

const rpeLoad = (value: NumberOrRange): WeightPrescription => ({
  type: 'rpe',
  value,
});

const strengthRx = (
  sets: NumberOrRange,
  reps: NumberOrRange,
  rpe: NumberOrRange,
  rest: number
): Prescription => ({
  sets,
  reps,
  weight: rpeLoad(rpe),
  rpe: typeof rpe === 'number' ? rpe : rpe.min,
  rest,
});

const weekNotes = (...lines: string[]): string => lines.join('\n');

const blockTable = (weeks: readonly string[], extras: string[] = []): string =>
  weekNotes(
    ...weeks.map((scheme, index) => `Week ${index + 1}: ${scheme}`),
    ...extras
  );

type BlockExerciseDraft = {
  id: string;
  name: string;
  activityType: ActivityType;
  notes: string;
  prescription: Prescription;
  category?: string;
  type?: Exercise['type'];
  defaultUnit?: Exercise['defaultUnit'];
};

const snapshotFor = (draft: BlockExerciseDraft): NonNullable<ProgramExercise['exerciseSnapshot']> => ({
  id: draft.id,
  name: draft.name,
  activityType: draft.activityType,
  category: draft.category || 'compound',
  type: draft.type || 'strength',
  defaultUnit: draft.defaultUnit || 'kg',
  metrics: { trackWeight: true, trackReps: true, trackRPE: true },
  primaryMuscles: [],
  secondaryMuscles: [],
  equipment: [],
});

const toProgramExercise = (draft: BlockExerciseDraft, order: number): ProgramExercise => ({
  id: draft.id,
  name: draft.name,
  activityType: ActivityType.RESISTANCE,
  order,
  notes: draft.notes,
  instructionMode: 'structured',
  prescription: draft.prescription,
  instructions: draft.notes,
  exerciseSnapshot: snapshotFor(draft),
});

const mainLift = (
  id: string,
  name: string,
  extras: string[] = [],
  options: Pick<BlockExerciseDraft, 'category' | 'type' | 'defaultUnit'> = {}
): BlockExerciseDraft => ({
  id,
  name,
  activityType: ActivityType.RESISTANCE,
  prescription: strengthRx(3, { min: 10, max: 12 }, 7, REST_MAIN),
  notes: blockTable(MAIN_WEEKS, extras),
  ...options,
});

const accessoryLift = (
  id: string,
  name: string,
  extras: string[] = [],
  options: Pick<BlockExerciseDraft, 'category' | 'type' | 'defaultUnit'> = {}
): BlockExerciseDraft => ({
  id,
  name,
  activityType: ActivityType.RESISTANCE,
  category: options.category || 'isolation',
  type: options.type,
  defaultUnit: options.defaultUnit,
  prescription: strengthRx(2, { min: 10, max: 12 }, 7, REST_ACCESSORY),
  notes: blockTable(ACCESSORY_WEEKS, extras),
});

const lower1Exercises = (): BlockExerciseDraft[] => [
  mainLift('1285', 'Dumbbell single-leg hip thrust', [
    'Single-leg hip thrust. Log the prescribed set count per side.',
  ]),
  mainLift('leg-press-1', 'Leg Press'),
  mainLift('leg-curl-1', 'Leg Curl', [], { category: 'isolation' }),
  mainLift('1922', 'Dumbbell step-up', [
    'Step-ups. Log the prescribed set count per side.',
  ]),
  accessoryLift('2062', 'Cable Hip Adduction', [
    'Hip adduction. Log the prescribed set count per side.',
  ]),
  mainLift('standing-calf-raise-1', 'Standing Calf Raise', ['Calf raise.'], { category: 'isolation' }),
];

const lower2Exercises = (): BlockExerciseDraft[] => [
  mainLift('bulgarian-split-squat-1', 'Bulgarian Split Squat', [
    'Log the prescribed set count per side.',
  ]),
  mainLift('hip-thrust-1', 'Hip Thrust'),
  mainLift('romanian-deadlift-1', 'Romanian Deadlift'),
  accessoryLift('leg-extension-1', 'Leg Extension'),
  accessoryLift('1235', 'Glute Kickback', [
    'Kickbacks. Log the prescribed set count per side.',
  ]),
  accessoryLift('670', 'Thigh abductor', ['Hip abduction.']),
];

const upper1Exercises = (): BlockExerciseDraft[] => [
  mainLift('push-ups-1', 'Push-Ups', [], { type: 'bodyweight', defaultUnit: 'reps' }),
  mainLift('lat-pulldown-1', 'Lat Pulldown', ['Lat pulldown.']),
  mainLift('overhead-press-1', 'Overhead Press', ['Military press.']),
  mainLift('seated-row-1', 'Seated Row', ['Seated cable row.']),
  accessoryLift('tricep-extensions-1', 'Tricep Extensions'),
  accessoryLift('2532', 'Incline dumbbell reverse fly', ['Reverse fly.']),
];

const upper2Exercises = (): BlockExerciseDraft[] => [
  mainLift('incline-dumbbell-press-1', 'Incline Dumbbell Press', ['Incline dumbbell press.']),
  mainLift('1496', 'Machine-assisted pull-up', ['Assisted pull-ups.']),
  {
    id: 'parallel-bar-dips-1',
    name: 'Parallel Bar Dips',
    activityType: ActivityType.RESISTANCE,
    type: 'bodyweight',
    defaultUnit: 'reps',
    prescription: strengthRx(2, { min: 10, max: 12 }, 7, REST_ACCESSORY),
    notes: blockTable(DIPS_WEEKS, ['Dips / assisted dips. Use machine assistance if needed.']),
  },
  mainLift('barbell-row-1', 'Barbell Row', ['Standing barbell row.']),
  accessoryLift('2456', 'Barbell upright row', ['Upright row.']),
  accessoryLift('bicep-curls-1', 'Bicep Curls'),
];

const makeSession = (
  id: string,
  name: string,
  userId: string,
  order: number,
  notes: string,
  drafts: BlockExerciseDraft[]
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
  };
};

export const isHelesTrainingProgram = (program: Pick<Program, 'name' | 'tags'>): boolean =>
  program.name === HELES_TRAINING_PROGRAM_NAME ||
  Boolean(program.tags?.includes(HELES_TRAINING_PROGRAM_TAG));

export const isCurrentHelesTrainingProgramRevision = (
  program: Pick<Program, 'name' | 'tags'>
): boolean =>
  isHelesTrainingProgram(program) &&
  Boolean(program.tags?.includes(HELES_TRAINING_PROGRAM_REVISION_TAG));

export const buildHelesTrainingProgram = (
  userId: string
): Omit<Program, 'id' | 'createdAt' | 'updatedAt'> => {
  const sessions = [
    makeSession(
      'session-lower-1',
      'Lower 1',
      userId,
      0,
      'Primary lower session: single-leg hip thrust, leg press, curls, step-ups, adduction, and calves.',
      lower1Exercises()
    ),
    makeSession(
      'session-lower-2',
      'Lower 2',
      userId,
      1,
      'Second lower session: Bulgarian split squat, hip thrust, RDL, extensions, kickbacks, and abduction.',
      lower2Exercises()
    ),
    makeSession(
      'session-upper-1',
      'Upper 1',
      userId,
      2,
      'Primary upper session: push-ups, pulldown, military press, seated row, triceps, and reverse fly.',
      upper1Exercises()
    ),
    makeSession(
      'session-upper-2',
      'Upper 2',
      userId,
      3,
      'Second upper session: incline press, assisted pull-ups, dips, barbell row, upright row, and curls.',
      upper2Exercises()
    ),
  ];

  return {
    name: HELES_TRAINING_PROGRAM_NAME,
    description: HELES_TRAINING_PROGRAM_DESCRIPTION,
    createdBy: userId,
    userId,
    sessions,
    isPublic: false,
    tags: ['strength', 'hypertrophy', HELES_TRAINING_PROGRAM_TAG, HELES_TRAINING_PROGRAM_REVISION_TAG],
  };
};
