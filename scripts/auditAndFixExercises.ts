import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { Exercise, ExerciseType, ExerciseCategory } from '../src/types/exercise';

// Firebase configuration (using the same config as your app)
const firebaseConfig = {
  apiKey: "AIzaSyBEjqMhwLTq1dN2IfzrpEt9Ev4o3kRp9Bs",
  authDomain: "traininglog-df506.firebaseapp.com",
  projectId: "traininglog-df506",
  storageBucket: "traininglog-df506.firebasestorage.app",
  messagingSenderId: "745070006530",
  appId: "1:745070006530:web:04e79b7a7c97a89a64f906",
  measurementId: "G-HBE39VQDBM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface ExerciseAuditResult {
  totalExercises: number;
  exercisesByType: Record<string, number>;
  exercisesByCategory: Record<string, number>;
  exercisesWithIncorrectTypes: Exercise[];
  exercisesWithIncorrectCategories: Exercise[];
  exercisesWithMissingFields: Exercise[];
  duplicateExercises: Exercise[];
}

interface TypeCategoryMapping {
  [key: string]: {
    validTypes: ExerciseType[];
    validCategories: ExerciseCategory[];
    defaultType: ExerciseType;
    defaultCategory: ExerciseCategory;
  }
}

// Define correct mapping rules for exercise types and categories
const trainingTypeMapping: TypeCategoryMapping = {
  'strength': {
    validTypes: ['strength'],
    validCategories: ['compound', 'isolation'],
    defaultType: 'strength',
    defaultCategory: 'compound'
  },
  'plyometrics': {
    validTypes: ['plyometrics'],
    validCategories: ['power'],
    defaultType: 'plyometrics',
    defaultCategory: 'power'
  },
  'endurance': {
    validTypes: ['endurance', 'cardio'],
    validCategories: ['cardio'],
    defaultType: 'cardio',
    defaultCategory: 'cardio'
  },
  'teamSports': {
    validTypes: ['teamSports'],
    validCategories: ['power'],
    defaultType: 'teamSports',
    defaultCategory: 'power'
  },
  'flexibility': {
    validTypes: ['flexibility'],
    validCategories: ['stretching'],
    defaultType: 'flexibility',
    defaultCategory: 'stretching'
  },
  'speed': {
    validTypes: ['plyometrics'],
    validCategories: ['power'],
    defaultType: 'plyometrics',
    defaultCategory: 'power'
  },
  'agility': {
    validTypes: ['plyometrics'],
    validCategories: ['power'],
    defaultType: 'plyometrics',
    defaultCategory: 'power'
  },
  'cardio': {
    validTypes: ['cardio'],
    validCategories: ['cardio'],
    defaultType: 'cardio',
    defaultCategory: 'cardio'
  },
  'bodyweight': {
    validTypes: ['bodyweight'],
    validCategories: ['compound', 'isolation'],
    defaultType: 'bodyweight',
    defaultCategory: 'compound'
  },
  'olympic': {
    validTypes: ['strength'],
    validCategories: ['olympic'],
    defaultType: 'strength',
    defaultCategory: 'olympic'
  }
};

