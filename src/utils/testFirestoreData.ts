import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase/config';

export const testFirestoreData = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No authenticated user for Firestore test');
    return;
  }
  
  console.log('🔍 Testing Firestore data directly');
  console.log('🔐 Current user:', currentUser.uid);
  
  try {
    // Test strength exercises collection
    console.log('📊 Testing strength exercises collection...');
    const strengthRef = collection(db, 'users', currentUser.uid, 'strengthExercises');
    const strengthQuery = query(strengthRef, orderBy('timestamp', 'desc'), limit(10));
    const strengthSnapshot = await getDocs(strengthQuery);
    
    console.log('💪 Strength exercises found:', strengthSnapshot.docs.length);
    strengthSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('💪 Strength exercise:', {
        id: doc.id,
        exerciseName: data.exerciseName,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        sets: data.sets?.length || 0
      });
    });
    
    // Test activities collection
    console.log('📊 Testing activities collection...');
    const activitiesRef = collection(db, 'users', currentUser.uid, 'activities');
    const activitiesQuery = query(activitiesRef, orderBy('timestamp', 'desc'), limit(10));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    
    console.log('🏃 Activities found:', activitiesSnapshot.docs.length);
    activitiesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('🏃 Activity:', {
        id: doc.id,
        activityName: data.activityName,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        sets: data.sets?.length || 0
      });
    });
    
    // Test legacy exercises collection
    console.log('📊 Testing legacy exercises collection...');
    const legacyRef = collection(db, 'users', currentUser.uid, 'exercises');
    const legacyQuery = query(legacyRef, orderBy('timestamp', 'desc'), limit(10));
    const legacySnapshot = await getDocs(legacyQuery);
    
    console.log('🏋️ Legacy exercises found:', legacySnapshot.docs.length);
    legacySnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('🏋️ Legacy exercise:', {
        id: doc.id,
        exerciseName: data.exerciseName,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        sets: data.sets?.length || 0
      });
    });
    
    return {
      strengthCount: strengthSnapshot.docs.length,
      activitiesCount: activitiesSnapshot.docs.length,
      legacyCount: legacySnapshot.docs.length
    };
    
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    throw error;
  }
};
