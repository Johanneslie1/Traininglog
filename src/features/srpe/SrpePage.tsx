import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { RootState } from '@/store/store';
import { calculateSessionLoad, getSrpeByDate, saveSrpeLog } from '@/services/srpeService';
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

/** Returns a YYYY-MM-DD string for any Date in local timezone. */
function toDateKey(date: Date): string {
  return toLocalDateString(date);
}

const SrpePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [rpe, setRpe] = useState<number | undefined>();
  const [durationMinutes, setDurationMinutes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [entryExists, setEntryExists] = useState(false);

  const dateKey = toDateKey(selectedDate);
  const todayKey = toDateKey(today);
  const parsedDuration = Number(durationMinutes);
  const hasValidDuration = Number.isInteger(parsedDuration) && parsedDuration > 0;
  const canSave = rpe !== undefined && hasValidDuration;
  const sessionLoad = rpe !== undefined && hasValidDuration
    ? calculateSessionLoad({ rpe, durationMinutes: parsedDuration })
    : 0;

  const loadEntry = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const entry = await getSrpeByDate(user.id, dateKey);

      if (entry) {
        setEntryExists(true);
        setRpe(entry.rpe);
        setDurationMinutes(String(entry.durationMinutes));
      } else {
        setEntryExists(false);
        setRpe(undefined);
        setDurationMinutes('');
      }
    } catch (err) {
      console.error('Failed to load RPE entry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, dateKey]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

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
    if (rpe === undefined || !hasValidDuration) return;
    setIsSaving(true);

    try {
      await saveSrpeLog(dateKey, {
        rpe,
        durationMinutes: parsedDuration,
      });
      setEntryExists(true);
      toast.success('Football load logged');
    } catch (err) {
      console.error('Failed to save RPE:', err);
      toast.error('Failed to save - please try again');
    } finally {
      setIsSaving(false);
    }
  };

  const isToday = dateKey === todayKey;
  const isFuture = dateKey > todayKey;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-24">
      <div className="sticky top-0 z-10 bg-bg-secondary border-b border-border">
        <div className="max-w-xl mx-auto px-4 py-4">
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
                <p className="text-[11px] uppercase tracking-[0.2em] text-text-tertiary">Football Load</p>
                <h1 className="mt-1 text-lg font-semibold text-text-primary leading-tight">
                  {formatDisplayDate(selectedDate)}
                </h1>
                <p className="text-[11px] text-text-tertiary mt-1">
                  {isLoading ? 'Loading entry...' : entryExists ? 'Editing saved RPE' : 'No RPE saved yet'}
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

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary" />
          </div>
        ) : isFuture ? (
          <div className="text-center py-12 text-text-secondary">
            Can&apos;t log football load for a future date.
          </div>
        ) : (
          <>
            <div className="rounded-3xl p-4 md:p-5 space-y-4 border border-border/70 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] shadow-[0_0_0_1px_rgba(148,163,184,0.12),0_10px_30px_rgba(15,23,42,0.18)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium text-text-primary">Session RPE</h2>
                  <p className="text-xs text-text-secondary mt-0.5">1 = very easy, 10 = maximal effort</p>
                </div>
                <div className="text-right min-w-[5.75rem]">
                  <div className="inline-flex items-center justify-center min-w-[3.4rem] h-11 px-3 rounded-2xl text-xl font-semibold border border-border bg-bg-tertiary text-text-primary">
                    {rpe ?? '-'}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1">
                    {rpe ? RPE_DESCRIPTORS[rpe - 1] : 'Tap a score'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-10 gap-1">
                {RPE_OPTIONS.map((score) => {
                  const isActive = rpe === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setRpe(score)}
                      className={[
                        'h-12 rounded-xl text-sm font-semibold transition-all duration-200 border',
                        isActive
                          ? 'border-accent-primary bg-accent-primary text-white scale-[1.06] -translate-y-0.5 shadow-lg'
                          : 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                      ].join(' ')}
                      aria-label={`RPE ${score}`}
                      aria-pressed={isActive}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-bg-secondary rounded-xl p-4 space-y-3 border border-border">
              <label htmlFor="durationMinutes" className="block font-medium text-text-primary">
                Session Duration
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
              <p className="text-xs text-text-secondary">
                Log the total football session duration for this date.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-bg-secondary p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">sRPE / Session Load</p>
                <p className="text-sm text-text-secondary mt-1">Calculated as RPE x duration minutes</p>
              </div>
              <div className="text-3xl font-semibold text-text-primary">
                {canSave ? sessionLoad : '-'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !canSave}
              className="w-full bg-accent-primary text-white py-3 rounded-xl font-medium text-sm transition-colors hover:bg-accent-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : entryExists ? 'Update Football Load' : 'Save Football Load'}
            </button>

            {!canSave && (
              <p className="text-center text-xs text-text-secondary">
                Select RPE and enter duration minutes to save.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SrpePage;
