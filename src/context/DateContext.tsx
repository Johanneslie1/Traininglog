import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DateContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  normalizeDate: (date: Date) => Date;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

interface DateProviderProps {
  children: ReactNode;
}

export const DateProvider: React.FC<DateProviderProps> = ({ children }) => {
  const normalizeDate = useCallback((date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, []);

  const [selectedDate, setSelectedDateState] = useState<Date>(() => normalizeDate(new Date()));

  const setSelectedDate = useCallback((date: Date) => {
    setSelectedDateState(normalizeDate(date));
  }, [normalizeDate]);

  const value = {
    selectedDate,
    setSelectedDate,
    normalizeDate,
  };

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
};

export const useDate = (): DateContextType => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};
