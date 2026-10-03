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
    'Poor',
    'Okay',
    'Good',
    'Excellent',
  ],
  fatigue: [
    'Fresh',
    'Managed',
    'Noticeable',
    'Drained',
    'Exhausted',
  ],
  muscleSoreness: [
    'Loose',
    'Light',
    'Noticeable',
    'Sore',
    'Very sore',
  ],
  stress: [
    'Calm',
    'Stable',
    'Busy',
    'Pressured',
    'Maxed',
  ],
  mood: [
    'Flat',
    'Low',
    'Neutral',
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

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-bg-secondary p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-text-primary">{label}</h2>
          <p className="mt-0.5 truncate text-xs text-text-secondary">{description}</p>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={value === undefined}
            className="rounded-lg border border-border bg-bg-tertiary px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>

          <div className="min-w-[4.5rem] text-right">
            <div className={[
              'inline-flex h-9 min-w-[2.75rem] items-center justify-center rounded-xl border px-2.5 text-base font-semibold',
              value ? 'border-transparent' : 'border-border',
              selectedColor,
            ].join(' ')}>
              {value ?? '–'}
            </div>
            <p className="mt-1 text-xs text-text-secondary">{descriptor}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${scaleMax}, minmax(0, 1fr))` }}
        >
          {scoreOptions.map((score) => {
            const isActive = value === score;

            return (
              <button
                key={score}
                type="button"
                onClick={() => onChange(score)}
                className={[
                  'relative h-11 rounded-xl border text-sm font-semibold transition-colors',
                  isActive
                    ? 'border-accent-primary bg-accent-primary text-text-on-accent'
                    : 'border-border bg-bg-tertiary text-text-primary hover:border-accent-primary hover:text-accent-primary',
                ].join(' ')}
                aria-label={`${label}: ${score}`}
                aria-pressed={isActive}
              >
                {score}
              </button>
            );
          })}
        </div>

        <input
          type="range"
          min={1}
          max={scaleMax}
          step={1}
          value={value ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`${label} slider`}
        />
      </div>
    </div>
  );
};

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
          readiness: entry.readiness,
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
