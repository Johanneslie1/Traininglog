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
import StatTile from './StatTile';

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
      <div className="flex items-center justify-center min-h-[100dvh] bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-text-primary">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg-primary text-text-primary p-4 pb-app-content">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Coach Hub</h1>
          <p className="text-text-tertiary">
            Overview, teams, and athlete performance in one place
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-border">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-accent-primary text-accent-primary'
                      : 'border-transparent text-text-tertiary hover:text-text-secondary hover:border-border-hover'
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
            <div className="mb-8 bg-bg-secondary border border-border rounded-lg p-5">
              <h2 className="text-lg font-semibold">Needs attention</h2>
              <p className="text-sm text-text-tertiary mt-1">Choose one next step.</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleTabChange('teams')}
                  className="w-full bg-bg-tertiary border border-border hover:border-accent-primary rounded-lg p-4 text-left transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Manage teams</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {teams.length === 0 ? 'Create your first team' : `${teams.length} team${teams.length !== 1 ? 's' : ''} active`}
                      </p>
                    </div>
                    <UsersIcon className="h-5 w-5 text-text-tertiary" />
                  </div>
                </button>

                <button
                  onClick={() => handleTabChange('athletes')}
                  className="w-full bg-bg-tertiary border border-border hover:border-accent-primary rounded-lg p-4 text-left transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Review athlete activity</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {totalAthletes === 0 ? 'Invite athletes to start tracking' : `${totalAthletes} athlete${totalAthletes !== 1 ? 's' : ''} visible`}
                      </p>
                    </div>
                    <ChartBarIcon className="h-5 w-5 text-text-tertiary" />
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatTile label="Teams" value={teams.length} helper="active" />
              <StatTile label="Athletes" value={totalAthletes} helper="visible" />
              <StatTile
                label="Avg per Team"
                value={teams.length > 0 ? Math.round(totalAthletes / teams.length) : 0}
                helper="athletes"
              />
            </div>

            <div className="bg-bg-secondary border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">Program workflow</h3>
                  <p className="text-sm text-text-tertiary mt-1">Assign and track programs from one focused view.</p>
                </div>
                <button
                  onClick={() => handleTabChange('programs')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-text-inverse text-sm font-medium transition-colors"
                >
                  <ClipboardListIcon className="h-4 w-4" />
                  Open programs
                </button>
              </div>
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
              <div className="text-sm text-text-tertiary">
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
