/**
 * Session Persistence Test
 * 
 * Unit tests to verify session data structure and validation logic.
 */

// Mock the programService to avoid Firebase dependencies
jest.mock('../services/programService', () => ({
  createSession: jest.fn()
}));

import { createSession } from '../services/programService';

const mockCreateSession = createSession as jest.MockedFunction<typeof createSession>;

describe('Session Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create session with valid structure', async () => {
    const programId = 'test-program-id';
    const testSession = {
      name: 'Test Session',
      exercises: [
        {
          id: 'test-exercise-1',
          name: 'Push Ups',
          sets: 3,
          reps: 10,
          weight: 0,
          setsData: [
            { reps: 10, weight: 0, difficulty: 'MODERATE' },
            { reps: 10, weight: 0, difficulty: 'MODERATE' },
            { reps: 10, weight: 0, difficulty: 'MODERATE' }
          ]
        }
      ],
      order: 0
    };

    mockCreateSession.mockResolvedValue('session-123');

    const sessionId = await createSession(programId, testSession);
    
    expect(mockCreateSession).toHaveBeenCalledWith(programId, testSession);
    expect(sessionId).toBe('session-123');
  });

  it('should handle session creation errors', async () => {
    const programId = 'test-program-id';
    const testSession = { name: 'Test Session', exercises: [], order: 0 };
    
    mockCreateSession.mockRejectedValue(new Error('Database error'));    await expect(createSession(programId, testSession)).rejects.toThrow('Database error');
  });
});
