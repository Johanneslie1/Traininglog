import { toJsDate } from '@/utils/dateUtils';

describe('toJsDate', () => {
  const fallback = new Date('2026-03-01T00:00:00.000Z');

  it('reads Firestore-style timestamps instead of producing Invalid Date', () => {
    const expected = new Date('2026-04-02T12:00:00.000Z');
    expect(toJsDate({ toDate: () => expected }, fallback)).toEqual(expected);
    expect(toJsDate({ seconds: 1_775_000_000 }, fallback).getTime()).toBe(1_775_000_000 * 1000);
  });

  it('keeps valid dates and falls back for empty values', () => {
    const date = new Date('2026-05-05T00:00:00.000Z');
    expect(toJsDate(date, fallback)).toBe(date);
    expect(toJsDate(undefined, fallback)).toBe(fallback);
    expect(toJsDate({}, fallback)).toBe(fallback);
    expect(toJsDate('not-a-date', fallback)).toBe(fallback);
  });
});
