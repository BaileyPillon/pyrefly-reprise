import { baseExtents } from './LookBoldConfig.ts';

/**
 * The agreement guard of the worker's extents field (motion-fluidity pass, lane "mf-l4-freezes", MF-02; both games; pure, no DOM; kept apart from `AlphaThumb.ts` to keep that file under its line limit and
 * re-exported from it): two fields of one painting, the area average and the canvas draw, give the same six extents numbers to within a cell of 128, or the page reads the painting itself.
 */

/** The most the two fields' extents may differ on any of the six bounds, in cells of 128, for the field to be trusted. */
export const AGREE_CELLS = 1;

/** Do two extents fields (the area average and the canvas draw of one painting) agree, within {@link AGREE_CELLS} cell on every bound? */
export function extentsAgree(a: ArrayLike<number>, b: ArrayLike<number>, cells = AGREE_CELLS): boolean {
  const ea = baseExtents(a, 128, 128);
  const eb = baseExtents(b, 128, 128);
  if (!ea || !eb) return !ea && !eb;
  const keys = ['top', 'bottom', 'left', 'right', 'baseLeft', 'baseRight'] as const;
  return keys.every((k) => Math.abs(ea[k] - eb[k]) * 128 <= cells + 1e-9);
}
