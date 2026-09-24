/**
 * Game case: both. Shared portrait plumbing.
 */

/**
 * Whether an untagged `<img>` sits in a frame an absolute face crop can live in.
 *
 * `portrait.ts` applyCrop writes `position: absolute` and percentage geometry that
 * assume the parent is a positioned, clipped frame. Under a static parent the
 * crop resolves against some distant ancestor instead and the portrait escapes
 * its slot: the pause CHAPTER tab's Auron snap drew at 125 % of the whole pause
 * body on the live build (2026-09-24). Adopting such an element can only break
 * it, so leave it to its own CSS.
 */
export function canHostCrop(img: HTMLImageElement): boolean {
  const parent = img.parentElement;
  if (!parent || typeof getComputedStyle !== 'function') return true;
  return getComputedStyle(parent).position !== 'static';
}
