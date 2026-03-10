const fs = require('fs');
const path = require('path');

const root = process.cwd();
const tsPath = path.join(root, 'src', 'data', 'exercises.ts');
const jsonPath = path.join(root, 'src', 'data', 'exercises', 'resistance.json');

const tsContent = fs.readFileSync(tsPath, 'utf8');
const jsonContent = fs.readFileSync(jsonPath, 'utf8');
const jsonExercises = JSON.parse(jsonContent);

const tsNamePattern = /name:\s*['"]([^'"]+)['"]/g;
const tsNames = new Set();
let match;
while ((match = tsNamePattern.exec(tsContent)) !== null) {
  tsNames.add(match[1]);
}

const jsonNames = new Set(jsonExercises.map((exercise) => exercise.name));

const tsOnly = [...tsNames].filter((name) => !jsonNames.has(name)).sort();
const jsonOnly = [...jsonNames].filter((name) => !tsNames.has(name)).sort();

if (tsOnly.length === 0 && jsonOnly.length === 0) {
  console.log(`Resistance parity OK (count: ${tsNames.size})`);
  process.exit(0);
}

console.error('Resistance parity FAILED');
console.error(`TS names: ${tsNames.size} | JSON names: ${jsonNames.size}`);

if (tsOnly.length > 0) {
  console.error(`\nOnly in src/data/exercises.ts (${tsOnly.length}):`);
  tsOnly.forEach((name) => console.error(`- ${name}`));
}

if (jsonOnly.length > 0) {
  console.error(`\nOnly in src/data/exercises/resistance.json (${jsonOnly.length}):`);
  jsonOnly.forEach((name) => console.error(`- ${name}`));
}

process.exit(1);
