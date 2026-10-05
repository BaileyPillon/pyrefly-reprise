/**
 * `window.__pyrefly.fx`: eye-candy D's runtime switch (captures and checks only, never a player
 * path). The live settings reach the fx through `app/fxEnv.ts`, wired at boot by `main.ts`.
 *
 * - `set(opt, on)` / `sub(id, on)` / `tier(t | null)` / `dial(name, v?)` (strength multipliers);
 * - `freeze(on)`: the screen's presentation clocks stop (the battle, its particles, spell
 *   effects, camera, grain and option A's breathing) while the renderer keeps drawing, so a
 *   capture takes the same frame ON and OFF;
 * - `stats(reset?)`: p50 / p95 / p99 of the rAF intervals (a 600-frame ring);
 * - `snapshot()`: the flags and each option's per-frame state (`fxDebugHooks`);
 * - `c`: option C's own triggers (`app/screens/battleSpectacle.ts`).
 */

import type { App } from '../app/App.ts';
import { installFxEnv } from '../app/fxEnv.ts';
import { applyFigureTrue, figureTrueOf } from '../engine/figureTrue.ts';
import { eyeCandy, type FxDial, type FxOption, type FxTier } from '../engine/fx/EyeCandy.ts';
import { livingStats, pinLivingClock } from '../engine/fx/b/LivingPaintings.ts';
import { fxDebugHooks } from '../engine/fx/fxDebugHooks.ts';
import { fxShared } from '../engine/fx/fxShared.ts';

export function installFxDebug(api: Record<string, unknown>, app: App): void {
  installFxEnv(); // the product wires it at boot (`main.ts`); again here for pages that only install the debug API
  api['fx'] = {
    set: (opt: FxOption, on: boolean) => eyeCandy.set(opt, on),
    sub: (id: string, on: boolean) => eyeCandy.setSub(id, on),
    tier: (t: FxTier | null) => eyeCandy.setTier(t),
    /** A strength dial (1 = as tuned); with no value, reads it. */
    dial: (name: FxDial, v?: number) => {
      if (v !== undefined) eyeCandy.setDial(name, v);
      return eyeCandy.dial(name);
    },
    /** Release 39 colour fidelity: how far a painted figure shows its painting's own colour, 0 (today's look, the default) to 1; no value reads it. */
    figureTrue: (v?: number) => {
      if (v !== undefined && Number.isFinite(v)) applyFigureTrue(app.renderer, v);
      return figureTrueOf(app.renderer);
    },
    freeze: (on: boolean) => {
      eyeCandy.frozen = on;
      // Also park the battle presenter at its next wait (the pause menu's gate), so no new
      // numeral, flash or effect starts between the ON and the OFF shot.
      for (const s of app.screens) {
        const gate = (s as unknown as { setPresenterPaused?: (p: boolean) => void }).setPresenterPaused;
        if (typeof gate === 'function') gate.call(s, on);
      }
      return on;
    },
    stats: (reset = false) => {
      const s = eyeCandy.probe.stats();
      if (reset) eyeCandy.probe.reset();
      return s;
    },
    snapshot: () => {
      const out: Record<string, unknown> = { ...eyeCandy.snapshot(), a: app.renderer.fxAStats ? { ...app.renderer.fxAStats } : null, b: livingStats(), shared: { ...fxShared } };
      for (const [k, h] of Object.entries(fxDebugHooks)) out[k] = h.snapshot?.() ?? null;
      return out;
    },
  };
  fxDebugHooks['b'] = { snapshot: livingStats, api: { pin: pinLivingClock } }; // option B: `fx.b.pin(t)` holds the room's clock (a capture on one drift phase)
  for (const k of ['a', 'b', 'c', 'mix']) { // mix: the MAX mix's parts (D-316; `fx/mix/MaxMix.ts`)
    Object.defineProperty(api['fx'], k, { get: () => fxDebugHooks[k]?.api ?? null, enumerable: true });
  }
}
