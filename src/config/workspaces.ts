export type WorkspaceId = 'personal' | 'coach' | 'athlete';

export interface WorkspaceNavItem {
  id: string;
  label: string;
  path: string;
  surface: 'menu' | 'bottom';
}

const ATHLETE_NAV: WorkspaceNavItem[] = [
  { id: 'today', label: 'Today', path: '/', surface: 'bottom' },
  { id: 'wellness', label: 'Wellness', path: '/wellness', surface: 'bottom' },
  { id: 'sports', label: 'Sports', path: '/sports', surface: 'bottom' },
  { id: 'programs', label: 'Programs', path: '/programs', surface: 'menu' },
  { id: 'teams', label: 'Teams', path: '/teams', surface: 'menu' },
  { id: 'garmin', label: 'Garmin', path: '/garmin', surface: 'menu' },
  { id: 'settings', label: 'Settings', path: '/settings', surface: 'menu' },
  { id: 'profile', label: 'Profile', path: '/profile', surface: 'menu' },
];

const ATHLETE_PATH_PREFIXES = [
  '/exercises',
  '/programs',
  '/program-selection',
  '/wellness',
  '/sports',
  '/srpe',
  '/garmin',
  '/profile',
  '/settings',
  '/teams',
  '/join',
  '/login',
  '/register',
  '/forgot-password',
];

export function athleteNav(surface: WorkspaceNavItem['surface']): WorkspaceNavItem[] {
  return ATHLETE_NAV.filter((item) => item.surface === surface);
}

/** Personal and coach keep every phone route. Athletes only open the logging app. */
export function isPathAllowed(workspace: WorkspaceId, pathname: string): boolean {
  if (workspace !== 'athlete') return true;
  if (pathname === '/') return true;
  return ATHLETE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
