const fs = require('fs');
const path = require('path');

const distAssetsDir = path.join(process.cwd(), 'dist', 'assets');

if (!fs.existsSync(distAssetsDir)) {
  console.error('Bundle budget check failed: dist/assets not found. Run `npm run build` first.');
  process.exit(1);
}

const bytesToKb = (bytes) => bytes / 1024;
const formatKb = (bytes) => `${bytesToKb(bytes).toFixed(2)} KB`;

const jsFiles = fs
  .readdirSync(distAssetsDir)
  .filter((file) => file.endsWith('.js'));

const fileStats = jsFiles.map((file) => {
  const fullPath = path.join(distAssetsDir, file);
  const stats = fs.statSync(fullPath);
  return {
    file,
    size: stats.size,
  };
});

const budget = {
  maxAnyChunkKb: 380,
  maxIndexChunkKb: 190,
  namedChunkMaxKb: {
    'firebase-firestore-vendor': 330,
    'firebase-core-vendor': 220,
    'exercise-data-legacy': 360,
    'exercise-data-activities': 240,
    'exercise-db-core': 100,
    'CreateUniversalExerciseDialog': 60,
  },
};

const violations = [];

for (const stat of fileStats) {
  const sizeKb = bytesToKb(stat.size);
  if (sizeKb > budget.maxAnyChunkKb) {
    violations.push(
      `${stat.file} is ${sizeKb.toFixed(2)} KB (max allowed for any chunk: ${budget.maxAnyChunkKb} KB)`
    );
  }
}

const indexChunk = fileStats.find((stat) => stat.file.startsWith('index-'));
if (!indexChunk) {
  violations.push('Could not find index-*.js chunk in dist/assets.');
} else {
  const indexKb = bytesToKb(indexChunk.size);
  if (indexKb > budget.maxIndexChunkKb) {
    violations.push(
      `${indexChunk.file} is ${indexKb.toFixed(2)} KB (max allowed for index chunk: ${budget.maxIndexChunkKb} KB)`
    );
  }
}

for (const [prefix, maxKb] of Object.entries(budget.namedChunkMaxKb)) {
  const match = fileStats.find((stat) => stat.file.startsWith(`${prefix}-`));
  if (!match) {
    continue;
  }

  const sizeKb = bytesToKb(match.size);
  if (sizeKb > maxKb) {
    violations.push(
      `${match.file} is ${sizeKb.toFixed(2)} KB (max allowed for ${prefix}: ${maxKb} KB)`
    );
  }
}

const sortedBySize = [...fileStats].sort((a, b) => b.size - a.size);
console.log('Top 10 JS chunks by size:');
for (const stat of sortedBySize.slice(0, 10)) {
  console.log(`- ${stat.file}: ${formatKb(stat.size)}`);
}

if (violations.length > 0) {
  console.error('\nBundle budget check failed with the following violations:');
  violations.forEach((violation) => console.error(`- ${violation}`));
  process.exit(1);
}

console.log('\nBundle budget check passed.');
