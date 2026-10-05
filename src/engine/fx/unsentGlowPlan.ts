/**
 * What Lady Ginnem's live glow does under the player's switches (presentation plan A-9).
 *
 * The glow is eye candy (Bailey, 2026-09-19: "the pyrefly atmosphere set", 2026-10-03: "max out the eye candy"),
 * so it sits behind the same seam as the other painting looks: LIVING PAINTINGS (look b, the painting breathes),
 * through the EYE CANDY seam's `livingPaintings` key and the OPTIONS row that drives look b. `?fxsub=-glow`
 * turns just this one off. No new settings row: the page that lists the rows is settings persistence, and this
 * is a part of an existing look.
 *
 * - full tier: the breathing halo and the mote shell at full rate;
 * - phone tier: the halo breathes, the shell at 60 %;
 * - LOW EFFECTS: a still halo and a thin shell (30 %), the cost of a texture and a few dozen motes;
 * - REDUCE MOTION: a still halo and no motes (a mote is motion). The baked rim glow in the painting stays in
 *   every case, so she still reads as unsent with every switch off.
 *
 * Pure apart from reading the two switch modules: no DOM, no `three`. Game case: FFX only (Chapter IX).
 */

import { eyeCandy, type FxTier } from './EyeCandy.ts';
import { eyeCandyOn } from './eyeCandyFlags.ts';

/** The switches the glow answers to. */
export interface GlowSwitches {
  /** LIVING PAINTINGS, as the settings page reports it and as the OPTIONS row reads (look b). */
  look: boolean;
  /** `?fxsub=-glow` is not given. */
  sub: boolean;
  tier: FxTier;
  reduceMotion: boolean;
}

export interface GlowPlan {
  /** Draw the halo at all. */
  halo: boolean;
  /** The halo's opacity breathes. */
  breathe: boolean;
  /** Motes released a second at steady state; 0 = none. */
  moteRate: number;
}

/** Motes a second at full density (a mote lives 2.4 to 4.2 s: about 120 alive at once). */
export const MOTES_PER_S = 36;
const TIER_DENSITY: Readonly<Record<FxTier, number>> = { full: 1, phone: 0.6, low: 0.3 };

/** The breath: opacity runs between `lo` and 1 on this period (slow, as the plan says). */
export const BREATH = { periodS: 4.8, lo: 0.58 } as const;

export function glowPlan(s: GlowSwitches): GlowPlan {
  if (!s.look || !s.sub) return { halo: false, breathe: false, moteRate: 0 };
  if (s.reduceMotion) return { halo: true, breathe: false, moteRate: 0 };
  return { halo: true, breathe: s.tier !== 'low', moteRate: MOTES_PER_S * TIER_DENSITY[s.tier] };
}

/** The halo's opacity factor (0..1) at `t` seconds under a plan: still at the mid level, or the breath. */
export function haloLevel(t: number, plan: GlowPlan): number {
  if (!plan.halo) return 0;
  const mid = (1 + BREATH.lo) / 2;
  if (!plan.breathe) return mid;
  return mid + ((1 - BREATH.lo) / 2) * Math.sin((t / BREATH.periodS) * Math.PI * 2);
}

/** The live switches (main's eye candy state and the seam). */
export function liveGlowSwitches(): GlowSwitches {
  return {
    look: eyeCandy.enabled('b') && eyeCandyOn('livingPaintings'),
    sub: eyeCandy.sub('b', 'glow'),
    tier: eyeCandy.tier,
    reduceMotion: eyeCandy.reduceMotion,
  };
}
