// Quick test to validate the loading fix works immediately
import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';
import { ActivityType } from '@/types/activityTypes';

export async function testCurrentLoading(userId: string, date: Date): Promise<void> {
  console.log('🔍 Testing current exercise loading behavior...');
  console.log('📅 Target date:', date.toLocaleDateString());
  console.log('👤 User ID:', userId);
  
  try {
    // Test the unified loader
    console.log('\n📊 Calling getAllExercisesByDate...');
    const exercises = await getAllExercisesByDate(date, userId);
    
    console.log(`✅ Retrieved ${exercises.length} total exercises`);
    
    if (exercises.length === 0) {
      console.log('📝 No exercises found for this date. This could mean:');
      console.log('  1. No exercises logged on this date');
      console.log('  2. Exercises are on a different date');
      console.log('  3. Still an issue with loading logic');
      return;
    }
    
    // Analyze by type
    const byType = {
      resistance: exercises.filter(ex => !ex.activityType || ex.activityType === ActivityType.RESISTANCE),
      nonResistance: exercises.filter(ex => ex.activityType && ex.activityType !== ActivityType.RESISTANCE)
    };
    
    console.log('\n📈 Exercise breakdown:');
    console.log(`  Resistance exercises: ${byType.resistance.length}`);
    console.log(`  Non-resistance exercises: ${byType.nonResistance.length}`);
    
    // List all exercises
    console.log('\n📋 All exercises found:');
    exercises.forEach((ex, index) => {
      const type = ex.activityType || 'resistance';
      const icon = getTypeIcon(type);
      console.log(`  ${index + 1}. ${icon} ${ex.exerciseName} (${type}) - ${ex.sets?.length || 0} sets`);
    });
    
    // Validation
    if (byType.nonResistance.length > 0) {
      console.log('\n🎉 SUCCESS! Non-resistance exercises are now being loaded correctly!');
      console.log('✅ The exercise type differentiation fix is working!');
    } else if (byType.resistance.length > 0) {
      console.log('\n⚠️ Only resistance exercises found. Try creating some non-resistance exercises to test the fix fully.');
    } else {
      console.log('\n🤔 No exercises found. Create some exercises first.');
    }
    
  } catch (error) {
    console.error('❌ Error testing current loading:', error);
  }
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    resistance: '🏋️‍♂️',
    endurance: '🏃‍♂️',
    speed_agility: '⚡',
    sport: '⚽',
    stretching: '🧘‍♀️',
    other: '🎯'
  };
  return icons[type] || '🏋️‍♂️';
}

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).testCurrentLoading = testCurrentLoading;
}
