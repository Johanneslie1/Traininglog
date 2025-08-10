import { ExerciseSet } from '../types/sets';

export type ExerciseType = 'strength' | 'plyometrics' | 'endurance' | 'teamSports' | 'flexibility' | 'speedAgility' | 'other';

export interface ExerciseTypeConfig {
  type: ExerciseType;
  requiredStats: (keyof ExerciseSet)[];
  optionalStats: (keyof ExerciseSet)[];
  displayName: string;
  description: string;
  categories: string[];
  icon: string;
  color: string;
}

export const EXERCISE_TYPE_CONFIGS: Record<ExerciseType, ExerciseTypeConfig> = {
  strength: {
    type: 'strength',
    requiredStats: ['reps', 'weight', 'rir'],
    optionalStats: ['restTime', 'notes'],
    displayName: 'Strength',
    description: 'Weight training and resistance exercises',
    categories: ['Compound', 'Isolation', 'Olympic', 'Power'],
    icon: '🏋️',
    color: 'bg-blue-600'
  },
  plyometrics: {
    type: 'plyometrics',
    requiredStats: ['reps', 'rpe'],
    optionalStats: ['height', 'distance', 'restTime', 'notes'],
    displayName: 'Plyometrics',
    description: 'Explosive and reactive training',
    categories: ['Jump', 'Throw', 'Reactive', 'Sprint'],
    icon: '🦘',
    color: 'bg-orange-600'
  },
  endurance: {
    type: 'endurance',
    requiredStats: ['duration', 'rpe'],
    optionalStats: ['distance', 'hrZone1', 'hrZone2', 'hrZone3', 'notes'],
    displayName: 'Endurance',
    description: 'Cardiovascular and endurance training',
    categories: ['Running', 'Cycling', 'Swimming', 'Walking', 'Rowing'],
    icon: '🏃',
    color: 'bg-green-600'
  },
  teamSports: {
    type: 'teamSports',
    requiredStats: ['duration', 'rpe'],
    optionalStats: ['distance', 'hrZone1', 'hrZone2', 'hrZone3', 'notes'],
    displayName: 'Team Sports',
    description: 'Team-based sports and activities',
    categories: [
      'Football', 'American Football', 'Basketball', 'Volleyball', 'Baseball', 
      'Cricket', 'Rugby', 'Handball', 'Ice Hockey', 'Field Hockey', 
      'Ultimate Frisbee', 'Water Polo', 'Lacrosse', 'Netball', 'Softball'
    ],
    icon: '⚽',
    color: 'bg-purple-600'
  },
  flexibility: {
    type: 'flexibility',
    requiredStats: ['duration', 'stretchType', 'intensity'],
    optionalStats: ['notes'],
    displayName: 'Flexibility',
    description: 'Stretching and mobility work',
    categories: ['Static', 'Dynamic', 'PNF', 'Yoga', 'Mobility'],
    icon: '🧘',
    color: 'bg-pink-600'
  },
  speedAgility: {
    type: 'speedAgility',
    requiredStats: ['reps', 'rpe'],
    optionalStats: ['distance', 'time', 'restTime', 'height', 'notes'],
    displayName: 'Speed & Agility',
    description: 'Speed training, agility drills, and quick movement patterns',
    categories: ['Sprint', 'Ladder Drills', 'Cone Drills', 'Shuttle Runs', 'Change of Direction', 'Acceleration', 'Reaction Time'],
    icon: '⚡',
    color: 'bg-yellow-600'
  },
  other: {
    type: 'other',
    requiredStats: ['duration', 'rpe'],
    optionalStats: ['distance', 'hrZone1', 'hrZone2', 'hrZone3', 'notes'],
    displayName: 'Outdoor Activities',
    description: 'Outdoor activities, hiking, climbing, and other recreational activities',
    categories: [
      'Hiking', 'Walking', 'Rock Climbing', 'Bouldering', 'Mountain Biking',
      'Trail Running', 'Kayaking', 'Canoeing', 'Skiing', 'Snowboarding',
      'Surfing', 'Stand-up Paddleboarding', 'Camping', 'Backpacking',
      'Martial Arts', 'Dancing', 'Recreational Activities'
    ],
    icon: '�️',
    color: 'bg-gray-600'
  }
};

export const getExerciseTypeConfig = (type: ExerciseType): ExerciseTypeConfig => {
  return EXERCISE_TYPE_CONFIGS[type];
};

export const getAllExerciseTypes = (): ExerciseTypeConfig[] => {
  return Object.values(EXERCISE_TYPE_CONFIGS);
};

export const getExerciseTypeByCategory = (category: string): ExerciseType | null => {
  // Normalize category for matching
  const normalizedCategory = category.toLowerCase();
  
  // Check for exact matches first
  for (const [type, config] of Object.entries(EXERCISE_TYPE_CONFIGS)) {
    if (config.categories.some(cat => cat.toLowerCase() === normalizedCategory)) {
      return type as ExerciseType;
    }
  }
  
  // Check for partial matches with common patterns
  if (normalizedCategory.includes('cardio') || 
      normalizedCategory.includes('running') || 
      normalizedCategory.includes('cycling') || 
      normalizedCategory.includes('swimming') ||
      normalizedCategory.includes('walking') ||
      normalizedCategory.includes('rowing') ||
      normalizedCategory.includes('endurance')) {
    return 'endurance';
  }
  
  if (normalizedCategory.includes('stretch') || 
      normalizedCategory.includes('flexibility') ||
      normalizedCategory.includes('yoga') ||
      normalizedCategory.includes('mobility')) {
    return 'flexibility';
  }
  
  if (normalizedCategory.includes('jump') || 
      normalizedCategory.includes('plyometric') ||
      normalizedCategory.includes('explosive') ||
      normalizedCategory.includes('sprint') ||
      normalizedCategory.includes('agility') ||
      normalizedCategory.includes('speed')) {
    return 'plyometrics';
  }
  
  if (normalizedCategory.includes('team') ||
      normalizedCategory.includes('sport') ||
      normalizedCategory.includes('football') ||
      normalizedCategory.includes('basketball') ||
      normalizedCategory.includes('soccer')) {
    return 'teamSports';
  }
  
  return null;
};

