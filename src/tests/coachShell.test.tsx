import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/context/ProgramsContext', () => ({
  usePrograms: () => ({ programs: [], isLoading: false }),
}));

jest.mock('@/services/teamService', () => ({
  getCoachTeams: jest.fn(async () => []),
  getTeamMembers: jest.fn(async () => []),
}));

jest.mock('@/services/coachPlacementService', () => ({
  listCoachPlacements: jest.fn(async () => []),
  placeSessionOnDate: jest.fn(async () => undefined),
  clearPlannedDate: jest.fn(async () => undefined),
}));

jest.mock('@/services/coachService', () => ({
  getAllAthletes: jest.fn(async () => [
    { id: 'athlete-1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
  ]),
}));

jest.mock('@/services/powerBiExportService', () => ({
  downloadPowerBiZip: jest.fn(async () => ({
    athleteCount: 1,
    sessionCount: 1,
    gymSetCount: 2,
    activityCount: 0,
    wellnessCount: 0,
    footballLoadCount: 0,
  })),
}));
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthenticatedShell from '@/features/coach-shell/AuthenticatedShell';
import {
  COACH_SHELL_STORAGE_KEY,
  readCoachShellEnabled,
  setCoachShellEnabled,
} from '@/features/coach-shell/coachShellPreference';
import type { User } from '@/services/firebase/auth';

const createUser = (role: 'athlete' | 'coach'): User => ({
  id: `test-${role}`,
  email: `${role}@example.com`,
  firstName: 'Test',
  lastName: role,
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const PathProbe: React.FC = () => {
  const location = useLocation();
  return <div>Path {location.pathname}</div>;
};

function renderShell(role: 'athlete' | 'coach' | null, path = '/') {
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

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <PathProbe />
        <AuthenticatedShell phoneShell={<div>Phone shell</div>} />
      </MemoryRouter>
    </Provider>
  );
}

describe('coach shell preference', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stays off until this device saves the choice', () => {
    expect(readCoachShellEnabled()).toBe(false);

    setCoachShellEnabled(true);

    expect(window.localStorage.getItem(COACH_SHELL_STORAGE_KEY)).toBe('true');
    expect(readCoachShellEnabled()).toBe(true);
  });
});

describe('coach shell gate', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps the phone shell for a coach until the workspace is turned on', () => {
    renderShell('coach', '/programs');

    expect(screen.getByText('Phone shell')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Coach workspace' })).not.toBeInTheDocument();
  });

  it('keeps the phone shell for an athlete even when the device choice is on', () => {
    setCoachShellEnabled(true);

    renderShell('athlete', '/');

    expect(screen.getByText('Phone shell')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Coach workspace' })).not.toBeInTheDocument();
  });

  it('shows the coach desk for a coach and returns to the phone shell', async () => {
    setCoachShellEnabled(true);
    const user = userEvent.setup();

    renderShell('coach', '/wellness');

    expect(await screen.findByText('Path /coach-workspace')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Coach workspace' })).toBeInTheDocument();
    expect(screen.queryByText('Phone shell')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(await screen.findByText(/no team yet/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Session overview' }));
    expect(screen.getByRole('heading', { name: 'Session overview' })).toBeInTheDocument();
    expect(screen.getByText(/today only/i)).toBeInTheDocument();
    expect(screen.getByText(/choose the team in the left menu/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByRole('heading', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'One athlete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All athletes I coach' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use the phone app' }));

    expect(screen.getByText('Phone shell')).toBeInTheDocument();
    expect(await screen.findByText('Path /')).toBeInTheDocument();
    expect(readCoachShellEnabled()).toBe(false);
  });
});
