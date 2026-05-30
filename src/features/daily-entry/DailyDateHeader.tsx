import React from 'react';
import { formatDisplayDate } from '@/utils/dateUtils';

interface DailyDateHeaderProps {
  title: string;
  selectedDate: Date;
  dateKey: string;
  todayKey: string;
  isToday: boolean;
  statusText: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onOpenCalendar: () => void;
  onDateChange: (dateKey: string) => void;
  onJumpToday: () => void;
}

export const DailyDateHeader: React.FC<DailyDateHeaderProps> = ({
  title,
  selectedDate,
  dateKey,
  todayKey,
  isToday,
  statusText,
  inputRef,
  onPreviousDay,
  onNextDay,
  onOpenCalendar,
  onDateChange,
  onJumpToday,
}) => (
  <div>
    <div className="max-w-xl mx-auto">
      <div className="rounded-3xl border border-border bg-bg-tertiary/80 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPreviousDay}
            className="h-12 w-12 shrink-0 rounded-2xl border border-border bg-bg-secondary text-text-primary hover:border-accent-primary hover:text-accent-primary transition-colors flex items-center justify-center"
            aria-label="Previous day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-text-tertiary">{title}</p>
            <h1 className="mt-1 text-lg font-semibold text-text-primary leading-tight">
              {formatDisplayDate(selectedDate)}
            </h1>
            <p className="text-[11px] text-text-tertiary mt-1">{statusText}</p>
          </div>

          <button
            type="button"
            onClick={onNextDay}
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
          onClick={onOpenCalendar}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-bg-secondary px-4 py-2.5 text-sm font-medium text-text-primary hover:border-accent-primary hover:text-accent-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
          </svg>
          Open calendar
        </button>
        <input
          ref={inputRef}
          type="date"
          value={dateKey}
          max={todayKey}
          onChange={(event) => onDateChange(event.target.value)}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
    </div>

    {!isToday && (
      <div className="max-w-xl mx-auto px-4 pb-2">
        <button
          type="button"
          onClick={onJumpToday}
          className="text-xs text-accent-primary underline"
        >
          Jump to today
        </button>
      </div>
    )}
  </div>
);
