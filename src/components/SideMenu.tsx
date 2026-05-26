import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '@/store/store';
import { useCanUseAthleteFeatures, useIsCoach } from '@/hooks/useUserRole';
import { AppLogo } from '@/components/brand';
import AppOverlay from '@/components/ui/AppOverlay';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToday: () => void;
  onOpenProfile: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  onNavigateToday,
  onOpenProfile
}) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const isCoach = useIsCoach();
  const canUseAthleteFeatures = useCanUseAthleteFeatures();

  const isActivePath = (path: string) => (
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  );

  const navButtonClass = (path?: string) => {
    const active = path ? isActivePath(path) : false;
    return [
      'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors',
      active
        ? 'bg-accent-primary text-text-inverse shadow-md'
        : 'text-text-primary hover:bg-bg-tertiary hover:text-accent-primary',
    ].join(' ');
  };

  const navigateAndClose = (path: string) => {
    onClose();
    navigate(path);
  };

  if (!isOpen) return null;

  return (
    <AppOverlay
      isOpen={isOpen}
      onClose={onClose}
      className="z-50 bg-black/60"
      ariaLabel="Main navigation"
    >
      <aside className="fixed left-0 top-0 bottom-0 flex w-[min(20rem,88vw)] flex-col bg-bg-secondary shadow-2xl ring-1 ring-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AppLogo className="h-11 w-11" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary">Navigation</p>
                <h2 className="text-text-primary text-xl font-semibold">Gym Keeper</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
              aria-label="Close Menu"
            >
              <svg className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-3 space-y-4" aria-label="Main navigation">
          <div className="space-y-1">
            <button
              onClick={() => {
                onClose();
                onNavigateToday();
              }}
              className={navButtonClass('/')}
              aria-current={isActivePath('/') ? 'page' : undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Exercise Log
            </button>
            <button
              onClick={() => navigateAndClose('/programs')}
              className={navButtonClass('/programs')}
              aria-current={isActivePath('/programs') ? 'page' : undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h6" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Programs
            </button>
            <button
              onClick={() => navigateAndClose('/wellness')}
              className={navButtonClass('/wellness')}
              aria-current={isActivePath('/wellness') ? 'page' : undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Wellness
            </button>
            <button
              onClick={() => navigateAndClose('/sports')}
              className={navButtonClass('/sports')}
              aria-current={isActivePath('/sports') ? 'page' : undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l2.5 5.5L20 10l-5.5 2.5L12 18l-2.5-5.5L4 10l5.5-2.5L12 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 21h14" />
              </svg>
              Sports Load
            </button>
          </div>

          {/* Athlete Section - Coaches keep access to the regular athlete workspace. */}
          {canUseAthleteFeatures && (
            <div className="pt-4 border-t border-border space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Athlete
              </div>
              <button
                onClick={() => navigateAndClose('/stats')}
                className={navButtonClass('/stats')}
                aria-current={isActivePath('/stats') ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 17V7a2 2 0 012-2h10a2 2 0 012 2v10" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19h16" />
                </svg>
                Stats
              </button>
              <button
                onClick={() => navigateAndClose('/analytics')}
                className={navButtonClass('/analytics')}
                aria-current={isActivePath('/analytics') ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14" />
                </svg>
                Analytics
              </button>
              <button 
                onClick={() => navigateAndClose('/teams')} 
                className={navButtonClass('/teams')}
                aria-current={isActivePath('/teams') ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Teams
              </button>
            </div>
          )}

          {/* Coach Section - Only show for coaches */}
          {isCoach && (
            <div className="pt-4 border-t border-border space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Coach Tools
              </div>
              <button 
                onClick={() => navigateAndClose('/coach')} 
                className={navButtonClass('/coach')}
                aria-current={isActivePath('/coach') ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Coach Hub
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-border space-y-1">
            <button
              onClick={() => navigateAndClose('/settings')}
              className={navButtonClass('/settings')}
              aria-current={isActivePath('/settings') ? 'page' : undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1.724 1.724 0 013.35 0l.182.642a1.724 1.724 0 002.573 1.066l.58-.331a1.724 1.724 0 012.286.633l.334.578a1.724 1.724 0 01-.633 2.286l-.58.331a1.724 1.724 0 000 2.986l.58.331a1.724 1.724 0 01.633 2.286l-.334.578a1.724 1.724 0 01-2.286.633l-.58-.331a1.724 1.724 0 00-2.573 1.066l-.182.642a1.724 1.724 0 01-3.35 0l-.182-.642a1.724 1.724 0 00-2.573-1.066l-.58.331a1.724 1.724 0 01-2.286-.633l-.334-.578a1.724 1.724 0 01.633-2.286l.58-.331a1.724 1.724 0 000-2.986l-.58-.331a1.724 1.724 0 01-.633-2.286l.334-.578a1.724 1.724 0 012.286-.633l.58.331a1.724 1.724 0 002.573-1.066l.182-.642z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className={navButtonClass('/profile')}
              aria-current={isActivePath('/profile') ? 'page' : undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A11.958 11.958 0 0112 15.75c2.58 0 4.972.816 6.879 2.054M15 11.25a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Profile
            </button>
          </div>

          {/* Auth Section for non-authenticated users */}
          {!isAuthenticated && (
            <div className="pt-4 border-t border-border space-y-2">
              <button
                onClick={() => navigateAndClose('/login')}
                className={navButtonClass('/login')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign In
              </button>
              <button
                onClick={() => navigateAndClose('/register')}
                className={navButtonClass('/register')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Sign Up
              </button>
            </div>
          )}
        </nav>
      </aside>
    </AppOverlay>
  );
};

export default SideMenu;
