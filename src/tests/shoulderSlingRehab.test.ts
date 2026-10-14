import { describe, expect, it } from '@jest/globals';
import { ActivityType } from '@/types/activityTypes';
import {
  SHOULDER_SLING_PROGRAM_DESCRIPTION,
  SHOULDER_SLING_PROGRAM_NAME,
  SHOULDER_SLING_PROGRAM_REVISION_TAG,
  SHOULDER_SLING_PROGRAM_RULES,
  SHOULDER_SLING_PROGRAM_STOP_SIGNS,
  buildShoulderSlingProgram,
  isCurrentShoulderSlingRehabRevision,
  isShoulderSlingRehabProgram,
} from '@/data/programs/shoulderSlingRehab';

const USER_ID = 'test-user';

describe('Shoulder Sling Rehab', () => {
  const program = buildShoulderSlingProgram(USER_ID);

  it('builds a three-week physio program', () => {
    expect(program.name).toBe(SHOULDER_SLING_PROGRAM_NAME);
    expect(program.description).toBe(SHOULDER_SLING_PROGRAM_DESCRIPTION);
    expect(program.rules).toEqual(SHOULDER_SLING_PROGRAM_RULES);
    expect(program.stopSigns).toBe(SHOULDER_SLING_PROGRAM_STOP_SIGNS);
    expect(program.userId).toBe(USER_ID);
    expect(program.tags).toContain(SHOULDER_SLING_PROGRAM_REVISION_TAG);
    expect(isShoulderSlingRehabProgram(program)).toBe(true);
    expect(isCurrentShoulderSlingRehabRevision(program)).toBe(true);
    expect(program.sessions.map((session) => session.name)).toEqual([
      'Week 1 · Learn the positions',
      'Week 2 · Add one arm',
      'Week 3 · Physio prescription',
    ]);
    expect(program.sessions.map((session) => session.week)).toEqual([1, 2, 3]);
    expect(program.sessions.every((session) => session.sessionsPerWeek === 3)).toBe(true);
  });

  it('starts easier and finishes on the physio prescription', () => {
    const [week1, week2, week3] = program.sessions;

    expect(week1.exercises.map((exercise) => exercise.name)).toEqual([
      'Sling Superman',
      'Sling External Rotation',
      'Sling Internal Rotation',
      'Medicine Ball Straight-Arm Reach',
    ]);
    expect(week1.exercises[0].prescription).toMatchObject({ sets: 3, reps: 8 });
    expect(week1.exercises[0].notes).toMatch(/Both arms only/);
    expect(week1.exercises[3].notes).toMatch(/overhead only/);

    expect(week2.exercises.map((exercise) => exercise.name)).toEqual([
      'Sling Superman',
      'Sling Superman, Arm Down',
      'Sling External Rotation',
      'Sling Internal Rotation',
      'Medicine Ball Straight-Arm Reach',
    ]);
    expect(week2.exercises[0].notes).toMatch(/both arms, then one arm/i);
    expect(week2.exercises[1].prescription?.reps).toEqual({ min: 6, max: 8 });
    expect(week2.exercises[2].notes).toMatch(/weight toward one side/);
    expect(week2.exercises[3].notes).toMatch(/Controlled return/);

    expect(week3.exercises.map((exercise) => exercise.name)).toEqual([
      'Sling Superman',
      'Sling Superman, Arm Down',
      'Sling External Rotation',
      'Sling Internal Rotation',
      'Medicine Ball Straight-Arm Reach',
    ]);
    expect(week3.exercises.every((exercise) => exercise.activityType === ActivityType.RESISTANCE)).toBe(true);
    expect(week3.exercises.every((exercise) => exercise.instructionMode === 'structured')).toBe(true);
    expect(week3.exercises[0].prescription).toMatchObject({ sets: { min: 3, max: 4 }, reps: 10 });
    expect(week3.exercises[1].prescription).toMatchObject({
      sets: { min: 3, max: 4 },
      reps: { min: 6, max: 10 },
    });
    expect(week3.exercises[1].notes).toMatch(/out and down along the side/);
    expect(week3.exercises[2].prescription?.reps).toEqual({ min: 6, max: 10 });
    expect(week3.exercises[2].notes).toMatch(/90°/);
    expect(week3.exercises[3].notes).toMatch(/explosive return/i);
    expect(week3.exercises[3].notes).toMatch(/split stance/i);
    expect(week3.exercises[4].prescription).toMatchObject({
      sets: { min: 3, max: 4 },
      reps: { min: 5, max: 6 },
    });
    expect(week3.exercises[4].notes).toMatch(/each direction/i);
    expect(week3.exercises[4].exerciseSnapshot?.equipment).toEqual(['medicine ball']);
    expect(week3.exercises.map((exercise) => exercise.exerciseSnapshot?.id)).toEqual([
      'ssl-superman',
      'ssl-superman-arm',
      'ssl-er',
      'ssl-ir',
      'ssl-medball',
    ]);
  });
});
