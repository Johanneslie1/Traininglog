import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { ExerciseLog } from '@/types/exercise';

export const getExercisesByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ExerciseLog[]> => {
  console.log('🔍 Getting exercises by date range:', {
    userId,
    start: startDate.toISOString(),
    end: endDate.toISOString()
  });

  if (!userId) {
    console.warn('⚠️ No userId provided');
    return [];
  }

  try {
    // Create proper Firestore timestamps
    const start = Timestamp.fromDate(startDate);
    const end = Timestamp.fromDate(endDate);

    // Query from user's exercises subcollection
    const exercisesRef = collection(db, 'users', userId, 'exercises');
    const q = query(
      exercisesRef,
      where('timestamp', '>=', start),
      where('timestamp', '<=', end)
    );

    const snapshot = await getDocs(q);
    const exercises = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        exerciseName: data.exerciseName,
        sets: data.sets || [],
        timestamp: data.timestamp.toDate(),
        deviceId: data.deviceId || '',
        userId: userId
      } as ExerciseLog;
    });

    console.log(`✅ Found ${exercises.length} exercises in Firebase`);
    return exercises;
  } catch (error) {
    console.error('❌ Error fetching exercises from Firebase:', error);
    return [];
  }
};
