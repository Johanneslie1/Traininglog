import { getRestoredPath } from '@/utils/statePersistence';

describe('getRestoredPath', () => {
  it('resumes the last screen when the app opens at the root', () => {
    expect(getRestoredPath('/', '#/programs')).toBe('/programs');
  });

  it('keeps an explicit URL instead of the saved screen', () => {
    expect(getRestoredPath('/join/ABC123', '#/')).toBeNull();
    expect(getRestoredPath('/not-a-real-page', '#/login')).toBeNull();
    expect(getRestoredPath('/programs', '#/stats')).toBeNull();
  });

  it('does not restore the root onto itself', () => {
    expect(getRestoredPath('/', '#/')).toBeNull();
    expect(getRestoredPath('/', null)).toBeNull();
  });
});