import { describe, it, expect, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import { ActivityType } from '@/types/activityTypes';
import { DifficultyCategory } from '@/types/difficulty';
import type { Exercise } from '@/types/exercise';

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector({ auth: { user: { id: 'user-1' } } }),
}));

jest.mock('@/hooks/useExerciseHistory', () => ({
  useExerciseHistory: () => ({
    history: [],
    isLoading: false,
    error: null,
    copyLastValues: () => [],
    trend: 'none',
  }),
}));

jest.mock('@/services/exercisePrescriptionAssistantService', () => ({
  generateExercisePrescriptionAssistant: jest.fn(),
}));

const createExercise = (): Exercise => ({
  id: 'exercise-1',
  name: 'Bench Press',
  description: 'Bench press',
  activityType: ActivityType.RESISTANCE,
  type: 'strength',
  category: 'general',
  instructions: [],
  metrics: {
    trackWeight: true,
    trackReps: true,
    trackRPE: true,
  },
  prescription: {
    sets: 3,
    reps: 8,
    weight: {
      type: 'absolute',
      value: 70,
    },
  },
});

describe('UniversalSetLogger prescription guide toggle', () => {
  it('shows prescription card content immediately when toggled open for legacy data', () => {
    render(
      <UniversalSetLogger
        exercise={createExercise()}
        initialSets={[
          {
            weight: 0,
            reps: 8,
            difficulty: DifficultyCategory.NORMAL,
          },
        ]}
        onCancel={jest.fn()}
        onSave={jest.fn()}
      />
    );

    const toggleButton = document.querySelector('[aria-controls="universal-prescription-guide-section"]') as HTMLButtonElement;
    expect(toggleButton).toBeTruthy();
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggleButton);

    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: /Show details/i })).toBeTruthy();

    fireEvent.click(toggleButton);
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
  });
});
