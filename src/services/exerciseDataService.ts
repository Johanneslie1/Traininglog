import { db, auth } from '@/services/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';
import { Prescription } from '@/types/program';

export interface ExerciseData {
  id?: string;
  exerciseName: string;
  timestamp: Date;
  userId: string;
  sets: ExerciseSet[];
  deviceId?: string;
  supersetId?: string; // Add superset support
  activityType?: ActivityType; // Add activity type support using proper enum
  sharedSessionAssignmentId?: string;
  sharedSessionId?: string;
  sharedSessionExerciseId?: string;
  sharedSessionDateKey?: string;
  sharedSessionExerciseCompleted?: boolean;
  prescription?: Prescription;
  instructionMode?: 'structured' | 'freeform';
  instructions?: string;
}

export class ExerciseDataService {
  private static STORAGE_KEY = 'exercise_logs';

  private static async ensureAuth(): Promise<string> {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    return auth.currentUser?.uid || '';
  }

  private static getDateRange(date: Date): { startOfDay: Date, endOfDay: Date } {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return { startOfDay, endOfDay };
  }

  static async saveExercise(exercise: ExerciseData): Promise<void> {
    try {
      // Ensure we have authentication
      const userId = await this.ensureAuth();

      // Save to Firebase if user is online - use the same collection structure as ExerciseLog.tsx
      if (navigator.onLine) {
        const exerciseData = {
          exerciseName: exercise.exerciseName,
          sets: exercise.sets,
          timestamp: exercise.timestamp,
          userId: exercise.userId || userId,
          deviceId: exercise.deviceId || window.navigator.userAgent,
          ...(exercise.activityType && { activityType: exercise.activityType })
        };

        if (exercise.id) {
          const docRef = doc(db, 'users', userId, 'exercises', exercise.id);
          await updateDoc(docRef, exerciseData);
        } else {
          const exercisesRef = collection(db, 'users', userId, 'exercises');
          await addDoc(exercisesRef, exerciseData);
        }
      }

      // Always save to localStorage as backup
      const existingData = this.getLocalExercises();
      const updatedData = [...existingData.filter(e => e.id !== exercise.id), { ...exercise, userId: exercise.userId || userId }];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData));

    } catch (error) {
      console.error('Error saving exercise:', error);
      // Save to local storage even if Firebase fails
      const existingData = this.getLocalExercises();
      const updatedData = [...existingData.filter(e => e.id !== exercise.id), exercise];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData));
    }
  }

  static async getExercisesByDate(date: Date, userId: string): Promise<ExerciseData[]> {
    try {
      const dateRange = this.getDateRange(date);

      // Try Firebase first if online - use the same collection structure as ExerciseLog.tsx
      if (navigator.onLine) {
        const exercisesRef = collection(db, 'users', userId, 'exercises');
        const q = query(
          exercisesRef,
          where('timestamp', '>=', dateRange.startOfDay),
          where('timestamp', '<=', dateRange.endOfDay)
        );

        const snapshot = await getDocs(q);
        const firebaseExercises = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            exerciseName: data.exerciseName,
            sets: data.sets,
            timestamp: data.timestamp.toDate(),
            userId: data.userId,
            deviceId: data.deviceId,
            ...(data.activityType && { activityType: data.activityType })
          } as ExerciseData;
        });

        // Save Firebase exercises to localStorage
        firebaseExercises.forEach(exercise => {
          this.saveExercise(exercise);
        });

        return firebaseExercises;
      }

      // Fallback to localStorage
      return this.filterExercisesByDateAndUser(this.getLocalExercises(), date, userId);

    } catch (error) {
      console.error('Error fetching exercises:', error);
      // Return local exercises as fallback
      return this.filterExercisesByDateAndUser(this.getLocalExercises(), date, userId);
    }
  }

  private static filterExercisesByDateAndUser(exercises: ExerciseData[], date: Date, userId: string): ExerciseData[] {
    const { startOfDay, endOfDay } = this.getDateRange(date);
    return exercises.filter(exercise => {
      const exerciseDate = new Date(exercise.timestamp);
      return exerciseDate >= startOfDay && 
             exerciseDate <= endOfDay && 
             exercise.userId === userId;
    });
  }

  static async syncWithFirebase(userId: string): Promise<void> {
    if (!navigator.onLine) return;

    try {
      const localExercises = this.getLocalExercises();
      const unsyncedExercises = localExercises.filter(exercise => !exercise.id && exercise.userId === userId);

      for (const exercise of unsyncedExercises) {
        await this.saveExercise(exercise);
      }
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
    }
  }

  static getLocalExercises(): ExerciseData[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];

    try {
      const exercises: ExerciseData[] = JSON.parse(data);
      return exercises.map(exercise => ({
        ...exercise,
        timestamp: new Date(exercise.timestamp)
      }));
    } catch (error) {
      console.error('Error parsing exercises from localStorage:', error);
      return [];
    }
  }

  static filterExercisesByDate(exercises: ExerciseData[], targetDate: Date): ExerciseData[] {
    const dateRange = this.getDateRange(targetDate);
    return exercises.filter(exercise => {
      const exerciseDate = new Date(exercise.timestamp);
      return exerciseDate >= dateRange.startOfDay && exerciseDate <= dateRange.endOfDay;
    });
  }
}
