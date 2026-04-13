// Test date normalization logic
const testDate = new Date('2025-08-28');
console.log('Input date:', testDate.toISOString());

// Simulate normalizeSelectedDate
const normalized = new Date(testDate);
normalized.setHours(12, 0, 0, 0);
console.log('Normalized (save):', normalized.toISOString());

// Simulate query range
const startOfDay = new Date(testDate);
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date(testDate);
endOfDay.setHours(23, 59, 59, 999);

console.log('Query range:');
console.log('  Start:', startOfDay.toISOString());
console.log('  End:', endOfDay.toISOString());
console.log('Is normalized in range?', normalized >= startOfDay && normalized <= endOfDay);
console.log('Timestamps:');
console.log('  Normalized:', normalized.getTime());
console.log('  Start:', startOfDay.getTime());
console.log('  End:', endOfDay.getTime());

// Check timezone offset
console.log('Timezone offset (minutes):', testDate.getTimezoneOffset());

// Test with today's date
const today = new Date();
console.log('\n--- Testing with today ---');
console.log('Today:', today.toISOString());
const todayNormalized = new Date(today);
todayNormalized.setHours(12, 0, 0, 0);
console.log('Today normalized:', todayNormalized.toISOString());
