import { getAuth } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase/config';

export const testFirestorePermissions = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No authenticated user');
    return;
  }
  
  console.log('🧪 Testing Firestore permissions');
  console.log('🔐 Current user:', {
    uid: currentUser.uid,
    email: currentUser.email
  });
  
  try {
    // Test minimal document structure
    const testData = {
      userId: currentUser.uid,
      activityName: 'Test Activity',
      activityType: 'team_sports',
      sets: [],
      timestamp: new Date(),
      deviceId: 'test-device'
    };
    
    const docRef = doc(collection(db, 'users', currentUser.uid, 'activities'));
    console.log('📍 Attempting to write to:', `users/${currentUser.uid}/activities/${docRef.id}`);
    console.log('📝 Test data:', testData);
    
    await setDoc(docRef, testData);
    console.log('✅ Test write successful!');
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Test write failed:', error);
    throw error;
  }
};
