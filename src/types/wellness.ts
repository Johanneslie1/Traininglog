import { Timestamp } from 'firebase/firestore';

export interface WellnessLog {
  id: string;
  userId: string;
  /** Local calendar date key - YYYY-MM-DD */
  date: string;
  /** Epoch day derived from date key (UTC midnight days since Unix epoch). */
  dateEpochDay?: number;
  /** Server timestamp for ordering */
  timestamp: Timestamp | Date;
  /** 3 = 5-point wellness scale. 2 = 7-point wellness scale with 5-point readiness. Missing means legacy 1-10 wellness scale. */
  wellnessScaleVersion?: number;
  sleepQuality?: number;  // 1-5 (1 = very poor, 5 = excellent)
  fatigue?: number;       // 1-5 (1 = fresh, 5 = exhausted)
  muscleSoreness?: number; // 1-5 (1 = none, 5 = very sore)
  stress?: number;        // 1-5 (1 = relaxed, 5 = very stressed)
  mood?: number;          // 1-5 (1 = very low, 5 = excellent)
  readiness?: number;     // 1-5 (1 = not ready, 5 = fully ready)
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
    description: '1 = Very poor · 5 = Excellent',
    highIsGood: true,
    scaleMax: 5,
  },
  {
    key: 'fatigue',
    label: 'Fatigue',
    description: '1 = Fresh · 5 = Exhausted',
    highIsGood: false,
    scaleMax: 5,
  },
  {
    key: 'muscleSoreness',
    label: 'Muscle Soreness',
    description: '1 = None · 5 = Very sore',
    highIsGood: false,
    scaleMax: 5,
  },
  {
    key: 'stress',
    label: 'Stress',
    description: '1 = Relaxed · 5 = Very stressed',
    highIsGood: false,
    scaleMax: 5,
  },
  {
    key: 'mood',
    label: 'Mood',
    description: '1 = Very low · 5 = Excellent',
    highIsGood: true,
    scaleMax: 5,
  },
  {
    key: 'readiness',
    label: 'Readiness for Training',
    description: '1 = Not ready · 5 = Fully ready',
    highIsGood: true,
    scaleMax: 5,
  },
];
