import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Path to the imported exercises file
const filePath = path.resolve('./src/data/importedExercises.ts');

// Read the file
let content = readFileSync(filePath, 'utf-8');

// Define the replacements for muscle group names
const muscleReplacements = [
  { from: '"Quadriceps"', to: '"quadriceps"' },
  { from: '"Shoulders"', to: '"shoulders"' },
  { from: '"Triceps"', to: '"triceps"' },
  { from: '"Full Body"', to: '"full_body"' },
  { from: '"Abdominals"', to: '"core"' },
  { from: '"Adductors"', to: '"quadriceps"' },
  { from: '"Abductors"', to: '"glutes"' },
  { from: '"Biceps"', to: '"biceps"' },
  { from: '"Calves"', to: '"calves"' },
  { from: '"Chest"', to: '"chest"' },
  { from: '"Forearms"', to: '"forearms"' },
  { from: '"Glutes"', to: '"glutes"' },
  { from: '"Hamstrings"', to: '"hamstrings"' },
  { from: '"Lats"', to: '"lats"' },
  { from: '"Lower Back"', to: '"lower_back"' },
  { from: '"Middle Back"', to: '"back"' },
  { from: '"Neck"', to: '"shoulders"' },
  { from: '"Traps"', to: '"traps"' }
];

// Apply all muscle group replacements
muscleReplacements.forEach(replacement => {
  const regex = new RegExp(replacement.from, 'g');
  content = content.replace(regex, replacement.to);
});

// Remove the "laterality" property which is not part of the Exercise type
content = content.replace(/,\s*"laterality":\s*"[^"]*"/g, '');

// Add missing required properties
// Parse the content to get the exercise objects
const exerciseStartRegex = /\{\s*"id":/g;
const matches = [...content.matchAll(exerciseStartRegex)];

// Process from the end to not mess up indices
for (let i = matches.length - 1; i >= 0; i--) {
  const startIdx = matches[i].index;
  // Find the end of this exercise object
  let braceCount = 1;
  let endIdx = startIdx + 1;
  
  while (braceCount > 0 && endIdx < content.length) {
    if (content[endIdx] === '{') braceCount++;
    if (content[endIdx] === '}') braceCount--;
    endIdx++;
  }
  
  const exerciseStr = content.substring(startIdx, endIdx);
  
  // Check for missing required properties and add them
  if (!exerciseStr.includes('"defaultUnit"')) {
    const insertPos = endIdx - 1; // Just before closing brace
    const defaultUnit = ',\n    "defaultUnit": "kg"';
    content = content.substring(0, insertPos) + defaultUnit + content.substring(insertPos);
  }
  
  if (!exerciseStr.includes('"metrics"')) {
    const insertPos = endIdx - 1; // Just before closing brace
    const metrics = ',\n    "metrics": {\n      "trackWeight": true,\n      "trackReps": true\n    }';
    content = content.substring(0, insertPos) + metrics + content.substring(insertPos);
  }
  
  if (!exerciseStr.includes('"secondaryMuscles"')) {
    // Find where to insert after primaryMuscles
    const primaryMusclesEndIdx = exerciseStr.indexOf(']', exerciseStr.indexOf('"primaryMuscles"'));
    if (primaryMusclesEndIdx !== -1) {
      const insertPos = startIdx + primaryMusclesEndIdx + 1;
      const secondaryMuscles = ',\n    "secondaryMuscles": []';
      content = content.substring(0, insertPos) + secondaryMuscles + content.substring(insertPos);
    }
  }
  
  // Add empty instructions array if missing
  if (!exerciseStr.includes('"instructions"')) {
    const insertPos = endIdx - 1; // Just before closing brace
    const instructions = ',\n    "instructions": []';
    content = content.substring(0, insertPos) + instructions + content.substring(insertPos);
  }
}

// Write the updated content back to the file
writeFileSync(filePath, content, 'utf-8');

console.log('✅ Successfully updated muscle group names and fixed missing properties in importedExercises.ts');
