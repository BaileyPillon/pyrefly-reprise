import { emptyEdges } from './faceSlide.ts';
import type { PlateBox } from './plates.ts';

/**
 * Release 39.1, B10 (Bailey, 2026-10-05, "all of your recommendations"; **both games**: the pause screen is shared): a blurred, darkened extension
 * behind the pause painting, so the picture fills the window with no new art.
 *
 * The pause plates are 2688x1536 masters and `framePlate` never magnifies one past 1.25x (3,360 px), so a window wider than that (3840x2160, 3440x1440)
 * has page showing past the plate (3369x1925 at 4K, a strip right and below). Until now that strip was feathered into the dark falloff
 * (`pause__plate--capped`, PR-0121); it is now the same painting, blurred and darkened, behind the sharp plate, so the feathered edge blends into more of
 * the picture instead of into black. The master is never edited: it is a second use of the same file as a CSS background on a pseudo-element of
 * `.pause__art` (`pause-slide.css`), set up here from the live plate's own URL. Only while the plate leaves page uncovered and is not slid (a slid plate's
 * page sits under the chrome by design, and every window up to 3,360 px wide is untouched).
 */

/** Where the extension's picture is anchored (percent, CSS `background-position`): on the side the plate is pinned to, so its features line up there. */
export function extensionAnchor(box: Pick<PlateBox, 'left' | 'top' | 'width' | 'height'>, frameW: number, frameH: number): { x: number; y: number } {
  const e = emptyEdges(box, frameW, frameH);
  const along = (before: number, after: number): number => (after > 0 && before === 0 ? 0 : before > 0 && after === 0 ? 100 : 50);
  return { x: along(e.left, e.right), y: along(e.top, e.bottom) };
}

/** Turn the extension on for the live plate `img` (or off): the class and the two custom properties the stylesheet reads. */
export function applyExtension(
  root: HTMLElement,
  img: HTMLImageElement,
  on: boolean,
  box: Pick<PlateBox, 'left' | 'top' | 'width' | 'height'>,
  frameW: number,
  frameH: number,
): void {
  const src = on ? img.currentSrc || img.getAttribute('src') || '' : '';
  if (!on || src === '') {
    root.classList.remove('pause__art--extended');
    root.style.removeProperty('--pu-ext-url');
    root.style.removeProperty('--pu-ext-pos');
    return;
  }
  const a = extensionAnchor(box, frameW, frameH);
  root.classList.add('pause__art--extended');
  root.style.setProperty('--pu-ext-url', `url("${src.replace(/"/g, '%22')}")`);
  root.style.setProperty('--pu-ext-pos', `${a.x}% ${a.y}%`);
}
