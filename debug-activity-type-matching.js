// Debug ActivityType enum matching
console.log('🔍 Debugging ActivityType enum matching...');

// Test the enum values
const ActivityType = {
  RESISTANCE: 'resistance',
  SPORT: 'sport',
  STRETCHING: 'stretching', 
  ENDURANCE: 'endurance',
  SPEED_AGILITY: 'speedAgility',
  OTHER: 'other'
};

console.log('📋 ActivityType enum values:');
Object.entries(ActivityType).forEach(([key, value]) => {
  console.log(`${key}: "${value}"`);
});

// Check localStorage data
const activityLogs = JSON.parse(localStorage.getItem('activity-logs') || '[]');
console.log(`\n📦 Found ${activityLogs.length} total activity logs`);

if (activityLogs.length > 0) {
  console.log('\n🔍 Activity type comparison:');
  const uniqueTypes = [...new Set(activityLogs.map(log => log.activityType))];
  
  uniqueTypes.forEach(type => {
    const count = activityLogs.filter(log => log.activityType === type).length;
    const matchesEnum = Object.values(ActivityType).includes(type);
    const isSpeedAgility = type === ActivityType.SPEED_AGILITY;
    
    console.log(`"${type}": ${count} logs, matches enum: ${matchesEnum}, is speed agility: ${isSpeedAgility}`);
  });
  
  // Test switch statement logic
  console.log('\n🧪 Testing switch statement logic:');
  activityLogs.forEach(log => {
    let willExport = false;
    
    switch (log.activityType) {
      case ActivityType.ENDURANCE:
        willExport = true;
        console.log(`✅ ${log.activityName} will export as ENDURANCE`);
        break;
      case ActivityType.SPORT:
        willExport = true;
        console.log(`✅ ${log.activityName} will export as SPORT`);
        break;
      case ActivityType.STRETCHING:
        willExport = true;
        console.log(`✅ ${log.activityName} will export as STRETCHING`);
        break;
      case ActivityType.SPEED_AGILITY:
        willExport = true;
        console.log(`✅ ${log.activityName} will export as SPEED_AGILITY`);
        break;
      case ActivityType.OTHER:
        willExport = true;
        console.log(`✅ ${log.activityName} will export as OTHER`);
        break;
      default:
        console.log(`❌ ${log.activityName} (${log.activityType}) will NOT export - unknown type`);
    }
  });
}

console.log('\n🎯 If speed agility activities show as "will NOT export", that\'s the issue!');
