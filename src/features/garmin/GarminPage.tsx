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
                  Ease: sleep under 75, HRV 10 ms under your average for this window, or wake recovery under 40. Clear: sleep 85 or higher, HRV within 2 ms of that average, and wake recovery 60 or higher. Otherwise Watch.
                </InfoTip>
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              <Metric label="Sleep" value={metric(morning?.sleepScore)} />
              <Metric label="HRV" value={metric(morning?.hrvLastNight)} detail={baseline !== null ? `avg ${baseline}` : undefined} />
              <Metric label="RHR" value={metric(morning?.restingHeartRate)} detail={rhrBaseline !== null ? `avg ${rhrBaseline}` : undefined} />
              <Metric label="Steps" value={formatSteps(morning?.steps)} />
              <Metric label="Recovery" value={recoveryValue(morning)} detail={recoveryDetail(morning)} />
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

          <DayTable
            dateKeys={dateKeys}
            windowDays={windowDays}
            activities={activities}
            baseline={baseline}
          />
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

function formatSteps(value: number | undefined): string {
  return value === undefined ? '—' : value.toLocaleString('en-GB');
}

function metric(value: number | undefined): string {
  return value === undefined ? '—' : String(value);
}

function recoveryValue(day: GarminDayRecord | null): string {
  if (!day) return '—';
  if (day.bodyBatteryAtWake !== undefined || day.bodyBatteryAtBed !== undefined) {
    return `${metric(day.bodyBatteryAtWake)} / ${metric(day.bodyBatteryAtBed)}`;
  }
  return metric(day.bodyBatteryLatest);
}

function recoveryDetail(day: GarminDayRecord | null): string | undefined {
  if (!day) return undefined;
  return day.bodyBatteryAtWake !== undefined || day.bodyBatteryAtBed !== undefined ? 'wake / bed' : undefined;
}

function DayTable({
  dateKeys,
  windowDays,
  activities,
  baseline,
}: {
  dateKeys: string[];
  windowDays: GarminDayRecord[];
  activities: GarminActivityRecord[];
  baseline: number | null;
}) {
  const rows = [...dateKeys].reverse().flatMap((date) => {
    const day = windowDays.find((entry) => entry.date === date);
    const minutes = activityMinutesOn(activities, date);
    if (!day && minutes === 0) return [];
    return [{
      date,
      day,
      minutes,
      flag: day && baseline !== null ? morningFlag(day, baseline) : null,
    }];
  });
  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[0.68rem] uppercase tracking-wide text-text-tertiary">
            {['Date', 'Sleep', 'HRV', 'RHR', 'Steps', 'Wake', 'Bed', 'Min', ''].map((heading) => (
              <th key={heading || 'flag'} className={`px-3 py-2 font-medium ${heading === 'Date' ? 'sticky left-0 bg-bg-secondary' : ''}`}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date} className="border-b border-border last:border-b-0">
              <th className="sticky left-0 bg-bg-primary px-3 py-2 text-left font-medium">{formatGarminDateKey(row.date)}</th>
              <td className="px-3 py-2 tabular-nums">{metric(row.day?.sleepScore)}</td>
              <td className="px-3 py-2 tabular-nums">{metric(row.day?.hrvLastNight)}</td>
              <td className="px-3 py-2 tabular-nums">{metric(row.day?.restingHeartRate)}</td>
              <td className="px-3 py-2 tabular-nums">{formatSteps(row.day?.steps)}</td>
              <td className="px-3 py-2 tabular-nums">{metric(row.day?.bodyBatteryAtWake ?? (row.day?.bodyBatteryAtBed === undefined ? row.day?.bodyBatteryLatest : undefined))}</td>
              <td className="px-3 py-2 tabular-nums">{metric(row.day?.bodyBatteryAtBed)}</td>
              <td className="px-3 py-2 tabular-nums">{row.minutes}</td>
              <td className={`px-3 py-2 font-semibold ${row.flag ? FLAG_CLASS[row.flag] : 'text-text-tertiary'}`}>{row.flag ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sparkline({ values, baseline, label }: { values: Array<number | null>; baseline: number | null; label: string }) {
  const height = 132;
  const left = 36;
  const top = 20;
  const right = 12;
  const bottom = 10;
  const known = values.flatMap((value, index) => (value === null ? [] : [{ value, index }]));
  if (known.length === 0) return <p className="text-sm text-text-tertiary">—</p>;
  const min = Math.min(...known.map((point) => point.value), baseline ?? known[0].value);
  const max = Math.max(...known.map((point) => point.value), baseline ?? known[0].value);
  const range = max - min || 1;
  const plotWidth = Math.max(312, (Math.max(values.length, 2) - 1) * 44);
  const width = left + plotWidth + right;
  const plotHeight = height - top - bottom;
  const xFor = (index: number) => (values.length > 1 ? left + (index * plotWidth) / (values.length - 1) : left + plotWidth / 2);
  const yFor = (value: number) => top + ((max - value) / range) * plotHeight;
  const segments: string[] = [];
  let current: string[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) segments.push(current.join(' '));
      current = [];
      return;
    }
    current.push(`${xFor(index)},${yFor(value)}`);
  });
  if (current.length > 0) segments.push(current.join(' '));

  const labels: Array<{ x: number; y: number; text: string }> = [];
  known.forEach((point, position) => {
    const x = xFor(point.index);
    const previous = labels[labels.length - 1];
    const isLast = position === known.length - 1;
    if (previous && x - previous.x < 28) {
      if (!isLast) return;
      labels.pop();
    }
    const above = yFor(point.value) - 8;
    labels.push({
      x,
      y: above < 12 ? yFor(point.value) + 14 : above,
      text: String(Math.round(point.value)),
    });
  });

  const axis = [max];
  if (baseline !== null && Math.abs(baseline - max) > range * 0.18 && Math.abs(baseline - min) > range * 0.18) axis.push(baseline);
  if (min !== max) axis.push(min);
  const baselineY = baseline === null ? null : yFor(baseline);

  return (
    <div className="overflow-x-auto">
    <svg viewBox={`0 0 ${width} ${height}`} className="h-36 max-w-none" style={{ width }} role="img" aria-label={label}>
      <g className="fill-current text-text-secondary">
        {axis.map((value) => (
          <text key={value} x={left - 6} y={yFor(value) + 4} textAnchor="end" fontSize="12">
            {Math.round(value)}
          </text>
        ))}
      </g>
      <g className="text-accent-primary">
        {baselineY !== null ? (
          <line x1={left} x2={width - right} y1={baselineY} y2={baselineY} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="4 4" />
        ) : null}
        {segments.map((points) => (
          <polyline key={points} points={points} fill="none" stroke="currentColor" strokeWidth="2" />
        ))}
        {known.map((point) => (
          <circle key={point.index} cx={xFor(point.index)} cy={yFor(point.value)} r="2.5" fill="currentColor" />
        ))}
      </g>
      <g className="fill-current text-text-primary">
        {labels.map((item) => (
          <text key={`${item.x}-${item.text}`} x={item.x} y={item.y} textAnchor="middle" fontSize="12">
            {item.text}
          </text>
        ))}
      </g>
    </svg>
    </div>
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
