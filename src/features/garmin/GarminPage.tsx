import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { loadGarminStats } from '@/services/firebase/garminStats';
import InfoTip from '@/components/ui/InfoTip';
import { EmptyState, InlineErrorState, LoadingState } from '@/components/ui';
import {
  MONITOR_SPANS,
  MonitorSpan,
  MorningFlag,
  activityMinutesOn,
  daysInWindow,
  hrvBaseline,
  latestRecordedDay,
  restingHeartRateBaseline,
  morningFlag,
  spanDateKeys,
} from '@/services/monitoringBoard';
import { formatGarminDateKey } from '@/services/garminSync';
import type { GarminActivityRecord, GarminDayRecord } from '@/types/garmin';

const FLAG_CLASS: Record<MorningFlag, string> = {
  Clear: 'text-success-text',
  Watch: 'text-warning-text',
  Ease: 'text-error-text',
};

const GarminPage: React.FC = () => {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [span, setSpan] = useState<MonitorSpan>('day');
  const [days, setDays] = useState<GarminDayRecord[]>([]);
  const [activities, setActivities] = useState<GarminActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const snapshot = await loadGarminStats(userId);
      setDays(snapshot.days);
      setActivities(snapshot.activities);
    } catch (err) {
      console.error('Failed to load Garmin stats:', err);
      setError('Garmin stats could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const spanDays = MONITOR_SPANS.find((item) => item.id === span)?.days ?? 1;
  const dateKeys = useMemo(() => spanDateKeys(new Date(), spanDays), [spanDays]);
  const windowDays = useMemo(() => daysInWindow(days, dateKeys), [days, dateKeys]);
  const baseline = hrvBaseline(windowDays);
  const rhrBaseline = restingHeartRateBaseline(windowDays);
  const morning = latestRecordedDay(windowDays, dateKeys);
  const flag = morning && baseline !== null ? morningFlag(morning, baseline) : null;
  const hasStats = days.length > 0 || activities.length > 0;

  return (
    <div className="mx-auto max-w-xl space-y-5 text-text-primary">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Garmin</h1>
          <InfoTip label="How sync works">
            On this computer, add GARMIN_PERSONAL_API_KEY to .env.local, then run npm run garmin:sync.
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

      {loading ? <LoadingState label="Loading Garmin" variant="skeleton" /> : null}
      {!loading && error ? <InlineErrorState title="Could not load Garmin" message={error} /> : null}
      {!loading && !error && !hasStats ? (
        <EmptyState illustration="chart" title="No Garmin stats yet" />
      ) : null}

      {!loading && !error && hasStats ? (
        <>
          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-text-secondary">{morning ? formatGarminDateKey(morning.date) : '—'}</p>
              <p className={`flex items-center gap-2 text-lg font-semibold ${flag ? FLAG_CLASS[flag] : 'text-text-tertiary'}`}>
                {flag ?? '—'}
                <InfoTip label="How the morning flag is set">
                  Ease: sleep under 75, HRV 10 ms under your average for this window, or recovery under 40. Clear: sleep 85 or higher, HRV within 2 ms of that average, and recovery 60 or higher. Otherwise Watch.
                </InfoTip>
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Metric label="Sleep" value={metric(morning?.sleepScore)} />
              <Metric label="HRV" value={morning?.hrvLastNight !== undefined ? `${morning.hrvLastNight}` : '—'} detail={baseline !== null ? `avg ${baseline}` : undefined} />
              <Metric label="RHR" value={metric(morning?.restingHeartRate)} detail={rhrBaseline !== null ? `avg ${rhrBaseline}` : undefined} />
              <Metric label="Recovery" value={metric(morning?.bodyBatteryLatest)} />
              <Metric label="Activity" value={`${morning ? activityMinutesOn(activities, morning.date) : 0} min`} />
            </dl>
          </section>

          {span !== 'day' ? (
            <section className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">HRV</h2>
                  <InfoTip label="What the HRV line shows">
                    Nightly HRV in milliseconds. The mark is your average for the selected window.
                  </InfoTip>
                </div>
                <Sparkline
                  label="Nightly HRV"
                  values={dateKeys.map((date) => windowDays.find((day) => day.date === date)?.hrvLastNight ?? null)}
                  baseline={baseline}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">RHR</h2>
                  <InfoTip label="What the RHR line shows">
                    Resting heart rate in beats per minute. The mark is your average for the selected window.
                  </InfoTip>
                </div>
                <Sparkline
                  label="Resting heart rate"
                  values={dateKeys.map((date) => windowDays.find((day) => day.date === date)?.restingHeartRate ?? null)}
                  baseline={rhrBaseline}
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-semibold">Activity</h2>
                <MinuteBars values={dateKeys.map((date) => activityMinutesOn(activities, date))} />
              </div>
            </section>
          ) : null}

          <ul className="space-y-2">
            {[...dateKeys].reverse().map((date) => {
              const day = windowDays.find((entry) => entry.date === date);
              const dayFlag = day && baseline !== null ? morningFlag(day, baseline) : null;
              const minutes = activityMinutesOn(activities, date);
              if (!day && minutes === 0) return null;
              return (
                <li key={date} className="flex items-baseline justify-between gap-3 rounded-2xl border border-border bg-bg-secondary px-4 py-3">
                  <div>
                    <p className="font-medium">{formatGarminDateKey(date)}</p>
                    <p className="text-sm text-text-secondary">
                      {day?.sleepScore !== undefined ? `Sleep ${day.sleepScore}` : 'Sleep —'}
                      {' · '}
                      {day?.hrvLastNight !== undefined ? `HRV ${day.hrvLastNight}` : 'HRV —'}
                      {' · '}
                      {day?.restingHeartRate !== undefined ? `RHR ${day.restingHeartRate}` : 'RHR —'}
                      {' · '}
                      {day?.bodyBatteryLatest !== undefined ? day.bodyBatteryLatest : '—'}
                      {minutes > 0 ? ` · ${minutes} min` : ''}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${dayFlag ? FLAG_CLASS[dayFlag] : 'text-text-tertiary'}`}>{dayFlag ?? '—'}</p>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
};

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-secondary px-3 py-3">
      <dt className="text-[0.68rem] uppercase tracking-wide text-text-tertiary">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
      {detail ? <p className="text-xs text-text-tertiary">{detail}</p> : null}
    </div>
  );
}

function metric(value: number | undefined): string {
  return value === undefined ? '—' : String(value);
}

function Sparkline({ values, baseline, label }: { values: Array<number | null>; baseline: number | null; label: string }) {
  const width = 320;
  const height = 88;
  const known = values.filter((value): value is number => value !== null);
  if (known.length === 0) return <p className="text-sm text-text-tertiary">—</p>;
  const min = Math.min(...known, baseline ?? known[0]);
  const max = Math.max(...known, baseline ?? known[0]);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const yFor = (value: number) => height - 6 - ((value - min) / range) * (height - 12);
  const segments: string[] = [];
  let current: string[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) segments.push(current.join(' '));
      current = [];
      return;
    }
    current.push(`${index * step},${yFor(value)}`);
  });
  if (current.length > 0) segments.push(current.join(' '));
  const baselineY = baseline === null ? null : yFor(baseline);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full text-accent-primary" role="img" aria-label={label}>
      {baselineY !== null ? (
        <line x1={0} x2={width} y1={baselineY} y2={baselineY} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="4 4" />
      ) : null}
      {segments.map((points) => (
        <polyline key={points} points={points} fill="none" stroke="currentColor" strokeWidth="2" />
      ))}
    </svg>
  );
}

function MinuteBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-16 items-end gap-1" role="img" aria-label="Activity minutes">
      {values.map((value, index) => (
        <div
          key={index}
          className="min-w-0 flex-1 rounded-sm bg-accent-primary"
          style={{ height: value === 0 ? 2 : `${Math.max(8, (value / max) * 100)}%`, opacity: value === 0 ? 0.25 : 1 }}
        />
      ))}
    </div>
  );
}

export default GarminPage;
