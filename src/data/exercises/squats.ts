import { ExerciseTemplate } from './types';
import { strengthMetrics } from './metrics';

export const squatVariations: ExerciseTemplate[] = [
  {
    name: 'Box Squat',
    description: 'A squat variation that helps develop explosive power from a dead stop.',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    secondaryMuscles: ['core', 'lower_back', 'calves'],
    equipment: ['barbell', 'rack', 'box'],
    instructions: [
      'Set up box at appropriate height',
      'Unrack bar and position for squat',
      'Sit back to box with control',
      'Pause briefly without relaxing',
      'Drive up explosively'
    ],
    tips: [
      'Keep tension throughout movement',
      'Don\'t relax at bottom',
      'Drive up immediately after touching'
    ],
    defaultUnit: 'kg',
    metrics: strengthMetrics
  },
  {
    name: 'Safety Bar Squat',
    description: 'A squat variation that places less stress on shoulders and elbows.',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    secondaryMuscles: ['core', 'lower_back', 'calves'],
    equipment: ['safety-bar', 'rack'],
    instructions: [
      'Position safety bar on upper back',
      'Hold handles at sides',
      'Break at hips and knees',
      'Maintain upright position',
      'Drive through heels to stand'
    ],
    tips: [
      'Stay upright',
      'Control forward lean',
      'Keep elbows down'
    ],
    defaultUnit: 'kg',
    metrics: strengthMetrics
  },
  {
    name: 'Split Squat',
    description: 'A unilateral squat variation for developing single-leg strength.',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    secondaryMuscles: ['core', 'calves'],
    equipment: ['bodyweight', 'dumbbell', 'barbell'],
    instructions: [
      'Take a long step forward',
      'Keep torso upright',
      'Lower back knee toward ground',
      'Front thigh parallel at bottom',
      'Drive through front foot to stand'
    ],
    tips: [
      'Keep front knee tracking over toe',
      'Maintain upright posture',
      'Control the descent'
    ],
    defaultUnit: 'kg',
    metrics: strengthMetrics
  }
  // ... Continue with more squat variations
];
