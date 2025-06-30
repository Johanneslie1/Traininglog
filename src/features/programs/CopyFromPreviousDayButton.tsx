import React from 'react';
import { ProgramWeek, ProgramDay } from '@/types/program';
import { copyPreviousDay } from '@/services/programService';

interface Props {
  week: ProgramWeek;
  dayIndex: number;
  onCopy: (newDay: ProgramDay) => void;
}

const CopyFromPreviousDayButton: React.FC<Props> = ({ week, dayIndex, onCopy }) => {
  const handleCopy = () => {
    const copied = copyPreviousDay(week, dayIndex);
    if (copied) onCopy(copied);
  };
  return (
    <button
      className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-500 text-sm"
      onClick={handleCopy}
      disabled={dayIndex === 0}
    >
      Copy From Previous Day
    </button>
  );
};

export default CopyFromPreviousDayButton;
