import { describe, expect, it } from '@jest/globals';
import { groupExercisesInListOrder } from '@/utils/exerciseDisplayGroups';
import { SupersetGroup } from '@/types/session';

describe('groupExercisesInListOrder', () => {
  it('keeps a superset where its first exercise sits in the list', () => {
    const exercises = [
      { id: 'squat', name: 'Squat' },
      { id: 'bench', name: 'Bench' },
      { id: 'row', name: 'Row' },
      { id: 'deadlift', name: 'Deadlift' },
    ];
    const supersets: SupersetGroup[] = [
      { id: 'pair', exerciseIds: ['bench', 'row'], order: 0 },
    ];

    const groups = groupExercisesInListOrder(exercises, supersets);

    expect(groups.map((group) => group.exercises.map((exercise) => exercise.id))).toEqual([
      ['squat'],
      ['bench', 'row'],
      ['deadlift'],
    ]);
    expect(groups[1].superset?.id).toBe('pair');
  });
});