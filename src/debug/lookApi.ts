/**
 * `window.__pyrefly.look`: the demo looks' runtime switch (dev flag only; nothing the game reads). The rig exists only when the address carries `?look=` (any value,
 * even `off`); `F6` cycles the looks and `F7` the quality while it does.
 *
 * - `set(name | null)`: `'hd2d' | 'cinematic' | 'anime'` or null for today's look; `get()`: the look in force;
 * - `quality(q?)`: `'high' | 'medium' | 'low'`; with no value reads it;
 * - `strength(s?)`: `'subtle' | 'bold'` (`?lookstrength=bold`; `F8` flips it): the conference strength of hd2d and cinematic; `param('bold.fog' | 'bold.pool' | 'bold.rim' | 'bold.gloss' | 'bold.embers', k)` scales one bold effect;
 * - `param(path, v | null)`: a live override of one number of the look's table (`'shaft.gain'`, `'fog.density'`, `'blur.far'` ...); null clears it; `clear()` drops all;
 * - `debug('mask' | null)`: show the figure mask (the frame's alpha) instead of the picture;
 * - `stats()`: what the last frame did (the look, quality, room, where the light is and where it came from, the passes).
 *
 * Both games (shared plumbing).
 */
import type { App } from '../app/App.ts';
import { LOOK_NAMES, LOOKS, QUALITY_COST, type LookDebug, type LookName, type LookQuality } from '../engine/look/LookConfig.ts';
import { installLookKeys, lookState, setLookDebug, setLookName, setLookQuality, setLookRecipe, setLookStrength, setLookTweak } from '../engine/look/LookState.ts';

export function installLookDebug(api: Record<string, unknown>, app: App): void {
  installLookKeys(window);
  // `?lookdrift=1`: the backdrop stands still while a command menu is open (polled; nothing in the battle or the HUD is touched)
  if (lookState.armed && lookState.drift) {
    window.setInterval(() => {
      const ss = (api['snapshotState'] as (() => { screenState?: { playback?: { awaitingMenu?: boolean } } } | null) | undefined)?.();
      lookState.commandOpen = ss?.screenState?.playback?.awaitingMenu === true;
    }, 120);
  }
  api['look'] = {
    set: (name: LookName | null) => {
      setLookName(name === null || (LOOK_NAMES as readonly string[]).includes(name) ? name : null);
      return lookState.name;
    },
    get: () => lookState.name,
    strength: (s?: 'subtle' | 'bold') => {
      if (s !== undefined) setLookStrength(s);
      return lookState.strength;
    },
    quality: (q?: LookQuality) => {
      if (q !== undefined) setLookQuality(q);
      return lookState.quality;
    },
    param: (path: string, v: number | null) => setLookTweak(path, v),
    /** A live override of the grade recipe (exposure, gamma, contrast, pivot, shoulder, shadowSplit, highlightSplit, shadowHue, highlightHue, midSat, sat, hues ...); null clears it. */
    recipe: (p: Record<string, unknown> | null) => setLookRecipe(p as never),
    clear: () => {
      for (const k of Object.keys(lookState.tweaks)) setLookTweak(k, null);
    },
    debug: (d: LookDebug) => setLookDebug(d),
    stats: () => ({ ...(app.renderer.lookStats ?? {}), tweaks: { ...lookState.tweaks } }),
    names: LOOK_NAMES,
    table: LOOKS,
    cost: QUALITY_COST,
  };
}
