// Test script for exercise display functionality
console.log('🧪 Testing Exercise Display Logic');

// Mock exercise data to test the logic
const testExercises = [
  {
    id: '1',
    exerciseName: 'Morning Run',
    activityType: 'endurance',
    sets: [{
      weight: 0,
      reps: 1,
      difficulty: 'moderate',
      duration: 30,
      distance: 5,
      calories: 300,
      averageHeartRate: 150,
      pace: '6:00/km'
    }],
    timestamp: new Date()
  },
  {
    id: '2', 
    exerciseName: 'Bench Press',
    activityType: 'resistance',
    sets: [{
      weight: 80,
      reps: 10,
      difficulty: 'moderate'
    }],
    timestamp: new Date()
  },
  {
    id: '3',
    exerciseName: 'Yoga Session',
    activityType: 'flexibility',
    sets: [{
      weight: 0,
      reps: 1,
      difficulty: 'easy',
      duration: 45,
      holdTime: 30,
      intensity: 6,
      stretchType: 'static'
    }],
    timestamp: new Date()
  }
];

// Test the detection logic
testExercises.forEach(exercise => {
  console.log(`\n📋 Testing: ${exercise.exerciseName}`);
  console.log('Activity Type:', exercise.activityType);
  console.log('First Set:', exercise.sets[0]);
  
  // Simulate the detection logic from ExerciseCard
  const isNonResistance = (exercise.activityType && 
    !['resistance', 'strength'].includes(exercise.activityType)) ||
    (exercise.sets?.[0] && (
      ((!exercise.sets[0].weight || exercise.sets[0].weight === 0) && 
       (!exercise.sets[0].reps || exercise.sets[0].reps <= 1)) &&
      (exercise.sets[0].duration || exercise.sets[0].distance || exercise.sets[0].calories ||
       exercise.sets[0].averageHeartRate || exercise.sets[0].holdTime || exercise.sets[0].pace)
    ));
  
  console.log('🎯 Detection Result:', isNonResistance ? 'NON-RESISTANCE (will show detailed metrics)' : 'RESISTANCE (will show weight/reps)');
  
  if (isNonResistance) {
    console.log('✅ This exercise will display comprehensive activity data');
  } else {
    console.log('📊 This exercise will display traditional weight/reps format');
  }
});

console.log('\n💡 Test completed. Check the console output above to verify the detection logic is working correctly.');
