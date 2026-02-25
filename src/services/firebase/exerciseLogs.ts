import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './config';
import { ExerciseLog } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { Prescription } from '@/types/program';
import { ExercisePrescriptionAssistantData } from '@/types/exercise';
import { ActivityType } from '@/types/activityTypes';
import { findBestOneRepMaxSet, OneRepMaxPrediction } from '@/utils/oneRepMax';

const LOCAL_EXERCISE_LOGS_KEY = 'exercise_logs';

const upsertLocalExerciseLog = (entry: ExerciseLog): void => {
  try {
    const existingRaw = localStorage.getItem(LOCAL_EXERCISE_LOGS_KEY);
    const existing: ExerciseLog[] = existingRaw ? JSON.parse(existingRaw) : [];

    const normalizedEntry = {
      ...entry,
      timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : new Date(entry.timestamp).toISOString()
    } as unknown as ExerciseLog;

    const existingIndex = existing.findIndex((log) => log.id === entry.id);
    const updated = existingIndex >= 0
      ? [...existing.slice(0, existingIndex), normalizedEntry, ...existing.slice(existingIndex + 1)]
      : [...existing, normalizedEntry];

    localStorage.setItem(LOCAL_EXERCISE_LOGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('⚠️ Failed to upsert local exercise backup:', error);
  }
};

const parseTimestamp = (value: unknown): Date => {
  if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>) && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = value ? new Date(value as string | number | Date) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const removeUndefinedFields = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields) as unknown as T;
  }

  if (obj && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    });
    return cleaned as T;
  }

  return obj;
};

type ExerciseLogInput = {
  exerciseName: string;
  userId: string;
  sets: ExerciseSet[];
  activityType?: string; // Add activity type to the input type
  isWarmup?: boolean;
  prescription?: Prescription;
  instructionMode?: 'structured' | 'freeform';
  instructions?: string;
  prescriptionAssistant?: ExercisePrescriptionAssistantData;
  sharedSessionAssignmentId?: string;
  sharedSessionId?: string;
  sharedSessionExerciseId?: string;
  sharedSessionDateKey?: string;
  sharedSessionExerciseCompleted?: boolean;
};

