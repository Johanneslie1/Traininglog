/** @jest-environment jsdom */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  useExerciseLogCalendar: () => ({ setIsExerciseLogMainView: jest.fn() }),
}));

jest.mock('@/features/exercises/exerciseLogViewState', () => ({
  isExerciseLogMainView: () => true,
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
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

jest.mock('@/services/firebase/sessionTrackingService', () => ({
  createNewSessionForDate: jest.fn(),
  deleteSession: jest.fn(),
  renameSession: jest.fn(),
  getSessionsForDate: jest.fn(async () => [
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
  ]),
}));

jest.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../features/programs/ProgramModal', () => () => null);
jest.mock('../components/SideMenu', () => () => null);
jest.mock('../components/FloatingSupersetControls', () => () => null);
jest.mock('../features/exercises/LogOptions', () => () => null);
jest.mock('../features/exercises/ExerciseSetLogger', () => ({ ExerciseSetLogger: () => null }));
jest.mock('../features/exercises/WorkoutSummary', () => () => null);

jest.mock('../components/ui', () => ({
  FloatingActionButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>Add Exercise</button>
  ),
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  ExerciseListSkeleton: () => <div>Loading...</div>,
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

const sessionTrackingServiceMock = jest.requireMock('@/services/firebase/sessionTrackingService') as {
  createNewSessionForDate: jest.Mock;
};

describe('ExerciseLog session type filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sessionTrackingServiceMock.createNewSessionForDate as any).mockResolvedValue({
      sessionId: 'warmup-session-2',
      sessionType: 'warmup',
      sessionDateKey: '2026-03-31',
      sessionWeekKey: '2026-W14',
      sessionNumberInDay: 2,
      sessionNumberInWeek: 2,
    });
  });

  it('shows only exercises from selected session item', async () => {
    render(<ExerciseLog />);

    await waitFor(() => {
      expect(screen.getByText('Bench Press')).toBeTruthy();
      expect(screen.queryByText('Bike Warm-up')).toBeNull();
    });

    fireEvent.click(screen.getByText('Warm-up 1'));

    await waitFor(() => {
      expect(screen.getByText('Bike Warm-up')).toBeTruthy();
      expect(screen.queryByText('Bench Press')).toBeNull();
    });
  });

  it('does not auto-create baseline sessions on date load', async () => {
    render(<ExerciseLog />);

    await waitFor(() => {
      expect(screen.getByText('Session 1')).toBeTruthy();
      expect(screen.getByText('Warm-up 1')).toBeTruthy();
    });
  });

  it('creates exactly one warm-up session per Add Warm-up click', async () => {
    render(<ExerciseLog />);

    const addWarmupButton = await screen.findByLabelText('Add warm-up');

    await waitFor(() => {
      expect((addWarmupButton as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(addWarmupButton);

    await waitFor(() => {
      expect(sessionTrackingServiceMock.createNewSessionForDate).toHaveBeenCalledTimes(1);
      expect(sessionTrackingServiceMock.createNewSessionForDate).toHaveBeenCalledWith(
        'user-1',
        expect.any(Date),
        'warmup'
      );
    });
  });
});
