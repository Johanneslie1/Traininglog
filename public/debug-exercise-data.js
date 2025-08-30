console.log('=== DEBUGGING EXERCISE DATA ===');
const logs = JSON.parse(localStorage.getItem('activity-logs') || '[]');
console.log('All activity logs:', logs);

const exercises = JSON.parse(localStorage.getItem('exercise-logs') || '[]');
console.log('All exercise logs:', exercises);

// Check what's being displayed today
const today = new Date();
const todayString = today.toDateString();
console.log('Today:', todayString);

// Filter logs for today
const todayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === todayString);
console.log('Today activity logs:', todayLogs);

const todayExercises = exercises.filter(ex => new Date(ex.timestamp).toDateString() === todayString);
console.log('Today exercise logs:', todayExercises);

// Check the unified exercise data that would be returned
console.log('=== CHECKING UNIFIED DATA CONVERSION ===');
todayLogs.forEach((log, index) => {
  console.log(`Activity Log ${index + 1}:`, {
    id: log.id,
    activityName: log.activityName,
    activityType: log.activityType,
    sessions: log.sessions,
    firstSession: log.sessions?.[0]
  });
});
