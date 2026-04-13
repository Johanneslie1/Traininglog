import { 
  ActivityType, 
  ResistanceExercise, 
  SportActivity, 
  StretchingExercise, 
  EnduranceExercise, 
  OtherActivity 
} from '@/types/activityTypes';

// Resistance Exercises Database (Strength Training)
export const resistanceExercises: Omit<ResistanceExercise, 'id'>[] = [
  // Compound Movements
  {
    name: 'Barbell Back Squat',
    description: 'A fundamental compound exercise for lower body strength',
    activityType: ActivityType.RESISTANCE,
    category: 'compound',
    primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    secondaryMuscles: ['core', 'calves', 'lower_back'],
    equipment: ['barbell', 'squat_rack'],
    instructions: [
      'Position bar on upper back',
      'Feet shoulder-width apart',
      'Lower until thighs parallel to ground',
      'Drive through heels to stand'
    ],
    tips: ['Keep chest up', 'Maintain neutral spine'],
    defaultUnit: 'kg',
    isDefault: true,
    metrics: {
      trackWeight: true,
      trackReps: true,
      trackRPE: true
    }
  },
  {
    name: 'Deadlift',
    description: 'A fundamental compound exercise for posterior chain strength',
    activityType: ActivityType.RESISTANCE,
    category: 'compound',
    primaryMuscles: ['hamstrings', 'glutes', 'lower_back'],
    secondaryMuscles: ['traps', 'forearms', 'core'],
    equipment: ['barbell'],
    instructions: [
      'Stand with feet hip-width apart',
      'Grip bar outside legs',
      'Keep back straight, chest up',
      'Drive through heels and hips'
    ],
    defaultUnit: 'kg',
    isDefault: true,
    metrics: {
      trackWeight: true,
      trackReps: true,
      trackRPE: true
    }
  },
  {
    name: 'Bench Press',
    description: 'A fundamental compound exercise for upper body pushing strength',
    activityType: ActivityType.RESISTANCE,
    category: 'compound',
    primaryMuscles: ['chest', 'shoulders', 'triceps'],
    secondaryMuscles: ['core'],
    equipment: ['barbell', 'bench'],
    instructions: [
      'Lie on bench with feet on floor',
      'Grip bar slightly wider than shoulders',
      'Lower bar to chest',
      'Press bar up to full extension'
    ],
    defaultUnit: 'kg',
    isDefault: true,
    metrics: {
      trackWeight: true,
      trackReps: true,
      trackRPE: true
    }
  }
];

// Sports Database
export const sportActivities: Omit<SportActivity, 'id'>[] = [
  // Ball Sports
  {
    name: 'Football Match',
    description: 'Competitive football/soccer match',
    activityType: ActivityType.SPORT,
    category: 'team_sport',
    sportType: 'football',
    skillLevel: 'intermediate',
    teamBased: true,
    equipment: ['football', 'boots', 'shin_guards'],
    primarySkills: ['passing', 'dribbling', 'shooting', 'defending'],
    isDefault: true,
    metrics: {
      trackDuration: true,
      trackScore: true,
      trackIntensity: true,
      trackOpponent: true,
      trackPerformance: true
    }
  },
  {
    name: 'Basketball Training',
    description: 'Basketball skills practice session',
    activityType: ActivityType.SPORT,
    category: 'team_sport',
    sportType: 'basketball',
    skillLevel: 'intermediate',
    teamBased: true,
    equipment: ['basketball', 'basketball_shoes'],
    primarySkills: ['shooting', 'dribbling', 'passing', 'defense'],
    isDefault: true,
    metrics: {
      trackDuration: true,
      trackScore: false,
      trackIntensity: true,
      trackPerformance: true
    }
  },
  {
    name: 'Tennis Match',
    description: 'Competitive tennis match',
    activityType: ActivityType.SPORT,
    category: 'racket_sport',
    sportType: 'tennis',
    skillLevel: 'intermediate',
    teamBased: false,
    equipment: ['tennis_racket', 'tennis_balls', 'tennis_shoes'],
    primarySkills: ['serve', 'forehand', 'backhand', 'volley'],
    isDefault: true,
    metrics: {
      trackDuration: true,
      trackScore: true,
      trackIntensity: true,
      trackOpponent: true,
      trackPerformance: true
    }
  },
  // Individual Sports
  {
    name: 'Swimming Training',
    description: 'Swimming technique and endurance training',
    activityType: ActivityType.SPORT,
    category: 'aquatic_sport',
    sportType: 'swimming',
    skillLevel: 'intermediate',
    teamBased: false,
    equipment: ['goggles', 'swimsuit', 'swim_cap'],
    primarySkills: ['freestyle', 'backstroke', 'breaststroke', 'butterfly'],
    isDefault: true,
    metrics: {
      trackDuration: true,
      trackScore: false,
      trackIntensity: true,
      trackPerformance: true
    }
  }
];

