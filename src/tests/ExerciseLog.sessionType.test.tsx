/** @jest-environment jsdom */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector({ auth: { user: { id: 'user-1' } } }),
}));

jest.mock('../context/SupersetContext', () => ({
  SupersetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSupersets: () => ({
    state: { supersets: [] },
    removeExerciseFromSuperset: jest.fn(),
    loadSupersetsForDate: jest.fn(),
    saveSupersetsForDate: jest.fn(),
    updateExerciseOrder: jest.fn(),
  }),
}));

jest.mock('../context/DateContext', () => ({
  useDate: () => ({
    selectedDate: new Date('2026-03-31T00:00:00.000Z'),
    setSelectedDate: jest.fn(),
    normalizeDate: (d: Date) => d,
  }),
}));

jest.mock('@/context/ExerciseLogCalendarContext', () => ({
  useExerciseLogCalendar: () => ({
    setIsExerciseLogMainView: jest.fn(),
    refreshExerciseLogCalendar: jest.fn(),
  }),
}));

jest.mock('@/features/exercises/exerciseLogViewState', () => ({
  isExerciseLogMainView: () => true,
}));

const navigateMock = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useLocation: () => ({ state: null, pathname: '/exercise-log', key: 'test-key' }),
}));

jest.mock('@/services/firebase/config', () => ({
  db: {},
  auth: { currentUser: { uid: 'user-1' } },
}));

jest.mock('@/services/firebase/exerciseLogs', () => ({
  addExerciseLog: jest.fn(),
  backfillExerciseLogSupersetMetadata: jest.fn(async () => 0),
  repairExerciseLogActivityTypes: jest.fn(async () => 0),
}));

jest.mock('@/services/sessionService', () => ({
  getSharedSessionAssignment: jest.fn(),
  updateSharedSessionStatus: jest.fn(),
}));

jest.mock('@/services/exercisePrescriptionAssistantService', () => ({
  generateExercisePrescriptionAssistant: jest.fn(),
}));

const getSportsLoadSessionsByDateMock = jest.fn(async () => [] as unknown[]);

jest.mock('@/services/srpeService', () => ({
  ensureSrpeSessionContextsForDate: jest.fn(async () => 0),
  getSportsLoadSessionsByDate: (...args: unknown[]) => getSportsLoadSessionsByDateMock(...args),
}));

const getAllExercisesByDateMock = jest.fn(async () => [
  {
    id: 'ex-main-1',
    exerciseName: 'Bench Press',
    sessionId: 'main-session-1',
    sessionType: 'main',
    timestamp: new Date('2026-03-31T10:00:00.000Z'),
    userId: 'user-1',
    sets: [],
    activityType: 'resistance',
  },
  {
    id: 'ex-warmup-1',
    exerciseName: 'Bike Warm-up',
    sessionId: 'warmup-session-1',
    sessionType: 'warmup',
    timestamp: new Date('2026-03-31T09:00:00.000Z'),
    userId: 'user-1',
    sets: [],
    activityType: 'endurance',
    isWarmup: true,
  },
]);

jest.mock('../utils/unifiedExerciseUtils', () => ({
  getAllExercisesByDate: () => getAllExercisesByDateMock(),
  deleteExercise: jest.fn(async () => true),
}));

const getSessionsForDateMock = jest.fn(async () => [
  {
    sessionId: 'main-session-1',
    sessionType: 'main',
    sessionDateKey: '2026-03-31',
    sessionWeekKey: '2026-W14',
    sessionNumberInDay: 1,
    sessionNumberInWeek: 1,
    status: 'active',
    name: 'Session 1',
  },
  {
    sessionId: 'warmup-session-1',
    sessionType: 'warmup',
    sessionDateKey: '2026-03-31',
    sessionWeekKey: '2026-W14',
    sessionNumberInDay: 1,
    sessionNumberInWeek: 1,
    status: 'completed',
    name: 'Warm-up 1',
  },
]);

