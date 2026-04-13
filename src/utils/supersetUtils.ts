import { SupersetGroup } from '@/types/session';

export interface SupersetLabelMetadata {
  label: string;
  supersetId: string;
  supersetName?: string;
  supersetIndex: number;
}

const toAlphabeticLabel = (index: number): string => {
  let current = index;
  let output = '';

  while (current >= 0) {
    output = String.fromCharCode(97 + (current % 26)) + output;
    current = Math.floor(current / 26) - 1;
  }

  return output;
};

const getExerciseOrderRank = (exerciseIds: string[], orderRankMap: Map<string, number>): number => {
  const ranked = exerciseIds
    .map((exerciseId) => orderRankMap.get(exerciseId))
    .filter((rank): rank is number => typeof rank === 'number');

  if (ranked.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(...ranked);
};

export const buildSupersetLabels = (
  supersets: SupersetGroup[] = [],
  exerciseOrder: string[] = []
): Record<string, SupersetLabelMetadata> => {
  if (!Array.isArray(supersets) || supersets.length === 0) {
    return {};
  }

  const orderRankMap = new Map<string, number>();
  exerciseOrder.forEach((exerciseId, index) => {
    if (!orderRankMap.has(exerciseId)) {
      orderRankMap.set(exerciseId, index);
    }
  });

  const sortableSupersets = supersets
    .filter((superset) => Array.isArray(superset.exerciseIds) && superset.exerciseIds.length > 0)
    .map((superset, originalIndex) => ({
      superset,
      originalIndex,
      orderRank: getExerciseOrderRank(superset.exerciseIds, orderRankMap),
    }))
    .sort((a, b) => {
      if (a.orderRank !== b.orderRank) {
        return a.orderRank - b.orderRank;
      }

      const aOrder = a.superset.order ?? Number.POSITIVE_INFINITY;
      const bOrder = b.superset.order ?? Number.POSITIVE_INFINITY;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      return a.originalIndex - b.originalIndex;
    });

  const metadataByExerciseId: Record<string, SupersetLabelMetadata> = {};

  sortableSupersets.forEach(({ superset }, supersetIndex) => {
    const numericIndex = supersetIndex + 1;

    superset.exerciseIds.forEach((exerciseId, exerciseIndex) => {
      if (!exerciseId || metadataByExerciseId[exerciseId]) {
        return;
      }

      metadataByExerciseId[exerciseId] = {
        label: `${numericIndex}${toAlphabeticLabel(exerciseIndex)}`,
        supersetId: superset.id,
        supersetName: superset.name,
        supersetIndex: numericIndex,
      };
    });
  });

  return metadataByExerciseId;
};

export const buildSupersetCompactCode = (
  superset: SupersetGroup,
  labelsByExerciseId: Record<string, SupersetLabelMetadata>
): string => {
  const labels = superset.exerciseIds
    .map((exerciseId) => labelsByExerciseId[exerciseId]?.label)
    .filter((label): label is string => Boolean(label));

  if (labels.length === 0) {
    return '';
  }

  const parsed = labels.map((label) => {
    const match = label.match(/^(\d+)([a-z]+)$/);
    if (!match) {
      return null;
    }

    return {
      numericPart: match[1],
      letterPart: match[2],
    };
  });

  if (parsed.some((value) => value === null)) {
    return labels.join('/');
  }

  const firstNumericPart = parsed[0]!.numericPart;
  const sameNumericPrefix = parsed.every((value) => value!.numericPart === firstNumericPart);

  if (!sameNumericPrefix) {
    return labels.join('/');
  }

  return `${firstNumericPart}${parsed.map((value) => value!.letterPart).join('')}`;
};

export const buildSupersetDisplayTitle = (
  superset: SupersetGroup,
  labelsByExerciseId: Record<string, SupersetLabelMetadata>
): string => {
  const compactCode = buildSupersetCompactCode(superset, labelsByExerciseId);
  const fallbackIndex = superset.order !== undefined ? superset.order + 1 : 1;
  const supersetIndex =
    labelsByExerciseId[superset.exerciseIds[0]]?.supersetIndex ??
    labelsByExerciseId[superset.exerciseIds.find((id) => labelsByExerciseId[id]) || '']?.supersetIndex ??
    fallbackIndex;

  return compactCode
    ? `Superset ${supersetIndex}: ${compactCode}`
    : `Superset ${supersetIndex}`;
};
