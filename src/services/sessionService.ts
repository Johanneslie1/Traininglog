import type { ProgramSession, SharedSession, SharedSessionAssignment } from '@/types/program';
import { db } from './firebase/firebase';
import {
  collection,
  doc,
  FirestoreError,
  getDocs,
  query,
  where,
  writeBatch,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

const isPermissionDeniedError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const firestoreError = error as Partial<FirestoreError> & { message?: string };
  return (
    firestoreError.code === 'permission-denied' ||
    firestoreError.message?.includes('Missing or insufficient permissions') === true
  );
};

/**
 * Share a session with multiple athletes
 */
export const shareSession = async (
  sessionData: ProgramSession,
  shareWithUserIds: string[],
  coachMessage?: string,
  sourceProgramId?: string,
  sourceProgramName?: string
): Promise<string> => {
  try {
    const user = await ensureAuth();
    
    console.log('[sessionService] Sharing session:', { 
      sessionName: sessionData.name,
      shareWithUserIds, 
      coachMessage,
      sourceProgramId,
      sourceProgramName
    });
    
    if (shareWithUserIds.length === 0) {
      throw new Error('Must select at least one athlete to share with');
    }
    
    // Validate session has exercises
    if (!sessionData.exercises || sessionData.exercises.length === 0) {
      throw new Error('Session must have at least one exercise');
    }
    
    // Create shared session document
    const sharedSessionRef = doc(collection(db, 'sharedSessions'));
    const sharedSessionData = removeUndefinedFields({
      sessionId: sessionData.id,
      sessionData: sessionData,
      sharedBy: user.uid,
      sharedByName: user.uid, // TODO: Replace with actual user display name when user profiles exist
      sharedWith: shareWithUserIds,
      sharedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      canEdit: false,
      isActive: true,
      sourceProgram: sourceProgramId && sourceProgramName ? {
        programId: sourceProgramId,
        programName: sourceProgramName
      } : undefined
    });
    
    // Use batch to create shared session and assignments
    const batch = writeBatch(db);
    batch.set(sharedSessionRef, sharedSessionData);
    
    // Create assignment for each athlete with optional coach message
    shareWithUserIds.forEach(userId => {
      const assignmentRef = doc(collection(db, 'sharedSessionAssignments'));
      const assignmentData = removeUndefinedFields({
        sharedSessionId: sharedSessionRef.id,
        sessionData: sessionData,
        userId,
        sharedBy: user.uid,
        assignedAt: new Date().toISOString(),
        status: 'not-started' as const,
        coachMessage: coachMessage || undefined
      });
      batch.set(assignmentRef, assignmentData);
    });
    
    await batch.commit();
    
    console.log('[sessionService] Session shared successfully:', sharedSessionRef.id);
    return sharedSessionRef.id;
  } catch (error) {
    console.error('[sessionService] Error sharing session:', error);
    throw error;
  }
};

/**
 * Get sessions shared with the current user (athlete)
 */
export const getSharedSessionsForAthlete = async (): Promise<SharedSessionAssignment[]> => {
  try {
    const user = await ensureAuth();
    
    console.log('[sessionService] Fetching shared sessions for athlete:', user.uid);
    
    // Get assignments for this user (all except archived)
    const assignmentsRef = collection(db, 'sharedSessionAssignments');
    const q = query(
      assignmentsRef, 
      where('userId', '==', user.uid)
    );
    const assignmentsSnap = await getDocs(q);
    
    if (assignmentsSnap.empty) {
      console.log('[sessionService] No shared sessions found');
      return [];
    }
    
    // Filter out archived assignments and map to SharedSessionAssignment
    const activeAssignments = assignmentsSnap.docs
      .filter(doc => doc.data().status !== 'archived')
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SharedSessionAssignment));
    
    console.log('[sessionService] Found', activeAssignments.length, 'active shared sessions');
    return activeAssignments;
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      console.warn('[sessionService] Permission denied while fetching shared sessions. Returning empty list.');
      return [];
    }

    console.error('[sessionService] Error fetching shared sessions:', error);
    throw error;
  }
};

/**
 * Get sessions shared by the current user (coach)
 */
