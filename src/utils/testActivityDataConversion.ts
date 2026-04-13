// Test specifically for activity data conversion and display
import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';

export async function testActivityDataConversion(userId: string, date: Date): Promise<void> {
  console.log('🧪 Testing activity data conversion...');
  console.log('📅 Target date:', date.toLocaleDateString());
  
  try {
    const exercises = await getAllExercisesByDate(date, userId);
    console.log(`📊 Retrieved ${exercises.length} exercises total`);
    
    const activityExercises = exercises.filter(ex => ex.activityType && ex.activityType !== 'resistance');
    
    if (activityExercises.length === 0) {
      console.log('⚠️ No activity exercises found. Create some using the activity pickers first.');
      return;
    }
    
    console.log(`🏃 Found ${activityExercises.length} activity exercises:`);
    
    activityExercises.forEach((exercise, index) => {
      console.log(`\n${index + 1}. ${exercise.exerciseName} (${exercise.activityType})`);
      console.log(`   Sets: ${exercise.sets?.length || 0}`);
      
      if (exercise.sets && exercise.sets.length > 0) {        exercise.sets.forEach((set, setIndex) => {
          const activitySet = set as any; // Cast to access activity-specific fields
          console.log(`   Set ${setIndex + 1}:`, {
            duration: activitySet.duration,
            distance: activitySet.distance,
            calories: activitySet.calories,
            pace: activitySet.pace,
            heartRate: activitySet.heartRate,
            intensity: activitySet.intensity,
            rpe: activitySet.rpe,
            notes: activitySet.notes,
            // Show all available fields
            allFields: Object.keys(set)
          });
        });
      }
    });
      // Check if activity-specific data is present
    const hasActivityData = activityExercises.some(ex => 
      ex.sets?.some(set => 
        (set as any).distance || (set as any).calories || (set as any).pace || (set as any).maxHeartRate || 
        set.rpe || (set as any).intensity || (set as any).duration
      )
    );
    
    if (hasActivityData) {
      console.log('\n✅ SUCCESS! Activity-specific data is being converted and displayed!');
    } else {
      console.log('\n❌ ISSUE: Activity exercises found but no activity-specific data visible.');
      console.log('   This suggests the conversion is not working properly.');
    }
    
  } catch (error) {
    console.error('❌ Error testing activity data conversion:', error);
  }
}

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).testActivityDataConversion = testActivityDataConversion;
}
