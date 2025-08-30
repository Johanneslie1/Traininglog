// Simple fix test
console.log('🔧 Fix Test Script Loaded');

window.testFixedQuery = async function() {
  console.log('🔧 Testing fixed query logic...');
  
  try {
    const userId = 'Bnz8b5dGcsaWXFYwo9a48NqL19y2';
    
    // Test the fixed getAllExercisesByDate function
    const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
    
    // Use today's date (August 28, 2025) 
    const testDate = new Date(2025, 7, 28); // Local date
    console.log('📅 Testing with date:', testDate.toISOString());
    
    const exercises = await getAllExercisesByDate(testDate, userId);
    console.log(`📊 Retrieved exercises: ${exercises.length}`);
    
    exercises.forEach((exercise, index) => {
      console.log(`📝 Exercise ${index + 1}:`, {
        id: exercise.id,
        name: exercise.exerciseName,
        type: exercise.activityType || exercise.exerciseType,
        timestamp: exercise.timestamp?.toISOString?.() || 'No timestamp',
        sets: exercise.sets?.length || 0
      });
    });
    
    // Look specifically for High Knees or TEST exercises
    const speedAgilityExercises = exercises.filter(ex => 
      ex.exerciseName?.toLowerCase().includes('high knees') ||
      ex.exerciseName?.toLowerCase().includes('test') ||
      ex.activityType === 'speedAgility' ||
      ex.activityType === 'speed_agility'
    );
    
    console.log(`⚡ Speed Agility exercises found: ${speedAgilityExercises.length}`);
    speedAgilityExercises.forEach(ex => {
      console.log('⚡ Speed Agility:', {
        id: ex.id,
        name: ex.exerciseName,
        type: ex.activityType,
        timestamp: ex.timestamp?.toISOString?.()
      });
    });
    
    if (exercises.length > 0) {
      console.log('✅ SUCCESS: Exercises are now being retrieved!');
    } else {
      console.log('❌ Still no exercises found. Let\'s check the raw activity query...');
      
      // Test the activity logs function directly
      const { getActivityLogs } = await import('/src/services/firebase/activityLogs.ts');
      
      // Use the same date normalization as the unified function
      const year = testDate.getFullYear();
      const month = testDate.getMonth();
      const day = testDate.getDate();
      const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      
      console.log('🔍 Testing raw activity query with range:', {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      });
      
      const activities = await getActivityLogs(userId, startOfDay, endOfDay);
      console.log(`🏃 Raw activities found: ${activities.length}`);
      
      activities.forEach(activity => {
        console.log('🏃 Raw activity:', {
          id: activity.id,
          name: activity.activityName,
          type: activity.activityType,
          timestamp: activity.timestamp?.toDate?.()?.toISOString()
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing fix:', error);
  }
};

console.log('💡 Fix test function available:');
console.log('  testFixedQuery() - Test the fixed query logic');
