// Test data retrieval functionality
import { getAllExercisesByDate } from './unifiedExerciseUtils';
import { getAuth } from 'firebase/auth';

export const testDataRetrieval = async () => {
  console.log('🧪 =========================');
  console.log('🧪 DATA RETRIEVAL TEST');
  console.log('🧪 =========================');
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No authenticated user found');
    return;
  }
  
  console.log('✅ User authenticated:', currentUser.uid);
  
  // Test for today's date
  const today = new Date();
  console.log('📅 Testing data retrieval for:', today.toLocaleDateString());
  
  try {
    const exercises = await getAllExercisesByDate(today, currentUser.uid);
    console.log('📊 Retrieved exercises:', exercises.length);
    
    if (exercises.length > 0) {
      console.log('✅ SUCCESS: Found exercises!');
      exercises.forEach((ex, i) => {
        console.log(`${i + 1}. ${ex.exerciseName} (${ex.activityType || 'resistance'})`);
        console.log(`   - Sets: ${ex.sets?.length || 0}`);
        console.log(`   - Time: ${ex.timestamp?.toLocaleTimeString()}`);
      });
    } else {
      console.log('⚠️ No exercises found for today');
      
      // Try yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      console.log('📅 Trying yesterday:', yesterday.toLocaleDateString());
      
      const yesterdayExercises = await getAllExercisesByDate(yesterday, currentUser.uid);
      console.log('📊 Yesterday exercises:', yesterdayExercises.length);
      
      if (yesterdayExercises.length > 0) {
        console.log('✅ Found exercises from yesterday - the fix is working!');
        yesterdayExercises.forEach((ex, i) => {
          console.log(`${i + 1}. ${ex.exerciseName} (${ex.activityType || 'resistance'})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error retrieving data:', error);
  }
  
  console.log('🧪 Test completed');
};

// Make function globally available
if (typeof window !== 'undefined') {
  (window as any).testDataRetrieval = testDataRetrieval;
  console.log('🧪 Test function loaded! Run: testDataRetrieval()');
}

export default testDataRetrieval;
