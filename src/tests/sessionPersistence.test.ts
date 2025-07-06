/**
 * Session Persistence Test
 * 
 * Test script to verify that sessions are properly created and persisted to Firestore.
 * This is not a unit test but rather a debugging script.
 */

import { createSession } from '@/services/programService';

export const testSessionCreation = async (programId: string) => {
  try {
    console.log('[TEST] Testing session creation for program:', programId);
    
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

    const sessionId = await createSession(programId, testSession);
    console.log('[TEST] Session created successfully with ID:', sessionId);
    
    return sessionId;
  } catch (error) {
    console.error('[TEST] Session creation failed:', error);
    throw error;
  }
};

export const debugSessionFlow = () => {
  console.log('[DEBUG] Session flow debugging enabled');
  console.log('[DEBUG] Check browser console for session save logs');
  console.log('[DEBUG] Look for logs starting with [ProgramDetail] and [programService]');
};
