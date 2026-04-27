import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getWellnessByDate, saveWellnessLog } from '@/services/wellnessService';
import { WELLNESS_METRICS, WellnessMetricKey } from '@/types/wellness';
import { toLocalDateString } from '@/utils/dateUtils';
import toast from 'react-hot-toast';

/** Returns a YYYY-MM-DD string for any Date in local timezone. */
function toDateKey(date: Date): string {
  return toLocalDateString(date);
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const SCORE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const SCORE_DESCRIPTORS: Record<WellnessMetricKey, string[]> = {
  sleepQuality: [
    'Awful',
    'Very poor',
    'Poor',
    'Restless',
    'Uneven',
    'Okay',
    'Decent',
    'Good',
    'Great',
    'Elite',
  ],
  fatigue: [
    'Fresh',
    'Light',
    'Easy',
    'Managed',
    'Noticeable',
    'Heavy',
    'Drained',
    'Rough',
    'Spent',
    'Exhausted',
  ],
  muscleSoreness: [
    'Loose',
    'Fine',
    'Light',
    'Mild',
    'Noticeable',
    'Tight',
    'Sore',
    'Stiff',
    'Very sore',
    'Destroyed',
  ],
  stress: [
    'Calm',
    'Settled',
    'Easy',
    'Stable',
    'Busy',
    'Loaded',
    'Pressured',
    'High',
    'Intense',
    'Maxed',
  ],
  mood: [
    'Flat',
    'Low',
    'Off',
    'Uneven',
    'Neutral',
    'Okay',
    'Good',
    'Upbeat',
    'Great',
    'Flying',
  ],
  readiness: [
    'No go',
    'Very low',
    'Low',
    'Below par',
    'Moderate',
    'Getting there',
    'Good',
    'Strong',
    'Very ready',
    'Peak',
  ],
};

const SCORE_BADGE_LABELS = {
  selected: 'Locked in',
  empty: 'Drag or tap',
};

/** Returns a Tailwind bg/text color class pair for a score 1–10, given the metric polarity. */
function getScoreColor(score: number, highIsGood: boolean): string {
  // Normalise so 1 is always the "bad" end and 10 the "good" end for color logic
  const goodScore = highIsGood ? score : 11 - score;

  if (goodScore >= 8) return 'bg-green-500 text-white';
  if (goodScore >= 6) return 'bg-green-400 text-white';
  if (goodScore >= 5) return 'bg-yellow-400 text-gray-900';
  if (goodScore >= 3) return 'bg-orange-400 text-white';
  return 'bg-red-500 text-white';
}

type Scores = Partial<Record<WellnessMetricKey, number>>;

function getDescriptor(key: WellnessMetricKey, score: number | undefined): string {
  if (!score) return SCORE_BADGE_LABELS.empty;
  return SCORE_DESCRIPTORS[key][score - 1] || SCORE_BADGE_LABELS.selected;
}

function getScoreFillPercent(score: number | undefined): number {
  if (!score) return 0;
  return ((score - 1) / 9) * 100;
}

function buildTrackGradient(highIsGood: boolean, score: number | undefined): string {
  const direction = highIsGood ? '90deg' : '270deg';
  const baseGradient = `linear-gradient(${direction}, #ef4444 0%, #f59e0b 45%, #22c55e 100%)`;

  if (!score) {
    return `linear-gradient(90deg, rgba(148,163,184,0.24) 0%, rgba(148,163,184,0.24) 100%)`;
  }

  const fillPercent = getScoreFillPercent(score);
  return `linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.12) ${fillPercent}%, rgba(255,255,255,0.03) ${fillPercent}%, rgba(255,255,255,0.03) 100%), ${baseGradient}`;
}

interface WellnessSliderProps {
  label: string;
  description: string;
  highIsGood: boolean;
  metricKey: WellnessMetricKey;
  value?: number;
  onChange: (value: number) => void;
  onClear: () => void;
}

const WellnessSlider: React.FC<WellnessSliderProps> = ({
  label,
  description,
  highIsGood,
  metricKey,
  value,
  onChange,
  onClear,
}) => {
  const selectedColor = value ? getScoreColor(value, highIsGood) : 'bg-bg-tertiary text-text-secondary';
  const descriptor = getDescriptor(metricKey, value);
  const thumbPosition = value ? `${getScoreFillPercent(value)}%` : '0%';
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
          style={{ background: buildTrackGradient(highIsGood, value) }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_35%,transparent_65%,rgba(255,255,255,0.08))] pointer-events-none" />
          <div className="absolute inset-y-3 left-3 right-3 rounded-[1.2rem] border border-white/10 pointer-events-none" />

          <div className="grid grid-cols-10 gap-1">
            {SCORE_OPTIONS.map((score) => {
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
          max={10}
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

const WellnessPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [scores, setScores] = useState<Scores>({});
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dateKey = toDateKey(selectedDate);

  const loadEntry = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const entry = await getWellnessByDate(user.id, dateKey);
      if (entry) {
        setScores({
          sleepQuality: entry.sleepQuality,
          fatigue: entry.fatigue,
          muscleSoreness: entry.muscleSoreness,
          stress: entry.stress,
          mood: entry.mood,
          readiness: entry.readiness,
        });
        setNotes(entry.notes ?? '');
      } else {
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
      toast.success('Wellness logged');
    } catch (err) {
      console.error('Failed to save wellness:', err);
      toast.error('Failed to save — please try again');
    } finally {
      setIsSaving(false);
    }
  };

  const isToday = toDateKey(selectedDate) === toDateKey(today);
  const isFuture = selectedDate > today;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-secondary border-b border-border">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary"
            aria-label="Previous day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h1 className="text-base font-semibold text-text-primary">Wellness Check-in</h1>
            <p className="text-sm text-text-secondary">{formatDisplayDate(selectedDate)}</p>
          </div>

          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            disabled={isToday}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {!isToday && (
          <div className="max-w-xl mx-auto px-4 pb-2">
            <button
              onClick={() => setSelectedDate(today)}
              className="text-xs text-accent-primary underline"
            >
              Jump to today
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
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
            {WELLNESS_METRICS.map(({ key, label, description, highIsGood }) => (
              <WellnessSlider
                key={key}
                label={label}
                description={description}
                highIsGood={highIsGood}
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
              className="w-full bg-accent-primary text-white py-3 rounded-xl font-medium text-sm transition-colors hover:bg-accent-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving…' : 'Save Wellness Log'}
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
