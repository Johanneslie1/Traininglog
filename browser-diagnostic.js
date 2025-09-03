// Browser console diagnostic for speed agility export
(async function() {
  console.log('🔍 Speed Agility Export Diagnostic - Running in Browser');
  
  // 1. Check localStorage for activity logs
  console.log('\n📦 Checking localStorage activity-logs...');
  const activityLogs = JSON.parse(localStorage.getItem('activity-logs') || '[]');
  console.log(`Total activity logs: ${activityLogs.length}`);
  
  // 2. Filter for speed agility
  const speedAgilityLogs = activityLogs.filter(log => {
    return log.activityType === 'speedAgility' || 
           log.activityType === 'speed_agility' || 
           log.activityType === 'SPEED_AGILITY';
  });
  
  console.log(`Speed agility logs found: ${speedAgilityLogs.length}`);
  
  if (speedAgilityLogs.length > 0) {
    console.log('\n📋 Speed Agility Log Details:');
    speedAgilityLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.activityName}:`, {
        id: log.id,
        activityType: log.activityType,
        sessions: log.sessions?.length || 0,
        timestamp: log.timestamp,
        userId: log.userId
      });
    });
  } else {
    console.log('❌ No speed agility logs found in localStorage');
    
    // Check if there are any activities that might be misclassified
    console.log('\n🔍 Checking for potentially misclassified activities...');
    const allTypes = [...new Set(activityLogs.map(log => log.activityType))];
    console.log('All activity types found:', allTypes);
    
    const suspiciousLogs = activityLogs.filter(log => 
      log.activityName?.toLowerCase().includes('agility') ||
      log.activityName?.toLowerCase().includes('speed') ||
      log.activityName?.toLowerCase().includes('sprint') ||
      log.activityName?.toLowerCase().includes('drill')
    );
    
    if (suspiciousLogs.length > 0) {
      console.log('🤔 Found potentially speed/agility exercises with different types:');
      suspiciousLogs.forEach(log => {
        console.log(`- ${log.activityName} (type: ${log.activityType})`);
      });
    }
  }
  
  // 3. Test export service logic
  console.log('\n🧪 Testing export service filtering logic...');
  
  const validActivityTypes = ['sport', 'endurance', 'stretching', 'speedAgility', 'other'];
  
  const validLogs = activityLogs.filter(log => {
    // Must have required fields
    if (!log.id || !log.activityName || !log.userId || !log.timestamp) {
      return false;
    }
    
    // Must have valid activity type
    if (!validActivityTypes.includes(log.activityType)) {
      return false;
    }
    
    // Must have valid data
    const hasValidData = log.sessions?.length > 0 || 
                        log.stretches?.length > 0 || 
                        log.customData?.length > 0;
    
    return hasValidData;
  });
  
  const validSpeedAgilityLogs = validLogs.filter(log => 
    log.activityType === 'speedAgility'
  );
  
  console.log(`Valid logs that would pass export filtering: ${validLogs.length}`);
  console.log(`Valid speed agility logs that would export: ${validSpeedAgilityLogs.length}`);
  
  // 4. Check ActivityType enum
  console.log('\n🎯 Checking ActivityType enum...');
  if (window.ActivityType) {
    console.log('ActivityType enum found:', window.ActivityType);
  } else {
    console.log('❌ ActivityType enum not available in global scope');
  }
  
  // 5. Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY:');
  if (speedAgilityLogs.length === 0) {
    console.log('❌ ISSUE: No speed agility activities found in storage');
    console.log('💡 Need to check if speed agility exercises are being saved correctly');
  } else if (validSpeedAgilityLogs.length === 0) {
    console.log('❌ ISSUE: Speed agility activities found but filtered out during export');
    console.log('💡 Need to fix export filtering logic');
  } else {
    console.log('✅ Speed agility activities should export correctly');
    console.log('💡 Issue might be in the export service itself');
  }
  
  return {
    totalLogs: activityLogs.length,
    speedAgilityLogs: speedAgilityLogs.length,
    validSpeedAgilityLogs: validSpeedAgilityLogs.length,
    allActivityTypes: [...new Set(activityLogs.map(log => log.activityType))]
  };
})();
