const fs = require('fs');
const path = require('path');
const { parseOvelsesCsv, normalizeName } = require('./parseOvelsesCsv.cjs');

const csvFilePath = path.join(__dirname, '../Øvelsesdatabase.csv');
const jsonPartsDir = path.join(__dirname, '../src/data/generatedExercises');
const legacyJsonOutputPath = path.join(__dirname, '../src/data/generatedExercises.json');
const tsOutputPath = path.join(__dirname, '../src/data/importedExercises.ts');
const manifestPath = path.join(__dirname, '../docs/imported-exercises-manifest.json');
const listPath = path.join(__dirname, '../docs/newly-imported-exercises.txt');
const IMPORTED_PART_COUNT = 5;

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

  // Write compact shards so each Vite chunk stays under the bundle budget.
  fs.mkdirSync(jsonPartsDir, { recursive: true });
  const partSize = Math.ceil(results.length / IMPORTED_PART_COUNT);
  const partImports = [];

  for (let partIndex = 0; partIndex < IMPORTED_PART_COUNT; partIndex += 1) {
    const part = results.slice(partIndex * partSize, (partIndex + 1) * partSize);
    const partPath = path.join(jsonPartsDir, `part${partIndex}.json`);
    fs.writeFileSync(partPath, JSON.stringify(part), 'utf8');
    partImports.push(`import part${partIndex} from './generatedExercises/part${partIndex}.json';`);
    console.log(`JSON part written to: ${partPath} (${part.length} exercises)`);
  }

  if (fs.existsSync(legacyJsonOutputPath)) {
    fs.unlinkSync(legacyJsonOutputPath);
    console.log(`Removed legacy monolith: ${legacyJsonOutputPath}`);
  }

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
        partCount: IMPORTED_PART_COUNT,
        skippedDuplicates: skipped.map((exercise) => exercise.name).sort((a, b) => a.localeCompare(b)),
        importedExercises: sortedNames,
      },
      null,
      2
    ),
    'utf8'
  );
  console.log(`Manifest written to: ${manifestPath}`);

  const spreadLines = Array.from(
    { length: IMPORTED_PART_COUNT },
    (_, index) => `  ...(part${index} as Exercise[]),`
  ).join('\n');

  const tsContent = `// Auto-generated wrapper — run \`npm run import-exercises\` to refresh generatedExercises parts
import { Exercise } from '../types/exercise';
${partImports.join('\n')}

export const importedExercises: Exercise[] = [
${spreadLines}
];
`;

  fs.writeFileSync(tsOutputPath, tsContent, 'utf8');
  console.log(`TypeScript wrapper written to: ${tsOutputPath}`);
  console.log('Process completed successfully!');
}

processCSV();