// Stretching Exercises Database
export const stretchingExercises: Omit<StretchingExercise, 'id'>[] = [
  // Static Stretches
  {
    name: 'Hamstring Stretch',
    description: 'Static stretch for hamstring flexibility',
    activityType: ActivityType.STRETCHING,
    category: 'static',
    stretchType: 'static',
    targetMuscles: ['hamstrings'],
    bodyRegion: ['legs'],
    difficulty: 'beginner',
    instructions: [
      'Sit with one leg extended',
      'Reach forward toward toes',
      'Hold stretch without bouncing',
      'Feel stretch in back of thigh'
    ],
    isDefault: true,
    metrics: {
      trackDuration: true,
      trackHoldTime: true,
      trackIntensity: true,
      trackFlexibility: true
    }
  },
  {
    name: 'Shoulder Cross-Body Stretch',
    description: 'Static stretch for shoulder flexibility',
    activityType: ActivityType.STRETCHING,
    category: 'static',
    stretchType: 'static',
    targetMuscles: ['shoulders', 'rear_deltoids'],
    bodyRegion: ['upper_body'],
    difficulty: 'beginner',
    instructions: [
      'Pull arm across body',
      'Use opposite hand to assist',
      'Hold stretch gently',
      'Feel stretch in shoulder'
    ],
    isDefault: true,
    metrics: {
      trackDuration: true,
      trackHoldTime: true,
      trackIntensity: true,
      trackFlexibility: true
    }
  },
  // Dynamic Stretches
  {
    name: 'Leg Swings',
    description: 'Dynamic leg mobility exercise',
    activityType: ActivityType.STRETCHING,
    category: 'dynamic',
    stretchType: 'dynamic',
    targetMuscles: ['hip_flexors', 'hamstrings', 'glutes'],
    bodyRegion: ['legs', 'hips'],
    difficulty: 'beginner',
    instructions: [
      'Hold wall or support for balance',
      'Swing leg forward and back',
      'Keep torso upright',
      'Control the movement'
    ],
    isDefault: true,
    metrics: {
      trackDuration: true,
      trackHoldTime: false,
      trackIntensity: true,
      trackFlexibility: true
    }
  }
];

// Endurance Exercises Database
export const enduranceExercises: Omit<EnduranceExercise, 'id'>[] = [
  // Running
  {
    name: 'Outdoor Running',
    description: 'Running outdoors for cardiovascular fitness',
    activityType: ActivityType.ENDURANCE,
    category: 'running',
    enduranceType: 'running',
    environment: 'outdoor',
    intensity: 'moderate',
    equipment: ['running_shoes', 'fitness_tracker'],
    isDefault: true,
    metrics: {
      trackDistance: true,
      trackDuration: true,
      trackPace: true,
      trackHeartRate: true,
      trackCalories: true,
      trackElevation: true
    }
  },
  {
    name: 'Treadmill Running',
    description: 'Indoor treadmill running session',
    activityType: ActivityType.ENDURANCE,
    category: 'running',
    enduranceType: 'running',
    environment: 'indoor',
    intensity: 'moderate',
    equipment: ['treadmill', 'running_shoes'],
    isDefault: true,
    metrics: {
      trackDistance: true,
      trackDuration: true,
      trackPace: true,
      trackHeartRate: true,
      trackCalories: true
    }
  },
  // Cycling
  {
    name: 'Road Cycling',
    description: 'Outdoor road cycling for endurance',
    activityType: ActivityType.ENDURANCE,
    category: 'cycling',
    enduranceType: 'cycling',
    environment: 'outdoor',
    intensity: 'moderate',
    equipment: ['bicycle', 'helmet', 'cycling_shoes'],
    isDefault: true,
    metrics: {
      trackDistance: true,
      trackDuration: true,
      trackPace: true,
      trackHeartRate: true,
      trackCalories: true,
      trackElevation: true
    }
  },
  {
    name: 'Stationary Bike',
    description: 'Indoor stationary bike session',
    activityType: ActivityType.ENDURANCE,
    category: 'cycling',
    enduranceType: 'cycling',
    environment: 'indoor',
    intensity: 'moderate',
    equipment: ['stationary_bike'],
    isDefault: true,
    metrics: {
      trackDistance: true,
      trackDuration: true,
      trackPace: true,
      trackHeartRate: true,
      trackCalories: true
    }
  },
  // Swimming
  {
    name: 'Pool Swimming',
    description: 'Swimming laps for cardiovascular fitness',
    activityType: ActivityType.ENDURANCE,
    category: 'swimming',
    enduranceType: 'swimming',
    environment: 'indoor',
    intensity: 'moderate',
    equipment: ['goggles', 'swimsuit', 'swim_cap'],
    isDefault: true,
    metrics: {
      trackDistance: true,
      trackDuration: true,
      trackPace: true,
      trackHeartRate: true,
      trackCalories: true
    }
  }
];

