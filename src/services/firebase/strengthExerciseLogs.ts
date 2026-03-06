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
import { ExerciseType } from '@/config/exerciseTypes';
import { ActivityType } from '@/types/activityTypes';

type ExerciseLogInput = {
  exerciseName: string;
  userId: string;
  sets: ExerciseSet[];
  exerciseType?: ExerciseType;
  categories?: string[];
};

// Helper function to clean undefined values from objects
const cleanObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item)).filter(item => item !== undefined && item !== null);
  }
  
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        const cleanedValue = cleanObject(value);
        if (cleanedValue !== undefined && cleanedValue !== null) {
          cleaned[key] = cleanedValue;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  return cleaned;
};

export const addExerciseLog = async (
  logData: ExerciseLogInput,
  selectedDate: Date,
  existingId?: string
): Promise<string> => {
  try {
    console.log('💪 addExerciseLog called with:', { logData, selectedDate, existingId });
    
    if (!logData.userId) {
      throw new Error('userId is required to save exercise log');
    }

    // Only allow strength and plyometric exercises in this collection
    const exerciseType = logData.exerciseType || 'strength';
    const exerciseTypeStr = exerciseType.toString();
    if (exerciseTypeStr !== 'strength' && exerciseTypeStr !== 'plyometric' && exerciseTypeStr !== 'plyometrics') {
      throw new Error(`Exercise type '${exerciseTypeStr}' should be saved to activities collection, not exercises`);
    }

    const exerciseData = cleanObject({
      ...logData,
      timestamp: Timestamp.fromDate(selectedDate || new Date()),
      deviceId: window.navigator.userAgent,
      userId: logData.userId,
      sets: Array.isArray(logData.sets) ? logData.sets.map(set => cleanObject(set)).filter(set => set && Object.keys(set).length > 0) : [],
      exerciseType: exerciseTypeStr === 'plyometrics' ? 'plyometric' : exerciseTypeStr, // Normalize plyometrics
      activityType: ActivityType.RESISTANCE,
      categories: logData.categories || []
    });

    console.log('💪 Prepared exercise data:', exerciseData);

    let docRef;
    let docId;

    // Use canonical exercises collection for strength and plyometric exercises
    if (existingId) {
      // Update existing document
      docRef = doc(db, 'users', logData.userId, 'exercises', existingId);
      docId = existingId;
      console.log('💪 Updating existing exercise:', docId);
    } else {
      // Create new document
      docRef = doc(collection(db, 'users', logData.userId, 'exercises'));
      docId = docRef.id;
      console.log('💪 Creating new exercise with ID:', docId);
    }

    // Save the document
    await setDoc(docRef, exerciseData);
    console.log('✅ Strength exercise saved successfully with ID:', docId);
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

    const exerciseRef = doc(db, 'users', userId, 'exercises', logId);

    let deleted = false;
    const errors = [];

    // Delete from canonical exercises location
    try {
      const exerciseDoc = await getDoc(exerciseRef);
      if (exerciseDoc.exists()) {
        const data = exerciseDoc.data();
        if (data?.userId === userId) {
          await deleteDoc(exerciseRef);
          console.log('✅ Exercise deleted from exercises location successfully');
          deleted = true;
        } else {
          console.warn('⚠️ Exercise exists but does not belong to user');
          errors.push('Exercise does not belong to user');
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not delete from exercises location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Exercises location error: ${errorMessage}`);
    }

    if (!deleted) {
      const errorMessage = 'Exercise not found in any location or failed to delete';
      console.error(`❌ ${errorMessage}. Errors:`, errors);
      throw new Error(`${errorMessage}: ${errors.join(', ')}`);
    }
    
    console.log('✅ Exercise deletion completed successfully');
  } catch (error) {
    console.error('❌ Error in deleteExerciseLog:', error);
    throw error instanceof Error ? error : new Error('Failed to delete exercise log');
  }
};

export const getExerciseLogs = async (userId: string, startDate: Date, endDate: Date): Promise<ExerciseLog[]> => {
  try {
    if (!userId) {
      throw new Error('userId is required to fetch exercise logs');
    }

    // Query from the canonical exercises subcollection
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
        timestamp: data.timestamp.toDate(),
        deviceId: data.deviceId || 'legacy',
        userId: data.userId,
        activityType: data.activityType || ActivityType.RESISTANCE,
        exerciseType: data.exerciseType || 'strength',
        categories: data.categories || [],
        type: data.exerciseType || data.type || 'strength'
      } as ExerciseLog;
    });

    return exercises;
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code === 'permission-denied' || firebaseError.message?.includes('Missing or insufficient permissions')) {
      console.warn('⚠️ Permission denied for exercises collection. Returning empty strength list.');
      return [];
    }

    console.error('❌ Error fetching exercise logs:', error);
    throw new Error('Failed to fetch exercises');
  }
};
