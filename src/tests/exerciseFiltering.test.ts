import { describe, test, expect } from '@jest/globals';
import { Exercise, ExerciseType, ExerciseCategory } from '../types/exercise';

// Mock exercise data for testing
const mockExercises: Exercise[] = [
  // Strength exercises
  {
    id: '1',
    name: 'Barbell Back Squat',
    description: 'A compound lower body exercise',
    type: 'strength',
    category: 'compound',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    instructions: [],
    defaultUnit: 'kg',
    metrics: { trackWeight: true, trackReps: true }
  },
  {
    id: '2',
    name: 'Bicep Curls',
    description: 'An isolation exercise for biceps',
    type: 'strength',
    category: 'isolation',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    instructions: [],
    defaultUnit: 'kg',
    metrics: { trackWeight: true, trackReps: true }
  },
  // Cardio exercises
  {
    id: '3',
    name: 'Running',
    description: 'Cardiovascular exercise',
    type: 'cardio',
    category: 'cardio',
    primaryMuscles: ['quadriceps', 'hamstrings'],
    secondaryMuscles: ['calves'],
    instructions: [],
    defaultUnit: 'time',
    metrics: { trackTime: true, trackDistance: true }
  },
  {
    id: '4',
    name: 'Treadmill Walking',
    description: 'Low intensity cardio exercise',
    type: 'cardio',
    category: 'cardio',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: [],
    instructions: [],
    defaultUnit: 'time',
    metrics: { trackTime: true }
  },
  // Plyometric exercises
  {
    id: '5',
    name: 'Box Jumps',
    description: 'Explosive plyometric exercise',
    type: 'plyometrics',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['calves'],
    instructions: [],
    defaultUnit: 'reps',
    metrics: { trackReps: true, trackRPE: true }
  },
  {
    id: '6',
    name: 'Speed Ladder Drills',
    description: 'Agility and speed training exercise',
    type: 'plyometrics',
    category: 'power',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['calves'],
    instructions: [],
    defaultUnit: 'time',
    metrics: { trackTime: true }
  },
  // Flexibility exercises
  {
    id: '7',
    name: 'Hamstring Stretch',
    description: 'Flexibility exercise for hamstrings',
    type: 'flexibility',
    category: 'stretching',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    instructions: [],
    defaultUnit: 'time',
    metrics: { trackTime: true }
  },
  {
    id: '8',
    name: 'Yoga Flow',
    description: 'Dynamic mobility and flexibility sequence',
    type: 'flexibility',
    category: 'stretching',
    primaryMuscles: ['full_body'],
    secondaryMuscles: [],
    instructions: [],
    defaultUnit: 'time',
    metrics: { trackTime: true }
  },
  // Team sports exercises
  {
    id: '9',
    name: 'Basketball Shooting Drills',
    description: 'Sport-specific training for basketball',
    type: 'teamSports',
    category: 'power',
    primaryMuscles: ['shoulders', 'core'],
    secondaryMuscles: ['quadriceps'],
    instructions: [],
    defaultUnit: 'reps',
    metrics: { trackReps: true }
  },
  // Bodyweight exercises
  {
    id: '10',
    name: 'Push-ups',
    description: 'Bodyweight chest exercise',
    type: 'bodyweight',
    category: 'compound',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    instructions: [],
    defaultUnit: 'reps',
    metrics: { trackReps: true }
  },
  {
    id: '11',
    name: 'Plank',
    description: 'Core stability bodyweight exercise',
    type: 'bodyweight',
    category: 'isolation',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    instructions: [],
    defaultUnit: 'time',
    metrics: { trackTime: true }
  },
  // Olympic exercises
  {
    id: '12',
    name: 'Power Clean',
    description: 'Olympic lifting movement',
    type: 'strength',
    category: 'olympic',
    primaryMuscles: ['quadriceps', 'glutes', 'traps'],
    secondaryMuscles: ['shoulders', 'core'],
    instructions: [],
    defaultUnit: 'kg',
    metrics: { trackWeight: true, trackReps: true }
  }
];

