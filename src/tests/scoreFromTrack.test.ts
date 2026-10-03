import { scoreFromTrackClientX } from '@/utils/scoreFromTrack';

describe('scoreFromTrackClientX', () => {
  const rect = { left: 0, width: 100 };

  it('maps the left edge to 1 and the right edge to the scale max', () => {
    expect(scoreFromTrackClientX(0, rect, 5)).toBe(1);
    expect(scoreFromTrackClientX(100, rect, 5)).toBe(5);
    expect(scoreFromTrackClientX(50, rect, 10)).toBe(6);
  });

  it('clamps positions outside the track', () => {
    expect(scoreFromTrackClientX(-20, rect, 10)).toBe(1);
    expect(scoreFromTrackClientX(240, rect, 10)).toBe(10);
  });
});