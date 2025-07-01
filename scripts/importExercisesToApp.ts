import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Load your JSON file
const raw = fs.readFileSync('c:/Users/johan/Downloads/csvjson.json', 'utf-8');
const data = JSON.parse(raw);

// Helper to guess type/category/unit from fields
function guessType(type: string) {
  if (!type) return 'strength';
  const t = type.toLowerCase();
  if (t.includes('cardio')) return 'cardio';
  if (t.includes('bodyweight')) return 'bodyweight';
  if (t.includes('stretch')) return 'stretching';
  return 'strength';
}
function guessCategory(bodyPart: string) {
  if (!bodyPart) return 'compound';
  const b = bodyPart.toLowerCase();
  if (b.includes('abdom')) return 'core';
  if (b.includes('chest')) return 'compound';
  if (b.includes('back')) return 'compound';
  if (b.includes('leg') || b.includes('quad') || b.includes('hamstring') || b.includes('glute') || b.includes('calf')) return 'compound';
  if (b.includes('shoulder')) return 'compound';
  if (b.includes('arm') || b.includes('bicep') || b.includes('tricep') || b.includes('forearm')) return 'isolation';
  return 'compound';
}
function guessDefaultUnit(equipment: string) {
  if (!equipment) return 'reps';
  const e = equipment.toLowerCase();
  if (e.includes('barbell') || e.includes('dumbbell') || e.includes('machine') || e.includes('bands')) return 'kg';
  if (e.includes('bodyweight')) return 'reps';
  return 'reps';
}

const exercises = data.map((ex: any) => ({
  id: uuidv4(),
  name: ex.Title,
  description: ex.Desc,
  type: guessType(ex.Type),
  category: guessCategory(ex.BodyPart),
  primaryMuscles: [ex.BodyPart?.toLowerCase() || 'other'],
  secondaryMuscles: [],
  equipment: [ex.Equipment?.toLowerCase() || 'bodyweight'],
  instructions: [],
  defaultUnit: guessDefaultUnit(ex.Equipment),
  metrics: { trackReps: true },
}));

// Overwrite the main exercise database file
fs.writeFileSync('src/data/exercises.json', JSON.stringify(exercises, null, 2));
console.log('Exercise database replaced with', exercises.length, 'exercises!');
