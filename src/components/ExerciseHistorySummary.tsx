import React from 'react';
import { format } from 'date-fns';
import { ExerciseHistoryData } from '@/hooks/useExerciseHistory';
import { ExerciseSet } from '@/types/sets';

interface ExerciseHistorySummaryProps {
  exerciseName: string;
  historyData: ExerciseHistoryData;
  onCopyLastValues?: (sets: ExerciseSet[]) => void;
  compact?: boolean;
}

/**
 * Trend indicator component
 */
const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'same' | 'none'; details?: string }> = ({ 
  trend, 
  details 
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <span className="text-green-400 flex items-center gap-1" title={details}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {details && <span className="text-xs">{details}</span>}
          </span>
        );
      case 'down':
        return (
          <span className="text-red-400 flex items-center gap-1" title={details}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {details && <span className="text-xs">{details}</span>}
          </span>
        );
      case 'same':
        return (
          <span className="text-gray-400 flex items-center gap-1" title={details}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
            {details && <span className="text-xs">{details}</span>}
          </span>
        );
      default:
        return null;
    }
  };

  return getTrendIcon();
};

/**
 * Exercise History Summary component
 * Shows "Last time: 3×10 @ 60kg on Jan 15" with trend and copy button
 */
export const ExerciseHistorySummary: React.FC<ExerciseHistorySummaryProps> = ({
  exerciseName: _exerciseName,
  historyData,
  onCopyLastValues,
  compact = false,
}) => {
  const { lastPerformed, history, trend, trendDetails, isLoading, error } = historyData;

  if (isLoading) {
    return (
      <div className={`${compact ? 'py-1' : 'py-2 px-3'} bg-white/5 rounded-lg animate-pulse`}>
        <div className="h-4 bg-white/10 rounded w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail - don't show error to user
  }

  if (!lastPerformed) {
    return (
      <div className={`${compact ? 'py-1 px-2' : 'py-2 px-3'} bg-white/5 rounded-lg`}>
        <p className="text-gray-400 text-sm">First time logging this exercise</p>
      </div>
    );
  }

  const formattedDate = format(lastPerformed.timestamp, 'MMM d');

  const handleCopy = () => {
    if (onCopyLastValues) {
      const sets = historyData.copyLastValues();
      if (sets.length > 0) {
        onCopyLastValues(sets);
      }
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 py-1 px-2 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
          <span className="truncate">
            Last: <span className="text-white font-medium">{lastPerformed.summary}</span>
            <span className="text-gray-400 ml-1">({formattedDate})</span>
          </span>
          <TrendIndicator trend={trend} />
        </div>
        {onCopyLastValues && (
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Copy last values"
            aria-label="Copy last values"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-3 mb-3">
      {/* Header with last performed info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Last time:</span>
          <span className="text-white font-medium">{lastPerformed.summary}</span>
          <span className="text-gray-400 text-sm">on {formattedDate}</span>
          <TrendIndicator trend={trend} details={trendDetails} />
        </div>
        {onCopyLastValues && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            title="Copy last values to pre-fill the form"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy last values
          </button>
        )}
      </div>

      {/* History preview - show last 3 sessions */}
      {history.length > 1 && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-1.5">Recent history:</p>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 3).map((entry, index) => (
              <div 
                key={entry.id}
                className={`text-xs px-2 py-1 rounded ${
                  index === 0 ? 'bg-blue-600/20 text-blue-300' : 'bg-white/5 text-gray-400'
                }`}
              >
                {format(entry.timestamp, 'MMM d')}: {entry.summary}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseHistorySummary;
