import { ActivityType } from '@/types/activityTypes';
import { Exercise } from '@/types/exercise';
import { NumberOrRange, Program, ProgramExercise, ProgramSession } from '@/types/program';

export const SHOULDER_SLING_PROGRAM_NAME = 'Shoulder Sling Rehab';
export const SHOULDER_SLING_PROGRAM_TAG = 'shoulder-sling-rehab';
export const SHOULDER_SLING_PROGRAM_REVISION = 1;
export const SHOULDER_SLING_PROGRAM_REVISION_TAG = `ssr-rev-${SHOULDER_SLING_PROGRAM_REVISION}`;

export const SHOULDER_SLING_PROGRAM_DESCRIPTION =
  'Three-week suspension-trainer shoulder program from physio. Week 3 is the prescribed sling and medicine-ball work. The same sessions are also listed on Shoulder Rehab – 3 Weeks.';

export const SHOULDER_SLING_PROGRAM_RULES = [
  'Pain up to 3/10 during exercise is OK; it should be back to normal by the next morning.',
  "Stop an exercise if the shoulder slips, clunks, or feels like it's about to come out.",
  'Three sessions per week. Move on only when the current week stays settled.',
  'Steepen the body angle only when the current lean stays controlled.',
];

export const SHOULDER_SLING_PROGRAM_STOP_SIGNS =
  'Stop and contact a doctor if the shoulder slips or clicks, sudden sharp pain, or numbness/weakness.';

type Draft = {
  id: string;
  name: string;
  activityType: ActivityType;
  prescription: {
    sets: NumberOrRange;
    reps: NumberOrRange;
    notes: string;
  };
  notes: string;
  category: string;
  type: Exercise['type'];
  defaultUnit: Exercise['defaultUnit'];
  equipment: string[];
};

const snapshotFor = (draft: Draft): NonNullable<ProgramExercise['exerciseSnapshot']> => ({
  id: draft.id,
  name: draft.name,
  activityType: draft.activityType,
  category: draft.category,
  type: draft.type,
  defaultUnit: draft.defaultUnit,
  metrics: { trackWeight: true, trackReps: true, trackRPE: true },
  primaryMuscles: ['shoulders'],
  secondaryMuscles: [],
  equipment: draft.equipment,
});

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

const sling = (
  id: string,
  name: string,
  sets: NumberOrRange,
  reps: NumberOrRange,
  notes: string
): Draft => ({
  id,
  name,
  activityType: ActivityType.RESISTANCE,
  prescription: { sets, reps, notes },
  notes,
  category: 'isolation',
  type: 'bodyweight',
  defaultUnit: 'reps',
  equipment: ['trx'],
});

const medBall = (
  id: string,
  sets: NumberOrRange,
  reps: NumberOrRange,
  notes: string
): Draft => ({
  id,
  name: 'Medicine Ball Straight-Arm Reach',
  activityType: ActivityType.RESISTANCE,
  prescription: { sets, reps, notes },
  notes,
  category: 'isolation',
  type: 'strength',
  defaultUnit: 'kg',
  equipment: ['medicine ball'],
});

const week1Exercises = (): Draft[] => [
  sling(
    'ssl-superman',
    'Sling Superman',
    3,
    8,
    'Suspension trainer. Angled stance with a short forward lean. Both arms only. One-arm work starts in week 2.'
  ),
  sling(
    'ssl-er',
    'Sling External Rotation',
    3,
    6,
    'Angled stance, lean backward. Elbow and shoulder at 90°. No side shift yet. Add a light weight shift in week 2.'
  ),
  sling(
    'ssl-ir',
    'Sling Internal Rotation',
    3,
    6,
    'Angled stance, lean forward, feet together. Elbow and shoulder at 90°. Slow return. Split stance in week 2, light explosive return in week 3.'
  ),
  medBall(
    'ssl-medball',
    3,
    5,
    'Lie on your back with a light medicine ball. Straight arm, overhead only. The reach out to the side starts in week 2.'
  ),
];

const week2Exercises = (): Draft[] => [
  sling(
    'ssl-superman',
    'Sling Superman',
    3,
    10,
    'Suspension trainer. Angled stance, lean forward. Each set: both arms, then one arm.'
  ),
  sling(
    'ssl-superman-arm',
    'Sling Superman, Arm Down',
    3,
    { min: 6, max: 8 },
    'Same angled stance and forward lean as Sling Superman. Reach one arm out and down along the side.'
  ),
  sling(
    'ssl-er',
    'Sling External Rotation',
    3,
    { min: 6, max: 8 },
    'Angled stance, lean backward. Elbow and shoulder at 90°. On the return, shift a little weight toward one side.'
  ),
  sling(
    'ssl-ir',
    'Sling Internal Rotation',
    3,
    { min: 6, max: 8 },
    'Angled stance, lean forward, split stance. Elbow and shoulder at 90°. Controlled return. The light explosive return is week 3.'
  ),
  medBall(
    'ssl-medball',
    3,
    5,
    'Lie on your back with a light medicine ball. Straight arm: reach overhead, then out to the side. Reps are for each direction.'
  ),
];

