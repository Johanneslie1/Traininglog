// Debug script to investigate activity classification issues
console.log('🐛 Classification Debug Script Loaded');

// Function to test the complete save and retrieval flow
window.testClassificationFlow = async function() {
  console.log('🔍 Testing complete classification flow...');
  
  try {
    // Get user from Redux store
    const state = window.reduxStore?.getState();
    const user = state?.auth?.user;
    
    if (!user?.id) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    console.log('👤 User ID:', user.id);
    
    // Import required modules
    const { ActivityType } = await import('/src/types/activityTypes.ts');
    const { addExerciseLog } = await import('/src/services/firebase/exerciseLogs.ts');
    const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
    
    console.log('📋 ActivityType enum values:', Object.keys(ActivityType));
    console.log('📋 SPEED_AGILITY value:', ActivityType.SPEED_AGILITY);
    
    // Test the save process exactly like SpeedAgilityActivityPicker
    const testDate = new Date();
    const testExerciseData = {
      exerciseName: 'DEBUG High Knees Classification Test',
      userId: user.id,
      sets: [
        {
          setNumber: 1,
          reps: 15,
          duration: 30,
          distance: 20,
          height: 25,
          rpe: 6,
          intensity: 7
        }
      ],
      activityType: ActivityType.SPEED_AGILITY // Use exact same value as SpeedAgilityActivityPicker
    };
    
    console.log('💾 Saving test exercise with data:', testExerciseData);
    console.log('💾 activityType value being saved:', testExerciseData.activityType);
    console.log('💾 activityType type:', typeof testExerciseData.activityType);
    
    const docId = await addExerciseLog(testExerciseData, testDate);
    console.log('✅ Saved with ID:', docId);
    
    // Wait 2 seconds then retrieve
    setTimeout(async () => {
      console.log('🔍 Retrieving exercises to check classification...');
      
      const exercises = await getAllExercisesByDate(testDate, user.id);
      console.log(`📊 Found ${exercises.length} exercises for today`);
      
      // Find our test exercise
      const testExercise = exercises.find(ex => ex.exerciseName?.includes('DEBUG High Knees Classification Test'));
      
      if (testExercise) {
        console.log('✅ Test exercise found in results:');
        console.log('📝 Exercise data:', {
          id: testExercise.id,
          name: testExercise.exerciseName,
          activityType: testExercise.activityType,
          activityTypeType: typeof testExercise.activityType,
          sets: testExercise.sets?.length,
          firstSet: testExercise.sets?.[0]
        });
        
        // Check if it's being classified correctly
        const isCorrectType = testExercise.activityType === ActivityType.SPEED_AGILITY || 
                             testExercise.activityType === 'speedAgility';
        
        console.log('🎯 Classification check:', {
          savedAs: testExercise.activityType,
          expectedEnum: ActivityType.SPEED_AGILITY,
          expectedString: 'speedAgility',
          isCorrect: isCorrectType
        });
        
        if (isCorrectType) {
          console.log('✅ SUCCESS: Exercise is correctly classified as Speed & Agility!');
        } else {
          console.log('❌ PROBLEM: Exercise is incorrectly classified!');
          console.log('   Expected:', ActivityType.SPEED_AGILITY);
          console.log('   Got:', testExercise.activityType);
        }
      } else {
        console.log('❌ Test exercise not found in retrieval results');
        console.log('📋 Available exercises:');
        exercises.forEach((ex, i) => {
          console.log(`${i + 1}. ${ex.exerciseName} (${ex.activityType})`);
        });
      }
      
    }, 2000);
    
  } catch (error) {
    console.error('❌ Classification test failed:', error);
  }
};

// Function to check enum consistency
window.checkEnumConsistency = async function() {
  console.log('🔍 Checking enum consistency across modules...');
  
  try {
    // Check main ActivityType enum
    const { ActivityType: MainActivityType } = await import('/src/types/activityTypes.ts');
    console.log('🏷️ Main ActivityType enum:', {
      SPEED_AGILITY: MainActivityType.SPEED_AGILITY,
      RESISTANCE: MainActivityType.RESISTANCE,
      ENDURANCE: MainActivityType.ENDURANCE,
      SPORT: MainActivityType.SPORT,
      STRETCHING: MainActivityType.STRETCHING,
      OTHER: MainActivityType.OTHER
    });
    
    // Check if there are any other ActivityType definitions
    try {
      const activityLogModule = await import('/src/types/activityLog.ts');
      console.log('📄 activityLog module exports:', Object.keys(activityLogModule));
      
      if (activityLogModule.mapExerciseTypeToActivityType) {
        console.log('🔄 Testing mapExerciseTypeToActivityType function:');
        console.log('  speedAgility →', activityLogModule.mapExerciseTypeToActivityType('speedAgility'));
        console.log('  speed_agility →', activityLogModule.mapExerciseTypeToActivityType('speed_agility'));
        console.log('  endurance →', activityLogModule.mapExerciseTypeToActivityType('endurance'));
      }
    } catch (error) {
      console.log('⚠️ Could not import activityLog module:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Enum consistency check failed:', error);
  }
};

// Function to test the getExerciseType mapping
window.testExerciseTypeMapping = async function() {
  console.log('🔍 Testing exercise type mapping...');
  
  try {
    const { ActivityType } = await import('/src/types/activityTypes.ts');
    
    // Create a mock exercise like what SpeedAgilityActivityPicker creates
    const mockExercise = {
      id: 'test-exercise',
      name: 'Test High Knees',
      activityType: ActivityType.SPEED_AGILITY,
      type: 'speedAgility',
      category: 'agility'
    };
    
    console.log('🏃 Mock exercise:', mockExercise);
    console.log('🏃 activityType value:', mockExercise.activityType);
    console.log('🏃 activityType === SPEED_AGILITY:', mockExercise.activityType === ActivityType.SPEED_AGILITY);
    
    // Test how UniversalSetLogger processes this
    const getExerciseType = (exercise) => {
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
      return 'unknown';
    };
    
    const mappedType = getExerciseType(mockExercise);
    console.log('🔄 Mapped exercise type:', mappedType);
    
  } catch (error) {
    console.error('❌ Exercise type mapping test failed:', error);
  }
};

console.log('💡 Debug functions available:');
console.log('  testClassificationFlow() - Test complete save/retrieve flow');
console.log('  checkEnumConsistency() - Check ActivityType enum consistency');
console.log('  testExerciseTypeMapping() - Test exercise type mapping logic');
