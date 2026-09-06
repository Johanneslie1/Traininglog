import { describe, expect, it } from '@jest/globals';
import { ActivityType } from '@/types/activityTypes';
import { Prescription } from '@/types/program';
import {
  HELES_TRAINING_PROGRAM_DESCRIPTION,
  HELES_TRAINING_PROGRAM_NAME,
  HELES_TRAINING_PROGRAM_REVISION_TAG,
  buildHelesTrainingProgram,
  isCurrentHelesTrainingProgramRevision,
  isHelesTrainingProgram,
} from '@/data/programs/helesTrainingProgram';

const USER_ID = 'test-user';

const hasEightWeekTable = (text: string | undefined): boolean => {
  if (!text) return false;
  return (
    /Week 1/.test(text) &&
    /Week 2/.test(text) &&
    /Week 3/.test(text) &&
    /Week 4/.test(text) &&
    /Week 5/.test(text) &&
    /Week 6/.test(text) &&
    /Week 7/.test(text) &&
    /Week 8/.test(text)
  );
};

const usesPercentageLoad = (prescription: Prescription | undefined): boolean =>
  prescription?.weight?.type === 'percentage';

describe("Hele's Training Program", () => {
  const program = buildHelesTrainingProgram(USER_ID);

  it('creates an English 8-week program with four sessions', () => {
    expect(program.name).toBe(HELES_TRAINING_PROGRAM_NAME);
    expect(program.userId).toBe(USER_ID);
    expect(program.sessions.map((session) => session.name)).toEqual([
      'Lower 1',
      'Lower 2',
      'Upper 1',
      'Upper 2',
    ]);
    expect(program.description).toBe(HELES_TRAINING_PROGRAM_DESCRIPTION);
    expect(program.description).toMatch(/Eight-week/i);
    expect(program.tags).toContain(HELES_TRAINING_PROGRAM_REVISION_TAG);
    expect(isHelesTrainingProgram(program)).toBe(true);
    expect(isCurrentHelesTrainingProgramRevision(program)).toBe(true);
  });

  it('uses week 1 as the structured RPE prescription and stores weeks 1–8 in notes', () => {
    const exercises = program.sessions.flatMap((session) => session.exercises);
    expect(exercises).toHaveLength(24);

    for (const exercise of exercises) {
      expect(exercise.activityType).toBe(ActivityType.RESISTANCE);
      expect(exercise.instructionMode).toBe('structured');
      expect(exercise.prescription?.sets).toBeDefined();
      expect(exercise.prescription?.rpe).toBe(7);
      expect(exercise.prescription?.weight).toEqual({ type: 'rpe', value: 7 });
      expect(usesPercentageLoad(exercise.prescription)).toBe(false);
      expect(hasEightWeekTable(exercise.notes)).toBe(true);
      expect(exercise.instructions).toBe(exercise.notes);
    }
  });

  it('maps movements to existing library exercises', () => {
    expect(program.sessions[0].exercises.map((exercise) => exercise.name)).toEqual([
      'Dumbbell single-leg hip thrust',
      'Leg Press',
      'Leg Curl',
      'Dumbbell step-up',
      'Cable Hip Adduction',
      'Standing Calf Raise',
    ]);
    expect(program.sessions[1].exercises.map((exercise) => exercise.name)).toEqual([
      'Bulgarian Split Squat',
      'Hip Thrust',
      'Romanian Deadlift',
      'Leg Extension',
      'Glute Kickback',
      'Thigh abductor',
    ]);
    expect(program.sessions[2].exercises.map((exercise) => exercise.name)).toEqual([
      'Push-Ups',
      'Lat Pulldown',
      'Overhead Press',
      'Seated Row',
      'Tricep Extensions',
      'Incline dumbbell reverse fly',
    ]);
    expect(program.sessions[3].exercises.map((exercise) => exercise.name)).toEqual([
      'Incline Dumbbell Press',
      'Machine-assisted pull-up',
      'Parallel Bar Dips',
      'Barbell Row',
      'Barbell upright row',
      'Bicep Curls',
    ]);
  });

  it('keeps accessory and dip volume at 2 sets in week 1', () => {
    const hipAdduction = program.sessions[0].exercises.find((exercise) => exercise.name === 'Cable Hip Adduction');
    expect(hipAdduction?.prescription?.sets).toBe(2);
    expect(hipAdduction?.prescription?.reps).toEqual({ min: 10, max: 12 });

    const dips = program.sessions[3].exercises.find((exercise) => exercise.name === 'Parallel Bar Dips');
    expect(dips?.prescription?.sets).toBe(2);
    expect(dips?.notes).toMatch(/Week 3: 2 × 6–8 @ RPE 8/);
    expect(dips?.notes).toMatch(/assisted dips/i);
  });
});