/**
 * Gets exercise type by exercise name patterns - fallback method
 */
export const getExerciseTypeByName = (name: string): ExerciseType | null => {
  const normalizedName = name.toLowerCase();
  
  // Endurance patterns
  if (normalizedName.includes('swimming') ||
      normalizedName.includes('running') ||
      normalizedName.includes('cycling') ||
      normalizedName.includes('rowing') ||
      normalizedName.includes('walking') ||
      normalizedName.includes('jogging') ||
      normalizedName.includes('cardio')) {
    return 'endurance';
  }
  
  // Flexibility patterns
  if (normalizedName.includes('stretch') ||
      normalizedName.includes('yoga') ||
      normalizedName.includes('mobility')) {
    return 'flexibility';
  }
  
  // Plyometrics patterns
  if (normalizedName.includes('jump') ||
      normalizedName.includes('hop') ||
      normalizedName.includes('bound') ||
      normalizedName.includes('plyometric') ||
      normalizedName.includes('explosive')) {
    return 'plyometrics';
  }
  
  // Team sports patterns
  if (normalizedName.includes('football') ||
      normalizedName.includes('american football') ||
      normalizedName.includes('basketball') ||
      normalizedName.includes('soccer') ||
      normalizedName.includes('volleyball') ||
      normalizedName.includes('baseball') ||
      normalizedName.includes('cricket') ||
      normalizedName.includes('rugby') ||
      normalizedName.includes('handball') ||
      normalizedName.includes('hockey') ||
      normalizedName.includes('ultimate') ||
      normalizedName.includes('frisbee') ||
      normalizedName.includes('water polo') ||
      normalizedName.includes('lacrosse') ||
      normalizedName.includes('netball') ||
      normalizedName.includes('softball')) {
    return 'teamSports';
  }
  
  // Outdoor activities patterns
  if (normalizedName.includes('hiking') ||
      normalizedName.includes('walking') ||
      normalizedName.includes('climbing') ||
      normalizedName.includes('bouldering') ||
      normalizedName.includes('mountain biking') ||
      normalizedName.includes('trail running') ||
      normalizedName.includes('kayaking') ||
      normalizedName.includes('canoeing') ||
      normalizedName.includes('skiing') ||
      normalizedName.includes('snowboarding') ||
      normalizedName.includes('surfing') ||
      normalizedName.includes('paddleboard') ||
      normalizedName.includes('camping') ||
      normalizedName.includes('backpacking') ||
      normalizedName.includes('martial arts') ||
      normalizedName.includes('dancing')) {
    return 'other';
  }
  
  return null;
};

export const validateRequiredStats = (set: Partial<ExerciseSet>, exerciseType: ExerciseType): { isValid: boolean; missingStats: string[] } => {
  const config = getExerciseTypeConfig(exerciseType);
  const missingStats: string[] = [];
  
  config.requiredStats.forEach(stat => {
    const value = set[stat];
    if (value === undefined || value === null || value === '') {
      missingStats.push(stat as string);
    }
  });
  
  return {
    isValid: missingStats.length === 0,
    missingStats
  };
};

// Heart Rate Zone definitions
export const HR_ZONES = {
  zone1: { name: 'Zone 1 (Recovery)', color: 'bg-blue-500', range: '50-60% HRmax' },
  zone2: { name: 'Zone 2 (Aerobic)', color: 'bg-green-500', range: '60-70% HRmax' },
  zone3: { name: 'Zone 3 (Threshold)', color: 'bg-yellow-500', range: '70-80% HRmax' }
};

// Stretch types for flexibility exercises
export const STRETCH_TYPES = [
  'Static Hold',
  'Dynamic Movement',
  'PNF Stretching',
  'Active Isolated',
  'Ballistic',
  'Myofascial Release'
];

// RPE Scale (Rate of Perceived Exertion)
export const RPE_SCALE = {
  1: { label: 'Very Light', description: 'Could continue for hours' },
  2: { label: 'Light', description: 'Could continue for hours' },
  3: { label: 'Moderate', description: 'Could continue for 30+ minutes' },
  4: { label: 'Somewhat Hard', description: 'Could continue for 10-15 minutes' },
  5: { label: 'Hard', description: 'Could continue for 5-10 minutes' },
  6: { label: 'Hard+', description: 'Could continue for 3-5 minutes' },
  7: { label: 'Very Hard', description: 'Could continue for 1-3 minutes' },
  8: { label: 'Very Hard+', description: 'Could continue for 30-60 seconds' },
  9: { label: 'Extremely Hard', description: 'Could continue for 10-30 seconds' },
  10: { label: 'Maximum', description: 'Cannot continue' }
};

// RIR Scale (Reps in Reserve)
export const RIR_SCALE = {
  0: { label: 'RIR 0', description: 'Could not do any more reps' },
  1: { label: 'RIR 1', description: 'Could do 1 more rep' },
  2: { label: 'RIR 2', description: 'Could do 2 more reps' },
  3: { label: 'RIR 3', description: 'Could do 3 more reps' },
  4: { label: 'RIR 4', description: 'Could do 4 more reps' },
  5: { label: 'RIR 5+', description: 'Could do 5+ more reps' }
};
