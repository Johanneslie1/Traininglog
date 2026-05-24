// @ts-nocheck

import React from 'react';
import { describe, expect, it, jest } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import AppRoutes from '@/routes';
import type { User } from '@/services/firebase/auth';

jest.mock('@/features/auth/Login', () => ({
  __esModule: true,
  default: () => <div>Login Route</div>,
}));

jest.mock('@/features/stats/AthleteStatsPage', () => ({
  __esModule: true,
  default: () => <div>Athlete Stats Route</div>,
}));

jest.mock('@/features/coach/CoachDashboard', () => ({
  __esModule: true,
  default: () => <div>Coach Hub Route</div>,
}));

jest.mock('@/context/ProgramsContext', () => ({
  usePrograms: () => ({
    programs: [],
    updateProgram: jest.fn(),
    refresh: jest.fn(),
    isLoading: false,
  }),
}));

const createUser = (role: 'athlete' | 'coach'): User => ({
  id: `test-${role}`,
  email: `${role}@example.com`,
  firstName: 'Test',
  lastName: role,
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
});

function renderRoutes(path: string, role: 'athlete' | 'coach' | null) {
  const authState = {
    user: role ? createUser(role) : null,
    isAuthenticated: Boolean(role),
    isLoading: false,
    error: null,
  };
  const store = configureStore({
    reducer: {
      auth: (state = authState) => state,
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>
  );
}

describe('stats routes', () => {
  it('protects the athlete stats route behind authentication', async () => {
    renderRoutes('/stats', null);

    expect(await screen.findByText('Login Route')).toBeInTheDocument();
  });

  it('allows athletes to access the stats route', async () => {
    renderRoutes('/stats', 'athlete');

    expect(await screen.findByText('Athlete Stats Route')).toBeInTheDocument();
  });

  it('allows coaches to access personal stats and Coach Hub', async () => {
    renderRoutes('/stats', 'coach');
    expect(await screen.findByText('Athlete Stats Route')).toBeInTheDocument();

    renderRoutes('/coach', 'coach');
    expect(await screen.findByText('Coach Hub Route')).toBeInTheDocument();
  });
});
