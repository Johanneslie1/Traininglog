import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SportsLoadPage from '@/features/srpe/SportsLoadPage';
import type { SaveSrpeLogInput, SportsLoadSession, SrpeLog } from '@/types/srpe';

jest.setTimeout(15000);

const getSrpeByDateMock = jest.fn<(
  userId: string,
  date: string
) => Promise<SrpeLog | null>>();
const getSportsLoadSessionsByDateMock = jest.fn<(
  userId: string,
  date: string
) => Promise<SportsLoadSession[]>>();
const saveSportsLoadSessionMock = jest.fn<(
  date: string,
  input: SaveSrpeLogInput,
  existingSessionId?: string
) => Promise<string>>();
const deleteSrpeLogMock = jest.fn<(date: string) => Promise<void>>();
const deleteSportsLoadSessionMock = jest.fn<(sessionId: string) => Promise<void>>();

jest.mock('@/services/srpeService', () => ({
  calculateSessionLoad: ({ rpe, durationMinutes }: { rpe: number; durationMinutes: number }) => rpe * durationMinutes,
  deleteSrpeLog: (date: string) => deleteSrpeLogMock(date),
  deleteSportsLoadSession: (sessionId: string) => deleteSportsLoadSessionMock(sessionId),
  getSrpeByDate: (userId: string, date: string) => getSrpeByDateMock(userId, date),
  getSportsLoadSessionsByDate: (userId: string, date: string) =>
    getSportsLoadSessionsByDateMock(userId, date),
  saveSportsLoadSession: (
    date: string,
    input: SaveSrpeLogInput,
    existingSessionId?: string
  ) => saveSportsLoadSessionMock(date, input, existingSessionId),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const authState = {
  user: {
    id: 'user-42',
    email: 'athlete@example.com',
    firstName: 'Test',
    lastName: 'Athlete',
    role: 'athlete',
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

function renderPage() {
  const store = configureStore({
    reducer: {
      auth: (state = authState) => state,
    },
  });

  render(
    <Provider store={store}>
      <SportsLoadPage />
    </Provider>
  );
}

describe('SportsLoadPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-03-15T12:00:00'));
    getSrpeByDateMock.mockResolvedValue(null);
    getSportsLoadSessionsByDateMock.mockResolvedValue([]);
    saveSportsLoadSessionMock.mockResolvedValue('session-new');
    deleteSrpeLogMock.mockResolvedValue();
    deleteSportsLoadSessionMock.mockResolvedValue();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('defaults to football and saves duration x RPE as a new sports load session', async () => {
    renderPage();

    await waitFor(() => expect(getSrpeByDateMock).toHaveBeenCalledWith('user-42', '2026-03-15'));
    expect(getSportsLoadSessionsByDateMock).toHaveBeenCalledWith('user-42', '2026-03-15');
    expect((await screen.findByLabelText('Sport') as HTMLSelectElement).value).toBe('football');

    fireEvent.change(screen.getByLabelText('Session RPE'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '60' } });

    expect(screen.getByText('420')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add Session' }));
    });

    await waitFor(() => expect(saveSportsLoadSessionMock).toHaveBeenCalledWith(
      '2026-03-15',
      {
        rpe: 7,
        durationMinutes: 60,
        sportType: 'football',
        sportName: 'Football',
        sessionName: 'Football',
      },
      undefined
    ));
  });

  it('saves optional sports load metrics without changing duration x RPE load', async () => {
    renderPage();

    await screen.findByLabelText('Sport');

    fireEvent.change(screen.getByLabelText('Session RPE'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '75' } });
    fireEvent.click(screen.getByRole('button', { name: /More details/i }));
    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '9200' } });
    fireEvent.change(screen.getByLabelText('Calories'), { target: { value: '710' } });
    fireEvent.change(screen.getByLabelText('Average heart rate'), { target: { value: '151' } });
    fireEvent.change(screen.getByLabelText('Max heart rate'), { target: { value: '184' } });
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'High tempo small-sided game' } });

    expect(screen.getByText('600')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add Session' }));
    });

    await waitFor(() => expect(saveSportsLoadSessionMock).toHaveBeenCalledWith(
      '2026-03-15',
      expect.objectContaining({
        rpe: 8,
        durationMinutes: 75,
        sportType: 'football',
        sportName: 'Football',
        sessionName: 'Football',
        distanceMeters: 9200,
        calories: 710,
        averageHeartRate: 151,
        maxHeartRate: 184,
        notes: 'High tempo small-sided game',
      }),
      undefined
    ));
  });

  it('shows multiple sessions and updates only the selected session', async () => {
    getSportsLoadSessionsByDateMock.mockResolvedValueOnce([
      {
        id: 'session-1',
        userId: 'user-42',
        date: '2026-03-15',
        dateEpochDay: 20527,
        rpe: 7,
        durationMinutes: 60,
        sessionLoad: 420,
        sportType: 'football',
        sportName: 'Football',
        timestamp: new Date('2026-03-15T10:00:00'),
      },
      {
        id: 'session-2',
        userId: 'user-42',
        date: '2026-03-15',
        dateEpochDay: 20527,
        rpe: 8,
        durationMinutes: 45,
        sessionLoad: 360,
        sportType: 'basketball',
        sportName: 'Basketball',
        sessionName: 'Basketball',
        distanceMeters: 4500,
        calories: 390,
        averageHeartRate: 148,
        maxHeartRate: 176,
        notes: 'Evening court work',
        timestamp: new Date('2026-03-15T18:00:00'),
      },
    ]);
    getSrpeByDateMock.mockResolvedValueOnce({
      id: '2026-03-15',
      userId: 'user-42',
      date: '2026-03-15',
      dateEpochDay: 20527,
      timestamp: new Date('2026-03-15T18:00:00'),
      rpe: 7.4,
      durationMinutes: 105,
      sessionLoad: 780,
      sportType: 'multiple',
      sportName: 'Multiple sports',
      sessionCount: 2,
    });

    renderPage();

    expect(await screen.findAllByText('Football')).not.toHaveLength(0);
    const basketballLabels = await screen.findAllByText('Basketball');
    expect(basketballLabels).not.toHaveLength(0);
    expect(screen.getByText('780')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Basketball session' }));
    await waitFor(() => expect((screen.getByLabelText('Sport') as HTMLSelectElement).value).toBe('basketball'));
    expect((screen.getByLabelText('Duration') as HTMLInputElement).value).toBe('45');
    expect((screen.getByLabelText('Distance') as HTMLInputElement).value).toBe('4500');
    expect((screen.getByLabelText('Calories') as HTMLInputElement).value).toBe('390');
    expect((screen.getByLabelText('Average heart rate') as HTMLInputElement).value).toBe('148');
    expect((screen.getByLabelText('Max heart rate') as HTMLInputElement).value).toBe('176');
    expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).value).toBe('Evening court work');
    expect(screen.getByRole('button', { name: 'Update Session' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Session RPE'), { target: { value: '9' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Update Session' }));
    });

    await waitFor(() => expect(saveSportsLoadSessionMock).toHaveBeenCalledWith(
      '2026-03-15',
      expect.objectContaining({
        rpe: 9,
        durationMinutes: 45,
        sportType: 'basketball',
        sportName: 'Basketball',
        distanceMeters: 4500,
        calories: 390,
        averageHeartRate: 148,
        maxHeartRate: 176,
        notes: 'Evening court work',
      }),
      'session-2'
    ));
  });

  it('deletes a selected sports load session and reloads the daily aggregate', async () => {
    getSportsLoadSessionsByDateMock
      .mockResolvedValueOnce([
        {
          id: 'session-1',
          userId: 'user-42',
          date: '2026-03-15',
          dateEpochDay: 20527,
          rpe: 7,
          durationMinutes: 60,
          sessionLoad: 420,
          sportType: 'football',
          sportName: 'Football',
          sessionName: 'Morning football',
          timestamp: new Date('2026-03-15T10:00:00'),
        },
      ])
      .mockResolvedValueOnce([]);
    getSrpeByDateMock
      .mockResolvedValueOnce({
        id: '2026-03-15',
        userId: 'user-42',
        date: '2026-03-15',
        dateEpochDay: 20527,
        timestamp: new Date('2026-03-15T10:00:00'),
        rpe: 7,
        durationMinutes: 60,
        sessionLoad: 420,
        sportType: 'football',
        sportName: 'Football',
        sessionName: 'Morning football',
        sessionCount: 1,
      })
      .mockResolvedValueOnce(null);

    renderPage();

    expect(await screen.findByText('Morning football')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Morning football session' }));
    expect(screen.getByText('Delete sports load session?')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete session' }));
    });

    await waitFor(() => expect(deleteSportsLoadSessionMock).toHaveBeenCalledWith('session-1'));
    await waitFor(() => expect(getSportsLoadSessionsByDateMock).toHaveBeenCalledTimes(2));
  });

  it('deletes a legacy daily sports load entry', async () => {
    getSrpeByDateMock
      .mockResolvedValueOnce({
        id: '2026-03-15',
        userId: 'user-42',
        date: '2026-03-15',
        dateEpochDay: 20527,
        timestamp: new Date('2026-03-15T10:00:00'),
        rpe: 6,
        durationMinutes: 50,
        sessionLoad: 300,
        sportType: 'football',
        sportName: 'Football',
        sessionCount: 1,
      })
      .mockResolvedValueOnce(null);

    renderPage();

    expect(await screen.findByText('Football legacy daily entry')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete sports load entry' }));
    expect(screen.getByText('Delete sports load entry?')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }));
    });

    await waitFor(() => expect(deleteSrpeLogMock).toHaveBeenCalledWith('2026-03-15'));
    await waitFor(() => expect(getSrpeByDateMock).toHaveBeenCalledTimes(2));
  });

  it('blocks future-date sports load logging', async () => {
    renderPage();

    const dateInput = screen.getByDisplayValue('2026-03-15');
    fireEvent.change(dateInput, { target: { value: '2026-03-16' } });

    expect(await screen.findByText("Can't log sports load for a future date.")).toBeTruthy();
  });
});
