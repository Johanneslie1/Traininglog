// Simple timestamp debugger to check actual timestamps of saved exercises
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

export const debugTimestamps = async (userId: string) => {
  console.log('🕐 DEBUGGING TIMESTAMPS');
  console.log('='.repeat(50));
  
  try {
    // Check recent strength exercises
    console.log('💪 Recent strength exercises:');
    const strengthRef = collection(db, 'users', userId, 'strengthExercises');
    const strengthQuery = query(strengthRef, orderBy('timestamp', 'desc'), limit(5));
    const strengthDocs = await getDocs(strengthQuery);
      strengthDocs.docs.forEach((doc: any, index: number) => {
      const data = doc.data();
      const timestamp = data.timestamp;
      let dateInfo = '';
      
      if (timestamp?.toDate) {
        const date = timestamp.toDate();
        dateInfo = `${date.toISOString()} (${date.toDateString()})`;
      } else if (timestamp instanceof Date) {
        dateInfo = `${timestamp.toISOString()} (${timestamp.toDateString()})`;
      } else if (timestamp?.seconds !== undefined) {
        // Handle raw Firestore timestamp format
        const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
        dateInfo = `${date.toISOString()} (${date.toDateString()})`;
      } else {
        dateInfo = `Unknown format: ${typeof timestamp} - ${String(timestamp)}`;
      }
      
      console.log(`  ${index + 1}. ${data.exerciseName} - ${dateInfo}`);
    });
    
    // Check recent activities
    console.log('\n🏃 Recent activities:');
    const activitiesRef = collection(db, 'users', userId, 'activities');
    const activitiesQuery = query(activitiesRef, orderBy('timestamp', 'desc'), limit(5));
    const activityDocs = await getDocs(activitiesQuery);
      activityDocs.docs.forEach((doc: any, index: number) => {
      const data = doc.data();
      const timestamp = data.timestamp;
      let dateInfo = '';
      
      if (timestamp?.toDate) {
        const date = timestamp.toDate();
        dateInfo = `${date.toISOString()} (${date.toDateString()})`;
      } else if (timestamp instanceof Date) {
        dateInfo = `${timestamp.toISOString()} (${timestamp.toDateString()})`;
      } else if (timestamp?.seconds !== undefined) {
        // Handle raw Firestore timestamp format
        const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
        dateInfo = `${date.toISOString()} (${date.toDateString()})`;
      } else {
        dateInfo = `Unknown format: ${typeof timestamp} - ${String(timestamp)}`;
      }
      
      console.log(`  ${index + 1}. ${data.activityName} - ${dateInfo}`);
    });
    
    // Check today's date for comparison
    console.log('\n📅 Date comparison:');
    const today = new Date();
    console.log(`Today (local): ${today.toISOString()} (${today.toDateString()})`);
    console.log(`Today (timezone offset): ${today.getTimezoneOffset()} minutes`);
    
    // Check what your app is using for "August 28, 2025"
    const testDate = new Date('2025-08-28');
    console.log(`Test date: ${testDate.toISOString()} (${testDate.toDateString()})`);
    
  } catch (error) {
    console.error('❌ Error debugging timestamps:', error);
  }
};

// Make function available globally
declare global {
  interface Window {
    debugTimestamps: typeof debugTimestamps;
  }
}

window.debugTimestamps = debugTimestamps;

console.log('🕐 Timestamp Debugger loaded. Run: debugTimestamps("Bnz8b5dGcsaWXFYwo9a48NqL19y2")');
