export type HabitKind = 'check' | 'count';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  kind: HabitKind;
  /** Daily target for count habits. */
  target?: number;
  unit?: string;
  sortOrder: number;
  /** First local date (YYYY-MM-DD) that counts for this habit. */
  activeFrom: string;
  archived: boolean;
  /** Local date the habit left the daily list. Days on and after this date are not expected. */
  archivedOn?: string;
}

export interface HabitDayEntry {
  completed?: boolean;
  value?: number;
}

export interface HabitDay {
  id: string;
  userId: string;
  date: string;
  dateEpochDay?: number;
  entries: Record<string, HabitDayEntry>;
}
