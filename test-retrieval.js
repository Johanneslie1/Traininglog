// Quick test to verify exercise retrieval with type information
(function() {
  console.log('🔍 Quick Exercise Retrieval Test');
  
  // Test function to check recent exercises
  window.testExerciseRetrieval = async function() {
    try {
      const user = window.reduxStore?.getState()?.auth?.user;
      if (!user?.id) {
        console.error('❌ No authenticated user found');
        return;
      }
      
      console.log('👤 User ID:', user.id);
      
      // Import the getExerciseLogs function
      const { getExerciseLogs } = await import('./src/services/firebase/exerciseLogs.ts');
      
      // Get today's exercises
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      console.log('📅 Fetching exercises for:', startOfDay.toISOString(), 'to', endOfDay.toISOString());
      
      const exercises = await getExerciseLogs(user.id, startOfDay, endOfDay);
      
      console.log('📋 Retrieved exercises count:', exercises.length);
      exercises.forEach((exercise, index) => {
        console.log(`📝 Exercise ${index + 1}:`, {
          id: exercise.id,
          name: exercise.exerciseName,
          type: exercise.exerciseType,
          categories: exercise.categories,
          sets: exercise.sets?.length || 0,
          timestamp: exercise.timestamp
        });
      });
      
      if (exercises.length === 0) {
        console.warn('⚠️ No exercises found. This could mean:');
        console.warn('  1. No exercises logged today');
        console.warn('  2. Issue with date range');
        console.warn('  3. Permission problem');
        console.warn('  4. Data saved in different collection path');
      }
      
    } catch (error) {
      console.error('❌ Error during test:', error);
    }
  };
  
  console.log('💡 Run: testExerciseRetrieval() to check recent exercises');
})();
