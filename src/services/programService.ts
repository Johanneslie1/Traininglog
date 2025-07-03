import type { Program } from '@/types/program';
import { db } from './firebase/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const PROGRAMS_COLLECTION = 'programs';

// Ensure user is authenticated
async function ensureAuth() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user || !user.uid) {
    throw new Error('User must be logged in');
  }
  // Wait a moment to ensure Firebase auth is fully initialized
  await new Promise(resolve => setTimeout(resolve, 100));
  // Double check auth state
  if (auth.currentUser !== user) {
    throw new Error('Auth state changed unexpectedly');
  }
  return { uid: user.uid };
}

// Utility: Deeply remove all undefined fields
function removeUndefinedFields<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields) as unknown as T;
  } else if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    });
    return cleaned;
  }
  return obj;
}

class ProgramValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgramValidationError';
  }
}

function validateProgram(program: Partial<Program>, isNew: boolean = false): void {
  if (!program.name?.trim()) {
    throw new ProgramValidationError('Program name is required');
  }

  if (!program.level) {
    throw new ProgramValidationError('Program level is required');
  }

  if (!isNew && !program.id) {
    throw new ProgramValidationError('Program ID is required for existing programs');
  }

  if (!program.userId) {
    throw new ProgramValidationError('Program must have a userId');
  }

  // Validate sessions if they exist
  if (program.sessions) {
    program.sessions.forEach((session, index) => {
      if (!session.name?.trim()) {
        throw new ProgramValidationError(`Session ${index + 1} must have a name`);
      }
      if (!Array.isArray(session.exercises)) {
        throw new ProgramValidationError(`Session ${index + 1} must have an exercises array`);
      }
      session.exercises.forEach((exercise, exIndex) => {
        if (!exercise.name?.trim()) {
          throw new ProgramValidationError(`Exercise ${exIndex + 1} in session ${index + 1} must have a name`);
        }
        if (typeof exercise.sets !== 'number' || exercise.sets < 1) {
          throw new ProgramValidationError(`Exercise ${exIndex + 1} in session ${index + 1} must have valid sets`);
        }
        if (typeof exercise.reps !== 'number' || exercise.reps < 0) {
          throw new ProgramValidationError(`Exercise ${exIndex + 1} in session ${index + 1} must have valid reps`);
        }
      });
    });
  }
}

export const getPrograms = async (): Promise<Program[]> => {
  try {
    const user = await ensureAuth();
    
    // Query programs for current user
    const programsRef = collection(db, PROGRAMS_COLLECTION);
    const q = query(programsRef, where('userId', '==', user.uid));
    const programsSnapshot = await getDocs(q);
    
    if (programsSnapshot.empty) {
      console.log('[programService] No programs found for user:', user.uid);
      return [];
    }

    // Fetch sessions for each program
    const programs = await Promise.all(
      programsSnapshot.docs.map(async (programDoc) => {
        try {
          const programData = programDoc.data();
          const sessionsRef = collection(db, `${PROGRAMS_COLLECTION}/${programDoc.id}/sessions`);
          const sessionsSnapshot = await getDocs(sessionsRef);
          
          const sessions = sessionsSnapshot.docs
            .map(sessionDoc => ({
              id: sessionDoc.id,
              ...sessionDoc.data(),
              userId: user.uid // Ensure userId is set
            }))
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

          return {
            id: programDoc.id,
            ...programData,
            sessions,
            userId: user.uid // Ensure userId is set
          } as Program;
        } catch (err) {
          console.error(`[programService] Error fetching sessions for program ${programDoc.id}:`, err);
          return null;
        }
      })
    );

    return programs.filter((p): p is Program => p !== null);
  } catch (err) {
    console.error('[programService] Error fetching programs:', err);
    return [];
  }
};

function convertTimestampToString(timestamp: any): string {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return new Date().toISOString();
}

export const createProgram = async (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const user = await ensureAuth();
    if (!user || !user.uid) {
      throw new Error('Invalid user state');
    }
    console.log('[programService] Creating program with auth:', {
      userId: user.uid,
      programUserId: program.userId,
      match: user.uid === program.userId
    });
    const timestamp = serverTimestamp();

    const programToCreate = {
      ...program,
      createdBy: user.uid,
      userId: user.uid,
      createdAt: timestamp,
      updatedAt: timestamp,
      sessions: program.sessions?.map(session => ({
        ...session,
        userId: user.uid,
        createdAt: timestamp
      }))
    };

    // Convert timestamps for validation
    const programForValidation = {
      ...programToCreate,
      createdAt: convertTimestampToString(timestamp),
      updatedAt: convertTimestampToString(timestamp),
      sessions: programToCreate.sessions?.map(s => ({
        ...s,
        createdAt: convertTimestampToString(timestamp)
      }))
    };

    // Validate the program
    validateProgram(programForValidation, true);

    // Clean up data
    const cleanProgram = removeUndefinedFields(programToCreate);

    // Verify user ID matches
    if (cleanProgram.userId !== user.uid) {
      console.error('[programService] User ID mismatch:', {
        programUserId: cleanProgram.userId,
        currentUserId: user.uid
      });
      throw new Error('Program userId must match the current user');
    }

    console.log('[programService] Creating program with data:', {
      collection: PROGRAMS_COLLECTION,
      userId: user.uid,
      timestamp: timestamp
    });

    // Create program document with a new ID
    const programRef = doc(collection(db, PROGRAMS_COLLECTION));
    const batch = writeBatch(db);

    // Add program data without sessions
    const { sessions, ...programData } = cleanProgram;
    const finalProgramData = {
      ...programData,
      id: programRef.id, // Set the ID from the ref
      userId: user.uid,  // Ensure userId is set
      createdAt: timestamp,
      updatedAt: timestamp
    };

    console.log('[programService] Final program data:', {
      id: programRef.id,
      name: finalProgramData.name,
      userId: finalProgramData.userId,
      sessionCount: sessions?.length ?? 0
    });
    
    // Set the program document with complete data
    batch.set(programRef, finalProgramData);

    // Create sessions
    if (sessions && sessions.length > 0) {
      sessions.forEach((session, index) => {
        const sessionRef = doc(collection(programRef, 'sessions'));
        batch.set(sessionRef, {
          ...session,
          id: sessionRef.id,
          order: session.order ?? index,
          programId: programRef.id,
          userId: user.uid,
          createdAt: timestamp
        });
      });
    } else {
      // Create initial session if none provided
      const sessionRef = doc(collection(programRef, 'sessions'));
      batch.set(sessionRef, {
        id: sessionRef.id,
        name: 'Session 1',
        exercises: [],
        order: 0,
        userId: user.uid,
        createdAt: timestamp
      });
    }

    await batch.commit();
    console.log('[programService] Program created successfully:', programRef.id);
  } catch (err) {
    console.error('[programService] Error in createProgram:', err);
    throw err;
  }
};

