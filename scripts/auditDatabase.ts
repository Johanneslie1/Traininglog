import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Exercise } from '../src/types/exercise';
import { 
  filterExercisesByTrainingType, 
  validateExerciseCategorization, 
  suggestExerciseCategorization 
} from '../src/utils/exerciseFiltering';

// Firebase configuration
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

interface DatabaseAuditReport {
  totalExercises: number;
  exercisesByType: Record<string, number>;
  exercisesByCategory: Record<string, number>;
  validationErrors: Array<{ exercise: Exercise; errors: string[] }>;
  categorizationIssues: Array<{ exercise: Exercise; suggested: { type: string; category: string } }>;
  filteringResults: Record<string, number>;
  duplicates: Exercise[];
}

async function auditExerciseDatabase(): Promise<DatabaseAuditReport> {
  console.log('🔍 Starting comprehensive exercise database audit...\n');

  // Fetch all exercises from Firebase
  const exercisesRef = collection(db, 'exercises');
  const snapshot = await getDocs(exercisesRef);
  
  const exercises: Exercise[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    exercises.push({ id: doc.id, ...data } as Exercise);
  });

  console.log(`📊 Found ${exercises.length} exercises in the database\n`);

  const report: DatabaseAuditReport = {
    totalExercises: exercises.length,
    exercisesByType: {},
    exercisesByCategory: {},
    validationErrors: [],
    categorizationIssues: [],
    filteringResults: {},
    duplicates: []
  };

  // Count exercises by type and category
  exercises.forEach(exercise => {
    if (exercise.type) {
      report.exercisesByType[exercise.type] = (report.exercisesByType[exercise.type] || 0) + 1;
    }
    if (exercise.category) {
      report.exercisesByCategory[exercise.category] = (report.exercisesByCategory[exercise.category] || 0) + 1;
    }
  });

  // Validate each exercise
  exercises.forEach(exercise => {
    const errors = validateExerciseCategorization(exercise);
    if (errors.length > 0) {
      report.validationErrors.push({ exercise, errors });
    }

    // Check if current categorization matches suggested categorization
    const suggested = suggestExerciseCategorization(exercise);
    if (exercise.type !== suggested.type || exercise.category !== suggested.category) {
      report.categorizationIssues.push({ exercise, suggested });
    }
  });

  // Test filtering for each training type
  const trainingTypes = ['strength', 'cardio', 'plyometrics', 'endurance', 'teamSports', 'flexibility', 'speed', 'agility'];
  
  trainingTypes.forEach(trainingType => {
    const filtered = filterExercisesByTrainingType(exercises, trainingType);
    report.filteringResults[trainingType] = filtered.length;
  });

  // Find duplicates (same name)
  const nameMap = new Map<string, Exercise[]>();
  exercises.forEach(exercise => {
    const name = exercise.name.toLowerCase().trim();
    if (!nameMap.has(name)) {
      nameMap.set(name, []);
    }
    nameMap.get(name)!.push(exercise);
  });

  nameMap.forEach((exerciseList, name) => {
    if (exerciseList.length > 1) {
      report.duplicates.push(...exerciseList);
    }
  });

  return report;
}

async function fixExerciseDatabase(dryRun: boolean = true): Promise<number> {
  console.log('🔧 Starting exercise database fixes...\n');

  const exercisesRef = collection(db, 'exercises');
  const snapshot = await getDocs(exercisesRef);
  
  const exercises: Exercise[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    exercises.push({ id: doc.id, ...data } as Exercise);
  });

  let fixesApplied = 0;
  const batch = writeBatch(db);

  for (const exercise of exercises) {
    const errors = validateExerciseCategorization(exercise);
    if (errors.length > 0) {
      const suggested = suggestExerciseCategorization(exercise);
      
      console.log(`Fixing ${exercise.name}:`);
      console.log(`  Current: ${exercise.type}/${exercise.category}`);
      console.log(`  Suggested: ${suggested.type}/${suggested.category}`);
      console.log(`  Errors: ${errors.join(', ')}\n`);

      if (!dryRun) {
        const docRef = doc(db, 'exercises', exercise.id);
        batch.update(docRef, {
          type: suggested.type,
          category: suggested.category
        });
        fixesApplied++;
      }
    }
  }

  if (!dryRun && fixesApplied > 0) {
    await batch.commit();
    console.log(`✅ Applied ${fixesApplied} fixes to the database`);
  } else if (dryRun) {
    console.log(`📋 Dry run complete. ${fixesApplied} exercises would be fixed.`);
  }

  return fixesApplied;
}

