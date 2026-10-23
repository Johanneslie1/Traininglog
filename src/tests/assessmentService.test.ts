// @ts-nocheck

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { AssessmentWrite } from '@/types/assessment';

const collectionMock = jest.fn();
const docMock = jest.fn();
const getDocMock = jest.fn();
const getDocsMock = jest.fn();
const queryMock = jest.fn();
const whereMock = jest.fn();
const setDocMock = jest.fn();
const updateDocMock = jest.fn();
const deleteDocMock = jest.fn();
const serverTimestampMock = jest.fn();
const deleteFieldMock = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'user-42' } })),
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  deleteDoc: (...args: unknown[]) => deleteDocMock(...args),
  deleteField: (...args: unknown[]) => deleteFieldMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  serverTimestamp: (...args: unknown[]) => serverTimestampMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
}));

jest.mock('@/services/firebase/config', () => ({
  db: {},
}));

import { saveAssessment } from '@/services/assessmentService';

const bodyWrite: AssessmentWrite = {
  kind: 'body_composition',
  date: '2026-10-12',
  method: 'bia',
  heightCm: 181.5,
  bodyMassKg: 78.4,
  notes: 'Fasted',
};

describe('assessmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T12:00:00'));

    const normalize = (segments: unknown[]) =>
      segments.flatMap((segment) => {
        if (segment && typeof segment === 'object' && 'path' in (segment as Record<string, unknown>)) {
          return [String((segment as { path: string }).path)];
        }
        if (segment && typeof segment === 'object') return [];
        return [String(segment)];
      });

    collectionMock.mockImplementation((...segments: unknown[]) => ({
      path: normalize(segments).join('/'),
    }));
    docMock.mockImplementation((...segments: unknown[]) => {
      const path = normalize(segments).join('/');
      const segments = path.split('/');
      return { path, id: segments[segments.length - 1] };
    });
    whereMock.mockImplementation((field: string, op: string, value: unknown) => ({ field, op, value }));
    queryMock.mockImplementation((ref: { path: string }, ...constraints: unknown[]) => ({
      path: ref.path,
      constraints,
    }));
    getDocMock.mockResolvedValue({ exists: () => false });
    serverTimestampMock.mockReturnValue({ __serverTimestamp: true });
    deleteFieldMock.mockReturnValue({ __deleteField: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a body composition result with height under the kind and date id', async () => {
    await saveAssessment(bodyWrite);

    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/user-42/assessments/body_composition_2026-10-12' }),
      expect.objectContaining({
        userId: 'user-42',
        kind: 'body_composition',
        date: '2026-10-12',
        method: 'bia',
        heightCm: 181.5,
        bodyMassKg: 78.4,
        notes: 'Fasted',
        timestamp: { __serverTimestamp: true },
      })
    );
  });

  it('moves an edited result when the date changes', async () => {
    getDocMock.mockResolvedValueOnce({ exists: () => false });

    await saveAssessment(bodyWrite, 'body_composition_2026-08-18');

    expect(deleteDocMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/user-42/assessments/body_composition_2026-08-18' })
    );
  });

  it('rejects a future test before writing', async () => {
    await expect(saveAssessment({
      ...bodyWrite,
      date: '2026-10-20',
    })).rejects.toThrow("Can't log a test for a future date.");
    expect(setDocMock).not.toHaveBeenCalled();
  });
});
