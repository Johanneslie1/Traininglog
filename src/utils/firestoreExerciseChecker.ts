// Simple diagnostic to check existing Firestore data
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

export async function checkFirestoreExercises(userId: string): Promise<void> {
  console.log('🔍 Checking Firestore for existing exercises with activityType...');
  
  try {
    // Check all exercises in user's collection
    const exercisesRef = collection(db, 'users', userId, 'exercises');
    const q = query(exercisesRef, orderBy('timestamp', 'desc'));
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 Total exercises in Firestore: ${querySnapshot.docs.length}`);
    
    let resistanceCount = 0;
    let activityCount = 0;
    
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const hasActivityType = !!data.activityType;
      
      if (hasActivityType) {
        activityCount++;
        console.log(`🏃 Activity Exercise: ${data.exerciseName} (${data.activityType}) - ID: ${doc.id}`);
      } else {
        resistanceCount++;
        console.log(`🏋️ Resistance Exercise: ${data.exerciseName} - ID: ${doc.id}`);
      }
    });
    
    console.log('\n📈 Summary:');
    console.log(`  Resistance exercises: ${resistanceCount}`);
    console.log(`  Activity exercises (with activityType): ${activityCount}`);
    
    if (activityCount > 0) {
      console.log('\n✅ Found existing activity exercises! The fix should now make these visible.');
    } else {
      console.log('\n⚠️ No existing activity exercises found. Try creating some through the activity pickers first.');
    }
    
    // Also check for exercises with activityType specifically
    try {
      const activityQuery = query(
        exercisesRef,
        where('activityType', '!=', null),
        orderBy('activityType'),
        orderBy('timestamp', 'desc')
      );
      
      const activitySnapshot = await getDocs(activityQuery);
      console.log(`\n🎯 Querying specifically for exercises with activityType: ${activitySnapshot.docs.length} found`);
      
      activitySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log(`  - ${data.exerciseName} (${data.activityType}) at ${data.timestamp?.toDate?.()?.toLocaleString()}`);
      });
      
    } catch (queryError) {
      console.warn('⚠️ Could not query for activityType exercises (this is normal if none exist):', queryError);
    }
    
  } catch (error) {
    console.error('❌ Error checking Firestore exercises:', error);
  }
}

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).checkFirestoreExercises = checkFirestoreExercises;
}
