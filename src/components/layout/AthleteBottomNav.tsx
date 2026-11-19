import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { athleteNav } from '@/config/workspaces';

const AthleteBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const items = athleteNav('bottom');

  const isActive = (path: string) => (
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  );

  return (
    <nav
      aria-label="Athlete"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-secondary/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid h-14 max-w-lg grid-cols-3">
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              className={`text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary ${
                active ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AthleteBottomNav;
