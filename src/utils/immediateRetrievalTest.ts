// Immediate test to check what's happening with exercise retrieval
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase/config';

export const immediateRetrievalTest = async () => {
  console.log('🧪 IMMEDIATE RETRIEVAL TEST');
  console.log('============================');
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No authenticated user');
    return;
  }
  
  const userId = currentUser.uid;
  console.log('✅ User ID:', userId);
  
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  
  console.log('📅 Testing for date:', today.toLocaleDateString());
  console.log('⏰ Time range:', startOfDay.toISOString(), 'to', endOfDay.toISOString());
  
  try {
    // Test 1: Check activities collection
    console.log('\n📋 TEST 1: Activities Collection');
    console.log('--------------------------------');
    const activitiesRef = collection(db, 'users', userId, 'activities');
    const activitiesQuery = query(
      activitiesRef,
      where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('timestamp', 'desc')
    );
    
    const activitiesSnapshot = await getDocs(activitiesQuery);
    console.log('🏃 Activities found:', activitiesSnapshot.docs.length);
    
    activitiesSnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`${i + 1}. ID: ${doc.id}`);
      console.log(`   Name: ${data.activityName}`);
      console.log(`   Type: ${data.activityType}`);
      console.log(`   Time: ${data.timestamp?.toDate?.()?.toLocaleTimeString()}`);
      console.log(`   Sets: ${data.sets?.length || 0}`);
    });
    
    // Test 2: Check strengthExercises collection
    console.log('\n📋 TEST 2: Strength Exercises Collection');
    console.log('------------------------------------------');
    const strengthRef = collection(db, 'users', userId, 'strengthExercises');
    const strengthQuery = query(
      strengthRef,
      where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('timestamp', 'desc')
    );
    
    const strengthSnapshot = await getDocs(strengthQuery);
    console.log('💪 Strength exercises found:', strengthSnapshot.docs.length);
    
    strengthSnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`${i + 1}. ID: ${doc.id}`);
      console.log(`   Name: ${data.exerciseName}`);
      console.log(`   Type: ${data.exerciseType}`);
      console.log(`   Time: ${data.timestamp?.toDate?.()?.toLocaleTimeString()}`);
      console.log(`   Sets: ${data.sets?.length || 0}`);
    });
    
    // Test 3: Check exercises collection (SIMPLE QUERY)
    console.log('\n📋 TEST 3: Exercises Collection (Simple Query)');
    console.log('------------------------------------------------');
    const exercisesRef = collection(db, 'users', userId, 'exercises');
    const simpleQuery = query(
      exercisesRef,
      orderBy('timestamp', 'desc')
    );
    
    const exercisesSnapshot = await getDocs(simpleQuery);
    console.log('📝 All exercises found:', exercisesSnapshot.docs.length);
    
    // Filter today's exercises in memory
    const todayExercises = exercisesSnapshot.docs.filter(doc => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
      return timestamp >= startOfDay && timestamp <= endOfDay;
    });
    
    console.log('📝 Today\'s exercises:', todayExercises.length);
    
    todayExercises.forEach((doc, i) => {
      const data = doc.data();
      console.log(`${i + 1}. ID: ${doc.id}`);
      console.log(`   Name: ${data.exerciseName}`);
      console.log(`   Type: ${data.exerciseType || 'unknown'}`);
      console.log(`   Activity Type: ${data.activityType || 'none'}`);
      console.log(`   Time: ${(data.timestamp?.toDate?.() || new Date(data.timestamp)).toLocaleTimeString()}`);
      console.log(`   Sets: ${data.sets?.length || 0}`);
    });
    
    const totalToday = activitiesSnapshot.docs.length + strengthSnapshot.docs.length + todayExercises.length;
    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log('Activities:', activitiesSnapshot.docs.length);
    console.log('Strength:', strengthSnapshot.docs.length);
    console.log('Exercises:', todayExercises.length);
    console.log('TOTAL TODAY:', totalToday);
    
    if (totalToday === 0) {
      console.log('⚠️ No exercises found for today. They might be saved in a different collection or date.');
    } else {
      console.log('✅ Found exercises! The issue is in the retrieval logic, not the saving.');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
};

// Make function globally available
if (typeof window !== 'undefined') {
  (window as any).immediateRetrievalTest = immediateRetrievalTest;
  console.log('🧪 Immediate test loaded! Run: immediateRetrievalTest()');
}

export default immediateRetrievalTest;
