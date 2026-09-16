/**
 * Ink & Gold — the diagonal screen-change wipe.
 *
 * Spec (docs/handoff/presentation-ink-and-gold.md, "Motion & camera"):
 * "Every screen change is a diagonal ivory wipe at 19deg (battle start ->
 * battle, battle -> results, menu -> chapter)." FFX-2 chapters mirror it to
 * -19deg (spec "Not mocked yet": "wipes at -19deg"), which this module
 * exposes as `direction: 'rtl'`.
 *
 * The wipe has no mocked timeline in the spec (only the cut-in and damage
 * pop carry explicit millisecond figures), so the split-half cover/clear
 * timing and default duration below are this module's own choice, not a
 * quoted value — kept in one constant so a HUD owner can see and override it.
 *
 * Pure DOM + CSS transitions, no Three.js. The panel is `.ig-slab`-adjacent
 * but not `.ig-slab` itself (it has no counter-skewed content to carry), so
 * its geometry lives in slabs.css's `.ig-wipe` rule.
 */

import './tokens.css';
import './slabs.css';

export type WipeDirection = 'ltr' | 'rtl';

export interface WipeOptions {
  /** Sweep direction. 'rtl' is the FFX-2 mirror (wipes at -19deg). Default 'ltr'. */
  direction?: WipeDirection;
  /** Total cover+clear duration in ms. Not specified by the spec; see DEFAULT_DURATION_MS. */
  durationMs?: number;
  /** Wipe panel colour. Spec: "diagonal ivory wipe". Default the paper token. */
  color?: string;
  /** Fired the instant the frame is fully covered, so the caller can swap
   * screens and play `battle-start` / `menu-page` before the clear half runs. */
  onCover?: () => void;
}

interface ResolvedWipeOptions {
  direction: WipeDirection;
  durationMs: number;
  color: string;
  onCover?: () => void;
}

/** Not specified by the spec; split evenly between the cover and clear halves. */
const DEFAULT_DURATION_MS = 480;
/** Spec "Motion & camera": every wipe is diagonal at 19deg. */
const WIPE_ANGLE_DEG = 19;
const DEFAULT_COLOR = '#f4f1e8'; // --ig-paper

/** A window-shaped object exposing just enough of `matchMedia` to query. */
export interface MatchMediaHost {
  matchMedia?: (query: string) => { matches: boolean };
}

/** Fills in every optional field. Exported so its defaults are unit-testable without a DOM. */
export function resolveWipeOptions(opts: WipeOptions = {}): ResolvedWipeOptions {
  return {
    direction: opts.direction ?? 'ltr',
    durationMs: opts.durationMs ?? DEFAULT_DURATION_MS,
    color: opts.color ?? DEFAULT_COLOR,
    onCover: opts.onCover,
  };
}

/**
 * True when reduced motion is requested. Accepts an injected host so tests
 * can assert the branch without a real browser `window.matchMedia`.
 */
export function prefersReducedMotion(host?: MatchMediaHost): boolean {
  const win = host ?? (typeof window !== 'undefined' ? window : undefined);
  if (!win?.matchMedia) return false;
  return win.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Plays the wipe over `root` and resolves once it has fully cleared.
 *
 * Under reduced motion this skips the animation entirely: `onCover` fires
 * synchronously-next-tick and the promise resolves immediately, matching the
 * spec's "instant cut" — the caller still gets its swap-screens hook, just
 * with no visible sweep.
 */
export function playWipe(root: HTMLElement, opts: WipeOptions = {}): Promise<void> {
  const resolved = resolveWipeOptions(opts);

  if (prefersReducedMotion()) {
    resolved.onCover?.();
    return Promise.resolve();
  }

  const doc = root.ownerDocument;
  const panel = doc.createElement('div');
  panel.className = 'ig-wipe';
  panel.style.background = resolved.color;

  const skewDeg = resolved.direction === 'rtl' ? -WIPE_ANGLE_DEG : WIPE_ANGLE_DEG;
  const half = resolved.durationMs / 2;
  // Travels start (off-screen) -> mid (fully covering) -> end (off-screen the
  // other way), so the same sweep both hides and reveals the frame.
  const startX = resolved.direction === 'rtl' ? '130%' : '-130%';
  const endX = resolved.direction === 'rtl' ? '-130%' : '130%';
  const at = (x: string): string => `translateX(${x}) skewX(${skewDeg}deg)`;

  panel.style.transition = 'none';
  panel.style.transform = at(startX);
  root.appendChild(panel);

  return new Promise<void>((resolve) => {
    // Force layout so the browser registers the start position before the
    // transition below is asked to animate away from it.
    void panel.getBoundingClientRect();
    panel.style.transition = `transform ${half}ms ease-in`;
    panel.style.transform = at('0%');

    window.setTimeout(() => {
      resolved.onCover?.();
      panel.style.transition = `transform ${half}ms ease-out`;
      panel.style.transform = at(endX);

      window.setTimeout(() => {
        panel.remove();
        resolve();
      }, half);
    }, half);
  });
}
