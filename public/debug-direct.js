// Direct document check script
console.log('🔍 Direct Document Check Script Loaded');

window.checkSavedDocument = async function() {
  console.log('🔍 Checking saved document directly...');
  
  try {
    const userId = 'Bnz8b5dGcsaWXFYwo9a48NqL19y2';
    const docId = 'wijkC2jjb9ulMO88M402'; // From our test save
    
    // Import Firestore functions using the module path
    const firestoreModule = await import('firebase/firestore');
    const { db } = await import('/src/services/firebase/firebase.ts');
    
    // Check if the document exists directly
    const docRef = firestoreModule.doc(db, 'users', userId, 'activities', docId);
    const docSnap = await firestoreModule.getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Document exists:', {
        id: docSnap.id,
        activityName: data.activityName,
        activityType: data.activityType,
        timestamp: data.timestamp?.toDate?.()?.toISOString(),
        sets: data.sets?.length || 0,
        userId: data.userId
      });
      
      // Check if the timestamp is what we expect
      const docTimestamp = data.timestamp?.toDate();
      if (docTimestamp) {
        console.log('📅 Document timestamp analysis:', {
          timestamp: docTimestamp.toISOString(),
          isUtc: docTimestamp.getTimezoneOffset() === 0,
          hour: docTimestamp.getUTCHours(),
          date: docTimestamp.getUTCDate(),
          month: docTimestamp.getUTCMonth(),
          year: docTimestamp.getUTCFullYear()
        });
        
        // Check if it falls within today's query range
        const today = new Date(2025, 7, 28); // August 28, 2025
        const startOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));
        
        const isInRange = docTimestamp >= startOfDay && docTimestamp <= endOfDay;
        console.log('✅ Timestamp is in today\'s range:', isInRange, {
          docTime: docTimestamp.toISOString(),
          rangeStart: startOfDay.toISOString(),
          rangeEnd: endOfDay.toISOString()
        });
      }
    } else {
      console.log('❌ Document does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking document:', error);
  }
};

window.testQueryDirectly = async function() {
  console.log('🔍 Testing query directly...');
  
  try {
    const userId = 'Bnz8b5dGcsaWXFYwo9a48NqL19y2';
    
    // Import Firestore functions
    const firestoreModule = await import('firebase/firestore');
    const { db } = await import('/src/services/firebase/firebase.ts');
    
    // Set up the exact same query as the app uses
    const today = new Date(2025, 7, 28); // August 28, 2025
    const startOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));
    
    console.log('📅 Query setup:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });
    
    // Query the activities collection directly
    const activitiesRef = firestoreModule.collection(db, 'users', userId, 'activities');
    const q = firestoreModule.query(
      activitiesRef,
      firestoreModule.where('timestamp', '>=', firestoreModule.Timestamp.fromDate(startOfDay)),
      firestoreModule.where('timestamp', '<=', firestoreModule.Timestamp.fromDate(endOfDay)),
      firestoreModule.orderBy('timestamp', 'desc')
    );
    
    console.log('🔍 Executing query...');
    const querySnapshot = await firestoreModule.getDocs(q);
    
    console.log('📊 Query results:', {
      totalDocs: querySnapshot.docs.length,
      empty: querySnapshot.empty
    });
    
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📄 Document ${index + 1}:`, {
        id: doc.id,
        activityName: data.activityName,
        activityType: data.activityType,
        timestamp: data.timestamp?.toDate?.()?.toISOString(),
        sets: data.sets?.length || 0
      });
    });
    
    if (querySnapshot.empty) {
      console.log('🤔 Query returned empty. Let\'s check all documents in the collection...');
      
      // Query all documents without date filter
      const allDocsQuery = firestoreModule.query(activitiesRef, firestoreModule.orderBy('timestamp', 'desc'));
      const allDocsSnapshot = await firestoreModule.getDocs(allDocsQuery);
      
      console.log('📊 All documents in activities collection:', allDocsSnapshot.docs.length);
      allDocsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const docTimestamp = data.timestamp?.toDate();
        console.log(`📄 All Doc ${index + 1}:`, {
          id: doc.id,
          activityName: data.activityName,
          timestamp: docTimestamp?.toISOString(),
          isInRange: docTimestamp ? (docTimestamp >= startOfDay && docTimestamp <= endOfDay) : false
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing query:', error);
  }
};

console.log('💡 Direct check functions available:');
console.log('  checkSavedDocument() - Check if the saved document exists');
console.log('  testQueryDirectly() - Test the Firestore query directly');
