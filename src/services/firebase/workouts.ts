import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

export interface Exercise {
  id: string;
  name: string;
  sets: {
    reps: number;
    weight?: number;
    rpe?: number;
    notes?: string;
  }[];
}

export interface WorkoutData {
  userId: string;
  date: string;
  exercises: Exercise[];
  notes?: string;
  totalVolume: number;
  sessionRPE: number;
  status: 'planned' | 'in-progress' | 'completed';
}

export const createWorkout = async (data: WorkoutData) => {
  try {
    const workoutRef = await addDoc(collection(db, 'trainingSessions'), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return workoutRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getWorkout = async (workoutId: string) => {
  try {
    const workoutDoc = await getDoc(doc(db, 'trainingSessions', workoutId));
    
    if (!workoutDoc.exists()) {
      throw new Error('Workout not found');
    }

    return {
      id: workoutDoc.id,
      ...workoutDoc.data()
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateWorkout = async (workoutId: string, data: Partial<WorkoutData>) => {
  try {
    await updateDoc(doc(db, 'trainingSessions', workoutId), {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const deleteWorkout = async (workoutId: string) => {
  try {
    await deleteDoc(doc(db, 'trainingSessions', workoutId));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getUserWorkouts = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'trainingSessions'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const workouts: (WorkoutData & { id: string })[] = [];

    querySnapshot.forEach((doc) => {
      workouts.push({
        id: doc.id,
        ...doc.data() as WorkoutData
      });
    });

    return workouts;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