// Function to simulate the filtering logic from ExerciseSearch component
function filterExercisesByTrainingType(exercises: Exercise[], trainingType: string): Exercise[] {
  return exercises.filter(exercise => {
    const name = exercise.name.toLowerCase();
    const description = exercise.description?.toLowerCase() || '';

    switch (trainingType) {
      case 'strength':
        return exercise.type === 'strength';
      case 'plyometrics':
        return exercise.type === 'plyometrics' || 
               exercise.category === 'power' ||
               name.includes('plyometric') ||
               name.includes('jump') ||
               name.includes('hop') ||
               description.includes('plyometric');
      case 'endurance':
        return exercise.type === 'endurance' || 
               exercise.type === 'cardio' ||
               name.includes('run') ||
               name.includes('bike') ||
               name.includes('treadmill') ||
               name.includes('rowing');
      case 'teamSports':
        return exercise.type === 'teamSports' ||
               description.includes('basketball') ||
               description.includes('football') ||
               description.includes('soccer') ||
               description.includes('volleyball') ||
               description.includes('tennis') ||
               description.includes('sport') ||
               name.includes('agility') ||
               name.includes('lateral');
      case 'flexibility':
        return exercise.type === 'flexibility' || 
               exercise.category === 'stretching' ||
               name.includes('stretch') ||
               name.includes('mobility');
      case 'cardio':
        return exercise.type === 'cardio';
      case 'speed':
        return name.includes('speed') ||
               name.includes('sprint') ||
               name.includes('dash') ||
               description.includes('speed') ||
               description.includes('sprint') ||
               description.includes('explosive') ||
               exercise.category === 'power';
      case 'agility':
        return name.includes('agility') ||
               name.includes('ladder') ||
               name.includes('cone') ||
               name.includes('lateral') ||
               name.includes('carioca') ||
               description.includes('agility') ||
               description.includes('lateral');
      case 'bodyweight':
        return exercise.type === 'bodyweight';
      case 'other':
        return exercise.type === 'other' ||
               name.includes('hiking') ||
               name.includes('walking');
      default:
        return true;
    }
  });
}

