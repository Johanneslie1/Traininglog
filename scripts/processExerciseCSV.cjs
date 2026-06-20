const fs = require('fs');
const path = require('path');
const { parseOvelsesCsv, normalizeName } = require('./parseOvelsesCsv.cjs');

const csvFilePath = path.join(__dirname, '../Øvelsesdatabase.csv');
const jsonOutputPath = path.join(__dirname, '../src/data/generatedExercises.json');
const tsOutputPath = path.join(__dirname, '../src/data/importedExercises.ts');
const manifestPath = path.join(__dirname, '../docs/imported-exercises-manifest.json');
const listPath = path.join(__dirname, '../docs/newly-imported-exercises.txt');

function loadExistingNames() {
  const names = new Set();

  const resistancePath = path.join(__dirname, '../src/data/exercises/resistance.json');
  if (fs.existsSync(resistancePath)) {
    const resistance = JSON.parse(fs.readFileSync(resistancePath, 'utf8'));
    for (const exercise of resistance) {
      if (exercise?.name) names.add(normalizeName(exercise.name));
    }
  }

  const exercisesTsPath = path.join(__dirname, '../src/data/exercises.ts');
  if (fs.existsSync(exercisesTsPath)) {
    const exercisesTs = fs.readFileSync(exercisesTsPath, 'utf8');
    for (const match of exercisesTs.matchAll(/name:\s*['"]([^'"]+)['"]/g)) {
      names.add(normalizeName(match[1]));
    }
  }

  return names;
}

function processCSV() {
  console.log(`Reading CSV file: ${csvFilePath}`);

  const parsed = parseOvelsesCsv(csvFilePath);
  const existingNames = loadExistingNames();
  const skipped = parsed.filter((exercise) => existingNames.has(normalizeName(exercise.name)));
  const results = parsed.filter((exercise) => !existingNames.has(normalizeName(exercise.name)));

  console.log(`Parsed ${parsed.length} unique exercises from CSV`);
  console.log(`Skipped ${skipped.length} duplicates already present in curated datasets`);
  console.log(`Exporting ${results.length} new exercises`);

  const smithCount = results.filter((exercise) => /smith/i.test(exercise.name)).length;
  console.log(`Including ${smithCount} smith machine exercises`);

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

  fs.writeFileSync(jsonOutputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`JSON data written to: ${jsonOutputPath}`);

  const sortedNames = results.map((exercise) => exercise.name).sort((a, b) => a.localeCompare(b));
  fs.writeFileSync(listPath, sortedNames.join('\n'), 'utf8');
  console.log(`Exercise list written to: ${listPath}`);

  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        csvUniqueCount: parsed.length,
        importedCount: results.length,
        skippedDuplicateCount: skipped.length,
        smithMachineCount: smithCount,
        skippedDuplicates: skipped.map((exercise) => exercise.name).sort((a, b) => a.localeCompare(b)),
        importedExercises: sortedNames,
      },
      null,
      2
    ),
    'utf8'
  );
  console.log(`Manifest written to: ${manifestPath}`);

  const tsContent = `// Auto-generated wrapper — run \`npm run import-exercises\` to refresh generatedExercises.json
import { Exercise } from '../types/exercise';
import generatedExercises from './generatedExercises.json';

export const importedExercises: Exercise[] = generatedExercises as Exercise[];
`;

  fs.writeFileSync(tsOutputPath, tsContent, 'utf8');
  console.log(`TypeScript wrapper written to: ${tsOutputPath}`);
  console.log('Process completed successfully!');
}

processCSV();
