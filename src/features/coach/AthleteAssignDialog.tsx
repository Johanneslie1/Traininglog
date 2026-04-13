import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { RootState } from '@/store/store';
import { usePrograms } from '@/context/ProgramsContext';
import { Program } from '@/types/program';
import { shareProgram } from '@/services/programService';
import { shareSession } from '@/services/sessionService';
import AppOverlay from '@/components/ui/AppOverlay';

interface AthleteAssignDialogProps {
  athleteId: string;
  onClose: () => void;
  onAssigned: () => void;
}

type AssignMode = 'program' | 'session';

const AthleteAssignDialog: React.FC<AthleteAssignDialogProps> = ({ athleteId, onClose, onAssigned }) => {
  const { programs, isLoading } = usePrograms();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  const [mode, setMode] = useState<AssignMode>('program');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [coachMessage, setCoachMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const coachPrograms = useMemo(() => {
    return programs.filter((program) => !currentUserId || program.userId === currentUserId);
  }, [programs, currentUserId]);

  const selectedProgram = useMemo<Program | null>(() => {
    return coachPrograms.find((program) => program.id === selectedProgramId) || null;
  }, [coachPrograms, selectedProgramId]);

  const selectedSession = useMemo(() => {
    return selectedProgram?.sessions?.find((session) => session.id === selectedSessionId) || null;
  }, [selectedProgram, selectedSessionId]);

  const handleModeChange = (nextMode: AssignMode) => {
    setMode(nextMode);
    setSelectedSessionId('');
  };

  const handleProgramChange = (programId: string) => {
    setSelectedProgramId(programId);
    setSelectedSessionId('');
  };

  const handleAssign = async () => {
    if (!selectedProgram) {
      toast.error('Select a program first');
      return;
    }

    try {
      setSubmitting(true);

      if (mode === 'program') {
        await shareProgram(selectedProgram.id, [athleteId], coachMessage.trim() || undefined);
        toast.success('Program assigned');
      } else {
        if (!selectedSession) {
          toast.error('Select a session to assign');
          return;
        }

        await shareSession(
          selectedSession,
          [athleteId],
          coachMessage.trim() || undefined,
          selectedProgram.id,
          selectedProgram.name
        );
        toast.success('Session assigned');
      }

      onAssigned();
      onClose();
    } catch (error) {
      console.error('Error assigning to athlete:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppOverlay
        isOpen={true}
        onClose={onClose}
        className="z-50 flex items-center justify-center p-4"
        ariaLabel="Loading programs"
      >
        <div className="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-md text-center" onMouseDown={(event) => event.stopPropagation()}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <div className="text-text-primary mt-3">Loading programs...</div>
        </div>
      </AppOverlay>
    );
  }

  return (
    <AppOverlay
      isOpen={true}
      onClose={onClose}
      className="z-50 flex items-center justify-center p-4"
      ariaLabel="Assign to athlete"
    >
      <div className="bg-bg-secondary border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onMouseDown={(event) => event.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Assign to Athlete</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <div className="text-sm font-medium text-text-secondary mb-2">Assign Type</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('program')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  mode === 'program'
                    ? 'border-accent-primary bg-accent-primary/20 text-accent-300'
                    : 'border-border bg-bg-tertiary text-text-secondary hover:border-border-hover'
                }`}
              >
                Program
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('session')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  mode === 'session'
                    ? 'border-accent-primary bg-accent-primary/20 text-accent-300'
                    : 'border-border bg-bg-tertiary text-text-secondary hover:border-border-hover'
                }`}
              >
                Session
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Program</label>
            <select
              value={selectedProgramId}
              onChange={(event) => handleProgramChange(event.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="">Select a program</option>
              {coachPrograms.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          {mode === 'session' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Session</label>
              <select
                value={selectedSessionId}
                onChange={(event) => setSelectedSessionId(event.target.value)}
                disabled={!selectedProgram}
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="">Select a session</option>
                {(selectedProgram?.sessions || []).map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Message (optional)</label>
            <textarea
              rows={3}
              value={coachMessage}
              onChange={(event) => setCoachMessage(event.target.value.slice(0, 500))}
              placeholder="Add context or instructions for the athlete"
              className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
            <div className="mt-1 text-xs text-text-tertiary">{coachMessage.length}/500 characters</div>
          </div>

          {coachPrograms.length === 0 && (
            <div className="text-sm text-warning-text bg-warning-bg border border-warning-border rounded-lg p-3">
              No programs available. Create a program first.
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-bg-tertiary hover:bg-bg-quaternary text-text-primary rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={submitting || coachPrograms.length === 0}
            className="px-4 py-2 bg-accent-primary hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-text-inverse rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? 'Assigning...' : mode === 'program' ? 'Assign Program' : 'Assign Session'}
          </button>
        </div>
      </div>
    </AppOverlay>
  );
};

export default AthleteAssignDialog;
