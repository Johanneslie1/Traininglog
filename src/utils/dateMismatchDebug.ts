// Debug utility to check date mismatch issues
import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';

/**
 * Debug date mismatch by checking multiple dates around today
 */
export const debugDateMismatch = async (userId: string) => {
  console.log('🔍 =========================');
  console.log('🔍 DATE MISMATCH DEBUG');
  console.log('🔍 =========================');
  
  const today = new Date();
  console.log('📅 Today (raw):', today.toISOString());
  console.log('📅 Today (local):', today.toLocaleDateString());
  
  // Check exercises for several dates around today
  const datesToCheck = [
    new Date(2025, 7, 26), // August 26
    new Date(2025, 7, 27), // August 27
    new Date(2025, 7, 28), // August 28
    new Date(2025, 7, 29), // August 29
  ];
  
  for (const date of datesToCheck) {
    console.log(`\n🔍 Checking date: ${date.toLocaleDateString()} (${date.toISOString()})`);
    
    try {
      const exercises = await getAllExercisesByDate(date, userId);
      console.log(`📊 Found ${exercises.length} exercises for ${date.toLocaleDateString()}`);
      
      if (exercises.length > 0) {
        exercises.forEach((ex, i) => {
          console.log(`  ${i + 1}. ${ex.exerciseName} - ${ex.timestamp?.toISOString()} (${ex.activityType})`);
        });
      }
    } catch (error) {
      console.error(`❌ Error checking ${date.toLocaleDateString()}:`, error);
    }
  }
  
  console.log('\n🔍 =========================');
  console.log('🔍 DEBUG COMPLETE');
  console.log('🔍 =========================');
};

/**
 * Check specific date ranges to see what the Firestore query is actually doing
 */
export const debugFirestoreQuery = (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  console.log('🔍 Firestore Query Debug for:', date.toLocaleDateString());
  console.log('📅 Input date:', date.toISOString());
  console.log('📅 Start of day:', startOfDay.toISOString());
  console.log('📅 End of day:', endOfDay.toISOString());
  console.log('📅 Timezone offset:', date.getTimezoneOffset(), 'minutes');
  
  return { startOfDay, endOfDay };
};

/**
 * Check what our date normalization function actually does
 */
export const debugDateNormalization = () => {
  const now = new Date();
  
  console.log('🔍 Date Normalization Debug:');
  console.log('📅 Current time:', now.toISOString());
  console.log('📅 Current local:', now.toLocaleString());
  
  // Simulate our normalization
  const normalized = new Date(now);
  normalized.setHours(12, 0, 0, 0);
  
  console.log('📅 Normalized (noon):', normalized.toISOString());
  console.log('📅 Normalized local:', normalized.toLocaleString());
  
  // Test with different input dates
  const testDates = [
    new Date('2025-08-28T00:00:00.000Z'), // Midnight UTC
    new Date('2025-08-28T10:00:00.000Z'), // 10 AM UTC  
    new Date('2025-08-28T22:00:00.000Z'), // 10 PM UTC
  ];
  
  testDates.forEach(testDate => {
    const normalizedTest = new Date(testDate);
    normalizedTest.setHours(12, 0, 0, 0);
    console.log(`📅 ${testDate.toISOString()} → ${normalizedTest.toISOString()}`);
  });
};

// Make functions globally available
if (typeof window !== 'undefined') {
  (window as any).debugDateMismatch = debugDateMismatch;
  (window as any).debugFirestoreQuery = debugFirestoreQuery;
  (window as any).debugDateNormalization = debugDateNormalization;
}
