import { Timestamp } from 'firebase/firestore';

export type AssessmentKind = 'body_composition' | 'vo2max';

export const BODY_COMPOSITION_METHODS = [
  { value: 'scale', label: 'Scale' },
  { value: 'bia', label: 'BIA' },
  { value: 'skinfolds', label: 'Skinfolds' },
  { value: 'dexa', label: 'DEXA' },
  { value: 'other', label: 'Other' },
] as const;

export const VO2MAX_METHODS = [
  { value: 'lab_treadmill', label: 'Lab treadmill' },
  { value: 'lab_bike', label: 'Lab bike' },
  { value: 'field', label: 'Field test' },
  { value: 'watch', label: 'Watch estimate' },
  { value: 'other', label: 'Other' },
] as const;

export type BodyCompositionMethod = (typeof BODY_COMPOSITION_METHODS)[number]['value'];
export type Vo2maxMethod = (typeof VO2MAX_METHODS)[number]['value'];

export interface AssessmentLog {
  id: string;
  userId: string;
  date: string;
  dateEpochDay?: number;
  timestamp: Timestamp | Date;
  kind: AssessmentKind;
  method: string;
  notes?: string;
  heightCm?: number;
  bodyMassKg?: number;
  bodyFatPercent?: number;
  fatMassKg?: number;
  leanMassKg?: number;
  vo2maxMlKgMin?: number;
  vo2maxLMin?: number;
  maxHeartRate?: number;
}

export interface BodyCompositionDraft {
  date: string;
  method: BodyCompositionMethod;
  heightCm: string;
  bodyMassKg: string;
  bodyFatPercent: string;
  fatMassKg: string;
  leanMassKg: string;
  notes: string;
}

export interface Vo2maxDraft {
  date: string;
  method: Vo2maxMethod;
  vo2maxMlKgMin: string;
  vo2maxLMin: string;
  maxHeartRate: string;
  notes: string;
}

export interface AssessmentWrite {
  kind: AssessmentKind;
  date: string;
  method: string;
  notes?: string;
  heightCm?: number;
  bodyMassKg?: number;
  bodyFatPercent?: number;
  fatMassKg?: number;
  leanMassKg?: number;
  vo2maxMlKgMin?: number;
  vo2maxLMin?: number;
  maxHeartRate?: number;
}