// Other Activities Database (examples)
export const otherActivities: Omit<OtherActivity, 'id'>[] = [
  {
    name: 'Meditation Session',
    description: 'Mindfulness and meditation practice',
    activityType: ActivityType.OTHER,
    category: 'wellness',
    customCategory: 'mindfulness',
    customFields: [
      {
        fieldId: 'duration',
        label: 'Duration',
        type: 'duration',
        required: true,
        unit: 'minutes'
      },
      {
        fieldId: 'technique',
        label: 'Meditation Technique',
        type: 'select',
        required: false,
        options: ['mindfulness', 'breathing', 'body_scan', 'loving_kindness']
      },
      {
        fieldId: 'focus_level',
        label: 'Focus Level',
        type: 'number',
        required: false,
        validation: { min: 1, max: 10 }
      }
    ],
    isDefault: true,
    metrics: {
      duration: true,
      technique: true,
      focus_level: true
    }
  },
  {
    name: 'Physiotherapy Session',
    description: 'Physical therapy and rehabilitation exercises',
    activityType: ActivityType.OTHER,
    category: 'rehabilitation',
    customCategory: 'therapy',
    customFields: [
      {
        fieldId: 'duration',
        label: 'Session Duration',
        type: 'duration',
        required: true,
        unit: 'minutes'
      },
      {
        fieldId: 'body_part',
        label: 'Target Body Part',
        type: 'select',
        required: true,
        options: ['knee', 'shoulder', 'back', 'ankle', 'wrist', 'hip']
      },
      {
        fieldId: 'pain_level_before',
        label: 'Pain Level Before',
        type: 'number',
        required: false,
        validation: { min: 0, max: 10 }
      },
      {
        fieldId: 'pain_level_after',
        label: 'Pain Level After',
        type: 'number',
        required: false,
        validation: { min: 0, max: 10 }
      }
    ],
    isDefault: true,
    metrics: {
      duration: true,
      body_part: true,
      pain_level_before: true,
      pain_level_after: true
    }
  }
];

// Database collections by activity type
export const activityDatabases = {
  [ActivityType.RESISTANCE]: resistanceExercises,
  [ActivityType.SPORT]: sportActivities,
  [ActivityType.STRETCHING]: stretchingExercises,
  [ActivityType.ENDURANCE]: enduranceExercises,
  [ActivityType.OTHER]: otherActivities,
  [ActivityType.SPEED_AGILITY]: [] // TODO: Add speed agility exercises from JSON
};

// Helper functions
export const getActivitiesByType = (activityType: ActivityType) => {
  return activityDatabases[activityType] || [];
};

export const getAllActivities = () => {
  return Object.values(activityDatabases).flat();
};

export const getCategoriesByActivityType = (activityType: ActivityType): string[] => {
  const activities = getActivitiesByType(activityType);
  return [...new Set(activities.map(activity => activity.category))];
};
