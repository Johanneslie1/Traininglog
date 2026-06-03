import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrograms } from '@/context/ProgramsContext';
import CreateNewProgram from './CreateNewProgram';
import { Program } from '@/types/program';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TrashIcon, PlusIcon, DuplicateIcon } from '@heroicons/react/outline';
import { Button, ConfirmDialog, EmptyState, ViewToggle } from '@/components/ui';
import { formatRelativeDate } from '@/utils/displayFormatters';

type ProgramViewMode = 'compact' | 'detailed';

const ProgramListContent: React.FC<{ onSelect?: (id: string) => void }> = ({ onSelect }) => {
  const navigate = useNavigate();
  const { programs, addProgram: create, refresh, deleteProgram, duplicateProgram } = usePrograms();
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);
  const [duplicatingProgramId, setDuplicatingProgramId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<ProgramViewMode>('compact');

  // No need for useEffect to refresh - ProgramsContext handles this automatically

  const getProgramSummary = (program: Program) => {
    const sessions = program.sessions || [];
    const exerciseCount = sessions.reduce((total, session) => total + (session.exercises?.length || 0), 0);

    return {
      sessionCount: sessions.length,
      exerciseCount,
    };
  };

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
    setPendingDelete({ id: programId, name: programName });
  };

  const confirmDeleteProgram = async () => {
    if (!pendingDelete) {
      return;
    }

    setDeletingProgramId(pendingDelete.id);
    setError(null);

    try {
      console.log('[ProgramList] Deleting program:', pendingDelete.id);
      await deleteProgram(pendingDelete.id);
      console.log('[ProgramList] Program deleted successfully');
      setPendingDelete(null);
      await refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete program';
      console.error('[ProgramList] Error deleting program:', err);
      setError(errorMessage);
    } finally {
      setDeletingProgramId(null);
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
          {programs.length > 0 && (
            <ViewToggle<ProgramViewMode>
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'detailed', label: 'Detailed' },
              ]}
            />
          )}
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
        <div className="space-y-2">
          {programs.map((program: Program) => {
            const summary = getProgramSummary(program);

            return (
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
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-left transition-colors hover:border-border-hover hover:bg-hover-overlay active:bg-active-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                onClick={() => (onSelect ? onSelect(program.id) : navigate(`/programs/${program.id}`))}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-tertiary text-lg text-accent-primary">
                  📋
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-text-primary">{program.name}</h3>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-tertiary">
                    <span>{summary.sessionCount} sessions</span>
                    <span aria-hidden="true">•</span>
                    <span>{summary.exerciseCount} exercises</span>
                    {viewMode === 'detailed' && (
                      <>
                        <span aria-hidden="true">•</span>
                        <span>Updated {formatRelativeDate(program.updatedAt || program.createdAt)}</span>
                      </>
                    )}
                    {program.tags?.slice(0, viewMode === 'detailed' ? 3 : 2).map(tag => (
                      <span key={tag} className="rounded-full bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {program.description && (
                    <p className={`mt-1 text-sm text-text-secondary ${viewMode === 'compact' ? 'truncate' : 'line-clamp-2'}`}>
                      {program.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={(e) => handleDuplicateProgram(program.id, program.name, e)}
                    disabled={duplicatingProgramId === program.id}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-bg-tertiary text-text-primary transition-colors hover:border-accent-primary hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                    title="Duplicate program"
                    aria-label={`Duplicate program ${program.name}`}
                  >
                    {duplicatingProgramId === program.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <DuplicateIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDeleteProgram(program.id, program.name, e)}
                    disabled={deletingProgramId === program.id}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-error-border bg-error-bg text-error-text transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Delete program"
                    aria-label={`Delete program ${program.name}`}
                  >
                    {deletingProgramId === program.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </button>
                  <svg className="hidden h-5 w-5 text-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-text-secondary sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {showCreateNew && (
        <CreateNewProgram
          onClose={() => setShowCreateNew(false)}
          onSave={handleCreateNewSave}
        />
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Delete program?"
        description={`This will permanently delete "${pendingDelete?.name ?? 'this program'}". This action cannot be undone.`}
        confirmLabel="Delete program"
        isConfirming={deletingProgramId === pendingDelete?.id}
        onCancel={() => {
          if (!deletingProgramId) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => {
          void confirmDeleteProgram();
        }}
      />
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

