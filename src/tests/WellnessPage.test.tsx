import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import WellnessPage from '@/features/wellness/WellnessPage';

const getWellnessByDateMock = jest.fn<(userId: string, date: string) => Promise<null>>();

jest.mock('@/services/wellnessService', () => ({
  getWellnessByDate: (userId: string, date: string) => getWellnessByDateMock(userId, date),
  saveWellnessLog: jest.fn(),
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
      <WellnessPage />
    </Provider>
  );
}

describe('WellnessPage', () => {
  beforeEach(() => {
    getWellnessByDateMock.mockReset();
    getWellnessByDateMock.mockResolvedValue(null);
  });

  it('shows a retry state when the entry cannot be loaded', async () => {
    getWellnessByDateMock.mockRejectedValueOnce(new Error('offline'));

    renderPage();

    expect((await screen.findByRole('alert')).textContent).toMatch(/could not load wellness/i);
    expect(screen.queryByRole('button', { name: 'Save Wellness Log' })).toBeNull();

    getWellnessByDateMock.mockResolvedValueOnce(null);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: 'Save Wellness Log' })).toBeTruthy();
  });

  it('selects the lowest sleep score from its button', async () => {
    renderPage();

    await screen.findByRole('button', { name: 'Save Wellness Log' });
    fireEvent.click(screen.getByRole('button', { name: 'Sleep Quality: 1' }));

    expect(screen.getByText('Awful')).toBeTruthy();
  });
});