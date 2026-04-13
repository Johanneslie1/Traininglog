import { describe, it, expect } from '@jest/globals';
import { rowsToCSVForPowerBi } from '@/utils/powerBiCsv';

describe('rowsToCSVForPowerBi', () => {
  it('uses comma delimiter and no BOM for Power BI query compatibility', () => {
    const csv = rowsToCSVForPowerBi(
      [{ athlete_id: 'a1', weight: 27.5, reps: 10 }],
      ['athlete_id', 'weight', 'reps']
    );

    expect(csv.startsWith('\uFEFF')).toBe(false);
    expect(csv).toContain('athlete_id,weight,reps');
    expect(csv).toContain('a1,"27,5",10');
  });

  it('formats decimals with comma for numeric fields', () => {
    const csv = rowsToCSVForPowerBi(
      [{ weight: 157.5, rpe: 8.25 }],
      ['weight', 'rpe']
    );

    expect(csv).toContain('"157,5","8,25"');
    expect(csv).not.toContain('157.5');
    expect(csv).not.toContain('8.25');
  });

  it('escapes delimiters in string values', () => {
    const csv = rowsToCSVForPowerBi(
      [{ notes: 'tempo,pause', weight: 20 }],
      ['notes', 'weight']
    );

    expect(csv).toContain('"tempo,pause",20');
  });
});
