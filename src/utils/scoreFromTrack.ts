/** Maps a horizontal pointer position on a 1..scaleMax track to a whole score. */
export function scoreFromTrackClientX(
  clientX: number,
  rect: Pick<DOMRect, 'left' | 'width'>,
  scaleMax: number
): number {
  const max = Math.max(1, Math.floor(scaleMax));
  if (rect.width <= 0) {
    return 1;
  }

  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  return Math.min(max, Math.max(1, Math.round(ratio * (max - 1)) + 1));
}
