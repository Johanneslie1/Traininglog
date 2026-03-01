import { describe, it, expect, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import ExerciseCard from '../components/ExerciseCard';
import { ActivityType } from '../types/activityTypes';
import { UnifiedExerciseData } from '../utils/unifiedExerciseUtils';
import { DifficultyCategory } from '../types/difficulty';

// Mock the superset context
jest.mock('../context/SupersetContext', () => ({
  useSupersets: () => ({
    state: { isCreating: false, selectedExercises: [] },
    toggleExerciseSelection: jest.fn(),
    isExerciseInSuperset: jest.fn(() => false),
    startCreating: jest.fn()
  })
}));

describe('ExerciseCard', () => {
  it('should display speed & agility exercises in non-resistance format', () => {
    const speedAgilityExercise: UnifiedExerciseData = {
      id: 'test-1',
      exerciseName: 'Hill Sprints',
      activityType: ActivityType.SPEED_AGILITY,
      timestamp: new Date(),
      userId: 'test-user',
      sets: [{
        weight: 0,
        reps: 8,
        difficulty: DifficultyCategory.NORMAL,
        duration: 15, // seconds
        distance: 50, // meters
        height: 0,
        restTime: 120,
        rpe: 8
      }]
    };

    render(
      <ExerciseCard 
        exercise={speedAgilityExercise}
        showActions={false}
      />
    );

    // Verify the activity type badge is shown (indicates non-resistance format)
    expect(screen.getByText(/Speed.*Agility.*Activity/i)).toBeTruthy();

    // Quick view is visible by default; details are hidden
    expect(screen.getByText('Reps')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('Distance')).toBeTruthy();
    expect(screen.getByText(/50 m/)).toBeTruthy();
    expect(screen.queryByText(/15 sec/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Show metrics/i }));

    // Verify that speed & agility specific fields are displayed
    expect(screen.getByText('Reps')).toBeTruthy();
    expect(screen.getByText(/15 sec/)).toBeTruthy(); // duration
    expect(screen.getByText(/50 m/)).toBeTruthy(); // distance
  });

  it('should display resistance exercises in traditional format', () => {
    const resistanceExercise: UnifiedExerciseData = {
      id: 'test-2',
      exerciseName: 'Bench Press',
      activityType: ActivityType.RESISTANCE,
      timestamp: new Date(),
      userId: 'test-user',
      sets: [{
        weight: 80,
        reps: 10,
        difficulty: DifficultyCategory.NORMAL,
        rpe: 7
      }]
    };

    render(
      <ExerciseCard 
        exercise={resistanceExercise}
        showActions={false}
      />
    );

    // Should show weight and reps format
    expect(screen.getByText(/80kg 10r/)).toBeTruthy();

    // Should NOT show activity type badge
    expect(screen.queryByText(/Activity/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Show metrics/i })).toBeNull();
  });

  it('should fallback to non-resistance format for exercises with activity fields', () => {
    const unknownActivityExercise: UnifiedExerciseData = {
      id: 'test-3',
      exerciseName: 'Custom Cardio',
      timestamp: new Date(),
      userId: 'test-user',
      sets: [{
        weight: 0,
        reps: 1,
        difficulty: DifficultyCategory.EASY,
        duration: 30, // minutes - this should trigger non-resistance detection
        distance: 5,
        averageHeartRate: 150
      }]
    };

    render(
      <ExerciseCard 
        exercise={unknownActivityExercise}
        showActions={false}
      />
    );

    // Should show activity format due to fallback detection
    expect(screen.getByText(/Unknown Activity/i)).toBeTruthy();

    // Quick metrics are shown by default and details remain hidden
    expect(screen.getByText('Reps')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('Distance')).toBeTruthy();
    expect(screen.getByText(/5 m/)).toBeTruthy();
    expect(screen.queryByText(/30 sec/)).toBeNull();

    const toggleButton = screen.getByRole('button', { name: /Show metrics/i });
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: /Hide metrics/i }).getAttribute('aria-expanded')).toBe('true');

    // Should show activity-specific fields instead of weight/reps
    expect(screen.getByText(/30 sec/)).toBeTruthy(); // duration (shown as seconds for non-endurance)
  });

  it('shows predicted 1RM and best set when provided for resistance exercise', () => {
    const resistanceExercise: UnifiedExerciseData = {
      id: 'test-4',
      exerciseName: 'Front Squat',
      activityType: ActivityType.RESISTANCE,
      timestamp: new Date(),
      userId: 'test-user',
      sets: [{
        weight: 90,
        reps: 4,
        difficulty: DifficultyCategory.NORMAL,
      }]
    };

    render(
      <ExerciseCard
        exercise={resistanceExercise}
        showActions={false}
        oneRepMaxPrediction={{
          oneRepMax: 102,
          bestSet: {
            weight: 90,
            reps: 4,
            difficulty: DifficultyCategory.NORMAL,
          }
        }}
      />
    );

    expect(screen.queryByText('Predicted 1RM')).toBeNull();

    fireEvent.click(screen.getByLabelText('Toggle set details'));

    expect(screen.getByText('Predicted 1RM')).toBeTruthy();
    expect(screen.getByText('102.0kg')).toBeTruthy();
    expect(screen.getByText('Best Set')).toBeTruthy();
    expect(screen.getByText('90kg × 4')).toBeTruthy();
  });

  it('shows warm-up badge in compact mode', () => {
    const warmupExercise: UnifiedExerciseData = {
      id: 'test-warmup-1',
      exerciseName: 'Bodyweight Squat',
      activityType: ActivityType.RESISTANCE,
      timestamp: new Date(),
      userId: 'test-user',
      isWarmup: true,
      sets: [{
        weight: 0,
        reps: 12,
        difficulty: DifficultyCategory.EASY,
      }]
    };

    render(
      <ExerciseCard
        exercise={warmupExercise}
        showActions={false}
        forceCompact={true}
      />
    );

    expect(screen.getByText('Warm-up')).toBeTruthy();
  });
});