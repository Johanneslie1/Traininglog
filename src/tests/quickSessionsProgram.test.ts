import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const createProgramMock = jest.fn(async () => 'quick-program-1');

jest.mock('@/services/programService', () => ({
  createProgram: (...args: unknown[]) => createProgramMock(...args),
}));

import {
  QUICK_SESSIONS_PROGRAM_NAME,
  ensureQuickSessionsProgram,
  findQuickSessionsProgram,
} from '@/services/quickSessionsProgram';
import type { Program } from '@/types/program';

const baseProgram = (overrides: Partial<Program> = {}): Program => ({
  id: 'p1',
  name: 'Other',
  userId: 'coach-1',
  createdBy: 'coach-1',
  createdAt: '',
  updatedAt: '',
  sessions: [],
  ...overrides,
});

describe('quickSessionsProgram', () => {
  beforeEach(() => {
    createProgramMock.mockClear();
    createProgramMock.mockResolvedValue('quick-program-1');
  });

  it('finds an existing Quick sessions program by name', () => {
    const programs = [
      baseProgram(),
      baseProgram({ id: 'qs', name: QUICK_SESSIONS_PROGRAM_NAME }),
    ];
    expect(findQuickSessionsProgram(programs)?.id).toBe('qs');
  });

  it('returns existing id without creating', async () => {
    const programs = [baseProgram({ id: 'qs', name: QUICK_SESSIONS_PROGRAM_NAME })];
    await expect(ensureQuickSessionsProgram(programs, 'coach-1')).resolves.toBe('qs');
    expect(createProgramMock).not.toHaveBeenCalled();
  });

  it('creates Quick sessions when missing', async () => {
    await expect(ensureQuickSessionsProgram([baseProgram()], 'coach-1')).resolves.toBe('quick-program-1');
    expect(createProgramMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: QUICK_SESSIONS_PROGRAM_NAME,
        userId: 'coach-1',
        createdBy: 'coach-1',
        sessions: [],
      })
    );
  });
});