export const replaceProgram = async (programId: string, program: Program): Promise<void> => {
  try {
    const user = await ensureAuth();
    validateProgram(program);

    // Ensure user owns the program
    if (program.userId !== user.uid) {
      throw new Error('You can only update your own programs');
    }

    const timestamp = serverTimestamp();
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const batch = writeBatch(db);

    // Update program data
    const { sessions, ...programData } = program;
    batch.set(programRef, {
      ...programData,
      updatedAt: timestamp
    }, { merge: true });

    // Delete existing sessions
    const existingSessionsSnapshot = await getDocs(collection(programRef, 'sessions'));
    existingSessionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Create new sessions
    sessions.forEach((session, index) => {
      const sessionRef = doc(collection(programRef, 'sessions'));
      batch.set(sessionRef, {
        ...session,
        id: sessionRef.id,
        order: session.order ?? index,
        userId: user.uid,
        programId
      });
    });

    await batch.commit();
    console.log('[programService] Program updated successfully:', programId);
  } catch (err) {
    console.error('[programService] Error updating program:', err);
    throw err;
  }
};

export const deleteProgram = async (programId: string): Promise<void> => {
  try {
    const user = await ensureAuth();

    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);

    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }

    const programData = programDoc.data();
    if (programData.userId !== user.uid) {
      throw new Error('You can only delete your own programs');
    }

    const batch = writeBatch(db);

    // Delete all sessions
    const sessionsSnapshot = await getDocs(collection(programRef, 'sessions'));
    sessionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete program document
    batch.delete(programRef);

    await batch.commit();
    console.log('[programService] Program deleted successfully:', programId);
  } catch (err) {
    console.error('[programService] Error deleting program:', err);
    throw err;
  }
};

// Update a session's exercises
export const updateSession = async (programId: string, sessionId: string, exercises: Array<{ id: string; name: string; sets: number; reps: number; weight?: number; setsData?: any[]; }>): Promise<void> => {
  try {
    const user = await ensureAuth();
    console.log('[programService] Updating session exercises:', { programId, sessionId, exerciseCount: exercises.length });

    // First verify the program belongs to the user
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);

    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }

    const programData = programDoc.data();
    if (programData.userId !== user.uid) {
      throw new Error('You can only update your own programs');
    }

    // Get the session reference
    const sessionRef = doc(collection(programRef, 'sessions'), sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    // Update just the exercises array and timestamp
    await updateDoc(sessionRef, {
      exercises,
      updatedAt: serverTimestamp()
    });

    console.log('[programService] Session exercises updated successfully:', { programId, sessionId, exercises });
  } catch (err) {
    console.error('[programService] Error updating session exercises:', err);
    throw err;
  }
};

// Test function to create a sample program
export const createTestProgram = async (): Promise<void> => {
  const user = await ensureAuth();
  const testProgram = {
    name: "Test Strength Program",
    description: "A test program to verify permissions",
    level: "beginner" as const,
    createdBy: user.uid,
    userId: user.uid,
    sessions: [
      {
        id: "temp-" + Date.now(),  // Temporary ID that will be replaced
        name: "Day 1 - Push",
        userId: user.uid,
        exercises: [
          {
            id: "1",
            name: "Bench Press",
            sets: 3,
            reps: 10,
            weight: 60
          }
        ]
      }
    ]
  };

  console.log('[TEST] Creating test program with data:', {
    name: testProgram.name,
    userId: testProgram.userId,
    level: testProgram.level,
    sessionCount: testProgram.sessions.length
  });
  try {
    const auth = getAuth();
    console.log('[TEST] Current auth state:', {
      isAuthenticated: !!auth.currentUser,
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    });
    await createProgram(testProgram);
    console.log('[TEST] Test program created successfully');
    
    // Verify we can read it back
    const programs = await getPrograms();
    console.log('[TEST] Retrieved programs:', programs);
    
    if (programs.length > 0) {
      const lastProgram = programs[programs.length - 1];
      console.log('[TEST] Last program details:', {
        id: lastProgram.id,
        userId: lastProgram.userId,
        sessions: lastProgram.sessions.map(s => ({
          id: s.id,
          userId: s.userId,
          name: s.name
        }))
      });
    }
  } catch (error) {
    console.error('[TEST] Error in test:', error);
    throw error;
  }
};
