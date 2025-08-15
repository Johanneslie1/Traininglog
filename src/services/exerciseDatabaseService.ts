import { Exercise } from '../types/exercise';
import { ActivityType } from '../types/activityTypes';

// Import JSON exercise databases for new activity types
import enduranceExercises from '../data/exercises/endurance.json';
import sportsExercises from '../data/exercises/sports.json';
import flexibilityExercises from '../data/exercises/flexibility.json';
import speedAgilityExercises from '../data/exercises/speedAgility.json';
import otherActivitiesExercises from '../data/exercises/other.json';

// Import your existing resistance training system
import { allExercises } from '../data/exercises';

// Convert JSON exercise to internal Exercise type
function convertToExercise(jsonExercise: any): Exercise {
  // Normalize activity type casing (JSON may use uppercase enum-like strings)
  const rawActivityType: string = (jsonExercise.activityType || jsonExercise.type || '').toString();
  const normalizedActivityType = rawActivityType.toLowerCase(); // Match ActivityType enum values

  return {
    id: jsonExercise.id,
    name: jsonExercise.name,
    category: jsonExercise.category,
    description: jsonExercise.description || '',
    type: jsonExercise.type || normalizedActivityType,
    activityType: normalizedActivityType as ActivityType,
    difficulty: jsonExercise.difficulty || 'intermediate',
    equipment: jsonExercise.equipment || [],
    instructions: jsonExercise.instructions || [],
    tips: jsonExercise.tips || [],
    tags: jsonExercise.tags || [],
    isDefault: jsonExercise.isDefault !== undefined ? jsonExercise.isDefault : true,
    createdBy: 'system',
    // Activity-specific fields
    primaryMuscles: jsonExercise.primaryMuscles || [],
    secondaryMuscles: jsonExercise.secondaryMuscles || [],
    targetAreas: jsonExercise.targetAreas || [],
    primaryMetrics: jsonExercise.primaryMetrics || [],
    optionalMetrics: jsonExercise.optionalMetrics || [],
    skills: jsonExercise.skills || [],
    // Metrics
    defaultUnit: jsonExercise.defaultUnit || 'time',
    metrics: jsonExercise.metrics || {},
    // Sport-specific
    teamBased: jsonExercise.teamBased || false,
    sportType: jsonExercise.sportType,
    // Speed & Agility specific
    drillType: jsonExercise.drillType,
    space: jsonExercise.space,
    // Environment and setup
    environment: jsonExercise.environment,
    setup: jsonExercise.setup || [],
    // Metadata
    userId: undefined
  };
}

// Load and convert all exercise databases
let cachedExercises: Record<ActivityType, Exercise[]> | null = null;

export function loadExerciseDatabases(): Record<ActivityType, Exercise[]> {
  if (cachedExercises) return cachedExercises;

  const loaded: Record<ActivityType, Exercise[]> = {
    [ActivityType.RESISTANCE]: [],
    [ActivityType.ENDURANCE]: [],
    [ActivityType.SPORT]: [],
    [ActivityType.STRETCHING]: [],
    [ActivityType.SPEED_AGILITY]: [],
    [ActivityType.OTHER]: []
  };

  try {
    if (Array.isArray(allExercises)) {
      loaded[ActivityType.RESISTANCE] = allExercises.map(ex => ({
        ...ex,
        id: `resistance-${ex.name.replace(/\s+/g, '-').toLowerCase()}`,
        activityType: ActivityType.RESISTANCE,
        createdBy: 'system'
      }));
    }
    if (Array.isArray(enduranceExercises)) {
      loaded[ActivityType.ENDURANCE] = enduranceExercises.map(convertToExercise);
    }
    if (Array.isArray(sportsExercises)) {
      loaded[ActivityType.SPORT] = sportsExercises.map(convertToExercise);
    }
    if (Array.isArray(flexibilityExercises)) {
      loaded[ActivityType.STRETCHING] = flexibilityExercises.map(convertToExercise);
    }
    if (Array.isArray(speedAgilityExercises)) {
      loaded[ActivityType.SPEED_AGILITY] = speedAgilityExercises.map(convertToExercise);
    }
    if (Array.isArray(otherActivitiesExercises)) {
      loaded[ActivityType.OTHER] = otherActivitiesExercises.map(convertToExercise);
    }
  } catch (err) {
    console.error('Error loading exercise databases:', err);
  }

  cachedExercises = loaded;
  return loaded;
}

