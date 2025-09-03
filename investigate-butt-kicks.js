// Diagnostic for specific Butt Kicks speed agility exercise
console.log('🔍 Investigating why Butt Kicks speed agility exercise is not exported...');

async function investigateSpeedAgilityExport() {
  console.log('\n1️⃣ Checking localStorage for activity logs...');
  
  // Check activity-logs
  const activityLogs = JSON.parse(localStorage.getItem('activity-logs') || '[]');
  console.log(`Total activity logs in localStorage: ${activityLogs.length}`);
  
  // Look for Butt Kicks specifically
  const buttKicksLogs = activityLogs.filter(log => 
    log.activityName && log.activityName.toLowerCase().includes('butt kicks')
  );
  
  console.log(`Butt Kicks logs found: ${buttKicksLogs.length}`);
  
  if (buttKicksLogs.length > 0) {
    console.log('\n📋 Butt Kicks activity details:');
    buttKicksLogs.forEach((log, index) => {
      console.log(`${index + 1}. Activity:`, {
        id: log.id,
        activityName: log.activityName,
        activityType: log.activityType,
        userId: log.userId,
        timestamp: log.timestamp,
        sessions: log.sessions?.length || 0,
        sessionDetails: log.sessions
      });
    });
  } else {
    console.log('❌ No Butt Kicks found in activity-logs');
  }
  
  // Check all speed agility logs
  const speedAgilityLogs = activityLogs.filter(log => 
    log.activityType === 'speedAgility' || 
    log.activityType === 'speed_agility' ||
    log.activityType === 'SPEED_AGILITY'
  );
  
  console.log(`\n⚡ All speed agility logs: ${speedAgilityLogs.length}`);
  speedAgilityLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log.activityName} (${log.activityType})`);
  });
  
  console.log('\n2️⃣ Checking exercise-logs (resistance) for misclassified data...');
  
  // Check if Butt Kicks was saved to exercise-logs instead
  const exerciseLogs = JSON.parse(localStorage.getItem('exercise-logs') || '[]');
  const buttKicksInExerciseLogs = exerciseLogs.filter(log =>
    log.exerciseName && log.exerciseName.toLowerCase().includes('butt kicks')
  );
  
  if (buttKicksInExerciseLogs.length > 0) {
    console.log('⚠️ Found Butt Kicks in exercise-logs (resistance collection):');
    buttKicksInExerciseLogs.forEach(log => {
      console.log('- Misclassified as resistance:', {
        exerciseName: log.exerciseName,
        sets: log.sets?.length || 0,
        timestamp: log.timestamp
      });
    });
  }
  
  console.log('\n3️⃣ Testing export service data fetching...');
  
  try {
    // Test activityService.getActivityLogs()
    const { activityService } = await import('/src/services/activityService.ts');
    
    // Get current user ID from Redux store if available
    let userId = 'test-user';
    try {
      const state = window.reduxStore?.getState();
      if (state?.auth?.user?.id) {
        userId = state.auth.user.id;
      }
    } catch (e) {
      console.log('Using default userId for test');
    }
    
    console.log(`Testing with userId: ${userId}`);
    
    // Get activities for today (September 3, 2025)
    const today = new Date('2025-09-03');
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const activityLogsFromService = await activityService.getActivityLogs(
      userId,
      startOfDay,
      endOfDay
    );
    
    console.log(`✅ ActivityService returned ${activityLogsFromService.length} logs for today`);
    
    const speedAgilityFromService = activityLogsFromService.filter(log => 
      log.activityType === 'speedAgility'
    );
    
    console.log(`⚡ Speed agility logs from service: ${speedAgilityFromService.length}`);
    
    const buttKicksFromService = activityLogsFromService.filter(log =>
      log.activityName && log.activityName.toLowerCase().includes('butt kicks')
    );
    
    console.log(`🎯 Butt Kicks from service: ${buttKicksFromService.length}`);
    
    if (buttKicksFromService.length > 0) {
      console.log('✅ Butt Kicks found via service - should be exported');
      buttKicksFromService.forEach(log => {
        console.log('- Service returned:', {
          activityName: log.activityName,
          activityType: log.activityType,
          sessions: log.sessions?.length || 0
        });
      });
    } else {
      console.log('❌ Butt Kicks NOT returned by service - this is the export problem');
    }
    
  } catch (error) {
    console.error('❌ Error testing activityService:', error);
  }
  
  console.log('\n4️⃣ Testing export filtering logic...');
  
  // Test the validation logic used in export
  const validActivityTypes = ['sport', 'endurance', 'stretching', 'speedAgility', 'other'];
  
  buttKicksLogs.forEach(log => {
    const hasRequiredFields = !!(log.id && log.activityName && log.userId && log.timestamp);
    const hasValidType = validActivityTypes.includes(log.activityType);
    const hasValidData = !!(log.sessions?.length > 0 || log.stretches?.length > 0 || log.customData?.length > 0);
    
    console.log(`📊 Butt Kicks validation for export:`, {
      activityName: log.activityName,
      hasRequiredFields,
      hasValidType,
      hasValidData,
      activityType: log.activityType,
      sessionsCount: log.sessions?.length || 0,
      wouldPassFilter: hasRequiredFields && hasValidType && hasValidData
    });
  });
}

// Run the investigation
investigateSpeedAgilityExport();