async function testFilteringAccuracy(): Promise<boolean> {
  console.log('🧪 Testing filtering accuracy...\n');

  const exercisesRef = collection(db, 'exercises');
  const snapshot = await getDocs(exercisesRef);
  
  const exercises: Exercise[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    exercises.push({ id: doc.id, ...data } as Exercise);
  });

  const trainingTypes = [
    'strength', 'cardio', 'plyometrics', 'endurance', 
    'teamSports', 'flexibility', 'speed', 'agility'
  ];

  let allTestsPassed = true;

  for (const trainingType of trainingTypes) {
    const filtered = filterExercisesByTrainingType(exercises, trainingType);
    
    console.log(`${trainingType}: ${filtered.length} exercises`);
    
    // Log some examples
    if (filtered.length > 0) {
      const examples = filtered.slice(0, 3).map(ex => ex.name);
      console.log(`  Examples: ${examples.join(', ')}`);
    }
    
    // Basic validation: each training type should have at least some exercises
    if (trainingType === 'strength' && filtered.length === 0) {
      console.error(`❌ No strength exercises found - this is likely an error`);
      allTestsPassed = false;
    }
    
    console.log();
  }

  // Test for mutual exclusivity where appropriate
  const strengthExercises = filterExercisesByTrainingType(exercises, 'strength');
  const cardioExercises = filterExercisesByTrainingType(exercises, 'cardio');
  
  const strengthIds = new Set(strengthExercises.map(ex => ex.id));
  const cardioIds = new Set(cardioExercises.map(ex => ex.id));
  
  const overlap = new Set([...strengthIds].filter(id => cardioIds.has(id)));
  
  if (overlap.size > 0) {
    console.error(`❌ Found ${overlap.size} exercises that appear in both strength and cardio categories`);
    allTestsPassed = false;
  } else {
    console.log(`✅ Strength and cardio categories are mutually exclusive`);
  }

  return allTestsPassed;
}

function printAuditReport(report: DatabaseAuditReport): void {
  console.log('📈 EXERCISE DATABASE AUDIT REPORT');
  console.log('='.repeat(50));
  
  console.log(`\n📊 OVERVIEW:`);
  console.log(`Total exercises: ${report.totalExercises}`);
  
  console.log(`\n🏷️  EXERCISES BY TYPE:`);
  Object.entries(report.exercisesByType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  
  console.log(`\n📋 EXERCISES BY CATEGORY:`);
  Object.entries(report.exercisesByCategory)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
  
  console.log(`\n🔍 FILTERING RESULTS:`);
  Object.entries(report.filteringResults)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} exercises`);
    });
  
  if (report.validationErrors.length > 0) {
    console.log(`\n❌ VALIDATION ERRORS (${report.validationErrors.length}):`);
    report.validationErrors.slice(0, 10).forEach(({ exercise, errors }) => {
      console.log(`  ${exercise.name}: ${errors.join(', ')}`);
    });
    if (report.validationErrors.length > 10) {
      console.log(`  ... and ${report.validationErrors.length - 10} more`);
    }
  }
  
  if (report.categorizationIssues.length > 0) {
    console.log(`\n🔄 CATEGORIZATION ISSUES (${report.categorizationIssues.length}):`);
    report.categorizationIssues.slice(0, 10).forEach(({ exercise, suggested }) => {
      console.log(`  ${exercise.name}: ${exercise.type}/${exercise.category} → ${suggested.type}/${suggested.category}`);
    });
    if (report.categorizationIssues.length > 10) {
      console.log(`  ... and ${report.categorizationIssues.length - 10} more`);
    }
  }
  
  if (report.duplicates.length > 0) {
    console.log(`\n👥 DUPLICATE EXERCISES (${report.duplicates.length}):`);
    const duplicateNames = [...new Set(report.duplicates.map(ex => ex.name))];
    duplicateNames.slice(0, 10).forEach(name => {
      const duplicates = report.duplicates.filter(ex => ex.name === name);
      console.log(`  ${name}: ${duplicates.length} copies`);
    });
    if (duplicateNames.length > 10) {
      console.log(`  ... and ${duplicateNames.length - 10} more`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
}

async function main(): Promise<void> {
  try {
    console.log('🚀 Exercise Database Analysis Tool\n');
    
    // Step 1: Audit the database
    const report = await auditExerciseDatabase();
    printAuditReport(report);
    
    // Step 2: Test filtering accuracy
    console.log('\n🧪 FILTERING ACCURACY TEST:');
    const filteringPassed = await testFilteringAccuracy();
    
    if (filteringPassed) {
      console.log('✅ All filtering tests passed!');
    } else {
      console.log('❌ Some filtering tests failed. Check the logs above.');
    }
    
    // Step 3: Offer to fix issues (dry run first)
    if (report.categorizationIssues.length > 0) {
      console.log('\n🔧 RUNNING DRY RUN OF FIXES:');
      await fixExerciseDatabase(true);
      
      console.log('\n❓ To apply these fixes, run the script with --fix flag');
    } else {
      console.log('\n✅ No categorization issues found!');
    }
    
    console.log('\n🎉 Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Check if --fix flag is passed
const applyFixes = process.argv.includes('--fix');

if (applyFixes) {
  console.log('⚠️  APPLYING FIXES TO DATABASE');
  fixExerciseDatabase(false).then(() => {
    console.log('Fixes applied!');
    process.exit(0);
  }).catch(error => {
    console.error('Error applying fixes:', error);
    process.exit(1);
  });
} else {
  main().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
