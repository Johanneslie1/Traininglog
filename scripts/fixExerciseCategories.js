import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Path to the exercises file
const filePath = path.resolve('./src/data/exercises.ts');

// Read the file
let content = readFileSync(filePath, 'utf-8');

// Find all exercise objects missing category
const exerciseObjects = [
  { name: 'Deadlift', category: 'compound' },
  { name: 'Leg Press', category: 'compound' },
  { name: 'Romanian Deadlift', category: 'compound' },
  { name: 'Bulgarian Split Squat', category: 'compound' },
  { name: 'Walking Lunges', category: 'compound' },
  { name: 'Calf Raises', category: 'isolation' },
  { name: 'Overhead Press', category: 'compound' },
  { name: 'Lateral Raises', category: 'isolation' },
  { name: 'Face Pulls', category: 'isolation' },
  { name: 'Arnold Press', category: 'compound' },
  { name: 'Front Raise', category: 'isolation' },
  { name: 'Bicep Curls', category: 'isolation' },
  { name: 'Tricep Extensions', category: 'isolation' },
  { name: 'Hammer Curls', category: 'isolation' },
  { name: 'Diamond Push-Ups', category: 'isolation' },
  { name: 'Chin-Ups', category: 'compound' },
  { name: 'Plank', category: 'isolation' },
  { name: 'Crunches', category: 'isolation' },
  { name: 'Russian Twists', category: 'isolation' },
  { name: 'Dead Bug', category: 'isolation' },
  { name: 'Bird Dog', category: 'isolation' },
  { name: 'Pallof Press', category: 'isolation' }
];

// Add category field to each exercise
exerciseObjects.forEach(obj => {
  const searchStr = `name: '${obj.name}',\\n    description:`;
  const replaceStr = `name: '${obj.name}',\\n    description:`;
  
  const typeStr = `type: 'strength',\\n    primaryMuscles:`;
  const typeBodyweightStr = `type: 'bodyweight',\\n    primaryMuscles:`;
  
  // Replace the type line to include category
  const newTypeStr = `type: 'strength',\\n    category: '${obj.category}',\\n    primaryMuscles:`;
  const newTypeBodyweightStr = `type: 'bodyweight',\\n    category: '${obj.category}',\\n    primaryMuscles:`;
  
  // Update strength exercises
  content = content.replace(
    new RegExp(`name: '${obj.name}',[\\s\\S]*?type: 'strength',[\\s\\S]*?primaryMuscles:`, 'g'),
    `name: '${obj.name}',\\n    description: .*?\\n    type: 'strength',\\n    category: '${obj.category}',\\n    primaryMuscles:`
  );
  
  // Update bodyweight exercises
  content = content.replace(
    new RegExp(`name: '${obj.name}',[\\s\\S]*?type: 'bodyweight',[\\s\\S]*?primaryMuscles:`, 'g'),
    `name: '${obj.name}',\\n    description: .*?\\n    type: 'bodyweight',\\n    category: '${obj.category}',\\n    primaryMuscles:`
  );
});

// Write the updated content back to the file
writeFileSync(filePath, content, 'utf-8');

console.log('✅ Successfully added missing category fields to all exercises');