async function auditExerciseDatabase(): Promise<ExerciseAuditResult> {
  console.log('Starting exercise database audit...');
  
  const exercisesRef = collection(db, 'exercises');
  const querySnapshot = await getDocs(exercisesRef);
  
  const exercises: Exercise[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    exercises.push({ id: doc.id, ...data } as Exercise);
  });

  const result: ExerciseAuditResult = {
    totalExercises: exercises.length,
    exercisesByType: {},
    exercisesByCategory: {},
    exercisesWithIncorrectTypes: [],
    exercisesWithIncorrectCategories: [],
    exercisesWithMissingFields: [],
    duplicateExercises: []
  };

  // Count exercises by type and category
  exercises.forEach(exercise => {
    if (exercise.type) {
      result.exercisesByType[exercise.type] = (result.exercisesByType[exercise.type] || 0) + 1;
    }
    if (exercise.category) {
      result.exercisesByCategory[exercise.category] = (result.exercisesByCategory[exercise.category] || 0) + 1;
    }
  });

  // Find exercises with incorrect types/categories
  const validTypes: ExerciseType[] = ['strength', 'plyometrics', 'endurance', 'teamSports', 'flexibility', 'other', 'cardio', 'bodyweight'];
  const validCategories: ExerciseCategory[] = ['compound', 'isolation', 'olympic', 'cardio', 'stretching', 'power'];

  exercises.forEach(exercise => {
    // Check for missing required fields
    if (!exercise.name || !exercise.type || !exercise.category || !exercise.primaryMuscles) {
      result.exercisesWithMissingFields.push(exercise);
    }

    // Check for invalid types
    if (exercise.type && !validTypes.includes(exercise.type as ExerciseType)) {
      result.exercisesWithIncorrectTypes.push(exercise);
    }

    // Check for invalid categories
    if (exercise.category && !validCategories.includes(exercise.category as ExerciseCategory)) {
      result.exercisesWithIncorrectCategories.push(exercise);
    }
  });

  // Find duplicate exercises (same name)
  const exerciseNames = new Map<string, Exercise[]>();
  exercises.forEach(exercise => {
    const name = exercise.name.toLowerCase().trim();
    if (!exerciseNames.has(name)) {
      exerciseNames.set(name, []);
    }
    exerciseNames.get(name)!.push(exercise);
  });

  exerciseNames.forEach((exerciseList, name) => {
    if (exerciseList.length > 1) {
      result.duplicateExercises.push(...exerciseList);
    }
  });

  return result;
}