const week3Exercises = (): Draft[] => [
  sling(
    'ssl-superman',
    'Sling Superman',
    { min: 3, max: 4 },
    10,
    'Suspension trainer. Angled stance, lean forward. Each set: both arms, then one arm.'
  ),
  sling(
    'ssl-superman-arm',
    'Sling Superman, Arm Down',
    { min: 3, max: 4 },
    { min: 6, max: 10 },
    'Same angled stance and forward lean as Sling Superman. Reach one arm out and down along the side.'
  ),
  sling(
    'ssl-er',
    'Sling External Rotation',
    { min: 3, max: 4 },
    { min: 6, max: 10 },
    'Angled stance, lean backward. Elbow and shoulder at 90°. On the return, shift a little weight toward one side.'
  ),
  sling(
    'ssl-ir',
    'Sling Internal Rotation',
    { min: 3, max: 4 },
    { min: 6, max: 10 },
    'Angled stance, lean forward, split stance. Elbow and shoulder at 90°. Light explosive return.'
  ),
  medBall(
    'ssl-medball',
    { min: 3, max: 4 },
    { min: 5, max: 6 },
    'Lie on your back with a light medicine ball. Straight arm: reach overhead, then out to the side. Reps are for each direction.'
  ),
];

const WEEKS: Array<{
  id: string;
  phase: string;
  notes: string;
  exercises: () => Draft[];
}> = [
  {
    id: 'session-sling-week-1',
    phase: 'Learn the positions',
    notes: 'Sling program, week 1 of 3. Short lean, both arms, slow returns. 3 sessions this week.',
    exercises: week1Exercises,
  },
  {
    id: 'session-sling-week-2',
    phase: 'Add one arm',
    notes: 'Sling program, week 2 of 3. Add the one-arm superman, the arm-down reach, and a light side shift. 3 sessions this week.',
    exercises: week2Exercises,
  },
  {
    id: 'session-sling-week-3',
    phase: 'Physio prescription',
    notes: 'Sling program, week 3 of 3. Full physio dose: one-arm work, weight shift, light explosive return, and medicine-ball reaches in both directions. 3 sessions this week.',
    exercises: week3Exercises,
  },
];

export const buildShoulderSlingSessions = (
  userId: string,
  options: { orderOffset?: number; weekOffset?: number; namePrefix?: string } = {}
): ProgramSession[] => {
  const orderOffset = options.orderOffset ?? 0;
  const weekOffset = options.weekOffset ?? 0;
  const namePrefix = options.namePrefix ?? '';

  return WEEKS.map((week, index) => {
    const exercises = week.exercises().map((draft, exerciseIndex) => toProgramExercise(draft, exerciseIndex));
    const progressionWeek = index + 1;
    return {
      id: week.id,
      name: `${namePrefix}Week ${progressionWeek} · ${week.phase}`,
      userId,
      order: orderOffset + index,
      notes: week.notes,
      exercises,
      supersets: [],
      exerciseOrder: exercises.map((exercise) => exercise.id),
      sessionKind: 'strength' as const,
      week: weekOffset + progressionWeek,
      sessionsPerWeek: 3,
    };
  });
};

export const isShoulderSlingRehabProgram = (program: Pick<Program, 'name' | 'tags'>): boolean =>
  program.name === SHOULDER_SLING_PROGRAM_NAME ||
  Boolean(program.tags?.includes(SHOULDER_SLING_PROGRAM_TAG));

export const isCurrentShoulderSlingRehabRevision = (
  program: Pick<Program, 'name' | 'tags'>
): boolean =>
  isShoulderSlingRehabProgram(program) &&
  Boolean(program.tags?.includes(SHOULDER_SLING_PROGRAM_REVISION_TAG));

export const buildShoulderSlingProgram = (
  userId: string
): Omit<Program, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: SHOULDER_SLING_PROGRAM_NAME,
  description: SHOULDER_SLING_PROGRAM_DESCRIPTION,
  createdBy: userId,
  userId,
  sessions: buildShoulderSlingSessions(userId),
  isPublic: false,
  rules: [...SHOULDER_SLING_PROGRAM_RULES],
  stopSigns: SHOULDER_SLING_PROGRAM_STOP_SIGNS,
  tags: ['rehab', 'shoulder', 'sling', SHOULDER_SLING_PROGRAM_TAG, SHOULDER_SLING_PROGRAM_REVISION_TAG],
});
