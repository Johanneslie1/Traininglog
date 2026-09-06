import { describe, expect, it } from '@jest/globals';
import { ActivityType } from '@/types/activityTypes';
import { Prescription } from '@/types/program';
import {
  SPEED_STRENGTH_BLOCK_1_DESCRIPTION,
  SPEED_STRENGTH_BLOCK_1_NAME,
  SPEED_STRENGTH_BLOCK_1_REVISION_TAG,
  buildSpeedStrengthBlock1Program,
  isCurrentSpeedStrengthBlock1Revision,
  isSpeedStrengthBlock1Program,
} from '@/data/programs/speedStrengthBlock1';

const USER_ID = 'test-user';

const hasWeekTable = (text: string | undefined): boolean => {
  if (!text) return false;
  return /Uke 1/.test(text) && /Uke 2/.test(text) && /Uke 3/.test(text) && /Uke 4/.test(text);
};

const usesPercentageLoad = (prescription: Prescription | undefined): boolean =>
  prescription?.weight?.type === 'percentage';

describe('Speed + Strength Blokk 1', () => {
  const program = buildSpeedStrengthBlock1Program(USER_ID);

  it('creates one program with Bein 1 / Overkropp 1 / Bein 2 / Overkropp 2', () => {
    expect(program.name).toBe(SPEED_STRENGTH_BLOCK_1_NAME);
    expect(program.userId).toBe(USER_ID);
    expect(program.sessions.map((session) => session.name)).toEqual([
      'Bein 1 — Speed + Heavy Lower',
      'Overkropp 1 — Upper Strength',
      'Bein 2 — Speed + Power',
      'Overkropp 2 — Upper + Core',
    ]);
    expect(SPEED_STRENGTH_BLOCK_1_DESCRIPTION).toMatch(/RPE styrer/i);
    expect(SPEED_STRENGTH_BLOCK_1_DESCRIPTION).toMatch(/uke 4 er deload/i);
    expect(program.description).toBe(SPEED_STRENGTH_BLOCK_1_DESCRIPTION);
    expect(program.tags).toContain(SPEED_STRENGTH_BLOCK_1_REVISION_TAG);
    expect(isSpeedStrengthBlock1Program(program)).toBe(true);
    expect(isCurrentSpeedStrengthBlock1Revision(program)).toBe(true);
  });

  it('uses structured week 1 prescriptions and a 4-week table on every exercise', () => {
    const exercises = program.sessions.flatMap((session) => session.exercises);
    expect(exercises).toHaveLength(31);

    for (const exercise of exercises) {
      expect(exercise.instructionMode).toBe('structured');
      expect(exercise.prescription?.sets).toBeDefined();
      expect(usesPercentageLoad(exercise.prescription)).toBe(false);
      expect(hasWeekTable(exercise.notes)).toBe(true);
      expect(exercise.instructions).toBe(exercise.notes);
    }
  });

  it('codes week 1 strength as target RPE, not 1RM percentage', () => {
    const frontSquat = program.sessions[0].exercises.find((exercise) => exercise.name === 'Front Squat (Clean Grip)');
    expect(frontSquat?.prescription).toEqual(
      expect.objectContaining({
        sets: 3,
        reps: 5,
        rpe: 7,
        weight: { type: 'rpe', value: 7 },
      })
    );

    const clean = program.sessions[0].exercises.find((exercise) => exercise.name === 'Hang Clean');
    expect(clean?.prescription?.weight).toEqual({ type: 'rpe', value: { min: 6, max: 7 } });
    expect(clean?.prescription?.sets).toBe(4);
    expect(clean?.prescription?.reps).toBe(2);

    const calf = program.sessions[0].exercises.find((exercise) => exercise.name === 'Standing Calf Raise');
    expect(calf?.prescription).toEqual(
      expect.objectContaining({
        sets: 3,
        reps: { min: 8, max: 10 },
        rpe: 7,
      })
    );
  });

  it('logs sprint as speed/agility with one set per run, not endurance', () => {
    const acceleration = program.sessions[0].exercises[0];
    expect(acceleration.name).toBe('Sprint');
    expect(acceleration.activityType).toBe(ActivityType.SPEED_AGILITY);
    expect(acceleration.notes).toMatch(/Acceleration sprint/);
    expect(acceleration.prescription).toEqual(
      expect.objectContaining({
        sets: 4,
        distance: { min: 10, max: 15 },
        rest: 150,
        intensity: 10,
      })
    );
    expect(acceleration.prescription?.reps).toBeUndefined();

    const maxVelocity = program.sessions[0].exercises[1];
    expect(maxVelocity.name).toBe('Flying 20s');
    expect(maxVelocity.activityType).toBe(ActivityType.SPEED_AGILITY);
    expect(maxVelocity.notes).toMatch(/Max velocity sprint/);
    expect(maxVelocity.prescription?.sets).toBe(3);
    expect(maxVelocity.prescription?.distance).toEqual({ min: 20, max: 30 });
  });

  it('keeps unilateral work as prescribed sets with per-side notes', () => {
    const throwExercise = program.sessions[2].exercises.find(
      (exercise) => exercise.name === 'Medicine ball rotational throw'
    );
    expect(throwExercise?.prescription?.sets).toBe(3);
    expect(throwExercise?.prescription?.reps).toBe(4);
    expect(throwExercise?.notes).toMatch(/4\/side/);
    expect(throwExercise?.notes).not.toMatch(/Uke 1: 6 ×/);

    const pallof = program.sessions[3].exercises.find((exercise) => exercise.name === 'Pallof Press');
    expect(pallof?.prescription?.sets).toBe(2);
    expect(pallof?.notes).toMatch(/8–12\/side/);
  });

  it('uses the updated week 4 and accessory prescriptions', () => {
    const bein1 = program.sessions[0];
    expect(bein1.exercises.map((exercise) => exercise.name)).toEqual([
      'Sprint',
      'Flying 20s',
      'Hang Clean',
      'Front Squat (Clean Grip)',
      'Romanian Deadlift',
      'Hip Thrust',
      'Standing Calf Raise',
      'Tibialis Raise',
      'Hanging Leg Raise',
    ]);
    expect(bein1.exercises[0].notes).toMatch(/Uke 4: 3 × 10–15 m/);

    const overkropp2 = program.sessions[3];
    expect(overkropp2.exercises.map((exercise) => exercise.name)).toEqual([
      'Incline Dumbbell Press',
      'Lat Pulldown',
      'Parallel Bar Dips',
      'Barbell Row',
      'Barbell upright row',
      'Bicep Curls',
      'Pallof Press',
    ]);

    const powerClean = program.sessions[2].exercises.find((exercise) => exercise.name === 'Power clean');
    expect(powerClean?.prescription).toEqual(
      expect.objectContaining({
        sets: 3,
        reps: 3,
        rpe: 6,
      })
    );

    const cmj = program.sessions[2].exercises.find((exercise) => exercise.name === 'Vertical Jump');
    expect(cmj?.activityType).toBe(ActivityType.SPEED_AGILITY);
    expect(cmj?.notes).toMatch(/Countermovement jump/);
    expect(cmj?.prescription?.sets).toBe(3);
    expect(cmj?.prescription?.reps).toBe(3);
  });
});
