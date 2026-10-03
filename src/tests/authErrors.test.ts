import { getFirebaseAuthErrorMessage } from '@/utils/authErrors';

describe('getFirebaseAuthErrorMessage', () => {
  it('maps credential failures to a plain message', () => {
    expect(getFirebaseAuthErrorMessage(
      { code: 'auth/invalid-credential', message: 'Firebase: Error (auth/invalid-credential).' },
      'Unable to sign in. Please try again.'
    )).toBe('Email or password is incorrect.');
  });

  it('maps duplicate accounts and weak passwords separately', () => {
    expect(getFirebaseAuthErrorMessage(
      { code: 'auth/email-already-in-use' },
      'Unable to create your account. Please try again.'
    )).toBe('An account with this email already exists.');

    expect(getFirebaseAuthErrorMessage(
      { code: 'auth/weak-password' },
      'Unable to create your account. Please try again.'
    )).toBe('Password must be at least 6 characters.');
  });

  it('uses the fallback for unknown errors instead of raw Firebase text', () => {
    expect(getFirebaseAuthErrorMessage(
      new Error('Firebase: Error (auth/internal-error).'),
      'Unable to sign in. Please try again.'
    )).toBe('Unable to sign in. Please try again.');
  });
});
