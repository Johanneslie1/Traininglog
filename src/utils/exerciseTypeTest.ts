// Test utility to validate exercise type differentiation fix
import { saveLog } from '@/services/firebase/unifiedLogs';
import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';
import { ActivityType } from '@/types/activityTypes';

interface TestExerciseData {
  exerciseName: string;
  activityType: string;
  sets: any[];
}

const testExercises: TestExerciseData[] = [
  {
    exerciseName: 'Test Running Session',
    activityType: 'endurance',
    sets: [{
      setNumber: 1,
      duration: 1800, // 30 minutes
      distance: 5000, // 5km
      pace: '6:00',
      calories: 300
    }]
  },
  {
    exerciseName: 'Test Sprint Drills',
    activityType: 'speed_agility',
    sets: [{
      setNumber: 1,
      reps: 5,
      time: 12, // 12 seconds
      distance: 100, // 100m
      restTime: 60
    }]
  },
  {
    exerciseName: 'Test Basketball Game',
    activityType: 'sport',
    sets: [{
      setNumber: 1,
      duration: 2400, // 40 minutes
      intensity: 'high',
      score: 85,
      performance: 'good'
    }]
  },
  {
    exerciseName: 'Test Yoga Session',
    activityType: 'stretching',
    sets: [{
      setNumber: 1,
      duration: 3600, // 60 minutes
      intensity: 'moderate',
      flexibility: 'improved'
    }]
  },
  {
    exerciseName: 'Test Meditation',
    activityType: 'other',
    sets: [{
      setNumber: 1,
      duration: 1200, // 20 minutes
      intensity: 'low',
      notes: 'Mindfulness practice'
    }]
  },
  {
    exerciseName: 'Test Resistance Exercise',
    activityType: '', // No activity type = resistance
    sets: [{
      setNumber: 1,
      reps: 10,
      weight: 100,
      restTime: 60
    }]
  }
];

// Map legacy activityType strings to ExerciseType literals for unified save
const toExerciseType = (t: string): 'strength' | 'endurance' | 'teamSports' | 'flexibility' | 'speedAgility' | 'other' => {
  switch (t) {
    case 'endurance':
      return 'endurance';
    case 'sport':
    case 'team_sports':
      return 'teamSports';
    case 'stretching':
    case 'flexibility':
      return 'flexibility';
    case 'speed_agility':
    case 'speedAgility':
      return 'speedAgility';
    case 'other':
    case 'outdoor':
      return 'other';
    case '':
    default:
      return 'strength';
  }
};

export async function runExerciseTypeTest(userId: string): Promise<void> {
  const testDate = new Date();
  console.log('🧪 Starting comprehensive exercise type test...');
  console.log('📅 Test date:', testDate.toISOString());
  console.log('👤 Test user:', userId);

  try {
    // Step 1: Save all test exercises
    console.log('\n📝 Step 1: Saving test exercises...');
    const savedIds: string[] = [];

    for (const testExercise of testExercises) {
      try {
        const exerciseType = toExerciseType(testExercise.activityType);
        console.log(`💾 Saving: ${testExercise.exerciseName} (${exerciseType})`);
        
        const savedId = await saveLog(
          {
            exerciseName: testExercise.exerciseName,
            userId: userId,
            sets: testExercise.sets as any,
            exerciseType
          },
          testDate
        );
        savedIds.push(savedId);
        console.log(`✅ Saved with ID: ${savedId}`);
      } catch (error) {
        console.error(`❌ Failed to save ${testExercise.exerciseName}:`, error);
      }
    }

    console.log(`\n📊 Successfully saved ${savedIds.length}/${testExercises.length} test exercises`);

    // Step 2: Wait a moment for Firestore to process
    console.log('\n⏳ Waiting for Firestore to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Retrieve and validate
    console.log('\n🔍 Step 2: Retrieving exercises using unified loader...');
    const retrievedExercises = await getAllExercisesByDate(testDate, userId);
    
    console.log(`📊 Retrieved ${retrievedExercises.length} exercises total`);

    // Analyze results by type
    const byType = {
      resistance: retrievedExercises.filter(ex => ex.activityType === ActivityType.RESISTANCE || !ex.activityType),
      endurance: retrievedExercises.filter(ex => ex.activityType === 'endurance'),
      speed_agility: retrievedExercises.filter(ex => ex.activityType === 'speedAgility'),
      sport: retrievedExercises.filter(ex => ex.activityType === 'sport'),
      stretching: retrievedExercises.filter(ex => ex.activityType === 'stretching'),
      other: retrievedExercises.filter(ex => ex.activityType === 'other')
    };

    console.log('\n📈 Results by exercise type:');
    Object.entries(byType).forEach(([type, exercises]) => {
      console.log(`  ${type}: ${exercises.length} exercises`);
      exercises.forEach(ex => {
        console.log(`    - ${ex.exerciseName} (ID: ${ex.id})`);
      });
    });

    // Validation
    console.log('\n✅ Validation Results:');
    const expectedCounts = {
      resistance: 1,
      endurance: 1,
      speed_agility: 1,
      sport: 1,
      stretching: 1,
      other: 1
    } as const;

    let allPassed = true;
    Object.entries(expectedCounts).forEach(([type, expected]) => {
      const actual = (byType as any)[type].length;
      const passed = actual === expected;
      console.log(`  ${type}: ${passed ? '✅' : '❌'} Expected: ${expected}, Got: ${actual}`);
      if (!passed) allPassed = false;
    });

    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Exercise type differentiation is working correctly.');
    } else {
      console.log('\n❌ SOME TESTS FAILED! Check the logs above for details.');
    }

    // Detailed exercise info
    console.log('\n📋 Detailed exercise information:');
    retrievedExercises.forEach((ex, index) => {
      console.log(`\n${index + 1}. ${ex.exerciseName}`);
      console.log(`   Type: ${ex.activityType || 'resistance'}`);
      console.log(`   ID: ${ex.id}`);
      console.log(`   Sets: ${ex.sets?.length || 0}`);
      console.log(`   Timestamp: ${ex.timestamp?.toISOString()}`);
    });

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Make test available in browser console
if (typeof window !== 'undefined') {
  (window as any).runExerciseTypeTest = runExerciseTypeTest;
}
