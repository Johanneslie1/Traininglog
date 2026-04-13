import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { ExerciseType } from '@/config/exerciseTypes';
import { ExerciseSet } from '@/types/sets';

// Test function to verify Firebase permissions for different exercise types
export const testFirebasePermissions = async (userId: string): Promise<void> => {
  console.log('🧪 Starting Firebase permissions test for different exercise types...');
  
  const testExercises = [
    {
      name: 'Running',
      type: 'endurance' as ExerciseType,
      categories: ['Endurance'],
      sets: [{
        duration: 30,
        distance: 5,
        rpe: 7,
        hrZone3: 30, // 30 minutes in heart rate zone 3
        notes: 'Morning run'
      }] as ExerciseSet[]
    },
    {
      name: 'Football',
      type: 'team_sports' as ExerciseType,
      categories: ['Team Sports'],
      sets: [{
        duration: 90,
        rpe: 8,
        notes: 'Good match, scored 2-1'
      }] as ExerciseSet[]
    },
    {
      name: 'Hiking',
      type: 'outdoor' as ExerciseType,
      categories: ['Outdoor Activities'],
      sets: [{
        duration: 120,
        distance: 8,
        difficulty: 'intermediate' as any,
        notes: 'Sunny weather, beautiful views'
      }] as ExerciseSet[]
    },
    {
      name: 'Yoga',
      type: 'flexibility' as ExerciseType,
      categories: ['Flexibility'],
      sets: [{
        duration: 45,
        stretchType: 'Full body flow',
        intensity: 7,
        notes: 'Relaxing yoga session'
      }] as ExerciseSet[]
    },
    {
      name: 'Box Jumps',
      type: 'plyometrics' as ExerciseType,
      categories: ['Plyometrics'],
      sets: [{
        reps: 15,
        height: 24, // Box height in cm
        intensity: 8,
        notes: 'Explosive movements'
      }] as ExerciseSet[]
    }
  ];

  for (const exercise of testExercises) {
    try {
      console.log(`🧪 Testing ${exercise.name} (${exercise.type})...`);
      
      const logData = {
        exerciseName: exercise.name,
        userId: userId,
        sets: exercise.sets,
        exerciseType: exercise.type,
        categories: exercise.categories
      };

      const docId = await addExerciseLog(logData, new Date());
      console.log(`✅ ${exercise.name} saved successfully with ID: ${docId}`);
      
    } catch (error) {
      console.error(`❌ Failed to save ${exercise.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('permission')) {
        console.error(`🚫 Permission denied for ${exercise.name}. Check Firestore rules.`);
      } else if (errorMessage.includes('undefined')) {
        console.error(`📝 Data validation error for ${exercise.name}. Check data structure.`);
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🧪 Firebase permissions test completed!');
};

// Function to test Firebase permissions from browser console
export const runFirebaseTest = () => {
  // This function should be called from browser console when authenticated
  // Try to get user from Redux store first
  const reduxState = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? 
    JSON.parse(localStorage.getItem('reduxState') || '{}') : null;
  
  let userId = null;
  
  // Try different ways to get the current user
  if (reduxState?.auth?.user?.id) {
    userId = reduxState.auth.user.id;
  } else if ((window as any).firebase?.auth?.currentUser) {
    userId = (window as any).firebase.auth.currentUser.uid;
  } else {
    // Try to find user from any available global state
    const anyWindow = window as any;
    if (anyWindow.reduxStore?.getState?.()?.auth?.user?.id) {
      userId = anyWindow.reduxStore.getState().auth.user.id;
    }
  }
  
  if (!userId) {
    console.error('❌ No authenticated user found. Please log in first.');
    console.log('💡 To test: 1) Log in to the app, 2) Open browser console, 3) Run: testFirebasePermissions()');
    return;
  }
  
  console.log('🧪 Found user ID:', userId);
  testFirebasePermissions(userId);
};

// Make it globally available for testing
(window as any).testFirebasePermissions = runFirebaseTest;
