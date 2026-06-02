import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { db } from '@/services/firebase/config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { RootState } from '@/store/store';
import { EmptyState, InlineErrorState, MetricChip, SectionDivider, Skeleton, ViewToggle } from '@/components/ui';
import {
  formatDisplayDateTime,
  formatRelativeDate,
  formatReps,
  formatTrainingVolume,
  formatWeight,
  getDateSectionLabel,
} from '@/utils/displayFormatters';

interface ExerciseLog {
  id: string;
  exerciseName: string;
  timestamp: Date;
  sets: Array<{
    reps: number;
    weight: number;
    rpe?: number;
  }>;
}

export const ExerciseHistory: React.FC = () => {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const logsRef = collection(db, 'users', user.id, 'exercises');
        const q = query(
          logsRef,
          orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(q);
        const exerciseLogs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate()
        })) as ExerciseLog[];

        setLogs(exerciseLogs);
      } catch (error) {
        console.error('Error fetching exercise logs:', error);
        setError(error instanceof Error ? error.message : 'Failed to load exercise history');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user]);

  const groupedLogs = useMemo(() => {
    const groups: Record<string, ExerciseLog[]> = {
      Today: [],
      'This Week': [],
      Recent: [],
      Older: [],
    };

    logs.forEach((log) => {
      groups[getDateSectionLabel(log.timestamp)].push(log);
    });

    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [logs]);

  const getLogVolume = (log: ExerciseLog) =>
    log.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);

  return (
    <div className="space-y-4 text-text-primary">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Exercise History</h2>
          <p className="text-sm text-text-secondary">Grouped by recency with consistent set and volume formatting.</p>
        </div>
        {logs.length > 0 && (
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'detailed', label: 'Detailed' },
            ]}
          />
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton variant="rectangular" height="44px" />
          <Skeleton variant="card" count={3} />
        </div>
      )}

      {!loading && error && (
        <InlineErrorState title="Could not load history" message={error} />
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="rounded-2xl border border-border bg-bg-secondary">
          <EmptyState
            illustration="calendar"
            title="No exercise logs found"
            description="Log a session to start building exercise history and progress summaries."
          />
        </div>
      )}

      {!loading && !error && groupedLogs.map(([section, sectionLogs]) => (
        <div key={section} className="space-y-3">
          <SectionDivider label={section} count={sectionLogs.length} />
          {sectionLogs.map((log) => {
            const volume = getLogVolume(log);
            return (
              <div key={log.id} className="rounded-2xl border border-border bg-bg-secondary p-4 shadow-md transition-all hover:border-accent-primary hover:shadow-glow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-text-primary">{log.exerciseName}</h3>
                    <p className="mt-1 text-xs text-text-tertiary">
                      {viewMode === 'detailed'
                        ? formatDisplayDateTime(log.timestamp)
                        : formatRelativeDate(log.timestamp)}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <MetricChip label="Sets" value={log.sets.length} />
                    <MetricChip label="Volume" value={formatTrainingVolume(volume)} tone={volume > 0 ? 'accent' : 'default'} />
                  </div>
                </div>

                {viewMode === 'detailed' && (
                  <div className="mt-3 space-y-2 rounded-xl border border-border bg-bg-tertiary/70 p-3">
                    {log.sets.map((set, index) => (
                      <div key={index} className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">Set {index + 1}</span>
                        <span>{formatWeight(set.weight)}</span>
                        <span>×</span>
                        <span>{formatReps(set.reps)}</span>
                        {set.rpe ? <span>RPE {set.rpe}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ExerciseHistory;
