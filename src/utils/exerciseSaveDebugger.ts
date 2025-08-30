// Exercise Save Flow Debugger
// This utility helps debug the complete exercise save flow

import { getAuth } from 'firebase/auth';
import { saveLog } from '../services/firebase/unifiedLogs';
import { ExerciseSet } from '../types/sets';
import { DifficultyCategory } from '../types/difficulty';

// Test function to debug the complete save flow
export const debugExerciseSave = async () => {
  console.log('🔍 =========================');
  console.log('🔍 EXERCISE SAVE FLOW DEBUG');
  console.log('🔍 =========================');

  // Step 1: Check authentication
  console.log('📋 Step 1: Checking authentication...');
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ CRITICAL: No authenticated user found');
    console.log('💡 Solution: Please log in to the application first');
    return false;
  }
  
  console.log('✅ Authentication OK:', {
    uid: currentUser.uid,
    email: currentUser.email,
    emailVerified: currentUser.emailVerified
  });

  // Step 2: Test Redux state
  console.log('📋 Step 2: Checking Redux user state...');
  const reduxState = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? 
    JSON.parse(localStorage.getItem('reduxState') || '{}') : null;
  
  const reduxUser = reduxState?.auth?.user;
  if (!reduxUser) {
    console.warn('⚠️ Redux user state not found - checking alternative methods');
    // Check if user is available in any global state
    const anyWindow = window as any;
    if (anyWindow.store?.getState?.()?.auth?.user) {
      console.log('✅ Found user in global store');
    } else {
      console.warn('⚠️ No Redux user state - app may not be fully initialized');
    }
  } else {
    console.log('✅ Redux user state OK:', {
      id: reduxUser.id,
      email: reduxUser.email
    });
  }

  // Step 3: Test simple exercise save
  console.log('📋 Step 3: Testing simple exercise save...');
  
  try {
    // Test with minimal strength exercise
    const testExerciseData = {
      exerciseName: 'Debug Test Exercise',
      userId: currentUser.uid,      sets: [{
        weight: 50,
        reps: 10,
        difficulty: DifficultyCategory.NORMAL
      }] as ExerciseSet[],
      exerciseType: 'strength' as const
    };

    console.log('💾 Attempting to save test exercise:', testExerciseData);
    
    const docId = await saveLog(testExerciseData, new Date());
    
    console.log('✅ SUCCESS: Test exercise saved with ID:', docId);
    return true;
    
  } catch (error) {
    console.error('❌ SAVE FAILED:', error);
    
    // Analyze the error
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('permission')) {
      console.error('🚫 PERMISSION ERROR: Check Firestore rules and authentication');
      console.log('💡 Debug steps:');
      console.log('   1. Verify user is logged in');
      console.log('   2. Check Firestore rules allow write access');
      console.log('   3. Verify user ID matches authenticated user');
    } else if (errorMessage.includes('undefined') || errorMessage.includes('null')) {
      console.error('📝 DATA VALIDATION ERROR: Required fields missing');
      console.log('💡 Debug steps:');
      console.log('   1. Check all required fields are present');
      console.log('   2. Verify data types match expected schema');
      console.log('   3. Check for undefined values in nested objects');
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      console.error('🌐 NETWORK ERROR: Connection issue');
      console.log('💡 Debug steps:');
      console.log('   1. Check internet connection');
      console.log('   2. Verify Firebase configuration');
      console.log('   3. Check browser network tab for failed requests');
    } else {
      console.error('❓ UNKNOWN ERROR:', errorMessage);
    }
    
    return false;
  }
};

// Test function to debug activity save (non-resistance exercises)
export const debugActivitySave = async () => {
  console.log('🔍 =========================');
  console.log('🔍 ACTIVITY SAVE FLOW DEBUG');
  console.log('🔍 =========================');

  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ CRITICAL: No authenticated user found');
    return false;
  }

  try {
    // Test with minimal endurance activity
    const testActivityData = {
      activityName: 'Debug Test Run',
      userId: currentUser.uid,
      sets: [{
        duration: 30,
        distance: 5,
        rpe: 7
      }] as ExerciseSet[],
      exerciseType: 'endurance' as const
    };

    console.log('💾 Attempting to save test activity:', testActivityData);
    
    const docId = await saveLog(testActivityData, new Date());
    
    console.log('✅ SUCCESS: Test activity saved with ID:', docId);
    return true;
    
  } catch (error) {
    console.error('❌ ACTIVITY SAVE FAILED:', error);
    return false;
  }
};

// Comprehensive save flow test
export const debugSaveFlow = async () => {
  console.log('🚀 Starting comprehensive save flow debug...');
  
  const strengthResult = await debugExerciseSave();
  const activityResult = await debugActivitySave();
  
  console.log('📊 =========================');
  console.log('📊 DEBUG SUMMARY');
  console.log('📊 =========================');
  console.log('💪 Strength Exercise Save:', strengthResult ? '✅ PASSED' : '❌ FAILED');
  console.log('🏃 Activity Save:', activityResult ? '✅ PASSED' : '❌ FAILED');
  
  if (strengthResult && activityResult) {
    console.log('🎉 All save tests PASSED - issue may be in UI flow');
    console.log('💡 Next debug steps:');
    console.log('   1. Check UI button click handlers');
    console.log('   2. Verify form data is properly formatted');
    console.log('   3. Check for JavaScript errors in browser console during save');
  } else {
    console.log('🔧 Some save tests FAILED - check error details above');
  }
  
  return { strengthResult, activityResult };
};

// Make functions globally available for browser console testing
if (typeof window !== 'undefined') {
  (window as any).debugExerciseSave = debugExerciseSave;
  (window as any).debugActivitySave = debugActivitySave;
  (window as any).debugSaveFlow = debugSaveFlow;
    console.log('🛠️ Debug functions loaded! Run in browser console:');
  console.log('   debugSaveFlow() - Run comprehensive test');
  console.log('   debugExerciseSave() - Test strength exercise save');
  console.log('   debugActivitySave() - Test activity save');
}
