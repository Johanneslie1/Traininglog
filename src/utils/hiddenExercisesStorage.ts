/**
 * Utility functions for managing hidden exercises state in localStorage
 */

const STORAGE_KEY = 'hiddenExercises';

/**
 * Load hidden exercises from localStorage
 */
export const loadHiddenExercises = (): Set<string> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch (error) {
    console.warn('Failed to load hidden exercises from localStorage:', error);
    return new Set();
  }
};

/**
 * Save hidden exercises to localStorage
 */
export const saveHiddenExercises = (hiddenExercises: Set<string>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(hiddenExercises)));
  } catch (error) {
    console.warn('Failed to save hidden exercises to localStorage:', error);
  }
};

/**
 * Toggle visibility of an exercise and save to localStorage
 */
export const toggleExerciseVisibility = (
  exerciseId: string,
  currentHidden: Set<string>
): Set<string> => {
  const newSet = new Set(currentHidden);
  
  if (newSet.has(exerciseId)) {
    newSet.delete(exerciseId);
  } else {
    newSet.add(exerciseId);
  }
  
  saveHiddenExercises(newSet);
  return newSet;
};

/**
 * Clean up hidden state for exercises that no longer exist
 */
export const cleanupHiddenExercises = (
  currentHidden: Set<string>,
  existingExerciseIds: Set<string>
): Set<string> => {
  const cleanedSet = new Set<string>();
  
  currentHidden.forEach(id => {
    if (existingExerciseIds.has(id)) {
      cleanedSet.add(id);
    }
  });
  
  // Only save if there were changes
  if (cleanedSet.size !== currentHidden.size) {
    saveHiddenExercises(cleanedSet);
  }
  
  return cleanedSet;
};
