import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getTeam, 
  getTeamMembers, 
  removeTeamMember, 
  updateTeam,
  deleteTeam,
  Team, 
  TeamMember 
} from '@/services/teamService';
import { 
  ArrowLeftIcon, 
  UsersIcon, 
  TrashIcon, 
  PencilIcon,
  ClipboardCopyIcon,
  ShareIcon
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { useIsCoach } from '@/hooks/useUserRole';

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCoach = useIsCoach();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTeamData();
    }
  }, [id]);

  const loadTeamData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [teamData, membersData] = await Promise.all([
        getTeam(id),
        getTeamMembers(id)
      ]);
      
      if (!teamData) {
        toast.error('Team not found');
        navigate('/teams');
        return;
      }
      
      setTeam(teamData);
      setMembers(membersData);
      setEditName(teamData.name);
      setEditDescription(teamData.description);
    } catch (error) {
      console.error('Error loading team:', error);
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (team) {
      navigator.clipboard.writeText(team.inviteCode);
      toast.success('Invite code copied to clipboard!');
    }
  };

  const handleCopyInviteLink = () => {
    if (team) {
      const link = `${window.location.origin}/#/join/${team.inviteCode}`;
      navigator.clipboard.writeText(link);
      toast.success('Invite link copied to clipboard!');
    }
  };

  const handleUpdate = async () => {
    if (!isCoach) {
      toast.error('Only coaches can edit team details');
      return;
    }

    if (!id || !editName.trim()) return;
    
    setIsUpdating(true);
    try {
      await updateTeam(id, {
        name: editName,
        description: editDescription
      });
      
      setTeam(prev => prev ? {
        ...prev,
        name: editName,
        description: editDescription
      } : null);
      
      setIsEditing(false);
      toast.success('Team updated successfully');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!isCoach) {
      toast.error('Only coaches can delete teams');
      return;
    }

    if (!id || !team) return;
    
    if (window.confirm(`Are you sure you want to delete "${team.name}"? This cannot be undone.`)) {
      try {
        await deleteTeam(id);
        toast.success('Team deleted successfully');
        navigate('/teams');
      } catch (error) {
        console.error('Error deleting team:', error);
        toast.error('Failed to delete team');
      }
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isCoach) {
      toast.error('Only coaches can remove team members');
      return;
    }

    if (!id) return;
    
    if (window.confirm(`Remove ${memberName} from the team?`)) {
      setRemovingMemberId(memberId);
      try {
        await removeTeamMember(id, memberId);
        setMembers(prev => prev.filter(m => m.id !== memberId));
        toast.success('Member removed successfully');
      } catch (error) {
        console.error('Error removing member:', error);
        toast.error('Failed to remove member');
      } finally {
        setRemovingMemberId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-white">Loading team...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
          <button
            onClick={() => navigate('/teams')}
            className="text-primary-500 hover:text-primary-400"
          >
            ← Back to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/teams')}
          className="text-primary-500 hover:text-primary-400 mb-6 flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Teams
        </button>

        {/* Team Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          {!isCoach && (
            <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300">
              Read-only view. Coach actions are only available in Coach Hub.
            </div>
          )}
          <div className="flex items-start justify-between mb-4">
            {isEditing && isCoach ? (
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Team name"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Team description"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(team.name);
                      setEditDescription(team.description);
                    }}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
                  {team.description && (
                    <p className="text-gray-400">{team.description}</p>
                  )}
                </div>
                {isCoach && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      title="Edit team"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleDeleteTeam}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      title="Delete team"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Invite Section */}
          {isCoach && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400">Invite Code</h3>
                  <div className="text-3xl font-mono font-bold text-primary-500 tracking-wider mt-1">
                    {team.inviteCode}
                  </div>
                </div>
                <UsersIcon className="h-12 w-12 text-gray-600" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyInviteCode}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  <ClipboardCopyIcon className="h-4 w-4" />
                  Copy Code
                </button>
                <button
                  onClick={handleCopyInviteLink}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  <ShareIcon className="h-4 w-4" />
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Members List */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            Members ({members.length})
          </h2>
          
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UsersIcon className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p>No members yet</p>
              <p className="text-sm mt-1">Share the invite code to add athletes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between bg-gray-800 rounded-lg p-4"
                >
                  <div>
                    <div className="font-semibold">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-sm text-gray-400">{member.email}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                  {isCoach && (
                    <button
                      onClick={() => handleRemoveMember(member.id, `${member.firstName} ${member.lastName}`)}
                      disabled={removingMemberId === member.id}
                      className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove member"
                    >
                      {removingMemberId === member.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-400"></div>
                      ) : (
                        <TrashIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;
