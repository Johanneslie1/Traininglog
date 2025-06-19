import { Exercise } from '@/types/exercise';

type ExerciseTemplate = Omit<Exercise, 'id'>;

// Common exercise properties
const strengthMetrics = {
  trackWeight: true,
  trackReps: true,
  trackRPE: true,
};

const bodyweightMetrics = {
  trackReps: true,
  trackRPE: true,
  trackWeight: false,
};

const cardioMetrics = {
  trackTime: true,
  trackDistance: true,
  trackRPE: true,
  trackWeight: false,
  trackReps: false,
};

// Compound Lifts
export const compoundLifts: ExerciseTemplate[] = [
  {
    name: 'Barbell Back Squat',
    description: 'A fundamental compound exercise for lower body strength.',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    secondaryMuscles: ['core', 'lower_back', 'calves'],
    equipment: ['barbell', 'rack'],
    instructions: [
      'Position bar on upper back',
      'Feet shoulder-width apart',
      'Break at hips and knees',
      'Lower until thighs parallel',
      'Drive through heels to stand'
    ],
    tips: [
      'Keep chest up',
      'Maintain neutral spine',
      'Knees track over toes'
    ],
    defaultUnit: 'kg',
    metrics: strengthMetrics
  },
  {
    name: 'Front Squat',
    description: 'A quad-dominant squat variation that requires good mobility.',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['core', 'lower_back', 'calves', 'shoulders'],
    equipment: ['barbell', 'rack'],
    instructions: [
      'Position bar on front deltoids',
      'Elbows high, fingers under bar',
      'Break at hips and knees',
      'Keep torso upright',
      'Stand by driving through heels'
    ],
    tips: [
      'Keep elbows up throughout',
      'Stay upright',
      'Maintain full grip if possible'
    ],
    defaultUnit: 'kg',
    metrics: strengthMetrics
  },
  // ... Adding first 20 compound lifts
];

// Olympic Lifts
export const olympicLifts: ExerciseTemplate[] = [
  {
    name: 'Power Clean',
    description: 'An explosive Olympic lifting movement essential for power development.',
    type: 'strength',
    category: 'olympic',
    primaryMuscles: ['quadriceps', 'glutes', 'traps'],
    secondaryMuscles: ['core', 'shoulders', 'hamstrings', 'calves'],
    equipment: ['barbell'],
    instructions: [
      'Start with bar at mid-shin',
      'Explosive pull to power position',
      'Triple extension of hips, knees, ankles',
      'Pull under bar and catch in quarter squat',
      'Stand to complete lift'
    ],
    tips: [
      'Keep bar close to body',
      'Fast elbows in turnover',
      'Land with full foot contact'
    ],
    defaultUnit: 'kg',
    metrics: strengthMetrics
  },
  // ... Continue with Olympic lifts
];

// Let me know if you want to see the rest of the categories and exercises. I'll include:
// - Squat variations (20+ exercises)
// - Deadlift variations (15+ exercises)
// - Pressing movements (30+ exercises)
// - Pulling movements (25+ exercises)
// - Olympic lift variations (15+ exercises)
// - Sport-specific power movements (40+ exercises)
// - Plyometric exercises (30+ exercises)
// - Core/stability exercises (50+ exercises)
// - Accessory movements (100+ exercises)
// - Sport-specific conditioning (50+ exercises)
// - Recovery/mobility exercises (25+ exercises)

// Would you like me to continue with more categories and exercises?
