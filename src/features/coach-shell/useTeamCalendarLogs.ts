import { useEffect, useMemo, useState } from 'react';
import { getAthleteExerciseLogs } from '@/services/coachService';
import { getSportsLoadSessionsByDateRange } from '@/services/srpeService';
import {
  buildCalendarLogSummaries,
  dateKeyFromGymLog,
  type CalendarCellDaySummary,
  type CalendarGymLogInput,
  type CalendarSportsLoadInput,
} from '@/features/coach-shell/calendarLoggedSummary';
import { dateKeyToLocalDate, endOfDay, startOfDay } from '@/utils/dateUtils';

function toStartEnd(dateKeys: string[]): { startDate: Date; endDate: Date; startKey: string; endKey: string } | null {
  if (dateKeys.length === 0) return null;
  const sorted = [...dateKeys].sort();
  const startKey = sorted[0];
  const endKey = sorted[sorted.length - 1];
  const start = dateKeyToLocalDate(startKey);
  const end = dateKeyToLocalDate(endKey);
  if (!start || !end) return null;
  return {
    startDate: startOfDay(start),
    endDate: endOfDay(end),
    startKey,
    endKey,
  };
}

export function useTeamCalendarLogs(
  athleteIds: string[],
  dateKeys: string[]
): {
  summaries: Map<string, CalendarCellDaySummary>;
  loading: boolean;
  failedAthleteIds: string[];
} {
  const athleteKey = useMemo(() => [...athleteIds].sort().join('|'), [athleteIds]);
  const rangeKey = useMemo(() => {
    if (dateKeys.length === 0) return '';
    const sorted = [...dateKeys].sort();
    return `${sorted[0]}..${sorted[sorted.length - 1]}|${dateKeys.length}`;
  }, [dateKeys]);

  const [summaries, setSummaries] = useState<Map<string, CalendarCellDaySummary>>(() => new Map());
  const [loading, setLoading] = useState(false);
  const [failedAthleteIds, setFailedAthleteIds] = useState<string[]>([]);

  useEffect(() => {
    const ids = athleteKey ? athleteKey.split('|') : [];
    const range = toStartEnd(dateKeys);
    if (ids.length === 0 || !range) {
      setSummaries(new Map());
      setFailedAthleteIds([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const gymLogsByAthlete: Record<string, CalendarGymLogInput[]> = {};
      const sportsLoadByAthlete: Record<string, CalendarSportsLoadInput[]> = {};
      const failed: string[] = [];

      await Promise.all(
        ids.map(async (athleteId) => {
          try {
            const [logs, sports] = await Promise.all([
              getAthleteExerciseLogs(athleteId, range.startDate, range.endDate, { maxResults: 500 }),
              getSportsLoadSessionsByDateRange(athleteId, range.startKey, range.endKey),
            ]);

            gymLogsByAthlete[athleteId] = logs.flatMap((log) => {
              const date = dateKeyFromGymLog(log);
              if (!date) return [];
              return [{
                date,
                activityType: log.activityType,
                sourceCollection: log.sourceCollection,
              }];
            });

            sportsLoadByAthlete[athleteId] = sports.map((session) => ({
              date: session.date,
              sessionLoad: session.sessionLoad,
            }));
          } catch {
            failed.push(athleteId);
            gymLogsByAthlete[athleteId] = [];
            sportsLoadByAthlete[athleteId] = [];
          }
        })
      );

      if (cancelled) return;
      setFailedAthleteIds(failed);
      setSummaries(
        buildCalendarLogSummaries({
          athleteIds: ids,
          dateKeys,
          gymLogsByAthlete,
          sportsLoadByAthlete,
        })
      );
      setLoading(false);
    })().catch(() => {
      if (cancelled) return;
      setSummaries(new Map());
      setFailedAthleteIds(ids);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // dateKeys identity changes often; rangeKey + athleteKey gate the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteKey, rangeKey]);

  return { summaries, loading, failedAthleteIds };
}
