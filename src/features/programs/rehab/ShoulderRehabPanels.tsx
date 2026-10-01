import React, { useState } from 'react';
import { Program, ProgramSession } from '@/types/program';
import { RehabPainLog, RehabPainLogInput, RehabSessionNotice, SymmetryTestResult } from '@/types/rehabProgress';
import { Button } from '@/components/ui';
import { toLocalDateString } from '@/utils/dateUtils';
import {
  SYMMETRY_TARGET_PERCENT,
  getPainWarnings,
  isPainScore,
  rehabSessionKey,
  symmetryPercent,
} from '@/utils/shoulderRehab';
import { useRehabProgress } from '@/features/programs/rehab/useRehabProgress';

const PainScale: React.FC<{
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <fieldset className="min-w-0">
    <legend className="mb-1 text-xs font-medium text-text-secondary">{label}</legend>
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: 11 }, (_, score) => (
        <button
          key={score}
          type="button"
          aria-pressed={value === score}
          onClick={() => onChange(score)}
          className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
            value === score
              ? 'bg-accent-primary text-text-on-accent'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
          }`}
        >
          {score}
        </button>
      ))}
    </div>
  </fieldset>
);

export const RehabRulesNotice: React.FC<{
  rules?: string[];
  stopSigns?: string;
  compact?: boolean;
}> = ({ rules = [], stopSigns, compact = false }) => {
  if (rules.length === 0 && !stopSigns) return null;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {rules.length > 0 && (
        <div className="rounded-2xl border border-border bg-bg-secondary p-4">
          <h2 className="text-sm font-semibold text-text-primary">Rules</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      )}
      {stopSigns && (
        <div className="rounded-2xl border border-warning-border bg-warning-bg p-4">
          <h2 className="text-sm font-semibold text-warning-text">Stop signs</h2>
          <p className="mt-1 text-sm text-warning-text">{stopSigns}</p>
        </div>
      )}
    </div>
  );
};

const PainWarnings: React.FC<{ log: RehabPainLog }> = ({ log }) => {
  const warnings = getPainWarnings(log);
  if (warnings.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1">
      {warnings.map((warning) => (
        <li key={warning} className="text-sm text-warning-text">{warning}</li>
      ))}
    </ul>
  );
};

export const RehabPainLogger: React.FC<{
  sessionKey: string;
  sessionName: string;
  week?: number;
  logs: RehabPainLog[];
  onSave: (input: {
    sessionKey: string;
    sessionName: string;
    week?: number;
    date: string;
    painBefore: number;
    painDuring: number;
    painNextMorning?: number;
  }) => Promise<void>;
  onSaveMorning: (logId: string, painNextMorning: number) => Promise<void>;
}> = ({ sessionKey, sessionName, week, logs, onSave, onSaveMorning }) => {
  const [date, setDate] = useState(() => toLocalDateString(new Date()));
  const [painBefore, setPainBefore] = useState<number | null>(null);
  const [painDuring, setPainDuring] = useState<number | null>(null);
  const [painNextMorning, setPainNextMorning] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const sessionLogs = logs.filter((log) => log.sessionKey === sessionKey).slice().reverse();

  const handleSave = async () => {
    if (date > toLocalDateString(new Date())) {
      setFormError('Cannot log pain for a future date.');
      return;
    }
    if (painBefore == null || painDuring == null) {
      setFormError('Log pain before the session and pain during the session.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onSave({
        sessionKey,
        sessionName,
        week,
        date,
        painBefore,
        painDuring,
        ...(painNextMorning != null ? { painNextMorning } : {}),
      });
      setPainBefore(null);
      setPainDuring(null);
      setPainNextMorning(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save pain');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-bg-primary p-4">
      <h3 className="text-sm font-semibold text-text-primary">Pain log</h3>
      <p className="mt-1 text-xs text-text-tertiary">
        Pain up to 3/10 during exercise is OK if it is back to baseline by the next morning.
      </p>
      <div className="mt-3 space-y-3">
        <label className="block text-xs font-medium text-text-secondary">
          Session date
          <input
            type="date"
            value={date}
            max={toLocalDateString(new Date())}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary"
          />
        </label>
        <PainScale label="Pain before the session" value={painBefore} onChange={setPainBefore} />
        <PainScale label="Pain during the session" value={painDuring} onChange={setPainDuring} />
        <PainScale label="Next morning (if you know it)" value={painNextMorning} onChange={setPainNextMorning} />
        {formError && <p className="text-sm text-error-text">{formError}</p>}
        <Button type="button" size="sm" onClick={handleSave} isLoading={saving}>
          Save pain log
        </Button>
      </div>
      {sessionLogs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {sessionLogs.map((log) => (
            <PainLogRow key={log.id} log={log} onSaveMorning={onSaveMorning} />
          ))}
        </ul>
      )}
    </div>
  );
};

const PainLogRow: React.FC<{
  log: RehabPainLog;
  onSaveMorning: (logId: string, painNextMorning: number) => Promise<void>;
}> = ({ log, onSaveMorning }) => {
  const [morning, setMorning] = useState<number | null>(log.painNextMorning ?? null);
  const [saving, setSaving] = useState(false);

  return (
    <li className="rounded-xl border border-border bg-bg-secondary px-3 py-2">
      <p className="text-sm text-text-primary">
        {log.date}: before {log.painBefore}/10, during {log.painDuring}/10
        {typeof log.painNextMorning === 'number' ? `, next morning ${log.painNextMorning}/10` : ''}
      </p>
      <PainWarnings log={log} />
      {typeof log.painNextMorning !== 'number' && (
        <div className="mt-2">
          <PainScale label="Next morning" value={morning} onChange={setMorning} />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-2"
            disabled={morning == null || saving}
            isLoading={saving}
            onClick={async () => {
              if (morning == null || !isPainScore(morning)) return;
              setSaving(true);
              try {
                await onSaveMorning(log.id, morning);
              } finally {
                setSaving(false);
              }
            }}
          >
            Save next morning
          </Button>
        </div>
      )}
    </li>
  );
};

const SymmetryChart: React.FC<{ tests: SymmetryTestResult[] }> = ({ tests }) => {
  const width = 320;
  const height = 140;
  const pad = { left: 28, right: 8, top: 12, bottom: 22 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const yFor = (percent: number) => pad.top + ((100 - percent) / 100) * innerHeight;
  const xFor = (index: number) =>
    pad.left + (tests.length <= 1 ? innerWidth / 2 : (index / (tests.length - 1)) * innerWidth);
  const line = tests.map((test, index) => `${xFor(index)},${yFor(test.symmetryPercent)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3 w-full"
      role="img"
      aria-label={`Symmetry history. Target line at ${SYMMETRY_TARGET_PERCENT} percent.`}
    >
      <line
        x1={pad.left}
        x2={width - pad.right}
        y1={yFor(SYMMETRY_TARGET_PERCENT)}
        y2={yFor(SYMMETRY_TARGET_PERCENT)}
        stroke="currentColor"
        className="text-success-text"
        strokeDasharray="4 3"
      />
      <text x={pad.left} y={yFor(SYMMETRY_TARGET_PERCENT) - 4} className="fill-success-text text-[10px]">
        90%
      </text>
      {tests.length > 1 && (
        <polyline fill="none" stroke="currentColor" className="text-accent-primary" strokeWidth="2" points={line} />
      )}
      {tests.map((test, index) => (
        <circle key={test.id} cx={xFor(index)} cy={yFor(test.symmetryPercent)} r="4" className="fill-accent-primary" />
      ))}
    </svg>
  );
};

