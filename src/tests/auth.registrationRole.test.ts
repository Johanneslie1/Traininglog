import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { registerUser } from '@/services/firebase/auth';

const mockCreateUserWithEmailAndPassword = jest.fn();
const mockDoc = jest.fn();
const mockSetDoc = jest.fn();

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => {
  class MockTimestamp {
    static now = jest.fn(() => new MockTimestamp());

    toDate(): Date {
      return new Date('2026-01-01T00:00:00.000Z');
    }
  }

  return {
    doc: (...args: unknown[]) => mockDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    getDoc: jest.fn(),
    Timestamp: MockTimestamp,
  };
});

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('registerUser', () => {
  beforeEach(() => {
    mockCreateUserWithEmailAndPassword.mockReset();
    mockDoc.mockReset();
    mockSetDoc.mockReset();

    mockCreateUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'new-user-id' },
    } as never);
    mockDoc.mockReturnValue('user-doc-ref' as never);
  });

  it('always creates new users as athletes', async () => {
    const user = await registerUser({
      email: 'new@example.com',
      password: 'secret123',
      firstName: 'New',
      lastName: 'User',
    });

    expect(user.role).toBe('athlete');
    expect(mockSetDoc).toHaveBeenCalledWith(
      'user-doc-ref',
      expect.objectContaining({
        id: 'new-user-id',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'athlete',
      })
    );
  });
});
