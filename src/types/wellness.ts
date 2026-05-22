import { Timestamp } from 'firebase/firestore';

export interface WellnessLog {
  id: string;
  userId: string;
  /** Local calendar date key — YYYY-MM-DD */
  date: string;
  /** Epoch day derived from date key (UTC midnight days since Unix epoch). */
  dateEpochDay?: number;
  /** Server timestamp for ordering */
  timestamp: Timestamp | Date;
  /** 2 = 7-point wellness scale with 5-point readiness. Missing means legacy 1-10 wellness scale. */
  wellnessScaleVersion?: number;
  sleepQuality?: number;  // 1–7 (1 = very poor, 7 = excellent)
  fatigue?: number;       // 1–7 (1 = fresh, 7 = exhausted)
  muscleSoreness?: number; // 1–7 (1 = none, 7 = very sore)
  stress?: number;        // 1–7 (1 = relaxed, 7 = very stressed)
  mood?: number;          // 1–7 (1 = very low, 7 = excellent)
  readiness?: number;     // 1–5 (1 = not ready, 5 = fully ready)
  notes?: string;
}

export type WellnessMetricKey = 'sleepQuality' | 'fatigue' | 'muscleSoreness' | 'stress' | 'mood' | 'readiness';

export interface WellnessMetricConfig {
  key: WellnessMetricKey;
  label: string;
  description: string;
  /** When true, high score = good (green). When false, high score = bad (red). */
  highIsGood: boolean;
  scaleMax: number;
}

export const WELLNESS_METRICS: WellnessMetricConfig[] = [
  {
    key: 'sleepQuality',
    label: 'Sleep Quality',
    description: '1 = Very poor · 7 = Excellent',
    highIsGood: true,
    scaleMax: 7,
  },
  {
    key: 'fatigue',
    label: 'Fatigue',
    description: '1 = Fresh · 7 = Exhausted',
    highIsGood: false,
    scaleMax: 7,
  },
  {
    key: 'muscleSoreness',
    label: 'Muscle Soreness',
    description: '1 = None · 7 = Very sore',
    highIsGood: false,
    scaleMax: 7,
  },
  {
    key: 'stress',
    label: 'Stress',
    description: '1 = Relaxed · 7 = Very stressed',
    highIsGood: false,
    scaleMax: 7,
  },
  {
    key: 'mood',
    label: 'Mood',
    description: '1 = Very low · 7 = Excellent',
    highIsGood: true,
    scaleMax: 7,
  },
  {
    key: 'readiness',
    label: 'Readiness for Training',
    description: '1 = Not ready · 5 = Fully ready',
    highIsGood: true,
    scaleMax: 5,
  },
];
