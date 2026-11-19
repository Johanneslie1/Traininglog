import { isPathAllowed } from '@/config/workspaces';

describe('workspace paths', () => {
  it('lets an athlete log, open programs, and export from settings', () => {
    expect(isPathAllowed('athlete', '/')).toBe(true);
    expect(isPathAllowed('athlete', '/programs')).toBe(true);
    expect(isPathAllowed('athlete', '/programs/block-1')).toBe(true);
    expect(isPathAllowed('athlete', '/wellness')).toBe(true);
    expect(isPathAllowed('athlete', '/sports')).toBe(true);
    expect(isPathAllowed('athlete', '/settings')).toBe(true);
    expect(isPathAllowed('athlete', '/join/abc')).toBe(true);
  });

  it('sends hidden athlete pages back to today', () => {
    expect(isPathAllowed('athlete', '/habits')).toBe(false);
    expect(isPathAllowed('athlete', '/tests')).toBe(false);
    expect(isPathAllowed('athlete', '/stats')).toBe(false);
    expect(isPathAllowed('athlete', '/analytics')).toBe(false);
    expect(isPathAllowed('athlete', '/coach')).toBe(false);
    expect(isPathAllowed('athlete', '/speed-agility')).toBe(false);
  });

  it('leaves the personal and coach workspaces unrestricted', () => {
    expect(isPathAllowed('personal', '/habits')).toBe(true);
    expect(isPathAllowed('coach', '/analytics')).toBe(true);
  });
});
