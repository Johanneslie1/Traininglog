import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCoachTeams, getTeamMembers, Team } from '@/services/teamService';
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
          <h1 className="text-2xl font-semibold mb-1">Coach</h1>
          <p className="text-sm text-text-secondary">
            Focus queue for teams, athletes, and programs
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
            <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-bg-secondary">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-[15px] font-semibold text-text-primary">Needs you</h2>
                <p className="mt-0.5 text-sm text-text-secondary">Today · pick one next step</p>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('teams')}
                className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-bg-tertiary/60"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {teams.length === 0 ? 'Create your first team' : `Manage ${teams.length} team${teams.length !== 1 ? 's' : ''}`}
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">Teams & invites</p>
                </div>
                <span className="text-sm font-medium text-accent-primary">Open</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('athletes')}
                className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-bg-tertiary/60"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {totalAthletes === 0 ? 'Invite athletes to start tracking' : `Review ${totalAthletes} athlete${totalAthletes !== 1 ? 's' : ''}`}
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">Activity & readiness</p>
                </div>
                <span className="text-sm font-medium text-accent-primary">Open</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('programs')}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-tertiary/60"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">Assign programs</p>
                  <p className="mt-0.5 text-xs text-text-secondary">Program workflow</p>
                </div>
                <span className="text-sm font-medium text-accent-primary">Assign</span>
              </button>
            </div>

            <div className="mb-2 grid grid-cols-3 gap-3">
              <StatTile label="Teams" value={teams.length} helper="active" />
              <StatTile label="Athletes" value={totalAthletes} helper="visible" />
              <StatTile
                label="Avg / team"
                value={teams.length > 0 ? Math.round(totalAthletes / teams.length) : 0}
                helper="athletes"
              />
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
