import React, { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { getAllExercisesByDate } from '../../utils/unifiedExerciseUtils';
import { ActivityType } from '../../types/activityTypes';
import { ActivityBadge, Button, DashboardSection, EmptyState, MetricChip, SectionDivider, Skeleton, ViewToggle } from '@/components/ui';
import {
  formatNumberCompact,
  formatRelativeDate,
  formatRelativeWithAbsolute,
  formatTrainingVolume,
  getDateSectionLabel,
} from '@/utils/displayFormatters';

interface DashboardProps {}

type DashboardView = 'compact' | 'detailed';

const Dashboard: React.FC<DashboardProps> = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [recentExercises, setRecentExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<DashboardView>('compact');

  useEffect(() => {
    const loadRecentData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const endDate = new Date();
        const exercises = await getAllExercisesByDate(endDate, user.id);
        setRecentExercises(exercises.slice(0, 10));
      } catch (error) {
        console.error('Error loading recent exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentData();
  }, [user?.id]);

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));

    const thisWeek = recentExercises.filter((exercise) => {
      const timestamp = exercise.timestamp ? new Date(exercise.timestamp) : null;
      return timestamp && !Number.isNaN(timestamp.getTime()) && timestamp >= startOfWeek;
    });

    const volume = thisWeek.reduce((sum, exercise) => {
      const sets = exercise.sets || [];
      return sum + sets.reduce((setSum: number, set: any) => setSum + ((set.weight || 0) * (set.reps || 0)), 0);
    }, 0);

    const totalSets = thisWeek.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0);
    const activityCount = new Set(recentExercises.map((exercise) => exercise.activityType || ActivityType.RESISTANCE)).size;
    const readiness = thisWeek.length >= 3 ? 'Productive' : thisWeek.length >= 1 ? 'Building' : 'Ready';
    const nextAction = thisWeek.length === 0
      ? 'Log your first session this week'
      : totalSets < 8
        ? 'Add another focused session'
        : 'Review recovery and keep momentum';

    return {
      weeklyVolume: volume,
      weeklySessions: thisWeek.length,
      activityCount,
      readiness,
      nextAction,
    };
  }, [recentExercises]);

  const groupedRecentExercises = useMemo(() => {
    const groups: Record<string, any[]> = {
      Today: [],
      'This Week': [],
      Recent: [],
    };

    recentExercises.forEach((exercise) => {
      groups[getDateSectionLabel(exercise.timestamp)].push(exercise);
    });

    return Object.entries(groups).filter(([, exercises]) => exercises.length > 0);
  }, [recentExercises]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 text-text-primary">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton variant="rectangular" height="220px" className="rounded-3xl" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
          <Skeleton variant="card" count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-4 text-text-primary sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-primary">Training cockpit</p>
            <h1 className="mt-1 text-3xl font-bold text-text-primary">Training Dashboard</h1>
            <p className="mt-1 text-sm text-text-secondary">Overview of your training data and next best action.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Back to Log
          </Button>
        </div>

        <section className="mb-6 overflow-hidden rounded-3xl border border-border-focus bg-gradient-brand-hero p-5 shadow-xl shadow-accent-primary/20 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-100">This week</p>
              <h2 className="mt-2 max-w-2xl text-2xl font-bold text-text-on-accent sm:text-display-sm">
                {dashboardStats.nextAction}
              </h2>
              <p className="mt-2 text-sm text-accent-100/90">
                Readiness: <span className="font-semibold text-text-on-accent">{dashboardStats.readiness}</span>
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
              <div className="rounded-2xl border border-white/15 bg-bg-primary/20 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-accent-100">Volume</p>
                <p className="mt-1 text-2xl font-bold text-text-on-accent">{formatTrainingVolume(dashboardStats.weeklyVolume)}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-bg-primary/20 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-accent-100">Sessions</p>
                <p className="mt-1 text-2xl font-bold text-text-on-accent">{dashboardStats.weeklySessions}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-bg-primary/20 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-accent-100">Activity Mix</p>
                <p className="mt-1 text-2xl font-bold text-text-on-accent">{dashboardStats.activityCount}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 flex flex-wrap gap-2">
          <MetricChip label="Recent" value={`${recentExercises.length} logs`} tone="accent" />
          <MetricChip label="Weekly Volume" value={formatTrainingVolume(dashboardStats.weeklyVolume)} />
          <MetricChip label="Sessions" value={formatNumberCompact(dashboardStats.weeklySessions)} tone="info" />
        </div>

        <DashboardSection
          title="Recent"
          subtitle="Grouped by when the work happened"
          className="mb-6 shadow-lg"
          headerActions={
            <ViewToggle<DashboardView>
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'detailed', label: 'Detailed' },
              ]}
            />
          }
        >
          {recentExercises.length > 0 ? (
            <div className="mt-4 space-y-4">
              {groupedRecentExercises.map(([section, exercises]) => (
                <div key={section} className="space-y-2">
                  <SectionDivider label={section} count={exercises.length} className="top-0" />
                  {exercises.map((exercise, index) => {
                    const setCount = exercise.sets?.length || 0;
                    const volume = (exercise.sets || []).reduce((sum: number, set: any) => sum + ((set.weight || 0) * (set.reps || 0)), 0);

                    return (
                      <div
                        key={exercise.id || `${section}-${index}`}
                        className="group rounded-2xl border border-border bg-bg-tertiary p-3 transition-all hover:border-accent-primary hover:shadow-glow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <ActivityBadge activityType={exercise.activityType} variant="dot" className="mt-1 shadow-glow" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-text-primary">{exercise.exerciseName}</p>
                              <p className="mt-0.5 text-xs text-text-tertiary">
                                {viewMode === 'detailed'
                                  ? formatRelativeWithAbsolute(exercise.timestamp)
                                  : formatRelativeDate(exercise.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
                            {viewMode === 'detailed' ? (
                              <ActivityBadge activityType={exercise.activityType} />
                            ) : null}
                            <MetricChip label="Sets" value={setCount} />
                            {viewMode === 'detailed' ? (
                              <MetricChip label="Volume" value={formatTrainingVolume(volume)} tone={volume > 0 ? 'accent' : 'default'} />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-border bg-bg-tertiary">
              <EmptyState
                illustration="workout"
                title="No recent exercises found"
                description="Log a session to unlock dashboard summaries and weekly recommendations."
                primaryAction={{
                  label: 'Log Exercise',
                  onClick: () => navigate('/'),
                }}
              />
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Quick Actions" subtitle="Jump into the most common flows">
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Log Exercise',
                description: 'Add new workout data',
                path: '/',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                ),
              },
              {
                label: 'Exercise Library',
                description: 'Browse and manage exercises',
                path: '/exercises',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                ),
              },
              {
                label: 'Programs',
                description: 'Plan your next block',
                path: '/programs',
                icon: (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h6" />
                    <circle cx="9" cy="7" r="4" />
                  </>
                ),
              },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="rounded-2xl border border-border bg-bg-tertiary p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent-primary hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <svg className="mb-3 h-6 w-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {action.icon}
                </svg>
                <h4 className="font-semibold text-text-primary">{action.label}</h4>
                <p className="mt-1 text-sm text-text-secondary">{action.description}</p>
              </button>
            ))}
          </div>
        </DashboardSection>
      </div>
    </div>
  );
};

export default Dashboard;
