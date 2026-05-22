import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AthleteOverview from '@/features/coach/AthleteOverview';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector({
    auth: {
      user: {
        id: 'coach-1',
        firstName: 'Coach',
        lastName: 'One',
        role: 'coach',
      },
    },
  }),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('@/features/coach/AthleteAssignDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="assign-dialog" />,
}));

jest.mock('@/services/coachService', () => ({
  getAthleteSummaryStats: jest.fn(async () => ({
    workoutsThisWeek: 1,
    workoutsThisMonth: 2,
    sessionsToday: 0,
    sessionsLast7Days: 1,
    exercisesToday: 0,
    exercisesLast7Days: 3,
    totalVolume: 1000,
    programsAssigned: 0,
    programsCompleted: 0,
    sessionsAssigned: 0,
    lastActive: '2026-03-01T10:00:00.000Z',
  })),
  getAthleteExerciseLogs: jest.fn(async () => []),
  getAthleteSessionHistory: jest.fn(async () => []),
  getAthleteAssignedPrograms: jest.fn(async () => []),
  getAthleteAssignedSessions: jest.fn(async () => []),
  getAllAthletes: jest.fn(async () => [
    {
      id: 'athlete-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    },
    {
      id: 'athlete-2',
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
    },
  ]),
}));

jest.mock('@/services/teamService', () => ({
  getCoachTeams: jest.fn(async () => [{ id: 'team-1', name: 'U19' }]),
}));

jest.mock('@/services/powerBiExportService', () => ({
  downloadPowerBiZip: jest.fn(async () => ({
    gymSetCount: 1,
    activityCount: 2,
    athleteCount: 1,
    sessionCount: 1,
    wellnessCount: 1,
    footballLoadCount: 1,
  })),
}));

const mockedPowerBiExportService = jest.requireMock('@/services/powerBiExportService') as {
  downloadPowerBiZip: jest.Mock;
};

describe('AthleteOverview unified export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows one export action and passes the selected scope to the ZIP exporter', async () => {
    render(
      <MemoryRouter initialEntries={['/coach/athletes/athlete-1']}>
        <Routes>
          <Route path="/coach/athletes/:athleteId" element={<AthleteOverview />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Export Data' })).not.toBeNull();
    });

    expect(screen.queryByText('Export all athletes CSV')).toBeNull();
    expect(screen.queryByText('Export this athlete wellness CSV')).toBeNull();

    const exportButtons = screen.getAllByRole('button', { name: 'Export Data' });
    expect(exportButtons).toHaveLength(1);

    fireEvent.click(exportButtons[0]);

    await waitFor(() => {
      expect(mockedPowerBiExportService.downloadPowerBiZip).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'athlete',
          targetAthleteId: 'athlete-1',
        }),
        expect.objectContaining({
          id: 'coach-1',
          role: 'coach',
        })
      );
    });
  });
});
