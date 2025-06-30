
// Program CRUD and utility functions (Firestore integration)
import type { Program } from '@/types/program';
import { db } from './firebase/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  // updateDoc, // removed unused import
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
    return obj.map(removeUndefinedFields) as unknown as T;
  } else if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
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

// Removed copyPreviousDay utility (feature removed)
