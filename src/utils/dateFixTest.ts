// Test file to verify the date fix for exercise saving/retrieving
import { saveLog } from '@/services/firebase/unifiedLogs';
import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';

/**
 * Test function to verify that exercises are saved and retrieved on the same date
 */
export const testDateConsistency = async (userId: string, testDate: Date) => {
  console.log('🧪 Testing date consistency for exercise save/retrieve...');
  console.log('📅 Test date:', testDate.toISOString());
  
  try {    // 1. Save a test exercise
    const testExercise = {
      activityName: 'Date Fix Test Exercise',
      userId: userId,      sets: [{
        duration: 30,
        distance: 5,
        notes: 'Test exercise to verify date consistency',
        weight: 0,  // Required by ExerciseSet interface
        reps: 1,    // Required by ExerciseSet interface
        difficulty: 'MODERATE' as any  // Fix type issue
      }],
      exerciseType: 'endurance' as const
    };

    console.log('💾 Saving test exercise...');
    const savedId = await saveLog(testExercise, testDate);
    console.log('✅ Test exercise saved with ID:', savedId);
    
    // 2. Wait a moment for Firestore to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Retrieve exercises for the same date
    console.log('🔍 Retrieving exercises for the same date...');
    const retrievedExercises = await getAllExercisesByDate(testDate, userId);
    
    // 4. Check if our test exercise is found
    const foundExercise = retrievedExercises.find(ex => 
      ex.id === savedId || ex.exerciseName === 'Date Fix Test Exercise'
    );
    
    if (foundExercise) {
      console.log('✅ SUCCESS: Test exercise found in retrieved data!');
      console.log('📊 Exercise details:', {
        id: foundExercise.id,
        name: foundExercise.exerciseName,
        timestamp: foundExercise.timestamp?.toISOString(),
        activityType: foundExercise.activityType
      });
      
      return {
        success: true,
        message: 'Date consistency test passed - exercise saved and retrieved successfully',
        exerciseId: savedId,
        foundExercise: foundExercise
      };
    } else {
      console.log('❌ FAILURE: Test exercise not found in retrieved data');
      console.log('📊 Retrieved exercises:', retrievedExercises.map(ex => ({
        id: ex.id,
        name: ex.exerciseName,
        timestamp: ex.timestamp?.toISOString()
      })));
      
      return {
        success: false,
        message: 'Date consistency test failed - exercise saved but not retrieved',
        exerciseId: savedId,
        retrievedCount: retrievedExercises.length
      };
    }
    
  } catch (error) {
    console.error('❌ Date consistency test error:', error);
    return {
      success: false,
      message: 'Date consistency test failed with error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      error: error
    };
  }
};

/**
 * Run a quick date consistency test with today's date
 */
export const quickDateTest = async (userId: string) => {
  const today = new Date();
  // Normalize to avoid timezone issues
  today.setHours(12, 0, 0, 0);
  
  console.log('🚀 Running quick date consistency test...');
  const result = await testDateConsistency(userId, today);
  
  if (result.success) {
    console.log('🎉 Quick test PASSED!', result.message);
  } else {
    console.log('💥 Quick test FAILED!', result.message);
  }
  
  return result;
};

// Make functions globally available for console testing
if (typeof window !== 'undefined') {
  (window as any).testDateConsistency = testDateConsistency;
  (window as any).quickDateTest = quickDateTest;
}
