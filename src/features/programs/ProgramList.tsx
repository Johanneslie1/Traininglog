import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrograms } from '@/context/ProgramsContext';
import CreateNewProgram from './CreateNewProgram';
import { Program } from '@/types/program';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TrashIcon, PlusIcon, DuplicateIcon } from '@heroicons/react/outline';
import { Button, EmptyState } from '@/components/ui';

const ProgramListContent: React.FC<{ onSelect?: (id: string) => void }> = ({ onSelect }) => {
  const navigate = useNavigate();
  const { programs, addProgram: create, refresh, deleteProgram, duplicateProgram } = usePrograms();
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);
  const [duplicatingProgramId, setDuplicatingProgramId] = useState<string | null>(null);

  // No need for useEffect to refresh - ProgramsContext handles this automatically

  const handleCreateNewSave = async (program: Omit<Program, 'id' | 'userId'>) => {
    try {
      console.log('[ProgramList] Creating new program:', program);
      await create(program);
      setShowCreateNew(false);
      await refresh();
      
      // Navigate to the newly created program
      const createdProgram = programs.find(p => 
        p.name === program.name && 
        p.createdBy === program.createdBy
      );
      if (createdProgram) {
        navigate(`/programs/${createdProgram.id}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create program';
      console.error('Error creating program:', err);
      setError(errorMessage);
    }
  };

  const handleDeleteProgram = async (programId: string, programName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click navigation
    
    if (window.confirm(`Are you sure you want to delete the program "${programName}"? This action cannot be undone.`)) {
      setDeletingProgramId(programId);
      setError(null);
      
      try {
        console.log('[ProgramList] Deleting program:', programId);
        await deleteProgram(programId);
        console.log('[ProgramList] Program deleted successfully');
        // Refresh the programs list
        await refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete program';
        console.error('[ProgramList] Error deleting program:', err);
        setError(errorMessage);
      } finally {
        setDeletingProgramId(null);
      }
    }
  };

  const handleDuplicateProgram = async (programId: string, _programName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click navigation
    
    setDuplicatingProgramId(programId);
    setError(null);
    
    try {
      console.log('[ProgramList] Duplicating program:', programId);
      const duplicatedProgram = await duplicateProgram(programId);
      console.log('[ProgramList] Program duplicated successfully:', duplicatedProgram.id);
      // Navigate to the duplicated program
      navigate(`/programs/${duplicatedProgram.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate program';
      console.error('[ProgramList] Error duplicating program:', err);
      setError(errorMessage);
    } finally {
      setDuplicatingProgramId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-tertiary">Training library</p>
          <h1 className="text-3xl font-bold text-text-primary">Programs</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Build, duplicate, and open reusable training programs from one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/teams?tab=programs')}>
            Assigned
          </Button>
          <Button
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowCreateNew(true)}
          >
            Create Program
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-error-border bg-error-bg p-4 text-error-text">
          {error}
        </div>
      )}

      {programs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-secondary">
          <EmptyState
            illustration="workout"
            title="No programs yet"
            description="Create your first training program to start planning sessions."
            primaryAction={{
              label: 'Create Program',
              onClick: () => setShowCreateNew(true)
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((program: Program) => (
            <div
              key={program.id}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect ? onSelect(program.id) : navigate(`/programs/${program.id}`);
                }
              }}
              className="relative flex min-h-[168px] cursor-pointer flex-col justify-between rounded-2xl border border-border bg-bg-secondary p-5 transition-all duration-200 hover:border-accent-primary hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              onClick={() => (onSelect ? onSelect(program.id) : navigate(`/programs/${program.id}`))}
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-text-primary mb-2">{program.name}</h3>
                  {program.description && (
                    <p className="text-sm text-text-tertiary mb-3 line-clamp-2">{program.description}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  {program.sessions && program.sessions.length > 0 && (
                    <span className="text-text-tertiary text-xs font-medium">
                      {program.sessions.length} session{program.sessions.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleDuplicateProgram(program.id, program.name, e)}
                      disabled={duplicatingProgramId === program.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-bg-tertiary text-text-primary transition-colors hover:border-accent-primary hover:text-accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Duplicate program"
                      aria-label={`Duplicate program ${program.name}`}
                    >
                      {duplicatingProgramId === program.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <DuplicateIcon className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleDeleteProgram(program.id, program.name, e)}
                      disabled={deletingProgramId === program.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-error-border bg-error-bg text-error-text transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete program"
                      aria-label={`Delete program ${program.name}`}
                    >
                      {deletingProgramId === program.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showCreateNew && (
        <CreateNewProgram
          onClose={() => setShowCreateNew(false)}
          onSave={handleCreateNewSave}
        />
      )}
    </div>
  );
};

const ProgramList: React.FC<{ onSelect?: (id: string) => void }> = (props) => {
  return (
    <ErrorBoundary fallback={<div className="text-text-primary p-4">Error loading programs. Please try again.</div>}>
      <ProgramListContent {...props} />
    </ErrorBoundary>
  );
};

export default ProgramList;

