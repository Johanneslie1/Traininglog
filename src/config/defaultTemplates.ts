import { TrainingTemplate } from '@/types/trainingTemplates';
import { ExerciseType } from '@/config/exerciseTypes';

// Default template for Strength Training
export const strengthTemplate: TrainingTemplate = {
  id: 'default-strength',
  name: 'Strength Training',
  type: 'strength',
  isDefault: true,
  description: 'Traditional weight training with sets, reps, and weight',
  fields: [
    {
      fieldId: 'weight',
      label: 'Weight',
      type: 'weight',
      required: true,
      unit: 'kg',
      min: 0,
      step: 0.5
    },
    {
      fieldId: 'reps',
      label: 'Repetitions',
      type: 'reps',
      required: true,
      min: 1,
      max: 100
    },
    {
      fieldId: 'rpe',
      label: 'RPE (Rate of Perceived Exertion)',
      type: 'rpe',
      required: false,
      min: 1,
      max: 10,
      step: 0.5
    },
    {
      fieldId: 'restTime',
      label: 'Rest Time (seconds)',
      type: 'duration',
      required: false,
      min: 0,
      max: 600
    },
    {
      fieldId: 'notes',
      label: 'Notes',
      type: 'string',
      required: false,
      placeholder: 'Any additional notes...'
    }
  ]
};

// Default template for Endurance Training
export const enduranceTemplate: TrainingTemplate = {
  id: 'default-endurance',
  name: 'Endurance Training',
  type: 'endurance',
  isDefault: true,
  description: 'Cardiovascular training with time, distance, and heart rate zones',
  fields: [
    {
      fieldId: 'duration',
      label: 'Duration (minutes)',
      type: 'duration',
      required: true,
      min: 1,
      max: 600
    },
    {
      fieldId: 'distance',
      label: 'Distance',
      type: 'distance',
      required: false,
      unit: 'km',
      min: 0,
      step: 0.1
    },
    {
      fieldId: 'rpe',
      label: 'RPE (Rate of Perceived Exertion)',
      type: 'rpe',
      required: true,
      min: 1,
      max: 10,
      step: 0.5
    },
    {
      fieldId: 'averageHR',
      label: 'Average Heart Rate',
      type: 'heartRate',
      required: false,
      min: 40,
      max: 220
    },
    {
      fieldId: 'maxHR',
      label: 'Max Heart Rate',
      type: 'heartRate',
      required: false,
      min: 40,
      max: 220
    },
    {
      fieldId: 'hrZone1',
      label: 'Zone 1 Time (minutes)',
      type: 'duration',
      required: false,
      min: 0
    },
    {
      fieldId: 'hrZone2',
      label: 'Zone 2 Time (minutes)',
      type: 'duration',
      required: false,
      min: 0
    },
    {
      fieldId: 'hrZone3',
      label: 'Zone 3 Time (minutes)',
      type: 'duration',
      required: false,
      min: 0
    },
    {
      fieldId: 'notes',
      label: 'Notes',
      type: 'string',
      required: false,
      placeholder: 'Route, conditions, feeling...'
    }
  ]
};

// Default template for Plyometrics
export const plyometricsTemplate: TrainingTemplate = {
  id: 'default-plyometrics',
  name: 'Plyometric Training',
  type: 'plyometrics',
  isDefault: true,
  description: 'Explosive and reactive training with jump metrics',
  fields: [
    {
      fieldId: 'reps',
      label: 'Repetitions',
      type: 'reps',
      required: true,
      min: 1,
      max: 50
    },
    {
      fieldId: 'height',
      label: 'Jump Height (cm)',
      type: 'number',
      required: false,
      unit: 'cm',
      min: 0,
      max: 200
    },
    {
      fieldId: 'explosivePower',
      label: 'Explosive Power (1-10)',
      type: 'intensity',
      required: false,
      min: 1,
      max: 10
    },
    {
      fieldId: 'rpe',
      label: 'RPE (Rate of Perceived Exertion)',
      type: 'rpe',
      required: true,
      min: 1,
      max: 10,
      step: 0.5
    },
    {
      fieldId: 'restTime',
      label: 'Rest Time (seconds)',
      type: 'duration',
      required: false,
      min: 0,
      max: 300
    },
    {
      fieldId: 'notes',
      label: 'Notes',
      type: 'string',
      required: false,
      placeholder: 'Landing quality, fatigue level...'
    }
  ]
};

// Universal template for Sports - simplified to only essential fields
export const teamSportsTemplate: TrainingTemplate = {
  id: 'default-team-sports',
  name: 'Sports',
  type: 'teamSports',
  isDefault: true,
  description: 'Universal sports logging with duration, distance, calories, intensity, and notes',
  fields: [
    {
      fieldId: 'duration',
      label: 'Duration (minutes)',
      type: 'duration',
      required: true,
      min: 1,
      max: 300,
      unit: 'minutes'
    },
    {
      fieldId: 'distance',
      label: 'Distance (optional)',
      type: 'distance',
      required: false,
      min: 0,
      max: 50000,
      unit: 'meters',
      placeholder: 'Distance covered if applicable'
    },
    {
      fieldId: 'calories',
      label: 'Calories (optional)',
      type: 'number',
      required: false,
      min: 0,
      max: 2000,
      unit: 'kcal',
      placeholder: 'Estimated calories burned'
    },
    {
      fieldId: 'intensity',
      label: 'Intensity (1-10)',
      type: 'intensity',
      required: true,
      min: 1,
      max: 10,
      step: 0.5
    },
    {
      fieldId: 'notes',
      label: 'Notes',
      type: 'string',
      required: false,
      placeholder: 'Performance notes, tactics, highlights...'
    }
  ]
};

