import { describe, expect, it } from '@jest/globals';
import { ActivityType, type ResistanceExercise } from '@/types/activityTypes';
import { applyFilters, collectFacets, enrich } from '@/utils/resistanceFilters';

const squat: ResistanceExercise = {
  id: 'squat-1',
  name: 'Back Squat',
  description: 'Knee dominant',
  activityType: ActivityType.RESISTANCE,
  category: 'compound',
  primaryMuscles: ['quadriceps'],
  secondaryMuscles: ['glutes'],
  equipment: ['barbell'],
  instructions: [],
  defaultUnit: 'kg',
  isDefault: true,
  metrics: { trackWeight: true, trackReps: true, trackRPE: true },
};

const row: ResistanceExercise = {
  ...squat,
  id: 'row-1',
  name: 'Barbell Row',
  primaryMuscles: ['back'],
};

describe('resistanceFilters movement patterns', () => {
  it('exposes inferred movement patterns as facets and filter keys', () => {
    const enriched = enrich([squat, row]);
    const facets = collectFacets([squat, row]);

    expect(facets.movementPattern.has('squat')).toBe(true);
    expect(facets.movementPattern.has('horizontal_pull')).toBe(true);
    expect(applyFilters(enriched, { movementPattern: new Set(['squat']) }).map((exercise) => exercise.id)).toEqual([
      'squat-1',
    ]);
  });
});
