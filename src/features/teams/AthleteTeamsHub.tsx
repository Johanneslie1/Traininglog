import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { UsersIcon, ClipboardListIcon, ClipboardCheckIcon, ChatAltIcon, LightningBoltIcon } from '@heroicons/react/outline';
import SharedProgramList from '@/features/programs/SharedProgramList';
import SharedSessionsList from '@/features/sessions/SharedSessionsList';
import AthleteTeamWorkspace from './AthleteTeamWorkspace';
import AthleteAnnouncements from './AthleteAnnouncements';
import AthleteActivityFeed from './AthleteActivityFeed';
import { useIsAthlete, useIsCoach } from '@/hooks/useUserRole';

type TabType = 'teams' | 'programs' | 'sessions' | 'announcements' | 'activity';

const AthleteTeamsHub: React.FC = () => {
  const isAthlete = useIsAthlete();
  const isCoach = useIsCoach();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('teams');

  if (!isAthlete) {
    if (isCoach) {
      return <Navigate to="/coach?tab=teams" replace />;
    }

    return <Navigate to="/" replace />;
  }

  // Read tab from URL on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['teams', 'programs', 'sessions', 'announcements', 'activity'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'teams' as TabType, label: 'My Teams', icon: UsersIcon },
    { id: 'programs' as TabType, label: 'Programs', icon: ClipboardListIcon },
    { id: 'sessions' as TabType, label: 'Sessions', icon: ClipboardCheckIcon },
    { id: 'announcements' as TabType, label: 'Announcements', icon: ChatAltIcon },
    { id: 'activity' as TabType, label: 'Activity', icon: LightningBoltIcon },
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-border p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">Teams</h1>
          <p className="text-gray-400 text-sm">
            Your teams, assigned programs, and training sessions
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-bg-secondary border-b border-border sticky top-[88px] z-10">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap
                    border-b-2 transition-colors
                    ${
                      isActive
                        ? 'border-primary-500 text-primary-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-6xl mx-auto">
        {activeTab === 'teams' && (
          <AthleteTeamWorkspace embedded />
        )}
        {activeTab === 'programs' && <SharedProgramList />}
        {activeTab === 'sessions' && <SharedSessionsList />}
        {activeTab === 'announcements' && <AthleteAnnouncements />}
        {activeTab === 'activity' && <AthleteActivityFeed />}
      </main>
    </div>
  );
};

export default AthleteTeamsHub;
