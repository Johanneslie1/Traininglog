import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCoachTeams, getTeamMembers, Team } from '@/services/teamService';
import { UsersIcon, ChartBarIcon, ClipboardListIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { useIsCoach } from '@/hooks/useUserRole';
import AthleteList from './AthleteList';
import CoachProgramAssignmentPanel from './CoachProgramAssignmentPanel';
import TeamList from '@/features/teams/TeamList';
import CoachAnnouncementsPanel from '@/features/coach/CoachAnnouncementsPanel';

interface TeamWithMembers extends Team {
  memberCount: number;
}

type CoachTab = 'overview' | 'teams' | 'athletes' | 'programs' | 'announcements';

const CoachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isCoach = useIsCoach();
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAthletes, setTotalAthletes] = useState(0);
  const tabParam = searchParams.get('tab');
  const activeTab: CoachTab =
    tabParam === 'teams' ||
    tabParam === 'athletes' ||
    tabParam === 'overview' ||
    tabParam === 'programs' ||
    tabParam === 'announcements'
      ? tabParam
      : 'overview';

  const tabs: Array<{ id: CoachTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'teams', label: 'Teams' },
    { id: 'athletes', label: 'Athletes' },
    { id: 'programs', label: 'Programs' },
    { id: 'announcements', label: 'Announcements' }
  ];

  useEffect(() => {
    if (!isCoach) {
      toast.error('Only coaches can access coach tools');
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

  const handleTabChange = (tab: CoachTab) => {
    setSearchParams(tab === 'overview' ? {} : { tab });
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
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Coach Hub</h1>
          <p className="text-gray-400">
            Overview, teams, and athlete performance in one place
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-800">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary-500 text-primary-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <>
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
                  <ClipboardListIcon className="h-12 w-12 text-purple-500/50" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => handleTabChange('teams')}
                className="bg-gray-900 border border-gray-800 hover:border-primary-600 rounded-lg p-6 text-left transition-all group"
              >
                <UsersIcon className="h-8 w-8 text-primary-500 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-1">Manage Teams</h3>
                <p className="text-gray-400 text-sm">
                  Create teams, manage members, and view invite codes
                </p>
              </button>

              <button
                onClick={() => handleTabChange('athletes')}
                className="bg-gray-900 border border-gray-800 hover:border-primary-600 rounded-lg p-6 text-left transition-all group"
              >
                <ChartBarIcon className="h-8 w-8 text-primary-500 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-1">Athlete Activity</h3>
                <p className="text-gray-400 text-sm">
                  View athlete status and recent workload
                </p>
              </button>
            </div>
          </>
        )}

        {activeTab === 'teams' && (
          <TeamList embedded />
        )}

        {activeTab === 'athletes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">My Athletes</h2>
              <div className="text-sm text-gray-500">
                Team-linked athlete visibility
              </div>
            </div>
            <AthleteList />
          </div>
        )}

        {activeTab === 'programs' && (
          <CoachProgramAssignmentPanel />
        )}

        {activeTab === 'announcements' && (
          <CoachAnnouncementsPanel />
        )}
      </div>
    </div>
  );
};

export default CoachDashboard;
