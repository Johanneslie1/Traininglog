// @ts-nocheck

import React from 'react';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import AthleteStatsPage from '@/features/stats/AthleteStatsPage';
import type { User } from '@/services/firebase/auth';

const getAthleteStatsDashboardMock = jest.fn();

jest.mock('@/services/athleteStatsService', () => ({
  getAthleteStatsDashboard: (...args: unknown[]) => getAthleteStatsDashboardMock(...args),
}));

const statsData = {
  viewMode: 'day',
  selectedDate: '2026-03-10',
  periodStartDate: '2026-03-09',
  periodEndDate: '2026-03-15',
  weekStartDate: '2026-03-09',
  weekEndDate: '2026-03-15',
  selectedTeamId: 'personal-stats',
  teams: [],
  summary: {
    athleteCount: 1,
    dailyWellnessAverage: 5.9,
    weeklyWellnessAverage: 5.9,
    weeklyWellnessTotal: 5.9,
    dailySrpeAverage: 7,
    dailySrpeTotalLoad: 420,
    weeklySrpeAverage: 7,
    weeklySrpeTotalLoad: 420,
    missingDailyWellnessCount: 0,
    missingDailySrpeCount: 0,
    outlierCount: 0,
  },
  rows: [{
    athleteId: 'user-1',
    athleteName: 'Test Athlete',
    email: 'athlete@example.com',
    teamIds: ['personal-stats'],
    teamNames: ['Personal stats'],
    dailyWellness: {
      score: 5.9,
      metrics: [],
      metricValues: {},
      hasNotes: false,
      submitted: true,
    },
    wellnessSnapshot: {
      score: 5.9,
      metrics: [],
      metricValues: {
        sleepQuality: 6,
        fatigue: 2,
        muscleSoreness: 2,
        stress: 2,
        mood: 6,
        readiness: 4,
      },
      hasNotes: false,
      submitted: true,
      date: '2026-03-10',
      isSelectedDate: true,
      submittedDays: 1,
      totalDays: 1,
    },
    wellnessTrend: {
      changeFromPrevious: null,
      previousScore: null,
      previousDate: null,
      baselineAverage: null,
      baselineSd: null,
      zScore: null,
      category: 'no_baseline',
      label: 'No baseline yet',
      severity: 'good',
    },
    wellnessTrendPoints: [],
    weeklyWellness: {
      average: 5.9,
      total: 5.9,
      submittedDays: 1,
    },
    dailySrpe: {
      rpe: 7,
      durationMinutes: 60,
      sessionLoad: 420,
      submitted: true,
    },
    weeklySrpe: {
      averageRpe: 7,
      totalLoad: 420,
      submittedDays: 1,
    },
    acwr: {
      acuteLoad: 420,
      acuteReportedDays: 1,
      chronicDailyAverageLoad: 420,
      chronicReportedDays: 1,
      ratio: 1,
      label: 'Normal ACWR',
      status: 'good',
    },
    status: 'good',
    outlierReasons: [],
    missingDailyWellness: false,
    missingDailySrpe: false,
  }],
};

const createUser = (role: 'athlete' | 'coach'): User => ({
  id: `test-${role}`,
  email: `${role}@example.com`,
  firstName: 'Test',
  lastName: role,
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
});

function renderPage(role: 'athlete' | 'coach') {
  const authState = {
    user: createUser(role),
    isAuthenticated: true,
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
      <MemoryRouter initialEntries={['/stats']}>
        <AthleteStatsPage />
      </MemoryRouter>
    </Provider>
  );
}

describe('AthleteStatsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAthleteStatsDashboardMock.mockResolvedValue(statsData);
  });

  it('allows athletes to view their personal stats page', async () => {
    renderPage('athlete');

    expect(screen.getByRole('heading', { name: 'Stats' })).toBeInTheDocument();
    await waitFor(() => expect(getAthleteStatsDashboardMock).toHaveBeenCalled());
    expect(await screen.findByText('This view reads only your own wellness and sports load logs. Coach Hub remains the place for team and athlete-wide stats.')).toBeInTheDocument();
  });

  it('allows coaches to view the same personal athlete-style stats page', async () => {
    renderPage('coach');

    expect(screen.getByRole('heading', { name: 'Stats' })).toBeInTheDocument();
    await waitFor(() => expect(getAthleteStatsDashboardMock).toHaveBeenCalled());
    expect(await screen.findAllByText('Wellness score')).not.toHaveLength(0);
  });
});
