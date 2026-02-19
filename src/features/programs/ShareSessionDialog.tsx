import React, { useState, useEffect } from 'react';
import { shareSession } from '@/services/sessionService';
import { getCoachTeams, getTeamMembers, Team, TeamMember } from '@/services/teamService';
import { XIcon, ShareIcon, UsersIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { ProgramSession } from '@/types/program';

interface ShareSessionDialogProps {
  session: ProgramSession;
  sourceProgramId?: string;
  sourceProgramName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TeamWithMembers extends Team {
  members: TeamMember[];
}

const ShareSessionDialog: React.FC<ShareSessionDialogProps> = ({
  session,
  sourceProgramId,
  sourceProgramName,
  onClose,
  onSuccess
}) => {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set());
  const [coachMessage, setCoachMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    loadTeamsAndMembers();
  }, []);

  const loadTeamsAndMembers = async () => {
    try {
      setLoadingTeams(true);
      const coachTeams = await getCoachTeams();
      
      // Fetch members for each team
      const teamsWithMembers = await Promise.all(
        coachTeams.map(async (team) => {
          const members = await getTeamMembers(team.id);
          return { ...team, members };
        })
      );
      
      setTeams(teamsWithMembers);
    } catch (err) {
      console.error('Error loading teams:', err);
      toast.error('Failed to load teams');
    } finally {
      setLoadingTeams(false);
    }
  };

  const toggleAthlete = (athleteId: string) => {
    const newSelected = new Set(selectedAthleteIds);
    if (newSelected.has(athleteId)) {
      newSelected.delete(athleteId);
    } else {
      newSelected.add(athleteId);
    }
    setSelectedAthleteIds(newSelected);
  };

  const selectAllFromTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    const newSelected = new Set(selectedAthleteIds);
    team.members.forEach(member => newSelected.add(member.id));
    setSelectedAthleteIds(newSelected);
  };

  const deselectAllFromTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    const newSelected = new Set(selectedAthleteIds);
    team.members.forEach(member => newSelected.delete(member.id));
    setSelectedAthleteIds(newSelected);
  };

  const isTeamFullySelected = (teamId: string): boolean => {
    const team = teams.find(t => t.id === teamId);
    if (!team || team.members.length === 0) return false;
    return team.members.every(member => selectedAthleteIds.has(member.id));
  };

  const handleShare = async () => {
    if (selectedAthleteIds.size === 0) {
      toast.error('Please select at least one athlete');
      return;
    }

    setIsSharing(true);

    try {
      await shareSession(
        session,
        Array.from(selectedAthleteIds),
        coachMessage.trim() || undefined,
        sourceProgramId,
        sourceProgramName
      );
      toast.success(`Session shared with ${selectedAthleteIds.size} athlete${selectedAthleteIds.size !== 1 ? 's' : ''}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error sharing session:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to share session');
    } finally {
      setIsSharing(false);
    }
  };

  const totalAthletes = teams.reduce((sum, team) => sum + team.members.length, 0);
  const exerciseCount = session.exercises?.length || 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full shadow-2xl border border-gray-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <ShareIcon className="h-6 w-6 text-primary-500" />
            <h2 className="text-xl font-bold text-white">Share Session</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Session Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-300 mb-1">
              Sharing: <span className="font-semibold text-white">{session.name}</span>
            </p>
            {sourceProgramName && (
              <p className="text-sm text-gray-500 mb-1">
                From program: {sourceProgramName}
              </p>
            )}
            <p className="text-sm text-gray-500">
              {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-500">
              Selected: {selectedAthleteIds.size} of {totalAthletes} athlete{totalAthletes !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Coach Message */}
          <div>
            <label htmlFor="coachMessage" className="block text-sm font-medium text-gray-300 mb-2">
              Message to Athletes <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              id="coachMessage"
              value={coachMessage}
              onChange={(e) => setCoachMessage(e.target.value.slice(0, 500))}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Add instructions, goals, or notes for your athletes..."
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {coachMessage.length}/500 characters
            </p>
          </div>

          {/* Team Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Athletes from Your Teams
            </label>

            {loadingTeams ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-400">Loading teams...</span>
              </div>
            ) : teams.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                <UsersIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-2">No teams found</p>
                <p className="text-sm text-gray-500">
                  Create a team first to share sessions with athletes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {teams.map(team => (
                  <div 
                    key={team.id} 
                    className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* Team Header */}
                    <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-5 w-5 text-primary-500" />
                          <h3 className="font-semibold text-white">{team.name}</h3>
                          <span className="text-sm text-gray-500">
                            ({team.members.length} member{team.members.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <button
                          onClick={() => 
                            isTeamFullySelected(team.id) 
                              ? deselectAllFromTeam(team.id) 
                              : selectAllFromTeam(team.id)
                          }
                          className="text-sm text-primary-400 hover:text-primary-300 font-medium"
                        >
                          {isTeamFullySelected(team.id) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="p-2 space-y-1">
                      {team.members.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No members in this team yet
                        </p>
                      ) : (
                        team.members.map(member => (
                          <label
                            key={member.id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAthleteIds.has(member.id)}
                              onChange={() => toggleAthlete(member.id)}
                              className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary-900/30 rounded-full flex items-center justify-center">
                                  <span className="text-primary-400 text-sm font-semibold">
                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-white font-medium">
                                    {member.firstName} {member.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">{member.email}</p>
                                </div>
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || selectedAthleteIds.size === 0 || loadingTeams}
            className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSharing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Sharing...
              </>
            ) : (
              <>
                <ShareIcon className="h-5 w-5 mr-2" />
                Share with {selectedAthleteIds.size || 0} Athlete{selectedAthleteIds.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareSessionDialog;
