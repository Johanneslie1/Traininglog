/**
 * Build script for GitHub Pages deployment.
 * Sets VITE_BASE_PATH=/Traininglog/ before running the standard build.
 * Run via: npm run build:gh-pages
 */
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

process.env.VITE_BASE_PATH = '/Traininglog/';

execSync('npm run build', {
  stdio: 'inherit',
  env: process.env,
});

// gh-pages branch contains prebuilt static files only. Add a Vercel config
// into dist so accidental Vercel deployments of that branch do not attempt a
// Vite build (which fails because there is no package.json there).
writeFileSync(
  'dist/vercel.json',
  JSON.stringify(
    {
      framework: null,
      installCommand: "echo 'No install step for prebuilt static output'",
      buildCommand: "echo 'No build step for prebuilt static output'",
      outputDirectory: '.',
    },
    null,
    2
  )
);
