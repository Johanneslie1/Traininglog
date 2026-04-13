import { ExerciseType } from '../src/config/exerciseTypes';

// Exercise database migration utilities
interface LegacyExercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'bodyweight';
  category: 'compound' | 'isolation' | 'olympic' | 'cardio' | 'stretching' | 'power';
  primaryMuscles: string[];
  secondaryMuscles: string[];
  [key: string]: any;
}

interface ModernExercise extends Omit<LegacyExercise, 'type'> {
  type: ExerciseType;
  categories: string[];
}

/**
 * Map legacy exercise types to new exercise types
 */
export const mapLegacyTypeToModern = (legacyType: string, category: string, name: string): ExerciseType => {
  // Direct mapping for obvious cases
  switch (legacyType) {
    case 'cardio':
      return 'endurance';
    case 'flexibility':
      return 'flexibility';
    case 'bodyweight':
      // Bodyweight can be strength or plyometrics depending on the exercise
      if (name.toLowerCase().includes('jump') || 
          name.toLowerCase().includes('plyo') || 
          name.toLowerCase().includes('explosive') ||
          name.toLowerCase().includes('bounce')) {
        return 'plyometrics';
      }
      return 'strength';
    case 'strength':
      // Check if it's actually plyometric based on name/category
      if (category === 'power' || 
          name.toLowerCase().includes('jump') || 
          name.toLowerCase().includes('plyo') || 
          name.toLowerCase().includes('explosive') ||
          name.toLowerCase().includes('throw')) {
        return 'plyometrics';
      }
      return 'strength';
    default:
      return 'strength';
  }
};

/**
 * Generate categories based on exercise properties
 */
export const generateCategoriesForExercise = (exercise: LegacyExercise): string[] => {
  const categories: Set<string> = new Set();
  const { type, category, name, primaryMuscles } = exercise;
  const exerciseName = name.toLowerCase();
  
  // Type-based categories
  switch (type) {
    case 'strength':
      categories.add('Strength');
      if (category === 'compound') categories.add('Compound');
      if (category === 'isolation') categories.add('Isolation');
      if (category === 'olympic') categories.add('Olympic');
      if (category === 'power') categories.add('Power');
      break;
      
    case 'cardio':
      categories.add('Endurance');
      if (exerciseName.includes('run')) categories.add('Running');
      if (exerciseName.includes('cycle') || exerciseName.includes('bike')) categories.add('Cycling');
      if (exerciseName.includes('swim')) categories.add('Swimming');
      if (exerciseName.includes('walk')) categories.add('Walking');
      if (exerciseName.includes('row')) categories.add('Rowing');
      break;
      
    case 'flexibility':
      categories.add('Flexibility');
      if (exerciseName.includes('static')) categories.add('Static');
      if (exerciseName.includes('dynamic')) categories.add('Dynamic');
      if (exerciseName.includes('pnf')) categories.add('PNF');
      if (exerciseName.includes('yoga')) categories.add('Yoga');
      if (exerciseName.includes('mobility')) categories.add('Mobility');
      break;
      
    case 'bodyweight':
      // Can be strength or plyometrics
      if (exerciseName.includes('jump') || exerciseName.includes('plyo')) {
        categories.add('Plyometrics');
        categories.add('Jump');
      } else {
        categories.add('Strength');
        categories.add('Bodyweight');
      }
      break;
  }
  
  // Sport-specific categories
  const sportKeywords = {
    'football': 'Football',
    'basketball': 'Basketball',
    'soccer': 'Soccer',
    'volleyball': 'Volleyball',
    'hockey': 'Hockey',
    'rugby': 'Rugby',
    'tennis': 'Tennis',
    'baseball': 'Baseball',
    'golf': 'Golf'
  };
  
  Object.entries(sportKeywords).forEach(([keyword, category]) => {
    if (exerciseName.includes(keyword)) {
      categories.add('Team Sports');
      categories.add(category);
    }
  });
  
  // Plyometric indicators
  const plyoKeywords = ['jump', 'hop', 'bound', 'leap', 'plyo', 'explosive', 'reactive', 'bounce', 'throw'];
  if (plyoKeywords.some(keyword => exerciseName.includes(keyword))) {
    categories.add('Plyometrics');
    if (exerciseName.includes('jump')) categories.add('Jump');
    if (exerciseName.includes('throw')) categories.add('Throw');
    if (exerciseName.includes('reactive')) categories.add('Reactive');
  }
  
  // Muscle group specific categories (if no other categories found)
  if (categories.size === 0) {
    if (primaryMuscles.some(muscle => ['chest', 'shoulders', 'triceps', 'biceps'].includes(muscle))) {
      categories.add('Upper Body');
    }
    if (primaryMuscles.some(muscle => ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(muscle))) {
      categories.add('Lower Body');
    }
    if (primaryMuscles.includes('core')) {
      categories.add('Core');
    }
  }
  
  // Ensure at least one category
  if (categories.size === 0) {
    categories.add('General');
  }
  
  return Array.from(categories);
};

