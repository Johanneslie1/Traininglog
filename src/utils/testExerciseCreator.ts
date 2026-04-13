import { ActivityType } from '../types/activityTypes';
import { saveLog } from '../services/firebase/unifiedLogs';

// Helper: map ActivityType enum to ExerciseType string used by unified saveLog
const mapActivityToExerciseType = (type: ActivityType | undefined): 'strength' | 'endurance' | 'teamSports' | 'flexibility' | 'speedAgility' | 'other' => {
  switch (type) {
    case ActivityType.ENDURANCE:
      return 'endurance';
    case ActivityType.SPORT:
      return 'teamSports';
    case ActivityType.STRETCHING:
      return 'flexibility';
    case ActivityType.SPEED_AGILITY:
      return 'speedAgility';
    case ActivityType.OTHER:
      return 'other';
    case ActivityType.RESISTANCE:
    default:
      return 'strength';
  }
};

// Test function to create sample exercises of different types
export async function createTestExercises(userId: string, selectedDate: Date = new Date()) {
  const testExercises = [
    {
      // Resistance exercise
      exerciseName: 'Test Bench Press',
      userId,
      sets: [
        { setNumber: 1, weight: 100, reps: 10, rpe: 8 },
        { setNumber: 2, weight: 105, reps: 8, rpe: 9 }
      ],
      activityType: ActivityType.RESISTANCE
    },
    {
      // Endurance exercise
      exerciseName: 'Test Running',
      userId,
      sets: [
        { 
          setNumber: 1, 
          duration: 30, 
          distance: 5, 
          pace: 360, 
          averageHeartRate: 150, 
          rpe: 7 
        }
      ],
      activityType: ActivityType.ENDURANCE
    },
    {
      // Speed & Agility exercise
      exerciseName: 'Test Sprint Drills',
      userId,
      sets: [
        { 
          setNumber: 1, 
          reps: 5, 
          time: 30, 
          distance: 100, 
          restTime: 60, 
          rpe: 8 
        }
      ],
      activityType: ActivityType.SPEED_AGILITY
    },
    {
      // Sport exercise
      exerciseName: 'Test Basketball',
      userId,
      sets: [
        { 
          setNumber: 1, 
          duration: 60, 
          score: '95-87', 
          performance: 8, 
          rpe: 7 
        }
      ],
      activityType: ActivityType.SPORT
    },
    {
      // Stretching exercise
      exerciseName: 'Test Yoga Session',
      userId,
      sets: [
        { 
          setNumber: 1, 
          duration: 45, 
          holdTime: 30, 
          intensity: 6, 
          stretchType: 'static' 
        }
      ],
      activityType: ActivityType.STRETCHING
    },
    {
      // Other exercise
      exerciseName: 'Test Meditation',
      userId,
      sets: [
        { 
          setNumber: 1, 
          duration: 20, 
          intensity: 5, 
          rpe: 3 
        }
      ],
      activityType: ActivityType.OTHER
    }
  ];

  console.log('🧪 Creating test exercises...');
  
  for (const exercise of testExercises) {
    try {
      const exerciseType = mapActivityToExerciseType(exercise.activityType as ActivityType);
      const docId = await saveLog(
        {
          exerciseName: exercise.exerciseName,
          userId: userId,
          sets: exercise.sets as any,
          exerciseType
        },
        selectedDate
      );
      console.log(`✅ Created ${exercise.exerciseName} (${exerciseType}) with ID: ${docId}`);
    } catch (error) {
      console.error(`❌ Failed to create ${exercise.exerciseName}:`, error);
    }
  }
  
  console.log('🧪 Test exercise creation complete!');
}

// Function to be called from browser console
(window as any).createTestExercises = createTestExercises;
