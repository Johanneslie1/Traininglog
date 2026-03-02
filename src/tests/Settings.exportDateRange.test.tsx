import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react';
import Settings from '@/components/Settings';

const mockGetExportPreview = jest.fn() as jest.MockedFunction<
  (userId: string, startDate?: Date, endDate?: Date) => Promise<{ sessionCount: number; exerciseCount: number; setCount: number }>
>;

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector({ auth: { user: { id: 'user-1', role: 'athlete' } } }),
  useDispatch: () => jest.fn(),
}));

jest.mock('@/services/exportService', () => ({
  exportData: jest.fn(),
  downloadCSV: jest.fn(),
  downloadActivityCSVs: jest.fn(),
  getExportPreview: (userId: string, startDate?: Date, endDate?: Date) =>
    mockGetExportPreview(userId, startDate, endDate),
}));

jest.mock('@/services/backupService', () => ({
  exportFullBackup: jest.fn(),
  downloadBackupJson: jest.fn(),
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

describe('Settings date range handling', () => {
  beforeEach(() => {
    mockGetExportPreview.mockReset();
    mockGetExportPreview.mockResolvedValue({
      sessionCount: 0,
      exerciseCount: 0,
      setCount: 0,
    });
  });

  it('parses custom date range as local start/end of day', async () => {
    const { container } = render(<Settings isOpen={true} onClose={jest.fn()} />);

    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);

    fireEvent.change(dateInputs[0], { target: { value: '2026-02-23' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-02' } });

    await waitFor(() => {
      expect(mockGetExportPreview).toHaveBeenCalled();
    });

    const latestCall = mockGetExportPreview.mock.calls[mockGetExportPreview.mock.calls.length - 1];
    const startDate = latestCall[1] as Date;
    const endDate = latestCall[2] as Date;

    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);

    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(1);
    expect(startDate.getDate()).toBe(23);
    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);
    expect(startDate.getSeconds()).toBe(0);
    expect(startDate.getMilliseconds()).toBe(0);

    expect(endDate.getFullYear()).toBe(2026);
    expect(endDate.getMonth()).toBe(2);
    expect(endDate.getDate()).toBe(2);
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
    expect(endDate.getSeconds()).toBe(59);
    expect(endDate.getMilliseconds()).toBe(999);
  });
});