jest.mock('@/services/firebase/sessionTrackingService', () => ({
  createNewSessionForDate: jest.fn(),
  deleteSession: jest.fn(),
  renameSession: jest.fn(),
  getSessionsForDate: (...args: unknown[]) => getSessionsForDateMock(...args),
}));

jest.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../features/programs/ProgramModal', () => () => null);
jest.mock('../components/SideMenu', () => () => null);
jest.mock('../components/FloatingSupersetControls', () => () => null);

let lastLogOptionsProps: {
  selectedSessionId?: string | null;
  selectedSessionType?: string;
} | null = null;

jest.mock('../features/exercises/LogOptions', () => ({
  __esModule: true,
  default: (props: {
    selectedSessionId?: string | null;
    selectedSessionType?: string;
  }) => {
    lastLogOptionsProps = props;
    return <div data-testid="log-options">Log Options</div>;
  },
}));
jest.mock('../features/exercises/ExerciseSetLogger', () => ({ ExerciseSetLogger: () => null }));
jest.mock('../features/exercises/WorkoutSummary', () => () => null);

jest.mock('../components/ui', () => ({
  FloatingActionButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>Add Exercise</button>
  ),
  EmptyState: ({
    title,
    primaryAction,
  }: {
    title: string;
    primaryAction?: { label: string; onClick: () => void };
  }) => (
    <div>
      <div>{title}</div>
      {primaryAction ? (
        <button type="button" onClick={primaryAction.onClick}>
          {primaryAction.label}
        </button>
      ) : null}
    </div>
  ),
  ExerciseListSkeleton: () => <div>Loading...</div>,
  ConfirmDialog: () => null,
}));

jest.mock('../components/DraggableExerciseDisplay', () => ({
  __esModule: true,
  default: ({ exercises }: { exercises: Array<{ exerciseName: string }> }) => (
    <ul data-testid="exercise-list">
      {exercises.map((exercise) => (
        <li key={exercise.exerciseName}>{exercise.exerciseName}</li>
      ))}
    </ul>
  ),
}));

import ExerciseLog from '@/features/exercises/ExerciseLog';
import toast from 'react-hot-toast';

const sessionTrackingServiceMock = jest.requireMock('@/services/firebase/sessionTrackingService') as {
  createNewSessionForDate: jest.Mock;
};

const defaultMainAndWarmupSessions = [
  {
    sessionId: 'main-session-1',
    sessionType: 'main',
    sessionDateKey: '2026-03-31',
    sessionWeekKey: '2026-W14',
    sessionNumberInDay: 1,
    sessionNumberInWeek: 1,
    status: 'active',
    name: 'Session 1',
  },
  {
    sessionId: 'warmup-session-1',
    sessionType: 'warmup',
    sessionDateKey: '2026-03-31',
    sessionWeekKey: '2026-W14',
    sessionNumberInDay: 1,
    sessionNumberInWeek: 1,
    status: 'completed',
    name: 'Warm-up 1',
  },
];

const srpeOnlySessions = [
  {
    sessionId: 'srpe-session-1',
    sessionType: 'srpe',
    sessionDateKey: '2026-03-31',
    sessionWeekKey: '2026-W14',
    sessionNumberInDay: 1,
    sessionNumberInWeek: 1,
    status: 'completed',
    name: 'sRPE 1',
  },
];

