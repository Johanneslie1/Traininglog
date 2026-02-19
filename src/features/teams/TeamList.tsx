import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoachTeams, Team } from '@/services/teamService';
import { PlusIcon, UsersIcon, CalendarIcon } from '@heroicons/react/outline';
import CreateTeamModal from './CreateTeamModal';
import toast from 'react-hot-toast';
import { useIsCoach } from '@/hooks/useUserRole';

interface TeamListProps {
  embedded?: boolean;
}

const TeamList: React.FC<TeamListProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const isCoach = useIsCoach();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!isCoach) {
      toast.error('Only coaches can access team management');
      navigate('/');
      return;
    }
    
    loadTeams();
  }, [isCoach, navigate]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const fetchedTeams = await getCoachTeams();
      setTeams(fetchedTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'py-10' : 'min-h-screen bg-black'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-white">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-black text-white p-4'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            {embedded ? (
              <>
                <h2 className="text-2xl font-bold mb-2">My Teams</h2>
                <p className="text-gray-400">
                  Manage your coaching teams and athletes
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-2">My Teams</h1>
                <p className="text-gray-400">
                  Manage your coaching teams and athletes
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create Team
          </button>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <UsersIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Teams Yet</h2>
            <p className="text-gray-400 mb-6">
              Create your first team to start coaching athletes
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Create Your First Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => navigate(`/teams/${team.id}`)}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-primary-600 transition-all cursor-pointer group"
              >
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold group-hover:text-primary-500 transition-colors">
                      {team.name}
                    </h3>
                    {team.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {team.description}
                      </p>
                    )}
                  </div>
                  <UsersIcon className="h-8 w-8 text-gray-600 group-hover:text-primary-500 transition-colors flex-shrink-0 ml-3" />
                </div>

                {/* Invite Code */}
                <div className="bg-gray-800 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-500 mb-1">Invite Code</div>
                  <div className="text-2xl font-mono font-bold text-primary-500 tracking-wider">
                    {team.inviteCode}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Created {formatDate(team.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Team Modal */}
        <CreateTeamModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadTeams}
        />
      </div>
    </div>
  );
};

export default TeamList;
