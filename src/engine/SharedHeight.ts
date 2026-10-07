import type { Vector3 } from 'three';
import { STATURE_KEY } from './PartyStature.ts';

/**
 * A hero drawn at his own height, read back at the party's shared one (r3941-heights; FFX only in effect).
 *
 * The stage draws each FFX hero at the shared height times his stature (`PartyStature.ts`) and records the factor on the actor
 * ({@link STATURE_KEY}). Everything that PLACES THE CAMERA (CHAPTER FRAMING and BOSS SCALE, `fx/mix/planFig.ts`; the phone's A-12 refit,
 * `FrameFit.ts`) read the figures' live quads, so a taller or shorter party would have moved the camera and re-sized the colossi.
 * Bailey picked "Keep camera and bosses as before" (2026-10-07), so those read each hero scaled back about his feet by his stature: the
 * quad they were always handed. Everything that SHOWS the figure (the drawing, the HUD's anchors, the held shots, the pushes that must
 * not cut a head) still reads the real one. The factor is read off the actor, not looked up again, so a figure the stage did not scale
 * (a scene-named height, an arrival director's, another game, `?stature=off`) carries none and is never scaled back.
 *
 * Pure maths on copies; nothing is written to an actor. Game case: FFX only in effect (only the stage's FFX heroes carry a stature).
 */

/** What of an actor this reads: the plain `Object3D` members (a stub with neither is a figure with no stature). */
export interface Staged {
  userData?: Record<string, unknown>;
  getWorldPosition?(target: Vector3): Vector3;
}

/** The factor the stage multiplied this figure's shared height by (1: none, the figure stands at the party's shared height). */
export function statureOf(a: Staged): number {
  const k = a.userData?.[STATURE_KEY];
  return typeof k === 'number' && k > 0 ? k : 1;
}

/** `v` brought back to the shared height, in place: the drawn figure is the shared one scaled by `k` about its ground point `g` (the plane's feet row stands on it). */
export function backToShared(v: Vector3, g: Vector3, k: number): Vector3 {
  return v.sub(g).divideScalar(k).add(g);
}
