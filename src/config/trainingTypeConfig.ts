import { TrainingType, MetricsConfig } from '@/types/exercise';

export interface TrainingTypeDefinition {
  key: TrainingType;
  label: string;
  icon: string;
  description: string;
  firestoreCollection: 'exercises';
  metricsConfig: MetricsConfig;
  setFields: string[];
  summaryMetric?: 'volume' | 'duration' | 'distance';
}

export const TRAINING_TYPE_CONFIG: Record<TrainingType, TrainingTypeDefinition> = {
  [TrainingType.STRENGTH]: {
    key: TrainingType.STRENGTH,
    label: 'Resistance / Strength',
    icon: '💪',
    description: 'Weight training with sets and reps',
    firestoreCollection: 'exercises',
    metricsConfig: {
      trackWeight: true,
      trackReps: true,
      trackRPE: true,
      trackDuration: false,
      trackDistance: false
    },
    setFields: ['weight', 'reps', 'rpe', 'difficulty', 'restTime', 'comment'],
    summaryMetric: 'volume'
  },

  [TrainingType.ENDURANCE]: {
    key: TrainingType.ENDURANCE,
    label: 'Endurance / Cardio',
    icon: '🏃',
    description: 'Running, cycling, swimming, etc.',
    firestoreCollection: 'exercises',
    metricsConfig: {
      trackDuration: true,
      trackDistance: true,
      trackHeartRate: true,
      trackCalories: true,
      trackPace: true,
      trackElevation: true,
      trackRPE: true
    },
    setFields: ['duration', 'distance', 'rpe', 'averageHeartRate', 'calories', 'notes'],
    summaryMetric: 'distance'
  },

  [TrainingType.SPEED_AGILITY]: {
    key: TrainingType.SPEED_AGILITY,
    label: 'Speed & Agility',
    icon: '⚡',
    description: 'Drills for speed, agility, and power',
    firestoreCollection: 'exercises',
    metricsConfig: {
      trackReps: true,
      trackDuration: true,
      trackDistance: true,
      trackRPE: true,
      trackHeartRate: false
    },
    setFields: ['reps', 'distance', 'restTime', 'rpe', 'notes'],
    summaryMetric: 'duration'
  },

  [TrainingType.FLEXIBILITY]: {
    key: TrainingType.FLEXIBILITY,
    label: 'Flexibility / Mobility',
    icon: '🧘',
    description: 'Stretching, yoga, mobility work',
    firestoreCollection: 'exercises',
    metricsConfig: {
      trackDuration: true,
      trackHoldTime: true,
      trackIntensity: true
    },
    setFields: ['holdTime', 'intensity', 'notes'],
    summaryMetric: 'duration'
  },

  [TrainingType.TEAM_SPORTS]: {
    key: TrainingType.TEAM_SPORTS,
    label: 'Team Sports / Other',
    icon: '🏀',
    description: 'Sports, games, and other activities',
    firestoreCollection: 'exercises',
    metricsConfig: {
      trackDuration: true,
      trackRPE: true,
      trackPerformance: true
    },
    setFields: ['duration', 'distance', 'rpe', 'performance', 'calories', 'notes'],
    summaryMetric: 'duration'
  },

  [TrainingType.OTHER]: {
    key: TrainingType.OTHER,
    label: 'Other Activity',
    icon: '🎯',
    description: 'Custom or miscellaneous activity',
    firestoreCollection: 'exercises',
    metricsConfig: {
      trackDuration: true,
      trackRPE: true
    },
    setFields: ['duration', 'distance', 'rpe', 'calories', 'notes'],
    summaryMetric: 'duration'
  }
};

export function getTrainingTypeConfig(type: TrainingType): TrainingTypeDefinition {
  return TRAINING_TYPE_CONFIG[type];
}

export function getFirestoreCollection(type: TrainingType): 'exercises' {
  return getTrainingTypeConfig(type).firestoreCollection;
}
