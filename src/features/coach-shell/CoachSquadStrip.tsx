import React, { useEffect, useMemo, useState } from 'react';
import InfoTip from '@/components/ui/InfoTip';
import { InlineErrorState, LoadingState } from '@/components/ui';
import { memberLabel } from '@/features/coach-shell/deskPlan';
import { loadGarminStats } from '@/services/firebase/garminStats';
import {
  MONITOR_SPANS,
  MonitorSpan,
  MorningFlag,
  WellnessScores,
  activityMinutesOn,
  daysInWindow,
  hrvBaseline,
  latestRecordedDay,
  morningFlag,
  spanDateKeys,
  wellnessWindowScores,
} from '@/services/monitoringBoard';
import { getWellnessByDateRange } from '@/services/wellnessService';
import type { TeamMember } from '@/services/teamService';
import { WELLNESS_METRICS } from '@/types/wellness';

interface CoachSquadStripProps {
  members: TeamMember[];
  membersLoading: boolean;
  loadError: string | null;
}

interface SquadRow {
  id: string;
  name: string;
  flag: MorningFlag | null;
  minutes: number;
  hrv: number | null;
  rhr: number | null;
  recovery: number | null;
  wellness: WellnessScores | null;
}

const FLAG_CLASS: Record<MorningFlag, string> = {
  Clear: 'text-success-text',
  Watch: 'text-warning-text',
  Ease: 'text-error-text',
};

const CoachSquadStrip: React.FC<CoachSquadStripProps> = ({ members, membersLoading, loadError }) => {
  const [span, setSpan] = useState<MonitorSpan>('day');
  const [rows, setRows] = useState<SquadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spanDays = MONITOR_SPANS.find((item) => item.id === span)?.days ?? 1;
  const dateKeys = useMemo(() => spanDateKeys(new Date(), spanDays), [spanDays]);

  useEffect(() => {
    if (membersLoading) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const start = dateKeys[0];
    const end = dateKeys[dateKeys.length - 1];
    Promise.all(members.map(async (member) => {
      const [garmin, wellness] = await Promise.all([
        loadGarminStats(member.id).catch(() => null),
        getWellnessByDateRange(member.id, start, end).catch(() => []),
      ]);
      const windowDays = garmin ? daysInWindow(garmin.days, dateKeys) : [];
      const baseline = hrvBaseline(windowDays);
      const morning = latestRecordedDay(windowDays, dateKeys);
      const minutes = garmin
        ? dateKeys.reduce((sum, date) => sum + activityMinutesOn(garmin.activities, date), 0)
        : 0;
      return {
        id: member.id,
        name: memberLabel(member),
        flag: morning && baseline !== null ? morningFlag(morning, baseline) : null,
        minutes,
        hrv: morning?.hrvLastNight ?? null,
        rhr: morning?.restingHeartRate ?? null,
        recovery: morning?.bodyBatteryLatest ?? null,
        wellness: wellnessWindowScores(wellness, dateKeys),
      };
    }))
      .then((next) => {
        if (!cancelled) setRows(next.sort((left, right) => left.name.localeCompare(right.name)));
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the squad.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateKeys, members, membersLoading]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Squad</h1>
          <InfoTip label="How squad flags and wellness scores work">
            The flag uses that athlete’s own HRV average for the window. Ease: sleep under 75, HRV 10 ms under the average, or recovery under 40. Clear: sleep 85 or higher, HRV within 2 ms, and recovery 60 or higher. Day is that 1–5 check-in. A longer window is the average. Sleep, mood, and readiness rise when they feel better. Fatigue, soreness, and stress rise when they feel worse.
          </InfoTip>
        </div>
        <div className="flex gap-1" role="group" aria-label="Time window">
          {MONITOR_SPANS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={span === item.id}
              onClick={() => setSpan(item.id)}
              className={`rounded-full px-2.5 py-1 text-xs ${span === item.id ? 'bg-accent-primary text-text-inverse' : 'text-text-secondary'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loadError ? <InlineErrorState title="Could not load athletes" message={loadError} /> : null}
      {membersLoading || loading ? <LoadingState label="Loading squad" variant="skeleton" /> : null}
      {!membersLoading && !loading && error ? <InlineErrorState title="Could not load the squad" message={error} /> : null}
      {!membersLoading && !loading && !error && rows.length === 0 ? (
        <p className="text-sm text-text-secondary">No athletes on this team.</p>
      ) : null}

      {!membersLoading && !loading && !error ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-border bg-bg-secondary px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{row.name}</p>
                <p className={`text-sm font-semibold ${row.flag ? FLAG_CLASS[row.flag] : 'text-text-tertiary'}`}>
                  {row.flag ?? '—'}
                </p>
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {WELLNESS_METRICS.map((metric) => {
                  const value = row.wellness?.[metric.key];
                  const shown = value === undefined ? '—' : span === 'day' ? String(value) : value.toFixed(1);
                  return `${shortLabel(metric.key)} ${shown}`;
                }).join('  ')}
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                {row.hrv !== null ? `HRV ${row.hrv}` : 'HRV —'}
                {' · '}
                {row.rhr !== null ? `RHR ${row.rhr}` : 'RHR —'}
                {' · '}
                {row.recovery !== null ? `Recovery ${row.recovery}` : 'Recovery —'}
                {' · '}
                {row.minutes} min
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

function shortLabel(key: string): string {
  switch (key) {
    case 'sleepQuality': return 'Sleep';
    case 'fatigue': return 'Fatigue';
    case 'muscleSoreness': return 'Sore';
    case 'stress': return 'Stress';
    case 'mood': return 'Mood';
    case 'readiness': return 'Ready';
    default: return key;
  }
}

export default CoachSquadStrip;
