export const COACH_SHELL_PATH = '/coach-workspace';
export const COACH_SHELL_STORAGE_KEY = 'traininglog.coachShellEnabled';
export const COACH_SHELL_TEAM_STORAGE_KEY = 'traininglog.coachShellTeamId';

const listeners = new Set<() => void>();
let storageListenerBound = false;

function emitCoachShellChange(): void {
  listeners.forEach((listener) => listener());
}

function bindStorageListener(): void {
  if (storageListenerBound || typeof window === 'undefined') return;
  storageListenerBound = true;
  window.addEventListener('storage', (event) => {
    if (event.key === COACH_SHELL_STORAGE_KEY || event.key === null) {
      emitCoachShellChange();
    }
  });
}

export function readCoachShellEnabled(): boolean {
  try {
    return window.localStorage.getItem(COACH_SHELL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setCoachShellEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(COACH_SHELL_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // The shell stays off when this browser cannot store the choice.
  }
  emitCoachShellChange();
}

export function subscribeCoachShell(listener: () => void): () => void {
  bindStorageListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readCoachShellTeamId(): string | null {
  try {
    const value = window.localStorage.getItem(COACH_SHELL_TEAM_STORAGE_KEY);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function setCoachShellTeamId(teamId: string | null): void {
  try {
    if (!teamId) {
      window.localStorage.removeItem(COACH_SHELL_TEAM_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(COACH_SHELL_TEAM_STORAGE_KEY, teamId);
  } catch {
    // Keep the in-memory selection when this browser cannot store it.
  }
}

export function resolveCoachShellTeamId(
  teams: Array<{ id: string }>,
  preferredTeamId?: string | null
): string | null {
  if (teams.length === 0) return null;
  const saved = preferredTeamId === undefined ? readCoachShellTeamId() : preferredTeamId;
  if (saved && teams.some((team) => team.id === saved)) return saved;
  return teams[0]?.id ?? null;
}
