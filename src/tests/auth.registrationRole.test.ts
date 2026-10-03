import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { loginUser, registerUser } from '@/services/firebase/auth';

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

  it('replaces raw Firebase auth errors with a readable message', async () => {
    mockCreateUserWithEmailAndPassword.mockRejectedValue({
      code: 'auth/email-already-in-use',
      message: 'Firebase: Error (auth/email-already-in-use).',
    } as never);

    await expect(registerUser({
      email: 'new@example.com',
      password: 'secret123',
      firstName: 'New',
      lastName: 'User',
    })).rejects.toThrow('An account with this email already exists.');
  });
});

describe('loginUser', () => {
  const signInMock = signInWithEmailAndPassword as unknown as jest.Mock;
  const getDocMock = getDoc as unknown as jest.Mock;

  beforeEach(() => {
    signInMock.mockReset();
    getDocMock.mockReset();
  });

  it('continues as an athlete when the Firestore profile is missing', async () => {
    signInMock.mockResolvedValue({
      user: { uid: 'existing-user', email: 'athlete@example.com' },
    } as never);
    getDocMock.mockResolvedValue({ exists: () => false } as never);

    const user = await loginUser({
      email: 'athlete@example.com',
      password: 'secret123',
    });

    expect(user).toEqual(expect.objectContaining({
      id: 'existing-user',
      email: 'athlete@example.com',
      role: 'athlete',
      firstName: '',
      lastName: '',
    }));
  });

  it('does not show the raw Firebase credential error', async () => {
    signInMock.mockRejectedValue({
      code: 'auth/invalid-credential',
      message: 'Firebase: Error (auth/invalid-credential).',
    } as never);

    await expect(loginUser({
      email: 'athlete@example.com',
      password: 'wrong-password',
    })).rejects.toThrow('Email or password is incorrect.');
  });
});
