import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { RootState } from '@/store/store';
import { ConfirmDialog } from '@/components/ui';
import {
  deleteAssessment,
  listAssessments,
  saveAssessment,
} from '@/services/assessmentService';
import {
  AssessmentKind,
  AssessmentLog,
  BODY_COMPOSITION_METHODS,
  BodyCompositionDraft,
  VO2MAX_METHODS,
  Vo2maxDraft,
} from '@/types/assessment';
import {
  bodyDraftFromLog,
  createBodyCompositionDraft,
  createVo2maxDraft,
  formatAssessmentDate,
  formatAssessmentDetail,
  parseBodyComposition,
  parseVo2max,
  previewBmi,
  vo2DraftFromLog,
} from '@/utils/assessmentLog';
import { toLocalDateString } from '@/utils/dateUtils';

const TABS: { id: AssessmentKind; label: string }[] = [
  { id: 'body_composition', label: 'Body composition' },
  { id: 'vo2max', label: 'VO2max' },
];

const fieldClass = 'w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary';

function isUntouchedDraft<T extends object>(draft: T, blank: T): boolean {
  return (Object.keys(blank) as (keyof T)[]).every((key) => draft[key] === blank[key]);
}

interface MetricFieldProps {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
}

const MetricField: React.FC<MetricFieldProps> = ({ id, label, unit, value, onChange }) => (
  <div className="block space-y-1">
    <label htmlFor={id} className="block text-xs text-text-secondary">{label}</label>
    <span className="relative block">
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={id === 'max-heart-rate' ? 'numeric' : 'decimal'}
        className={`${fieldClass} pr-20`}
      />
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">
        {unit}
      </span>
    </span>
  </div>
);

const TestsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const todayKey = toLocalDateString(new Date());
  const [activeKind, setActiveKind] = useState<AssessmentKind>('body_composition');
  const [entries, setEntries] = useState<AssessmentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bodyDraft, setBodyDraft] = useState<BodyCompositionDraft>(() => createBodyCompositionDraft(todayKey));
  const [vo2Draft, setVo2Draft] = useState<Vo2maxDraft>(() => createVo2maxDraft(todayKey));
  const [bodySourceId, setBodySourceId] = useState<string | null>(null);
  const [vo2SourceId, setVo2SourceId] = useState<string | null>(null);
  const prefilledKinds = useRef(new Set<AssessmentKind>());
  const bodyDraftRef = useRef(bodyDraft);
  const vo2DraftRef = useRef(vo2Draft);
  bodyDraftRef.current = bodyDraft;
  vo2DraftRef.current = vo2Draft;

  const parsed = useMemo(
    () => activeKind === 'body_composition'
      ? parseBodyComposition(bodyDraft, todayKey)
      : parseVo2max(vo2Draft, todayKey),
    [activeKind, bodyDraft, vo2Draft, todayKey]
  );
  const sourceId = activeKind === 'body_composition' ? bodySourceId : vo2SourceId;
  const bmi = previewBmi(bodyDraft.heightCm, bodyDraft.bodyMassKg);
  const activeDate = activeKind === 'body_composition' ? bodyDraft.date : vo2Draft.date;

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setIsLoading(true);

    listAssessments(user.id, activeKind)
      .then((rows) => {
        if (!active) return;
        setEntries(rows);
        if (prefilledKinds.current.has(activeKind)) return;
        prefilledKinds.current.add(activeKind);
        const todayEntry = rows.find((row) => row.date === todayKey);
        if (!todayEntry) return;
        if (activeKind === 'body_composition') {
          if (!isUntouchedDraft(bodyDraftRef.current, createBodyCompositionDraft(todayKey))) return;
          setBodyDraft(bodyDraftFromLog(todayEntry));
          setBodySourceId(todayEntry.id);
          return;
        }
        if (!isUntouchedDraft(vo2DraftRef.current, createVo2maxDraft(todayKey))) return;
        setVo2Draft(vo2DraftFromLog(todayEntry));
        setVo2SourceId(todayEntry.id);
      })
      .catch((error) => {
        console.error('Failed to load tests:', error);
        if (active) toast.error('Failed to load tests');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeKind, todayKey, user?.id]);

  const applyLog = (log: AssessmentLog) => {
    if (log.kind === 'body_composition') {
      setBodyDraft(bodyDraftFromLog(log));
      setBodySourceId(log.id);
      setActiveKind('body_composition');
      return;
    }
    setVo2Draft(vo2DraftFromLog(log));
    setVo2SourceId(log.id);
    setActiveKind('vo2max');
  };

  const clearActiveDraft = () => {
    if (activeKind === 'body_composition') {
      setBodyDraft(createBodyCompositionDraft(todayKey));
      setBodySourceId(null);
      return;
    }
    setVo2Draft(createVo2maxDraft(todayKey));
    setVo2SourceId(null);
  };

  const handleSave = async () => {
    if (!parsed.ok) return;
    setIsSaving(true);
    try {
      const id = await saveAssessment(parsed.value, sourceId ?? undefined);
      const rows = user?.id ? await listAssessments(user.id, activeKind) : [];
      setEntries(rows);
      const saved = rows.find((row) => row.id === id);
      if (saved) applyLog(saved);
      toast.success(sourceId ? 'Test updated' : 'Test logged');
    } catch (error) {
      console.error('Failed to save test:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save test');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sourceId) return;
    setIsDeleting(true);
    try {
      await deleteAssessment(sourceId);
      setEntries((current) => current.filter((entry) => entry.id !== sourceId));
      clearActiveDraft();
      setConfirmDelete(false);
      toast.success('Test deleted');
    } catch (error) {
      console.error('Failed to delete test:', error);
      toast.error('Failed to delete test');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="pb-24 text-text-primary">
      <div className="mx-auto max-w-xl space-y-4">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary">Athlete</p>
          <h1 className="text-2xl font-bold">Tests</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Log body composition and VO2max when you measure them.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Test type">
          {TABS.map((tab) => {
            const selected = activeKind === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`test-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`test-panel-${tab.id}`}
                onClick={() => setActiveKind(tab.id)}
                className={[
                  'min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                  selected
                    ? 'border-accent-primary bg-accent-primary text-text-on-accent'
                    : 'border-border bg-bg-secondary text-text-secondary hover:text-text-primary',
                ].join(' ')}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <section
          role="tabpanel"
          id={`test-panel-${activeKind}`}
          aria-labelledby={`test-tab-${activeKind}`}
          className="space-y-4 rounded-2xl border border-border bg-bg-secondary p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-text-secondary">
              {sourceId ? `Editing ${formatAssessmentDate(activeDate)}` : 'New entry'}
            </p>
            <button
              type="button"
              onClick={clearActiveDraft}
              className="rounded-lg border border-border bg-bg-tertiary px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary"
            >
              Clear
            </button>
          </div>

          <label htmlFor="test-date" className="block space-y-1">
            <span className="text-xs text-text-secondary">Date</span>
            <input
              id="test-date"
              type="date"
              max={todayKey}
              value={activeDate}
              onChange={(event) => {
                const date = event.target.value;
                if (activeKind === 'body_composition') {
                  setBodyDraft((current) => ({ ...current, date }));
                  return;
                }
                setVo2Draft((current) => ({ ...current, date }));
              }}
              className={fieldClass}
            />
          </label>

          {activeKind === 'body_composition' ? (
            <>
              <label htmlFor="body-method" className="block space-y-1">
                <span className="text-xs text-text-secondary">Method</span>
                <select
                  id="body-method"
                  value={bodyDraft.method}
                  onChange={(event) => setBodyDraft((current) => ({
                    ...current,
                    method: event.target.value as BodyCompositionDraft['method'],
                  }))}
                  className={fieldClass}
                >
                  {BODY_COMPOSITION_METHODS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricField id="height" label="Height" unit="cm" value={bodyDraft.heightCm} onChange={(heightCm) => setBodyDraft((current) => ({ ...current, heightCm }))} />
                <MetricField id="body-mass" label="Body mass" unit="kg" value={bodyDraft.bodyMassKg} onChange={(bodyMassKg) => setBodyDraft((current) => ({ ...current, bodyMassKg }))} />
                <MetricField id="body-fat" label="Body fat" unit="%" value={bodyDraft.bodyFatPercent} onChange={(bodyFatPercent) => setBodyDraft((current) => ({ ...current, bodyFatPercent }))} />
                <MetricField id="fat-mass" label="Fat mass" unit="kg" value={bodyDraft.fatMassKg} onChange={(fatMassKg) => setBodyDraft((current) => ({ ...current, fatMassKg }))} />
                <MetricField id="lean-mass" label="Lean mass" unit="kg" value={bodyDraft.leanMassKg} onChange={(leanMassKg) => setBodyDraft((current) => ({ ...current, leanMassKg }))} />
              </div>
              {bmi !== null && (
                <p className="text-sm text-text-secondary">
                  BMI <span className="font-medium text-text-primary">{bmi.toFixed(1)}</span>
                </p>
              )}
            </>
          ) : (
            <>
              <label htmlFor="vo2-method" className="block space-y-1">
                <span className="text-xs text-text-secondary">Method</span>
                <select
                  id="vo2-method"
                  value={vo2Draft.method}
                  onChange={(event) => setVo2Draft((current) => ({
                    ...current,
                    method: event.target.value as Vo2maxDraft['method'],
                  }))}
                  className={fieldClass}
                >
                  {VO2MAX_METHODS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricField id="vo2max" label="VO2max" unit="ml/kg/min" value={vo2Draft.vo2maxMlKgMin} onChange={(vo2maxMlKgMin) => setVo2Draft((current) => ({ ...current, vo2maxMlKgMin }))} />
                <MetricField id="absolute-vo2" label="Absolute VO2" unit="L/min" value={vo2Draft.vo2maxLMin} onChange={(vo2maxLMin) => setVo2Draft((current) => ({ ...current, vo2maxLMin }))} />
                <MetricField id="max-heart-rate" label="Max heart rate" unit="bpm" value={vo2Draft.maxHeartRate} onChange={(maxHeartRate) => setVo2Draft((current) => ({ ...current, maxHeartRate }))} />
              </div>
            </>
          )}

          <label htmlFor="test-notes" className="block space-y-1">
            <span className="text-xs text-text-secondary">Notes</span>
            <textarea
              id="test-notes"
              rows={3}
              value={activeKind === 'body_composition' ? bodyDraft.notes : vo2Draft.notes}
              onChange={(event) => {
                const notes = event.target.value;
                if (activeKind === 'body_composition') {
                  setBodyDraft((current) => ({ ...current, notes }));
                  return;
                }
                setVo2Draft((current) => ({ ...current, notes }));
              }}
              placeholder="Protocol, conditions, or lab name"
              className={`${fieldClass} resize-none`}
            />
          </label>

          {!parsed.ok && (
            <p className="text-sm text-text-secondary">{parsed.message}</p>
          )}

          <button
            type="button"
            onClick={() => { void handleSave(); }}
            disabled={!parsed.ok || isSaving}
            className="w-full rounded-xl bg-accent-primary py-3 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? 'Saving…' : sourceId ? 'Update test' : 'Save test'}
          </button>

          {sourceId && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full rounded-xl border border-border py-3 text-sm text-text-secondary hover:text-text-primary"
            >
              Delete test
            </button>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium">
            {activeKind === 'body_composition' ? 'Recent body composition' : 'Recent VO2max'}
          </h2>
          {isLoading ? (
            <p className="text-sm text-text-secondary">Loading entries...</p>
          ) : entries.length === 0 ? (
            <p className="rounded-2xl border border-border bg-bg-secondary px-4 py-6 text-sm text-text-secondary">
              Log a test to start this history.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-border bg-bg-secondary">
              {entries.map((entry) => (
                <li key={entry.id} className="border-t border-border first:border-t-0">
                  <button
                    type="button"
                    onClick={() => applyLog(entry)}
                    aria-pressed={entry.id === sourceId}
                    className={[
                      'flex w-full items-center justify-between gap-3 px-4 py-3 text-left',
                      entry.id === sourceId ? 'bg-bg-tertiary' : 'hover:bg-bg-tertiary',
                    ].join(' ')}
                  >
                    <span>
                      <span className="block text-sm font-medium">{formatAssessmentDetail(entry)}</span>
                    </span>
                    <time className="shrink-0 text-sm text-text-tertiary" dateTime={entry.date}>
                      {formatAssessmentDate(entry.date)}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete this test?"
        description="This removes the selected result from your history."
        confirmLabel="Delete test"
        isConfirming={isDeleting}
        onConfirm={() => { void handleDelete(); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};

export default TestsPage;
