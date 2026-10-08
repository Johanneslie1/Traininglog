// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const collectionMock = jest.fn();
const docMock = jest.fn();
const getDocsMock = jest.fn();
const queryMock = jest.fn();
const setDocMock = jest.fn();
const updateDocMock = jest.fn();
const runTransactionMock = jest.fn();
const whereMock = jest.fn();
const serverTimestampMock = jest.fn();
const deleteFieldMock = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'user-42' } })),
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  deleteField: (...args: unknown[]) => deleteFieldMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  runTransaction: (...args: unknown[]) => runTransactionMock(...args),
  serverTimestamp: (...args: unknown[]) => serverTimestampMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
}));

jest.mock('@/services/firebase/config', () => ({
  db: { kind: 'db' },
}));

import { createHabit, saveHabitEntry } from '@/services/habitService';

describe('habitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T12:00:00'));
    serverTimestampMock.mockReturnValue({ __serverTimestamp: true });
    deleteFieldMock.mockReturnValue({ __deleteField: true });
    collectionMock.mockImplementation((...args: unknown[]) => ({
      path: args.filter((part) => typeof part === 'string').join('/'),
    }));
    docMock.mockImplementation((...args: unknown[]) => {
      const strings = args.filter((part): part is string => typeof part === 'string');
      const parent = args[0] && typeof args[0] === 'object' && args[0] !== null && 'path' in args[0]
        ? String((args[0] as { path: string }).path)
        : '';
      if (parent) {
        const id = strings[0] ?? 'habit-1';
        return { id, path: `${parent}/${id}` };
      }
      return { id: strings[strings.length - 1], path: strings.join('/') };
    });
    setDocMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a habit under the signed-in user', async () => {
    const id = await createHabit({
      name: '  Mobility  ',
      kind: 'check',
      sortOrder: 2,
    }, '2026-10-08');

    expect(id).toBe('habit-1');
    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/user-42/habits/habit-1' }),
      expect.objectContaining({
        userId: 'user-42',
        name: 'Mobility',
        kind: 'check',
        sortOrder: 2,
        activeFrom: '2026-10-08',
        archived: false,
      }),
    );
  });

  it('merges a day log onto the date document without dropping other habits', async () => {
    const transactionSet = jest.fn();
    runTransactionMock.mockImplementation(async (_database: unknown, update: (transaction: {
      get: () => Promise<{ exists: () => boolean; data: () => { entries: Record<string, { completed: boolean }> } }>;
      set: typeof transactionSet;
    }) => Promise<void>) => update({
      get: async () => ({
        exists: () => true,
        data: () => ({ entries: { protein: { completed: true } } }),
      }),
      set: transactionSet,
    }));

    await saveHabitEntry('2026-10-07', 'water', { value: 5 });

    expect(transactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/user-42/habitDays/2026-10-07' }),
      expect.objectContaining({
        userId: 'user-42',
        date: '2026-10-07',
        entries: {
          protein: { completed: true },
          water: { value: 5 },
        },
      }),
    );
  });

  it('rejects a future habit log', async () => {
    await expect(saveHabitEntry('2026-10-09', 'water', { value: 1 })).rejects.toThrow(
      'Cannot log a habit for a future date',
    );
    expect(setDocMock).not.toHaveBeenCalled();
    expect(runTransactionMock).not.toHaveBeenCalled();
  });
});