// Default template for Flexibility
export const flexibilityTemplate: TrainingTemplate = {
  id: 'default-flexibility',
  name: 'Flexibility & Mobility',
  type: 'flexibility',
  isDefault: true,
  description: 'Stretching, yoga, and mobility work',
  fields: [
    {
      fieldId: 'duration',
      label: 'Duration (minutes)',
      type: 'duration',
      required: true,
      min: 1,
      max: 120
    },
    {
      fieldId: 'stretchType',
      label: 'Type of Stretching',
      type: 'select',
      required: true,
      options: ['Static', 'Dynamic', 'PNF', 'Yoga', 'Mobility Flow']
    },
    {
      fieldId: 'intensity',
      label: 'Intensity (1-10)',
      type: 'intensity',
      required: true,
      min: 1,
      max: 10
    },
    {
      fieldId: 'bodyPart',
      label: 'Body Part Focus',
      type: 'select',
      required: false,
      options: ['Full Body', 'Upper Body', 'Lower Body', 'Core', 'Shoulders', 'Hips', 'Legs', 'Back']
    },
    {
      fieldId: 'holdTime',
      label: 'Hold Time per Stretch (seconds)',
      type: 'duration',
      required: false,
      min: 5,
      max: 120
    },
    {
      fieldId: 'notes',
      label: 'Notes',
      type: 'string',
      required: false,
      placeholder: 'Areas of tightness, improvements noticed...'
    }
  ]
};

// Universal template for Other Activities - simplified to essential fields
export const otherTemplate: TrainingTemplate = {
  id: 'default-other',
  name: 'Other Activities',
  type: 'other',
  isDefault: true,
  description: 'Universal logging for miscellaneous activities with duration, calories, heart rate, intensity, and notes',
  fields: [
    {
      fieldId: 'duration',
      label: 'Duration (minutes)',
      type: 'duration',
      required: true,
      min: 1,
      max: 720, // 12 hours for long activities
      unit: 'minutes'
    },
    {
      fieldId: 'calories',
      label: 'Calories (optional)',
      type: 'number',
      required: false,
      min: 0,
      max: 3000,
      unit: 'kcal',
      placeholder: 'Estimated calories burned'
    },
    {
      fieldId: 'heartRate',
      label: 'Average Heart Rate (optional)',
      type: 'heartRate',
      required: false,
      min: 40,
      max: 220,
      unit: 'bpm',
      placeholder: 'Average heart rate during activity'
    },
    {
      fieldId: 'intensity',
      label: 'Intensity (1-10)',
      type: 'intensity',
      required: true,
      min: 1,
      max: 10,
      step: 0.5
    },
    {
      fieldId: 'notes',
      label: 'Notes',
      type: 'string',
      required: false,
      placeholder: 'Activity details, conditions, experience...'
    }
  ]
};

// Default template for Speed & Agility
export const speedAgilityTemplate: TrainingTemplate = {
  id: 'default-speedAgility',
  name: 'Speed & Agility Training',
  type: 'speedAgility',
  isDefault: true,
  description: 'Speed training, agility drills, and quick movement patterns',
  fields: [
    {
      fieldId: 'reps',
      label: 'Repetitions',
      type: 'reps',
      required: true,
      min: 1,
      max: 50
    },
    {
      fieldId: 'time',
      label: 'Time (seconds)',
      type: 'duration',
      required: false,
      min: 0,
      max: 300,
      step: 0.1
    },
    {
      fieldId: 'distance',
      label: 'Distance (meters)',
      type: 'distance',
      required: false,
      min: 0,
      max: 1000,
      step: 0.1
    },
    {
      fieldId: 'height',
      label: 'Height (cm)',
      type: 'height',
      required: false,
      min: 0,
      max: 200,
      step: 1
    },
    {
      fieldId: 'restTime',
      label: 'Rest Time (seconds)',
      type: 'duration',
      required: false,
      min: 0,
      max: 600
    },
    {
      fieldId: 'rpe',
      label: 'RPE (Rate of Perceived Exertion)',
      type: 'rpe',
      required: true,
      min: 1,
      max: 10,
      step: 0.5
    },
    {
      fieldId: 'notes',
      label: 'Notes',
      type: 'string',
      required: false,
      placeholder: 'Drill details, technique notes, conditions...'
    }
  ]
};

// Collection of all default templates
export const DEFAULT_TEMPLATES: TrainingTemplate[] = [
  strengthTemplate,
  enduranceTemplate,
  plyometricsTemplate,
  teamSportsTemplate,
  flexibilityTemplate,
  speedAgilityTemplate,
  otherTemplate
];

// Helper function to get template by type
export const getDefaultTemplateByType = (type: ExerciseType): TrainingTemplate | undefined => {
  return DEFAULT_TEMPLATES.find(template => template.type === type);
};

// Helper function to get template by ID
export const getTemplateById = (id: string): TrainingTemplate | undefined => {
  return DEFAULT_TEMPLATES.find(template => template.id === id);
};
