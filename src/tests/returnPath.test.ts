import { getSafeReturnPath } from '@/utils/returnPath';

describe('getSafeReturnPath', () => {
  it('keeps in-app paths, including query and hash', () => {
    expect(getSafeReturnPath('/join/ABC123')).toBe('/join/ABC123');
    expect(getSafeReturnPath('/teams?tab=teams#roster')).toBe('/teams?tab=teams#roster');
  });

  it('rejects external and auth-page targets', () => {
    expect(getSafeReturnPath('https://example.com')).toBe('/');
    expect(getSafeReturnPath('//example.com')).toBe('/');
    expect(getSafeReturnPath('/\\example.com')).toBe('/');
    expect(getSafeReturnPath('/login')).toBe('/');
    expect(getSafeReturnPath('/register?next=/coach')).toBe('/');
    expect(getSafeReturnPath(null)).toBe('/');
  });
});