/**
 * Migrate a single exercise from legacy format to modern format
 */
export const migrateExercise = (legacyExercise: LegacyExercise): ModernExercise => {
  const modernType = mapLegacyTypeToModern(legacyExercise.type, legacyExercise.category, legacyExercise.name);
  const categories = generateCategoriesForExercise(legacyExercise);
  
  return {
    ...legacyExercise,
    type: modernType,
    categories
  };
};

/**
 * Batch migrate exercises
 */
export const migrateExerciseDatabase = (legacyExercises: LegacyExercise[]): ModernExercise[] => {
  console.log(`Starting migration of ${legacyExercises.length} exercises...`);
  
  const migratedExercises = legacyExercises.map((exercise, index) => {
    try {
      const migrated = migrateExercise(exercise);
      console.log(`Migrated ${index + 1}/${legacyExercises.length}: ${exercise.name} -> ${migrated.type} (${migrated.categories.join(', ')})`);
      return migrated;
    } catch (error) {
      console.error(`Failed to migrate exercise: ${exercise.name}`, error);
      // Return with defaults if migration fails
      return {
        ...exercise,
        type: 'strength' as ExerciseType,
        categories: ['General']
      };
    }
  });
  
  console.log('Migration completed!');
  return migratedExercises;
};

/**
 * Validation function to ensure migrated exercises are valid
 */
export const validateMigratedExercise = (exercise: ModernExercise): boolean => {
  const validTypes: ExerciseType[] = ['strength', 'plyometrics', 'endurance', 'teamSports', 'flexibility', 'other'];
  
  if (!validTypes.includes(exercise.type)) {
    console.warn(`Invalid exercise type: ${exercise.type} for exercise: ${exercise.name}`);
    return false;
  }
  
  if (!exercise.categories || exercise.categories.length === 0) {
    console.warn(`No categories found for exercise: ${exercise.name}`);
    return false;
  }
  
  return true;
};

/**
 * Generate migration report
 */
export const generateMigrationReport = (originalExercises: LegacyExercise[], migratedExercises: ModernExercise[]) => {
  const report = {
    total: originalExercises.length,
    migrated: migratedExercises.length,
    typeDistribution: {} as Record<ExerciseType, number>,
    categoryDistribution: {} as Record<string, number>,
    errors: [] as string[]
  };
  
  migratedExercises.forEach(exercise => {
    // Count types
    report.typeDistribution[exercise.type] = (report.typeDistribution[exercise.type] || 0) + 1;
    
    // Count categories
    exercise.categories.forEach(category => {
      report.categoryDistribution[category] = (report.categoryDistribution[category] || 0) + 1;
    });
    
    // Validate
    if (!validateMigratedExercise(exercise)) {
      report.errors.push(`Invalid exercise: ${exercise.name}`);
    }
  });
  
  console.log('Migration Report:');
  console.log(`Total exercises: ${report.total}`);
  console.log(`Successfully migrated: ${report.migrated}`);
  console.log(`Errors: ${report.errors.length}`);
  console.log('\nType distribution:');
  Object.entries(report.typeDistribution).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log('\nCategory distribution:');
  Object.entries(report.categoryDistribution).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });
  
  if (report.errors.length > 0) {
    console.log('\nErrors:');
    report.errors.forEach(error => console.log(`  ${error}`));
  }
  
  return report;
};
