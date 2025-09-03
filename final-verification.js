// Final verification script
console.log('🎯 FINAL VERIFICATION: Speed Agility Export Fix');

async function verifyFix() {
  console.log('\n1️⃣ Checking localStorage data...');
  const activityLogs = JSON.parse(localStorage.getItem('activity-logs') || '[]');
  const speedAgilityLogs = activityLogs.filter(log => log.activityType === 'speedAgility');
  
  console.log(`📊 Total activity logs: ${activityLogs.length}`);
  console.log(`⚡ Speed agility logs: ${speedAgilityLogs.length}`);
  
  if (speedAgilityLogs.length === 0) {
    // Create a test speed agility activity
    console.log('\n2️⃣ Creating test speed agility activity...');
    const testActivity = {
      id: 'test-sa-' + Date.now(),
      activityType: 'speedAgility',
      activityName: 'High Knees (Test)',
      userId: 'test-user',
      timestamp: new Date().toISOString(),
      sessions: [{
        sessionNumber: 1,
        reps: 15,
        distance: 20,
        restTime: 90,
        rpe: 6,
        notes: 'Test sprint drill'
      }]
    };
    
    activityLogs.push(testActivity);
    localStorage.setItem('activity-logs', JSON.stringify(activityLogs));
    console.log('✅ Test activity created:', testActivity.activityName);
  }
  
  console.log('\n3️⃣ Testing ActivityService.getActivityLogs()...');
  try {
    const { activityService } = await import('/src/services/activityService.ts');
    const logs = await activityService.getActivityLogs('test-user');
    const saLogs = logs.filter(log => log.activityType === 'speedAgility');
    
    console.log(`✅ ActivityService returned ${logs.length} logs`);
    console.log(`⚡ Including ${saLogs.length} speed agility logs`);
    
    if (saLogs.length > 0) {
      console.log('✅ SUCCESS! Speed agility activities are now accessible to export service');
      return true;
    }
  } catch (error) {
    console.error('❌ ActivityService test failed:', error);
  }
  
  return false;
}

// Run verification
verifyFix().then(success => {
  if (success) {
    console.log('\n🎉 FIX VERIFIED! Speed agility exports should now work.');
    console.log('📋 Next: Try exporting from the app to confirm.');
  } else {
    console.log('\n❌ Fix verification failed. Check console for errors.');
  }
});