function categorizeExerciseCorrectly(exercise: Exercise): { type: ExerciseType, category: ExerciseCategory } {
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

async function fixExerciseCategories(exercises: Exercise[]): Promise<number> {
  console.log(`Fixing categorization for ${exercises.length} exercises...`);
  
  let fixedCount = 0;

  for (const exercise of exercises) {
    try {
      const correctCategorization = categorizeExerciseCorrectly(exercise);
      
      if (exercise.type !== correctCategorization.type || 
          exercise.category !== correctCategorization.category) {
        
        const exerciseRef = doc(db, 'exercises', exercise.id);
        await updateDoc(exerciseRef, {
          type: correctCategorization.type,
          category: correctCategorization.category
        });
        
        console.log(`Fixed ${exercise.name}: ${exercise.type}/${exercise.category} → ${correctCategorization.type}/${correctCategorization.category}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`Error fixing exercise ${exercise.name}:`, error);
    }
  }

  return fixedCount;
}

async function validateFilteringLogic(): Promise<boolean> {
  console.log('Validating filtering logic...');
  
  // Test each training type filter
  const trainingTypes = ['strength', 'plyometrics', 'endurance', 'teamSports', 'flexibility', 'cardio', 'speed', 'agility'];
  
  for (const trainingType of trainingTypes) {
    const exercises = await getExercisesByTrainingType(trainingType);
    console.log(`${trainingType}: ${exercises.length} exercises found`);
    
    // Validate that all exercises match the training type criteria
    const incorrectExercises = exercises.filter(exercise => {
      return !exerciseMatchesTrainingType(exercise, trainingType);
    });
    
    if (incorrectExercises.length > 0) {
      console.error(`❌ ${trainingType} has ${incorrectExercises.length} incorrectly categorized exercises:`);
      incorrectExercises.forEach(ex => console.error(`  - ${ex.name} (${ex.type}/${ex.category})`));
      return false;
    } else {
      console.log(`✅ ${trainingType} filtering is correct`);
    }
  }
  
  return true;
}

function exerciseMatchesTrainingType(exercise: Exercise, trainingType: string): boolean {
  const name = exercise.name.toLowerCase();
  const description = exercise.description?.toLowerCase() || '';

  switch (trainingType) {
    case 'strength':
      return exercise.type === 'strength';
    case 'plyometrics':
      return exercise.type === 'plyometrics' || 
             exercise.category === 'power' ||
             name.includes('plyometric') ||
             name.includes('jump') ||
             name.includes('hop') ||
             description.includes('plyometric');
    case 'endurance':
      return exercise.type === 'endurance' || 
             exercise.type === 'cardio' ||
             name.includes('run') ||
             name.includes('bike') ||
             name.includes('treadmill') ||
             name.includes('rowing');
    case 'teamSports':
      return exercise.type === 'teamSports' ||
             description.includes('basketball') ||
             description.includes('football') ||
             description.includes('soccer') ||
             description.includes('volleyball') ||
             description.includes('tennis') ||
             description.includes('sport') ||
             name.includes('agility') ||
             name.includes('lateral');
    case 'flexibility':
      return exercise.type === 'flexibility' || 
             exercise.category === 'stretching' ||
             name.includes('stretch') ||
             name.includes('mobility');
    case 'cardio':
      return exercise.type === 'cardio';
    case 'speed':
      return name.includes('speed') ||
             name.includes('sprint') ||
             name.includes('dash') ||
             description.includes('speed') ||
             description.includes('sprint') ||
             description.includes('explosive') ||
             exercise.category === 'power';
    case 'agility':
      return name.includes('agility') ||
             name.includes('ladder') ||
             name.includes('cone') ||
             name.includes('lateral') ||
             name.includes('carioca') ||
             description.includes('agility') ||
             description.includes('lateral');
    default:
      return true;
  }
}

async function getExercisesByTrainingType(trainingType: string): Promise<Exercise[]> {
  const exercisesRef = collection(db, 'exercises');
  const querySnapshot = await getDocs(exercisesRef);
  
  const exercises: Exercise[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const exercise = { id: doc.id, ...data } as Exercise;
    
    if (exerciseMatchesTrainingType(exercise, trainingType)) {
      exercises.push(exercise);
    }
  });

  return exercises;
}

async function runFullAuditAndFix(): Promise<void> {
  try {
    console.log('🚀 Starting comprehensive exercise database audit and fix...\n');

    // Step 1: Audit current state
    console.log('📊 Step 1: Auditing current database state...');
    const auditResult = await auditExerciseDatabase();
    
    console.log('\n📈 Audit Results:');
    console.log(`Total exercises: ${auditResult.totalExercises}`);
    console.log(`Exercises by type:`, auditResult.exercisesByType);
    console.log(`Exercises by category:`, auditResult.exercisesByCategory);
    console.log(`Exercises with incorrect types: ${auditResult.exercisesWithIncorrectTypes.length}`);
    console.log(`Exercises with incorrect categories: ${auditResult.exercisesWithIncorrectCategories.length}`);
    console.log(`Exercises with missing fields: ${auditResult.exercisesWithMissingFields.length}`);
    console.log(`Duplicate exercises: ${auditResult.duplicateExercises.length}`);

    // Step 2: Fix categorization issues
    console.log('\n🔧 Step 2: Fixing exercise categorization...');
    const exercisesRef = collection(db, 'exercises');
    const allExercisesSnapshot = await getDocs(exercisesRef);
    const allExercises: Exercise[] = [];
    allExercisesSnapshot.forEach((doc) => {
      allExercises.push({ id: doc.id, ...doc.data() } as Exercise);
    });

    const fixedCount = await fixExerciseCategories(allExercises);
    console.log(`✅ Fixed categorization for ${fixedCount} exercises`);

    // Step 3: Validate filtering logic
    console.log('\n🧪 Step 3: Validating filtering logic...');
    const isValid = await validateFilteringLogic();
    
    if (isValid) {
      console.log('\n🎉 All exercise filtering is working correctly!');
    } else {
      console.log('\n❌ Some filtering issues remain. Check the logs above.');
    }

    console.log('\n✨ Audit and fix completed successfully!');

  } catch (error) {
    console.error('❌ Error during audit and fix:', error);
  }
}

// Export for use in other scripts
export {
  auditExerciseDatabase,
  fixExerciseCategories,
  validateFilteringLogic,
  runFullAuditAndFix,
  categorizeExerciseCorrectly,
  exerciseMatchesTrainingType
};

// Run the script if executed directly
if (require.main === module) {
  runFullAuditAndFix().then(() => {
    console.log('Script completed');
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
