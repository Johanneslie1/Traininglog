import { ActivityType } from '@/types/activityTypes';
import { Exercise } from '@/types/exercise';
import { NumberOrRange, Prescription, Program, ProgramExercise, ProgramSession, WeightPrescription } from '@/types/program';

export const SPEED_STRENGTH_BLOCK_1_NAME = 'Speed + Strength Blokk 1';
export const SPEED_STRENGTH_BLOCK_1_TAG = 'speed-strength-block-1';
export const SPEED_STRENGTH_BLOCK_1_REVISION = 3;
export const SPEED_STRENGTH_BLOCK_1_REVISION_TAG = `ssb1-rev-${SPEED_STRENGTH_BLOCK_1_REVISION}`;

export const SPEED_STRENGTH_BLOCK_1_DESCRIPTION = [
  'Fire økter: Bein 1, Overkropp 1, Bein 2, Overkropp 2. Strukturert resept er uke 1; 4-ukersplanen står i øvelsesnotatet.',
  'Ikke øk alt hver uke. RPE styrer lasten. Treffer du planlagt RPE, kan du øke 2,5–5 kg neste uke. Ligger RPE allerede over plan, behold vekten eller kutt reps.',
  'Uke 4 er deload: færre sett, RPE 6–7, omtrent 90 % av uke 3-last.',
  'Sprint: ett sett per løp, 95–100 %, høy kvalitet. Unilateralt arbeid logges som foreskrevet settantall med /side i notat.',
].join(' ');

const REST_HEAVY = 180;
const REST_SECONDARY = 150;
const REST_ASSIST = 90;
const REST_CORE = 75;
const REST_SPRINT_ACC = 150;
const REST_SPRINT_MAX = 240;
const REST_POWER = 120;
const SPRINT_INTENSITY = 10;

const rpeLoad = (value: NumberOrRange): WeightPrescription => ({
  type: 'rpe',
  value,
});

const targetRpe = (value: NumberOrRange): number =>
  typeof value === 'number' ? value : value.min;

const strengthRx = (
  sets: NumberOrRange,
  reps: NumberOrRange,
  rpe: NumberOrRange,
  rest = REST_SECONDARY
): Prescription => ({
  sets,
  reps,
  weight: rpeLoad(rpe),
  rpe: targetRpe(rpe),
  rest,
});

const sprintRx = (
  runs: NumberOrRange,
  distance: NumberOrRange,
  rest: number
): Prescription => ({
  sets: runs,
  distance,
  intensity: SPRINT_INTENSITY,
  rest,
});

const powerRx = (
  sets: NumberOrRange,
  reps: NumberOrRange,
  rpe: NumberOrRange,
  rest = REST_POWER
): Prescription => ({
  sets,
  reps,
  weight: rpeLoad(rpe),
  rpe: targetRpe(rpe),
  rest,
});

const weekNotes = (...lines: string[]): string => lines.join('\n');

