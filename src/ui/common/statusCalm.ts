/**
 * Status display O3 repair (2026-09-30): is REDUCE MOTION in force for the status looks?
 * True while the pause row has `data-reduce-motion` on `<html>` (`app/applyComfort.ts`) or the OS
 * asks for reduced motion (the same two triggers `comfort.css` honours). The CSS marks read the
 * flag themselves (`status-marks-calm.css`); this is for the one look that is driven from script,
 * Pointless's slow flash (`statusFigureTint.ts`). Both games (shared plumbing). No DOM: false.
 */

let osQuery: MediaQueryList | null | undefined;

export function statusMotionStill(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.documentElement.dataset['reduceMotion'] !== undefined) return true;
  if (osQuery === undefined) {
    try {
      osQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    } catch {
      osQuery = null;
    }
  }
  return osQuery?.matches === true;
}
