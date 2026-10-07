/** Milliseconds between ordered logs. Matches drag-reorder spacing. */
export const ORDER_TIMESTAMP_STEP_MS = 100;

export interface ExerciseOrderFields {
  timestamp?: Date | null;
  createdAt?: Date | null;
}

export const isStartOfLocalDay = (date: Date): boolean =>
  date.getHours() === 0 &&
  date.getMinutes() === 0 &&
  date.getSeconds() === 0 &&
  date.getMilliseconds() === 0;

export const localDayBounds = (day: Date): { start: Date; end: Date } => {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Noon on the selected day, plus index * 100ms.
 * Index 0 is the first ordered slot. Later indexes stay strictly later.
 */
export const orderedTimestampForIndex = (day: Date, index: number): Date => {
  const stamp = new Date(day);
  stamp.setHours(12, 0, 0, 0);
  stamp.setMilliseconds(Math.max(0, index) * ORDER_TIMESTAMP_STEP_MS);
  return stamp;
};

export const orderIndexFromTimestamp = (day: Date, timestamp: Date): number | null => {
  const base = orderedTimestampForIndex(day, 0).getTime();
  const delta = timestamp.getTime() - base;
  if (delta < 0) {
    return null;
  }
  return Math.round(delta / ORDER_TIMESTAMP_STEP_MS);
};

/** Next free order slot after every timestamp already stored on that day. */
export const nextOrderIndex = (day: Date, timestamps: Date[]): number => {
  let maxIndex = -1;
  timestamps.forEach((timestamp) => {
    const index = orderIndexFromTimestamp(day, timestamp);
    if (index !== null && index > maxIndex) {
      maxIndex = index;
    }
  });
  return maxIndex + 1;
};

export const buildOrderedImportTimestamps = (
  day: Date,
  existingTimestamps: Date[],
  count: number
): Date[] => {
  const startIndex = nextOrderIndex(day, existingTimestamps);
  return Array.from({ length: count }, (_, offset) =>
    orderedTimestampForIndex(day, startIndex + offset)
  );
};

/** Timestamp ascending, then createdAt ascending when timestamps tie. */
export const compareByExerciseOrder = (left: ExerciseOrderFields, right: ExerciseOrderFields): number => {
  const timeDelta = (left.timestamp?.getTime() || 0) - (right.timestamp?.getTime() || 0);
  if (timeDelta !== 0) {
    return timeDelta;
  }
  return (left.createdAt?.getTime() || 0) - (right.createdAt?.getTime() || 0);
};

export const parseStoredDate = (value: unknown): Date | undefined => {
  if (value == null || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (
    typeof value === 'object' &&
    'toDate' in (value as Record<string, unknown>) &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const parsed = (value as { toDate: () => Date }).toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
  }

  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};
