import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TestsPage from '@/features/tests/TestsPage';
import type { AssessmentKind, AssessmentLog, AssessmentWrite } from '@/types/assessment';

const listAssessmentsMock = jest.fn<(userId: string, kind: AssessmentKind) => Promise<AssessmentLog[]>>();
const saveAssessmentMock = jest.fn<(fields: AssessmentWrite, previousId?: string) => Promise<string>>();
const deleteAssessmentMock = jest.fn<(id: string) => Promise<void>>();

jest.mock('@/services/assessmentService', () => ({
  listAssessments: (userId: string, kind: AssessmentKind) => listAssessmentsMock(userId, kind),
  saveAssessment: (fields: AssessmentWrite, previousId?: string) => saveAssessmentMock(fields, previousId),
  deleteAssessment: (id: string) => deleteAssessmentMock(id),
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
      <TestsPage />
    </Provider>
  );
}

describe('TestsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listAssessmentsMock.mockResolvedValue([]);
    saveAssessmentMock.mockResolvedValue('body_composition_2026-10-14');
    deleteAssessmentMock.mockResolvedValue();
  });

  it('logs height with body composition and shows BMI', async () => {
    renderPage();

    expect(await screen.findByText('Log a test to start this history.')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox', { name: 'Height' }), { target: { value: '180' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Body mass' }), { target: { value: '78.4' } });

    expect(screen.getByText('24.2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save test' }));

    await waitFor(() => expect(saveAssessmentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'body_composition',
        method: 'scale',
        heightCm: 180,
        bodyMassKg: 78.4,
      }),
      undefined
    ));
  });

  it('switches to the VO2max form', async () => {
    renderPage();
    await screen.findByRole('textbox', { name: 'Height' });

    fireEvent.click(screen.getByRole('tab', { name: 'VO2max' }));

    expect(await screen.findByRole('textbox', { name: 'VO2max' })).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: 'Height' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Recent VO2max' })).toBeTruthy();
    expect(await screen.findByText('Log a test to start this history.')).toBeTruthy();
  });
});