describe('Exercise Filtering by Training Type', () => {
  describe('Strength Training Filter', () => {
    test('should return only strength exercises', () => {
      const filtered = filterExercisesByTrainingType(mockExercises, 'strength');
      
      expect(filtered).toHaveLength(3); // Squat, Bicep Curls, Power Clean
      filtered.forEach(exercise => {
        expect(exercise.type).toBe('strength');
      });
      
      const exerciseNames = filtered.map(ex => ex.name);
      expect(exerciseNames).toContain('Barbell Back Squat');
      expect(exerciseNames).toContain('Bicep Curls');
      expect(exerciseNames).toContain('Power Clean');
    });
  });

  describe('Cardio/Endurance Training Filter', () => {
    test('should return cardio exercises for endurance filter', () => {
      const filtered = filterExercisesByTrainingType(mockExercises, 'endurance');
      
      expect(filtered).toHaveLength(2); // Running, Treadmill Walking
      filtered.forEach(exercise => {
        expect(exercise.type).toBe('cardio');
      });
    });

    test('should return cardio exercises for cardio filter', () => {
      const filtered = filterExercisesByTrainingType(mockExercises, 'cardio');
      
      expect(filtered).toHaveLength(2); // Running, Treadmill Walking
      filtered.forEach(exercise => {
        expect(exercise.type).toBe('cardio');
      });
    });

    test('should include exercises with cardio keywords in name', () => {
      const cardioExercise: Exercise = {
        ...mockExercises[0],
        id: 'test-cardio',
        name: 'Bike Riding',
        type: 'strength', // Wrong type, but should be caught by name
        category: 'compound'
      };
      
      const testExercises = [...mockExercises, cardioExercise];
      const filtered = filterExercisesByTrainingType(testExercises, 'endurance');
      
      expect(filtered.some(ex => ex.name === 'Bike Riding')).toBe(true);
    });
  });

  describe('Plyometrics Training Filter', () => {
    test('should return plyometric exercises', () => {
      const filtered = filterExercisesByTrainingType(mockExercises, 'plyometrics');
      
      expect(filtered).toHaveLength(3); // Box Jumps, Speed Ladder Drills, Basketball Shooting Drills (has power category)
      filtered.forEach(exercise => {
        expect(exercise.type === 'plyometrics' || exercise.category === 'power').toBe(true);
      });
    });

    test('should include exercises with plyometric keywords', () => {
      const jumpExercise: Exercise = {
        ...mockExercises[0],
        id: 'test-jump',
        name: 'Jump Squats',
        type: 'strength',
        category: 'compound'
      };
      
      const testExercises = [...mockExercises, jumpExercise];
      const filtered = filterExercisesByTrainingType(testExercises, 'plyometrics');
      
      expect(filtered.some(ex => ex.name === 'Jump Squats')).toBe(true);
    });
  });

  describe('Flexibility Training Filter', () => {
    test('should return flexibility exercises', () => {
      const filtered = filterExercisesByTrainingType(mockExercises, 'flexibility');
      
      expect(filtered).toHaveLength(2); // Hamstring Stretch, Yoga Flow
      filtered.forEach(exercise => {
        expect(exercise.type === 'flexibility' || exercise.category === 'stretching').toBe(true);
      });
    });

    test('should include exercises with stretch keywords', () => {
      const stretchExercise: Exercise = {
        ...mockExercises[0],
        id: 'test-stretch',
        name: 'Hip Flexor Stretch',
        type: 'strength',
        category: 'isolation'
      };
      
      const testExercises = [...mockExercises, stretchExercise];
      const filtered = filterExercisesByTrainingType(testExercises, 'flexibility');
      
      expect(filtered.some(ex => ex.name === 'Hip Flexor Stretch')).toBe(true);
    });
  });

  describe('Team Sports Training Filter', () => {
    test('should return team sports exercises', () => {
      const filtered = filterExercisesByTrainingType(mockExercises, 'teamSports');
      
      expect(filtered).toHaveLength(1); // Basketball Shooting Drills
      expect(filtered[0].type).toBe('teamSports');
    });

    test('should include exercises with sport keywords in description', () => {
      const sportExercise: Exercise = {
        ...mockExercises[0],
        id: 'test-sport',
        name: 'Agility Drills',
        description: 'Football specific training',
        type: 'strength',
        category: 'compound'
      };
      
      const testExercises = [...mockExercises, sportExercise];
      const filtered = filterExercisesByTrainingType(testExercises, 'teamSports');
      
      expect(filtered.some(ex => ex.name === 'Agility Drills')).toBe(true);
    });
  });

  describe('Speed Training Filter', () => {
    test('should return exercises with speed keywords or power category', () => {
      const filtered = filterExercisesByTrainingType(mockExercises, 'speed');
      
      // Should include exercises with power category (Box Jumps, Speed Ladder Drills)
      // and Basketball Shooting Drills
      expect(filtered.length).toBeGreaterThan(0);
      
      const powerExercises = filtered.filter(ex => ex.category === 'power');
      expect(powerExercises.length).toBeGreaterThan(0);
    });

    test('should include exercises with speed keywords in name', () => {
      const speedExercise: Exercise = {
        ...mockExercises[0],
        id: 'test-speed',
        name: 'Sprint Intervals',
        type: 'cardio',
        category: 'cardio'
      };
      
      const testExercises = [...mockExercises, speedExercise];
      const filtered = filterExercisesByTrainingType(testExercises, 'speed');
      
      expect(filtered.some(ex => ex.name === 'Sprint Intervals')).toBe(true);
    });
  });

  describe('Agility Training Filter', () => {
    test('should return exercises with agility keywords', () => {
      const filtered = filterExercisesByTrainingType(mockExercises, 'agility');
      
      // Should include Speed Ladder Drills (has 'ladder' in name)
      expect(filtered.some(ex => ex.name === 'Speed Ladder Drills')).toBe(true);
    });

    test('should include exercises with agility keywords in name', () => {
      const agilityExercise: Exercise = {
        ...mockExercises[0],
        id: 'test-agility',
        name: 'Cone Drills',
        type: 'plyometrics',
        category: 'power'
      };
      
      const testExercises = [...mockExercises, agilityExercise];
      const filtered = filterExercisesByTrainingType(testExercises, 'agility');
      
      expect(filtered.some(ex => ex.name === 'Cone Drills')).toBe(true);
    });
  });

  describe('Bodyweight Training Filter', () => {
    test('should return only bodyweight exercises', () => {
      const filtered = filterExercisesByTrainingType(mockExercises, 'bodyweight');
      
      expect(filtered).toHaveLength(2); // Push-ups, Plank
      filtered.forEach(exercise => {
        expect(exercise.type).toBe('bodyweight');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty exercise list', () => {
      const filtered = filterExercisesByTrainingType([], 'strength');
      expect(filtered).toHaveLength(0);
    });

    test('should handle invalid training type', () => {
      const filtered = filterExercisesByTrainingType(mockExercises, 'invalidType');
      expect(filtered).toHaveLength(mockExercises.length); // Should return all exercises
    });

    test('should handle exercises with missing description', () => {
      const exerciseWithoutDescription: Exercise = {
        ...mockExercises[0],
        id: 'test-no-desc',
        description: ''
      };
      
      const testExercises = [...mockExercises, exerciseWithoutDescription];
      const filtered = filterExercisesByTrainingType(testExercises, 'strength');
      
      // Should not throw error and should include the exercise if type matches
      expect(filtered.some(ex => ex.id === 'test-no-desc')).toBe(true);
    });

    test('should be case insensitive for keyword matching', () => {
      const upperCaseExercise: Exercise = {
        ...mockExercises[0],
        id: 'test-upper',
        name: 'JUMP TRAINING',
        type: 'strength',
        category: 'compound'
      };
      
      const testExercises = [...mockExercises, upperCaseExercise];
      const filtered = filterExercisesByTrainingType(testExercises, 'plyometrics');
      
      expect(filtered.some(ex => ex.name === 'JUMP TRAINING')).toBe(true);
    });
  });

  describe('Cross-Category Filtering', () => {
    test('should not have overlap between exclusive categories', () => {
      const strengthFiltered = filterExercisesByTrainingType(mockExercises, 'strength');
      const cardioFiltered = filterExercisesByTrainingType(mockExercises, 'cardio');
      
      // No exercise should appear in both strength and cardio results
      const strengthIds = new Set(strengthFiltered.map(ex => ex.id));
      const cardioIds = new Set(cardioFiltered.map(ex => ex.id));
      
      const intersection = new Set([...strengthIds].filter(id => cardioIds.has(id)));
      expect(intersection.size).toBe(0);
    });

    test('should allow power exercises to appear in multiple relevant categories', () => {
      const plyometricsFiltered = filterExercisesByTrainingType(mockExercises, 'plyometrics');
      const speedFiltered = filterExercisesByTrainingType(mockExercises, 'speed');
      
      // Power exercises should appear in both plyometrics and speed results
      const plyometricsIds = new Set(plyometricsFiltered.map(ex => ex.id));
      const speedIds = new Set(speedFiltered.map(ex => ex.id));
      
      const intersection = new Set([...plyometricsIds].filter(id => speedIds.has(id)));
      expect(intersection.size).toBeGreaterThan(0);
    });
  });
});

describe('Exercise Type and Category Validation', () => {
  test('should validate that all exercises have correct type-category combinations', () => {
    const validCombinations = new Map<ExerciseType, ExerciseCategory[]>([
      ['strength', ['compound', 'isolation', 'olympic']],
      ['cardio', ['cardio']],
      ['flexibility', ['stretching']],
      ['plyometrics', ['power']],
      ['teamSports', ['power']],
      ['bodyweight', ['compound', 'isolation']],
      ['other', ['compound', 'isolation', 'cardio', 'stretching', 'power']]
    ]);

    mockExercises.forEach(exercise => {
      const validCategories = validCombinations.get(exercise.type);
      if (validCategories) {
        expect(validCategories).toContain(exercise.category);
      }
    });
  });

  test('should validate that primary muscles are correctly assigned', () => {
    mockExercises.forEach(exercise => {
      expect(exercise.primaryMuscles).toBeDefined();
      expect((exercise.primaryMuscles || []).length).toBeGreaterThan(0);
      
      // Check that muscle groups are valid
      const validMuscles = [
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
        'quadriceps', 'hamstrings', 'calves', 'glutes', 'core',
        'traps', 'lats', 'lower_back', 'full_body'
      ];
      
      (exercise.primaryMuscles || []).forEach(muscle => {
        expect(validMuscles).toContain(muscle);
      });
    });
  });
});
