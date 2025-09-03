// Simple test to check if Firestore rules are blocking writes
// Run this in browser console

async function testFirestorePermissions() {
  console.log('🛡️ Testing Firestore Permissions...');
  
  try {
    // Use Firebase objects that are already loaded in the browser
    const auth = window.firebase?.auth || window.auth;
    const firestore = window.firebase?.firestore || window.firestore;
    
    // Try to get Firebase from the global scope or from the app
    if (!auth && window.__FIREBASE_APPS__) {
      console.log('🔍 Trying to get Firebase from app instances...');
      // Firebase might be available through the app
    }
    
    // Alternative approach: use the auth and db that should be available globally
    if (typeof firebase !== 'undefined') {
      console.log('✅ Using global firebase object');
      const currentUser = firebase.auth().currentUser;
      const db = firebase.firestore();
      
      if (!currentUser) {
        console.error('❌ No authenticated user');
        return;
      }
      
      const userId = currentUser.uid;
      console.log('👤 Testing permissions for user:', userId);
      
      // Test 1: Try to write to strengthExercises collection
      console.log('\n💪 Test 1: Writing to strengthExercises collection...');
      try {
        const strengthDocRef = db.collection('users').doc(userId).collection('strengthExercises').doc();
        const testData = {
          exerciseName: 'Permission Test Exercise',
          userId: userId,
          sets: [],
          timestamp: firebase.firestore.Timestamp.now(),
          deviceId: 'test'
        };
        
        await strengthDocRef.set(testData);
        console.log('✅ Write to strengthExercises: SUCCESS');
        
        // Try to read it back
        const readDoc = await strengthDocRef.get();
        if (readDoc.exists) {
          console.log('✅ Read from strengthExercises: SUCCESS');
        } else {
          console.warn('⚠️ Read from strengthExercises: Document not found');
        }
        
      } catch (error) {
        console.error('❌ strengthExercises operation failed:', error.code, error.message);
        if (error.code === 'permission-denied') {
          console.error('🚫 PERMISSION DENIED: Firestore rules are blocking writes to strengthExercises');
          console.log('💡 Solution: Update Firestore rules in Firebase console');
        }
      }
      
      // Test 2: Try to write to activities collection
      console.log('\n🏃 Test 2: Writing to activities collection...');
      try {
        const activityDocRef = db.collection('users').doc(userId).collection('activities').doc();
        const testData = {
          activityName: 'Permission Test Activity',
          userId: userId,
          sets: [],
          activityType: 'endurance',
          timestamp: firebase.firestore.Timestamp.now(),
          deviceId: 'test'
        };
        
        await activityDocRef.set(testData);
        console.log('✅ Write to activities: SUCCESS');
        
        // Try to read it back
        const readDoc = await activityDocRef.get();
        if (readDoc.exists) {
          console.log('✅ Read from activities: SUCCESS');
        } else {
          console.warn('⚠️ Read from activities: Document not found');
        }
        
      } catch (error) {
        console.error('❌ activities operation failed:', error.code, error.message);
        if (error.code === 'permission-denied') {
          console.error('🚫 PERMISSION DENIED: Firestore rules are blocking writes to activities');
          console.log('💡 Solution: Update Firestore rules in Firebase console');
        }
      }
      
      // Test 3: Check existing collections for comparison
      console.log('\n📋 Test 3: Testing existing exercises collection...');
      try {
        const exercisesDocRef = db.collection('users').doc(userId).collection('exercises').doc();
        const testData = {
          exerciseName: 'Legacy Permission Test',
          userId: userId,
          sets: [],
          timestamp: firebase.firestore.Timestamp.now(),
          deviceId: 'test'
        };
        
        await exercisesDocRef.set(testData);
        console.log('✅ Write to exercises (legacy): SUCCESS');
        
      } catch (error) {
        console.error('❌ exercises (legacy) operation failed:', error.code, error.message);
      }
      
    } else {
      console.error('❌ Firebase not available in global scope');
      console.log('🔍 Available global objects:', Object.keys(window).filter(key => key.toLowerCase().includes('fire')));
      
      // Try alternative approach with modern Firebase
      console.log('\n🔄 Trying modern Firebase approach...');
      const apps = window.__FIREBASE_APPS__;
      if (apps && apps.length > 0) {
        console.log('✅ Found Firebase apps:', apps.length);
        // This would require more complex setup
      }
    }
    
    console.log('\n📋 PERMISSION TEST SUMMARY');
    console.log('============================');
    console.log('If you see "PERMISSION DENIED" errors above, you need to:');
    console.log('1. Go to Firebase Console > Firestore Database > Rules');
    console.log('2. Add rules for strengthExercises and activities collections');
    console.log('3. The updated rules are in your firestore.rules file');
    
  } catch (error) {
    console.error('❌ Permission test failed:', error);
    console.log('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}
    
    console.log('\n📋 PERMISSION TEST SUMMARY');
    console.log('============================');
    console.log('If you see "PERMISSION DENIED" errors above, you need to:');
    console.log('1. Go to Firebase Console > Firestore Database > Rules');
    console.log('2. Add rules for strengthExercises and activities collections');
    console.log('3. The updated rules are in your firestore.rules file');
    
  } catch (error) {
    console.error('❌ Permission test failed:', error);
  }
}

// Make function available globally
window.testFirestorePermissions = testFirestorePermissions;

console.log('🛡️ Firestore Permission Test Loaded!');
console.log('Run: testFirestorePermissions()');
console.log('');
