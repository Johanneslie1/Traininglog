// Debug script to check localStorage data
console.log('=== DEBUGGING STORAGE DATA ===');

// Check exercise logs
const exerciseLogs = localStorage.getItem('exercise-logs');
console.log('Exercise logs:', exerciseLogs ? JSON.parse(exerciseLogs) : 'No exercise logs found');

// Check activity logs  
const activityLogs = localStorage.getItem('activity-logs');
console.log('Activity logs:', activityLogs ? JSON.parse(activityLogs) : 'No activity logs found');

// Check specific keys
const keys = Object.keys(localStorage);
console.log('All localStorage keys:', keys);

keys.forEach(key => {
  if (key.includes('log') || key.includes('exercise') || key.includes('activity')) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      console.log(`${key}:`, data);
    } catch (e) {
      console.log(`${key} (not JSON):`, localStorage.getItem(key));
    }
  }
});
