import { ExerciseMetrics } from './types';

export const strengthMetrics: ExerciseMetrics = {
  trackWeight: true,
  trackReps: true,
  trackRPE: true,
};

export const bodyweightMetrics: ExerciseMetrics = {
  trackReps: true,
  trackRPE: true,
  trackWeight: false,
};

export const cardioMetrics: ExerciseMetrics = {
  trackTime: true,
  trackDistance: true,
  trackRPE: true,
  trackWeight: false,
  trackReps: false,
};

export const plyometricMetrics: ExerciseMetrics = {
  trackReps: true,
  trackRPE: true,
  trackWeight: false,
};

export const mobilityMetrics: ExerciseMetrics = {
  trackTime: true,
  trackRPE: false,
  trackWeight: false,
  trackReps: false,
};
