import { describe, expect, it } from '@jest/globals';
import {
  buildSupersetCompactCode,
  buildSupersetDisplayTitle,
  buildSupersetLabels,
} from '@/utils/supersetUtils';
import { SupersetGroup } from '@/types/session';

describe('supersetUtils', () => {
  it('builds deterministic labels based on exerciseOrder and exerciseIds ordering', () => {
    const supersets: SupersetGroup[] = [
      { id: 's2', exerciseIds: ['e2', 'e1'], order: 1 },
      { id: 's1', exerciseIds: ['e3', 'e4', 'e5'], order: 0 },
    ];

    const labels = buildSupersetLabels(supersets, ['e3', 'e4', 'e5', 'e2', 'e1']);

    expect(labels.e3.label).toBe('1a');
    expect(labels.e4.label).toBe('1b');
    expect(labels.e5.label).toBe('1c');
    expect(labels.e2.label).toBe('2a');
    expect(labels.e1.label).toBe('2b');
  });

  it('falls back to superset.order when exerciseOrder is missing', () => {
    const supersets: SupersetGroup[] = [
      { id: 's-low', exerciseIds: ['e1', 'e2'], order: 0 },
      { id: 's-high', exerciseIds: ['e3', 'e4'], order: 2 },
    ];

    const labels = buildSupersetLabels(supersets);

    expect(labels.e1.label).toBe('1a');
    expect(labels.e2.label).toBe('1b');
    expect(labels.e3.label).toBe('2a');
    expect(labels.e4.label).toBe('2b');
  });

  it('handles partial exerciseOrder and keeps deterministic result', () => {
    const supersets: SupersetGroup[] = [
      { id: 's-first', exerciseIds: ['e10', 'e11'], order: 1 },
      { id: 's-second', exerciseIds: ['e20', 'e21'], order: 0 },
    ];

    const labels = buildSupersetLabels(supersets, ['e10']);

    expect(labels.e10.label).toBe('1a');
    expect(labels.e11.label).toBe('1b');
    expect(labels.e20.label).toBe('2a');
    expect(labels.e21.label).toBe('2b');
  });

  it('builds compact and display labels for a superset group', () => {
    const superset: SupersetGroup = {
      id: 's-1',
      name: 'Chest Pair',
      exerciseIds: ['a', 'b', 'c'],
      order: 0,
    };

    const labels = buildSupersetLabels([superset], ['a', 'b', 'c']);

    expect(buildSupersetCompactCode(superset, labels)).toBe('1abc');
    expect(buildSupersetDisplayTitle(superset, labels)).toBe('Superset 1: 1abc');
  });
});
