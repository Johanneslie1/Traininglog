import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  COACH_SHELL_TEAM_STORAGE_KEY,
  readCoachShellTeamId,
  resolveCoachShellTeamId,
  setCoachShellTeamId,
} from '@/features/coach-shell/coachShellPreference';

describe('coach shell team preference', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps the last selected team on this device', () => {
    expect(readCoachShellTeamId()).toBeNull();
    setCoachShellTeamId('team-lyse');
    expect(window.localStorage.getItem(COACH_SHELL_TEAM_STORAGE_KEY)).toBe('team-lyse');
    expect(readCoachShellTeamId()).toBe('team-lyse');
  });

  it('falls back to the first team when the saved team is gone', () => {
    setCoachShellTeamId('missing');
    expect(resolveCoachShellTeamId([
      { id: 'team-a' },
      { id: 'team-b' },
    ])).toBe('team-a');
    expect(resolveCoachShellTeamId([
      { id: 'team-a' },
      { id: 'team-b' },
    ], 'team-b')).toBe('team-b');
  });
});
