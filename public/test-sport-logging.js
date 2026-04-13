// Test logging for sport activity
const testSportActivity = {
  duration: 30,
  distance: 1000,
  calories: 200,
  intensity: 7,
  notes: "Test activity with distance and calories"
};

console.log('Test sport activity data:', testSportActivity);

// Test the session mapping
const sessions = [testSportActivity];
const mappedSessions = sessions.map((session, index) => ({
  sessionNumber: index + 1,
  duration: session.duration || 0,
  distance: session.distance, 
  calories: session.calories, 
  intensity: session.intensity || 5,
  notes: session.notes
}));

console.log('Mapped sessions:', mappedSessions);
