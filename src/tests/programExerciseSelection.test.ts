import { describe, expect, it } from '@jest/globals';
import { ActivityType } from '@/types/activityTypes';
import { Program, ProgramExercise } from '@/types/program';
import {
  buildSelectAllKeysForSession,
  resolveProgramExerciseSelections,
} from '@/utils/programExerciseSelection';

const makeExercise = (
  id: string,
  name: string,
  overrides: Partial<ProgramExercise> = {}
): ProgramExercise => ({
  id,
  name,
  activityType: ActivityType.RESISTANCE,
  instructionMode: 'structured',
  prescription: {
    sets: 3,
    reps: 5,
  },
  ...overrides,
});

describe('resolveProgramExerciseSelections', () => {
  it('resolves Select All by session index so duplicate library ids stay distinct', () => {
    const squatA = makeExercise('lib-squat', 'Squat', {
      prescription: { sets: 3, reps: 5 },
    });
    const squatB = makeExercise('lib-squat', 'Squat', {
      prescription: { sets: 4, reps: 8 },
    });
    const bench = makeExercise('lib-bench', 'Bench Press', {
      prescription: { sets: 3, reps: 10 },
    });

    const program: Pick<Program, 'id' | 'name' | 'sessions'> = {
      id: 'program-1',
      name: 'Strength A',
      sessions: [
        {
          id: 'session-1',
          name: 'Day 1',
          exercises: [squatA, squatB, bench],
        },
      ],
    };

    const selected = buildSelectAllKeysForSession('session-1', program.sessions![0].exercises);
    expect(selected).toEqual([
      { sessionId: 'session-1', exerciseIndex: 0 },
      { sessionId: 'session-1', exerciseIndex: 1 },
      { sessionId: 'session-1', exerciseIndex: 2 },
    ]);

    const resolved = resolveProgramExerciseSelections(program, selected);

    expect(resolved).toHaveLength(3);
    expect(resolved.map((item) => item.exercise.name)).toEqual([
      'Squat',
      'Squat',
      'Bench Press',
    ]);
    expect(resolved[0].exercise.prescription).toEqual({ sets: 3, reps: 5 });
    expect(resolved[1].exercise.prescription).toEqual({ sets: 4, reps: 8 });
    expect(resolved[0].sourceProgramExerciseId).toBe('lib-squat');
    expect(resolved[1].sourceProgramExerciseId).toBe('lib-squat');
    expect(resolved[2].sourceProgramExerciseId).toBe('lib-bench');
  });

  it('skips out-of-range indexes without collapsing other selections', () => {
    const program: Pick<Program, 'id' | 'name' | 'sessions'> = {
      id: 'program-2',
      name: 'Short',
      sessions: [
        {
          id: 'session-a',
          name: 'Only one',
          exercises: [makeExercise('ex-1', 'Row')],
        },
      ],
    };

    const resolved = resolveProgramExerciseSelections(program, [
      { sessionId: 'session-a', exerciseIndex: 0 },
      { sessionId: 'session-a', exerciseIndex: 99 },
      { sessionId: 'missing-session', exerciseIndex: 0 },
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].exercise.name).toBe('Row');
  });
});
