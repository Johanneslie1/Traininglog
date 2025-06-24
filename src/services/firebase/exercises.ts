import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Query,
  DocumentData,
  QueryDocumentSnapshot,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';
import { Exercise, ExerciseFilter } from '@/types/exercise';

const EXERCISES_PER_PAGE = 20;

export const createExercise = async (data: Omit<Exercise, 'id'>): Promise<string> => {
  try {
    const exerciseRef = await addDoc(collection(db, 'exercises'), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return exerciseRef.id;
  } catch (error: any) {
    throw new Error(`Error creating exercise: ${error.message}`);
  }
};

export const getExercise = async (exerciseId: string): Promise<Exercise> => {
  try {
    const exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
    if (!exerciseDoc.exists()) {
      throw new Error('Exercise not found');
    }
    return { id: exerciseDoc.id, ...exerciseDoc.data() } as Exercise;
  } catch (error: any) {
    throw new Error(`Error getting exercise: ${error.message}`);
  }
};

export const searchExercises = async (
  filters: ExerciseFilter,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ exercises: Exercise[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    const exercisesRef = collection(db, 'exercises');
    let q: Query<DocumentData> = exercisesRef;
    const conditions: any[] = [];

    if (filters.type?.length) {
      conditions.push(where('type', 'in', filters.type));
    }
    if (filters.category?.length) {
      conditions.push(where('category', 'in', filters.category));
    }
    if (filters.muscles?.length) {
      conditions.push(where('primaryMuscles', 'array-contains-any', filters.muscles));
    }
    if (filters.equipment?.length) {
      conditions.push(where('equipment', 'array-contains-any', filters.equipment));
    }

    // Build query with conditions and pagination
    // Only apply conditions if there are any to prevent query errors
    if (conditions.length > 0) {
      q = query(
        q,
        ...conditions,
        orderBy('name'),
        limit(EXERCISES_PER_PAGE)
      );
    } else {
      q = query(
        q,
        orderBy('name'),
        limit(EXERCISES_PER_PAGE)
      );
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const exercises: Exercise[] = [];
    let lastVisible = null;

    querySnapshot.forEach((doc) => {
      exercises.push({ id: doc.id, ...doc.data() } as Exercise);
      lastVisible = doc;
    });

    return {
      exercises,
      lastDoc: lastVisible
    };
  } catch (error: any) {
    throw new Error(`Error searching exercises: ${error.message}`);
  }
};

export const updateExercise = async (exerciseId: string, data: Partial<Exercise>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'exercises', exerciseId), {
      ...data,
      updatedAt: new Date()
    });
  } catch (error: any) {
    throw new Error(`Error updating exercise: ${error.message}`);
  }
};

export const deleteExercise = async (exerciseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'exercises', exerciseId));
  } catch (error: any) {
    throw new Error(`Error deleting exercise: ${error.message}`);
  }
};

// Quick search for exercise suggestions
export const searchExerciseSuggestions = async (searchText: string): Promise<Exercise[]> => {
  try {
    const q = query(
      collection(db, 'exercises'),
      orderBy('name'),
      where('name', '>=', searchText),
      where('name', '<=', searchText + '\uf8ff'),
      limit(5)
    );

    const querySnapshot = await getDocs(q);
    const exercises: Exercise[] = [];

    querySnapshot.forEach((doc) => {
      exercises.push({ id: doc.id, ...doc.data() } as Exercise);
    });

    return exercises;
  } catch (error: any) {
    throw new Error(`Error searching exercise suggestions: ${error.message}`);
  }
};

export const getExerciseList = async (searchTerm?: string): Promise<Exercise[]> => {
  try {
    const exercisesRef = collection(db, 'exercises');
    let q: Query<DocumentData>;
    
    if (searchTerm) {
      // Create a case-insensitive search
      const searchTermLower = searchTerm.toLowerCase();
      q = query(
        exercisesRef,
        where('nameLower', '>=', searchTermLower),
        where('nameLower', '<=', searchTermLower + '\uf8ff'),
        limit(20)
      );
    } else {
      q = query(exercisesRef, orderBy('name'), limit(20));
    }
    
    const querySnapshot = await getDocs(q);
    const exercises: Exercise[] = [];

    querySnapshot.forEach((doc) => {
      exercises.push({ id: doc.id, ...doc.data() } as Exercise);
    });

    return exercises;
  } catch (error: any) {
    throw new Error(`Error getting exercise list: ${error.message}`);
  }
};

export const getExerciseSuggestions = async (term: string): Promise<Exercise[]> => {
  try {
    const exercisesRef = collection(db, 'exercises');
    const searchTermLower = term.toLowerCase();
    
    const q = query(
      exercisesRef,
      where('nameLower', '>=', searchTermLower),
      where('nameLower', '<=', searchTermLower + '\uf8ff'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    const exercises: Exercise[] = [];

    querySnapshot.forEach((doc) => {
      exercises.push({ id: doc.id, ...doc.data() } as Exercise);
    });

    return exercises;
  } catch (error: any) {
    throw new Error(`Error getting exercise suggestions: ${error.message}`);
  }
};
