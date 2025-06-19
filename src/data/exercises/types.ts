import { Exercise } from '@/types/exercise';

export type ExerciseTemplate = Omit<Exercise, 'id'>;

export interface ExerciseMetrics {
  trackWeight?: boolean;
  trackReps?: boolean;
  trackTime?: boolean;
  trackDistance?: boolean;
  trackRPE?: boolean;
}