// Get exercises by activity type
export function getExercisesByActivityType(activityType: ActivityType): Exercise[] {
  const allExercises = loadExerciseDatabases();
  return allExercises[activityType] || [];
}

// Get exercises by category within an activity type
export function getExercisesByCategory(activityType: ActivityType, category: string): Exercise[] {
  const exercises = getExercisesByActivityType(activityType);
  return exercises.filter(exercise => exercise.category === category);
}

// Search exercises across all types
export function searchExercises(query: string, activityTypes?: ActivityType[]): Exercise[] {
  const allExercises = loadExerciseDatabases();
  const searchTerms = query.toLowerCase().split(' ');
  
  const typesToSearch = activityTypes || Object.values(ActivityType);
  let results: Exercise[] = [];
  
  typesToSearch.forEach(type => {
    const exercises = allExercises[type] || [];
    const matchingExercises = exercises.filter(exercise => {
      // Only search in exercise name
      const exerciseName = exercise.name.toLowerCase();
      
      // Check if all search terms are found in the exercise name
      return searchTerms.every(term => exerciseName.includes(term));
    });
    
    results = [...results, ...matchingExercises];
  });
  
  // Sort results by relevance
  const query_lower = query.toLowerCase();
  results.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    // Exact match comes first
    if (aName === query_lower && bName !== query_lower) return -1;
    if (bName === query_lower && aName !== query_lower) return 1;
    
    // Starts with query comes second
    if (aName.startsWith(query_lower) && !bName.startsWith(query_lower)) return -1;
    if (bName.startsWith(query_lower) && !aName.startsWith(query_lower)) return 1;
    
    // Alphabetical order for the rest
    return aName.localeCompare(bName);
  });
  
  // Limit results to prevent too many matches
  return results.slice(0, 30);
}

// Get exercise categories for an activity type
export function getExerciseCategories(activityType: ActivityType): Record<string, { name: string; description: string; icon: string }> {
  const databases: Record<string, any> = {
    [ActivityType.ENDURANCE]: enduranceExercises,
    [ActivityType.SPORT]: sportsExercises,
    [ActivityType.STRETCHING]: flexibilityExercises,
    [ActivityType.SPEED_AGILITY]: speedAgilityExercises,
    [ActivityType.OTHER]: otherActivitiesExercises
  };
  
  const database = databases[activityType];
  return database?.categories || {};
}

// Get database metadata
export function getDatabaseMetadata(activityType: ActivityType) {
  const databases: Record<string, any> = {
    [ActivityType.ENDURANCE]: enduranceExercises,
    [ActivityType.SPORT]: sportsExercises,
    [ActivityType.STRETCHING]: flexibilityExercises,
    [ActivityType.SPEED_AGILITY]: speedAgilityExercises,
    [ActivityType.OTHER]: otherActivitiesExercises
  };
  
  return databases[activityType]?.metadata;
}

// Initialize exercise databases (call this at app startup)
export function initializeExerciseDatabases(): void {
  try {
    const loadedExercises = loadExerciseDatabases();
    const totalExercises = Object.values(loadedExercises).reduce(
      (total, exercises) => total + exercises.length, 
      0
    );
    
    console.log(`Exercise databases initialized successfully`);
    console.log(`Total exercises loaded: ${totalExercises}`);
    
    // Log summary by type
    Object.entries(loadedExercises).forEach(([type, exercises]) => {
      if (exercises.length > 0) {
        console.log(`- ${type}: ${exercises.length} exercises`);
      }
    });
    
  } catch (error) {
    console.error('Failed to initialize exercise databases:', error);
  }
}

export default {
  loadExerciseDatabases,
  getExercisesByActivityType,
  getExercisesByCategory,
  searchExercises,
  getExerciseCategories,
  getDatabaseMetadata,
  initializeExerciseDatabases
};
