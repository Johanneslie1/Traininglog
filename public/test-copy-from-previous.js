// Test script to verify copy from previous day functionality
(async () => {
  console.log('🧪 Testing Copy from Previous Day Functionality');
  
  try {
    // Import necessary functions
    const { addExerciseLog } = await import('/src/services/firebase/exerciseLogs.ts');
    const { ExerciseDataService } = await import('/src/services/exerciseDataService.ts');
    const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
    
    const testUserId = 'test-copy-user-' + Date.now();
    
    // Create test data for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);
    
    console.log('📅 Creating test exercise for yesterday:', yesterday.toISOString());
    
    const testExercise = {
      exerciseName: 'Test Bench Press',
      userId: testUserId,
      sets: [
        { reps: 10, weight: 80, restTime: 120, completed: true },
        { reps: 8, weight: 85, restTime: 120, completed: true },
        { reps: 6, weight: 90, restTime: 120, completed: true }
      ],
      activityType: 'resistance'
    };
    
    // Save exercise to yesterday
    const exerciseId = await addExerciseLog(testExercise, yesterday);
    console.log('✅ Created test exercise with ID:', exerciseId);
    
    // Test the copy functionality by getting yesterday's exercises
    console.log('📋 Getting yesterday\'s exercises...');
    const yesterdayExercises = await getAllExercisesByDate(yesterday, testUserId);
    console.log('📊 Found exercises:', yesterdayExercises.length);
    
    if (yesterdayExercises.length > 0) {
      yesterdayExercises.forEach((ex, i) => {
        console.log(`${i + 1}. ${ex.exerciseName} (${ex.activityType || 'no-type'})`);
        console.log(`   Sets: ${ex.sets?.length || 0}`);
        console.log(`   Data structure:`, {
          hasExerciseName: !!ex.exerciseName,
          hasName: !!ex.name,
          hasActivityType: !!ex.activityType,
          hasSets: !!ex.sets,
          hasTimestamp: !!ex.timestamp
        });
      });
      
      // Test copying to today
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      console.log('🔄 Testing copy to today...');
      
      // Simulate the copy process
      const copiedExercise = {
        ...yesterdayExercises[0],
        id: undefined, // Remove old ID
        timestamp: today // Set new timestamp
      };
      
      console.log('📝 Copying exercise data:', copiedExercise);
      
      // Save copied exercise using the same flow as the UI
      const copiedId = await addExerciseLog({
        exerciseName: copiedExercise.exerciseName,
        userId: testUserId,
        sets: copiedExercise.sets || [],
        ...(copiedExercise.activityType && { activityType: copiedExercise.activityType })
      }, today);
      
      console.log('✅ Successfully copied exercise with ID:', copiedId);
      
      // Verify the copy worked
      const todayExercises = await getAllExercisesByDate(today, testUserId);
      console.log('🎯 Today\'s exercises after copy:', todayExercises.length);
      
      if (todayExercises.length > 0) {
        console.log('✅ Copy functionality working correctly!');
        todayExercises.forEach((ex, i) => {
          console.log(`${i + 1}. ${ex.exerciseName} (copied)`);
        });
      } else {
        console.error('❌ Copy failed - no exercises found for today');
      }
      
    } else {
      console.error('❌ No test exercises found for yesterday');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
})();