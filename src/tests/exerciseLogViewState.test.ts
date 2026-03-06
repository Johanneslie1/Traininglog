import { describe, it, expect } from '@jest/globals';
import { isExerciseLogMainView } from '@/features/exercises/exerciseLogViewState';

describe('isExerciseLogMainView', () => {
  it('returns true only for the Exercise Log main state', () => {
    expect(
      isExerciseLogMainView({
        showLogOptions: false,
        showSetLogger: false,
        showWorkoutSummary: false,
      })
    ).toBe(true);
  });

  it('returns false when add/select/edit flow is open', () => {
    expect(
      isExerciseLogMainView({
        showLogOptions: true,
        showSetLogger: false,
        showWorkoutSummary: false,
      })
    ).toBe(false);
  });

  it('returns false when set logger is open', () => {
    expect(
      isExerciseLogMainView({
        showLogOptions: false,
        showSetLogger: true,
        showWorkoutSummary: false,
      })
    ).toBe(false);
  });

  it('returns false when workout summary is open', () => {
    expect(
      isExerciseLogMainView({
        showLogOptions: false,
        showSetLogger: false,
        showWorkoutSummary: true,
      })
    ).toBe(false);
  });
});
