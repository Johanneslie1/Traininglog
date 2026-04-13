// User ID utility for testing
// import { useSelector } from 'react-redux';
// import { RootState } from '@/store/store';
import { auth } from '@/services/firebase/config';

// Function to get current user ID from Redux store
export const getCurrentUserIdFromRedux = () => {
  try {
    const state = (window as any).__REDUX_STORE__?.getState();
    if (state?.auth?.user?.id) {
      return state.auth.user.id;
    }
    return null;
  } catch (error) {
    console.warn('Could not get user ID from Redux store:', error);
    return null;
  }
};

// Function to get current user ID from Firebase auth
export const getCurrentUserIdFromFirebase = () => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return currentUser.uid;
    }
    return null;
  } catch (error) {
    console.warn('Could not get user ID from Firebase auth:', error);
    return null;
  }
};

// Combined function to get user ID from any available source
export const getCurrentUserId = () => {
  // Try Redux first
  const reduxUserId = getCurrentUserIdFromRedux();
  if (reduxUserId) {
    console.log('✅ Found user ID from Redux store:', reduxUserId);
    return reduxUserId;
  }

  // Try Firebase auth
  const firebaseUserId = getCurrentUserIdFromFirebase();
  if (firebaseUserId) {
    console.log('✅ Found user ID from Firebase auth:', firebaseUserId);
    return firebaseUserId;
  }

  // If no user ID found, provide instructions
  console.warn('❌ No user ID found. Please make sure you are logged in.');
  console.log('💡 Try these steps:');
  console.log('  1. Make sure you are logged in to the app');
  console.log('  2. Check the Redux store: window.__REDUX_STORE__.getState().auth.user');
  console.log('  3. Check Firebase auth: auth.currentUser');
  console.log('  4. Manually provide your user ID as a string');
  
  return null;
};

// Debug function to show all available user information
export const debugUserInfo = () => {
  console.log('🔍 USER INFORMATION DEBUG');
  console.log('='.repeat(50));
  
  // Check Redux store
  try {
    const state = (window as any).__REDUX_STORE__?.getState();
    console.log('📦 Redux Auth State:', state?.auth);
    if (state?.auth?.user) {
      console.log('  ✅ Redux user found:', {
        id: state.auth.user.id,
        email: state.auth.user.email,
        displayName: state.auth.user.displayName
      });
    } else {
      console.log('  ❌ No user in Redux store');
    }
  } catch (error) {
    console.log('  ❌ Error accessing Redux store:', error);
  }
  
  // Check Firebase auth
  try {
    const currentUser = auth.currentUser;
    console.log('🔥 Firebase Auth State:', currentUser);
    if (currentUser) {
      console.log('  ✅ Firebase user found:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        isAnonymous: currentUser.isAnonymous
      });
    } else {
      console.log('  ❌ No user in Firebase auth');
    }
  } catch (error) {
    console.log('  ❌ Error accessing Firebase auth:', error);
  }
  
  // Show localStorage info
  try {
    const deviceId = localStorage.getItem('device_id');
    console.log('💾 Local Storage Info:');
    console.log('  Device ID:', deviceId);
    
    // Check for any other user-related data
    const keys = Object.keys(localStorage);
    const userKeys = keys.filter(key => 
      key.includes('user') || 
      key.includes('auth') || 
      key.includes('firebase')
    );
    if (userKeys.length > 0) {
      console.log('  Other user-related keys:', userKeys);
    }
  } catch (error) {
    console.log('  ❌ Error accessing localStorage:', error);
  }
  
  return {
    reduxUserId: getCurrentUserIdFromRedux(),
    firebaseUserId: getCurrentUserIdFromFirebase(),
    finalUserId: getCurrentUserId()
  };
};

// Make functions available globally for console testing
declare global {
  interface Window {
    getCurrentUserId: typeof getCurrentUserId;
    debugUserInfo: typeof debugUserInfo;
    getCurrentUserIdFromRedux: typeof getCurrentUserIdFromRedux;
    getCurrentUserIdFromFirebase: typeof getCurrentUserIdFromFirebase;
  }
}

window.getCurrentUserId = getCurrentUserId;
window.debugUserInfo = debugUserInfo;
window.getCurrentUserIdFromRedux = getCurrentUserIdFromRedux;
window.getCurrentUserIdFromFirebase = getCurrentUserIdFromFirebase;

console.log('👤 User ID utilities loaded. Run:');
console.log('  getCurrentUserId() - to get current user ID');
console.log('  debugUserInfo() - to see all user information');
console.log('  getCurrentUserIdFromRedux() - to get from Redux store');
console.log('  getCurrentUserIdFromFirebase() - to get from Firebase auth');
