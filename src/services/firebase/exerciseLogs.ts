import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { ExerciseLog } from '@/utils/localStorageUtils';

const COLLECTION_NAME = 'exerciseLogs';

export const deleteExerciseLog = async (logId: string, userId: string): Promise<void> => {
  try {
    // First verify the user owns this exercise
    const exerciseRef = doc(db, COLLECTION_NAME, logId);
    const exerciseDoc = await getDoc(exerciseRef);
    
    if (!exerciseDoc.exists()) {
      throw new Error('Exercise not found');
    }
    
    // Verify ownership
    const exerciseData = exerciseDoc.data();
    if (exerciseData.userId !== userId) {
      throw new Error('You do not have permission to delete this exercise');
    }
    
    // Delete from Firestore
    await deleteDoc(exerciseRef);
  } catch (error) {
    console.error('Error deleting exercise log:', error);
    throw new Error('Failed to delete exercise');
  }
};

export const getExerciseLogs = async (userId: string, startDate: Date, endDate: Date): Promise<ExerciseLog[]> => {
  try {
    const exercisesRef = collection(db, COLLECTION_NAME);
    const q = query(
      exercisesRef,
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
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
  } catch (error) {
    console.error('Error fetching exercise logs:', error);
    throw new Error('Failed to fetch exercises');
  }
};
