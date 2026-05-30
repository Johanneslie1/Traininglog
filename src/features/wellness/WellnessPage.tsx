import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getWellnessByDate, saveWellnessLog } from '@/services/wellnessService';
import { WELLNESS_METRICS, WellnessMetricKey } from '@/types/wellness';
import { DailyDateHeader } from '@/features/daily-entry/DailyDateHeader';
import { useDailyDateNavigation } from '@/features/daily-entry/useDailyDateNavigation';
import toast from 'react-hot-toast';

const SCORE_DESCRIPTORS: Record<WellnessMetricKey, string[]> = {
  sleepQuality: [
    'Awful',
    'Very poor',
    'Poor',
    'Uneven',
    'Okay',
    'Good',
    'Excellent',
  ],
  fatigue: [
    'Fresh',
    'Light',
    'Managed',
    'Noticeable',
    'Heavy',
    'Drained',
    'Exhausted',
  ],
  muscleSoreness: [
    'Loose',
    'Fine',
    'Light',
    'Noticeable',
    'Tight',
    'Sore',
    'Very sore',
  ],
  stress: [
    'Calm',
    'Settled',
    'Stable',
    'Busy',
    'Loaded',
    'Pressured',
    'Maxed',
  ],
  mood: [
    'Flat',
    'Low',
    'Off',
    'Neutral',
    'Okay',
    'Good',
    'Flying',
  ],
  readiness: [
    'No go',
    'Low',
    'Moderate',
    'Good',
    'Peak',
  ],
};

const SCORE_BADGE_LABELS = {
  selected: 'Locked in',
  empty: 'Drag or tap',
};

/** Returns a Tailwind bg/text color class pair for a score, given the metric polarity. */
function getScoreColor(score: number, highIsGood: boolean, scaleMax: number): string {
  const goodRatio = highIsGood
    ? (score - 1) / (scaleMax - 1)
    : (scaleMax - score) / (scaleMax - 1);

  if (goodRatio >= 0.75) return 'bg-green-500 text-white';
  if (goodRatio >= 0.58) return 'bg-green-400 text-white';
  if (goodRatio >= 0.42) return 'bg-yellow-400 text-gray-900';
  if (goodRatio >= 0.25) return 'bg-orange-400 text-white';
  return 'bg-red-500 text-white';
}

type Scores = Partial<Record<WellnessMetricKey, number>>;

function getDescriptor(key: WellnessMetricKey, score: number | undefined): string {
  if (!score) return SCORE_BADGE_LABELS.empty;
  return SCORE_DESCRIPTORS[key][score - 1] || SCORE_BADGE_LABELS.selected;
}

function getScoreFillPercent(score: number | undefined, scaleMax: number): number {
  if (!score) return 0;
  return ((score - 1) / (scaleMax - 1)) * 100;
}

function buildTrackGradient(highIsGood: boolean, score: number | undefined, scaleMax: number): string {
  const direction = highIsGood ? '90deg' : '270deg';
  const baseGradient = `linear-gradient(${direction}, #ef4444 0%, #f59e0b 45%, #22c55e 100%)`;

  if (!score) {
    return `linear-gradient(90deg, rgba(148,163,184,0.24) 0%, rgba(148,163,184,0.24) 100%)`;
  }

  const fillPercent = getScoreFillPercent(score, scaleMax);
  return `linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.12) ${fillPercent}%, rgba(255,255,255,0.03) ${fillPercent}%, rgba(255,255,255,0.03) 100%), ${baseGradient}`;
}

interface WellnessSliderProps {
  label: string;
  description: string;
  highIsGood: boolean;
  scaleMax: number;
  metricKey: WellnessMetricKey;
  value?: number;
  onChange: (value: number) => void;
  onClear: () => void;
}

