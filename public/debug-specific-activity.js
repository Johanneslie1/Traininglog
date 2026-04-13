// Debug script to check specific activity document
console.log('🔍 Specific Activity Debug Script Loaded');

window.checkSpecificActivity = async function() {
  console.log('🔍 Checking specific activity document...');
  
  try {
    // Get current user - try multiple methods
    let userId = null;
    
    // Method 1: Redux store
    const state = window.store?.getState();
    if (state?.auth?.user?.id) {
      userId = state.auth.user.id;
    }
    
    // Method 2: Direct from window
    if (!userId && window.getCurrentUserId) {
      userId = window.getCurrentUserId();
    }
    
    // Method 3: Hardcode the known user ID
    if (!userId) {
      userId = 'Bnz8b5dGcsaWXFYwo9a48NqL19y2';
    }
    
    if (!userId) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    console.log('👤 User ID:', userId);
      // Import Firebase functions - use the app's existing Firebase setup
    const { db } = await import('/src/services/firebase/firebase.ts');
    const { doc, getDoc } = await import('firebase/firestore');
      // Check the specific document we know was saved
    const activityId = '57Yw3enbcpcLcn5HQrtL';
    const docRef = doc(db, 'users', userId, 'activities', activityId);
    
    console.log('📄 Checking document path:', `users/${userId}/activities/${activityId}`);
    
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Document exists!', {
        id: docSnap.id,
        activityName: data.activityName,
        activityType: data.activityType,
        timestamp: data.timestamp?.toDate?.()?.toISOString(),
        sets: data.sets?.length || 0,
        userId: data.userId
      });
      
      // Check the timestamp specifically for August 28, 2025
      const docDate = data.timestamp?.toDate();
      const targetDate = new Date(2025, 7, 28); // August 28, 2025
      const startOfDay = new Date(2025, 7, 28, 0, 0, 0, 0);
      const endOfDay = new Date(2025, 7, 28, 23, 59, 59, 999);
      
      console.log('📅 Timestamp analysis:', {
        documentTimestamp: docDate?.toISOString(),
        targetDate: targetDate.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
        isInRange: docDate >= startOfDay && docDate <= endOfDay,
        dayMatch: docDate?.getDate() === 28 && docDate?.getMonth() === 7 && docDate?.getFullYear() === 2025
      });
      
    } else {
      console.log('❌ Document does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking document:', error);
  }
};

window.checkAllUserActivities = async function() {
  console.log('🔍 Checking all user activities...');
  
  try {
    // Get current user - try multiple methods
    let userId = null;
    
    // Method 1: Redux store
    const state = window.store?.getState();
    if (state?.auth?.user?.id) {
      userId = state.auth.user.id;
    }
    
    // Method 2: Direct from window
    if (!userId && window.getCurrentUserId) {
      userId = window.getCurrentUserId();
    }
    
    // Method 3: Hardcode the known user ID
    if (!userId) {
      userId = 'Bnz8b5dGcsaWXFYwo9a48NqL19y2';
    }
    
    if (!userId) {
      console.error('❌ No authenticated user found');
      return;
    }
      // Import Firebase functions - use the app's existing Firebase setup
    const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
    const { db } = await import('/src/services/firebase/firebase.ts');
      // Get all activities for this user
    const activitiesRef = collection(db, 'users', userId, 'activities');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'));
    
    const querySnapshot = await getDocs(q);
    console.log('📊 Total activities found:', querySnapshot.docs.length);
    
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate();
      console.log(`🏃 Activity ${index + 1}:`, {
        id: doc.id,
        name: data.activityName,
        type: data.activityType,
        timestamp: timestamp?.toISOString(),
        date: timestamp ? `${timestamp.getDate()}.${timestamp.getMonth() + 1}.${timestamp.getFullYear()}` : 'No date',
        sets: data.sets?.length || 0
      });
    });
    
    // Filter for High Knees specifically
    const highKnees = querySnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.activityName?.toLowerCase().includes('high knees');
    });
    
    console.log('⚡ High Knees activities found:', highKnees.length);
    highKnees.forEach(doc => {
      const data = doc.data();
      console.log('⚡ High Knees:', {
        id: doc.id,
        name: data.activityName,
        timestamp: data.timestamp?.toDate?.()?.toISOString()
      });
    });
    
  } catch (error) {
    console.error('❌ Error checking activities:', error);
  }
};

console.log('💡 Debug functions available:');
console.log('  checkSpecificActivity() - Check the saved High Knees exercise');
console.log('  checkAllUserActivities() - List all user activities');
