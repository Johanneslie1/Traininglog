import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExerciseCard from '../components/ExerciseCard';
import { ActivityType } from '../types/activityTypes';
import { UnifiedExerciseData } from '../utils/unifiedExerciseUtils';
import { DifficultyCategory } from '../types/difficulty';

// Mock the superset context
vi.mock('../context/SupersetContext', () => ({
  useSupersets: () => ({
    state: { isCreating: false, selectedExercises: [] },
    toggleExerciseSelection: vi.fn(),
    isExerciseInSuperset: vi.fn(() => false),
    startCreating: vi.fn()
  })
}));

describe('ExerciseCard', () => {  it('should display speed & agility exercises in non-resistance format', () => {
    const speedAgilityExercise: UnifiedExerciseData = {
      id: 'test-1',
      exerciseName: 'Hill Sprints',
      activityType: ActivityType.SPEED_AGILITY,
      timestamp: new Date(),
      userId: 'test-user',      sets: [{
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
    );    // Verify the activity type badge is shown (indicates non-resistance format)
    expect(screen.getByText(/Speed.*Agility.*Activity/i)).toBeInTheDocument();
    
    // Verify that speed & agility specific fields are displayed
    expect(screen.getByText('Reps')).toBeInTheDocument();
    expect(screen.getByText(/15 sec/)).toBeInTheDocument(); // duration
    expect(screen.getByText(/50 m/)).toBeInTheDocument(); // distance
  });

  it('should display resistance exercises in traditional format', () => {
    const resistanceExercise: UnifiedExerciseData = {
      id: 'test-2',
      exerciseName: 'Bench Press',
      activityType: ActivityType.RESISTANCE,
      timestamp: new Date(),
      userId: 'test-user',      sets: [{
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
    expect(screen.getByText(/80kg 10r/)).toBeInTheDocument();
    
    // Should NOT show activity type badge
    expect(screen.queryByText(/Activity/i)).not.toBeInTheDocument();
  });
  it('should fallback to non-resistance format for exercises with activity fields', () => {
    const unknownActivityExercise: UnifiedExerciseData = {
      id: 'test-3',
      exerciseName: 'Custom Cardio',
      // No activityType set
      timestamp: new Date(),
      userId: 'test-user',      sets: [{
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
    );    // Should show activity format due to fallback detection
    expect(screen.getByText(/Unknown Activity/i)).toBeInTheDocument();
    
    // Should show activity-specific fields instead of weight/reps
    expect(screen.getByText(/30 sec/)).toBeInTheDocument(); // duration (shown as seconds for non-endurance)
    expect(screen.getByText(/5 m/)).toBeInTheDocument(); // distance (shown as meters for non-endurance)
  });
});