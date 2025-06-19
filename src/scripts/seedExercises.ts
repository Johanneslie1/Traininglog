import { createExercise } from '../services/firebase/exercises';
import { Exercise } from '../types/exercise';

const defaultExercises: Omit<Exercise, 'id'>[] = [
  {
    name: 'Barbell Back Squat',
    description: 'A compound lower body exercise that primarily targets the quadriceps, hamstrings, and glutes.',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    secondaryMuscles: ['core', 'lower_back', 'calves'],
    equipment: ['barbell', 'rack'],
    instructions: [
      'Position the barbell on your upper back, resting it on your trapezius muscles',
      'Stand with feet shoulder-width apart',
      'Break at the hips and knees simultaneously',
      'Lower your body until your thighs are parallel to the ground',
      'Drive through your heels to return to the starting position'
    ],
    tips: [
      'Keep your chest up throughout the movement',
      'Maintain a neutral spine',
      'Drive your knees out in line with your toes'
    ],
    defaultUnit: 'kg',
    metrics: {
      trackWeight: true,
      trackReps: true,
      trackRPE: true
    }
  },
  {
    name: 'Conventional Deadlift',
    description: 'A compound exercise that targets multiple muscle groups and is essential for building overall strength.',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['lower_back', 'glutes', 'hamstrings'],
    secondaryMuscles: ['traps', 'forearms', 'core', 'quadriceps'],
    equipment: ['barbell'],
    instructions: [
      'Stand with feet hip-width apart, barbell over midfoot',
      'Hinge at the hips to grip the bar outside your legs',
      'Keep your chest up and back straight',
      'Drive through your heels and extend your hips and knees',
      'Return the weight to the ground with control'
    ],
    tips: [
      'Keep the bar close to your body throughout the movement',
      'Engage your lats before initiating the pull',
      'Think about pushing the floor away rather than pulling the weight'
    ],
    defaultUnit: 'kg',
    metrics: {
      trackWeight: true,
      trackReps: true,
      trackRPE: true
    }
  },
  {
    name: 'Bench Press',
    description: 'A compound upper body exercise that primarily targets the chest, shoulders, and triceps.',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['chest', 'shoulders', 'triceps'],
    secondaryMuscles: ['core', 'forearms'],
    equipment: ['barbell', 'bench', 'rack'],
    instructions: [
      'Lie on a flat bench with feet planted firmly on the ground',
      'Grip the barbell slightly wider than shoulder-width',
      'Unrack the bar and lower it to your mid-chest',
      'Press the bar back up to the starting position',
      'Keep your wrists straight and elbows at about 45-degree angle'
    ],
    tips: [
      'Keep your back tight against the bench',
      'Tuck your elbows at roughly 45 degrees',
      'Drive your feet into the ground for stability'
    ],
    defaultUnit: 'kg',
    metrics: {
      trackWeight: true,
      trackReps: true,
      trackRPE: true
    }
  },
  {
    name: 'Pull-up',
    description: 'A bodyweight exercise that builds upper body strength, particularly in the back and arms.',
    type: 'bodyweight',
    category: 'compound',
    primaryMuscles: ['lats', 'back'],
    secondaryMuscles: ['biceps', 'shoulders', 'core'],
    equipment: ['pull-up bar'],
    instructions: [
      'Hang from a pull-up bar with hands slightly wider than shoulder-width',
      'Engage your core and squeeze your shoulder blades together',
      'Pull yourself up until your chin is over the bar',
      'Lower yourself back down with control',
      'Repeat for desired repetitions'
    ],
    tips: [
      'Avoid swinging or using momentum',
      'Keep your core engaged throughout',
      'Focus on full range of motion'
    ],
    defaultUnit: 'reps',
    metrics: {
      trackReps: true,
      trackWeight: false,
      trackRPE: true
    }
  }
];

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    for (const exercise of defaultExercises) {
      await createExercise(exercise);
      console.log(`Added exercise: ${exercise.name}`);
    }
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

export default seedDatabase;
