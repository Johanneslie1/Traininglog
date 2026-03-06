export interface ExerciseLogUiVisibilityState {
  showLogOptions: boolean;
  showSetLogger: boolean;
  showWorkoutSummary: boolean;
}

export const isExerciseLogMainView = (state: ExerciseLogUiVisibilityState): boolean => {
  return !state.showLogOptions && !state.showSetLogger && !state.showWorkoutSummary;
};
