import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, dateKeyToLocalDate, getLocalWeekDateRange, toLocalDateString } from '@/utils/dateUtils';
import type { CoachRatingsDashboardData, CoachRatingsRequest, CoachRatingsViewMode } from '@/types/coachRatings';

export type HealthLoadDashboardLoader = (request: CoachRatingsRequest) => Promise<CoachRatingsDashboardData>;

interface UseHealthLoadDashboardOptions {
  loadDashboard: HealthLoadDashboardLoader;
  selectedTeamId?: string | null;
  onLoadError?: (error: unknown) => void;
}

export function useHealthLoadDashboard({
  loadDashboard,
  selectedTeamId = null,
  onLoadError,
}: UseHealthLoadDashboardOptions) {
  const todayDate = useMemo(() => new Date(), []);
  const initialWeek = useMemo(() => getLocalWeekDateRange(todayDate), [todayDate]);
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(todayDate));
  const [periodStartDate, setPeriodStartDate] = useState(() => initialWeek.startDateKey);
  const [periodEndDate, setPeriodEndDate] = useState(() => initialWeek.endDateKey);
  const [viewMode, setViewMode] = useState<CoachRatingsViewMode>('day');
  const [dashboard, setDashboard] = useState<CoachRatingsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const selectDay = useCallback((dateKey: string) => {
    const date = dateKeyToLocalDate(dateKey);
    if (!date) return;

    const nextWeek = getLocalWeekDateRange(date);
    setSelectedDate(dateKey);
    setPeriodStartDate(nextWeek.startDateKey);
    setPeriodEndDate(nextWeek.endDateKey);
  }, []);

  const selectWeekStart = useCallback((dateKey: string) => {
    const date = dateKeyToLocalDate(dateKey);
    if (!date) return;

    const nextWeek = getLocalWeekDateRange(date);
    setSelectedDate(nextWeek.startDateKey);
    setPeriodStartDate(nextWeek.startDateKey);
    setPeriodEndDate(nextWeek.endDateKey);
  }, []);

  const setDashboardViewMode = useCallback((mode: CoachRatingsViewMode) => {
    setViewMode(mode);
    if (mode === 'day') {
      selectDay(selectedDate);
      return;
    }

    selectWeekStart(selectedDate);
  }, [selectDay, selectWeekStart, selectedDate]);

  const movePeriod = useCallback((direction: -1 | 1) => {
    if (viewMode === 'day') {
      const current = dateKeyToLocalDate(selectedDate);
      if (!current) return;
      selectDay(toLocalDateString(addDays(current, direction)));
      return;
    }

    const start = dateKeyToLocalDate(periodStartDate);
    const end = dateKeyToLocalDate(periodEndDate);
    if (!start || !end) return;

    const nextStart = toLocalDateString(addDays(start, direction * 7));
    const nextEnd = toLocalDateString(addDays(end, direction * 7));
    setSelectedDate(nextStart);
    setPeriodStartDate(nextStart);
    setPeriodEndDate(nextEnd);
  }, [periodEndDate, periodStartDate, selectDay, selectedDate, viewMode]);

  const refresh = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      setLoadError(null);
      const data = await loadDashboard({
        selectedDate,
        selectedTeamId,
        viewMode,
        periodStartDate,
        periodEndDate,
      });

      if (requestId !== requestIdRef.current) return;
      setDashboard(data);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setLoadError(error instanceof Error ? error.message : 'Could not load dashboard data.');
      onLoadError?.(error);
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [loadDashboard, onLoadError, periodEndDate, periodStartDate, selectedDate, selectedTeamId, viewMode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    dashboard,
    loading,
    loadError,
    selectedDate,
    periodStartDate,
    periodEndDate,
    viewMode,
    isDayMode: viewMode === 'day',
    refresh,
    selectDay,
    selectWeekStart,
    movePeriod,
    setViewMode: setDashboardViewMode,
  };
}