export const getSharedSessionsSharedByCoach = async (): Promise<SharedSession[]> => {
  try {
    const user = await ensureAuth();
    
    console.log('[sessionService] Fetching sessions shared by coach:', user.uid);
    
    // Get shared sessions created by this user
    const sharedSessionsRef = collection(db, 'sharedSessions');
    const q = query(
      sharedSessionsRef,
      where('sharedBy', '==', user.uid),
      where('isActive', '==', true)
    );
    const sessionsSnap = await getDocs(q);
    
    if (sessionsSnap.empty) {
      console.log('[sessionService] No shared sessions found');
      return [];
    }
    
    const sessions = sessionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SharedSession));
    
    console.log('[sessionService] Found', sessions.length, 'shared sessions');
    return sessions;
  } catch (error) {
    console.error('[sessionService] Error fetching coach shared sessions:', error);
    throw error;
  }
};

/**
 * Update the status of a shared session assignment
 */
export const updateSharedSessionStatus = async (
  assignmentId: string,
  status: 'not-started' | 'in-progress' | 'completed' | 'copied' | 'archived'
): Promise<void> => {
  try {
    const user = await ensureAuth();
    
    console.log('[sessionService] Updating assignment status:', { assignmentId, status });
    
    const assignmentRef = doc(db, 'sharedSessionAssignments', assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);
    
    if (!assignmentSnap.exists()) {
      throw new Error('Assignment not found');
    }
    
    const assignmentData = assignmentSnap.data();
    
    // Verify user owns this assignment
    if (assignmentData.userId !== user.uid) {
      throw new Error('You can only update your own assignments');
    }
    
    await updateDoc(assignmentRef, {
      status,
      lastViewedAt: new Date().toISOString()
    });
    
    console.log('[sessionService] Assignment status updated successfully');
  } catch (error) {
    console.error('[sessionService] Error updating assignment status:', error);
    throw error;
  }
};

/**
 * Delete a shared session (coach only)
 */
export const deleteSharedSession = async (sharedSessionId: string): Promise<void> => {
  try {
    const user = await ensureAuth();
    
    console.log('[sessionService] Deleting shared session:', sharedSessionId);
    
    // Get the shared session
    const sharedSessionRef = doc(db, 'sharedSessions', sharedSessionId);
    const sharedSessionSnap = await getDoc(sharedSessionRef);
    
    if (!sharedSessionSnap.exists()) {
      throw new Error('Shared session not found');
    }
    
    const sharedSessionData = sharedSessionSnap.data();
    
    // Verify user owns this shared session
    if (sharedSessionData.sharedBy !== user.uid) {
      throw new Error('You can only delete sessions you shared');
    }
    
    // Get all assignments for this shared session
    const assignmentsRef = collection(db, 'sharedSessionAssignments');
    const q = query(assignmentsRef, where('sharedSessionId', '==', sharedSessionId));
    const assignmentsSnap = await getDocs(q);
    
    // Use batch to delete shared session and all assignments
    const batch = writeBatch(db);
    
    // Delete the shared session
    batch.delete(sharedSessionRef);
    
    // Delete all assignments
    assignmentsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    console.log('[sessionService] Shared session and assignments deleted successfully');
  } catch (error) {
    console.error('[sessionService] Error deleting shared session:', error);
    throw error;
  }
};

/**
 * Get assignment details for a specific shared session
 */
export const getSharedSessionAssignment = async (assignmentId: string): Promise<SharedSessionAssignment | null> => {
  try {
    const user = await ensureAuth();
    
    const assignmentRef = doc(db, 'sharedSessionAssignments', assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);
    
    if (!assignmentSnap.exists()) {
      return null;
    }
    
    const assignmentData = assignmentSnap.data();
    
    // Verify user owns this assignment
    if (assignmentData.userId !== user.uid) {
      throw new Error('You can only view your own assignments');
    }
    
    return {
      id: assignmentSnap.id,
      ...assignmentData
    } as SharedSessionAssignment;
  } catch (error) {
    console.error('[sessionService] Error fetching assignment:', error);
    throw error;
  }
};

/**
 * Mark a shared session as viewed
 */
export const markSharedSessionViewed = async (assignmentId: string): Promise<void> => {
  try {
    const user = await ensureAuth();
    
    const assignmentRef = doc(db, 'sharedSessionAssignments', assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);
    
    if (!assignmentSnap.exists()) {
      throw new Error('Assignment not found');
    }
    
    const assignmentData = assignmentSnap.data();
    
    // Verify user owns this assignment
    if (assignmentData.userId !== user.uid) {
      throw new Error('You can only update your own assignments');
    }
    
    await updateDoc(assignmentRef, {
      lastViewedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[sessionService] Error marking session as viewed:', error);
    throw error;
  }
};
