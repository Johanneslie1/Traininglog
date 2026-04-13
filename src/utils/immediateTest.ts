// Immediate test for activity data conversion
import { saveLog } from '../services/firebase/unifiedLogs';
import { getAllExercisesByDate } from './unifiedExerciseUtils';

export async function createAndTestActivity(userId: string, date: Date = new Date()) {
  console.log('🧪 CREATE & TEST: Creating sample activity and testing conversion...');
  
  try {
    // Create a test endurance exercise
    const testEnduranceExercise = {
      exerciseName: 'Test Run - Immediate Test',
      userId,
      sets: [{
        setNumber: 1,
        duration: 25,
        distance: 4.2,
        pace: 360, // 6:00 per km
        averageHeartRate: 145,
        maxHeartRate: 165,
        calories: 320,
        elevation: 50,
        rpe: 7,
        hrZone1: 5,
        hrZone2: 15,
        hrZone3: 5,
        notes: 'Good pace, felt strong'
      }]
    } as const;
    
    console.log('💾 Saving test exercise to Firestore...');
    await saveLog(
      {
        exerciseName: testEnduranceExercise.exerciseName,
        userId: userId,
        sets: testEnduranceExercise.sets as any,
        exerciseType: 'endurance'
      },
      date
    );
    console.log('✅ Test exercise saved successfully');
    
    // Wait a moment for Firestore to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Now test loading
    console.log('🔍 Loading exercises to test conversion...');
    const exercises = await getAllExercisesByDate(date, userId);
    
    console.log(`📊 Total exercises loaded: ${exercises.length}`);
    
    // Find our test exercise
    const testExercise = exercises.find(ex => ex.exerciseName === 'Test Run - Immediate Test');
    
    if (testExercise) {
      console.log('🎯 FOUND TEST EXERCISE:');
      console.log('   Name:', testExercise.exerciseName);
      console.log('   Activity Type:', testExercise.activityType);
      console.log('   Sets count:', testExercise.sets?.length || 0);
      
      if (testExercise.sets && testExercise.sets.length > 0) {
        const set = testExercise.sets[0] as any;
        console.log('🔍 SET DATA ANALYSIS:');
        console.log('   Duration:', set.duration, '(should be 25)');
        console.log('   Distance:', set.distance, '(should be 4.2)');
        console.log('   Pace:', set.pace, '(should be 360)');
        console.log('   Avg HR:', set.averageHeartRate, '(should be 145)');
        console.log('   Calories:', set.calories, '(should be 320)');
        
        // Check for incorrect resistance data
        const hasWeight = set.weight !== undefined && set.weight !== null;
        const hasReps = set.reps !== undefined && set.reps !== null;
        
        if (hasWeight || hasReps) {
          console.log('❌ PROBLEM: Exercise still has resistance data!');
          console.log('   Weight:', set.weight);
          console.log('   Reps:', set.reps);
        } else {
          console.log('✅ GOOD: No resistance data found');
        }
        
        // Check for activity data
        const hasActivityData = set.duration || set.distance || set.pace || set.averageHeartRate || set.calories;
        if (hasActivityData) {
          console.log('✅ SUCCESS: Activity data is properly converted!');
        } else {
          console.log('❌ PROBLEM: No activity data found in converted exercise');
        }
      }
    } else {
      console.log('❌ Test exercise not found in loaded data');
      console.log('Available exercises:', exercises.map(ex => ex.exerciseName));
    }
    
  } catch (error) {
    console.error('❌ Error in create and test:', error);
  }
}
