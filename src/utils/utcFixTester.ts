// UTC Fix Testing Utility
// This utility tests whether exercises saved with UTC normalization appear on the correct dates

import { saveLog } from '@/services/firebase/unifiedLogs';

export const testUTCFix = async (userId: string) => {
  console.log('🧪 TESTING UTC FIX');
  console.log('='.repeat(50));
  
  if (!userId) {
    console.error('❌ No userId provided');
    return;
  }
  
  // Test date - August 28th, 2025 (today)
  const testDate = new Date('2025-08-28');
  console.log('📅 Testing with date:', testDate.toDateString());
  console.log('🌐 Current timezone offset (minutes from UTC):', testDate.getTimezoneOffset());
  
  try {    // Test 1: Save a strength exercise
    console.log('\n🏋️ Test 1: Saving strength exercise...');
    const strengthExercise = {
      userId: userId,
      exerciseName: 'UTC Fix Test - Strength',      sets: [{
        weight: 100,
        reps: 10,
        difficulty: 'MODERATE' as any,
        rir: 2,
        rpe: 7
      }],
      exerciseType: 'strength' as const,
      categories: ['test']
    };
    
    const strengthResult = await saveLog(strengthExercise, testDate);
    console.log('✅ Strength exercise saved:', strengthResult);
    
    // Test 2: Save an endurance activity
    console.log('\n🏃 Test 2: Saving endurance activity...');
    const enduranceActivity = {
      userId: userId,
      activityName: 'UTC Fix Test - Endurance',      sets: [{
        weight: 0,
        reps: 1,
        difficulty: 'MODERATE' as any,
        duration: 30,
        distance: 5000,
        rpe: 7
      }],
      exerciseType: 'endurance' as const,
      categories: ['test']
    };
    
    const enduranceResult = await saveLog(enduranceActivity, testDate);
    console.log('✅ Endurance activity saved:', enduranceResult);
    
    console.log('\n✅ UTC Fix Test completed successfully!');
    console.log('🔍 Now check if these exercises appear on August 28th in the exercise log');
    console.log('📋 Exercises saved:');
    console.log('  1. UTC Fix Test - Strength (strength exercise)');
    console.log('  2. UTC Fix Test - Endurance (endurance activity)');
    
    return {
      strengthId: strengthResult,
      enduranceId: enduranceResult,
      testDate: testDate
    };
    
  } catch (error) {
    console.error('❌ UTC Fix Test failed:', error);
    throw error;
  }
};

export const verifyUTCFixResults = async (userId: string, testDate: Date = new Date('2025-08-28')) => {
  console.log('\n🔍 VERIFYING UTC FIX RESULTS');
  console.log('='.repeat(50));
  
  try {
    // Import the unified function to get exercises
    const { getAllExercisesByDate } = await import('@/utils/unifiedExerciseUtils');
    
    console.log('📅 Checking exercises for date:', testDate.toDateString());
    const exercises = await getAllExercisesByDate(testDate, userId);
    
    console.log(`📊 Found ${exercises.length} exercises for ${testDate.toDateString()}`);
    
    // Look for our test exercises
    const testResistance = exercises.find(ex => ex.exerciseName.includes('UTC Fix Test - Resistance'));
    const testEndurance = exercises.find(ex => ex.exerciseName.includes('UTC Fix Test - Endurance'));
    
    console.log('\n🎯 Test Results:');
    console.log('  Resistance exercise found:', !!testResistance);
    console.log('  Endurance activity found:', !!testEndurance);
    
    if (testResistance) {
      console.log('  📝 Resistance exercise details:', {
        id: testResistance.id,
        name: testResistance.exerciseName,
        timestamp: testResistance.timestamp?.toISOString(),
        sets: testResistance.sets?.length
      });
    }
    
    if (testEndurance) {
      console.log('  📝 Endurance activity details:', {
        id: testEndurance.id,
        name: testEndurance.exerciseName,
        timestamp: testEndurance.timestamp?.toISOString(),
        activityType: testEndurance.activityType,
        sets: testEndurance.sets?.length
      });
    }
    
    const success = testResistance && testEndurance;
    if (success) {
      console.log('\n✅ UTC FIX VERIFICATION SUCCESSFUL!');
      console.log('   Both test exercises appear on the correct date');
    } else {
      console.log('\n❌ UTC FIX VERIFICATION FAILED!');
      console.log('   One or both test exercises are missing from the expected date');
    }
    
    return {
      success,
      exercisesFound: exercises.length,
      testResistanceFound: !!testResistance,
      testEnduranceFound: !!testEndurance,
      exercises
    };
    
  } catch (error) {
    console.error('❌ Error verifying UTC fix results:', error);
    throw error;
  }
};

export const runFullUTCTest = async (userId: string) => {
  console.log('🚀 RUNNING FULL UTC FIX TEST');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Run timezone debugging
    if (typeof window !== 'undefined' && (window as any).debugTimezoneIssue) {
      console.log('🌍 Step 1: Analyzing timezone issues...');
      (window as any).debugTimezoneIssue();
      
      console.log('\n🔧 Step 2: Testing UTC fix proposal...');
      (window as any).debugUTCFix();
    }
    
    // Step 2: Save test exercises
    console.log('\n💾 Step 3: Saving test exercises with UTC fix...');
    const saveResults = await testUTCFix(userId);
    
    // Wait a moment for Firestore to process
    console.log('\n⏳ Waiting for Firestore to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Verify results
    console.log('\n🔍 Step 4: Verifying results...');
    const verifyResults = await verifyUTCFixResults(userId);
    
    console.log('\n🎉 FULL UTC TEST COMPLETED!');
    console.log('Results:', {
      saved: !!saveResults,
      verified: verifyResults.success,
      exercisesFound: verifyResults.exercisesFound
    });
    
    return {
      saveResults,
      verifyResults,
      success: !!saveResults && verifyResults.success
    };
    
  } catch (error) {
    console.error('❌ Full UTC test failed:', error);
    throw error;
  }
};

// Make functions available globally for console testing
declare global {
  interface Window {
    testUTCFix: typeof testUTCFix;
    verifyUTCFixResults: typeof verifyUTCFixResults;
    runFullUTCTest: typeof runFullUTCTest;
    quickUTCTest: () => Promise<void>; // Add a quick test function
  }
}

// Quick test function that uses the current user
const quickUTCTest = async () => {
  try {
    const { getCurrentUserIdFromRedux } = await import('./userIdHelper');
    const userId = getCurrentUserIdFromRedux();
    if (!userId) {
      console.error('❌ No user logged in');
      return;
    }
    
    console.log('🚀 Running quick UTC test...');
    await testUTCFix(userId);
  } catch (error) {
    console.error('❌ Quick UTC test failed:', error);
  }
};

window.testUTCFix = testUTCFix;
window.verifyUTCFixResults = verifyUTCFixResults;
window.runFullUTCTest = runFullUTCTest;
window.quickUTCTest = quickUTCTest;

console.log('🧪 UTC Fix Testing tools loaded. Run:');
console.log('  quickUTCTest() - to test with current user');
console.log('  testUTCFix(userId) - to save test exercises');
console.log('  verifyUTCFixResults(userId) - to check if exercises appear on correct date');
console.log('  runFullUTCTest(userId) - to run complete test suite');
