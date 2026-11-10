import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getAuth } from 'firebase/auth';
import Button from '@/components/ui/Button';
import { usePrograms } from '@/context/ProgramsContext';
import ProgramList from '@/features/programs/ProgramList';
import ProgramDetail from '@/features/programs/ProgramDetail';
import SessionBuilder from '@/features/programs/SessionBuilder';
import { createSession } from '@/services/programService';
import { ensureQuickSessionsProgram } from '@/services/quickSessionsProgram';
import type { ProgramSession } from '@/types/program';

type ProgramsView = 'list' | 'detail' | 'quickSession';

const CoachPrograms: React.FC = () => {
  const { programs, updateProgram, refresh } = usePrograms();
  const [view, setView] = useState<ProgramsView>('list');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [savingQuick, setSavingQuick] = useState(false);

  const selectedProgram = programs.find((program) => program.id === selectedProgramId) ?? null;

  const openProgram = (programId: string) => {
    setSelectedProgramId(programId);
    setView('detail');
  };

  const backToList = () => {
    setSelectedProgramId(null);
    setView('list');
  };

  const handleQuickSessionSave = async (sessionData: Omit<ProgramSession, 'userId'>) => {
    const user = getAuth().currentUser;
    if (!user) {
      toast.error('You must be signed in to create a session.');
      return;
    }
    if (!sessionData.exercises?.length) {
      toast.error('Add at least one exercise before saving.');
      return;
    }

    setSavingQuick(true);
    try {
      const programId = await ensureQuickSessionsProgram(programs, user.uid);
      await createSession(programId, {
        ...sessionData,
        exercises: sessionData.exercises.map((exercise) => ({
          ...exercise,
          id: exercise.id || undefined,
        })),
        order: 0,
      });
      await refresh();
      toast.success('Session saved. Place it from the calendar.');
      setView('list');
      setSelectedProgramId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save that session.');
    } finally {
      setSavingQuick(false);
    }
  };

  if (view === 'quickSession') {
    return (
      <section className="min-h-0 min-w-0 flex-1 overflow-auto">
        {savingQuick && (
          <p className="border-b border-border px-4 py-2 text-sm text-text-secondary">Saving session…</p>
        )}
        <SessionBuilder
          onClose={() => {
            if (!savingQuick) setView('list');
          }}
          onSave={(session) => {
            void handleQuickSessionSave(session);
          }}
        />
      </section>
    );
  }

  if (view === 'detail' && selectedProgram) {
    return (
      <section className="min-h-0 min-w-0 flex-1 overflow-auto px-4 py-4 md:px-6">
        <ProgramDetail
          program={selectedProgram}
          onBack={backToList}
          onUpdate={(updated) => {
            void updateProgram(selectedProgram.id, updated);
          }}
        />
      </section>
    );
  }

  return (
    <section className="min-h-0 min-w-0 flex-1 overflow-auto px-4 py-4 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          Create programs and one-off sessions here, then place them on the calendar.
        </p>
        <Button type="button" size="sm" onClick={() => setView('quickSession')}>
          New session
        </Button>
      </div>
      <ProgramList onSelect={openProgram} onCreated={openProgram} />
    </section>
  );
};

export default CoachPrograms;
