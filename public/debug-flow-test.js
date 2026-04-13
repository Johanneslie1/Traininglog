// Debug script to test speed & agility exercise data flow
console.log('🔍 Speed & Agility Debug Test Starting...');

window.debugSpeedAgilityFlow = async function() {
  console.log('=== Speed & Agility Debug Flow ===');
  
  try {
    // Get user from Redux store
    const state = window.reduxStore?.getState();
    const user = state?.auth?.user;
    
    if (!user?.id) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    console.log('👤 User ID:', user.id);
    
    // Step 1: Test saving a speed & agility exercise
    console.log('\n🔹 Step 1: Testing Speed & Agility Save...');
    
    const { saveLog } = await import('/src/services/firebase/unifiedLogs.ts');
    const { ActivityType } = await import('/src/types/activityTypes.ts');
    
    const today = new Date();
    const testLogData = {
      activityName: 'DEBUG High Knees Flow Test',
      userId: user.id,
      sets: [
        {
          setNumber: 1,
          reps: 10,
          duration: 30,
          distance: 25,
          height: 20,
          intensity: 7,
          rpe: 6,
          restTime: 90
        }
      ],
      exerciseType: 'speedAgility',
      activityType: ActivityType.SPEED_AGILITY
    };
    
    console.log('💾 Saving test data:', testLogData);
    const docId = await saveLog(testLogData, today);
    console.log('✅ Saved with document ID:', docId);
    
    // Step 2: Wait and then retrieve the exercise
    setTimeout(async () => {
      console.log('\n🔹 Step 2: Testing Retrieval...');
      
      const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
      const exercises = await getAllExercisesByDate(today, user.id);
      
      console.log(`📊 Retrieved ${exercises.length} exercises for today`);
      
      // Find our test exercise
      const testExercise = exercises.find(ex => 
        ex.exerciseName?.includes('DEBUG High Knees Flow Test')
      );
      
      if (testExercise) {
        console.log('✅ Test exercise found:', {
          id: testExercise.id,
          name: testExercise.exerciseName,
          activityType: testExercise.activityType,
          sets: testExercise.sets?.length,
          firstSet: testExercise.sets?.[0]
        });
        
        // Step 3: Test the display logic
        console.log('\n🔹 Step 3: Testing Display Logic...');
        
        // Check activity type detection
        const isSpeedAgility = testExercise.activityType === ActivityType.SPEED_AGILITY || 
                              testExercise.activityType === 'speedAgility';
        
        console.log('🎯 Activity Type Check:', {
          activityType: testExercise.activityType,
          isSpeedAgility: isSpeedAgility,
          typeofActivityType: typeof testExercise.activityType,
          enumValue: ActivityType.SPEED_AGILITY
        });
        
        // Check non-resistance detection logic
        const isNonResistance = testExercise.activityType !== ActivityType.RESISTANCE &&
                               testExercise.activityType !== 'resistance' &&
                               testExercise.activityType !== 'strength';
        
        console.log('🔍 Non-resistance Detection:', {
          isNonResistance: isNonResistance,
          willShowActivityBadge: isNonResistance
        });
        
        // Check what the badge would display
        const badgeText = (testExercise.activityType || 'Unknown').charAt(0).toUpperCase() + 
                         (testExercise.activityType || 'Unknown').slice(1) + ' Activity';
        
        console.log('🏷️ Badge Text:', badgeText);
        
        // Check field detection
        const firstSet = testExercise.sets?.[0];
        if (firstSet) {
          console.log('📋 First Set Data:', {
            reps: firstSet.reps,
            duration: firstSet.duration,
            distance: firstSet.distance,
            height: firstSet.height,
            intensity: firstSet.intensity,
            rpe: firstSet.rpe,
            restTime: firstSet.restTime
          });
        }
        
      } else {
        console.error('❌ Test exercise not found in retrieved exercises');
        console.log('Available exercises:', exercises.map(ex => ({
          name: ex.exerciseName,
          type: ex.activityType
        })));
      }
      
    }, 2000);
    
  } catch (error) {
    console.error('❌ Debug flow failed:', error);
  }
};

// Auto-run the debug test
setTimeout(() => {
  if (window.reduxStore?.getState()?.auth?.user?.id) {
    console.log('🚀 Auto-running speed & agility debug flow...');
    window.debugSpeedAgilityFlow();
  } else {
    console.log('⏳ Waiting for user authentication...');
    setTimeout(() => {
      if (window.reduxStore?.getState()?.auth?.user?.id) {
        window.debugSpeedAgilityFlow();
      }
    }, 3000);
  }
}, 1000);

console.log('💡 Debug function available: window.debugSpeedAgilityFlow()');
