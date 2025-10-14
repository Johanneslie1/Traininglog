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
  console.log('[programService] Validating program:', {
    name: program.name,
    userId: program.userId,
    sessionCount: program.sessions?.length || 0,
    isNew
  });

  if (!program.name?.trim()) {
    throw new ProgramValidationError('Program name is required');
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
      // Validate exercises - check name and ID
      session.exercises.forEach((exercise, exIndex) => {
        if (!exercise.name?.trim()) {
          throw new ProgramValidationError(`Exercise ${exIndex + 1} in session ${index + 1} must have a name`);
        }
        if (!exercise.id?.trim()) {
          throw new ProgramValidationError(`Exercise ${exIndex + 1} in session ${index + 1} must have an ID`);
        }
      });
    });
  }

  console.log('[programService] Program validation passed');
}

export const getPrograms = async (): Promise<Program[]> => {
  try {
    const user = await ensureAuth();
    
    console.log('[programService] Fetching programs for user:', user.uid);
    
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
          console.log(`[programService] Fetching sessions for program: ${programDoc.id}`);
          
          // Get sessions subcollection
          const sessionsRef = collection(db, `${PROGRAMS_COLLECTION}/${programDoc.id}/sessions`);
          const sessionsSnapshot = await getDocs(sessionsRef);
          
          console.log(`[programService] Found ${sessionsSnapshot.size} sessions for program: ${programDoc.id}`);
          
          const sessions = sessionsSnapshot.docs
            .map(sessionDoc => {
              const sessionData = sessionDoc.data();
              console.log(`[programService] Processing session: ${sessionDoc.id}`, sessionData);
              
              return {
                id: sessionDoc.id,
                name: sessionData.name,
                exercises: (sessionData.exercises || []).map((ex: any) => ({
                  id: ex.id || crypto.randomUUID(),
                  name: ex.name,
                  sets: ex.sets || 3,
                  reps: ex.reps || 10,
                  weight: ex.weight || 0,
                  setsData: ex.setsData || Array(ex.sets || 3).fill({
                    reps: ex.reps || 10,
                    weight: ex.weight || 0,
                    difficulty: 'MODERATE'
                  })
                })),
                userId: user.uid,
                order: sessionData.order ?? 0
              };
            })
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

    const validPrograms = programs.filter((p): p is Program => p !== null);
    console.log('[programService] Successfully fetched programs:', validPrograms.length);
    return validPrograms;
  } catch (err) {
    console.error('[programService] Error fetching programs:', err);
    throw err;
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

    console.log('[programService] Creating program with sessions:', {
      userId: user.uid,
      programUserId: program.userId,
      sessionCount: program.sessions?.length || 0,
      sessions: program.sessions?.map(s => ({ id: s.id, name: s.name, exerciseCount: s.exercises.length }))
    });

    // Validate user ID immediately
    if (program.userId !== user.uid) {
      console.error('[programService] User ID mismatch before processing:', {
        expected: user.uid,
        received: program.userId
      });
      throw new Error('User ID mismatch');
    }

    const batch = writeBatch(db);
    const programRef = doc(collection(db, PROGRAMS_COLLECTION));
    const timestamp = serverTimestamp();

    // Separate sessions from program data
    const { sessions, ...programData } = program;

    const programToCreate = removeUndefinedFields({
      ...programData,
      createdBy: user.uid,
      userId: user.uid,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    // For validation, convert serverTimestamp to a string
    const programForValidation = {
      ...programToCreate,
      id: programRef.id,
      createdAt: convertTimestampToString(timestamp),
      updatedAt: convertTimestampToString(timestamp),
      sessions: sessions || []
    };

    console.log('[programService] About to validate program:', {
      name: programForValidation.name,
      userId: programForValidation.userId,
      sessionCount: programForValidation.sessions.length
    });

    // Validate the program
    validateProgram(programForValidation, true);

    // Set the program document (without sessions)
    console.log('[programService] Adding program document to batch');
    batch.set(programRef, programToCreate);

    // Add sessions as subcollection
    if (sessions && sessions.length > 0) {
      console.log('[programService] Adding', sessions.length, 'sessions to subcollection');
      sessions.forEach((session, index) => {
        const sessionRef = doc(collection(programRef, 'sessions'));
        
        // Ensure session has required fields and properly format exercises
        const sessionData = removeUndefinedFields({
          ...session,
          id: sessionRef.id,
          userId: user.uid,
          programId: programRef.id,
          order: session.order ?? index,
          createdAt: timestamp,
          // Ensure exercises array exists and preserve all exercise reference fields
          exercises: (session.exercises || []).map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            exerciseRef: ex.exerciseRef || undefined,
            notes: ex.notes || '',
            order: ex.order ?? 0,
            activityType: ex.activityType || undefined
          }))
        });
        
        console.log('[programService] Adding session to batch:', {
          name: sessionData.name, 
          exerciseCount: sessionData.exercises?.length || 0,
          userId: sessionData.userId,
          programId: sessionData.programId
        });
        
        batch.set(sessionRef, sessionData);
      });
    }

    console.log('[programService] Committing program creation batch with', sessions?.length || 0, 'sessions');
    await batch.commit();
    console.log('[programService] Program created successfully with ID:', programRef.id);

  } catch (err) {
    console.error('[programService] Error in createProgram:', err);
    if (err instanceof Error) {
      console.error('[programService] Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    }
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

// Delete a session from a program
export const deleteSession = async (programId: string, sessionId: string): Promise<void> => {
  try {
    const user = await ensureAuth();
    console.log('[programService] Deleting session:', { programId, sessionId });

    // Get program reference and verify ownership
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);

    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }

    const programData = programDoc.data();
    if (programData.userId !== user.uid) {
      throw new Error('You can only delete sessions from your own programs');
    }

    // Get session reference
    const sessionRef = doc(collection(programRef, 'sessions'), sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    // Start a batch write
    const batch = writeBatch(db);

    // Delete the session
    batch.delete(sessionRef);

    // Update program timestamp
    batch.update(programRef, {
      updatedAt: serverTimestamp()
    });

    // Commit the transaction
    await batch.commit();

    console.log('[programService] Session deleted successfully:', { programId, sessionId });
  } catch (err) {
    console.error('[programService] Error deleting session:', err);
    throw err;
  }
};

// Create a new session in a program
export const createSession = async (programId: string, session: {
  name: string;
  exercises: Array<{ id?: string; name: string; notes?: string; order?: number; }>;
  notes?: string;
  order?: number;
}): Promise<string> => {
  try {
    const user = await ensureAuth();
    console.log('[programService] Creating new session:', { programId, sessionName: session.name, exerciseCount: session.exercises.length });

    // Get program reference and verify ownership
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);

    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }

    const programData = programDoc.data();
    if (programData.userId !== user.uid) {
      throw new Error('You can only add sessions to your own programs');
    }

    // Process exercises - store exercise reference and minimal data
    const processedExercises = session.exercises.map((exercise: any) => {
      // Keep the exercise ID as-is to maintain reference to exercise database
      // Only generate new ID if completely missing
      const exerciseId = exercise.id || crypto.randomUUID();
      
      // Build exercise object with only defined fields
      const exerciseData: any = {
        id: exerciseId,
        name: exercise.name,
        notes: exercise.notes || '',
        order: exercise.order ?? 0
      };
      
      // Only add exerciseRef if it exists
      if (exercise.exerciseRef) {
        exerciseData.exerciseRef = exercise.exerciseRef;
      }
      
      // Only add activityType if it exists
      if (exercise.activityType) {
        exerciseData.activityType = exercise.activityType;
      }

      return exerciseData;
    });

    // Create new session reference in the sessions subcollection
    const sessionsColRef = collection(programRef, 'sessions');
    const sessionRef = doc(sessionsColRef);
    
    const sessionData = removeUndefinedFields({
      id: sessionRef.id,
      name: session.name,
      exercises: processedExercises,
      notes: session.notes || '',
      order: session.order ?? 0,
      userId: user.uid,
      programId: programId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Start a batch write
    const batch = writeBatch(db);

    // Create the session
    batch.set(sessionRef, sessionData);

    // Update program timestamp
    batch.update(programRef, {
      updatedAt: serverTimestamp()
    });

    // Commit the batch
    await batch.commit();

    console.log('[programService] Session created successfully:', { 
      programId, 
      sessionId: sessionRef.id, 
      sessionName: session.name,
      exerciseCount: processedExercises.length 
    });

    return sessionRef.id;
  } catch (err) {
    console.error('[programService] Error creating session:', err);
    throw err;
  }
};

// Update a session's exercises
export const updateSession = async (programId: string, sessionId: string, exercises: Array<{ id: string; name: string; sets: number; reps: number; weight?: number; setsData?: any[]; }>): Promise<void> => {
  try {
    const user = await ensureAuth();
    console.log('[programService] Updating session exercises:', { programId, sessionId, exerciseCount: exercises.length });

    // Get program reference and verify ownership
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);

    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }

    const programData = programDoc.data();
    if (programData.userId !== user.uid) {
      throw new Error('You can only update your own programs');
    }

    // Get session reference and verify it exists
    const sessionsColRef = collection(programRef, 'sessions');
    const sessionRef = doc(sessionsColRef, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      // If session doesn't exist, create it
      console.log('[programService] Session not found, creating new session:', sessionId);
    }

    // Process exercises to ensure correct format and data integrity
    const processedExercises = exercises.map(exercise => {
      // Ensure valid exercise ID
      const exerciseId = (!exercise.id || exercise.id.startsWith('temp-')) 
        ? crypto.randomUUID() 
        : exercise.id;

      // Process sets data
      const setsData = exercise.setsData 
        ? exercise.setsData.map(set => ({
            reps: set.reps || exercise.reps || 10,
            weight: typeof set.weight === 'number' ? set.weight : (exercise.weight || 0),
            difficulty: set.difficulty || 'MODERATE'
          }))
        : Array(exercise.sets || 3).fill({
            reps: exercise.reps || 10,
            weight: exercise.weight || 0,
            difficulty: 'MODERATE'
          });

      return {
        id: exerciseId,
        name: exercise.name,
        sets: setsData.length,
        reps: setsData[0]?.reps || exercise.reps || 10,
        weight: setsData[0]?.weight || exercise.weight || 0,
        setsData: setsData
      };
    });

    // Start a transaction to ensure data consistency
    const batch = writeBatch(db);

    // Update or create the session with all data
    const sessionData = {
      exercises: processedExercises,
      updatedAt: serverTimestamp(),
      userId: user.uid,
      name: sessionDoc.exists() ? sessionDoc.data().name : 'New Session',
      order: sessionDoc.exists() ? sessionDoc.data().order : 0,
      programId: programId  // Add reference to parent program
    };

    // Use set with merge to handle both create and update
    batch.set(sessionRef, sessionData, { merge: true });

    // Update program timestamp
    batch.update(programRef, {
      updatedAt: serverTimestamp()
    });

    // Commit the transaction
    await batch.commit();

    console.log('[programService] Session updated successfully:', { 
      programId, 
      sessionId, 
      exerciseCount: processedExercises.length,
      sessionData: sessionData
    });

    console.log('[programService] Session exercises updated successfully:', { 
      programId, 
      sessionId, 
      exerciseCount: processedExercises.length 
    });
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