const WellnessSlider: React.FC<WellnessSliderProps> = ({
  label,
  description,
  highIsGood,
  scaleMax,
  metricKey,
  value,
  onChange,
  onClear,
}) => {
  const scoreOptions = Array.from({ length: scaleMax }, (_, i) => i + 1);
  const selectedColor = value ? getScoreColor(value, highIsGood, scaleMax) : 'bg-bg-tertiary text-text-secondary';
  const descriptor = getDescriptor(metricKey, value);
  const thumbPosition = value ? `${getScoreFillPercent(value, scaleMax)}%` : '0%';
  const accentGlow = value
    ? highIsGood
      ? 'shadow-[0_0_0_1px_rgba(34,197,94,0.25),0_18px_40px_rgba(34,197,94,0.18)]'
      : 'shadow-[0_0_0_1px_rgba(249,115,22,0.28),0_18px_40px_rgba(249,115,22,0.18)]'
    : 'shadow-[0_0_0_1px_rgba(148,163,184,0.12),0_10px_30px_rgba(15,23,42,0.18)]';

  return (
    <div className={[
      'rounded-3xl p-4 md:p-5 space-y-4 border overflow-hidden relative',
      'bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]',
      'border-border/70 backdrop-blur-sm',
      accentGlow,
    ].join(' ')}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-medium text-text-primary">{label}</h2>
          <p className="text-xs text-text-secondary mt-0.5 truncate">{description}</p>
        </div>

        <div className="flex items-start gap-2 shrink-0">
          <button
            type="button"
            onClick={onClear}
            disabled={value === undefined}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-bg-tertiary hover:bg-bg-primary text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
          >
            Clear
          </button>

          <div className="text-right min-w-[5.75rem]">
            <div className={[
              'inline-flex items-center justify-center min-w-[3.4rem] h-11 px-3 rounded-2xl text-xl font-semibold transition-all border',
              value ? 'border-white/15 ring-1 ring-white/10 shadow-lg' : 'border-border',
              selectedColor,
            ].join(' ')}>
              {value ?? '–'}
            </div>
            <p className="text-[11px] text-text-secondary mt-1">{descriptor}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className="relative rounded-[1.6rem] px-3 py-4 border border-white/10 overflow-hidden bg-slate-950/10"
          style={{ background: buildTrackGradient(highIsGood, value, scaleMax) }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_35%,transparent_65%,rgba(255,255,255,0.08))] pointer-events-none" />
          <div className="absolute inset-y-3 left-3 right-3 rounded-[1.2rem] border border-white/10 pointer-events-none" />

          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${scaleMax}, minmax(0, 1fr))` }}
          >
            {scoreOptions.map((score) => {
              const isActive = value === score;
              const isFilled = value !== undefined && score <= value;

              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => onChange(score)}
                  className={[
                    'relative h-12 rounded-xl text-sm font-semibold transition-all duration-200 border',
                    isActive
                      ? 'border-white/80 bg-white/25 text-white scale-[1.06] -translate-y-0.5 shadow-[0_10px_24px_rgba(255,255,255,0.16)]'
                      : isFilled
                      ? 'border-white/20 bg-white/12 text-white/95'
                      : 'border-white/10 bg-black/10 text-white/70 hover:bg-white/10 hover:-translate-y-0.5',
                  ].join(' ')}
                  aria-label={`${label}: ${score}`}
                  aria-pressed={isActive}
                >
                  {score}
                </button>
              );
            })}
          </div>

          {value && (
            <div
              className="pointer-events-none absolute -top-2 -translate-x-1/2"
              style={{ left: thumbPosition }}
            >
              <div className="px-2 py-1 rounded-full bg-white text-slate-900 text-[11px] font-semibold shadow-[0_8px_18px_rgba(255,255,255,0.2)]">
                {value}
              </div>
            </div>
          )}
        </div>

        <input
          type="range"
          min={1}
          max={scaleMax}
          step={1}
          value={value ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={`${label} slider`}
        />
      </div>

    </div>
  );
};

function convertLegacyReadinessForInput(value: number | undefined): number | undefined {
  if (value === undefined || value <= 5) return value;
  if (value <= 2) return 1;
  if (value <= 4) return 2;
  if (value <= 6) return 3;
  if (value <= 8) return 4;
  return 5;
}

const WellnessPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    dateInputRef,
    selectedDate,
    dateKey,
    todayKey,
    isToday,
    isFuture,
    selectDateKey,
    openDatePicker,
    goToPreviousDay,
    goToNextDay,
    jumpToToday,
  } = useDailyDateNavigation();
  const [scores, setScores] = useState<Scores>({});
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [entryExists, setEntryExists] = useState(false);

  const loadEntry = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const entry = await getWellnessByDate(user.id, dateKey);
      if (entry) {
        setEntryExists(true);
        setScores({
          sleepQuality: entry.sleepQuality,
          fatigue: entry.fatigue,
          muscleSoreness: entry.muscleSoreness,
          stress: entry.stress,
          mood: entry.mood,
          readiness: convertLegacyReadinessForInput(entry.readiness),
        });
        setNotes(entry.notes ?? '');
      } else {
        setEntryExists(false);
        setScores({});
        setNotes('');
      }
    } catch (err) {
      console.error('Failed to load wellness entry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, dateKey]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const handleScoreSelect = (key: WellnessMetricKey, value: number) => {
    setScores((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleScoreClear = (key: WellnessMetricKey) => {
    setScores((prev) => ({
      ...prev,
      [key]: undefined,
    }));
  };

  const hasAnyScore = Object.values(scores).some((v) => v !== undefined);

  const handleSave = async () => {
    if (!user?.id || !hasAnyScore) return;
    setIsSaving(true);
    try {
      await saveWellnessLog(dateKey, scores, notes.trim() || undefined);
      setEntryExists(true);
      toast.success('Wellness logged');
    } catch (err) {
      console.error('Failed to save wellness:', err);
      toast.error('Failed to save — please try again');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="text-text-primary pb-24">
      {/* Header */}
      <DailyDateHeader
        title="Wellness Check-in"
        selectedDate={selectedDate}
        dateKey={dateKey}
        todayKey={todayKey}
        isToday={isToday}
        statusText={isLoading ? 'Loading entry...' : entryExists ? 'Editing saved entry' : 'No entry saved yet'}
        inputRef={dateInputRef}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onOpenCalendar={openDatePicker}
        onDateChange={selectDateKey}
        onJumpToday={jumpToToday}
      />

      {/* Body */}
      <div className="max-w-xl mx-auto py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary" />
          </div>
        ) : isFuture ? (
          <div className="text-center py-12 text-text-secondary">
            Can&apos;t log wellness for a future date.
          </div>
        ) : (
          <>
            {WELLNESS_METRICS.map(({ key, label, description, highIsGood, scaleMax }) => (
              <WellnessSlider
                key={key}
                label={label}
                description={description}
                highIsGood={highIsGood}
                scaleMax={scaleMax}
                metricKey={key}
                value={scores[key]}
                onChange={(value) => handleScoreSelect(key, value)}
                onClear={() => handleScoreClear(key)}
              />
            ))}

            {/* Notes */}
            <div className="bg-bg-secondary rounded-xl p-4 space-y-2">
              <h2 className="font-medium text-text-primary">Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional — add any context (e.g. poor sleep due to travel, DOMS after leg day…)"
                rows={3}
                className="w-full bg-bg-tertiary text-text-primary placeholder-text-tertiary text-sm rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isSaving || !hasAnyScore}
              className="w-full bg-accent-primary text-text-inverse py-3 rounded-xl font-medium text-sm transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving…' : entryExists ? 'Update Wellness Log' : 'Save Wellness Log'}
            </button>

            {!hasAnyScore && (
              <p className="text-center text-xs text-text-secondary">
                Select at least one score to save.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WellnessPage;
