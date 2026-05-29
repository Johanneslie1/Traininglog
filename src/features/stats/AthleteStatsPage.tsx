import React from 'react';
import { Navigate } from 'react-router-dom';
import { ExclamationIcon } from '@heroicons/react/outline';
import { getAthleteStatsDashboard } from '@/services/athleteStatsService';
import { useCanUseAthleteFeatures } from '@/hooks/useUserRole';
import { HealthDashboardControls } from '@/features/health-dashboard/HealthDashboardControls';
import { HealthLoadTable } from '@/features/health-dashboard/HealthLoadTable';
import { HealthStatusBadge } from '@/features/health-dashboard/HealthStatusBadge';
import { HealthSummaryCards } from '@/features/health-dashboard/HealthSummaryCards';
import { formatCompactDate, formatLoad, formatNumber, formatWeekRange } from '@/features/health-dashboard/healthDashboardFormatters';
import { useHealthLoadDashboard } from '@/features/health-dashboard/useHealthLoadDashboard';

const AthleteStatsPage: React.FC = () => {
  const canUseAthleteFeatures = useCanUseAthleteFeatures();
  const {
    dashboard,
    loading,
    loadError,
    selectedDate,
    periodStartDate,
    periodEndDate,
    viewMode,
    isDayMode,
    refresh,
    selectDay,
    selectWeekStart,
    movePeriod,
    setViewMode,
  } = useHealthLoadDashboard({
    loadDashboard: getAthleteStatsDashboard,
    onLoadError: (error) => {
      console.error('Error loading athlete stats dashboard:', error);
    },
  });

  if (!canUseAthleteFeatures) {
    return <Navigate to="/" replace />;
  }

  const row = dashboard?.rows[0] ?? null;
  const summary = dashboard?.summary;
  const selectedDateLabel = formatCompactDate(selectedDate);
  const periodRangeLabel = formatWeekRange(periodStartDate, periodEndDate);
  const wellnessLabel = isDayMode ? 'Wellness score' : 'Weekly wellness avg';
  const srpeLabel = isDayMode ? 'Sports load' : 'Weekly sports load';

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-10 border-b border-border bg-bg-secondary p-4">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary">Athlete</p>
          <h1 className="text-2xl font-bold text-text-primary">Stats</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Your personal health, well-being, and training load overview.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <section className="rounded-2xl border border-border bg-bg-secondary p-4">
          <HealthDashboardControls
            selectedDate={selectedDate}
            periodStartDate={periodStartDate}
            periodEndDate={periodEndDate}
            viewMode={viewMode}
            isDayMode={isDayMode}
            onViewModeChange={setViewMode}
            onSelectDay={selectDay}
            onSelectWeekStart={selectWeekStart}
            onMovePeriod={movePeriod}
            onRefresh={() => void refresh()}
            refreshLabel="Refresh stats"
          />
        </section>

        {loadError && !dashboard ? (
          <section className="rounded-xl border border-error-border bg-error-bg p-4 text-error-text">
            <p className="font-medium">Stats unavailable</p>
            <p className="mt-1 text-sm">{loadError}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-3 inline-flex rounded-full border border-error-border px-3 py-1.5 text-sm font-medium hover:opacity-90"
            >
              Try again
            </button>
          </section>
        ) : loading && !dashboard ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary-600"></div>
            <span className="ml-3 text-text-tertiary">Loading your stats...</span>
          </div>
        ) : (
          <section className="space-y-4">
            {loadError ? (
              <div className="rounded-lg border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text">
                {loadError}
              </div>
            ) : null}

            <HealthSummaryCards
              items={[
                {
                  id: 'wellness',
                  label: wellnessLabel,
                  value: formatNumber(row?.wellnessSnapshot.score),
                },
                {
                  id: 'reported-wellness',
                  label: 'Reported wellness days',
                  value: (
                    <>
                      {row?.wellnessSnapshot.submittedDays ?? 0}
                      <span className="text-sm font-medium text-text-tertiary">/{row?.wellnessSnapshot.totalDays ?? 1}</span>
                    </>
                  ),
                },
                {
                  id: 'srpe',
                  label: srpeLabel,
                  value: formatLoad(isDayMode ? row?.dailySrpe.sessionLoad : row?.weeklySrpe.totalLoad),
                },
                {
                  id: 'status',
                  label: 'Status',
                  value: <HealthStatusBadge status={row?.status || 'missing'} />,
                },
              ]}
            />

            <div className="rounded-lg border border-info-border bg-info-bg px-3 py-2 text-xs leading-relaxed text-info-text">
              This view reads only your own wellness and sports load logs. Coach Hub remains the place for team and athlete-wide stats.
            </div>

            {!dashboard || !row ? (
              <div className="rounded-lg border border-border bg-bg-secondary p-8 text-center">
                <ExclamationIcon className="mx-auto mb-3 h-10 w-10 text-text-tertiary" />
                <p className="font-medium text-text-primary">No stats found</p>
                <p className="mt-1 text-sm text-text-tertiary">
                  Log wellness or sports load entries to populate this overview.
                </p>
              </div>
            ) : (
              <HealthLoadTable
                rows={[row]}
                isDayMode={isDayMode}
                firstColumnHeader="Period"
                renderFirstColumn={() => (isDayMode ? selectedDateLabel : periodRangeLabel)}
              />
            )}

            {summary ? (
              <p className="text-xs text-text-tertiary">
                Weekly wellness average: {formatNumber(summary.weeklyWellnessAverage)} · Weekly sports load: {formatLoad(summary.weeklySrpeTotalLoad)}
              </p>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
};

export default AthleteStatsPage;
