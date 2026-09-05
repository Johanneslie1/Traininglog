import { describe, expect, it } from '@jest/globals';
import { ActivityType } from '@/types/activityTypes';
import type { Exercise } from '@/types/exercise';
import {
  mapCatalogExerciseToDimRow,
  mapLoggedExerciseToDimRow,
  mergeDimExerciseRows,
  toExerciseId,
} from '@/utils/powerBiExerciseDim';

const bench: Exercise = {
  id: 'bench-press-1',
  name: 'Bench Press',
  description: 'A compound chest exercise performed on a flat bench.',
  category: 'compound',
  type: 'strength',
  activityType: ActivityType.RESISTANCE,
  difficulty: 'intermediate',
  equipment: ['barbell', 'bench'],
  instructions: [],
  primaryMuscles: ['chest'],
  secondaryMuscles: ['shoulders', 'triceps'],
};

describe('powerBiExerciseDim', () => {
  it('maps catalog attributes and inferred patterns', () => {
    const row = mapCatalogExerciseToDimRow(bench);

    expect(row.exercise_id).toBe(toExerciseId('Bench Press', ActivityType.RESISTANCE));
    expect(row.catalog_id).toBe('bench-press-1');
    expect(row.in_catalog).toBe(true);
    expect(row.is_custom).toBe(false);
    expect(row.primary_muscles).toBe('chest');
    expect(row.secondary_muscles).toBe('shoulders|triceps');
    expect(row.equipment).toBe('barbell|bench');
    expect(row.primary_movement_pattern).toBe('horizontal_push');
    expect(row.laterality).toBe('bilateral');
  });

  it('keeps unmatched logged names out of catalog with inferred fields only', () => {
    const row = mapLoggedExerciseToDimRow({
      name: 'Mystery Curl',
      activityType: 'resistance',
      exerciseType: 'strength',
    });

    expect(row.in_catalog).toBe(false);
    expect(row.catalog_id).toBe('');
    expect(row.primary_muscles).toBe('');
    expect(row.exercise_factor_category).toBe('isolation_accessory');
    expect(row.primary_movement_pattern).toBe('');
  });

  it('prefers catalog rows over logged duplicates', () => {
    const catalog = mapCatalogExerciseToDimRow(bench);
    const logged = mapLoggedExerciseToDimRow({
      name: 'Bench Press',
      activityType: 'resistance',
      exerciseType: 'strength',
    });

    const merged = mergeDimExerciseRows([catalog], [logged]);
    expect(merged).toHaveLength(1);
    expect(merged[0].in_catalog).toBe(true);
    expect(merged[0].catalog_id).toBe('bench-press-1');
  });
});
