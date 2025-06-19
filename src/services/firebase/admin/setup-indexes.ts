import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  "type": "service_account",
  "project_id": "session-logger-3619e",
  // Add your service account credentials here
};

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function createRequiredIndexes() {
  try {
    // Create index for trainingSessions collection
    await db.collection('trainingSessions').listIndexes();
    const index = {
      collectionGroup: 'trainingSessions',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'date', order: 'DESCENDING' }
      ]
    };

    await db.collection('trainingSessions').createIndex(index);
    console.log('Index created successfully');
  } catch (error) {
    console.error('Error creating index:', error);
  }
}

createRequiredIndexes().then(() => process.exit());
