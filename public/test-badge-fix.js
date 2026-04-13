// Test script to verify the activity type badge fix
console.log('🧪 Testing Activity Type Badge Fix...');

// Function to test the badge display logic
window.testActivityTypeBadge = function() {
  console.log('🔍 Testing Activity Type Badge Logic...');
  
  // Test the getActivityTypeDisplay function
  const testActivityTypes = [
    'speedAgility',
    'endurance', 
    'sport',
    'stretching',
    'resistance',
    'other',
    undefined,
    null
  ];
  
  testActivityTypes.forEach(activityType => {
    try {
      // This should call the same function that ExerciseCard.tsx uses
      console.log(`📋 ActivityType "${activityType}":`);
      
      // Simulate what happens in the component
      let displayText;
      if (window.getActivityTypeDisplay) {
        const display = window.getActivityTypeDisplay(activityType);
        displayText = display.name + ' Activity';
      } else {
        displayText = 'Function not available';
      }
      
      console.log(`   ➜ Badge Text: "${displayText}"`);
    } catch (error) {
      console.error(`   ❌ Error for ${activityType}:`, error);
    }
  });
};

// Function to test with actual data
window.testWithRealData = async function() {
  console.log('🔍 Testing with Real Exercise Data...');
  
  try {
    // Get current user
    const state = window.reduxStore?.getState();
    const user = state?.auth?.user;
    
    if (!user?.id) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    // Get today's exercises
    const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
    const today = new Date();
    const exercises = await getAllExercisesByDate(today, user.id);
    
    console.log(`📊 Found ${exercises.length} exercises for today`);
    
    exercises.forEach((exercise, index) => {
      console.log(`📝 Exercise ${index + 1}: ${exercise.exerciseName}`);
      console.log(`   ActivityType: "${exercise.activityType}"`);
      
      // Test badge display for this exercise
      if (window.getActivityTypeDisplay) {
        const display = window.getActivityTypeDisplay(exercise.activityType);
        const badgeText = display.name + ' Activity';
        console.log(`   Badge Text: "${badgeText}"`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing with real data:', error);
  }
};

console.log('💡 Test functions available:');
console.log('  testActivityTypeBadge() - Test badge display logic for different activity types');
console.log('  testWithRealData() - Test with actual exercise data from today');
