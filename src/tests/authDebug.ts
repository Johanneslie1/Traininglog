// Test authentication and permissions
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { createTestProgram } from '@/services/programService';

export const debugAuthAndPermissions = () => {
  const auth = getAuth();
  
  console.log('[AUTH DEBUG] Current auth state:', {
    currentUser: auth.currentUser,
    uid: auth.currentUser?.uid,
    email: auth.currentUser?.email,
    isSignedIn: !!auth.currentUser
  });

  // Listen for auth state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('[AUTH DEBUG] User signed in:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous
      });
    } else {
      console.log('[AUTH DEBUG] User signed out');
    }
  });
};

export const testProgramCreationWithAuth = async () => {
  try {
    const auth = getAuth();
    
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in. Please sign in first.');
    }
    
    console.log('[TEST] Testing program creation with user:', {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email
    });
    
    await createTestProgram();
    console.log('[TEST] Program creation successful!');
    
  } catch (error) {
    console.error('[TEST] Program creation failed:', error);
    
    // Additional debugging
    const auth = getAuth();
    console.log('[TEST DEBUG] Auth state during error:', {
      hasUser: !!auth.currentUser,
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email
    });
    
    throw error;
  }
};

// Add this to window for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuthAndPermissions;
  (window as any).testProgramCreation = testProgramCreationWithAuth;
  (window as any).testSimpleAuth = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    console.log('[SIMPLE AUTH TEST]', {
      hasUser: !!user,
      uid: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      authIsLoaded: auth.config != null
    });
  };
}
