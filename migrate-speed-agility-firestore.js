// Migration script to move speed agility exercises from exercises to activity logs collection

async function migrateSpeedAgilityExercises() {
  console.log('🔄 Starting migration of speed agility exercises...');

  try {
    // Import Firebase db from the app's config
    const { db } = await import('/src/services/firebase/config.ts');
    if (!db) {
      throw new Error('Firebase Firestore not available. Make sure you are running this in the browser console with the app loaded.');
    }

    const userId = 'Bnz8b5dGcsaWXFYwo9a48NqL19y2'; // Your user ID from console

    // Get exercises from resistance collection
    const exercisesRef = db.collection('users').doc(userId).collection('exercises');
    const exercisesSnapshot = await exercisesRef.get();

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
        const activityLogsRef = db.collection('users').doc(userId).collection('activities');
        await activityLogsRef.add(activityLogData);

        // Remove from exercises collection
        await docSnap.ref.delete();

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
