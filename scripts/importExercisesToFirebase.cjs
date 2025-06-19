const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, query, where, getDocs } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgA76WHz1JzwEc1YeazhKTUxqxHzhcP2c",
  authDomain: "session-logger-3619e.firebaseapp.com",
  projectId: "session-logger-3619e",
  storageBucket: "session-logger-3619e.firebasestorage.app",
  messagingSenderId: "936476651752",
  appId: "1:936476651752:web:7048bd9fcc902dc816595d",
  measurementId: "G-B6K0DDSVTH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Category mapping helper function
function mapCategory(type, bodyPart, kategori) {
  const typeStr = String(type || '').toLowerCase();
  const bodyPartStr = String(bodyPart || '').toLowerCase();
  const kategoriStr = String(kategori || '').toLowerCase();

  // Map to existing categories from your app
  if (typeStr.includes('cardio')) return 'cardio';
  if (typeStr.includes('plyometric')) return 'power';
  if (typeStr.includes('stretch')) return 'stretching';
  
  // Map based on primary muscle groups
  if (bodyPartStr.includes('chest')) return 'compound';
  if (bodyPartStr.includes('back')) return 'compound';
  if (bodyPartStr.includes('quadriceps') || bodyPartStr.includes('glutes') || bodyPartStr.includes('legs')) return 'compound';
  if (bodyPartStr.includes('shoulders')) return 'compound';
  if (bodyPartStr.includes('triceps') || bodyPartStr.includes('biceps') || bodyPartStr.includes('arms')) return 'isolation';
  if (bodyPartStr.includes('abdominals') || bodyPartStr.includes('core')) return 'isolation';
  
  // Default to compound if we can't determine
  return 'compound';
}

// Type mapping helper function
function mapType(type, equipment) {
  const typeStr = String(type || '').toLowerCase();
  const equipmentStr = String(equipment || '').toLowerCase();
  
  if (typeStr.includes('cardio')) return 'cardio';
  if (typeStr.includes('stretch')) return 'flexibility';
  if (equipmentStr.includes('body only') || equipmentStr.includes('bodyweight')) return 'bodyweight';
  
  return 'strength'; // Default
}

// Check if exercise already exists function
async function exerciseExists(db, name) {
  const exercisesRef = collection(db, 'exercises');
  const q = query(exercisesRef, where('name', '==', name));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

async function importExercises() {
  try {
    // Read the generated exercises JSON file
    const exercisesPath = path.join(__dirname, '../src/data/generatedExercises.json');
    console.log(`Reading JSON file from: ${exercisesPath}`);
    const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));
    
    console.log(`Importing ${exercisesData.length} exercises to Firebase...`);
    
    let importedCount = 0;
    let skippedCount = 0;
    
    // Process each exercise
    for (let i = 0; i < exercisesData.length; i++) {
      const exercise = exercisesData[i];
      
      // Skip if already exists to avoid duplicates
      const exists = await exerciseExists(db, exercise.name);
      if (exists) {
        skippedCount++;
        if (i % 20 === 0) {
          console.log(`Skipped ${exercise.name} - already exists`);
        }
        continue;
      }
      
      // Clean up and map exercise data
      const bodyPart = Array.isArray(exercise.primaryMuscles) ? exercise.primaryMuscles.join(', ') : '';
      
      // Update category and type to match your app's expected values
      exercise.category = mapCategory(exercise.type, bodyPart, exercise.category);
      exercise.type = mapType(exercise.type, exercise.equipment.join(','));
      
      // Add additional fields if needed
      if (!exercise.instructions) exercise.instructions = [];
      if (!exercise.tips) exercise.tips = [];
      if (!exercise.videoUrl) exercise.videoUrl = '';
      if (!exercise.imageUrl) exercise.imageUrl = '';
      
      // Add to Firestore
      await addDoc(collection(db, 'exercises'), {
        ...exercise,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      importedCount++;
      
      if (i % 10 === 0) {
        console.log(`Processed ${i + 1}/${exercisesData.length} exercises (Imported: ${importedCount}, Skipped: ${skippedCount})...`);
      }
    }
    
    console.log(`Import completed successfully! Imported: ${importedCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('Error importing exercises:', error);
  }
}

importExercises();
