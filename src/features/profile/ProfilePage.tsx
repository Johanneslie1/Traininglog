import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { logout, setUser } from '@/features/auth/authSlice';
import { logoutUser, updateUserProfile } from '@/services/firebase/auth';
import { useSafeBackNavigation } from '@/hooks/useSafeBackNavigation';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const handleBack = useSafeBackNavigation('/');
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();

  useEffect(() => {
    if (!user) {
      return;
    }
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setError('First name and last name are required.');
      setSuccess(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserProfile(user.id, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName
      });

      dispatch(setUser({
        ...user,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        updatedAt: new Date()
      }));

      setIsEditing(false);
      setSuccess('Profile updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setIsEditing(false);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      dispatch(logout());
      navigate('/login');
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Failed to log out.');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/95 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm hover:bg-bg-tertiary transition-colors"
            aria-label="Go back"
          >
            Back
          </button>
          <h1 className="text-lg font-semibold">Profile</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-xl border border-border bg-bg-secondary p-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              {success}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-text-tertiary">Name</p>
              {!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-bg-tertiary transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-bg-tertiary transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="inline-flex items-center justify-center rounded-lg bg-accent-primary px-3 py-1.5 text-sm text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-60"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <p className="text-base font-medium text-text-primary">{fullName || 'Not set'}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs text-text-secondary flex flex-col gap-1">
                  First Name
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="w-full rounded-md bg-bg-tertiary border border-border px-3 py-2 text-text-primary"
                    maxLength={60}
                  />
                </label>
                <label className="text-xs text-text-secondary flex flex-col gap-1">
                  Last Name
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="w-full rounded-md bg-bg-tertiary border border-border px-3 py-2 text-text-primary"
                    maxLength={60}
                  />
                </label>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">Email</p>
            <p className="text-base text-text-primary break-all">{user?.email || 'Not available'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">Role</p>
            <p className="text-base text-text-primary capitalize">{user?.role || 'athlete'}</p>
          </div>

          <div className="pt-2 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
