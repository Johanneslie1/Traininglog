import React from "react";
import { enduranceTemplate } from "@/config/defaultTemplates";
import UniversalActivityLogger from "./UniversalActivityLogger";
import { UnifiedExerciseData } from "@/utils/unifiedExerciseUtils";

interface EnduranceActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null;
}

const EnduranceActivityPicker: React.FC<EnduranceActivityPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date(),
  editingExercise = null
}) => {
  return (
    <UniversalActivityLogger
      template={enduranceTemplate}
      activityName="Endurance Training"
      onClose={onClose}
      onBack={onBack}
      onActivityLogged={onActivityLogged}
      selectedDate={selectedDate}
      editingExercise={editingExercise}
    />
  );
};

export default EnduranceActivityPicker;
