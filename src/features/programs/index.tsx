import React, { useState } from 'react';
import { ProgramsProvider, usePrograms } from '@/context/ProgramsContext';
import ProgramList from './ProgramList';
import ProgramDetail from './ProgramDetail';

const ProgramsRoot: React.FC = () => {
  const { programs, updateProgram: update } = usePrograms();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProgram = programs.find((p: { id: string }) => p.id === selectedId) || null;

  return (
    <div className="p-8">
      {!selectedProgram ? (
        <ProgramList onSelect={setSelectedId} />
      ) : (
        <ProgramDetail
          program={selectedProgram}
          onBack={() => setSelectedId(null)}
          onUpdate={updated => update(updated.id, updated)}
        />
      )}
    </div>
  );
};

const ProgramsApp: React.FC = () => (
  <ProgramsProvider>
    <ProgramsRoot />
  </ProgramsProvider>
);

export default ProgramsApp;
