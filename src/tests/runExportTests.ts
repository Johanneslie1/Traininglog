// Export Test Runner Script
// This script provides utilities for running export-related tests

export const exportTestFiles = [
  'src/tests/exportTransformation.test.ts',
  'src/tests/exportService.integration.test.ts',
  'src/tests/ExportButtons.test.tsx',
  'src/tests/exportE2E.test.ts',
  'src/tests/exportPerformance.test.ts',
  'src/tests/exportErrorScenarios.test.ts',
  'src/tests/exportIntegrationSuite.test.ts'
];

export const testCategories = {
  unit: ['src/tests/exportTransformation.test.ts'],
  integration: ['src/tests/exportService.integration.test.ts'],
  component: ['src/tests/ExportButtons.test.tsx'],
  e2e: ['src/tests/exportE2E.test.ts'],
  performance: ['src/tests/exportPerformance.test.ts'],
  error: ['src/tests/exportErrorScenarios.test.ts'],
  all: exportTestFiles
};

// Test configuration for coverage and reporting
export const testConfig = {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/test/',
      '**/*.d.ts',
      '**/*.config.*',
      'coverage/',
      'dist/'
    ],
    thresholds: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  },
  reporters: ['verbose', 'json'],
  outputFile: {
    json: './test-results.json'
  }
};

// Utility functions for test execution
export function getTestCommand(testType: keyof typeof testCategories = 'all'): string {
  const files = testCategories[testType];
  const fileArgs = files.map(file => `"${file}"`).join(' ');

  return `vitest run ${fileArgs} --coverage`;
}

export function getCoverageCommand(): string {
  return 'vitest run --coverage --reporter=verbose';
}

// Console output helpers
export function printTestSummary() {
  console.log('🚀 Export Functionality Test Suite');
  console.log('=====================================');
  console.log('');
  console.log('Available test categories:');
  console.log('• unit        - Unit tests for transformation functions');
  console.log('• integration - Integration tests for export service');
  console.log('• component   - Component tests for UI elements');
  console.log('• e2e         - End-to-end tests for complete export flow');
  console.log('• performance - Performance tests with large datasets');
  console.log('• error       - Error scenario and edge case tests');
  console.log('• all         - Run all export tests (default)');
  console.log('');
  console.log('Usage:');
  console.log('npm run test:export [category]');
  console.log('npm run test:export:coverage');
  console.log('');
}

export function printTestFiles() {
  console.log('📁 Test Files:');
  exportTestFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  console.log('');
}

// Main execution for development
if (typeof process !== 'undefined' && process.argv) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'summary':
      printTestSummary();
      break;
    case 'files':
      printTestFiles();
      break;
    case 'config':
      console.log('🔧 Test Configuration:');
      console.log(JSON.stringify(testConfig, null, 2));
      break;
    default:
      printTestSummary();
      printTestFiles();
  }
}
