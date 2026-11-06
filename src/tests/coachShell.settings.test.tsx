import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import Settings from '@/components/Settings';
import { COACH_SHELL_STORAGE_KEY } from '@/features/coach-shell/coachShellPreference';

const mockAuth = {
  role: 'athlete' as 'athlete' | 'coach',
};

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: { auth: { user: { id: string; role: string } } }) => unknown) =>
    selector({ auth: { user: { id: 'user-1', role: mockAuth.role } } }),
  useDispatch: () => jest.fn(),
}));

jest.mock('@/services/exportService', () => ({
  exportData: jest.fn(),
  downloadCSV: jest.fn(),
  downloadActivityCSVs: jest.fn(),
  SET_EXPORT_HEADERS: ['userId', 'exerciseLogId', 'exerciseName'],
  getExportPreview: jest.fn(async () => ({
    sessionCount: 0,
    exerciseCount: 0,
    setCount: 0,
  })),
}));

jest.mock('@/services/backupService', () => ({
  exportFullBackup: jest.fn(),
  downloadBackupJson: jest.fn(),
}));

jest.mock('@/services/powerBiExportService', () => ({
  downloadPowerBiZip: jest.fn(),
  buildPowerBiFiles: jest.fn(),
}));

jest.mock('@/services/onedriveService', () => ({
  uploadToOneDrive: jest.fn(),
  signOutOneDrive: jest.fn(),
  isOneDriveSignedIn: jest.fn(async () => false),
}));

jest.mock('@/services/teamService', () => ({
  getCoachTeams: jest.fn(async () => []),
}));

jest.mock('@/services/coachService', () => ({
  getAllAthletes: jest.fn(async () => []),
}));

jest.mock('@/services/firebase/auth', () => ({
  updateUserRole: jest.fn(),
}));

jest.mock('@/features/auth/authSlice', () => ({
  setUser: jest.fn(() => ({ type: 'auth/setUser' })),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: jest.fn(),
  }),
}));

jest.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      defaultWeightIncrements: 2.5,
      defaultUnits: 'kg',
      useProgressiveOverload: true,
    },
    updateSetting: jest.fn(),
  }),
}));

describe('Settings coach workspace switch', () => {
  beforeEach(() => {
    mockAuth.role = 'athlete';
    window.localStorage.clear();
  });

  it('hides the workspace switch from athletes', () => {
    render(<Settings isOpen={true} onClose={jest.fn()} />);

    expect(screen.queryByRole('switch', { name: 'Coach workspace' })).not.toBeInTheDocument();
  });

  it('saves the coach workspace choice on this device', () => {
    mockAuth.role = 'coach';
    render(<Settings isOpen={true} onClose={jest.fn()} />);

    const workspaceSwitch = screen.getByRole('switch', { name: 'Coach workspace' });
    expect(workspaceSwitch).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(workspaceSwitch);

    expect(workspaceSwitch).toHaveAttribute('aria-checked', 'true');
    expect(window.localStorage.getItem(COACH_SHELL_STORAGE_KEY)).toBe('true');
  });
});
