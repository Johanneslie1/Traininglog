import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { RootState } from '@/store/store';
import {
  calculateSessionLoad,
  deleteSrpeLog,
  deleteSportsLoadSession,
  getSportsLoadSessionsByDate,
  getSrpeByDate,
  saveSportsLoadSession,
} from '@/services/srpeService';
import { SaveSrpeLogInput, SportsLoadSession, SrpeLog } from '@/types/srpe';
import { DailyDateHeader } from '@/features/daily-entry/DailyDateHeader';
import { useDailyDateNavigation } from '@/features/daily-entry/useDailyDateNavigation';
import { ConfirmDialog } from '@/components/ui';

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

function parseOptionalWholeNumber(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

const SportsLoadPage: React.FC = () => {
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
  const [selectedSportType, setSelectedSportType] = useState('football');
  const [sessionName, setSessionName] = useState('');
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
  const [pendingDeleteSession, setPendingDeleteSession] = useState<SportsLoadSession | null>(null);
  const [pendingDeleteLegacyEntry, setPendingDeleteLegacyEntry] = useState<SrpeLog | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [isDeletingLegacyEntry, setIsDeletingLegacyEntry] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
  const selectedRpeDescriptor = rpe ? RPE_DESCRIPTORS[rpe - 1] : 'Tap a number to select session effort';

  const resetForm = useCallback(() => {
    setEditingSessionId(null);
    setSelectedSportType('football');
    setSessionName('');
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

  const handleSave = async () => {
    if (rpe === undefined || !hasValidDuration || !hasValidOptionalMetrics) return;
    setIsSaving(true);

    try {
      const input: SaveSrpeLogInput = {
        rpe,
        durationMinutes: parsedDuration,
        sportType: selectedSportType,
        sportName: selectedSportLabel,
        sessionName: sessionName.trim() || selectedSportLabel,
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
    setSessionName(session.sessionName || session.sportName || 'Football');
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

  const handleDeleteSession = async () => {
    if (!user?.id || !pendingDeleteSession) return;

    const session = pendingDeleteSession;
    const label = session.sessionName || session.sportName || 'this session';
    setDeletingSessionId(session.id);

    try {
      await deleteSportsLoadSession(session.id);
      toast.success(`${label} deleted`);
      if (editingSessionId === session.id) {
        resetForm();
      }
      setPendingDeleteSession(null);
      await loadEntry();
    } catch (err) {
      console.error('Failed to delete sports load session:', err);
      toast.error('Failed to delete - please try again');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleDeleteLegacyEntry = async () => {
    if (!user?.id || !pendingDeleteLegacyEntry) return;

    setIsDeletingLegacyEntry(true);

    try {
      await deleteSrpeLog(pendingDeleteLegacyEntry.date);
      toast.success('Sports load entry deleted');
      setPendingDeleteLegacyEntry(null);
      await loadEntry();
    } catch (err) {
      console.error('Failed to delete legacy sports load entry:', err);
      toast.error('Failed to delete - please try again');
    } finally {
      setIsDeletingLegacyEntry(false);
    }
  };

  return (
    <div className="text-text-primary pb-24">
      <DailyDateHeader
        title="Sports Load"
        selectedDate={selectedDate}
        dateKey={dateKey}
        todayKey={todayKey}
        isToday={isToday}
        statusText={isLoading ? 'Loading sessions...' : dailyEntry ? `${dailyEntry.sessionCount || 1} session${(dailyEntry.sessionCount || 1) === 1 ? '' : 's'} logged` : 'No sports load saved yet'}
        inputRef={dateInputRef}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onOpenCalendar={openDatePicker}
        onDateChange={selectDateKey}
        onJumpToday={jumpToToday}
      />

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
            <div className="space-y-3 rounded-2xl border border-border bg-bg-secondary p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <label htmlFor="sessionRpe" className="text-[15px] font-semibold text-text-primary">
                    Session RPE
                  </label>
                </div>
                <div className="min-w-[4.5rem] text-right">
                  <div className="inline-flex h-9 min-w-[2.75rem] items-center justify-center rounded-xl border border-border bg-bg-tertiary px-2.5 text-base font-semibold text-text-primary">
                    {rpe ?? '–'}
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    {selectedRpeDescriptor}
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-10 gap-1.5">
                  {RPE_OPTIONS.map((score) => {
                    const isActive = rpe === score;

                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setRpe(score)}
                        className={[
                          'relative h-11 rounded-xl border text-sm font-semibold transition-colors',
                          isActive
                            ? 'border-accent-primary bg-accent-primary text-text-on-accent'
                            : 'border-border bg-bg-tertiary text-text-primary hover:border-accent-primary hover:text-accent-primary',
                        ].join(' ')}
                        aria-label={`RPE ${score}`}
                        aria-pressed={isActive}
                      >
                        {score}
                      </button>
                    );
                  })}
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
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <p id="sessionRpeDescriptor" className="text-center text-xs text-text-secondary">
                {rpe ? `RPE ${rpe} · ${selectedRpeDescriptor}` : 'Tap or drag to select effort'}
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

            <div className="bg-bg-secondary rounded-xl p-4 space-y-3 border border-border">
              <label htmlFor="sportsLoadSessionName" className="block text-sm font-medium text-text-primary">
                Session name
              </label>
              <input
                id="sportsLoadSessionName"
                type="text"
                value={sessionName}
                onChange={(event) => setSessionName(event.target.value)}
                placeholder={selectedSportLabel}
                className="w-full bg-bg-tertiary text-text-primary placeholder-text-tertiary text-sm rounded-lg px-3 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              <p className="text-xs text-text-secondary">
                Optional. If left empty, this sports-load session is named {selectedSportLabel}.
              </p>
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
                  {sessions.map((session) => {
                    const sessionLabel = session.sessionName || session.sportName || 'Football';

                    return (
                      <div
                        key={session.id}
                        className={[
                          'w-full rounded-xl border p-3 text-left transition-colors',
                          editingSessionId === session.id
                            ? 'border-accent-primary bg-bg-tertiary'
                            : 'border-border bg-bg-primary',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-text-primary">{sessionLabel}</p>
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
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                aria-label={`Edit ${sessionLabel} session`}
                                onClick={() => handleEditSession(session)}
                                className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary hover:border-accent-primary hover:text-text-primary"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${sessionLabel} session`}
                                onClick={() => setPendingDeleteSession(session)}
                                disabled={deletingSessionId === session.id}
                                className="rounded-full border border-error-border px-3 py-1 text-xs text-error-text hover:bg-error-bg disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-semibold text-text-primary">{session.sessionLoad}</p>
                            <p className="text-[11px] text-text-tertiary">load</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : dailyEntry ? (
                <div className="rounded-xl border border-border bg-bg-primary p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-text-primary">{dailyEntry.sportName || 'Football'} legacy daily entry</p>
                      <p className="text-xs text-text-secondary">
                        {dailyEntry.durationMinutes} min · RPE {dailyEntry.rpe} · load {dailyEntry.sessionLoad}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Delete sports load entry"
                      onClick={() => setPendingDeleteLegacyEntry(dailyEntry)}
                      disabled={isDeletingLegacyEntry}
                      className="shrink-0 rounded-full border border-error-border px-3 py-1 text-xs text-error-text hover:bg-error-bg disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
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

      <ConfirmDialog
        isOpen={pendingDeleteSession !== null}
        title="Delete sports load session?"
        description={`This will delete "${pendingDeleteSession?.sessionName || pendingDeleteSession?.sportName || 'this session'}" from the selected day. This action cannot be undone.`}
        confirmLabel="Delete session"
        isConfirming={deletingSessionId !== null}
        onCancel={() => {
          if (!deletingSessionId) {
            setPendingDeleteSession(null);
          }
        }}
        onConfirm={() => {
          void handleDeleteSession();
        }}
      />

      <ConfirmDialog
        isOpen={pendingDeleteLegacyEntry !== null}
        title="Delete sports load entry?"
        description="This will delete the sports load entry from the selected day. This action cannot be undone."
        confirmLabel="Delete entry"
        isConfirming={isDeletingLegacyEntry}
        onCancel={() => {
          if (!isDeletingLegacyEntry) {
            setPendingDeleteLegacyEntry(null);
          }
        }}
        onConfirm={() => {
          void handleDeleteLegacyEntry();
        }}
      />
    </div>
  );
};

export default SportsLoadPage;
