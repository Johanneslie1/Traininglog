// Aggregate all local exercise JSON sources into one unified array for program building/search.
import resistance from '@/data/exercises/resistance.json';
import speedAgility from '@/data/exercises/speedAgility.json';
import flexibility from '@/data/exercises/flexibility.json';
import endurance from '@/data/exercises/endurance.json';
import sports from '@/data/exercises/sports.json';
import other from '@/data/exercises/other.json';

export interface UnifiedLocalExercise {
  id: string;
  name: string;
  description?: string;
  activityType: string; // lowercased category key (resistance, endurance, etc.)
  category?: string;
  type?: string;
  equipment?: string[];
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  targetMuscles?: string[];
  bodyRegion?: string[];
  drillType?: string;
  sportType?: string;
  tags?: string[];
  // Raw original object for advanced needs
  _raw?: any;
}

function tagify(...parts: (string | string[] | undefined | null)[]): string[] {
  const tags: string[] = [];
  parts.forEach(p => {
    if (Array.isArray(p)) p.forEach(v => v && tags.push(v));
    else if (p) tags.push(p);
  });
  return Array.from(new Set(tags.filter(Boolean)));
}

export function getAllExercisesLocal(): UnifiedLocalExercise[] {
  const build = (arr: any[], activityType: string): UnifiedLocalExercise[] =>
    (arr || []).map((e: any, idx: number) => ({
      id: e.id || `${activityType}-${idx}`,
      name: e.name,
      description: e.description,
      activityType,
      category: e.category,
      type: e.type || e.stretchType || e.enduranceType || e.drillType || e.sportType,
      equipment: e.equipment || [],
      primaryMuscles: e.primaryMuscles || e.targetMuscles || [],
      secondaryMuscles: e.secondaryMuscles || e.bodyRegion || [],
      targetMuscles: e.targetMuscles,
      bodyRegion: e.bodyRegion,
      drillType: e.drillType,
      sportType: e.sportType,
      tags: tagify(
        e.category,
        e.type,
        e.stretchType,
        e.enduranceType,
        e.drillType,
        e.sportType,
        e.activityType,
        e.primaryMuscles,
        e.secondaryMuscles,
        e.targetMuscles,
        e.bodyRegion,
        e.equipment
      ),
      _raw: e
    }));

  return [
    ...build(resistance as any[], 'resistance'),
    ...build(endurance as any[], 'endurance'),
    ...build(speedAgility as any[], 'speedAgility'),
    ...build(flexibility as any[], 'stretching'),
    ...build(sports as any[], 'sport'),
    ...build(other as any[], 'other')
  ];
}