export const addExerciseLog = async (
  logData: ExerciseLogInput,
  selectedDate: Date,
  existingId?: string
): Promise<string> => {
  try {
    console.log('📝 addExerciseLog called with:', { logData, selectedDate, existingId });
    
    if (!logData.userId) {
      throw new Error('userId is required to save exercise log');
    }

    const exerciseData = removeUndefinedFields({
      ...logData,
      timestamp: Timestamp.fromDate(selectedDate || new Date()),
      deviceId: window.navigator.userAgent,
      userId: logData.userId,
      sets: Array.isArray(logData.sets) ? logData.sets : [], // Ensure sets is always an array
      ...(logData.activityType && { activityType: logData.activityType }), // Include activityType if provided
      ...(typeof logData.isWarmup === 'boolean' && { isWarmup: logData.isWarmup }),
      ...(logData.sharedSessionAssignmentId && { sharedSessionAssignmentId: logData.sharedSessionAssignmentId }),
      ...(logData.sharedSessionId && { sharedSessionId: logData.sharedSessionId }),
      ...(logData.sharedSessionExerciseId && { sharedSessionExerciseId: logData.sharedSessionExerciseId }),
      ...(logData.sharedSessionDateKey && { sharedSessionDateKey: logData.sharedSessionDateKey }),
      ...(typeof logData.sharedSessionExerciseCompleted === 'boolean' && {
        sharedSessionExerciseCompleted: logData.sharedSessionExerciseCompleted
      }),
      ...(logData.prescription && { prescription: logData.prescription }),
      ...(logData.instructionMode && { instructionMode: logData.instructionMode }),
      ...(logData.instructions && { instructions: logData.instructions }),
      ...(logData.prescriptionAssistant && { prescriptionAssistant: logData.prescriptionAssistant })
    });

    console.log('📝 Prepared exercise data:', exerciseData);

    let docRef;
    let docId;

    // Simplified ID management - always use the new subcollection structure
    if (existingId) {
      // Update existing document
      docRef = doc(db, 'users', logData.userId, 'exercises', existingId);
      docId = existingId;
      console.log('📝 Updating existing document:', docId);
      
      // Clean up any old location document if it exists
      try {
        const oldRef = doc(db, 'exerciseLogs', existingId);
        const oldDoc = await getDoc(oldRef);
        if (oldDoc.exists()) {
          await deleteDoc(oldRef);
          console.log('✅ Cleaned up old location document:', existingId);
        }
      } catch (error) {
        console.warn('⚠️ Could not clean up old location:', error);
      }
    } else {
      // Create new document
      docRef = doc(collection(db, 'users', logData.userId, 'exercises'));
      docId = docRef.id;
      console.log('📝 Creating new document with ID:', docId);
    }

    // Save the document
    await setDoc(docRef, exerciseData);

    upsertLocalExerciseLog({
      id: docId,
      exerciseName: logData.exerciseName,
      sets: logData.sets,
      timestamp: selectedDate || new Date(),
      deviceId: window.navigator.userAgent,
      userId: logData.userId,
      activityType: logData.activityType,
      isWarmup: logData.isWarmup,
      sharedSessionAssignmentId: logData.sharedSessionAssignmentId,
      sharedSessionId: logData.sharedSessionId,
      sharedSessionExerciseId: logData.sharedSessionExerciseId,
      sharedSessionDateKey: logData.sharedSessionDateKey,
      sharedSessionExerciseCompleted: logData.sharedSessionExerciseCompleted,
      prescription: logData.prescription,
      instructionMode: logData.instructionMode,
      instructions: logData.instructions,
      prescriptionAssistant: logData.prescriptionAssistant
    });

    console.log('✅ Exercise saved successfully with ID:', docId);
    return docId;
    
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    console.error('❌ Error adding exercise log:', {
      error,
      code: firebaseError.code,
      message: firebaseError.message,
      userId: logData.userId
    });
    
    if (firebaseError.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your authentication.');
    }

    upsertLocalExerciseLog({
      id: existingId || `local-${Date.now()}`,
      exerciseName: logData.exerciseName,
      sets: Array.isArray(logData.sets) ? logData.sets : [],
      timestamp: selectedDate || new Date(),
      deviceId: window.navigator.userAgent,
      userId: logData.userId,
      activityType: logData.activityType,
      isWarmup: logData.isWarmup,
      sharedSessionAssignmentId: logData.sharedSessionAssignmentId,
      sharedSessionId: logData.sharedSessionId,
      sharedSessionExerciseId: logData.sharedSessionExerciseId,
      sharedSessionDateKey: logData.sharedSessionDateKey,
      sharedSessionExerciseCompleted: logData.sharedSessionExerciseCompleted,
      prescription: logData.prescription,
      instructionMode: logData.instructionMode,
      instructions: logData.instructions,
      prescriptionAssistant: logData.prescriptionAssistant
    });

    throw new Error('Failed to add exercise log: ' + (firebaseError.message || 'Unknown error'));
  }
};

