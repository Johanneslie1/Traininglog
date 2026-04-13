// Debug script for Speed Agility exercise logging
console.log('🐛 Speed Agility Debug Script Loaded');

// Function to debug the save process
window.debugSpeedAgilitySave = async function() {
  console.log('🔍 Starting Speed Agility Save Debug...');
  
  try {
    // Get user from Redux store
    const state = window.reduxStore?.getState();
    const user = state?.auth?.user;
    
    if (!user?.id) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    console.log('👤 User ID:', user.id);
    
    // Test the collection routing logic
    const { getCollectionTypeFromExerciseType, mapExerciseTypeToActivityType } = await import('/src/types/activityLog.ts');
    
    const exerciseType = 'speedAgility';
    const collectionType = getCollectionTypeFromExerciseType(exerciseType);
    const activityType = mapExerciseTypeToActivityType(exerciseType);
    
    console.log('🎯 Collection Routing Test:', {
      exerciseType,
      collectionType,
      activityType
    });
    
    // Test the unified save function with specific date
    const { saveLog } = await import('/src/services/firebase/unifiedLogs.ts');
    
    // Use today's date but normalized to avoid timezone issues
    const today = new Date();
    const normalizedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const testLogData = {
      activityName: 'DEBUG High Knees',
      userId: user.id,
      sets: [
        {
          setNumber: 1,
          reps: 10,
          duration: 30, // 30 seconds
          distance: 25, // meters
          height: 20, // cm
          rpe: 7
        }
      ],
      exerciseType: 'speedAgility'
    };
    
    console.log('💾 Attempting to save test speed agility exercise:', testLogData);
    console.log('📅 Using normalized date:', normalizedDate.toISOString());
    
    const docId = await saveLog(testLogData, normalizedDate);
    
    console.log('✅ Test exercise saved with ID:', docId);
    
    // Now test retrieval
    setTimeout(async () => {
      console.log('🔍 Testing retrieval after 2 seconds...');
      
      const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
      const exercises = await getAllExercisesByDate(normalizedDate, user.id);
      
      console.log('📋 Retrieved exercises:', exercises.length);
      exercises.forEach((ex, index) => {
        console.log(`📝 Exercise ${index + 1}:`, {
          id: ex.id,
          name: ex.exerciseName,
          activityType: ex.activityType,
          sets: ex.sets?.length || 0,
          timestamp: ex.timestamp?.toISOString()
        });
      });
      
      const speedAgilityExercises = exercises.filter(ex => 
        ex.exerciseName?.includes('High Knees') || 
        ex.activityType === 'speedAgility' ||
        ex.activityType === 'speed_agility' ||
        (ex as any).activityType === 'SPEED_AGILITY'
      );
      
      console.log('⚡ Speed Agility exercises found:', speedAgilityExercises.length);
      speedAgilityExercises.forEach(ex => {
        console.log('⚡ Speed Agility exercise:', ex);
      });
      
    }, 2000);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
};

// Function to check existing data
window.checkExistingSpeedAgility = async function() {
  console.log('🔍 Checking existing Speed Agility data...');
  
  try {
    const state = window.reduxStore?.getState();
    const user = state?.auth?.user;
    
    if (!user?.id) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    // Check activities collection for August 28, 2025
    const { getActivityLogs } = await import('/src/services/firebase/activityLogs.ts');
    const targetDate = new Date(2025, 7, 28); // August 28, 2025
    const startOfDay = new Date(2025, 7, 28, 0, 0, 0, 0);
    const endOfDay = new Date(2025, 7, 28, 23, 59, 59, 999);
    
    console.log('📅 Checking date range:', {
      targetDate: targetDate.toISOString(),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });
    
    const activities = await getActivityLogs(user.id, startOfDay, endOfDay);
    
    console.log('🏃 Activities collection:', activities.length, 'items');
    activities.forEach(activity => {
      console.log('🏃 Activity:', {
        id: activity.id,
        name: activity.activityName,
        type: activity.activityType,
        sets: activity.sets?.length || 0,
        timestamp: activity.timestamp?.toISOString()
      });
    });
    
    // Check unified retrieval
    const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
    const exercises = await getAllExercisesByDate(targetDate, user.id);
    
    console.log('📋 Unified retrieval:', exercises.length, 'exercises');
    exercises.forEach(ex => {
      console.log('📝 Exercise:', {
        id: ex.id,
        name: ex.exerciseName,
        activityType: ex.activityType,
        sets: ex.sets?.length || 0,
        timestamp: ex.timestamp?.toISOString()
      });
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
};

// Function to test the date conversion specifically
window.testDateConversion = function() {
  console.log('📅 Testing date conversion...');
  
  const testDate = new Date(2025, 7, 28); // August 28, 2025
  console.log('Original date:', testDate.toISOString());
  
  // Test the normalization from activityLogs.ts
  const year = testDate.getFullYear();
  const month = testDate.getMonth(); 
  const day = testDate.getDate();
  const normalizedSave = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  console.log('Normalized for save (UTC noon):', normalizedSave.toISOString());
  
  // Test the range from unifiedExerciseUtils.ts
  const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  console.log('Query range start (UTC):', startOfDay.toISOString());
  console.log('Query range end (UTC):', endOfDay.toISOString());
  
  // Check if save time is within range
  const isInRange = normalizedSave >= startOfDay && normalizedSave <= endOfDay;
  console.log('✅ Save time is within query range:', isInRange);
};

console.log('💡 Debug functions available:');
console.log('  debugSpeedAgilitySave() - Test save and retrieve flow');
console.log('  checkExistingSpeedAgility() - Check existing data for Aug 28');
console.log('  testDateConversion() - Test date normalization logic');
