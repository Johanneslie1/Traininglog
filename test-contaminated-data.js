// Test script to create contaminated data and verify export filtering
console.log('🧪 Testing contaminated data export filtering...');

// Create some contaminated resistance exercise data that should be filtered out
const contaminatedData = [
  {
    id: 'contaminated-1',
    userId: 'test-user',
    date: new Date().toISOString(),
    exerciseName: 'Football (Soccer)',
    sets: [{ setNumber: 1, weight: 0, reps: 0, timestamp: new Date().toISOString() }],
    category: 'Other' // This is the problem - sport activities saved as resistance
  },
  {
    id: 'contaminated-2', 
    userId: 'test-user',
    date: new Date().toISOString(),
    exerciseName: 'Basketball',
    sets: [{ setNumber: 1, weight: 0, reps: 0, timestamp: new Date().toISOString() }],
    category: 'Other'
  },
  {
    id: 'valid-1',
    userId: 'test-user', 
    date: new Date().toISOString(),
    exerciseName: 'Bench Press',
    sets: [{ setNumber: 1, weight: 80, reps: 10, timestamp: new Date().toISOString() }],
    category: 'Chest'
  }
];

// Store contaminated data in localStorage to simulate the bug
const existingLogs = JSON.parse(localStorage.getItem('exercise-logs') || '[]');
const testData = [...existingLogs, ...contaminatedData];
localStorage.setItem('exercise-logs', JSON.stringify(testData));

console.log('✅ Created contaminated test data in localStorage');
console.log('📊 Test data includes:');
contaminatedData.forEach(item => {
  console.log(`  - ${item.exerciseName} (${item.category})`);
});

console.log('\n🔍 Now test the export functionality in the app to verify filtering works!');
console.log('Expected: Only "Bench Press" should be exported, Football and Basketball should be filtered out.');
