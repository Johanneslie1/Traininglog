import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeamByInviteCode, joinTeam, Team } from '@/services/teamService';
import { UsersIcon, CheckCircleIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { useSafeBackNavigation } from '@/hooks/useSafeBackNavigation';

const JoinTeam: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const handleBack = useSafeBackNavigation('/');
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [searchingManual, setSearchingManual] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      findTeam(inviteCode);
    } else {
      setLoading(false);
    }
  }, [inviteCode]);

  const findTeam = async (code: string) => {
    try {
      setLoading(true);
      const foundTeam = await getTeamByInviteCode(code);
      
      if (!foundTeam) {
        toast.error('Invalid invite code');
        setTeam(null);
      } else {
        setTeam(foundTeam);
      }
    } catch (error) {
      console.error('Error finding team:', error);
      toast.error('Error loading team');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchManual = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setSearchingManual(true);
    await findTeam(manualCode.toUpperCase());
    setSearchingManual(false);
  };

  const handleJoinTeam = async () => {
    if (!team) return;

    setJoining(true);
    try {
      await joinTeam(team.inviteCode);
      toast.success(`Successfully joined ${team.name}!`);
      
      // Navigate to home or teams page
      navigate('/teams?tab=teams');
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join team');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg-primary text-text-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={handleBack}
          className="mb-4 inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
          aria-label="Back"
        >
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <UsersIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Join a Team</h1>
          <p className="text-text-tertiary">
            Connect with your coach and start training
          </p>
        </div>

        {/* Manual Code Entry (if no code in URL) */}
        {!inviteCode && !team && (
          <form onSubmit={handleSearchManual} className="bg-bg-secondary border border-border rounded-lg p-6 mb-6">
            <label htmlFor="inviteCode" className="block text-sm font-medium text-text-secondary mb-2">
              Enter Invite Code
            </label>
            <p className="text-sm text-text-tertiary mb-3">
              Ask your coach for a 6-character invite code
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                id="inviteCode"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="flex-1 bg-bg-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary uppercase tracking-wider font-mono text-lg"
                placeholder="ABC123"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={searchingManual || !manualCode.trim()}
                className="px-6 py-3 bg-accent-primary hover:bg-accent-hover text-text-inverse rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searchingManual ? 'Searching...' : 'Find'}
              </button>
            </div>
          </form>
        )}

        {/* Team Info */}
        {team ? (
          <div className="bg-bg-secondary border border-border rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success-bg rounded-full mb-4">
                <CheckCircleIcon className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{team.name}</h2>
              {team.description && (
                <p className="text-text-tertiary mb-4">{team.description}</p>
              )}
              <div className="bg-bg-tertiary rounded-lg p-3 inline-block">
                <div className="text-xs text-text-tertiary mb-1">Coach</div>
                <div className="font-semibold">{team.coachName}</div>
              </div>
            </div>

            <button
              onClick={handleJoinTeam}
              disabled={joining}
              className="w-full px-6 py-3 bg-accent-primary hover:bg-accent-hover text-text-inverse rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {joining ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-text-inverse mr-2"></div>
                  Joining...
                </>
              ) : (
                'Join Team'
              )}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-3 px-6 py-3 bg-bg-tertiary hover:bg-bg-quaternary text-text-primary rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : inviteCode ? (
          <div className="bg-error-bg border border-error-border rounded-lg p-6 text-center">
            <div className="text-error-text text-4xl mb-4">✕</div>
            <h2 className="text-xl font-bold mb-2">Invalid Invite Code</h2>
            <p className="text-text-tertiary mb-6">
              The invite code "{inviteCode}" was not found or has expired.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-bg-tertiary hover:bg-bg-quaternary text-text-primary rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default JoinTeam;
