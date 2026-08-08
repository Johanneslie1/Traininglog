const fs = require('fs');
const path = require('path');
const { parseOvelsesCsv, normalizeName } = require('./parseOvelsesCsv.cjs');

const root = path.join(__dirname, '..');

function dedupeExercises(exercises) {
  const deduped = [];
  const byId = new Set();
  const byNameAndType = new Set();

  for (const exercise of exercises) {
    if (!exercise?.name) continue;

    const nameLower = normalizeName(exercise.name);
    const activityType = exercise.activityType || 'resistance';
    const nameKey = `${activityType}::${nameLower}`;

    if (exercise.id && byId.has(exercise.id)) continue;
    if (byNameAndType.has(nameKey)) continue;

    if (exercise.id) byId.add(exercise.id);
    byNameAndType.add(nameKey);
    deduped.push(exercise);
  }

  return deduped;
}

function loadImportedExercises() {
  const partsDir = path.join(root, 'src/data/generatedExercises');
  const partFiles = fs
    .readdirSync(partsDir)
    .filter((file) => /^part\d+\.json$/.test(file))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

  return partFiles.flatMap((file) => JSON.parse(fs.readFileSync(path.join(partsDir, file), 'utf8')));
}

function loadCuratedNames() {
  const resistance = JSON.parse(fs.readFileSync(path.join(root, 'src/data/exercises/resistance.json'), 'utf8'));
  const exercisesTs = fs.readFileSync(path.join(root, 'src/data/exercises.ts'), 'utf8');
  const imported = loadImportedExercises();

  const curated = [];
  for (const match of exercisesTs.matchAll(/name:\s*['"]([^'"]+)['"]/g)) {
    curated.push({ name: match[1], source: 'exercises.ts' });
  }
  for (const exercise of resistance) {
    curated.push({ name: exercise.name, source: 'resistance.json', id: exercise.id });
  }

  const merged = dedupeExercises(
    curated.map((item) => ({ id: item.id, name: item.name, activityType: 'resistance' }))
  );

  return {
    curatedCount: merged.length,
    curatedNames: new Set(merged.map((item) => normalizeName(item.name))),
    importedCount: imported.length,
  };
}

function simulateAppLoad() {
  const resistance = JSON.parse(fs.readFileSync(path.join(root, 'src/data/exercises/resistance.json'), 'utf8'));
  const imported = loadImportedExercises();
  const exercisesTs = fs.readFileSync(path.join(root, 'src/data/exercises.ts'), 'utf8');

  const curatedFromTs = [];
  for (const match of exercisesTs.matchAll(/name:\s*['"]([^'"]+)['"]/g)) {
    curatedFromTs.push({ name: match[1], activityType: 'resistance', source: 'exercises.ts' });
  }

  const all = [
    ...curatedFromTs,
    ...resistance.map((exercise) => ({ ...exercise, activityType: exercise.activityType || 'resistance', source: 'resistance.json' })),
    ...imported.map((exercise) => ({ ...exercise, activityType: exercise.activityType || 'resistance', source: 'generatedExercises' })),
  ];

  const deduped = dedupeExercises(all);
  const importedNames = new Set(imported.map((exercise) => normalizeName(exercise.name)));
  const loadedImported = deduped.filter((exercise) => importedNames.has(normalizeName(exercise.name)));
  const smithLoaded = deduped.filter((exercise) => /smith/i.test(exercise.name));

  return {
    importedFileCount: imported.length,
    totalLoadedResistance: deduped.length,
    loadedFromImportFile: loadedImported.length,
    missingFromImportFile: imported.length - loadedImported.length,
    smithLoaded: smithLoaded.length,
  };
}

const csvExercises = parseOvelsesCsv(path.join(root, 'Øvelsesdatabase.csv'));
const { curatedCount, curatedNames } = loadCuratedNames();
const app = simulateAppLoad();

console.log('=== Exercise availability report ===');
console.log(`CSV unique exercises: ${csvExercises.length}`);
console.log(`Curated (exercises.ts + resistance.json, deduped): ${curatedCount}`);
console.log(`Imported file (generatedExercises parts): ${app.importedFileCount}`);
console.log(`Total resistance exercises loaded in app logic: ${app.totalLoadedResistance}`);
console.log(`Imported exercises present after runtime merge/dedupe: ${app.loadedFromImportFile}/${app.importedFileCount}`);
console.log(`Imported exercises dropped at runtime: ${app.missingFromImportFile}`);
console.log(`Smith machine exercises available in app: ${app.smithLoaded}`);

if (app.missingFromImportFile > 0) {
  const imported = loadImportedExercises();
  const resistance = JSON.parse(fs.readFileSync(path.join(root, 'src/data/exercises/resistance.json'), 'utf8'));
  const exercisesTs = fs.readFileSync(path.join(root, 'src/data/exercises.ts'), 'utf8');
  const curatedFromTs = [];
  for (const match of exercisesTs.matchAll(/name:\s*['"]([^'"]+)['"]/g)) {
    curatedFromTs.push({ name: match[1], activityType: 'resistance' });
  }
  const all = [
    ...curatedFromTs,
    ...resistance.map((exercise) => ({ ...exercise, activityType: 'resistance' })),
    ...imported.map((exercise) => ({ ...exercise, activityType: 'resistance' })),
  ];
  const deduped = dedupeExercises(all);
  const loadedNames = new Set(deduped.map((exercise) => normalizeName(exercise.name)));
  const dropped = imported.filter((exercise) => !loadedNames.has(normalizeName(exercise.name)));
  console.log('\nDropped imported exercises (name collision with curated datasets):');
  dropped.slice(0, 20).forEach((exercise) => console.log(` - ${exercise.name}`));
  if (dropped.length > 20) console.log(` ... and ${dropped.length - 20} more`);
}
