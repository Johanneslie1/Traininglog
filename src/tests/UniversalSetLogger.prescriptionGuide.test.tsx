import { describe, it, expect, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import { ActivityType } from '@/types/activityTypes';
import { SettingsProvider } from '@/context/SettingsContext';
import { DifficultyCategory } from '@/types/difficulty';
import type { Exercise } from '@/types/exercise';

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector({ auth: { user: { id: 'user-1' } } }),
}));

jest.mock('@/hooks/useExerciseHistory', () => ({
  useExerciseHistory: () => ({
    history: [],
    lastWorkingSets: [],
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
      <SettingsProvider>
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
      </SettingsProvider>
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

  it('saves a typed mean velocity and drops it when the field is cleared', () => {
    const onSave = jest.fn();
    render(
      <SettingsProvider>
        <UniversalSetLogger
          exercise={createExercise()}
          initialSets={[
            {
              weight: 70,
              reps: 8,
              difficulty: DifficultyCategory.NORMAL,
            },
          ]}
          onCancel={jest.fn()}
          onSave={onSave}
        />
      </SettingsProvider>
    );

    fireEvent.click(screen.getByText('Set 1'));
    const velocity = screen.getByLabelText('Mean velocity (m/s)');
    fireEvent.change(velocity, { target: { value: '0.625' } });
    fireEvent.blur(velocity);
    fireEvent.click(screen.getByRole('button', { name: /Save Set/i }));

    const saved = onSave.mock.calls[0][0] as Array<{ meanVelocity?: number; velocitySource?: string }>;
    expect(saved[0].meanVelocity).toBe(0.63);
    expect(saved[0].velocitySource).toBe('manual');

    fireEvent.change(velocity, { target: { value: '' } });
    fireEvent.blur(velocity);
    fireEvent.click(screen.getByRole('button', { name: /Save Set/i }));
    const cleared = onSave.mock.calls[1][0] as Array<Record<string, unknown>>;
    expect(cleared[0].meanVelocity).toBeUndefined();
    expect(cleared[0].velocitySource).toBeUndefined();
  });
});
