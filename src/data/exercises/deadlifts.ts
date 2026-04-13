import { ExerciseTemplate } from './types';
import { strengthMetrics } from './metrics';

export const deadliftVariations: ExerciseTemplate[] = [
  {
    name: 'Romanian Deadlift',
    description: 'A hip-hinge movement that targets the posterior chain.',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['hamstrings', 'glutes', 'lower_back'],
    secondaryMuscles: ['traps', 'forearms', 'core'],
    equipment: ['barbell'],
    instructions: [
      'Start from standing with bar',
      'Push hips back maintaining slight knee bend',
      'Lower bar along thighs',
      'Feel stretch in hamstrings',
      'Drive hips forward to stand'
    ],
    tips: [
      'Keep bar close to legs',
      'Maintain neutral spine',
      'Hinge at hips, not waist'
    ],
    defaultUnit: 'kg',
    metrics: strengthMetrics
  },
  {
    name: 'Trap Bar Deadlift',
    description: 'A deadlift variation that places less stress on the lower back.',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    secondaryMuscles: ['lower_back', 'traps', 'forearms'],
    equipment: ['trap-bar'],
    instructions: [
      'Stand inside trap bar',
      'Hinge at hips to grip handles',
      'Chest up, core tight',
      'Drive through floor to stand',
      'Lock out hips and knees'
    ],
    tips: [
      'Push floor away',
      'Keep chest up throughout',
      'Drive hips forward at top'
    ],
    defaultUnit: 'kg',
    metrics: strengthMetrics
  },
  {
    name: 'Single-Leg Romanian Deadlift',
    description: 'A unilateral hinge movement for posterior chain development.',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['lower_back', 'core', 'calves'],
    equipment: ['dumbbell', 'kettlebell'],
    instructions: [
      'Stand on one leg',
      'Hinge forward from hip',
      'Lower weight toward floor',
      'Keep back straight',
      'Return to start position'
    ],
    tips: [
      'Keep standing knee soft',
      'Hips square to ground',
      'Focus on balance'
    ],
    defaultUnit: 'kg',
    metrics: strengthMetrics
  }
];
