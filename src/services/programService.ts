
// Program CRUD and utility functions (Firestore integration)
import type { Program, ProgramWeek, ProgramDay } from '@/types/program';
import { db } from './firebase/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

const PROGRAMS_COLLECTION = 'programs';

export const getPrograms = async (): Promise<Program[]> => {
  const snapshot = await getDocs(collection(db, PROGRAMS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
};

export const getProgramById = async (id: string): Promise<Program | undefined> => {
  const docRef = doc(db, PROGRAMS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Program;
  }
  return undefined;
};



// Utility: Deeply remove all undefined fields from an object or array
function removeUndefinedFields<T>(obj: T): T {
  if (Array.isArray(obj)) {
    // Recursively clean each item in the array
    return obj.map(removeUndefinedFields) as unknown as T;
  } else if (obj && typeof obj === 'object') {
    // Recursively clean each property in the object
    const cleaned: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined) {
        const cleanedValue = removeUndefinedFields(value);
        // Only add property if it's not undefined (for objects) or if it's not an empty array/object
        if (
          cleanedValue !== undefined &&
          !(Array.isArray(cleanedValue) && cleanedValue.length === 0) &&
          !(typeof cleanedValue === 'object' && cleanedValue !== null && Object.keys(cleanedValue).length === 0)
        ) {
          cleaned[key] = cleanedValue;
        }
      }
    });
    return cleaned;
  }
  return obj;
}

export const createProgram = async (program: Program): Promise<void> => {
  try {
    const docRef = doc(db, PROGRAMS_COLLECTION, program.id);
    const cleanProgram = removeUndefinedFields(program);
    console.log('[programService] setDoc for program:', cleanProgram);
    await setDoc(docRef, cleanProgram);
  } catch (err) {
    console.error('[programService] Error in createProgram:', err);
    throw err;
  }
};


// Replace the entire program document (for full updates)
export const replaceProgram = async (id: string, updated: Program): Promise<void> => {
  const docRef = doc(db, PROGRAMS_COLLECTION, id);
  const cleanProgram = removeUndefinedFields({ ...updated, updatedAt: new Date().toISOString() });
  await setDoc(docRef, cleanProgram);
};

export const deleteProgram = async (id: string): Promise<void> => {
  const docRef = doc(db, PROGRAMS_COLLECTION, id);
  await deleteDoc(docRef);
};

// Utility: Copy previous day (deep clone sessions/exercises)
export function copyPreviousDay(week: ProgramWeek, dayIndex: number): ProgramDay | null {
  if (dayIndex <= 0 || dayIndex >= week.days.length) return null;
  const prevDay = week.days[dayIndex - 1];
  // Deep clone sessions and exercises
  const newSessions = prevDay.sessions.map(session => ({
    ...session,
    id: crypto.randomUUID(),
    exercises: session.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() }))
  }));
  return {
    ...week.days[dayIndex],
    sessions: newSessions
  };
}
