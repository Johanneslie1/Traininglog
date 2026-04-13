// Complete flow test for speed & agility classification
console.log('🧪 Complete Flow Test Script Loaded');

window.testCompleteSpeedAgilityFlow = async function() {
  console.log('🚀 Starting complete Speed & Agility classification test...');
  
  try {
    // Get user from Redux store
    const state = window.reduxStore?.getState();
    const user = state?.auth?.user;
    
    if (!user?.id) {
      console.error('❌ No authenticated user found. Please log in first.');
      return;
    }
    
    console.log('👤 User authenticated:', user.id);
    
    // Import required modules
    const { ActivityType } = await import('/src/types/activityTypes.ts');
    const { addExerciseLog } = await import('/src/services/firebase/exerciseLogs.ts');
    const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
    const { getActivityTypeDisplay } = await import('/src/utils/unifiedExerciseUtils.ts');
    
    console.log('📋 Testing with ActivityType values:');
    console.log('  SPEED_AGILITY:', ActivityType.SPEED_AGILITY);
    console.log('  RESISTANCE:', ActivityType.RESISTANCE);
    console.log('  Type of SPEED_AGILITY:', typeof ActivityType.SPEED_AGILITY);
    
    // Test 1: Save a speed & agility exercise exactly like SpeedAgilityActivityPicker does
    const testDate = new Date();
    const speedAgilityData = {
      exerciseName: 'TEST Complete Flow - High Knees',
      userId: user.id,
      sets: [
        {
          setNumber: 1,
          reps: 20,
          duration: 30,
          time: 1.5,
          distance: 15,
          height: 30,
          intensity: 7,
          rpe: 6,
          restTime: 90
        }
      ],
      activityType: ActivityType.SPEED_AGILITY
    };
    
    console.log('💾 Step 1: Saving Speed & Agility exercise');
    console.log('💾 Data being saved:', {
      exerciseName: speedAgilityData.exerciseName,
      activityType: speedAgilityData.activityType,
      activityTypeValue: ActivityType.SPEED_AGILITY,
      isEqual: speedAgilityData.activityType === ActivityType.SPEED_AGILITY,
      sets: speedAgilityData.sets.length
    });
    
    const speedAgilityId = await addExerciseLog(speedAgilityData, testDate);
    console.log('✅ Speed & Agility exercise saved with ID:', speedAgilityId);
    
    // Test 2: Save a resistance exercise for comparison
    const resistanceData = {
      exerciseName: 'TEST Complete Flow - Bench Press',
      userId: user.id,
      sets: [
        {
          setNumber: 1,
          weight: 80,
          reps: 10,
          rpe: 7
        }
      ],
      activityType: ActivityType.RESISTANCE
    };
    
    console.log('💾 Step 2: Saving Resistance exercise for comparison');
    const resistanceId = await addExerciseLog(resistanceData, testDate);
    console.log('✅ Resistance exercise saved with ID:', resistanceId);
    
    // Wait 3 seconds then retrieve and analyze
    setTimeout(async () => {
      console.log('🔍 Step 3: Retrieving exercises to verify classification...');
      
      const exercises = await getAllExercisesByDate(testDate, user.id);
      console.log(`📊 Total exercises found: ${exercises.length}`);
      
      // Find our test exercises
      const speedAgilityExercise = exercises.find(ex => 
        ex.exerciseName?.includes('TEST Complete Flow - High Knees')
      );
      
      const resistanceExercise = exercises.find(ex => 
        ex.exerciseName?.includes('TEST Complete Flow - Bench Press')
      );
      
      console.log('🎯 Step 4: Classification Analysis');
      
      if (speedAgilityExercise) {
        console.log('⚡ Speed & Agility Exercise Analysis:');
        console.log('  📝 Exercise Name:', speedAgilityExercise.exerciseName);
        console.log('  🏷️ Activity Type (raw):', speedAgilityExercise.activityType);
        console.log('  🏷️ Activity Type (type):', typeof speedAgilityExercise.activityType);
        console.log('  🏷️ Expected Value:', ActivityType.SPEED_AGILITY);
        console.log('  ✅ Correctly Classified:', speedAgilityExercise.activityType === ActivityType.SPEED_AGILITY);
        console.log('  🎭 Display Name:', getActivityTypeDisplay(speedAgilityExercise.activityType).name);
        console.log('  📊 Sets Count:', speedAgilityExercise.sets?.length);
        console.log('  📊 First Set:', speedAgilityExercise.sets?.[0]);
        
        // Test the classification check used in ExerciseCard
        const isSpeedAgility = (speedAgilityExercise.activityType === ActivityType.SPEED_AGILITY) || 
                              (speedAgilityExercise.activityType === 'speedAgility');
        console.log('  🎨 ExerciseCard Classification:', isSpeedAgility ? 'Non-resistance format' : 'Resistance format');
        
        if (speedAgilityExercise.activityType !== ActivityType.SPEED_AGILITY && speedAgilityExercise.activityType !== 'speedAgility') {
          console.error('❌ CLASSIFICATION PROBLEM DETECTED!');
          console.error('   Expected: Speed & Agility Activity');
          console.error('   Got:', speedAgilityExercise.activityType);
          console.error('   This explains why exercises show as "Resistance Activity"');
        } else {
          console.log('✅ Speed & Agility exercise correctly classified!');
        }
      } else {
        console.error('❌ Speed & Agility test exercise not found in results!');
      }
      
      if (resistanceExercise) {
        console.log('💪 Resistance Exercise Analysis (for comparison):');
        console.log('  📝 Exercise Name:', resistanceExercise.exerciseName);
        console.log('  🏷️ Activity Type:', resistanceExercise.activityType);
        console.log('  ✅ Correctly Classified:', resistanceExercise.activityType === ActivityType.RESISTANCE);
        console.log('  🎭 Display Name:', getActivityTypeDisplay(resistanceExercise.activityType).name);
      }
      
      console.log('🔍 Step 5: All exercises summary:');
      exercises.forEach((ex, i) => {
        console.log(`${i + 1}. ${ex.exerciseName}`);
        console.log(`   Type: ${ex.activityType} (${typeof ex.activityType})`);
        console.log(`   Display: ${getActivityTypeDisplay(ex.activityType).name} Activity`);
        console.log(`   Sets: ${ex.sets?.length || 0}`);
      });
      
    }, 3000);
    
  } catch (error) {
    console.error('❌ Complete flow test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};

// Helper function to check current data
window.checkCurrentClassifications = async function() {
  console.log('🔍 Checking current exercise classifications...');
  
  try {
    const state = window.reduxStore?.getState();
    const user = state?.auth?.user;
    
    if (!user?.id) {
      console.error('❌ No authenticated user');
      return;
    }
    
    const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
    const { getActivityTypeDisplay } = await import('/src/utils/unifiedExerciseUtils.ts');
    const { ActivityType } = await import('/src/types/activityTypes.ts');
    
    const today = new Date();
    const exercises = await getAllExercisesByDate(today, user.id);
    
    console.log(`📊 Found ${exercises.length} exercises for today`);
    
    const classifications = {
      speedAgility: 0,
      resistance: 0,
      endurance: 0,
      sport: 0,
      stretching: 0,
      other: 0,
      unknown: 0
    };
    
    exercises.forEach((ex, i) => {
      const activityType = ex.activityType;
      const displayInfo = getActivityTypeDisplay(activityType);
      
      console.log(`${i + 1}. ${ex.exerciseName}`);
      console.log(`   Raw Type: ${activityType}`);
      console.log(`   Display: ${displayInfo.name} Activity`);
      
      // Count classifications
      switch (activityType) {
        case ActivityType.SPEED_AGILITY:
        case 'speedAgility':
          classifications.speedAgility++;
          break;
        case ActivityType.RESISTANCE:
        case 'resistance':
          classifications.resistance++;
          break;
        case ActivityType.ENDURANCE:
        case 'endurance':
          classifications.endurance++;
          break;
        case ActivityType.SPORT:
        case 'sport':
          classifications.sport++;
          break;
        case ActivityType.STRETCHING:
        case 'stretching':
          classifications.stretching++;
          break;
        case ActivityType.OTHER:
        case 'other':
          classifications.other++;
          break;
        default:
          classifications.unknown++;
          console.warn(`   ⚠️ Unknown classification: ${activityType}`);
      }
    });
    
    console.log('📈 Classification Summary:');
    Object.entries(classifications).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`  ${type}: ${count} exercises`);
      }
    });
    
  } catch (error) {
    console.error('❌ Classification check failed:', error);
  }
};

console.log('💡 Complete Flow Test Functions Available:');
console.log('  testCompleteSpeedAgilityFlow() - Test complete save/retrieve/classify flow');
console.log('  checkCurrentClassifications() - Check current exercise classifications');
