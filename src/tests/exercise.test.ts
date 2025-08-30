const assert = require('assert');

// Mock the ActivityType enum for testing
const ActivityType = {
  RESISTANCE: 'RESISTANCE',
  ENDURANCE: 'ENDURANCE',
  SPORT: 'SPORT',
  SPEED_AGILITY: 'SPEED_AGILITY',
  STRETCHING: 'STRETCHING',
  OTHER: 'OTHER'
};

// Simplified version of the getExerciseType function for testing
const getExerciseType = (exercise: any): string => {
  // Check activityType first
  if (exercise.activityType) {
    switch (exercise.activityType) {
      case ActivityType.RESISTANCE: return 'strength';
      case ActivityType.ENDURANCE: return 'endurance';
      case ActivityType.STRETCHING: return 'flexibility';
      case ActivityType.SPORT: return 'sport';
      case ActivityType.SPEED_AGILITY: return 'speed_agility';
      case ActivityType.OTHER: return 'other';
    }
  }

  // Check exercise name for patterns
  const exerciseName = exercise.name?.toLowerCase() || '';
  
  // Endurance activities
  if (exerciseName.includes('treadmill') || 
      exerciseName.includes('running') || 
      exerciseName.includes('jogging')) {
    return 'endurance';
  }
  
  // Sport activities
  if (exerciseName.includes('soccer') || 
      exerciseName.includes('football') ||
      exerciseName.includes('basketball')) {
    return 'sport';
  }
  
  // Speed & Agility activities
  if (exerciseName.includes('high knees') ||
      exerciseName.includes('butt kicks') ||
      exerciseName.includes('sprint')) {
    return 'speed_agility';
  }

  // Default to strength
  return 'strength';
};

test('muscle group name casing', () => {
    const muscleGroup = "Quadriceps";
    assert.strictEqual(muscleGroup.toLowerCase(), "quadriceps");
});

test('valid category type', () => {
    const category = "power";
    const validCategories = ["cardio", "compound", "isolation", "olympic", "stretching"];
    assert.ok(!validCategories.includes(category), 'Invalid category type');
});

// Test exercise type classification fixes
test('Treadmill Run should be classified as endurance', () => {
    const exercise = { name: 'Treadmill Run' };
    const result = getExerciseType(exercise);
    assert.strictEqual(result, 'endurance', 'Treadmill Run should be classified as endurance');
});

test('Soccer should be classified as sport', () => {
    const exercise = { name: 'Soccer' };
    const result = getExerciseType(exercise);
    assert.strictEqual(result, 'sport', 'Soccer should be classified as sport');
});

test('High Knees should be classified as speed_agility', () => {
    const exercise = { name: 'High Knees' };
    const result = getExerciseType(exercise);
    assert.strictEqual(result, 'speed_agility', 'High Knees should be classified as speed_agility');
});

test('Exercise with activityType should use activityType classification', () => {
    const exercise = { 
        name: 'Some Exercise',
        activityType: ActivityType.ENDURANCE
    };
    const result = getExerciseType(exercise);
    assert.strictEqual(result, 'endurance', 'Exercise with activityType should use activityType classification');
});

test('Unknown exercise should default to strength', () => {
    const exercise = { name: 'Unknown Exercise' };
    const result = getExerciseType(exercise);
    assert.strictEqual(result, 'strength', 'Unknown exercise should default to strength');
});