import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { Program, CreateProgramInput, UpdateProgramInput } from '../../types/program';
import { getExercise } from './exercises';

const PROGRAMS_COLLECTION = 'programs';

export const createProgram = async (input: CreateProgramInput, userId: string): Promise<Program> => {
  try {
    const programData = {
      ...input,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      exercises: input.exercises || []
    };

    const docRef = await addDoc(collection(db, PROGRAMS_COLLECTION), programData);
    
    return {
      id: docRef.id,
      ...programData,      exercises: await Promise.all(programData.exercises.map(async (ex) => ({
        ...ex,
        exercise: await getExercise(ex.exerciseId)
      }))),
      createdAt: new Date(),
      updatedAt: new Date()
    } as Program;
  } catch (error) {
    console.error('Error creating program:', error);
    throw new Error('Failed to create program');
  }
};

export const updateProgram = async (input: UpdateProgramInput): Promise<void> => {
  try {
    const docRef = doc(db, PROGRAMS_COLLECTION, input.id);    const { id, ...updateData } = input;
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating program:', error);
    throw new Error('Failed to update program');
  }
};

export const deleteProgram = async (programId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, PROGRAMS_COLLECTION, programId));
  } catch (error) {
    console.error('Error deleting program:', error);
    throw new Error('Failed to delete program');
  }
};

export const getUserPrograms = async (userId: string): Promise<Program[]> => {
  try {
    const q = query(collection(db, PROGRAMS_COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const programs = await Promise.all(querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        exercises: await Promise.all(
          (data.exercises || []).map(async (ex: any) => ({
            ...ex,
            exercise: await getExercise(ex.exerciseId)
          }))
        )
      } as Program;
    }));

    return programs;
  } catch (error) {
    console.error('Error fetching user programs:', error);
    throw new Error('Failed to fetch programs');
  }
};
