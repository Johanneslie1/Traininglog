
export type ExerciseTemplate = {
  name: string;
  description: string;
  type: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment?: string[];
  instructions: string[];
  tips?: string[];
  defaultUnit?: string;
  metrics?: ExerciseMetrics;
};

export type ExerciseMetrics = {
  trackWeight?: boolean;
  trackReps?: boolean;
  trackTime?: boolean;
  trackDistance?: boolean;
  trackRPE?: boolean;
};
