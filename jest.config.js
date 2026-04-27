export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/tests/navigation.backButtons.test.tsx',
    '/src/tests/SideMenu.test.tsx',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/services/firebase/config$': '<rootDir>/src/tests/mocks/firebase.ts',
    '^@/services/firebase/firebase$': '<rootDir>/src/tests/mocks/firebase.ts',
    '^\\./firebase$': '<rootDir>/src/tests/mocks/firebase.ts',
    '^\\./firebase/firebase$': '<rootDir>/src/tests/mocks/firebase.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};