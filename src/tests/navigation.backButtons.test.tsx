/**
 * Smoke-tests that every page that had a broken/missing back or close control:
 * - renders the button
 * - calls through to useSafeBackNavigation when clicked
 *
 * useSafeBackNavigation itself is thoroughly unit-tested separately.
 * Here we just verify the wiring inside each page component.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── Mock the safe-back hook so we can spy on calls ──────────────────────────
const mockSafeBack = vi.fn();
vi.mock('@/hooks/useSafeBackNavigation', () => ({
  useSafeBackNavigation: () => mockSafeBack,
}));

// ─── SpeedAgilityPlyoBrowser – heavy data; stub it out ───────────────────────
vi.mock('@/components/exercises/SpeedAgilityPlyoBrowser', () => ({
  default: () => <div>SpeedAgilityContent</div>,
}));

// ─── Settings component – stub with a minimal close button ───────────────────
vi.mock('@/components/Settings', () => ({
  default: ({ onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div>
      <button onClick={onClose} aria-label="Close settings">Close settings</button>
    </div>
  ),
}));

// ─── Team Service ─────────────────────────────────────────────────────────────
vi.mock('@/services/teamService', () => ({
  getTeamByInviteCode: vi.fn().mockResolvedValue(null),
  joinTeam: vi.fn(),
}));

// ─── Redux / auth mocks used by ProfilePage ───────────────────────────────────
vi.mock('react-redux', () => ({
  useSelector: (selector: (s: object) => unknown) =>
    selector({
      auth: {
        user: {
          id: 'u1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'athlete',
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    }),
  useDispatch: () => vi.fn(),
}));

vi.mock('@/services/firebase/auth', () => ({
  logoutUser: vi.fn(),
  updateUserProfile: vi.fn(),
  updateUserRole: vi.fn(),
}));

vi.mock('@/features/auth/authSlice', () => ({
  setUser: vi.fn(() => ({ type: 'auth/setUser' })),
  logout: vi.fn(() => ({ type: 'auth/logout' })),
}));

// ─── Lazy-import components AFTER mocks are established ──────────────────────
import SettingsPage from '@/features/settings/SettingsPage';
import ProfilePage from '@/features/profile/ProfilePage';
import SpeedAgilityPlyoPage from '@/pages/SpeedAgilityPlyoPage';
import JoinTeam from '@/features/teams/JoinTeam';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const wrap = (ui: React.ReactElement, path = '/') =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Back / Close button wiring', () => {
  beforeEach(() => {
    mockSafeBack.mockReset();
  });

  describe('SettingsPage', () => {
    it('renders the Settings close button', () => {
      wrap(<SettingsPage />);
      expect(screen.getByRole('button', { name: /close settings/i })).toBeTruthy();
    });

    it('clicking close calls the safe-back callback', () => {
      wrap(<SettingsPage />);
      fireEvent.click(screen.getByRole('button', { name: /close settings/i }));
      expect(mockSafeBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('ProfilePage', () => {
    it('renders the Back button', () => {
      wrap(<ProfilePage />);
      expect(screen.getByRole('button', { name: /go back/i })).toBeTruthy();
    });

    it('clicking Back calls the safe-back callback', () => {
      wrap(<ProfilePage />);
      fireEvent.click(screen.getByRole('button', { name: /go back/i }));
      expect(mockSafeBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('SpeedAgilityPlyoPage', () => {
    it('renders the Back button', () => {
      wrap(<SpeedAgilityPlyoPage />);
      expect(screen.getByRole('button', { name: /^back$/i })).toBeTruthy();
    });

    it('clicking Back calls the safe-back callback', () => {
      wrap(<SpeedAgilityPlyoPage />);
      fireEvent.click(screen.getByRole('button', { name: /^back$/i }));
      expect(mockSafeBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('JoinTeam (no invite code in URL)', () => {
    it('renders the Back button once loading is resolved', async () => {
      wrap(<JoinTeam />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^back$/i })).toBeTruthy();
      });
    });

    it('clicking Back calls the safe-back callback', async () => {
      wrap(<JoinTeam />);
      const btn = await screen.findByRole('button', { name: /^back$/i });
      fireEvent.click(btn);
      expect(mockSafeBack).toHaveBeenCalledTimes(1);
    });
  });
});