describe('ExerciseLog session type filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastLogOptionsProps = null;
    getAllExercisesByDateMock.mockResolvedValue([
      {
        id: 'ex-main-1',
        exerciseName: 'Bench Press',
        sessionId: 'main-session-1',
        sessionType: 'main',
        timestamp: new Date('2026-03-31T10:00:00.000Z'),
        userId: 'user-1',
        sets: [],
        activityType: 'resistance',
      },
      {
        id: 'ex-warmup-1',
        exerciseName: 'Bike Warm-up',
        sessionId: 'warmup-session-1',
        sessionType: 'warmup',
        timestamp: new Date('2026-03-31T09:00:00.000Z'),
        userId: 'user-1',
        sets: [],
        activityType: 'endurance',
        isWarmup: true,
      },
    ] as never);
    getSessionsForDateMock.mockResolvedValue(defaultMainAndWarmupSessions as never);
    getSportsLoadSessionsByDateMock.mockResolvedValue([] as never);
    (sessionTrackingServiceMock.createNewSessionForDate as any).mockResolvedValue({
      sessionId: 'warmup-session-2',
      sessionType: 'warmup',
      sessionDateKey: '2026-03-31',
      sessionWeekKey: '2026-W14',
      sessionNumberInDay: 2,
      sessionNumberInWeek: 2,
    });
  });

  it('hides legacy warm-up sessions and exercises from the active session UI', async () => {
    render(<ExerciseLog />);

    await waitFor(() => {
      expect(screen.getByText('Bench Press')).toBeTruthy();
      expect(screen.queryByText('Bike Warm-up')).toBeNull();
      expect(screen.queryByText('Warm-up 1')).toBeNull();
    });
  });

  it('does not auto-create baseline sessions on date load', async () => {
    render(<ExerciseLog />);

    await waitFor(() => {
      expect(screen.getByText('Session 1')).toBeTruthy();
      expect(screen.queryByText('Warm-up 1')).toBeNull();
    });
  });

  it('does not expose warm-up session creation', async () => {
    render(<ExerciseLog />);

    await waitFor(() => {
      expect(screen.queryByLabelText('Add warm-up')).toBeNull();
      expect(screen.queryByText('Add Warm-up')).toBeNull();
    });

    expect(sessionTrackingServiceMock.createNewSessionForDate).not.toHaveBeenCalled();
  });

  it('opens LogOptions as main when + is pressed on an sRPE-only day', async () => {
    getAllExercisesByDateMock.mockResolvedValue([] as never);
    getSessionsForDateMock.mockResolvedValue(srpeOnlySessions as never);
    getSportsLoadSessionsByDateMock.mockResolvedValue([
      {
        id: 'sports-1',
        sessionId: 'srpe-session-1',
        rpe: 7,
        durationMinutes: 90,
        sessionLoad: 630,
        sportName: 'Football',
      },
    ] as never);

    render(<ExerciseLog />);

    await waitFor(() => {
      expect(screen.getAllByText('sRPE 1').length).toBeGreaterThan(0);
      expect(screen.getByText('Open sRPE')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Add Exercise'));

    await waitFor(() => {
      expect(screen.getByTestId('log-options')).toBeTruthy();
    });

    expect(navigateMock).not.toHaveBeenCalledWith('/sports');
    expect(lastLogOptionsProps?.selectedSessionType).toBe('main');
    expect(lastLogOptionsProps?.selectedSessionId).toBeNull();
  });

  it('starts first main via LogOptions when Add Session is used on an sRPE-only day', async () => {
    getAllExercisesByDateMock.mockResolvedValue([] as never);
    getSessionsForDateMock.mockResolvedValue(srpeOnlySessions as never);
    getSportsLoadSessionsByDateMock.mockResolvedValue([
      {
        id: 'sports-1',
        sessionId: 'srpe-session-1',
        rpe: 7,
        durationMinutes: 90,
        sessionLoad: 630,
        sportName: 'Football',
      },
    ] as never);

    render(<ExerciseLog />);

    await waitFor(() => {
      expect(screen.getByText('Open sRPE')).toBeTruthy();
      expect(screen.getByLabelText('Add session')).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('Add session'));

    await waitFor(() => {
      expect(screen.getByTestId('log-options')).toBeTruthy();
    });

    expect(sessionTrackingServiceMock.createNewSessionForDate).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalledWith('/sports');
    expect(lastLogOptionsProps?.selectedSessionType).toBe('main');
    expect(lastLogOptionsProps?.selectedSessionId).toBeNull();
  });
});
