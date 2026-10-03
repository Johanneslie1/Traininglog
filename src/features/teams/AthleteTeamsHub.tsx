import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { UsersIcon, ClipboardListIcon, ClipboardCheckIcon, ChatAltIcon, LightningBoltIcon } from '@heroicons/react/outline';
import SharedProgramList from '@/features/programs/SharedProgramList';
import SharedSessionsList from '@/features/sessions/SharedSessionsList';
import AthleteTeamWorkspace from './AthleteTeamWorkspace';
import AthleteAnnouncements from './AthleteAnnouncements';
import AthleteActivityFeed from './AthleteActivityFeed';
import { useCanUseAthleteFeatures } from '@/hooks/useUserRole';

type TabType = 'todo' | 'teams' | 'programs' | 'sessions' | 'announcements' | 'activity';

const AthleteTeamsHub: React.FC = () => {
  const canUseAthleteFeatures = useCanUseAthleteFeatures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('todo');

  // Read tab from URL on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['todo', 'teams', 'programs', 'sessions', 'announcements', 'activity'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  if (!canUseAthleteFeatures) {
    return <Navigate to="/" replace />;
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'todo' as TabType, label: 'To do', icon: ClipboardCheckIcon },
    { id: 'programs' as TabType, label: 'Programs', icon: ClipboardListIcon },
    { id: 'sessions' as TabType, label: 'Sessions', icon: ClipboardCheckIcon },
    { id: 'teams' as TabType, label: 'Team', icon: UsersIcon },
    { id: 'announcements' as TabType, label: 'Notes', icon: ChatAltIcon },
    { id: 'activity' as TabType, label: 'Activity', icon: LightningBoltIcon },
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-bg-secondary p-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-0.5 text-2xl font-semibold text-text-primary">Teams</h1>
          <p className="text-sm text-text-secondary">
            What to do next from your coach
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[72px] z-10 border-b border-border bg-bg-secondary">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium
                    transition-colors
                    ${
                      isActive
                        ? 'border-accent-primary text-accent-primary'
                        : 'border-transparent text-text-tertiary hover:border-border-hover hover:text-text-secondary'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="mx-auto max-w-6xl">
        {activeTab === 'todo' && (
          <div className="space-y-6 p-4 pb-20">
            <section>
              <h2 className="mb-2 text-[15px] font-semibold text-text-primary">Sessions to log</h2>
              <SharedSessionsList embedded />
            </section>
            <section>
              <h2 className="mb-2 text-[15px] font-semibold text-text-primary">Programs to copy</h2>
              <SharedProgramList embedded />
            </section>
          </div>
        )}
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
