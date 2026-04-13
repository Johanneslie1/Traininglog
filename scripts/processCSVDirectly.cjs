const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

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

// Process CSV directly from content
function processCSV() {
  try {
    console.log(`Reading CSV file: ${csvFilePath}`);
    
    // Read CSV content
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    
    // Split the content by lines and process manually
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    const results = [];
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Parse CSV line manually
      const values = [];
      let inQuote = false;
      let currentValue = '';
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Don't forget the last value
      values.push(currentValue);
      
      // Create a data object from headers and values
      const data = {};
      for (let j = 0; j < headers.length && j < values.length; j++) {
        // Clean up the header name
        const header = headers[j].replace(/^"|"$/g, '').trim();
        data[header] = values[j].replace(/^"|"$/g, '').trim();
      }
      
      // Skip if title is empty or missing
      if (!data.Title) continue;
      
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
        id: data['Unnamed: 0'] || String(results.length + 1),
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
    }
    
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
    
    console.log('Process completed successfully!');
    
    return results;
  } catch (error) {
    console.error('Error processing CSV:', error);
    return [];
  }
}

// Execute the function
processCSV();
