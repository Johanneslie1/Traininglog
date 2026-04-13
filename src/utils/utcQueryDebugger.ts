// UTC Query Debugging Utility
// This utility helps debug why saved exercises aren't appearing in queries

import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

export const debugUTCQueries = async (userId: string) => {
  console.log('🔍 DEBUGGING UTC QUERIES');
  console.log('='.repeat(50));
  
  try {
    console.log('👤 User ID:', userId);
    console.log('📅 Target date: August 28, 2025');
    
    // Current date setup
    const testDate = new Date('2025-08-28');
    console.log('🌐 Test date object:', testDate);
    console.log('🕐 Test date ISO:', testDate.toISOString());
    console.log('⏰ Timezone offset:', testDate.getTimezoneOffset());
      // Check what's actually in the strengthExercises collection
    console.log('\n💪 CHECKING STRENGTH EXERCISES...');
    const strengthRef = collection(db, 'users', userId, 'strengthExercises');
    const strengthQuery = query(
      strengthRef,
      orderBy('timestamp', 'desc')
    );
    
    const strengthDocs = await getDocs(strengthQuery);
    console.log(`📊 Found ${strengthDocs.size} total strength exercises for user`);    strengthDocs.docs.forEach((doc: any, index: number) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate?.() || data.timestamp;
      const dateStr = timestamp instanceof Date ? timestamp.toISOString() : String(timestamp);
      console.log(`  ${index + 1}. Exercise: ${data.exerciseName}`);
      console.log(`     ID: ${doc.id}`);
      console.log(`     Timestamp: ${dateStr}`);
      console.log(`     Raw timestamp type: ${typeof data.timestamp}`);
      if (data.exerciseName?.includes('UTC Fix Test')) {
        console.log('     🎯 THIS IS OUR TEST EXERCISE!');
      }
    });
    
    // Check what's actually in the activities collection
    console.log('\n🏃 CHECKING ACTIVITIES...');
    const activitiesRef = collection(db, 'users', userId, 'activities');
    const activitiesQuery = query(
      activitiesRef,
      orderBy('timestamp', 'desc')
    );
    
    const activityDocs = await getDocs(activitiesQuery);
    console.log(`📊 Found ${activityDocs.size} total activities for user`);
      activityDocs.docs.forEach((doc: any, index: number) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate?.() || data.timestamp;
      const dateStr = timestamp instanceof Date ? timestamp.toISOString() : String(timestamp);
      console.log(`  ${index + 1}. Activity: ${data.activityName}`);
      console.log(`     ID: ${doc.id}`);
      console.log(`     Timestamp: ${dateStr}`);
      console.log(`     Raw timestamp type: ${typeof data.timestamp}`);
      if (data.activityName?.includes('UTC Fix Test')) {
        console.log('     🎯 THIS IS OUR TEST ACTIVITY!');
      }
    });
    
    // Now test the date range query logic
    console.log('\n🔍 TESTING DATE RANGE QUERIES...');
    
    // UTC approach (should work)
    const year = testDate.getFullYear();
    const month = testDate.getMonth();
    const day = testDate.getDate();
    
    const utcStartOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const utcEndOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    
    console.log('📅 UTC Date Range:');
    console.log(`  Start: ${utcStartOfDay.toISOString()}`);
    console.log(`  End: ${utcEndOfDay.toISOString()}`);    // Test strength exercises with UTC range
    const strengthDateQuery = query(
      strengthRef,
      where('timestamp', '>=', Timestamp.fromDate(utcStartOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(utcEndOfDay)),
      orderBy('timestamp', 'desc')
    );
    
    const strengthDateDocs = await getDocs(strengthDateQuery);
    console.log(`💪 Strength exercises in UTC date range: ${strengthDateDocs.size}`);
    
    // Test activities with UTC range
    const activitiesDateQuery = query(
      activitiesRef,
      where('timestamp', '>=', Timestamp.fromDate(utcStartOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(utcEndOfDay)),
      orderBy('timestamp', 'desc')
    );
    
    const activitiesDateDocs = await getDocs(activitiesDateQuery);
    console.log(`🏃 Activities in UTC date range: ${activitiesDateDocs.size}`);
    
    // Test local time approach (should fail)
    console.log('\n🌍 TESTING LOCAL TIME APPROACH...');
    const localStartOfDay = new Date(testDate);
    localStartOfDay.setHours(0, 0, 0, 0);
    const localEndOfDay = new Date(testDate);
    localEndOfDay.setHours(23, 59, 59, 999);
    
    console.log('📅 Local Date Range:');
    console.log(`  Start: ${localStartOfDay.toISOString()}`);
    console.log(`  End: ${localEndOfDay.toISOString()}`);    const strengthLocalQuery = query(
      strengthRef,
      where('timestamp', '>=', Timestamp.fromDate(localStartOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(localEndOfDay)),
      orderBy('timestamp', 'desc')
    );
    
    const strengthLocalDocs = await getDocs(strengthLocalQuery);
    console.log(`💪 Strength exercises in LOCAL date range: ${strengthLocalDocs.size}`);
    
    const activitiesLocalQuery = query(
      activitiesRef,
      where('timestamp', '>=', Timestamp.fromDate(localStartOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(localEndOfDay)),
      orderBy('timestamp', 'desc')
    );
    
    const activitiesLocalDocs = await getDocs(activitiesLocalQuery);
    console.log(`🏃 Activities in LOCAL date range: ${activitiesLocalDocs.size}`);
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`  Total strength exercises: ${strengthDocs.size}`);
    console.log(`  Total activities: ${activityDocs.size}`);
    console.log(`  Strength in UTC range: ${strengthDateDocs.size}`);
    console.log(`  Activities in UTC range: ${activitiesDateDocs.size}`);
    console.log(`  Strength in LOCAL range: ${strengthLocalDocs.size}`);
    console.log(`  Activities in LOCAL range: ${activitiesLocalDocs.size}`);
    
    if (strengthDateDocs.size > 0 || activitiesDateDocs.size > 0) {
      console.log('✅ UTC queries found exercises - the fix should work!');
    } else if (strengthLocalDocs.size > 0 || activitiesLocalDocs.size > 0) {
      console.log('⚠️ Only local queries found exercises - UTC fix needs adjustment');
    } else {
      console.log('❌ No exercises found in any date range - check if saves worked');
    }
    
  } catch (error) {
    console.error('❌ Error debugging UTC queries:', error);
  }
};

// Make function available globally
declare global {
  interface Window {
    debugUTCQueries: typeof debugUTCQueries;
  }
}

window.debugUTCQueries = debugUTCQueries;

console.log('🔍 UTC Query Debugger loaded. Run: debugUTCQueries("Bnz8b5dGcsaWXFYwo9a48NqL19y2")');
