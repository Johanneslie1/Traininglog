import { useRef, useState } from 'react';
import { addDays, dateKeyToLocalDate, toLocalDateString } from '@/utils/dateUtils';

export function useDailyDateNavigation() {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const dateKey = toLocalDateString(selectedDate);
  const todayKey = toLocalDateString(today);

  const selectDateKey = (value: string) => {
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

  return {
    dateInputRef,
    selectedDate,
    setSelectedDate,
    today,
    dateKey,
    todayKey,
    isToday: dateKey === todayKey,
    isFuture: dateKey > todayKey,
    selectDateKey,
    openDatePicker,
    goToPreviousDay: () => setSelectedDate((date) => addDays(date, -1)),
    goToNextDay: () => setSelectedDate((date) => addDays(date, 1)),
    jumpToToday: () => setSelectedDate(today),
  };
}
