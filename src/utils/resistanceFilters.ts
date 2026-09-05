import { inferMovementPatterns, type MovementPattern } from '@/data/movementPatterns';
import { ResistanceExercise } from '@/types/activityTypes';

type ResistanceWithPattern = ResistanceExercise & {
  tags: string[];
  _primaryMovementPattern?: MovementPattern | '';
  _secondaryMovementPattern?: MovementPattern | '';
};

const resolvePatterns = (exercise: ResistanceExercise) =>
  inferMovementPatterns({
    name: exercise.name,
    catalogId: exercise.id,
    activityType: exercise.activityType,
    category: exercise.category,
    type: (exercise as ResistanceExercise & { type?: string }).type,
    laterality: (exercise as ResistanceExercise & { laterality?: string }).laterality,
    primaryMovementPattern: (exercise as ResistanceExercise & { primaryMovementPattern?: string }).primaryMovementPattern,
    secondaryMovementPattern: (exercise as ResistanceExercise & { secondaryMovementPattern?: string }).secondaryMovementPattern,
  });

export function enrich(list: ResistanceExercise[]): ResistanceWithPattern[] {
  return list.map((e) => {
    const patterns = resolvePatterns(e);
    return {
      ...e,
      _primaryMovementPattern: patterns.primary,
      _secondaryMovementPattern: patterns.secondary,
      tags: [
        ...(e.primaryMuscles || []),
        ...(e.secondaryMuscles || []),
        ...(e.equipment || []),
        ...(e.tips || []),
        e.category,
        e.defaultUnit,
        'resistance',
        patterns.primary,
        patterns.secondary,
      ].filter(Boolean),
    };
  });
}

export function collectFacets(list: ResistanceExercise[]) {
  const facets = {
    type: new Set<string>(),
    equipment: new Set<string>(),
    category: new Set<string>(),
    tags: new Set<string>(),
    movementPattern: new Set<string>(),
  };
  list.forEach((e) => {
    facets.type.add('resistance');
    (e.equipment || []).forEach((eq) => facets.equipment.add(eq));
    facets.category.add(e.category);
    (e.primaryMuscles || []).forEach((m) => facets.tags.add(m));
    (e.secondaryMuscles || []).forEach((m) => facets.tags.add(m));
    (e.tips || []).forEach((t) => facets.tags.add(t));
    facets.tags.add(e.defaultUnit);
    const patterns = resolvePatterns(e);
    if (patterns.primary) {
      facets.movementPattern.add(patterns.primary);
    }
    if (patterns.secondary) {
      facets.movementPattern.add(patterns.secondary);
    }
  });
  return facets;
}

export function applyFilters(
  list: ResistanceWithPattern[],
  f: {
    search?: string;
    equipment?: Set<string>;
    category?: Set<string>;
    includeTags?: Set<string>;
    excludeTags?: Set<string>;
    movementPattern?: Set<string>;
  }
): ResistanceWithPattern[] {
  return list.filter((e) => {
    if (f.search) {
      const q = f.search.toLowerCase();
      if (!(e.name.toLowerCase().includes(q) || (e.instructions || []).join(' ').toLowerCase().includes(q))) {
        return false;
      }
    }
    if (f.equipment && f.equipment.size && !e.equipment.some((eq) => f.equipment?.has(eq))) {
      return false;
    }
    if (f.category && f.category.size && !f.category.has(e.category)) {
      return false;
    }
    if (f.includeTags && f.includeTags.size && !(e.tags as string[]).some((t: string) => f.includeTags?.has(t))) {
      return false;
    }
    if (f.excludeTags && (e.tags as string[]).some((t: string) => f.excludeTags?.has(t))) {
      return false;
    }
    if (f.movementPattern && f.movementPattern.size) {
      const matchesPattern =
        (e._primaryMovementPattern && f.movementPattern.has(e._primaryMovementPattern)) ||
        (e._secondaryMovementPattern && f.movementPattern.has(e._secondaryMovementPattern));
      if (!matchesPattern) {
        return false;
      }
    }
    return true;
  });
}
