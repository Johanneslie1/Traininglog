// Simple debug script using existing app functions
console.log('🔍 Simple Activity Debug Script Loaded');

window.debugActivityQuery = async function() {
  console.log('🔍 Testing activity query using existing functions...');
  
  try {
    const userId = 'Bnz8b5dGcsaWXFYwo9a48NqL19y2';
    console.log('👤 User ID:', userId);
    
    // Use the existing getActivityLogs function
    const { getActivityLogs } = await import('/src/services/firebase/activityLogs.ts');
    
    // Test different date ranges
    const dates = [
      {
        name: 'Today (Aug 28, 2025)',
        start: new Date(2025, 7, 28, 0, 0, 0, 0),
        end: new Date(2025, 7, 28, 23, 59, 59, 999)
      },
      {
        name: 'This week',
        start: new Date(2025, 7, 24, 0, 0, 0, 0),
        end: new Date(2025, 7, 30, 23, 59, 59, 999)
      },
      {
        name: 'This month',
        start: new Date(2025, 7, 1, 0, 0, 0, 0),
        end: new Date(2025, 7, 31, 23, 59, 59, 999)
      }
    ];
    
    for (const dateRange of dates) {
      console.log(`\n📅 Testing ${dateRange.name}:`);
      console.log('  Start:', dateRange.start.toISOString());
      console.log('  End:', dateRange.end.toISOString());
      
      const activities = await getActivityLogs(userId, dateRange.start, dateRange.end);
      console.log(`  Found ${activities.length} activities`);
      
      activities.forEach((activity, index) => {
        console.log(`  🏃 Activity ${index + 1}:`, {
          id: activity.id,
          name: activity.activityName,
          type: activity.activityType,
          timestamp: activity.timestamp?.toDate?.()?.toISOString() || 'No timestamp',
          sets: activity.sets?.length || 0
        });
      });
      
      // Filter for High Knees
      const highKnees = activities.filter(a => 
        a.activityName?.toLowerCase().includes('high knees')
      );
      if (highKnees.length > 0) {
        console.log(`  ⚡ High Knees found: ${highKnees.length}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing activity query:', error);
  }
};

window.testDirectQuery = async function() {
  console.log('🔍 Testing direct Firestore query...');
  
  try {
    const userId = 'Bnz8b5dGcsaWXFYwo9a48NqL19y2';
    
    // Use the unified exercise utils function
    const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
    
    const testDate = new Date(2025, 7, 28); // August 28, 2025
    console.log('📅 Testing date:', testDate.toISOString());
    
    const exercises = await getAllExercisesByDate(testDate, userId);
    console.log(`📊 Total exercises found: ${exercises.length}`);
    
    exercises.forEach((exercise, index) => {
      console.log(`📝 Exercise ${index + 1}:`, {
        id: exercise.id,
        name: exercise.exerciseName,
        type: exercise.activityType || exercise.exerciseType,
        timestamp: exercise.timestamp?.toISOString?.() || 'No timestamp',
        sets: exercise.sets?.length || 0
      });
    });
    
    // Look for Speed Agility exercises specifically
    const speedAgility = exercises.filter(ex => 
      ex.activityType === 'speedAgility' || 
      ex.activityType === 'speed_agility' ||
      ex.exerciseName?.toLowerCase().includes('high knees')
    );
    
    console.log(`⚡ Speed Agility exercises found: ${speedAgility.length}`);
    speedAgility.forEach(ex => {
      console.log('⚡ Speed Agility:', ex);
    });
    
  } catch (error) {
    console.error('❌ Error testing direct query:', error);
  }
};

window.testTodaySave = async function() {
  console.log('🔍 Testing save for today and immediate retrieval...');
  
  try {
    const userId = 'Bnz8b5dGcsaWXFYwo9a48NqL19y2';
    const today = new Date(); // Current date
    
    console.log('📅 Today:', today.toISOString());
    
    // Use the unified save function
    const { saveLog } = await import('/src/services/firebase/unifiedLogs.ts');
    
    const testLogData = {
      activityName: 'TEST High Knees - ' + Date.now(),
      userId: userId,
      sets: [
        {
          setNumber: 1,
          reps: 5,
          duration: 15,
          distance: 10,
          height: 15,
          rpe: 5
        }
      ],
      exerciseType: 'speedAgility'
    };
    
    console.log('💾 Saving test exercise:', testLogData.activityName);
    const docId = await saveLog(testLogData, today);
    console.log('✅ Saved with ID:', docId);
    
    // Wait 2 seconds then retrieve
    setTimeout(async () => {
      console.log('🔍 Retrieving exercises for today...');
      const { getAllExercisesByDate } = await import('/src/utils/unifiedExerciseUtils.ts');
      const exercises = await getAllExercisesByDate(today, userId);
      
      console.log(`📊 Found ${exercises.length} exercises for today`);
      
      const testExercise = exercises.find(ex => ex.exerciseName?.includes('TEST High Knees'));
      if (testExercise) {
        console.log('✅ TEST exercise found in results:', testExercise);
      } else {
        console.log('❌ TEST exercise NOT found in results');
        console.log('🔍 All exercises:', exercises);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error testing save/retrieve:', error);
  }
};

console.log('💡 Simple debug functions available:');
console.log('  debugActivityQuery() - Test activity queries with different date ranges');
console.log('  testDirectQuery() - Test unified exercise query for Aug 28, 2025');
console.log('  testTodaySave() - Save test exercise for today and verify retrieval');
