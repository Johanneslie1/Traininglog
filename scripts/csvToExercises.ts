import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

// Define your Exercise type (adjust as needed)
interface Exercise {
  name: string;
  description: string;
  type: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  instructions: string[];
  tips: string[];
  defaultUnit: string;
  metrics: {
    trackWeight?: boolean;
    trackReps?: boolean;
    trackTime?: boolean;
    trackDistance?: boolean;
    trackRPE?: boolean;
  };
}

// Helper to guess defaultUnit and metrics
function getDefaults(type: string, equipment: string): { defaultUnit: string, metrics: any } {
  if (type.toLowerCase().includes('cardio')) {
    return { defaultUnit: 'time', metrics: { trackTime: true, trackDistance: true, trackRPE: true } };
  }
  if (equipment.toLowerCase().includes('barbell') || equipment.toLowerCase().includes('dumbbell') || equipment.toLowerCase().includes('kettlebell') || equipment.toLowerCase().includes('machine')) {
    return { defaultUnit: 'kg', metrics: { trackWeight: true, trackReps: true, trackRPE: true } };
  }
  if (equipment.toLowerCase().includes('body') || equipment.toLowerCase().includes('none')) {
    return { defaultUnit: 'reps', metrics: { trackReps: true, trackRPE: true } };
  }
  return { defaultUnit: 'reps', metrics: { trackReps: true } };
}

const results: Exercise[] = [];

fs.createReadStream(path.join(__dirname, '../../Øvelsesdatabase.csv'))
  .pipe(csv({ separator: ',', skipLines: 0 }))
  .on('data', (row) => {
    const name = row['Title']?.trim() || '';
    const description = row['Desc']?.trim() || '';
    const type = row['Type']?.trim() || 'strength';
    const category = row['Kategori']?.trim() || 'compound';
    const primaryMuscles = row['BodyPart'] ? row['BodyPart'].split(',').map((m: string) => m.trim()) : [];
    const equipment = row['Equipment'] ? row['Equipment'].split(',').map((e: string) => e.trim()) : [];
    const { defaultUnit, metrics } = getDefaults(type, equipment.join(','));

    const exercise: Exercise = {
      name,
      description,
      type,
      category,
      primaryMuscles,
      secondaryMuscles: [],
      equipment,
      instructions: [],
      tips: [],
      defaultUnit,
      metrics
    };
    results.push(exercise);
  })
  .on('end', () => {
    fs.writeFileSync(
      path.join(__dirname, '../../src/data/generatedExercises.json'),
      JSON.stringify(results, null, 2),
      'utf-8'
    );
    console.log('Done! Exported', results.length, 'exercises to generatedExercises.json');
  });
