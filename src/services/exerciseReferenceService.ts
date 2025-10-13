/**
 * Exercise Reference Service
 * 
 * This service handles resolving exercise references in programs to full exercise data.
 * It ensures that exercises in programs always reference the main exercise database.
 */

import { Exercise } from '@/types/exercise';
import { ProgramExercise } from '@/types/program';
import { allExercises } from '@/data/exercises';
import { importedExercises } from '@/data/importedExercises';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase/config';

/**
 * Resolve a ProgramExercise reference to a full Exercise object
 */
export const resolveExerciseReference = async (programExercise: ProgramExercise): Promise<Exercise | null> => {
  try {
    const exerciseId = programExercise.id;

    // Check if it's a default exercise
    if (exerciseId.startsWith('default-')) {
      const exerciseName = exerciseId.replace('default-', '').replace(/-/g, ' ');
      const defaultExercise = allExercises.find(
        ex => ex.name.toLowerCase().replace(/\s+/g, '-') === exerciseName.toLowerCase()
      );
      
      if (defaultExercise) {
        return {
          ...defaultExercise,
          id: exerciseId
        };
      }
    }

    // Check if it's an imported exercise
    if (exerciseId.startsWith('imported-')) {
      const importedExercise = importedExercises.find(ex => ex.id === exerciseId);
      if (importedExercise) {
        return {
          ...importedExercise,
          id: exerciseId
        } as Exercise;
      }
    }

    // Check if it has a Firestore reference
    if (programExercise.exerciseRef) {
      const exerciseDoc = await getDoc(doc(db, programExercise.exerciseRef));
      if (exerciseDoc.exists()) {
        return {
          id: exerciseDoc.id,
          ...exerciseDoc.data()
        } as Exercise;
      }
    }

    // Try to fetch from Firestore directly using the ID (if it's not a temp/default/imported ID)
    if (!exerciseId.startsWith('temp-') && !exerciseId.startsWith('default-') && !exerciseId.startsWith('imported-')) {
      try {
        const exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
        if (exerciseDoc.exists()) {
          return {
            id: exerciseDoc.id,
            ...exerciseDoc.data()
          } as Exercise;
        }
      } catch (error) {
        console.warn(`[exerciseReferenceService] Could not fetch exercise from Firestore: ${exerciseId}`, error);
      }
    }

    // If we can't find the exercise, return a minimal representation
    console.warn(`[exerciseReferenceService] Could not resolve exercise reference: ${exerciseId}`);
    return null;
  } catch (error) {
    console.error('[exerciseReferenceService] Error resolving exercise reference:', error);
    return null;
  }
};

/**
 * Resolve multiple exercise references at once
 */
export const resolveExerciseReferences = async (programExercises: ProgramExercise[]): Promise<Exercise[]> => {
  const promises = programExercises.map(pe => resolveExerciseReference(pe));
  const results = await Promise.all(promises);
  return results.filter((ex): ex is Exercise => ex !== null);
};

/**
 * Validate that an exercise exists in the database
 */
export const validateExerciseExists = async (exerciseId: string): Promise<boolean> => {
  try {
    // Check default exercises
    if (exerciseId.startsWith('default-')) {
      const exerciseName = exerciseId.replace('default-', '').replace(/-/g, ' ');
      return allExercises.some(
        ex => ex.name.toLowerCase().replace(/\s+/g, '-') === exerciseName.toLowerCase()
      );
    }

    // Check imported exercises
    if (exerciseId.startsWith('imported-')) {
      return importedExercises.some(ex => ex.id === exerciseId);
    }

    // Check Firestore
    if (!exerciseId.startsWith('temp-')) {
      try {
        const exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
        return exerciseDoc.exists();
      } catch (error) {
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('[exerciseReferenceService] Error validating exercise:', error);
    return false;
  }
};

/**
 * Get exercise name from ID (cached or fetched)
 * This is useful for quick display without full data fetch
 */
export const getExerciseName = async (exerciseId: string, cachedName?: string): Promise<string> => {
  // Use cached name if available
  if (cachedName) {
    return cachedName;
  }

  try {
    // Check default exercises
    if (exerciseId.startsWith('default-')) {
      const exerciseName = exerciseId.replace('default-', '').replace(/-/g, ' ');
      const exercise = allExercises.find(
        ex => ex.name.toLowerCase().replace(/\s+/g, '-') === exerciseName.toLowerCase()
      );
      if (exercise) return exercise.name;
    }

    // Check imported exercises
    if (exerciseId.startsWith('imported-')) {
      const exercise = importedExercises.find(ex => ex.id === exerciseId);
      if (exercise) return exercise.name;
    }

    // Check Firestore
    if (!exerciseId.startsWith('temp-')) {
      const exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
      if (exerciseDoc.exists()) {
        return exerciseDoc.data().name || 'Unknown Exercise';
      }
    }

    return 'Unknown Exercise';
  } catch (error) {
    console.error('[exerciseReferenceService] Error getting exercise name:', error);
    return cachedName || 'Unknown Exercise';
  }
};