const blockTable = (
  weeks: [string, string, string, string],
  extras: string[] = []
): string =>
  weekNotes(
    `Uke 1: ${weeks[0]}`,
    `Uke 2: ${weeks[1]}`,
    `Uke 3: ${weeks[2]}`,
    `Uke 4: ${weeks[3]}`,
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

const snapshotFor = (draft: BlockExerciseDraft): NonNullable<ProgramExercise['exerciseSnapshot']> => {
  const isResistance = draft.activityType === ActivityType.RESISTANCE;
  return {
    id: draft.id,
    name: draft.name,
    activityType: draft.activityType,
    category: draft.category || (isResistance ? 'compound' : 'speed'),
    type: draft.type || (isResistance ? 'strength' : 'speedAgility'),
    defaultUnit: draft.defaultUnit || (isResistance ? 'kg' : 'distance'),
    metrics: isResistance
      ? { trackWeight: true, trackReps: true, trackRPE: true }
      : { trackDistance: true, trackReps: true, trackSets: true, trackRPE: true, trackTime: true },
    primaryMuscles: [],
    secondaryMuscles: [],
    equipment: [],
  };
};

const toProgramExercise = (draft: BlockExerciseDraft, order: number): ProgramExercise => ({
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

const bein1Exercises = (): BlockExerciseDraft[] => [
  {
    id: 'sap_generic_sprint',
    name: 'Sprint',
    activityType: ActivityType.SPEED_AGILITY,
    category: 'speed',
    type: 'speedAgility',
    defaultUnit: 'distance',
    prescription: sprintRx(4, { min: 10, max: 15 }, REST_SPRINT_ACC),
    notes: blockTable(
      ['4 × 10–15 m 95–100 %', '5 × 10–20 m 95–100 %', '5–6 × 10–20 m 95–100 %', '3 × 10–15 m 95–100 %'],
      ['Acceleration sprint. Pause: 2–3 min. Logg ett sett per løp. Ikke jag volum.']
    ),
  },
  {
    id: 'sap019',
    name: 'Flying 20s',
    activityType: ActivityType.SPEED_AGILITY,
    category: 'speed',
    type: 'speedAgility',
    defaultUnit: 'distance',
    prescription: sprintRx(3, { min: 20, max: 30 }, REST_SPRINT_MAX),
    notes: blockTable(
      ['3 × 20–30 m 95–100 %', '4 × 20–30 m 95–100 %', '4–5 × 20–30 m 95–100 %', '2–3 × 20–30 m 95–100 %'],
      ['Max velocity sprint. Pause: 3–5 min. Logg ett sett per løp. Ikke jag volum.']
    ),
  },
  {
    id: '1803',
    name: 'Hang Clean',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(4, 2, { min: 6, max: 7 }, REST_HEAVY),
    notes: blockTable(
      ['4 × 2 @ RPE 6–7', '4 × 2 @ RPE 7', '5 × 2 @ RPE 7–8', '3 × 2 @ RPE 6'],
      ['Clean. Hang Clean fra biblioteket. Start gjerne i 80–95 kg-sonen, men la RPE vinne over kiloene.']
    ),
  },
  {
    id: '1836',
    name: 'Front Squat (Clean Grip)',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(3, 5, 7, REST_HEAVY),
    notes: blockTable(
      ['3 × 5 @ RPE 7', '4 × 4 @ RPE 7–8', '4 × 3 @ RPE 8', '2 × 3 @ RPE 6–7'],
      ['Front squat. Primær styrkeøvelse. Ikke øk hvis RPE allerede er over plan.']
    ),
  },
  {
    id: 'romanian-deadlift-1',
    name: 'Romanian Deadlift',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(3, 6, 7, REST_SECONDARY),
    notes: blockTable(['3 × 6 @ RPE 7', '3 × 6 @ RPE 7–8', '3 × 5 @ RPE 8', '2 × 5 @ RPE 6–7']),
  },
  {
    id: 'hip-thrust-1',
    name: 'Hip Thrust',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(3, 6, 7, REST_SECONDARY),
    notes: blockTable(['3 × 6 @ RPE 7', '3 × 6 @ RPE 7–8', '3 × 5 @ RPE 8', '2 × 5 @ RPE 6–7']),
  },
  {
    id: 'standing-calf-raise-1',
    name: 'Standing Calf Raise',
    activityType: ActivityType.RESISTANCE,
    category: 'isolation',
    prescription: strengthRx(3, { min: 8, max: 10 }, 7, REST_ASSIST),
    notes: blockTable(['3 × 8–10 @ RPE 7', '3 × 8–10 @ RPE 7–8', '3 × 6–8 @ RPE 8', '2 × 8–10 @ RPE 6–7']),
  },
  {
    id: 'tibialis-raise-1',
    name: 'Tibialis Raise',
    activityType: ActivityType.RESISTANCE,
    category: 'isolation',
    type: 'bodyweight',
    defaultUnit: 'reps',
    prescription: strengthRx(2, { min: 12, max: 15 }, 7, REST_ASSIST),
    notes: blockTable(['2 × 12–15 @ RPE 7', '2 × 12–15 @ RPE 7–8', '2 × 10–15 @ RPE 8', '2 × 12–15 @ RPE 6–7']),
  },
  {
    id: 'hanging-leg-raise-1',
    name: 'Hanging Leg Raise',
    activityType: ActivityType.RESISTANCE,
    type: 'bodyweight',
    defaultUnit: 'reps',
    category: 'compound',
    prescription: strengthRx(2, { min: 8, max: 12 }, 7, REST_CORE),
    notes: blockTable(['2 × 8–12 @ RPE 7', '3 × 8–12 @ RPE 7–8', '3 × 8–10 @ RPE 8', '2 × 8–10 @ RPE 6–7']),
  },
];

const overkropp1Exercises = (): BlockExerciseDraft[] => [
  {
    id: 'bench-press-1',
    name: 'Bench Press',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(3, 6, 7, REST_HEAVY),
    notes: blockTable(
      ['3 × 6 @ RPE 7', '4 × 5 @ RPE 7–8', '4 × 4 @ RPE 8', '2 × 5 @ RPE 6–7'],
      ['Benkpress.']
    ),
  },
  {
    id: 'pull-up-1',
    name: 'Pull-Ups',
    activityType: ActivityType.RESISTANCE,
    type: 'bodyweight',
    defaultUnit: 'reps',
    prescription: strengthRx(4, 5, 7, REST_SECONDARY),
    notes: blockTable(
      ['4 × 5 @ RPE 7', '4 × 5 @ RPE 7–8', '4 × 4–5 @ RPE 8', '3 × 4 @ RPE 6–7'],
      ['Hvis kroppsvekt blir for lett: logg ekstra last i kg. Assistert = settnotat, ikke negativ vekt.']
    ),
  },
  {
    id: 'overhead-press-1',
    name: 'Overhead Press',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(3, 6, 7, REST_SECONDARY),
    notes: blockTable(
      ['3 × 6 @ RPE 7', '3 × 6 @ RPE 7–8', '3 × 5 @ RPE 8', '2 × 5 @ RPE 6–7'],
      ['Militærpress.']
    ),
  },
  {
    id: 'seated-row-1',
    name: 'Seated Row',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(3, 8, 7, REST_ASSIST),
    notes: blockTable(
      ['3 × 8 @ RPE 7', '3 × 8 @ RPE 7–8', '3 × 6–8 @ RPE 8', '2 × 8 @ RPE 6–7'],
      ['Sittende kabelroing.']
    ),
  },
  {
    id: 'incline-dumbbell-press-1',
    name: 'Incline Dumbbell Press',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(2, 8, 7, REST_ASSIST),
    notes: blockTable(
      ['2 × 8 @ RPE 7', '3 × 8 @ RPE 7–8', '3 × 6–8 @ RPE 8', '2 × 8 @ RPE 6–7'],
      ['Dumbbell skråbenk.']
    ),
  },
  {
    id: 'hammer-curls-1',
    name: 'Hammer Curls',
    activityType: ActivityType.RESISTANCE,
    category: 'isolation',
    prescription: strengthRx(2, { min: 8, max: 12 }, 8, REST_ASSIST),
    notes: blockTable(['2 × 8–12 @ RPE 8', '2 × 8–12 @ RPE 8', '2 × 8–10 @ RPE 8', '1 × 10 @ RPE 6–7']),
  },
  {
    id: 'tricep-extensions-1',
    name: 'Tricep Extensions',
    activityType: ActivityType.RESISTANCE,
    category: 'isolation',
    prescription: strengthRx(2, { min: 8, max: 12 }, 8, REST_ASSIST),
    notes: blockTable(['2 × 8–12 @ RPE 8', '2 × 8–12 @ RPE 8', '2 × 8–10 @ RPE 8', '1 × 10 @ RPE 6–7']),
  },
];

const bein2Exercises = (): BlockExerciseDraft[] => [
  {
    id: 'sap_generic_sprint',
    name: 'Sprint',
    activityType: ActivityType.SPEED_AGILITY,
    category: 'speed',
    type: 'speedAgility',
    defaultUnit: 'distance',
    prescription: sprintRx(3, 10, REST_SPRINT_ACC),
    notes: blockTable(
      ['3 × 10 m 95–100 %', '4 × 10 m 95–100 %', '4 × 15 m 95–100 %', '2–3 × 10 m 95–100 %'],
      ['Acceleration sprint. Logg ett sett per løp. Dette er ikke en ny tung beinøkt.']
    ),
  },
  {
    id: '620',
    name: 'Medicine ball rotational throw',
    activityType: ActivityType.SPEED_AGILITY,
    category: 'core',
    type: 'plyometrics',
    defaultUnit: 'reps',
    prescription: powerRx(3, 4, 6),
    notes: blockTable(
      ['3 × 4/side @ RPE 6', '3 × 5/side @ RPE 6–7', '4 × 4/side @ RPE 7', '2 × 4/side @ RPE 6'],
      ['Maksimal eksplosivitet. Logg foreskrevet settantall og skriv /side i notat — ikke doble sett.']
    ),
  },
  {
    id: 'sap105',
    name: 'Vertical Jump',
    activityType: ActivityType.SPEED_AGILITY,
    category: 'legs',
    type: 'plyometrics',
    defaultUnit: 'reps',
    prescription: powerRx(3, 3, 6),
    notes: blockTable(
      ['3 × 3 @ RPE 6', '3 × 3 @ RPE 6–7', '4 × 3 @ RPE 7', '2 × 3 @ RPE 6'],
      ['Countermovement jump. Full pause mellom sett. Hold samme hoppvariant gjennom blokken.']
    ),
  },
  {
    id: '1299',
    name: 'Power clean',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(3, 3, 6, REST_HEAVY),
    notes: blockTable(
      ['3 × 3 @ RPE 6', '3 × 2 @ RPE 6–7', '4 × 2 @ RPE 7', '2 × 2 @ RPE 6'],
      ['Power clean.']
    ),
  },
  {
    id: 'bulgarian-split-squat-1',
    name: 'Bulgarian Split Squat',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(2, 6, 7, REST_SECONDARY),
    notes: blockTable(
      ['2 × 6/side @ RPE 7', '3 × 6/side @ RPE 7', '3 × 5/side @ RPE 8', '2 × 5/side @ RPE 6–7'],
      ['Bulgarsk utfall. Logg foreskrevet settantall og skriv /side i notat. Ikke doble sett.']
    ),
  },
  {
    id: 'leg-curl-1',
    name: 'Leg Curl',
    activityType: ActivityType.RESISTANCE,
    category: 'isolation',
    prescription: strengthRx(2, 8, 7, REST_ASSIST),
    notes: blockTable(['2 × 8 @ RPE 7', '2 × 8 @ RPE 7–8', '3 × 6–8 @ RPE 8', '1–2 × 8 @ RPE 6–7']),
  },
  {
    id: 'standing-calf-raise-1',
    name: 'Standing Calf Raise',
    activityType: ActivityType.RESISTANCE,
    category: 'isolation',
    prescription: strengthRx(2, { min: 10, max: 15 }, 7, REST_ASSIST),
    notes: blockTable(['2 × 10–15 @ RPE 7', '2 × 10–12 @ RPE 7–8', '2 × 8–10 @ RPE 8', '2 × 10–12 @ RPE 6–7']),
  },
  {
    id: 'tibialis-raise-1',
    name: 'Tibialis Raise',
    activityType: ActivityType.RESISTANCE,
    category: 'isolation',
    type: 'bodyweight',
    defaultUnit: 'reps',
    prescription: strengthRx(2, { min: 12, max: 15 }, 7, REST_ASSIST),
    notes: blockTable(['2 × 12–15 @ RPE 7', '2 × 12–15 @ RPE 7–8', '2 × 10–15 @ RPE 8', '2 × 12–15 @ RPE 6–7']),
  },
];

const overkropp2Exercises = (): BlockExerciseDraft[] => [
  {
    id: 'incline-dumbbell-press-1',
    name: 'Incline Dumbbell Press',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(3, 8, 7, REST_ASSIST),
    notes: blockTable(
      ['3 × 8 @ RPE 7', '3 × 8 @ RPE 7–8', '3 × 6–8 @ RPE 8', '2 × 8 @ RPE 6–7'],
      ['Dumbbell skråbenk. Overkropp 2 skal føles lettere enn Overkropp 1.']
    ),
  },
  {
    id: 'lat-pulldown-1',
    name: 'Lat Pulldown',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(3, { min: 8, max: 10 }, 7, REST_ASSIST),
    notes: blockTable(
      ['3 × 8–10 @ RPE 7', '3 × 8 @ RPE 7–8', '3 × 6–8 @ RPE 8', '2 × 8–10 @ RPE 6–7'],
      ['Nedtrekk.']
    ),
  },
  {
    id: 'parallel-bar-dips-1',
    name: 'Parallel Bar Dips',
    activityType: ActivityType.RESISTANCE,
    type: 'bodyweight',
    defaultUnit: 'reps',
    prescription: strengthRx(2, { min: 8, max: 12 }, 7, REST_ASSIST),
    notes: blockTable(['2 × 8–12 @ RPE 7', '3 × 8–10 @ RPE 7–8', '3 × 6–8 @ RPE 8', '2 × 8–10 @ RPE 6–7']),
  },
  {
    id: 'barbell-row-1',
    name: 'Barbell Row',
    activityType: ActivityType.RESISTANCE,
    prescription: strengthRx(3, 8, 7, REST_ASSIST),
    notes: blockTable(
      ['3 × 8 @ RPE 7', '3 × 8 @ RPE 7–8', '3 × 6 @ RPE 8', '2 × 8 @ RPE 6–7'],
      ['Barbell stående roing.']
    ),
  },
  {
    id: '2456',
    name: 'Barbell upright row',
    activityType: ActivityType.RESISTANCE,
    category: 'isolation',
    prescription: strengthRx(2, { min: 10, max: 12 }, 7, REST_ASSIST),
    notes: blockTable(
      ['2 × 10–12 @ RPE 7', '2 × 10–12 @ RPE 7–8', '2 × 8–10 @ RPE 8', '1 × 10–12 @ RPE 6–7'],
      ['Upright row.']
    ),
  },
  {
    id: 'bicep-curls-1',
    name: 'Bicep Curls',
    activityType: ActivityType.RESISTANCE,
    category: 'isolation',
    prescription: strengthRx(2, { min: 10, max: 12 }, 7, REST_ASSIST),
    notes: blockTable(['2 × 10–12 @ RPE 7', '2 × 8–10 @ RPE 7–8', '2 × 8–10 @ RPE 8', '1 × 10–12 @ RPE 6–7']),
  },
  {
    id: 'pallof-press-1',
    name: 'Pallof Press',
    activityType: ActivityType.RESISTANCE,
    category: 'isolation',
    prescription: strengthRx(2, { min: 8, max: 12 }, 7, REST_CORE),
    notes: blockTable(
      ['2 × 8–12/side @ RPE 7', '2 × 8–12/side @ RPE 7–8', '3 × 8–10/side @ RPE 8', '2 × 8–10/side @ RPE 6–7'],
      ['Logg foreskrevet settantall og skriv /side i notat. Ikke doble settantallet.']
    ),
  },
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

export const isSpeedStrengthBlock1Program = (program: Pick<Program, 'name' | 'tags'>): boolean =>
  program.name === SPEED_STRENGTH_BLOCK_1_NAME ||
  Boolean(program.tags?.includes(SPEED_STRENGTH_BLOCK_1_TAG));

export const isCurrentSpeedStrengthBlock1Revision = (
  program: Pick<Program, 'name' | 'tags'>
): boolean =>
  isSpeedStrengthBlock1Program(program) &&
  Boolean(program.tags?.includes(SPEED_STRENGTH_BLOCK_1_REVISION_TAG));

export const buildSpeedStrengthBlock1Program = (
  userId: string
): Omit<Program, 'id' | 'createdAt' | 'updatedAt'> => {
  const sessions = [
    makeSession(
      'session-bein-1',
      'Bein 1 — Speed + Heavy Lower',
      userId,
      0,
      'Ukens viktigste økt. Acceleration og maksfart først, deretter clean og primær front squat.',
      bein1Exercises()
    ),
    makeSession(
      'session-overkropp-1',
      'Overkropp 1 — Upper Strength',
      userId,
      1,
      'Bevisst lavere volum enn tidligere overkroppsøkter. Ca. 20 arbeidssett.',
      overkropp1Exercises()
    ),
    makeSession(
      'session-bein-2',
      'Bein 2 — Speed + Power',
      userId,
      2,
      'Ikke en ny tung beinøkt. Mer eksplosivitet uten et stort restitusjonshull.',
      bein2Exercises()
    ),
    makeSession(
      'session-overkropp-2',
      'Overkropp 2 — Upper + Core',
      userId,
      3,
      'Litt morsommere og mindre krevende enn Overkropp 1. Ikke gjør den om til en ny tung overkroppsøkt.',
      overkropp2Exercises()
    ),
  ];

  return {
    name: SPEED_STRENGTH_BLOCK_1_NAME,
    description: SPEED_STRENGTH_BLOCK_1_DESCRIPTION,
    createdBy: userId,
    userId,
    sessions,
    isPublic: false,
    tags: ['speed', 'strength', SPEED_STRENGTH_BLOCK_1_TAG, SPEED_STRENGTH_BLOCK_1_REVISION_TAG],
  };
};
