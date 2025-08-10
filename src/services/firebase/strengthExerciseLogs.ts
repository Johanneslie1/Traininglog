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
      categories: logData.categories || []
    });

    console.log('💪 Prepared exercise data:', exerciseData);

    let docRef;
    let docId;

    // Use strengthExercises collection for strength and plyometric exercises
    if (existingId) {
      // Update existing document
      docRef = doc(db, 'users', logData.userId, 'strengthExercises', existingId);
      docId = existingId;
      console.log('💪 Updating existing strength exercise:', docId);
      
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
      docRef = doc(collection(db, 'users', logData.userId, 'strengthExercises'));
      docId = docRef.id;
      console.log('💪 Creating new strength exercise with ID:', docId);
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

    // Try all locations - the new strengthExercises path, legacy exercises path, and old top-level path
    const exerciseRef = doc(db, 'users', userId, 'strengthExercises', logId);
    const legacyExerciseRef = doc(db, 'users', userId, 'exercises', logId);
    const oldExerciseRef = doc(db, 'exerciseLogs', logId);

    let deleted = false;
    const errors = [];

    // Try to delete from new strengthExercises location first
    try {
      const exerciseDoc = await getDoc(exerciseRef);
      if (exerciseDoc.exists()) {
        const data = exerciseDoc.data();
        if (data?.userId === userId) {
          await deleteDoc(exerciseRef);
          console.log('✅ Exercise deleted from strengthExercises location successfully');
          deleted = true;
        } else {
          console.warn('⚠️ Exercise exists in strengthExercises but does not belong to user');
          errors.push('Exercise does not belong to user');
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not delete from strengthExercises location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`StrengthExercises location error: ${errorMessage}`);
    }

    // Try to delete from legacy exercises location if not deleted
    if (!deleted) {
      try {
        const legacyExerciseDoc = await getDoc(legacyExerciseRef);
        if (legacyExerciseDoc.exists()) {
          const data = legacyExerciseDoc.data();
          if (data?.userId === userId) {
            await deleteDoc(legacyExerciseRef);
            console.log('✅ Exercise deleted from legacy exercises location successfully');
            deleted = true;
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not delete from legacy exercises location:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Legacy exercises location error: ${errorMessage}`);
      }
    }

    // Try to delete from old location if not deleted
    if (!deleted) {
      try {
        const oldExerciseDoc = await getDoc(oldExerciseRef);
        if (oldExerciseDoc.exists()) {
          const data = oldExerciseDoc.data();
          if (data?.userId === userId) {
            await deleteDoc(oldExerciseRef);
            console.log('✅ Exercise deleted from old location successfully');
            deleted = true;
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not delete from old location:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Old location error: ${errorMessage}`);
      }
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
    console.log('📖 getExerciseLogs called with:', { 
      userId, 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });
    
    if (!userId) {
      throw new Error('userId is required to fetch exercise logs');
    }

    // Query from the user's strengthExercises subcollection
    const exercisesRef = collection(db, 'users', userId, 'strengthExercises');
    const q = query(
      exercisesRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    console.log('📖 StrengthExercises query returned', querySnapshot.docs.length, 'documents');
    
    const exercises = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('📖 Processing strength exercise document:', doc.id, {
        exerciseName: data.exerciseName,
        exerciseType: data.exerciseType,
        timestamp: data.timestamp?.toDate?.()?.toISOString(),
        categories: data.categories
      });
      
      return {
        id: doc.id,
        exerciseName: data.exerciseName,
        sets: data.sets,
        timestamp: data.timestamp.toDate(),
        deviceId: data.deviceId || 'legacy',
        userId: data.userId,
        exerciseType: data.exerciseType || 'strength',
        categories: data.categories || [],
        type: data.exerciseType || data.type || 'strength'
      } as ExerciseLog;
    });

    console.log('📖 Retrieved strength exercises:', exercises.length);
    return exercises;
  } catch (error) {
    console.error('❌ Error fetching exercise logs:', error);
    throw new Error('Failed to fetch exercises');
  }
};
