import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase/config';
import { UnifiedExerciseLog, UnifiedExerciseLogInput } from '@/types/session';
import { getFirestoreCollection } from '@/config/trainingTypeConfig';
import { TrainingType } from '@/types/exercise';

export class UnifiedExerciseService {
  /**
   * Save a new exercise log (handles both strength & activities)
   */
  static async saveExerciseLog(
    userId: string,
    exerciseLog: UnifiedExerciseLogInput
  ): Promise<UnifiedExerciseLog> {
    const collectionName = getFirestoreCollection(exerciseLog.trainingType);
    const collectionRef = collection(db, 'users', userId, collectionName);

    const docData = {
      exerciseName: exerciseLog.exerciseName,
      exerciseId: exerciseLog.exerciseId || null,
      trainingType: exerciseLog.trainingType,
      sets: exerciseLog.sets,
      timestamp: Timestamp.now(),
      userId,
      notes: exerciseLog.notes || null,
      deviceId: localStorage.getItem('device_id') || null,
      // Legacy fields
      activityType: exerciseLog.trainingType,
      exerciseType: exerciseLog.trainingType
    };

    const docRef = await addDoc(collectionRef, docData);

    return {
      id: docRef.id,
      userId,
      exerciseName: exerciseLog.exerciseName,
      exerciseId: exerciseLog.exerciseId,
      trainingType: exerciseLog.trainingType,
      sets: exerciseLog.sets,
      timestamp: new Date(),
      notes: exerciseLog.notes
    } as UnifiedExerciseLog;
  }

  /**
   * Update an existing exercise log
   */
  static async updateExerciseLog(
    userId: string,
    exerciseLog: UnifiedExerciseLog
  ): Promise<void> {
    const collectionName = getFirestoreCollection(exerciseLog.trainingType);
    const docRef = doc(db, 'users', userId, collectionName, exerciseLog.id);

    await updateDoc(docRef, {
      exerciseName: exerciseLog.exerciseName,
      sets: exerciseLog.sets,
      notes: exerciseLog.notes,
      trainingType: exerciseLog.trainingType
    });
  }

  /**
   * Delete an exercise log
   */
  static async deleteExerciseLog(
    userId: string,
    exerciseId: string,
    trainingType: TrainingType
  ): Promise<void> {
    const collectionName = getFirestoreCollection(trainingType);
    const docRef = doc(db, 'users', userId, collectionName, exerciseId);
    await deleteDoc(docRef);
  }

  /**
   * Get all exercises for a date (strength + activities)
   */
  static async getExercisesByDate(
    userId: string,
    date: Date
  ): Promise<UnifiedExerciseLog[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const allExercises: UnifiedExerciseLog[] = [];

    try {
      // Fetch from exercises collection (strength)
      const strengthRef = collection(db, 'users', userId, 'exercises');
      const strengthQ = query(
        strengthRef,
        where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay))
      );
      const strengthSnap = await getDocs(strengthQ);
      strengthSnap.forEach(doc => {
        const data = doc.data();
        allExercises.push({
          id: doc.id,
          exerciseName: data.exerciseName,
          exerciseId: data.exerciseId,
          trainingType: data.trainingType || TrainingType.STRENGTH,
          sets: data.sets || [],
          timestamp: data.timestamp.toDate(),
          userId,
          notes: data.notes,
          deviceId: data.deviceId
        } as UnifiedExerciseLog);
      });
    } catch (error) {
      console.warn('Error fetching strength exercises:', error);
    }

    try {
      // Fetch from activity-logs collection
      const activitiesRef = collection(db, 'users', userId, 'activity-logs');
      const activitiesQ = query(
        activitiesRef,
        where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay))
      );
      const activitiesSnap = await getDocs(activitiesQ);
      activitiesSnap.forEach(doc => {
        const data = doc.data();
        allExercises.push({
          id: doc.id,
          exerciseName: data.activityName || data.exerciseName,
          exerciseId: data.exerciseId,
          trainingType: data.trainingType,
          sets: data.sets || [],
          timestamp: data.timestamp.toDate(),
          userId,
          notes: data.notes,
          deviceId: data.deviceId
        } as UnifiedExerciseLog);
      });
    } catch (error) {
      console.warn('Error fetching activity logs:', error);
    }

    return allExercises.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}
