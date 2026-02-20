import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Team, TeamMember, getAthleteTeams, getTeamMembers, leaveTeam } from '@/services/teamService';
import { UsersIcon, UserAddIcon, LogoutIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';

interface AthleteTeamWorkspaceProps {
  embedded?: boolean;
}

const AthleteTeamWorkspace: React.FC<AthleteTeamWorkspaceProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) || null,
    [teams, selectedTeamId]
  );

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const fetchedTeams = await getAthleteTeams();
        setTeams(fetchedTeams);

        if (fetchedTeams.length === 0) {
          setSelectedTeamId(null);
          return;
        }

        setSelectedTeamId((current) => {
          if (current && fetchedTeams.some((team) => team.id === current)) {
            return current;
          }
          return fetchedTeams[0].id;
        });
      } catch (error) {
        console.error('Error loading athlete teams:', error);
        toast.error('Failed to load your teams');
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  useEffect(() => {
    if (!selectedTeamId) {
      setMembers([]);
      return;
    }

    const loadMembers = async () => {
      try {
        setMembersLoading(true);
        const fetchedMembers = await getTeamMembers(selectedTeamId);
        setMembers(fetchedMembers);
      } catch (error) {
        console.error('Error loading team members:', error);
        toast.error('Failed to load team members');
      } finally {
        setMembersLoading(false);
      }
    };

    loadMembers();
  }, [selectedTeamId]);

  const handleLeaveTeam = async (team: Team) => {
    if (!window.confirm(`Leave ${team.name}?`)) {
      return;
    }

    try {
      setLeavingTeamId(team.id);
      await leaveTeam(team.id);
      toast.success(`You left ${team.name}`);

      const updatedTeams = teams.filter((item) => item.id !== team.id);
      setTeams(updatedTeams);

      if (selectedTeamId === team.id) {
        setSelectedTeamId(updatedTeams[0]?.id || null);
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to leave team');
    } finally {
      setLeavingTeamId(null);
    }
  };

  const currentMembership = members.find((member) => member.id === userId);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'py-10' : 'min-h-screen bg-bg-primary'}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-white">Loading your teams...</div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-bg-primary text-text-primary p-4'}`}>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">My Teams</h2>
            <p className="text-gray-400 text-sm">Join teams, view details, and manage membership</p>
          </div>
          <button
            onClick={() => navigate('/join')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-medium transition-colors"
          >
            <UserAddIcon className="h-5 w-5" />
            Join Team
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="bg-bg-secondary border border-border rounded-xl p-10 text-center">
            <UsersIcon className="h-14 w-14 text-gray-500 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">You are not on a team yet</h3>
            <p className="text-gray-400 mb-6">Use an invite code from your coach to join a team.</p>
            <button
              onClick={() => navigate('/join')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-medium transition-colors"
            >
              <UserAddIcon className="h-5 w-5" />
              Join with Invite Code
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-bg-secondary border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Your Teams</h3>
              <div className="space-y-2">
                {teams.map((team) => {
                  const active = team.id === selectedTeamId;
                  return (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`w-full text-left rounded-lg p-3 border transition-colors ${
                        active
                          ? 'border-primary-500 bg-primary-900/20'
                          : 'border-gray-800 bg-bg-tertiary hover:border-gray-700'
                      }`}
                    >
                      <div className="font-semibold text-white">{team.name}</div>
                      <div className="text-xs text-gray-400 mt-1">Coach: {team.coachName || 'Coach'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-xl p-5">
              {selectedTeam ? (
                <>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedTeam.name}</h3>
                      {selectedTeam.description && (
                        <p className="text-gray-400 mt-1">{selectedTeam.description}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-400">
                        Coach: <span className="text-gray-200">{selectedTeam.coachName || 'Coach'}</span>
                      </div>
                      {currentMembership?.joinedAt && (
                        <div className="text-sm text-gray-400 mt-1">
                          Joined: {new Date(currentMembership.joinedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleLeaveTeam(selectedTeam)}
                      disabled={leavingTeamId === selectedTeam.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <LogoutIcon className="h-5 w-5" />
                      {leavingTeamId === selectedTeam.id ? 'Leaving...' : 'Leave Team'}
                    </button>
                  </div>

                  <div className="bg-bg-tertiary border border-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">
                      Team Members {membersLoading ? '(Loading...)' : `(${members.length})`}
                    </h4>
                    {members.length === 0 ? (
                      <p className="text-sm text-gray-400">No members found.</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between bg-bg-secondary border border-gray-800 rounded-lg px-3 py-2"
                          >
                            <div>
                              <div className="text-white font-medium">
                                {member.firstName} {member.lastName}
                              </div>
                              <div className="text-xs text-gray-400">{member.email}</div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-gray-400">Select a team to see details.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteTeamWorkspace;
