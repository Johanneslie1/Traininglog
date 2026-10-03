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
      <div className="rounded-2xl border border-border bg-bg-secondary p-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPreviousDay}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-tertiary text-text-primary transition-colors hover:border-accent-primary hover:text-accent-primary"
            aria-label="Previous day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-xs text-text-tertiary">{title}</p>
            <h1 className="mt-0.5 text-base font-semibold leading-tight text-text-primary">
              {formatDisplayDate(selectedDate)}
            </h1>
            <p className="mt-0.5 text-xs text-text-tertiary">{statusText}</p>
          </div>

          <button
            type="button"
            onClick={onNextDay}
            disabled={dateKey >= todayKey}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-tertiary text-text-primary transition-colors hover:border-accent-primary hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-30"
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
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent-primary hover:text-accent-primary"
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
