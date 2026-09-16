/**
 * Ink & Gold — public entry point.
 *
 * Re-exports the presentation primitives from docs/handoff/presentation-
 * ink-and-gold.md (Direction A, approved 2026-09-15, round 2) and installs
 * their stylesheets. See README.md for the adoption steps a HUD owner needs.
 */

import './tokens.css';
import './slabs.css';
import './screens.css';

export type { WipeDirection, WipeOptions, MatchMediaHost } from './wipe.ts';
export { playWipe, resolveWipeOptions, prefersReducedMotion } from './wipe.ts';

export type { CutInSide, TurnCutInOptions, TurnCutInHandle } from './cutin.ts';
export { showTurnCutIn } from './cutin.ts';

let installed = false;

/**
 * Injects `tokens.css`, `slabs.css` and `screens.css` into the page, once.
 * Safe to call more than once (later calls are a no-op) — the actual
 * injection is the plain `import './tokens.css'` / `'./slabs.css'` /
 * `'./screens.css'` above, the same side-effect mechanism
 * `src/ui/ffx/HudMock.ts` uses for `hud-mock.css`; this function just gives
 * callers an explicit, idempotent hook to call before they add the `.ig`
 * class to their overlay root.
 */
export function installInkGoldStyles(): void {
  if (installed) return;
  installed = true;
}
