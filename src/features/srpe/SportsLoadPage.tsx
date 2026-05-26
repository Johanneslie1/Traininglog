import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { RootState } from '@/store/store';
import {
  calculateSessionLoad,
  getSportsLoadSessionsByDate,
  getSrpeByDate,
  saveSportsLoadSession,
} from '@/services/srpeService';
import { SaveSrpeLogInput, SportsLoadSession, SrpeLog } from '@/types/srpe';
import { addDays, dateKeyToLocalDate, formatDisplayDate, toLocalDateString } from '@/utils/dateUtils';

const RPE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const RPE_DESCRIPTORS = [
  'Very, very easy',
  'Easy',
  'Moderate',
  'Somewhat hard',
  'Hard',
  'Hard+',
  'Very hard',
  'Very hard+',
  'Extremely hard',
  'Maximal',
];

const SPORT_OPTIONS = [
  { value: 'football', label: 'Football' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'handball', label: 'Handball' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'other', label: 'Other sport' },
];

/** Returns a YYYY-MM-DD string for any Date in local timezone. */
function toDateKey(date: Date): string {
  return toLocalDateString(date);
}

function parseOptionalWholeNumber(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function getRpeFillPercent(score: number | undefined): number {
  if (!score) return 0;
  return ((score - 1) / 9) * 100;
}

function buildRpeTrackGradient(score: number | undefined): string {
  if (!score) {
    return 'linear-gradient(90deg, rgba(148,163,184,0.24) 0%, rgba(148,163,184,0.24) 100%)';
  }

  const fillPercent = getRpeFillPercent(score);
  return `linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.12) ${fillPercent}%, rgba(255,255,255,0.03) ${fillPercent}%, rgba(255,255,255,0.03) 100%), linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #ef4444 100%)`;
}

const SportsLoadPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedSportType, setSelectedSportType] = useState('football');
  const [rpe, setRpe] = useState<number | undefined>();
  const [durationMinutes, setDurationMinutes] = useState('');
  const [distanceMeters, setDistanceMeters] = useState('');
  const [calories, setCalories] = useState('');
  const [averageHeartRate, setAverageHeartRate] = useState('');
  const [maxHeartRate, setMaxHeartRate] = useState('');
  const [notes, setNotes] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showOptionalMetrics, setShowOptionalMetrics] = useState(false);
  const [sessions, setSessions] = useState<SportsLoadSession[]>([]);
  const [dailyEntry, setDailyEntry] = useState<SrpeLog | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dateKey = toDateKey(selectedDate);
  const todayKey = toDateKey(today);
  const parsedDuration = Number(durationMinutes);
  const hasValidDuration = Number.isInteger(parsedDuration) && parsedDuration > 0;
  const distanceMetersValue = parseOptionalWholeNumber(distanceMeters);
  const caloriesValue = parseOptionalWholeNumber(calories);
  const averageHeartRateValue = parseOptionalWholeNumber(averageHeartRate);
  const maxHeartRateValue = parseOptionalWholeNumber(maxHeartRate);
  const hasValidOptionalMetrics = [distanceMetersValue, caloriesValue, averageHeartRateValue, maxHeartRateValue]
    .every((value) => value !== null);
  const selectedSportLabel = SPORT_OPTIONS.find((option) => option.value === selectedSportType)?.label || 'Sport';
  const canSave = rpe !== undefined && hasValidDuration && hasValidOptionalMetrics;
  const sessionLoad = rpe !== undefined && hasValidDuration
    ? calculateSessionLoad({ rpe, durationMinutes: parsedDuration })
    : 0;
  const isEditingSession = editingSessionId !== null;
  const selectedRpeDescriptor = rpe ? RPE_DESCRIPTORS[rpe - 1] : 'Move the slider to select session effort';
  const rpeThumbPosition = `${getRpeFillPercent(rpe)}%`;

  const resetForm = useCallback(() => {
    setEditingSessionId(null);
    setSelectedSportType('football');
    setRpe(undefined);
    setDurationMinutes('');
    setDistanceMeters('');
    setCalories('');
    setAverageHeartRate('');
    setMaxHeartRate('');
    setNotes('');
    setShowOptionalMetrics(false);
  }, []);

  const loadEntry = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const [sessionsResult, entryResult] = await Promise.allSettled([
        getSportsLoadSessionsByDate(user.id, dateKey),
        getSrpeByDate(user.id, dateKey),
      ]);

      if (sessionsResult.status === 'fulfilled') {
        setSessions(sessionsResult.value);
      } else {
        console.warn('Could not load sports load sessions:', sessionsResult.reason);
        setSessions([]);
      }

      if (entryResult.status === 'fulfilled') {
        setDailyEntry(entryResult.value);
      } else {
        throw entryResult.reason;
      }
    } catch (err) {
      console.error('Failed to load sports load entry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, dateKey]);

  useEffect(() => {
    resetForm();
    loadEntry();
  }, [loadEntry, resetForm]);

  const handleDateInputChange = (value: string) => {
    const nextDate = dateKeyToLocalDate(value);
    if (!nextDate) return;
    setSelectedDate(nextDate);
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  };

  const handleSave = async () => {
    if (rpe === undefined || !hasValidDuration || !hasValidOptionalMetrics) return;
    setIsSaving(true);

    try {
      const input: SaveSrpeLogInput = {
        rpe,
        durationMinutes: parsedDuration,
        sportType: selectedSportType,
        sportName: selectedSportLabel,
      };
      if (distanceMetersValue !== undefined && distanceMetersValue !== null) {
        input.distanceMeters = distanceMetersValue;
      }
      if (caloriesValue !== undefined && caloriesValue !== null) {
        input.calories = caloriesValue;
      }
      if (averageHeartRateValue !== undefined && averageHeartRateValue !== null) {
        input.averageHeartRate = averageHeartRateValue;
      }
      if (maxHeartRateValue !== undefined && maxHeartRateValue !== null) {
        input.maxHeartRate = maxHeartRateValue;
      }
      const trimmedNotes = notes.trim();
      if (trimmedNotes) {
        input.notes = trimmedNotes;
      }

      await saveSportsLoadSession(
        dateKey,
        input,
        editingSessionId || undefined
      );
      toast.success(isEditingSession ? 'Sports load session updated' : 'Sports load session added');
      resetForm();
      await loadEntry();
    } catch (err) {
      console.error('Failed to save sports load:', err);
      toast.error('Failed to save - please try again');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSession = (session: SportsLoadSession) => {
    setEditingSessionId(session.id);
    setSelectedSportType(session.sportType || 'football');
    setRpe(session.rpe);
    setDurationMinutes(String(session.durationMinutes));
    setDistanceMeters(session.distanceMeters ? String(session.distanceMeters) : '');
    setCalories(session.calories ? String(session.calories) : '');
    setAverageHeartRate(session.averageHeartRate ? String(session.averageHeartRate) : '');
    setMaxHeartRate(session.maxHeartRate ? String(session.maxHeartRate) : '');
    setNotes(session.notes || '');
    setShowOptionalMetrics(Boolean(
      session.distanceMeters ||
      session.calories ||
      session.averageHeartRate ||
      session.maxHeartRate ||
      session.notes
    ));
  };

  const isToday = dateKey === todayKey;
  const isFuture = dateKey > todayKey;

  return (
    <div className="text-text-primary pb-24">
      <div>
        <div className="max-w-xl mx-auto">
          <div className="rounded-3xl border border-border bg-bg-tertiary/80 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedDate((d) => addDays(d, -1))}
                className="h-12 w-12 shrink-0 rounded-2xl border border-border bg-bg-secondary text-text-primary hover:border-accent-primary hover:text-accent-primary transition-colors flex items-center justify-center"
                aria-label="Previous day"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p className="text-[11px] uppercase tracking-[0.2em] text-text-tertiary">Sports Load</p>
                <h1 className="mt-1 text-lg font-semibold text-text-primary leading-tight">
                  {formatDisplayDate(selectedDate)}
                </h1>
                <p className="text-[11px] text-text-tertiary mt-1">
                  {isLoading ? 'Loading sessions...' : dailyEntry ? `${dailyEntry.sessionCount || 1} session${(dailyEntry.sessionCount || 1) === 1 ? '' : 's'} logged` : 'No sports load saved yet'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDate((d) => addDays(d, 1))}
                disabled={dateKey >= todayKey}
                className="h-12 w-12 shrink-0 rounded-2xl border border-border bg-bg-secondary text-text-primary hover:border-accent-primary hover:text-accent-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Next day"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={openDatePicker}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-bg-secondary px-4 py-2.5 text-sm font-medium text-text-primary hover:border-accent-primary hover:text-accent-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
              </svg>
              Open calendar
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={dateKey}
              max={todayKey}
              onChange={(event) => handleDateInputChange(event.target.value)}
              className="sr-only"
              tabIndex={-1}
            />
          </div>
        </div>

        {!isToday && (
          <div className="max-w-xl mx-auto px-4 pb-2">
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className="text-xs text-accent-primary underline"
            >
              Jump to today
            </button>
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary" />
          </div>
        ) : isFuture ? (
          <div className="text-center py-12 text-text-secondary">
            Can&apos;t log sports load for a future date.
          </div>
        ) : (
          <>
            <div className="rounded-3xl p-4 md:p-5 space-y-4 border border-border/70 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] shadow-[0_0_0_1px_rgba(148,163,184,0.12),0_10px_30px_rgba(15,23,42,0.18)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <label htmlFor="sessionRpe" className="font-medium text-text-primary">
                    Session RPE
                  </label>
                </div>
                <div className="text-right min-w-[5.75rem]">
                  <div className="inline-flex items-center justify-center min-w-[3.4rem] h-11 px-3 rounded-2xl text-xl font-semibold border border-white/15 bg-bg-tertiary text-text-primary shadow-lg">
                    {rpe ?? '-'}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1">
                    {selectedRpeDescriptor}
                  </p>
                </div>
              </div>

              <div className="relative">
                <div
                  className="relative rounded-[1.6rem] px-3 py-4 border border-white/10 overflow-hidden bg-slate-950/10"
                  style={{ background: buildRpeTrackGradient(rpe) }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_35%,transparent_65%,rgba(255,255,255,0.08))] pointer-events-none" />
                  <div className="absolute inset-y-3 left-3 right-3 rounded-[1.2rem] border border-white/10 pointer-events-none" />

                  <div className="grid grid-cols-10 gap-1">
                    {RPE_OPTIONS.map((score) => {
                      const isActive = rpe === score;
                      const isFilled = rpe !== undefined && score <= rpe;

                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setRpe(score)}
                          className={[
                            'relative h-12 rounded-xl text-sm font-semibold transition-all duration-200 border',
                            isActive
                              ? 'border-white/80 bg-white/25 text-white scale-[1.06] -translate-y-0.5 shadow-[0_10px_24px_rgba(255,255,255,0.16)]'
                              : isFilled
                              ? 'border-white/20 bg-white/12 text-white/95'
                              : 'border-white/10 bg-black/10 text-white/70 hover:bg-white/10 hover:-translate-y-0.5',
                          ].join(' ')}
                          aria-label={`RPE ${score}`}
                          aria-pressed={isActive}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>

                  {rpe && (
                    <div
                      className="pointer-events-none absolute -top-2 -translate-x-1/2"
                      style={{ left: rpeThumbPosition }}
                    >
                      <div className="px-2 py-1 rounded-full bg-white text-slate-900 text-[11px] font-semibold shadow-[0_8px_18px_rgba(255,255,255,0.2)]">
                        {rpe}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  id="sessionRpe"
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={rpe ?? 1}
                  onChange={(event) => setRpe(Number(event.target.value))}
                  aria-describedby="sessionRpeDescriptor"
                  aria-valuetext={rpe ? `${rpe} out of 10, ${selectedRpeDescriptor}` : 'No RPE selected'}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <p id="sessionRpeDescriptor" className="text-center text-xs text-text-secondary">
                {rpe ? `RPE ${rpe} - ${selectedRpeDescriptor}` : 'Tap or drag to select effort'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-bg-secondary rounded-xl p-4 space-y-3 border border-border">
                <label htmlFor="durationMinutes" className="block font-medium text-text-primary">
                  Duration
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="durationMinutes"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={durationMinutes}
                    onChange={(event) => setDurationMinutes(event.target.value)}
                    placeholder="Minutes"
                    className="w-full bg-bg-tertiary text-text-primary placeholder-text-tertiary text-sm rounded-lg px-3 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                  <span className="text-sm text-text-secondary">min</span>
                </div>
              </div>

              <div className="bg-bg-secondary rounded-xl p-4 space-y-3 border border-border">
                <label htmlFor="sportType" className="block text-sm font-medium text-text-primary">
                  Sport
                </label>
                <select
                  id="sportType"
                  value={selectedSportType}
                  onChange={(event) => setSelectedSportType(event.target.value)}
                  className="w-full bg-bg-tertiary text-text-primary text-sm rounded-lg px-3 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                  {SPORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-bg-secondary">
              <button
                type="button"
                onClick={() => setShowOptionalMetrics((value) => !value)}
                aria-expanded={showOptionalMetrics}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-medium text-text-primary">More details</span>
                <span className="text-xs text-text-secondary">
                  {showOptionalMetrics ? 'Hide' : 'Optional'}
                </span>
              </button>

              {showOptionalMetrics && (
                <div className="border-t border-border p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="distanceMeters" className="block text-sm font-medium text-text-primary">
                        Distance
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          id="distanceMeters"
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          value={distanceMeters}
                          onChange={(event) => setDistanceMeters(event.target.value)}
                          placeholder="Optional"
                          className="w-full bg-bg-tertiary text-text-primary placeholder-text-tertiary text-sm rounded-lg px-3 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        />
                        <span className="text-sm text-text-secondary">m</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="calories" className="block text-sm font-medium text-text-primary">
                        Calories
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          id="calories"
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          value={calories}
                          onChange={(event) => setCalories(event.target.value)}
                          placeholder="Optional"
                          className="w-full bg-bg-tertiary text-text-primary placeholder-text-tertiary text-sm rounded-lg px-3 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        />
                        <span className="text-sm text-text-secondary">kcal</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="averageHeartRate" className="block text-sm font-medium text-text-primary">
                        Average heart rate
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          id="averageHeartRate"
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          value={averageHeartRate}
                          onChange={(event) => setAverageHeartRate(event.target.value)}
                          placeholder="Optional"
                          className="w-full bg-bg-tertiary text-text-primary placeholder-text-tertiary text-sm rounded-lg px-3 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        />
                        <span className="text-sm text-text-secondary">bpm</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="maxHeartRate" className="block text-sm font-medium text-text-primary">
                        Max heart rate
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          id="maxHeartRate"
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          value={maxHeartRate}
                          onChange={(event) => setMaxHeartRate(event.target.value)}
                          placeholder="Optional"
                          className="w-full bg-bg-tertiary text-text-primary placeholder-text-tertiary text-sm rounded-lg px-3 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        />
                        <span className="text-sm text-text-secondary">bpm</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="sessionNotes" className="block text-sm font-medium text-text-primary">
                      Notes
                    </label>
                    <textarea
                      id="sessionNotes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Optional session notes"
                      className="mt-1 w-full bg-bg-tertiary text-text-primary placeholder-text-tertiary text-sm rounded-lg px-3 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                  </div>
                  {!hasValidOptionalMetrics && (
                    <p className="text-xs text-error">
                      Optional number fields must be positive whole numbers when filled.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-bg-secondary p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Sports Load</p>
                <p className="text-sm text-text-secondary mt-1">RPE x minutes</p>
              </div>
              <div className="text-3xl font-semibold text-text-primary">
                {canSave ? sessionLoad : '-'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !canSave}
              className="w-full bg-accent-primary text-text-inverse py-3 rounded-xl font-medium text-sm transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : isEditingSession ? 'Update Session' : 'Add Session'}
            </button>

            {!canSave && (
              <p className="text-center text-xs text-text-secondary">
                Select RPE and duration to save.
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfo((value) => !value)}
                aria-expanded={showInfo}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-secondary text-text-secondary hover:text-text-primary"
                aria-label="Sports load information"
              >
                i
              </button>
            </div>

            {showInfo && (
              <div className="rounded-2xl border border-info-border bg-info-bg px-4 py-3 text-sm leading-relaxed text-info-text">
                Sports load = duration minutes x RPE. It feeds stats, coach dashboards, analytics, and exports.
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-bg-secondary p-3">
                <p className="text-[11px] uppercase tracking-wide text-text-tertiary">Daily load</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">{dailyEntry?.sessionLoad ?? '-'}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary p-3">
                <p className="text-[11px] uppercase tracking-wide text-text-tertiary">Duration</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  {dailyEntry ? `${dailyEntry.durationMinutes}m` : '-'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary p-3">
                <p className="text-[11px] uppercase tracking-wide text-text-tertiary">Avg RPE</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">{dailyEntry?.rpe ?? '-'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-text-primary">Sessions</h2>
                {isEditingSession ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary hover:text-text-primary"
                  >
                    Add new
                  </button>
                ) : null}
              </div>

              {sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      aria-label={`Edit ${session.sportName || 'Football'} session`}
                      onClick={() => handleEditSession(session)}
                      className={[
                        'w-full rounded-xl border p-3 text-left transition-colors',
                        editingSessionId === session.id
                          ? 'border-accent-primary bg-bg-tertiary'
                          : 'border-border bg-bg-primary hover:border-accent-primary',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-text-primary">{session.sportName || 'Football'}</p>
                          <p className="text-xs text-text-secondary">
                            {session.durationMinutes} min · RPE {session.rpe}
                          </p>
                          {(session.distanceMeters || session.calories || session.averageHeartRate || session.maxHeartRate) && (
                            <p className="mt-1 text-[11px] text-text-tertiary">
                              {[
                                session.distanceMeters ? `${session.distanceMeters} m` : null,
                                session.calories ? `${session.calories} kcal` : null,
                                session.averageHeartRate ? `avg HR ${session.averageHeartRate}` : null,
                                session.maxHeartRate ? `max HR ${session.maxHeartRate}` : null,
                              ].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          {session.notes ? (
                            <p className="mt-1 line-clamp-2 text-[11px] text-text-tertiary">{session.notes}</p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-text-primary">{session.sessionLoad}</p>
                          <p className="text-[11px] text-text-tertiary">load</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : dailyEntry ? (
                <div className="rounded-xl border border-border bg-bg-primary p-3">
                  <p className="font-medium text-text-primary">{dailyEntry.sportName || 'Football'} legacy daily entry</p>
                  <p className="text-xs text-text-secondary">
                    {dailyEntry.durationMinutes} min · RPE {dailyEntry.rpe} · load {dailyEntry.sessionLoad}
                  </p>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-bg-primary p-4 text-center text-sm text-text-secondary">
                  No sessions logged for this date yet.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SportsLoadPage;