export const deleteExerciseLog = async (logId: string, userId: string): Promise<void> => {
  try {
    console.log('🗑️ deleteExerciseLog called with:', { logId, userId });
    
    if (!userId) {
      throw new Error('userId is required to delete exercise log');
    }

    if (!logId) {
      throw new Error('logId is required to delete exercise log');
    }

    // Try both locations - the new subcollection path and the old top-level path
    const exerciseRef = doc(db, 'users', userId, 'exercises', logId);
    const oldExerciseRef = doc(db, 'exerciseLogs', logId);

    // Try to get documents from both locations
    let exerciseDoc = null;
    let oldExerciseDoc = null;

    try {
      exerciseDoc = await getDoc(exerciseRef);
      console.log('📄 New path document check:', {
        exists: exerciseDoc.exists(),
        userId: exerciseDoc.exists() ? exerciseDoc.data()?.userId : null,
      });
    } catch (error) {
      console.warn('⚠️ Error checking new path:', error);
    }

    try {
      oldExerciseDoc = await getDoc(oldExerciseRef);
      console.log('📄 Old path document check:', {
        exists: oldExerciseDoc.exists(),
        userId: oldExerciseDoc.exists() ? oldExerciseDoc.data()?.userId : null,
      });
    } catch (error) {
      console.warn('⚠️ Error checking old path:', error);
    }

    let deleted = false;
    let errors = [];

    // Try to delete from new location first if it exists and belongs to the user
    if (exerciseDoc?.exists()) {
      const data = exerciseDoc.data();
      if (data?.userId === userId) {
        try {
          await deleteDoc(exerciseRef);
          console.log('✅ Exercise deleted from new location successfully');
          deleted = true;
        } catch (error) {
          console.error('❌ Failed to delete from new location:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`New location error: ${errorMessage}`);
        }
      } else if (data?.userId) {
        console.warn('⚠️ Document exists but belongs to different user:', {
          docUserId: data.userId,
          requestUserId: userId
        });
      }
    }

    // If not deleted yet, try old location
    if (!deleted && oldExerciseDoc?.exists()) {
      const data = oldExerciseDoc.data();
      if (data?.userId === userId) {
        try {
          await deleteDoc(oldExerciseRef);
          console.log('✅ Exercise deleted from old location successfully');
          deleted = true;
        } catch (error) {
          console.error('❌ Failed to delete from old location:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Old location error: ${errorMessage}`);
        }
      } else if (data?.userId) {
        console.warn('⚠️ Document exists but belongs to different user:', {
          docUserId: data.userId,
          requestUserId: userId
        });
      }
    }

    if (!deleted) {
      const noDocumentExists = Boolean(exerciseDoc && !exerciseDoc.exists()) && Boolean(oldExerciseDoc && !oldExerciseDoc.exists());

      if (noDocumentExists) {
        console.log('ℹ️ Exercise already removed from Firestore, skipping delete:', logId);
        return;
      }

      const errorMessage = errors.length > 0
        ? `Failed to delete exercise: ${errors.join('; ')}`
        : 'Exercise log not found or you do not have permission to delete it';

      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error deleting exercise log:', error);
    throw error instanceof Error ? error : new Error('Failed to delete exercise log');
  }
};

export const getExerciseLogs = async (userId: string, startDate: Date, endDate: Date): Promise<ExerciseLog[]> => {
  try {
    if (!userId) {
      throw new Error('userId is required to fetch exercise logs');
    }

    // Query from the user's exercises subcollection
    const exercisesRef = collection(db, 'users', userId, 'exercises');
    const q = query(
      exercisesRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const exercises = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        exerciseName: data.exerciseName,
        sets: data.sets,
        timestamp: parseTimestamp(data.timestamp),
        deviceId: data.deviceId || 'legacy',
        userId: data.userId,
        activityType: data.activityType,
        isWarmup: data.isWarmup,
        sharedSessionAssignmentId: data.sharedSessionAssignmentId,
        sharedSessionId: data.sharedSessionId,
        sharedSessionExerciseId: data.sharedSessionExerciseId,
        sharedSessionDateKey: data.sharedSessionDateKey,
        sharedSessionExerciseCompleted: data.sharedSessionExerciseCompleted,
        prescription: data.prescription,
        instructionMode: data.instructionMode,
        instructions: data.instructions,
        prescriptionAssistant: data.prescriptionAssistant
      } as ExerciseLog;
    });

    return exercises;
  } catch (error) {
    console.error('❌ Error fetching exercise logs:', error);
    throw new Error('Failed to fetch exercises');
  }
};

type BestOneRepMaxParams = {
  userId: string;
  exerciseName: string;
  sharedSessionExerciseId?: string;
};

export const getBestHistoricalOneRepMax = async ({
  userId,
  exerciseName,
  sharedSessionExerciseId,
}: BestOneRepMaxParams): Promise<OneRepMaxPrediction | null> => {
  if (!userId || !exerciseName) {
    return null;
  }

  const exercisesRef = collection(db, 'users', userId, 'exercises');
  const logsByNameQuery = query(exercisesRef, where('exerciseName', '==', exerciseName));
  const logsByNameSnapshot = await getDocs(logsByNameQuery);

  const sets: ExerciseSet[] = [];

  logsByNameSnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();

    if (data.isWarmup === true) {
      return;
    }

    if (data.activityType && data.activityType !== ActivityType.RESISTANCE) {
      return;
    }

    if (
      sharedSessionExerciseId &&
      data.sharedSessionExerciseId &&
      data.sharedSessionExerciseId !== sharedSessionExerciseId
    ) {
      return;
    }

    const logSets = Array.isArray(data.sets) ? (data.sets as ExerciseSet[]) : [];
    sets.push(...logSets);
  });

  return findBestOneRepMaxSet(sets);
};
