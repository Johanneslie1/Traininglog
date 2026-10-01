import { describe, expect, it } from '@jest/globals';
import { ActivityType } from '@/types/activityTypes';
import {
  SHOULDER_REHAB_3_WEEK_DESCRIPTION,
  SHOULDER_REHAB_3_WEEK_NAME,
  SHOULDER_REHAB_3_WEEK_REVISION_TAG,
  SHOULDER_REHAB_3_WEEK_RULES,
  SHOULDER_REHAB_3_WEEK_STOP_SIGNS,
  buildShoulderRehab3WeekProgram,
  isCurrentShoulderRehabRevision,
  isShoulderRehabProgram,
} from '@/data/programs/shoulderRehab3Week';

const USER_ID = 'test-user';

describe('Shoulder Rehab – 3 Weeks', () => {
  const program = buildShoulderRehab3WeekProgram(USER_ID);

  it('builds a criteria-based program with daily activation and three weeks', () => {
    expect(program.name).toBe(SHOULDER_REHAB_3_WEEK_NAME);
    expect(program.description).toBe(SHOULDER_REHAB_3_WEEK_DESCRIPTION);
    expect(program.rules).toEqual(SHOULDER_REHAB_3_WEEK_RULES);
    expect(program.stopSigns).toBe(SHOULDER_REHAB_3_WEEK_STOP_SIGNS);
    expect(program.userId).toBe(USER_ID);
    expect(program.tags).toContain(SHOULDER_REHAB_3_WEEK_REVISION_TAG);
    expect(isShoulderRehabProgram(program)).toBe(true);
    expect(isCurrentShoulderRehabRevision(program)).toBe(true);
    expect(program.sessions.map((session) => session.name)).toEqual([
      'Daily shoulder activation',
      'Week 1 · Calm and activate',
      'Week 2 · Build strength',
      'Week 3 · Power',
    ]);
  });

  it('prescribes daily activation and the listed strength work', () => {
    const [daily, week1, week2, week3] = program.sessions;

    expect(daily.sessionKind).toBe('daily-activation');
    expect(daily.week).toBeUndefined();
    expect(daily.exercises.map((exercise) => exercise.name)).toEqual([
      'Pendulum',
      'Isometric external rotation',
      'Isometric internal rotation',
      'Isometric forward press',
      'Isometric outward press',
      'Isometric backward press',
    ]);
    expect(daily.exercises.every((exercise) => exercise.activityType === ActivityType.RESISTANCE)).toBe(true);
    expect(daily.exercises[1].prescription).toMatchObject({ sets: { min: 5, max: 8 } });
    expect(daily.notes).toMatch(/70-80%/);

    expect(week1.week).toBe(1);
    expect(week1.sessionsPerWeek).toBe(4);
    expect(week1.exercises).toHaveLength(11);
    expect(week1.checkpoint).toBeUndefined();
    expect(week1.exercises.map((exercise) => exercise.name)).toEqual([
      'External Rotation with Band',
      'Internal Rotation with Band',
      'Side-lying external rotation',
      'Seated Row',
      'Push-Ups',
      'Wall slides',
      'Bicep Curls',
      'Triceps Pushdown',
      'Dead Bug',
      'Pallof Press',
      'Side plank',
    ]);
    expect(week1.exercises[5].name).toBe('Wall slides');
    expect(week1.exercises[5].activityType).toBe(ActivityType.STRETCHING);
    expect(week1.exercises[8].notes).toMatch(/10\/side/);
    expect(week1.exercises[10].id).toBe('389');
    expect(week1.exercises[10].activityType).toBe(ActivityType.RESISTANCE);

    expect(week2.week).toBe(2);
    expect(week2.sessionsPerWeek).toBe(4);
    expect(week2.exercises).toHaveLength(11);
    expect(week2.exercises[4].prescription?.reps).toEqual({ min: 10, max: 15 });
    expect(week2.exercises[0].exerciseSnapshot?.id).toBe('2432');
    expect(week2.exercises[2].exerciseSnapshot?.id).toBe('2432');
    const carry = week2.exercises[10];
    expect(carry.name).toBe('Farmer Carry');
    expect(carry.activityType).toBe(ActivityType.RESISTANCE);
    expect(carry.prescription?.distance).toBe(30);

    expect(week3.week).toBe(3);
    expect(week3.sessionsPerWeek).toBe(3);
    expect(week3.exercises).toHaveLength(7);
    expect(week3.checkpoint).toBeUndefined();
    expect(week3.exercises.every((exercise) => exercise.instructionMode === 'structured')).toBe(true);
  });
});
