/**
 * Build script for GitHub Pages deployment.
 * Sets VITE_BASE_PATH=/Traininglog/ before running the standard build.
 * Run via: npm run build:gh-pages
 */
import { execSync } from 'child_process';

process.env.VITE_BASE_PATH = '/Traininglog/';

execSync('npm run build', {
  stdio: 'inherit',
  env: process.env,
});
