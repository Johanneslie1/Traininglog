import React, { createContext, useContext, useMemo, useState } from 'react';

interface ExerciseLogCalendarContextValue {
  isExerciseLogMainView: boolean;
  setIsExerciseLogMainView: (value: boolean) => void;
}

const ExerciseLogCalendarContext = createContext<ExerciseLogCalendarContextValue | undefined>(undefined);

interface ExerciseLogCalendarProviderProps {
  children: React.ReactNode;
}

export const ExerciseLogCalendarProvider: React.FC<ExerciseLogCalendarProviderProps> = ({ children }) => {
  const [isExerciseLogMainView, setIsExerciseLogMainView] = useState(true);

  const value = useMemo(
    () => ({
      isExerciseLogMainView,
      setIsExerciseLogMainView,
    }),
    [isExerciseLogMainView]
  );

  return (
    <ExerciseLogCalendarContext.Provider value={value}>
      {children}
    </ExerciseLogCalendarContext.Provider>
  );
};

export const useExerciseLogCalendar = (): ExerciseLogCalendarContextValue => {
  const context = useContext(ExerciseLogCalendarContext);
  if (!context) {
    throw new Error('useExerciseLogCalendar must be used within ExerciseLogCalendarProvider');
  }
  return context;
};
