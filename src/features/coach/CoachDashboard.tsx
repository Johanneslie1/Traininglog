import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoachTeams, getTeamMembers, Team } from '@/services/teamService';
import { UsersIcon, PlusIcon, ChartBarIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { useIsCoach } from '@/hooks/useUserRole';
import AthleteList from './AthleteList';

interface TeamWithMembers extends Team {
  memberCount: number;
}

const CoachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const isCoach = useIsCoach();
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAthletes, setTotalAthletes] = useState(0);

  useEffect(() => {
    if (!isCoach) {
      toast.error('Only coaches can access this dashboard');
      navigate('/');
      return;
    }
    
    loadDashboardData();
  }, [isCoach, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const fetchedTeams = await getCoachTeams();
      
      // Get member count for each team
      const teamsWithMembers = await Promise.all(
        fetchedTeams.map(async (team) => {
          const members = await getTeamMembers(team.id);
          return {
            ...team,
            memberCount: members.length
          };
        })
      );
      
      setTeams(teamsWithMembers);
      
      // Calculate total athletes
      const total = teamsWithMembers.reduce((sum, team) => sum + team.memberCount, 0);
      setTotalAthletes(total);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Coach Dashboard</h1>
          <p className="text-gray-400">
            Manage your teams and athletes
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-300 text-sm font-medium mb-1">Total Teams</div>
                <div className="text-4xl font-bold">{teams.length}</div>
              </div>
              <UsersIcon className="h-12 w-12 text-blue-500/50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-300 text-sm font-medium mb-1">Total Athletes</div>
                <div className="text-4xl font-bold">{totalAthletes}</div>
              </div>
              <ChartBarIcon className="h-12 w-12 text-green-500/50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-300 text-sm font-medium mb-1">Avg per Team</div>
                <div className="text-4xl font-bold">
                  {teams.length > 0 ? Math.round(totalAthletes / teams.length) : 0}
                </div>
              </div>
              <UsersIcon className="h-12 w-12 text-purple-500/50" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => navigate('/teams')}
            className="bg-gray-900 border border-gray-800 hover:border-primary-600 rounded-lg p-6 text-left transition-all group"
          >
            <UsersIcon className="h-8 w-8 text-primary-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-1">Manage Teams</h3>
            <p className="text-gray-400 text-sm">
              Create teams, manage members, view invite codes
            </p>
          </button>

          <button
            onClick={() => navigate('/programs')}
            className="bg-gray-900 border border-gray-800 hover:border-primary-600 rounded-lg p-6 text-left transition-all group"
          >
            <ChartBarIcon className="h-8 w-8 text-primary-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-1">Training Programs</h3>
            <p className="text-gray-400 text-sm">
              Create and share training programs with your athletes
            </p>
          </button>
        </div>

        {/* Teams List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Your Teams</h2>
            <button
              onClick={() => navigate('/teams')}
              className="text-primary-500 hover:text-primary-400 text-sm font-medium"
            >
              View all →
            </button>
          </div>

          {teams.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
              <UsersIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Teams Yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first team to start coaching athletes
              </p>
              <button
                onClick={() => navigate('/teams')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Create Team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.slice(0, 6).map((team) => (
                <div
                  key={team.id}
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-primary-600 transition-all cursor-pointer"
                >
                  <h3 className="text-lg font-bold mb-2">{team.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {team.description || 'No description'}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    {team.memberCount} {team.memberCount === 1 ? 'athlete' : 'athletes'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Athletes Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Athletes</h2>
            <div className="text-sm text-gray-500">
              {totalAthletes} total athlete{totalAthletes !== 1 ? 's' : ''}
            </div>
          </div>
          
          <AthleteList />
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
