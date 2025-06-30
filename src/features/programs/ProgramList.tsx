import React from 'react';
import { usePrograms } from '@/context/ProgramsContext';

const ProgramList: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  const { programs } = usePrograms();
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Programs</h2>
      <ul className="space-y-2">
        {programs.map(program => (
          <li key={program.id} className="bg-[#23272F] rounded p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold">{program.name}</div>
              <div className="text-gray-400 text-sm">{program.description}</div>
            </div>
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm"
              onClick={() => onSelect(program.id)}
            >
              View
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProgramList;
