import type { Program, ProgramSession } from '@/types/program';
import type { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import { normalizeEnduranceDurationMinutes } from '@/utils/prescriptionUtils';
import speedAgilityExercises from '@/data/exercises/speedAgility.json';
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

function buildProgramExercisePayload(
  exercise: {
    id?: string;
    name: string;
    notes?: string;
    order?: number;
    exerciseRef?: string;
    activityType?: ActivityType;
    instructionMode?: 'structured' | 'freeform';
    prescription?: any;
    instructions?: string;
  },
  fallbackOrder: number,
  options?: { generateIdIfMissing?: boolean }
) {
  const payload: any = {
    id: exercise.id || (options?.generateIdIfMissing ? crypto.randomUUID() : undefined),
    name: exercise.name,
    notes: exercise.notes || '',
    order: exercise.order ?? fallbackOrder
  };

  if (exercise.exerciseRef) payload.exerciseRef = exercise.exerciseRef;
  if (exercise.activityType) payload.activityType = normalizeActivityType(exercise.activityType);
  if (exercise.instructionMode) payload.instructionMode = exercise.instructionMode;
  if (exercise.prescription) payload.prescription = exercise.prescription;
  if (exercise.instructions) payload.instructions = exercise.instructions;

  return removeUndefinedFields(payload);
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

const resolveCurrentUserDisplayName = async (uid: string): Promise<string> => {
  const auth = getAuth();

  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as { firstName?: string; lastName?: string; email?: string };
      const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      if (fullName) {
        return fullName;
      }
      if (userData.email) {
        return userData.email;
      }
    }
  } catch (error) {
    console.warn('[programService] Could not resolve user display name from profile:', error);
  }

  return auth.currentUser?.displayName || auth.currentUser?.email || 'Coach';
};

