import { describe, expect, it } from '@jest/globals';
import {
  assessmentDocId,
  calculateBmi,
  createBodyCompositionDraft,
  createVo2maxDraft,
  parseBodyComposition,
  parseVo2max,
  previewBmi,
} from '@/utils/assessmentLog';

const today = '2026-10-14';

describe('assessmentLog', () => {
  it('builds one document id per kind and date', () => {
    expect(assessmentDocId('body_composition', '2026-10-12')).toBe('body_composition_2026-10-12');
  });

  it('accepts height with other body composition fields and a decimal comma', () => {
    const parsed = parseBodyComposition({
      ...createBodyCompositionDraft(today),
      heightCm: '181,5',
      bodyMassKg: '78,4',
    }, today);

    expect(parsed).toEqual({
      ok: true,
      value: expect.objectContaining({
        kind: 'body_composition',
        heightCm: 181.5,
        bodyMassKg: 78.4,
        method: 'scale',
      }),
    });
  });

  it('requires at least one body composition measurement', () => {
    const parsed = parseBodyComposition(createBodyCompositionDraft(today), today);
    expect(parsed).toEqual({
      ok: false,
      message: 'Enter a height, body mass, body fat, fat mass, or lean mass.',
    });
  });

  it('rejects a future test date', () => {
    const parsed = parseVo2max({
      ...createVo2maxDraft('2026-10-15'),
      vo2maxMlKgMin: '58.4',
    }, today);
    expect(parsed).toEqual({
      ok: false,
      message: "Can't log a test for a future date.",
    });
  });

  it('requires VO2max and keeps optional lab fields', () => {
    const missing = parseVo2max(createVo2maxDraft(today), today);
    expect(missing.ok).toBe(false);

    const parsed = parseVo2max({
      ...createVo2maxDraft(today),
      vo2maxMlKgMin: '58.4',
      vo2maxLMin: '4.58',
      maxHeartRate: '192',
    }, today);

    expect(parsed).toEqual({
      ok: true,
      value: expect.objectContaining({
        kind: 'vo2max',
        vo2maxMlKgMin: 58.4,
        vo2maxLMin: 4.58,
        maxHeartRate: 192,
      }),
    });
  });

  it('calculates BMI from height and body mass', () => {
    expect(calculateBmi(180, 78.4)).toBe(24.2);
    expect(previewBmi('180', '78.4')).toBe(24.2);
    expect(previewBmi('', '78.4')).toBeNull();
  });
});
