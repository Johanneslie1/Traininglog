import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Firebase services
vi.mock('@/services/firebase/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn()
}));

// Mock Firebase configuration
vi.mock('@/services/firebase/config', () => ({
  db: {},
  auth: {},
  storage: {}
}));

beforeAll(() => {
  // Initialize any necessary test environment setup here
});

beforeEach(() => {
  // Reset mocks and clean up DOM
  vi.clearAllMocks();
  cleanup();
});

afterAll(() => {
  // Clean up after all tests are done
  vi.clearAllMocks();
});