// Migration script to move speed agility exercises from exercises to activity logs collection

async function migrateSpeedAgilityExercises() {
  console.log('� Starting migration of speed agility exercises...');
  
  try {
    // Import required services
    const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } = await import('firebase/firestore');
    const { addActivityLog } = await import('/src/services/firebase/activityLogs.ts');
    
    const db = getFirestore();
    const userId = 'Bnz8b5dGcsaWXFYwo9a48NqL19y2'; // Your user ID from console
    
    // Get exercises from resistance collection
    const exercisesRef = collection(db, 'users', userId, 'exercises');
    const exercisesSnapshot = await getDocs(exercisesRef);
    
    let migratedCount = 0;
    
    for (const docSnap of exercisesSnapshot.docs) {
      const exercise = docSnap.data();
      
      // Check if it's a speed agility exercise
      if (exercise.activityType === 'speedAgility' || 
          (exercise.exerciseName && (
            exercise.exerciseName.toLowerCase().includes('butt kicks') ||
            exercise.exerciseName.toLowerCase().includes('high knees') ||
            exercise.exerciseName.toLowerCase().includes('box jumps') ||
            exercise.exerciseName.toLowerCase().includes('single leg hops') ||
            exercise.exerciseName.toLowerCase().includes('pro agility') ||
            exercise.exerciseName.toLowerCase().includes('hill sprints') ||
            exercise.exerciseName.toLowerCase().includes('sprint')
          ))) {
        
        console.log(`Migrating: ${exercise.exerciseName}`);
        
        // Convert to activity log format
        const activityLogData = {
          activityName: exercise.exerciseName,
          activityType: 'speedAgility',
          date: exercise.date,
          sessions: exercise.sets || [], // Convert sets to sessions
          userId: userId
        };
        
        // Add to activity logs collection
        await addActivityLog(activityLogData, exercise.date);
        
        // Remove from exercises collection
        await deleteDoc(docSnap.ref);
        
        migratedCount++;
      }
    }
    
    console.log(`✅ Migration complete! Moved ${migratedCount} speed agility exercises.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateSpeedAgilityExercises();
      sets: exerciseLog.sets || [],
      // Keep original data as backup
      _migratedFrom: 'exercise-logs',
      _originalData: exerciseLog
    };
    
    // Add to activity logs
    activityLogs.push(activityLog);
    migratedCount++;
    
    console.log(`✅ Migrated: ${activityLog.activityName} -> activity-logs`);
  });
  
  // Remove from exercise logs
  const cleanedExerciseLogs = exerciseLogs.filter(log => 
    !speedAgilityInExercises.some(saLog => saLog.id === log.id)
  );
  
  console.log(`\n💾 Saving migrated data...`);
  console.log(`- Removed ${speedAgilityInExercises.length} from exercise-logs`);
  console.log(`- Added ${migratedCount} to activity-logs`);
  
  // Save updated data
  localStorage.setItem('exercise-logs', JSON.stringify(cleanedExerciseLogs));
  localStorage.setItem('activity-logs', JSON.stringify(activityLogs));
  
  console.log('✅ Migration completed successfully!');
  console.log(`\nSummary:`);
  console.log(`- exercise-logs: ${exerciseLogs.length} -> ${cleanedExerciseLogs.length}`);
  console.log(`- activity-logs: ${activityLogs.length - migratedCount} -> ${activityLogs.length}`);
  
  return {
    migrated: migratedCount,
    exerciseLogsBefore: exerciseLogs.length,
    exerciseLogsAfter: cleanedExerciseLogs.length,
    activityLogsBefore: activityLogs.length - migratedCount,
    activityLogsAfter: activityLogs.length
  };
}

// Run migration
const result = migrateSpeedAgilityExercises();

if (result && result.migrated > 0) {
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Refresh the page to see updated data');
  console.log('2. Try exporting data - migrated exercises should now be included');
  console.log('3. Verify the UI still shows all exercises correctly');
}
