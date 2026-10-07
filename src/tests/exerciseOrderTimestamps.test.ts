import { describe, expect, it } from '@jest/globals';
import {
  buildOrderedImportTimestamps,
  compareByExerciseOrder,
  nextOrderIndex,
  orderedTimestampForIndex,
} from '@/utils/exerciseOrderTimestamps';

describe('exercise order timestamps', () => {
  const day = new Date(2026, 2, 9, 0, 0, 0, 0);

  it('places the first ordered log at noon', () => {
    const first = orderedTimestampForIndex(day, 0);
    expect(first.getFullYear()).toBe(2026);
    expect(first.getMonth()).toBe(2);
    expect(first.getDate()).toBe(9);
    expect(first.getHours()).toBe(12);
    expect(first.getMinutes()).toBe(0);
    expect(first.getSeconds()).toBe(0);
    expect(first.getMilliseconds()).toBe(0);
  });

  it('places the next add after the latest stored timestamp', () => {
    const existing = [orderedTimestampForIndex(day, 0), new Date(2026, 2, 9, 0, 0, 0, 0)];
    expect(nextOrderIndex(day, existing)).toBe(1);
    const next = orderedTimestampForIndex(day, nextOrderIndex(day, existing));
    expect(next.getTime()).toBeGreaterThan(orderedTimestampForIndex(day, 0).getTime());
  });

  it('keeps a program batch in selection order after existing logs', () => {
    const existing = [orderedTimestampForIndex(day, 2)];
    const batch = buildOrderedImportTimestamps(day, existing, 3);

    expect(batch).toHaveLength(3);
    expect(batch.map((stamp) => stamp.getTime())).toEqual([
      orderedTimestampForIndex(day, 3).getTime(),
      orderedTimestampForIndex(day, 4).getTime(),
      orderedTimestampForIndex(day, 5).getTime(),
    ]);
    expect(batch[0].getTime()).toBeLessThan(batch[1].getTime());
    expect(batch[1].getTime()).toBeLessThan(batch[2].getTime());
  });

  it('orders equal timestamps by createdAt', () => {
    const shared = orderedTimestampForIndex(day, 0);
    const ordered = [
      { timestamp: shared, createdAt: new Date(2026, 2, 9, 9, 0, 0) },
      { timestamp: shared, createdAt: new Date(2026, 2, 9, 8, 0, 0) },
      { timestamp: orderedTimestampForIndex(day, 1), createdAt: new Date(2026, 2, 9, 7, 0, 0) },
    ].sort(compareByExerciseOrder);

    expect(ordered.map((item) => item.createdAt.getHours())).toEqual([8, 9, 7]);
  });
});
