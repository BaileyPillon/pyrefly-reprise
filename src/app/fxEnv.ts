/**
 * The comfort flags eye-candy D reads every frame (`EyeCandy.ts` `eyeCandy.env`), wired in the
 * product at boot, not only by the debug API: REDUCE MOTION (the OPTIONS row, or the OS
 * preference, as the battle camera reads it), LOW EFFECTS, REDUCE FLASHES once that row exists
 * (read defensively: the setting is not on main yet), and the viewport for the phone tier.
 *
 * REDUCE MOTION is cached for half a second: the flag is read by several layers every frame, and
 * `readSetting` plus `matchMedia` per read is wasted work. An OPTIONS change applies within 0.5 s.
 *
 * Game case: both (shared plumbing; FF7 never switches eye candy on).
 */

import { eyeCandy, type FxEnv } from '../engine/fx/EyeCandy.ts';
import { prefersReducedMotion } from '../ui/common/transitions/reduceMotion.ts';
import { readSetting } from './SaveData.ts';

const RM_CACHE_MS = 500;

function flag(name: string): boolean {
  try {
    return (readSetting as (k: string) => unknown)(name) === true;
  } catch {
    return false;
  }
}

/** A reader of the live flags; `now` and `view` are injectable for tests. */
export function makeFxEnv(
  now: () => number = () => (typeof performance === 'undefined' ? 0 : performance.now()),
  view: () => { width: number; height: number } = () => ({ width: window.innerWidth, height: window.innerHeight }),
): () => FxEnv {
  let rmAt = -Infinity;
  let rm = false;
  return () => {
    const t = now();
    if (t - rmAt >= RM_CACHE_MS) {
      rmAt = t;
      rm = prefersReducedMotion();
    }
    const v = view();
    return { lowEffects: flag('lowEffects'), reduceMotion: rm, reduceFlashes: flag('reduceFlashes'), width: v.width, height: v.height };
  };
}

/** Called once from `main.ts`, before the first screen. */
export function installFxEnv(): void {
  eyeCandy.env = makeFxEnv();
}
