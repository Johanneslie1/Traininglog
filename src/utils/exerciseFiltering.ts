import { Exercise } from '../types/exercise';

/**
 * Unified exercise filtering function for training types
 * This ensures consistent filtering across all components
 */
export function filterExercisesByTrainingType(exercises: Exercise[], trainingType: string): Exercise[] {
  return exercises.filter(exercise => exerciseMatchesTrainingType(exercise, trainingType));
}

/**
 * Determines if an exercise matches a specific training type
 * Uses a combination of exercise.type, exercise.category, and keyword matching
 */
export function exerciseMatchesTrainingType(exercise: Exercise, trainingType: string): boolean {
  const name = exercise.name.toLowerCase();
  const description = exercise.description?.toLowerCase() || '';

  switch (trainingType) {
    case 'strength':
      return exercise.type === 'strength';

    case 'plyometrics':
      return (
        exercise.type === 'plyometrics' || 
        exercise.category === 'power' ||
        name.includes('plyometric') ||
        name.includes('jump') ||
        name.includes('hop') ||
        name.includes('explosive') ||
        name.includes('agility') ||
        name.includes('speed') ||
        name.includes('sprint') ||
        description.includes('plyometric') ||
        description.includes('explosive') ||
        description.includes('agility') ||
        description.includes('speed')
      );

    case 'endurance':
      return (
        exercise.type === 'endurance' || 
        exercise.type === 'cardio' ||
        exercise.category === 'cardio' ||
        name.includes('run') ||
        name.includes('bike') ||
        name.includes('cycling') ||
        name.includes('treadmill') ||
        name.includes('rowing') ||
        name.includes('swimming') ||
        name.includes('cardio') ||
        name.includes('walking') ||
        description.includes('endurance') ||
        description.includes('aerobic') ||
        description.includes('cardio')
      );

    case 'teamSports':
      return (
        exercise.type === 'teamSports' ||
        description.includes('basketball') ||
        description.includes('football') ||
        description.includes('american football') ||
        description.includes('soccer') ||
        description.includes('volleyball') ||
        description.includes('baseball') ||
        description.includes('cricket') ||
        description.includes('rugby') ||
        description.includes('handball') ||
        description.includes('hockey') ||
        description.includes('tennis') ||
        description.includes('sport') ||
        name.includes('sport') ||
        name.includes('basketball') ||
        name.includes('football') ||
        name.includes('soccer') ||
        name.includes('volleyball') ||
        name.includes('baseball') ||
        name.includes('cricket') ||
        name.includes('rugby') ||
        name.includes('handball') ||
        name.includes('hockey') ||
        name.includes('lateral')
      );

    case 'flexibility':
      return (
        exercise.type === 'flexibility' || 
        exercise.category === 'stretching' ||
        name.includes('stretch') ||
        name.includes('mobility') ||
        name.includes('yoga') ||
        description.includes('stretch') ||
        description.includes('flexibility') ||
        description.includes('mobility')
      );

    case 'bodyweight':
      return exercise.type === 'bodyweight';

    case 'other':
      return (
        exercise.type === 'other' ||
        name.includes('hiking') ||
        name.includes('walking') ||
        name.includes('climbing') ||
        name.includes('bouldering') ||
        name.includes('mountain biking') ||
        name.includes('trail running') ||
        name.includes('kayaking') ||
        name.includes('skiing') ||
        name.includes('snowboarding') ||
        name.includes('surfing') ||
        name.includes('outdoor') ||
        description.includes('outdoor') ||
        description.includes('climbing') ||
        description.includes('hiking') ||
        description.includes('skiing') ||
        description.includes('surfing') ||
        description.includes('kayak')
      );

    // Legacy support for old category names - redirect to merged categories
    case 'cardio':
      return exerciseMatchesTrainingType(exercise, 'endurance');
    
    case 'stretching':
      return exerciseMatchesTrainingType(exercise, 'flexibility');
    
    case 'speed':
      return exerciseMatchesTrainingType(exercise, 'plyometrics');
    
    case 'agility':
      return exerciseMatchesTrainingType(exercise, 'plyometrics');

    default:
      return true; // Return all exercises for unknown categories
  }
}

/**
 * Filters exercises by muscle group
 */
export function filterExercisesByMuscleGroup(exercises: Exercise[], muscleGroup: string): Exercise[] {
  return exercises.filter(exercise => {
    const primaryMuscles = exercise.primaryMuscles || [];
    switch (muscleGroup) {
      case 'chest':
        return primaryMuscles.includes('chest');
      case 'back':
        return primaryMuscles.some(m => ['back', 'lats', 'traps'].includes(m));
      case 'legs':
        return primaryMuscles.some(m => ['quadriceps', 'hamstrings', 'calves', 'glutes'].includes(m));
      case 'shoulders':
        return primaryMuscles.includes('shoulders');
      case 'arms':
        return primaryMuscles.some(m => ['biceps', 'triceps', 'forearms'].includes(m));
      case 'core':
        return primaryMuscles.includes('core');
      case 'fullBody':
        return exercise.category === 'compound' || primaryMuscles.length > 2;
      default:
        return true;
    }
  });
}

