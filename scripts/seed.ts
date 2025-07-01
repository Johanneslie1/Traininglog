import { Exercise } from '../src/types/exercise';
import fs from 'fs/promises';
import path from 'path';

const seedExercises = async (): Promise<void> => {
  try {
    const exercises: Exercise[] = []; // Add your exercise data here
    const outputPath = path.join(__dirname, '../src/data/exercises.json');
    await fs.writeFile(outputPath, JSON.stringify(exercises, null, 2));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error seeding database:', errorMessage);
    throw error;
  }
};

console.log('Starting to seed exercise database...');
seedExercises()
  .then(() => {
    console.log('Successfully seeded exercise database!');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Error seeding database:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
