import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebase/config';

/**
 * Utility to clean up contaminated data where sport activities
 * were incorrectly saved to the exercises collection
 */
export async function cleanupContaminatedExerciseData(): Promise<{
  success: boolean;
  removedCount: number;
  errors: string[];
}> {
  const user = auth.currentUser;
  const errors: string[] = [];
  
  if (!user) {
    return {
      success: false,
      removedCount: 0,
      errors: ['User not authenticated']
    };
  }

  try {
    console.log('🧹 Starting cleanup of contaminated exercise data...');
    
    // Get all documents from exercises collection
    const exercisesRef = collection(db, 'users', user.uid, 'exercises');
    const querySnapshot = await getDocs(exercisesRef);
    
    const documentsToDelete: { id: string; name: string; reason: string }[] = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const exerciseName = data.exerciseName || '';
      const activityType = data.activityType || '';
      const sets = data.sets || [];
      
      // Identify contaminated documents
      const sportPatterns = [
        'football', 'soccer', 'basketball', 'tennis', 'volleyball', 'baseball',
        'cricket', 'rugby', 'hockey', 'badminton', 'table tennis', 'ping pong'
      ];
      
      const cardioPatterns = [
        'running', 'jogging', 'cycling', 'swimming', 'walking',
        'treadmill', 'elliptical', 'rowing', 'stationary bike'
      ];
      
      const flexibilityPatterns = [
        'yoga', 'pilates', 'stretching', 'meditation', 'tai chi'
      ];
      
      const allPatterns = [...sportPatterns, ...cardioPatterns, ...flexibilityPatterns];
      
      let contaminated = false;
      let reason = '';
      
      // Check exercise name patterns
      const nameMatch = allPatterns.find(pattern => 
        exerciseName.toLowerCase().includes(pattern)
      );
      
      if (nameMatch) {
        contaminated = true;
        reason = `Exercise name contains sport/cardio activity: "${nameMatch}"`;
      }
      
      // Check activity type mismatch
      if (activityType && activityType !== 'resistance' && activityType !== 'strength') {
        contaminated = true;
        reason = reason ? `${reason}, ` : '';
        reason += `Wrong activity type: "${activityType}"`;
      }
      
      // Check for absence of resistance training data
      const hasResistanceData = sets.some((set: any) => 
        (set.weight !== undefined && set.weight >= 0) || 
        (set.reps && set.reps > 0 && set.weight !== undefined)
      );
      
      if (sets.length > 0 && !hasResistanceData) {
        // Additional check - if it has sport/cardio fields, it's contaminated
        const hasSportData = sets.some((set: any) => 
          set.duration || set.distance || set.pace || set.calories || 
          set.averageHeartRate || set.maxHeartRate || set.hrZone1
        );
        
        if (hasSportData) {
          contaminated = true;
          reason = reason ? `${reason}, ` : '';
          reason += 'Contains sport/cardio data instead of resistance data';
        }
      }
      
      if (contaminated) {
        documentsToDelete.push({
          id: docSnapshot.id,
          name: exerciseName,
          reason
        });
      }
    });
    
    console.log(`🧹 Found ${documentsToDelete.length} contaminated documents to remove:`);
    documentsToDelete.forEach(item => {
      console.log(`  - ${item.name} (${item.reason})`);
    });
    
    // Delete contaminated documents
    let removedCount = 0;
    for (const item of documentsToDelete) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'exercises', item.id));
        console.log(`✅ Removed: ${item.name}`);
        removedCount++;
      } catch (error) {
        const errorMsg = `Failed to remove ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    console.log(`🧹 Cleanup complete. Removed ${removedCount}/${documentsToDelete.length} contaminated documents.`);
    
    return {
      success: true,
      removedCount,
      errors
    };
    
  } catch (error) {
    const errorMsg = `Error during data cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('❌', errorMsg);
    return {
      success: false,
      removedCount: 0,
      errors: [errorMsg]
    };
  }
}

/**
 * Check if contaminated data exists without removing it
 */
export async function checkForContaminatedData(): Promise<{
  hasContamination: boolean;
  contaminatedCount: number;
  examples: string[];
}> {
  const user = auth.currentUser;
  
  if (!user) {
    return {
      hasContamination: false,
      contaminatedCount: 0,
      examples: []
    };
  }

  try {
    const exercisesRef = collection(db, 'users', user.uid, 'exercises');
    const querySnapshot = await getDocs(exercisesRef);
    
    const contaminated: string[] = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const exerciseName = data.exerciseName || '';
      const activityType = data.activityType || '';
      
      const allPatterns = [
        'football', 'soccer', 'basketball', 'tennis', 'volleyball',
        'running', 'jogging', 'cycling', 'swimming', 'walking',
        'yoga', 'pilates', 'stretching', 'meditation'
      ];
      
      const isContaminated = allPatterns.some(pattern => 
        exerciseName.toLowerCase().includes(pattern)
      ) || (activityType && activityType !== 'resistance' && activityType !== 'strength');
      
      if (isContaminated) {
        contaminated.push(exerciseName);
      }
    });
    
    return {
      hasContamination: contaminated.length > 0,
      contaminatedCount: contaminated.length,
      examples: contaminated.slice(0, 5) // First 5 examples
    };
    
  } catch (error) {
    console.error('Error checking for contaminated data:', error);
    return {
      hasContamination: false,
      contaminatedCount: 0,
      examples: []
    };
  }
}
