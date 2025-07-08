import { Exercise, ExerciseFilter, ExerciseLog } from '@/types/exercise';
import exerciseData from '@/data/generatedExercises.json';
import { getExerciseLogsByDate, saveExerciseLog } from '@/utils/localStorageUtils';

// Convert the raw exercise data to Exercise type with validation
const normalizeExercise = (ex: any): Exercise => {
  if (!ex.name) {
    throw new Error('Exercise must have a name');
  }

  return {
    id: ex.id || crypto.randomUUID(),
    name: ex.name,
    description: ex.description || '',
    type: ex.type || 'strength',
    category: ex.category || 'compound',
    primaryMuscles: Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles : [ex.primaryMuscles],
    secondaryMuscles: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : [],
    equipment: Array.isArray(ex.equipment) ? ex.equipment : [],
    instructions: Array.isArray(ex.instructions) ? ex.instructions : [],
    tips: Array.isArray(ex.tips) ? ex.tips : [],
    videoUrl: ex.videoUrl || '',
    imageUrl: ex.imageUrl || '',
    defaultUnit: ex.defaultUnit || 'kg',
    metrics: {
      trackWeight: true,
      trackReps: true,
      trackRPE: true,
      trackTime: ex.type === 'cardio',
      trackDistance: ex.type === 'cardio'
    }
  };
};

// Initialize the exercise database with error handling
const exercises: Exercise[] = (() => {
  try {
    return (exerciseData as any[]).map(normalizeExercise);
  } catch (error) {
    console.error('Error initializing exercise database:', error);
    return [];
  }
})();

// Enhanced search with fuzzy matching and relevance scoring
export const searchExercises = async (filters: ExerciseFilter): Promise<Exercise[]> => {
  try {
    let filtered = exercises;
    
    // Apply text search if provided with improved matching
    if (filters.searchText) {
      const searchTerms = filters.searchText.toLowerCase().split(' ');
      filtered = filtered.filter(ex => {
        const searchableText = [
          ex.name,
          ex.description,
          ...ex.primaryMuscles,
          ...ex.secondaryMuscles,
          ...(ex.equipment || [])
        ].map(text => text.toLowerCase()).join(' ');
        
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Apply type filter
    if (filters.type?.length) {
      filtered = filtered.filter(ex => filters.type!.includes(ex.type));
    }

    // Apply category filter
    if (filters.category?.length) {
      filtered = filtered.filter(ex => filters.category!.includes(ex.category));
    }

    // Apply muscle group filter with both primary and secondary muscles
    if (filters.muscles?.length) {
      filtered = filtered.filter(ex => 
        ex.primaryMuscles.some(m => filters.muscles!.includes(m)) ||
        ex.secondaryMuscles.some(m => filters.muscles!.includes(m))
      );
    }

    // Apply equipment filter
    if (filters.equipment?.length) {
      filtered = filtered.filter(ex =>
        ex.equipment?.some(e => filters.equipment!.includes(e)) ?? false
      );
    }

    // Sort results by relevance if search text is provided
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStartsWith = aName.startsWith(searchLower) ? -1 : 0;
        const bStartsWith = bName.startsWith(searchLower) ? -1 : 0;
        return aStartsWith - bStartsWith || aName.localeCompare(bName);
      });
    }

    return filtered;
  } catch (error) {
    console.error('Error searching exercises:', error);
    return [];
  }
};

// Get an exercise by ID with error handling
export const getExerciseById = (id: string): Exercise | undefined => {
  try {
    return exercises.find(ex => ex.id === id);
  } catch (error) {
    console.error('Error getting exercise by ID:', error);
    return undefined;
  }
};

// Get exercise suggestions with improved relevance
export const getExerciseSuggestions = async (searchText: string): Promise<Exercise[]> => {
  try {
    const results = await searchExercises({ searchText });
    return results.slice(0, 10); // Limit to top 10 most relevant results
  } catch (error) {
    console.error('Error getting exercise suggestions:', error);
    return [];
  }
};

// Enhanced copy from previous date with validation
export const copyExercisesFromDate = async (fromDate: Date, toDate: Date): Promise<boolean> => {
  try {
    const exercises = await getExerciseLogsByDate(fromDate);
    if (!exercises || exercises.length === 0) {
      console.log('No exercises found for the selected date');
      return false;
    }

    const copiedExercises = exercises.map(ex => ({
      ...ex,
      id: crypto.randomUUID(),
      timestamp: toDate,
      sets: ex.sets.map(set => ({ ...set })) // Create new set objects
    }));

    // Save all copied exercises with validation
    await Promise.all(copiedExercises.map(async (ex) => {
      try {
        await saveExerciseLog(ex);
      } catch (error) {
        console.error(`Error saving copied exercise ${ex.id}:`, error);
        throw error;
      }
    }));

    return true;
  } catch (error) {
    console.error('Error copying exercises:', error);
    return false;
  }
};

// Get exercises by category with validation
export const getExercisesByCategory = async (category: string): Promise<Exercise[]> => {
  try {
    if (!category) {
      throw new Error('Category is required');
    }
    return exercises.filter(ex => ex.category.toLowerCase() === category.toLowerCase());
  } catch (error) {
    console.error('Error getting exercises by category:', error);
    return [];
  }
};

// Copy exercises from a program
export const copyExercisesFromProgram = async (programId: string, date: Date): Promise<boolean> => {
  try {
    // Get program exercises from local storage
    const programs = JSON.parse(localStorage.getItem('programs') || '[]');
    const program = programs.find((p: any) => p.id === programId);
    
    if (!program || !program.exercises) {
      console.log('Program not found or has no exercises');
      return false;
    }

    const exercisesToCopy = program.exercises.map((ex: any) => ({
      ...ex,
      id: crypto.randomUUID(),
      timestamp: date
    }));

    // Save all program exercises
    await Promise.all(exercisesToCopy.map(async (ex: ExerciseLog) => {
      try {
        await saveExerciseLog(ex);
      } catch (error) {
        console.error(`Error saving program exercise ${ex.id}:`, error);
        throw error;
      }
    }));

    return true;
  } catch (error) {
    console.error('Error copying exercises from program:', error);
    return false;
  }
};