export const SymmetryPanel: React.FC<{
  tests: SymmetryTestResult[];
  onAdd: (input: { date: string; weightKg: number; healthyReps: number; injuredReps: number }) => Promise<void>;
}> = ({ tests, onAdd }) => {
  const [date, setDate] = useState(() => toLocalDateString(new Date()));
  const [weightKg, setWeightKg] = useState('3');
  const [healthyReps, setHealthyReps] = useState('');
  const [injuredReps, setInjuredReps] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const healthy = Number(healthyReps);
  const injured = Number(injuredReps);
  const preview = Number.isFinite(healthy) && healthy > 0 && Number.isFinite(injured) && injured >= 0
    ? symmetryPercent(injured, healthy)
    : null;
  const ordered = [...tests].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="rounded-2xl border border-border bg-bg-secondary p-4">
      <h2 className="text-sm font-semibold text-text-primary">Symmetry test</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Side-lying external rotation, same dumbbell, max reps with good form. Healthy side first.
        Symmetry is injured ÷ healthy × 100. Target is {SYMMETRY_TARGET_PERCENT}%.
      </p>
      {ordered.length > 0 && <SymmetryChart tests={ordered} />}
      <ul className="mt-3 space-y-1 text-sm text-text-secondary">
        {ordered.map((test) => (
          <li key={test.id}>
            {test.date}: {test.weightKg} kg, healthy {test.healthyReps}, injured {test.injuredReps} ({test.symmetryPercent}%)
          </li>
        ))}
      </ul>
      <form
        className="mt-4 grid gap-2 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const weight = Number(weightKg);
          if (!date || date > toLocalDateString(new Date()) || !Number.isFinite(weight) || weight <= 0 || !Number.isInteger(healthy) || healthy <= 0 || !Number.isInteger(injured) || injured < 0) {
            setError('Enter a date, weight, healthy reps, and injured reps.');
            return;
          }
          setSaving(true);
          setError(null);
          try {
            await onAdd({ date, weightKg: weight, healthyReps: healthy, injuredReps: injured });
            setHealthyReps('');
            setInjuredReps('');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save symmetry test');
          } finally {
            setSaving(false);
          }
        }}
      >
        <label className="text-xs font-medium text-text-secondary">
          Date
          <input type="date" value={date} max={toLocalDateString(new Date())} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary" />
        </label>
        <label className="text-xs font-medium text-text-secondary">
          Dumbbell (kg)
          <input inputMode="decimal" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary" />
        </label>
        <label className="text-xs font-medium text-text-secondary">
          Healthy side reps
          <input inputMode="numeric" value={healthyReps} onChange={(event) => setHealthyReps(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary" />
        </label>
        <label className="text-xs font-medium text-text-secondary">
          Injured side reps
          <input inputMode="numeric" value={injuredReps} onChange={(event) => setInjuredReps(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary" />
        </label>
        <div className="sm:col-span-2 flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">{preview == null ? 'Symmetry appears after both rep counts.' : `Symmetry ${preview}%`}</p>
          <Button type="submit" size="sm" isLoading={saving}>Save test</Button>
        </div>
        {error && <p className="sm:col-span-2 text-sm text-error-text">{error}</p>}
      </form>
    </section>
  );
};

export const RehabSessionExtras: React.FC<{
  program: Program;
  session: ProgramSession;
  painLogs: RehabPainLog[];
  logging: boolean;
  onSavePain: (input: RehabPainLogInput) => Promise<void>;
  onSaveMorning: (logId: string, painNextMorning: number) => Promise<void>;
  onLogSession: () => void;
  onOpenLog: () => void;
}> = ({
  program,
  session,
  painLogs,
  logging,
  onSavePain,
  onSaveMorning,
  onLogSession,
  onOpenLog,
}) => {
  const sessionKey = rehabSessionKey(session);
  if (!sessionKey) return null;

  return (
    <div className="space-y-3 px-3 pb-3">
      <RehabRulesNotice rules={program.rules} stopSigns={program.stopSigns} compact />
      {session.notes && <p className="text-sm text-text-secondary">{session.notes}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onLogSession} isLoading={logging}>
          Log session
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onOpenLog}>
          Open today&apos;s log
        </Button>
      </div>
      {session.sessionKind === 'daily-activation' && (
        <RehabPainLogger
          sessionKey={sessionKey}
          sessionName={session.name}
          week={session.week}
          logs={painLogs}
          onSave={onSavePain}
          onSaveMorning={onSaveMorning}
        />
      )}
    </div>
  );
};

export const RehabLogBanner: React.FC<{ notice: RehabSessionNotice }> = ({ notice }) => {
  const rehab = useRehabProgress(notice.programId, true);

  return (
    <div className="mb-4 space-y-3">
      <RehabRulesNotice rules={notice.rules} stopSigns={notice.stopSigns} />
      {notice.sessionKey === 'daily' && rehab.progress && (
        <RehabPainLogger
          sessionKey={notice.sessionKey}
          sessionName={notice.sessionName}
          logs={rehab.progress.painLogs}
          onSave={rehab.addPainLog}
          onSaveMorning={rehab.setNextMorningPain}
        />
      )}
    </div>
  );
};
