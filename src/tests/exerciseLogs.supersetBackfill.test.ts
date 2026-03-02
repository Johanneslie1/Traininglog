import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const setDocMock = jest.fn(async (..._args: unknown[]) => undefined);

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn((...segments: string[]) => ({ path: segments.join('/') })),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((value: Date) => value),
  },
  getDoc: jest.fn(),
  setDoc: setDocMock,
}));

jest.mock('@/services/firebase/config', () => ({
  db: {},
}));

import { backfillExerciseLogSupersetMetadata } from '@/services/firebase/exerciseLogs';
import { SupersetGroup } from '@/types/session';

describe('exerciseLogs superset backfill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fills missing superset fields from known date supersets', async () => {
    const supersets: SupersetGroup[] = [
      {
        id: 'superset-1',
        exerciseIds: ['ex-1', 'ex-2'],
        order: 0,
      },
    ];

    const updatedCount = await backfillExerciseLogSupersetMetadata(
      'user-1',
      [
        { id: 'ex-1' },
        { id: 'ex-2', supersetLabel: '1b', supersetName: 'Old Name' },
        { id: 'ex-3' },
      ],
      supersets,
      ['ex-1', 'ex-2', 'ex-3']
    );

    expect(updatedCount).toBe(2);
    expect(setDocMock).toHaveBeenCalledTimes(2);

    const firstCall = setDocMock.mock.calls[0] as unknown[];
    const firstPatch = firstCall[1] as Record<string, unknown>;
    expect(firstPatch).toMatchObject({
      supersetId: 'superset-1',
      supersetLabel: '1a',
    });

    const secondCall = setDocMock.mock.calls[1] as unknown[];
    const secondPatch = secondCall[1] as Record<string, unknown>;
    expect(secondPatch).toMatchObject({
      supersetId: 'superset-1',
      supersetLabel: '1b',
      supersetName: 'Old Name',
    });
  });
});
