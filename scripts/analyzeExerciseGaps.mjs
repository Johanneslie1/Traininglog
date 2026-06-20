import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseOvelsesCsv, normalizeName } = require('./parseOvelsesCsv.cjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadExistingNames() {
  const names = new Set();

  const resistance = JSON.parse(fs.readFileSync(path.join(root, 'src/data/exercises/resistance.json'), 'utf8'));
  for (const ex of resistance) {
    if (ex?.name) names.add(normalizeName(ex.name));
  }

  const exercisesTs = fs.readFileSync(path.join(root, 'src/data/exercises.ts'), 'utf8');
  for (const match of exercisesTs.matchAll(/name:\s*['"]([^'"]+)['"]/g)) {
    names.add(normalizeName(match[1]));
  }

  const imported = fs.readFileSync(path.join(root, 'src/data/importedExercises.ts'), 'utf8');
  for (const match of imported.matchAll(/"name":\s*"([^"]+)"/g)) {
    names.add(normalizeName(match[1]));
  }

  return names;
}

const csvPath = path.join(root, 'Øvelsesdatabase.csv');
const csvExercises = parseOvelsesCsv(csvPath);
const existingNames = loadExistingNames();

const smithStrength = csvExercises.filter(
  (ex) =>
    ex.type.toLowerCase() === 'strength' &&
    (/smith/i.test(ex.name) || /smith/i.test(ex.equipment))
);

const missingSmith = smithStrength.filter((ex) => !existingNames.has(normalizeName(ex.name)));
const duplicateSmith = smithStrength.filter((ex) => existingNames.has(normalizeName(ex.name)));

console.log('CSV total parsed:', csvExercises.length);
console.log('CSV smith strength:', smithStrength.length);
console.log('Already in app:', duplicateSmith.length);
console.log('Missing smith strength:', missingSmith.length);
console.log('\nMissing examples:');
missingSmith.slice(0, 20).forEach((ex) => console.log(` - ${ex.name}`));
