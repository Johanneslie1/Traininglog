const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, query, where, getDocs } = require('firebase/firestore');

// Your Firebase configuration - replace with your actual config if different
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Paths
const csvFilePath = path.join(__dirname, '../Øvelsesdatabase.csv');
const jsonOutputPath = path.join(__dirname, '../src/data/generatedExercises.json');
const tsOutputPath = path.join(__dirname, '../src/data/importedExercises.ts');

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

// Process CSV function
function processCSV() {
  console.log(`Reading CSV file: ${csvFilePath}`);
  
  const results = [];
  
  // CSV parsing stream
  const parser = csv({
    skipLines: 0,
    headers: ['id', 'Title', 'Desc', 'Type', 'BodyPart', 'Equipment', 'Kategori', 'Lateralitet']
  });
  
  fs.createReadStream(csvFilePath)
    .on('error', (err) => {
      console.error('Error reading CSV file:', err);
    })
    .pipe(parser)
    .on('data', (data) => {
      // Check if this is a valid row with required fields
      if (!data.Title || data.Title === 'Title') {
        return; // Skip header row or empty rows
      }
      
      // Clean up data - remove quotes and fix comma issues in CSV
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          // Remove quotes from the beginning and end
          data[key] = data[key].replace(/^"|"$/g, '');
          
          // Fix escaped quotes
          data[key] = data[key].replace(/""/g, '"');
        }
      });
      
      // Parse primary muscles from BodyPart
      const primaryMuscles = data.BodyPart ? 
        data.BodyPart.split(',').map(muscle => muscle.trim()) : 
        [];
      
      // Parse equipment
      const equipment = data.Equipment ? 
        [data.Equipment.trim()] : 
        ['None'];
      
      // Create exercise object with mapped categories
      const exercise = {
        id: data.id || String(results.length + 1),
        name: data.Title,
        description: data.Desc || '',
        type: data.Type || 'Strength',
        primaryMuscles: primaryMuscles,
        equipment: equipment,
        category: data.Kategori || 'Styrke',
        laterality: data.Lateralitet || 'Bilateral',
        instructions: [],
        tips: [],
        videoUrl: '',
        imageUrl: '',
      };
      
      // Map to app-specific categories and types
      exercise.category = mapCategory(exercise.type, primaryMuscles.join(', '), exercise.category);
      exercise.type = mapType(exercise.type, equipment.join(','));
      
      results.push(exercise);
    })
    .on('end', async () => {
      console.log(`Processed ${results.length} exercises from CSV`);
      
      // Check for any issues
      const missingCategoryCount = results.filter(ex => !ex.category).length;
      const missingTypeCount = results.filter(ex => !ex.type).length;
      
      if (missingCategoryCount > 0) {
        console.warn(`Warning: ${missingCategoryCount} exercises have no category`);
      }
      
      if (missingTypeCount > 0) {
        console.warn(`Warning: ${missingTypeCount} exercises have no type`);
      }
      
      // Write to JSON file
      fs.writeFileSync(
        jsonOutputPath,
        JSON.stringify(results, null, 2),
        'utf8'
      );
      console.log(`JSON data written to: ${jsonOutputPath}`);
      
      // Write to TypeScript file
      const tsContent = `// Auto-generated from CSV on ${new Date().toISOString()}
import { Exercise } from '../types/Exercise';

export const importedExercises: Exercise[] = ${JSON.stringify(results, null, 2)};
`;
      
      fs.writeFileSync(tsOutputPath, tsContent, 'utf8');
      console.log(`TypeScript data written to: ${tsOutputPath}`);
      
      // If importToFirebase is enabled, import to Firebase
      if (process.env.IMPORT_TO_FIREBASE === 'true') {
        await importToFirebase(results);
      }
      
      console.log('Process completed successfully!');
    });
}

// Import to Firebase function
async function importToFirebase(exercises) {
  console.log('Initializing Firebase...');
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log(`Importing ${exercises.length} exercises to Firebase...`);
  
  let importedCount = 0;
  let skippedCount = 0;
  
  // Process each exercise
  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    
    // Skip if already exists to avoid duplicates
    const exists = await exerciseExists(db, exercise.name);
    if (exists) {
      skippedCount++;
      if (i % 20 === 0) {
        console.log(`Skipped ${exercise.name} - already exists`);
      }
      continue;
    }
    
    // Add to Firestore
    await addDoc(collection(db, 'exercises'), {
      ...exercise,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    importedCount++;
    
    if (i % 10 === 0) {
      console.log(`Processed ${i + 1}/${exercises.length} exercises (Imported: ${importedCount}, Skipped: ${skippedCount})...`);
    }
  }
  
  console.log(`Import to Firebase completed! Imported: ${importedCount}, Skipped: ${skippedCount}`);
}

// Install csv-parser if not already installed
try {
  require.resolve('csv-parser');
  console.log('csv-parser is already installed. Processing CSV...');
  processCSV();
} catch (e) {
  console.log('csv-parser not found. Installing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install csv-parser', { stdio: 'inherit' });
    console.log('csv-parser installed successfully. Processing CSV...');
    processCSV();
  } catch (err) {
    console.error('Failed to install csv-parser:', err);
    console.log('Please run: npm install csv-parser');
  }
}
