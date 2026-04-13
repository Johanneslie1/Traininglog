// Debug Firestore permissions and authentication
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

export const testFirestorePermissions = async () => {
  return new Promise((resolve, reject) => {
    const auth = getAuth();
    
    const checkPermissions = async (user: any) => {
      if (!user) {
        reject(new Error('No user authenticated'));
        return;
      }

      console.log('[PERMISSION TEST] Testing with user:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      });

      try {
        // Test 1: Try to read/write a simple document
        const testDocRef = doc(db, 'test', 'permissions-test');
        
        console.log('[PERMISSION TEST] Attempting to write test document...');
        await setDoc(testDocRef, {
          message: 'Testing permissions',
          userId: user.uid,
          timestamp: serverTimestamp()
        });
        console.log('[PERMISSION TEST] ✅ Successfully wrote test document');

        console.log('[PERMISSION TEST] Attempting to read test document...');
        const testDoc = await getDoc(testDocRef);
        console.log('[PERMISSION TEST] ✅ Successfully read test document:', testDoc.exists());

        // Test 2: Try to create a program document
        const programDocRef = doc(db, 'programs', 'test-program-' + Date.now());
        
        console.log('[PERMISSION TEST] Attempting to write program document...');
        await setDoc(programDocRef, {
          name: 'Test Program',
          description: 'Testing program creation permissions',
          level: 'beginner',
          userId: user.uid,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          sessions: [],
          isPublic: false,
          tags: []
        });
        console.log('[PERMISSION TEST] ✅ Successfully wrote program document');

        // Test 3: Try to create a session within the program
        const sessionDocRef = doc(db, `programs/${programDocRef.id}/sessions`, 'test-session-' + Date.now());
        
        console.log('[PERMISSION TEST] Attempting to write session document...');
        await setDoc(sessionDocRef, {
          name: 'Test Session',
          exercises: [],
          order: 0,
          userId: user.uid,
          programId: programDocRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('[PERMISSION TEST] ✅ Successfully wrote session document');

        resolve({
          success: true,
          message: 'All permission tests passed!',
          user: {
            uid: user.uid,
            email: user.email
          }
        });

      } catch (error) {
        console.error('[PERMISSION TEST] ❌ Permission test failed:', error);
        reject(error);
      }
    };

    // Check current user or wait for authentication
    if (auth.currentUser) {
      checkPermissions(auth.currentUser);
    } else {
      console.log('[PERMISSION TEST] Waiting for user authentication...');
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        checkPermissions(user);
      });
    }
  });
};

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).testFirestorePermissions = testFirestorePermissions;
}
