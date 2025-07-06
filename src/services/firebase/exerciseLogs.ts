import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './config';
import { ExerciseLog } from '@/utils/localStorageUtils';

export const addExerciseLog = async (
  logData: Omit<ExerciseLog, 'id' | 'timestamp' | 'deviceId'>,
  selectedDate: Date
): Promise<string> => {
  try {
    console.log('📝 addExerciseLog called with:', { logData, selectedDate });
    
    if (!logData.userId) {
      throw new Error('userId is required to save exercise log');
    }

    const exerciseData = {
      ...logData,
      timestamp: selectedDate || new Date(),
      deviceId: window.navigator.userAgent,
    };

    console.log('📝 Saving exercise data to subcollection:', exerciseData);
    
    // Save to the user's exercises subcollection (not top-level exerciseLogs)
    const docRef = await addDoc(collection(db, 'users', logData.userId, 'exercises'), exerciseData);
    
    console.log('✅ Exercise saved successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding exercise log:', error);
    throw new Error('Failed to add exercise log.');
  }
};

export const deleteExerciseLog = async (logId: string, userId: string): Promise<void> => {
  try {
    console.log('🗑️ deleteExerciseLog called with:', { logId, userId });
    
    if (!userId) {
      throw new Error('userId is required to delete exercise log');
    }

    // Delete from the user's exercises subcollection
    const exerciseRef = doc(db, 'users', userId, 'exercises', logId);
    const exerciseDoc = await getDoc(exerciseRef);

    if (!exerciseDoc.exists()) {
      throw new Error('Exercise log not found.');
    }

    const exerciseData = exerciseDoc.data();
    if (exerciseData.userId !== userId) {
      throw new Error('You do not have permission to delete this exercise log.');
    }

    await deleteDoc(exerciseRef);
    console.log('✅ Exercise deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting exercise log:', error);
    throw new Error('Failed to delete exercise log.');
  }
};

export const getExerciseLogs = async (userId: string, startDate: Date, endDate: Date): Promise<ExerciseLog[]> => {
  try {
    console.log('📖 getExerciseLogs called with:', { userId, startDate, endDate });
    
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
        timestamp: data.timestamp.toDate(),
        deviceId: data.deviceId || 'legacy',
        userId: data.userId
      } as ExerciseLog;
    });

    console.log('📖 Retrieved exercises:', exercises.length);
    return exercises;
  } catch (error) {
    console.error('❌ Error fetching exercise logs:', error);
    throw new Error('Failed to fetch exercises');
  }
};
