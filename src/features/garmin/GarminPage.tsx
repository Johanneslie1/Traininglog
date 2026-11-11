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

const GARMIN_SPANS = MONITOR_SPANS.filter((item) => item.id !== 'day');

const FLAG_CLASS: Record<MorningFlag, string> = {
  Clear: 'text-success-text',
  Watch: 'text-warning-text',
  Ease: 'text-error-text',
};

const GarminPage: React.FC = () => {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [span, setSpan] = useState<MonitorSpan>('7');
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

  const spanDays = GARMIN_SPANS.find((item) => item.id === span)?.days ?? 7;
  const dateKeys = useMemo(() => spanDateKeys(new Date(), spanDays), [spanDays]);
  const windowDays = useMemo(() => daysInWindow(days, dateKeys), [days, dateKeys]);
  const baseline = hrvBaseline(windowDays);
  const rhrBaseline = restingHeartRateBaseline(windowDays);
  const morning = latestRecordedDay(windowDays, dateKeys);
  const flag = morning && baseline !== null ? morningFlag(morning, baseline) : null;
  const hasStats = days.length > 0 || activities.length > 0;

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 text-text-primary">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Garmin</h1>
          <InfoTip label="How sync works">
            On this computer, add GARMIN_PERSONAL_API_KEY to .env.local, then run npm run garmin:sync.
          </InfoTip>
        </div>
        <div className="flex gap-1" role="group" aria-label="Time window">
          {GARMIN_SPANS.map((item) => (
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
                  dates={dateKeys}
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
                  dates={dateKeys}
                  values={dateKeys.map((date) => windowDays.find((day) => day.date === date)?.restingHeartRate ?? null)}
                  baseline={rhrBaseline}
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-semibold">Activity</h2>
                <MinuteBars values={dateKeys.map((date) => activityMinutesOn(activities, date))} />
              </div>
          </section>

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

function Sparkline({
  values,
  dates,
  baseline,
  label,
}: {
  values: Array<number | null>;
  dates: string[];
  baseline: number | null;
  label: string;
}) {
  const known = values.flatMap((value, index) => (value === null ? [] : [{ value, index }]));
  if (known.length === 0) return <p className="text-sm text-text-tertiary">—</p>;
  const dataMin = Math.min(...known.map((point) => point.value), baseline ?? known[0].value);
  const dataMax = Math.max(...known.map((point) => point.value), baseline ?? known[0].value);
  const ticks = scoreTicks(dataMin, dataMax);
  const axisMin = ticks[0];
  const axisMax = ticks[ticks.length - 1];
  const span = axisMax - axisMin || 1;
  const width = 360;
  const height = 192;
  const left = 46;
  const right = 10;
  const top = 12;
  const bottom = 54;
  const plotWidth = width - left - right;
  const slot = values.length > 1 ? plotWidth / (values.length - 1) : plotWidth;
  const rotatedDays = slot < 28;
  const plotHeight = height - top - bottom;
  const plotBottom = top + plotHeight;
  const xFor = (index: number) => (values.length > 1 ? left + (index * plotWidth) / (values.length - 1) : left + plotWidth / 2);
  const yFor = (value: number) => top + ((axisMax - value) / span) * plotHeight;
  const dayFont = rotatedDays ? 9 : 11;
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
  const baselineY = baseline === null ? null : yFor(baseline);
  const scoreLabelY = top + plotHeight / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" role="img" aria-label={label}>
      <text
        x={8}
        y={scoreLabelY}
        textAnchor="middle"
        fontSize="10"
        transform={`rotate(-90 8 ${scoreLabelY})`}
        className="fill-current text-text-tertiary"
      >
        Score
      </text>
      <g className="stroke-current text-text-tertiary" strokeOpacity="0.35">
        {ticks.map((tick) => (
          <line key={tick} x1={left} x2={width - right} y1={yFor(tick)} y2={yFor(tick)} strokeWidth="1" />
        ))}
        <line x1={left} x2={left} y1={top} y2={plotBottom} strokeWidth="1" />
        <line x1={left} x2={width - right} y1={plotBottom} y2={plotBottom} strokeWidth="1" />
      </g>
      <g className="fill-current text-text-secondary">
        {ticks.map((tick) => (
          <text key={tick} x={left - 6} y={yFor(tick) + 3} textAnchor="end" fontSize="11">
            {tick}
          </text>
        ))}
      </g>
      <g className="text-accent-primary">
        {baselineY !== null ? (
          <line x1={left} x2={width - right} y1={baselineY} y2={baselineY} stroke="currentColor" strokeOpacity={0.45} strokeDasharray="4 4" />
        ) : null}
        {segments.map((points) => (
          <polyline key={points} points={points} fill="none" stroke="currentColor" strokeWidth="2" />
        ))}
        {known.map((point) => (
          <circle key={point.index} cx={xFor(point.index)} cy={yFor(point.value)} r="2.5" fill="currentColor" />
        ))}
      </g>
      <g className="fill-current text-text-secondary">
        {dates.map((date, index) => {
          const axis = dayAxisLabel(date, false);
          const x = xFor(index);
          if (rotatedDays) {
            return (
              <text
                key={date}
                x={x}
                y={plotBottom + 8}
                textAnchor="end"
                fontSize={dayFont}
                transform={`rotate(-65 ${x} ${plotBottom + 8})`}
              >
                {axis.name} {axis.title}
              </text>
            );
          }
          return (
            <g key={date}>
              <text x={x} y={plotBottom + 14} textAnchor="middle" fontSize={dayFont}>{axis.name}</text>
              <text x={x} y={plotBottom + 26} textAnchor="middle" fontSize={dayFont}>{axis.title}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function dayAxisLabel(dateKey: string, compact: boolean): { name: string; title: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateKey);
  if (!match) return { name: dateKey, title: '' };
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' });
  return {
    name: compact ? weekday.slice(0, 1) : weekday,
    title: String(date.getDate()),
  };
}

function scoreTicks(min: number, max: number): number[] {
  if (min === max) {
    const step = Math.max(1, niceStep(Math.max(1, Math.abs(min) * 0.2)));
    return [min - step, min, min + step];
  }
  const step = Math.max(1, niceStep((max - min) / 3));
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= end + step * 0.001; value += step) ticks.push(value);
  return ticks.length > 1 ? ticks : [start, start + step];
}

function niceStep(rough: number): number {
  const power = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  const fraction = rough / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
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
