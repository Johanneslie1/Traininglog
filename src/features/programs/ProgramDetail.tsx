import React, { useState } from 'react';
import { Program } from '@/types/program';
import CopyFromPreviousDayButton from './CopyFromPreviousDayButton';

interface Props {
  program: Program;
  onBack: () => void;
  onUpdate: (updated: Program) => void;
}

const ProgramDetail: React.FC<Props> = ({ program, onBack, onUpdate }) => {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);

  const week = program.weeks[selectedWeek];
  const day = week.days[selectedDay];

  const handleCopyFromPreviousDay = (newDay: typeof day) => {
    const newWeeks = program.weeks.map((w, wi) =>
      wi === selectedWeek
        ? { ...w, days: w.days.map((d, di) => (di === selectedDay ? newDay : d)) }
        : w
    );
    onUpdate({ ...program, weeks: newWeeks });
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-blue-500">&larr; Back</button>
      <h2 className="text-2xl font-bold mb-2">{program.name}</h2>
      <div className="mb-4 text-gray-400">{program.description}</div>
      <div className="mb-4">
        <label>Week: </label>
        <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))}>
          {program.weeks.map((w, i) => (
            <option key={i} value={i}>Week {w.weekNumber}</option>
          ))}
        </select>
        <label className="ml-4">Day: </label>
        <select value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))}>
          {week.days.map((d, i) => (
            <option key={i} value={i}>Day {d.dayNumber} {d.label ? `- ${d.label}` : ''}</option>
          ))}
        </select>
      </div>
      <CopyFromPreviousDayButton week={week} dayIndex={selectedDay} onCopy={handleCopyFromPreviousDay} />
      {/* Render sessions and exercises here */}
    </div>
  );
};

export default ProgramDetail;