/**
 * Validates exercise categorization
 * Returns validation errors if any
 */
export function validateExerciseCategorization(exercise: Exercise): string[] {
  const errors: string[] = [];

  // Validate type-category combinations
  const validCombinations = new Map([
    ['strength', ['compound', 'isolation', 'olympic']],
    ['cardio', ['cardio']],
    ['flexibility', ['stretching']],
    ['plyometrics', ['power']],
    ['teamSports', ['power']],
    ['bodyweight', ['compound', 'isolation']],
    ['other', ['compound', 'isolation', 'cardio', 'stretching', 'power']]
  ]);

  const validCategories = validCombinations.get(exercise.type || 'other');
  if (validCategories && exercise.type && !validCategories.includes(exercise.category)) {
    errors.push(`Invalid type-category combination: ${exercise.type}/${exercise.category}`);
  }

  // Validate required fields
  if (!exercise.name) errors.push('Missing exercise name');
  if (!exercise.type) errors.push('Missing exercise type');
  if (!exercise.category) errors.push('Missing exercise category');
  if (!exercise.primaryMuscles || exercise.primaryMuscles.length === 0) {
    errors.push('Missing primary muscles');
  }

  // Validate muscle groups
  const validMuscles = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'quadriceps', 'hamstrings', 'calves', 'glutes', 'core',
    'traps', 'lats', 'lower_back', 'full_body'
  ];

  exercise.primaryMuscles?.forEach(muscle => {
    if (!validMuscles.includes(muscle)) {
      errors.push(`Invalid primary muscle: ${muscle}`);
    }
  });

  exercise.secondaryMuscles?.forEach(muscle => {
    if (!validMuscles.includes(muscle)) {
      errors.push(`Invalid secondary muscle: ${muscle}`);
    }
  });

  return errors;
}

/**
 * Auto-categorizes an exercise based on its properties
 * Returns suggested type and category
 */
export function suggestExerciseCategorization(exercise: Exercise): { type: string, category: string } {
  const name = exercise.name.toLowerCase();
  const description = exercise.description?.toLowerCase() || '';
  const primaryMuscles = exercise.primaryMuscles || [];

  // Cardio exercises
  if (name.includes('run') || name.includes('bike') || name.includes('treadmill') || 
      name.includes('rowing') || name.includes('cycle') || name.includes('cardio') ||
      description.includes('cardio') || description.includes('aerobic')) {
    return { type: 'cardio', category: 'cardio' };
  }

  // Flexibility exercises
  if (name.includes('stretch') || name.includes('mobility') || name.includes('yoga') ||
      description.includes('stretch') || description.includes('flexibility') ||
      description.includes('mobility')) {
    return { type: 'flexibility', category: 'stretching' };
  }

  // Plyometric exercises
  if (name.includes('jump') || name.includes('hop') || name.includes('plyometric') ||
      name.includes('explosive') || name.includes('sprint') || name.includes('speed') ||
      name.includes('agility') || description.includes('plyometric') ||
      description.includes('explosive') || description.includes('power')) {
    return { type: 'plyometrics', category: 'power' };
  }

  // Team sports exercises
  if (name.includes('basketball') || name.includes('football') || name.includes('soccer') ||
      name.includes('volleyball') || name.includes('tennis') || name.includes('sport') ||
      description.includes('sport')) {
    return { type: 'teamSports', category: 'power' };
  }

  // Olympic lifts
  if (name.includes('snatch') || name.includes('clean') || name.includes('jerk') ||
      description.includes('olympic')) {
    return { type: 'strength', category: 'olympic' };
  }

  // Bodyweight exercises
  if (name.includes('push-up') || name.includes('pull-up') || name.includes('bodyweight') ||
      (exercise.equipment && exercise.equipment.includes('bodyweight')) ||
      (!exercise.equipment || exercise.equipment.length === 0)) {
    // Determine if compound or isolation for bodyweight
    if (primaryMuscles.length > 1 || name.includes('squat') || name.includes('deadlift') ||
        name.includes('press') || name.includes('row')) {
      return { type: 'bodyweight', category: 'compound' };
    } else {
      return { type: 'bodyweight', category: 'isolation' };
    }
  }

  // Strength exercises (default for most exercises)
  // Determine compound vs isolation
  const compoundKeywords = ['squat', 'deadlift', 'press', 'row', 'pull', 'chin-up', 'dip'];
  const isCompound = primaryMuscles.length > 1 || 
                    compoundKeywords.some(keyword => name.includes(keyword)) ||
                    (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0);

  return { 
    type: 'strength', 
    category: isCompound ? 'compound' : 'isolation' 
  };
}