export const getPrograms = async (): Promise<Program[]> => {
  try {
    const user = await ensureAuth();

    // Query programs for current user
    const programsRef = collection(db, PROGRAMS_COLLECTION);
    const q = query(programsRef, where('userId', '==', user.uid));
    const programsSnapshot = await getDocs(q);
    
    if (programsSnapshot.empty) {
      return [];
    }

    // Fetch sessions for each program
    const programs = await Promise.all(
      programsSnapshot.docs.map(async (programDoc) => {
        try {
          const programData = programDoc.data();
          
          // Get sessions subcollection
          const sessionsRef = collection(db, `${PROGRAMS_COLLECTION}/${programDoc.id}/sessions`);
          const sessionsSnapshot = await getDocs(sessionsRef);
          
          const sessions = sessionsSnapshot.docs
            .map(sessionDoc => {
              const sessionData = sessionDoc.data();
              
              return {
                id: sessionDoc.id,
                name: sessionData.name,
                isWarmupSession: sessionData.isWarmupSession === true,
                notes: sessionData.notes || '',
                exercises: (sessionData.exercises || [])
                  .map((ex: any, exIndex: number) => {
                    const exerciseData = {
                      id: ex.id || crypto.randomUUID(),
                      name: ex.name,
                      sets: ex.sets || 3,
                      reps: ex.reps || 10,
                      weight: ex.weight || 0,
                      order: ex.order ?? exIndex,
                      notes: ex.notes || '',
                      exerciseRef: ex.exerciseRef,
                      activityType: ex.activityType ? normalizeActivityType(ex.activityType) : undefined,
                      // Include prescription fields
                      instructionMode: ex.instructionMode,
                      prescription: ex.prescription,
                      instructions: ex.instructions,
                      setsData: ex.setsData || Array(ex.sets || 3).fill({
                        reps: ex.reps || 10,
                        weight: ex.weight || 0,
                        difficulty: 'MODERATE'
                      })
                    };

                    return exerciseData;
                  })
                  .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
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

export const createProgram = async (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
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
          // Assign order based on array index to maintain insertion order
          exercises: (session.exercises || []).map((ex: any, exIndex: number) => {
            return buildProgramExercisePayload(ex, exIndex);
          })
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
    
    return programRef.id;
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
      // Process exercises with proper order and clean undefined fields
      const processedExercises = (session.exercises || []).map((ex: any, exIndex: number) => {
        return buildProgramExercisePayload(ex, exIndex);
      });
      
      const sessionData = removeUndefinedFields({
        ...session,
        id: sessionRef.id,
        order: session.order ?? index,
        exercises: processedExercises,
        userId: user.uid,
        programId
      });
      
      batch.set(sessionRef, sessionData);
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
  exercises: Array<{
    id?: string;
    name: string;
    notes?: string;
    order?: number;
    exerciseRef?: string;
    activityType?: ActivityType;
    instructionMode?: 'structured' | 'freeform';
    prescription?: any;
    instructions?: string;
  }>;
  isWarmupSession?: boolean;
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
    // Assign order based on array index to maintain insertion order
    console.log('[createSession] Processing exercises, received:', session.exercises);
    
    const processedExercises = session.exercises.map((exercise: any, exIndex: number) => {
      // Keep the exercise ID as-is to maintain reference to exercise database
      // Only generate new ID if completely missing
      const exerciseId = exercise.id || crypto.randomUUID();
      
      console.log(`[createSession] Processing exercise ${exIndex} (${exercise.name}):`, {
        hasInstructionMode: !!exercise.instructionMode,
        hasPrescription: !!exercise.prescription,
        hasInstructions: !!exercise.instructions,
        instructionMode: exercise.instructionMode,
        prescription: exercise.prescription,
        instructions: exercise.instructions
      });
      
      const exerciseData = buildProgramExercisePayload({
        ...exercise,
        id: exerciseId
      }, exIndex, { generateIdIfMissing: true });

      console.log('[createSession] Added instructionMode:', exerciseData.instructionMode);
      console.log('[createSession] Added prescription:', exerciseData.prescription);
      console.log('[createSession] Added instructions length:', exerciseData.instructions?.length);

      return exerciseData;
    });
    
    console.log('[createSession] Processed exercises before removeUndefinedFields:', JSON.stringify(processedExercises, null, 2));

    // Create new session reference in the sessions subcollection
    const sessionsColRef = collection(programRef, 'sessions');
    const sessionRef = doc(sessionsColRef);
    
    const sessionData = removeUndefinedFields({
      id: sessionRef.id,
      name: session.name,
      exercises: processedExercises,
      isWarmupSession: session.isWarmupSession === true,
      notes: session.notes || '',
      order: session.order ?? 0,
      userId: user.uid,
      programId: programId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('[createSession] Session data after removeUndefinedFields:', JSON.stringify(sessionData, null, 2));
    console.log('[createSession] Writing to Firestore at:', `programs/${programId}/sessions/${sessionRef.id}`);

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
export const updateSession = async (programId: string, sessionId: string, exercises: Array<{ 
  id: string; 
  name: string; 
  sets?: number; 
  reps?: number; 
  weight?: number; 
  setsData?: any[];
  notes?: string;
  order?: number;
  exerciseRef?: string;
  activityType?: ActivityType;
  instructionMode?: 'structured' | 'freeform';
  prescription?: any;
  instructions?: string;
}>): Promise<void> => {
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
    // Assign order based on array index to maintain insertion order
    console.log('[updateSession] Processing exercises, received:', exercises);
    
    const processedExercises = exercises.map((exercise, exIndex) => {
      // Ensure valid exercise ID
      const exerciseId = (!exercise.id || exercise.id.startsWith('temp-')) 
        ? crypto.randomUUID() 
        : exercise.id;

      console.log(`[updateSession] Processing exercise ${exIndex} (${exercise.name}):`, {
        hasInstructionMode: !!exercise.instructionMode,
        hasPrescription: !!exercise.prescription,
        hasInstructions: !!exercise.instructions,
        instructionMode: exercise.instructionMode,
        prescription: exercise.prescription,
        instructions: exercise.instructions
      });

      // Build exercise object with all relevant fields
      const exerciseData: any = buildProgramExercisePayload({
        ...exercise,
        id: exerciseId
      }, exIndex, { generateIdIfMissing: true });

      console.log('[updateSession] Added instructionMode:', exerciseData.instructionMode);
      console.log('[updateSession] Added prescription:', exerciseData.prescription);
      console.log('[updateSession] Added instructions length:', exerciseData.instructions?.length);

      // Process sets data if available (for backward compatibility)
      if (exercise.setsData) {
        const setsData = exercise.setsData.map(set => ({
          reps: set.reps || exercise.reps || 10,
          weight: typeof set.weight === 'number' ? set.weight : (exercise.weight || 0),
          difficulty: set.difficulty || 'MODERATE'
        }));
        exerciseData.sets = setsData.length;
        exerciseData.reps = setsData[0]?.reps || exercise.reps || 10;
        exerciseData.weight = setsData[0]?.weight || exercise.weight || 0;
        exerciseData.setsData = setsData;
      } else if (exercise.sets || exercise.reps || exercise.weight !== undefined) {
        // Legacy format support
        const setsData = Array(exercise.sets || 3).fill({
          reps: exercise.reps || 10,
          weight: exercise.weight || 0,
          difficulty: 'MODERATE'
        });
        exerciseData.sets = setsData.length;
        exerciseData.reps = setsData[0]?.reps;
        exerciseData.weight = setsData[0]?.weight;
        exerciseData.setsData = setsData;
      }

      return exerciseData;
    });

    // Start a transaction to ensure data consistency
    const batch = writeBatch(db);

    // Update or create the session with all data
    const sessionData = removeUndefinedFields({
      exercises: processedExercises,
      updatedAt: serverTimestamp(),
      userId: user.uid,
      name: sessionDoc.exists() ? sessionDoc.data().name : 'New Session',
      notes: sessionDoc.exists() ? (sessionDoc.data().notes || '') : '',
      order: sessionDoc.exists() ? sessionDoc.data().order : 0,
      programId: programId  // Add reference to parent program
    });
    
    console.log('[updateSession] Session data after removeUndefinedFields:', JSON.stringify(sessionData, null, 2));
    console.log('[updateSession] Writing to Firestore at:', `programs/${programId}/sessions/${sessionId}`);

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

// Duplicate a program with all its sessions and exercises
export const duplicateProgram = async (programId: string): Promise<Program> => {
  try {
    const user = await ensureAuth();
    console.log('[programService] Duplicating program:', programId);

    // Get the original program
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);

    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }

    const programData = programDoc.data();
    if (programData.userId !== user.uid) {
      throw new Error('You can only duplicate your own programs');
    }

    // Fetch all sessions from the original program
    const sessionsRef = collection(programRef, 'sessions');
    const sessionsSnapshot = await getDocs(sessionsRef);
    
    const sessions = sessionsSnapshot.docs.map(sessionDoc => {
      const sessionData = sessionDoc.data();
      return {
        id: crypto.randomUUID(), // Generate new ID for duplicate
        name: sessionData.name,
        isWarmupSession: sessionData.isWarmupSession === true,
        exercises: (sessionData.exercises || []).map((ex: any) => ({
          id: crypto.randomUUID(), // Generate new ID for each exercise
          name: ex.name,
          exerciseRef: ex.exerciseRef,
          notes: ex.notes || '',
          order: ex.order,
          activityType: ex.activityType ? normalizeActivityType(ex.activityType) : undefined,
          // Preserve prescription fields
          instructionMode: ex.instructionMode,
          prescription: ex.prescription,
          instructions: ex.instructions
        })),
        notes: sessionData.notes || '',
        order: sessionData.order ?? 0,
        userId: user.uid
      };
    });

    // Create the duplicated program with "(Copy)" suffix
    const duplicatedProgram = {
      name: `${programData.name} (Copy)`,
      description: programData.description || '',
      createdBy: user.uid,
      userId: user.uid,
      sessions,
      isPublic: false,
      tags: programData.tags || []
    };

    console.log('[programService] Creating duplicate program:', {
      originalName: programData.name,
      newName: duplicatedProgram.name,
      sessionCount: sessions.length
    });

    // Create the new program
    await createProgram(duplicatedProgram);

    // Fetch and return the newly created program
    const programs = await getPrograms();
    const newProgram = programs.find(p => 
      p.name === duplicatedProgram.name && 
      p.userId === user.uid &&
      p.createdBy === user.uid
    );

    if (!newProgram) {
      throw new Error('Failed to retrieve duplicated program');
    }

    console.log('[programService] Program duplicated successfully:', newProgram.id);
    return newProgram;
  } catch (err) {
    console.error('[programService] Error duplicating program:', err);
    throw err;
  }
};

// Duplicate a session within a program
export const duplicateSession = async (programId: string, sessionId: string): Promise<ProgramSession> => {
  try {
    const user = await ensureAuth();
    console.log('[programService] Duplicating session:', { programId, sessionId });

    // Get program reference and verify ownership
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);

    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }

    const programData = programDoc.data();
    if (programData.userId !== user.uid) {
      throw new Error('You can only duplicate sessions in your own programs');
    }

    // Get the original session
    const sessionRef = doc(collection(programRef, 'sessions'), sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    const sessionData = sessionDoc.data();

    // Get all sessions to determine the new order
    const sessionsSnapshot = await getDocs(collection(programRef, 'sessions'));
    const maxOrder = Math.max(0, ...sessionsSnapshot.docs.map(doc => doc.data().order ?? 0));

    // Create duplicated session with new IDs and "(Copy)" suffix
    const duplicatedExercises = (sessionData.exercises || []).map((ex: any) => ({
      id: crypto.randomUUID(), // Generate new ID for each exercise
      name: ex.name,
      exerciseRef: ex.exerciseRef,
      notes: ex.notes || '',
      order: ex.order,
      activityType: ex.activityType ? normalizeActivityType(ex.activityType) : undefined,
      // Preserve prescription fields
      instructionMode: ex.instructionMode,
      prescription: ex.prescription,
      instructions: ex.instructions
    }));

    const newSessionData = {
      name: `${sessionData.name} (Copy)`,
      exercises: duplicatedExercises,
      isWarmupSession: sessionData.isWarmupSession === true,
      notes: sessionData.notes || '',
      order: maxOrder + 1
    };

    console.log('[programService] Creating duplicate session:', {
      originalName: sessionData.name,
      newName: newSessionData.name,
      exerciseCount: duplicatedExercises.length
    });

    // Create the new session
    const newSessionId = await createSession(programId, newSessionData);

    // Fetch and return the newly created session
    const newSessionRef = doc(collection(programRef, 'sessions'), newSessionId);
    const newSessionDoc = await getDoc(newSessionRef);

    if (!newSessionDoc.exists()) {
      throw new Error('Failed to retrieve duplicated session');
    }

    const newSessionDocData = newSessionDoc.data();
    const duplicatedSession: ProgramSession = {
      id: newSessionDoc.id,
      name: newSessionDocData.name,
      isWarmupSession: newSessionDocData.isWarmupSession === true,
      exercises: newSessionDocData.exercises || [],
      notes: newSessionDocData.notes,
      order: newSessionDocData.order,
      userId: user.uid
    };

    console.log('[programService] Session duplicated successfully:', duplicatedSession.id);
    return duplicatedSession;
  } catch (err) {
    console.error('[programService] Error duplicating session:', err);
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

type ProgramMigrationSummary = {
  scannedPrograms: number;
  updatedSessions: number;
  updatedExercises: number;
};

const speedAgilityNameSet = new Set(
  (Array.isArray(speedAgilityExercises) ? speedAgilityExercises : [])
    .map((exercise: any) => String(exercise?.name || '').trim().toLowerCase())
    .filter(Boolean)
);

const speedAgilityIdSet = new Set(
  (Array.isArray(speedAgilityExercises) ? speedAgilityExercises : [])
    .map((exercise: any) => String(exercise?.id || '').trim().toLowerCase())
    .filter(Boolean)
);

const isLikelySpeedAgilityExercise = (exercise: any): boolean => {
  const rawId = String(exercise?.id || '').trim().toLowerCase();
  const rawName = String(exercise?.name || '').trim().toLowerCase();
  const rawRef = String(exercise?.exerciseRef || '').trim().toLowerCase();
  const rawDrillType = String(exercise?.drillType || '').trim().toLowerCase();

  if (!rawId && !rawName && !rawRef && !rawDrillType) return false;
  if (speedAgilityIdSet.has(rawId) || speedAgilityNameSet.has(rawName)) return true;
  if (rawId.startsWith('sap') || rawRef.includes('sap')) return true;
  if (rawRef.includes('speedagility') || rawRef.includes('speed-agility')) return true;

  return [
    'sprint',
    'agility',
    'reaction',
    'acceleration',
    'change_of_direction',
    'change of direction',
    'ladder',
    'cone',
    'plyometric',
    'plyometrics',
  ].includes(rawDrillType);
};

const normalizeProgramExerciseForMigration = (exercise: any): { normalized: any; changed: boolean } => {
  const normalized = { ...exercise };
  let changed = false;

  const normalizedActivityType = exercise?.activityType
    ? normalizeActivityType(exercise.activityType)
    : undefined;

  if (normalizedActivityType && exercise.activityType !== normalizedActivityType) {
    normalized.activityType = normalizedActivityType;
    changed = true;
  }

  const shouldForceSpeedAgility =
    isLikelySpeedAgilityExercise(exercise) &&
    (!normalizedActivityType || normalizedActivityType === 'resistance');

  if (shouldForceSpeedAgility) {
    normalized.activityType = 'speedAgility' as ActivityType;
    changed = true;
  }

  const activityType = normalized.activityType as ActivityType | undefined;
  if (
    normalized.prescription &&
    (activityType === 'endurance' || activityType === 'sport') &&
    normalized.prescription.duration !== undefined
  ) {
    const normalizedDuration = normalizeEnduranceDurationMinutes(normalized.prescription.duration);
    if (JSON.stringify(normalizedDuration) !== JSON.stringify(normalized.prescription.duration)) {
      normalized.prescription = {
        ...normalized.prescription,
        duration: normalizedDuration,
      };
      changed = true;
    }
  }

  return { normalized, changed };
};

export const migrateLegacyProgramSessionData = async (): Promise<ProgramMigrationSummary> => {
  const summary: ProgramMigrationSummary = {
    scannedPrograms: 0,
    updatedSessions: 0,
    updatedExercises: 0,
  };

  const user = await ensureAuth();
  const programsRef = collection(db, PROGRAMS_COLLECTION);
  const programsQuery = query(programsRef, where('userId', '==', user.uid));
  const programsSnapshot = await getDocs(programsQuery);

  summary.scannedPrograms = programsSnapshot.size;

  for (const programDoc of programsSnapshot.docs) {
    const sessionsRef = collection(db, `${PROGRAMS_COLLECTION}/${programDoc.id}/sessions`);
    const sessionsSnapshot = await getDocs(sessionsRef);

    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionData = sessionDoc.data();
      const exercises = Array.isArray(sessionData.exercises) ? sessionData.exercises : [];

      let sessionChanged = false;
      let sessionExerciseUpdates = 0;

      const updatedExercises = exercises.map((exercise: any) => {
        const { normalized, changed } = normalizeProgramExerciseForMigration(exercise);
        if (changed) {
          sessionChanged = true;
          sessionExerciseUpdates += 1;
        }
        return normalized;
      });

      if (sessionChanged) {
        await updateDoc(sessionDoc.ref, {
          exercises: updatedExercises,
          updatedAt: serverTimestamp(),
        });

        summary.updatedSessions += 1;
        summary.updatedExercises += sessionExerciseUpdates;
      }
    }
  }

  console.log('[programService] Legacy program session migration summary:', summary);
  return summary;
};

// ========== PROGRAM SHARING FUNCTIONS ==========

/**
 * Share a program with specific users (e.g., team members)
 * Creates a sharedPrograms entry that links to the original program
 */
export const shareProgram = async (
  programId: string, 
  shareWithUserIds: string[],
  coachMessage?: string
): Promise<string> => {
  try {
    const user = await ensureAuth();
    const sharedByName = await resolveCurrentUserDisplayName(user.uid);
    
    console.log('[programService] Sharing program:', { programId, shareWithUserIds, coachMessage });
    
    // Get the program to share
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programSnap = await getDoc(programRef);
    
    if (!programSnap.exists()) {
      throw new Error('Program not found');
    }
    
    const programData = programSnap.data();
    
    // Verify user owns the program
    if (programData.userId !== user.uid) {
      throw new Error('You can only share programs you own');
    }
    
    // Get full program with sessions
    const sessionsRef = collection(db, `${PROGRAMS_COLLECTION}/${programId}/sessions`);
    const sessionsSnapshot = await getDocs(sessionsRef);
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const fullProgram: any = {
      id: programId,
      ...programData,
      sessions
    };
    
    // Create shared program document
    const sharedProgramRef = doc(collection(db, 'sharedPrograms'));
    const sharedProgramData = removeUndefinedFields({
      programId,
      originalProgram: fullProgram,
      sharedBy: user.uid,
      sharedByName,
      sharedWith: shareWithUserIds,
      sharedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      canEdit: false,
      isActive: true
    });
    
    // Use batch to create shared program and assignments
    const batch = writeBatch(db);
    batch.set(sharedProgramRef, sharedProgramData);
    
    // Create assignment for each user with optional coach message
    shareWithUserIds.forEach(userId => {
      const assignmentRef = doc(collection(db, 'sharedProgramAssignments'));
      const assignmentData = removeUndefinedFields({
        sharedProgramId: sharedProgramRef.id,
        programId,
        userId,
        sharedBy: user.uid,
        sharedByName,
        assignedAt: new Date().toISOString(),
        status: 'not-started',
        coachMessage: coachMessage || undefined
      });
      batch.set(assignmentRef, assignmentData);
    });
    
    await batch.commit();
    
    console.log('[programService] Program shared successfully:', sharedProgramRef.id);
    return sharedProgramRef.id;
  } catch (error) {
    console.error('[programService] Error sharing program:', error);
    throw error;
  }
};

/**
 * Get programs shared with the current user
 */
export const getSharedPrograms = async (): Promise<any[]> => {
  try {
    const user = await ensureAuth();
    
    console.log('[programService] Fetching shared programs for user:', user.uid);
    
    // Get assignments for this user (all except archived)
    const assignmentsRef = collection(db, 'sharedProgramAssignments');
    const q = query(
      assignmentsRef, 
      where('userId', '==', user.uid)
    );
    const assignmentsSnap = await getDocs(q);
    
    if (assignmentsSnap.empty) {
      console.log('[programService] No shared programs found');
      return [];
    }
    
    // Filter out archived assignments
    const activeAssignments = assignmentsSnap.docs.filter(
      doc => doc.data().status !== 'archived'
    );
    
    if (activeAssignments.length === 0) {
      console.log('[programService] No active shared programs found');
      return [];
    }
    
    // Get the shared program details for each assignment
    const sharedPrograms = await Promise.all(
      activeAssignments.map(async (assignmentDoc) => {
        const assignment = assignmentDoc.data();
        const sharedProgramRef = doc(db, 'sharedPrograms', assignment.sharedProgramId);
        const sharedProgramSnap = await getDoc(sharedProgramRef);
        
        if (!sharedProgramSnap.exists()) {
          console.warn('[programService] Shared program not found:', assignment.sharedProgramId);
          return null;
        }
        
        return {
          id: sharedProgramSnap.id,
          ...sharedProgramSnap.data(),
          sharedByName: (sharedProgramSnap.data() as any).sharedByName || assignment.sharedByName,
          assignmentId: assignmentDoc.id,
          assignmentStatus: assignment.status,
          assignedAt: assignment.assignedAt,
          coachMessage: assignment.coachMessage
        };
      })
    );
    
    // Filter out any null entries
    return sharedPrograms.filter(p => p !== null);
  } catch (error) {
    console.error('[programService] Error fetching shared programs:', error);
    throw error;
  }
};

/**
 * Copy a shared program to user's own programs
 */
export const copySharedProgram = async (sharedProgramId: string): Promise<string> => {
  try {
    const user = await ensureAuth();
    
    console.log('[programService] Copying shared program:', sharedProgramId);
    
    // Get the shared program
    const sharedProgramRef = doc(db, 'sharedPrograms', sharedProgramId);
    const sharedProgramSnap = await getDoc(sharedProgramRef);
    
    if (!sharedProgramSnap.exists()) {
      throw new Error('Shared program not found');
    }
    
    const sharedProgram = sharedProgramSnap.data();
    const originalProgram = sharedProgram.originalProgram;
    
    // Create a copy of the program for the user
    const programCopy = {
      ...originalProgram,
      id: undefined, // Remove ID so a new one is created
      userId: user.uid,
      createdBy: user.uid,
      name: `${originalProgram.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessions: originalProgram.sessions.map((session: any) => ({
        ...session,
        userId: user.uid
      }))
    };
    
    // Create the new program
    const newProgramId = await createProgram(programCopy);
    
    // Update assignment status to 'copied'
    const assignmentsRef = collection(db, 'sharedProgramAssignments');
    const q = query(
      assignmentsRef,
      where('sharedProgramId', '==', sharedProgramId),
      where('userId', '==', user.uid)
    );
    const assignmentsSnap = await getDocs(q);
    
    const batch = writeBatch(db);
    assignmentsSnap.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'copied' });
    });
    await batch.commit();
    
    console.log('[programService] Shared program copied successfully:', newProgramId);
    return newProgramId;
  } catch (error) {
    console.error('[programService] Error copying shared program:', error);
    throw error;
  }
};

/**
 * Update a shared program (only owner can do this)
 */
export const updateSharedProgram = async (sharedProgramId: string): Promise<void> => {
  try {
    const user = await ensureAuth();
    
    console.log('[programService] Updating shared program:', sharedProgramId);
    
    // Get the shared program
    const sharedProgramRef = doc(db, 'sharedPrograms', sharedProgramId);
    const sharedProgramSnap = await getDoc(sharedProgramRef);
    
    if (!sharedProgramSnap.exists()) {
      throw new Error('Shared program not found');
    }
    
    const sharedProgram = sharedProgramSnap.data();
    
    // Verify user is the owner
    if (sharedProgram.sharedBy !== user.uid) {
      throw new Error('Only the program owner can update shared programs');
    }
    
    // Get the latest version of the program
    const programId = sharedProgram.programId;
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programSnap = await getDoc(programRef);
    
    if (!programSnap.exists()) {
      throw new Error('Original program not found');
    }
    
    // Get sessions
    const sessionsRef = collection(db, `${PROGRAMS_COLLECTION}/${programId}/sessions`);
    const sessionsSnapshot = await getDocs(sessionsRef);
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const updatedProgram: any = {
      id: programId,
      ...programSnap.data(),
      sessions
    };
    
    // Update the shared program with latest data
    const updateData = removeUndefinedFields({
      originalProgram: updatedProgram,
      lastModified: new Date().toISOString()
    });
    
    await writeBatch(db).update(sharedProgramRef, updateData).commit();
    
    console.log('[programService] Shared program updated successfully');
  } catch (error) {
    console.error('[programService] Error updating shared program:', error);
    throw error;
  }
};

/**
 * Unshare a program (deactivate sharing)
 */
export const unshareProgram = async (sharedProgramId: string): Promise<void> => {
  try {
    const user = await ensureAuth();
    
    console.log('[programService] Unsharing program:', sharedProgramId);
    
    // Get the shared program
    const sharedProgramRef = doc(db, 'sharedPrograms', sharedProgramId);
    const sharedProgramSnap = await getDoc(sharedProgramRef);
    
    if (!sharedProgramSnap.exists()) {
      throw new Error('Shared program not found');
    }
    
    const sharedProgram = sharedProgramSnap.data();
    
    // Verify user is the owner
    if (sharedProgram.sharedBy !== user.uid) {
      throw new Error('Only the program owner can unshare programs');
    }
    
    // Deactivate instead of delete to maintain history
    await writeBatch(db).update(sharedProgramRef, { 
      isActive: false,
      lastModified: new Date().toISOString()
    }).commit();
    
    console.log('[programService] Program unshared successfully');
  } catch (error) {
    console.error('[programService] Error unsharing program:', error);
    throw error;
  }
};

/**
 * Update assignment status (for athletes to mark programs as started/completed)
 */
export const updateAssignmentStatus = async (
  assignmentId: string, 
  status: 'not-started' | 'in-progress' | 'completed' | 'copied' | 'archived'
): Promise<void> => {
  try {
    const user = await ensureAuth();
    
    console.log('[programService] Updating assignment status:', { assignmentId, status });
    
    const assignmentRef = doc(db, 'sharedProgramAssignments', assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);
    
    if (!assignmentSnap.exists()) {
      throw new Error('Assignment not found');
    }
    
    const assignment = assignmentSnap.data();
    
    // Verify user owns this assignment
    if (assignment.userId !== user.uid) {
      throw new Error('You can only update your own assignments');
    }
    
    const statusPatch: {
      status: 'not-started' | 'in-progress' | 'completed' | 'copied' | 'archived';
      lastViewedAt: string;
      completedAt?: string;
    } = {
      status,
      lastViewedAt: new Date().toISOString()
    };

    if (status === 'completed') {
      statusPatch.completedAt = new Date().toISOString();
    }

    await updateDoc(assignmentRef, statusPatch);
    
    console.log('[programService] Assignment status updated successfully');
  } catch (error) {
    console.error('[programService] Error updating assignment status:', error);
    throw error;
  }
};

