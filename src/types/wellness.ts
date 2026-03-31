import { Timestamp } from 'firebase/firestore';

export interface WellnessLog {
  id: string;
  userId: string;
  /** Local calendar date key — YYYY-MM-DD */
  date: string;
  /** Server timestamp for ordering */
  timestamp: Timestamp | Date;
  sleepQuality?: number;  // 1–10 (1 = poor, 10 = excellent)
  fatigue?: number;       // 1–10 (1 = fresh, 10 = exhausted)
  muscleSoreness?: number; // 1–10 (1 = none, 10 = very sore)
  stress?: number;        // 1–10 (1 = relaxed, 10 = very stressed)
  mood?: number;          // 1–10 (1 = very low, 10 = excellent)
  notes?: string;
}

export type WellnessMetricKey = 'sleepQuality' | 'fatigue' | 'muscleSoreness' | 'stress' | 'mood';

export interface WellnessMetricConfig {
  key: WellnessMetricKey;
  label: string;
  description: string;
  /** When true, high score = good (green). When false, high score = bad (red). */
  highIsGood: boolean;
}

export const WELLNESS_METRICS: WellnessMetricConfig[] = [
  {
    key: 'sleepQuality',
    label: 'Sleep Quality',
    description: '1 = Very poor · 10 = Excellent',
    highIsGood: true,
  },
  {
    key: 'fatigue',
    label: 'Fatigue',
    description: '1 = Fresh · 10 = Exhausted',
    highIsGood: false,
  },
  {
    key: 'muscleSoreness',
    label: 'Muscle Soreness',
    description: '1 = None · 10 = Very sore',
    highIsGood: false,
  },
  {
    key: 'stress',
    label: 'Stress',
    description: '1 = Relaxed · 10 = Very stressed',
    highIsGood: false,
  },
  {
    key: 'mood',
    label: 'Mood',
    description: '1 = Very low · 10 = Excellent',
    highIsGood: true,
  },
];
