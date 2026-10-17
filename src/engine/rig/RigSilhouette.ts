/**
 * A rigged figure's silhouette per key, for the HUD's target brackets and the strike's reach (the rig program, 2026-10-17; both games, shared plumbing; pure: no `three`, no DOM).
 *
 * The brackets (`PaintedActor.contentQuad`) and the strike solver (`engine/motion/Silhouette.ts`) read the IDLE plane's alpha: the carrier of a rig loads only the idle painting, so a raised
 * spear did not widen a bracket and a lunge aimed at the idle's front. The gate measures every key's posed silhouette once, from its own raster (`tools/rig/rig-silhouette.mjs`), and stamps
 * the readings into `rig.json` (`gate.silhouettes`, `RigSilhouette` in `rigTypes.ts`): the box of the painted pixels, the lowest foot, and the painted front in 40 bands. This module reads
 * them back (a number that is not a finite one is a key with no shape, and the figure keeps the idle's) and blends two of them as the figure moves between keys.
 */
import { Easing } from '../Tween.ts';
import type { RigGate } from '../../data/art/rigTypes.ts';
import type { Profile } from '../motion/Silhouette.ts';

/** One key's shape in the master's px: the painted box, the lowest foot, and the painted front as absolute x per band (NaN where a band holds nothing). */
export interface KeyShape {
  box: [number, number, number, number];
  feet: [number, number] | null;
  /** Absolute x (master px) of the first and last painted pixel of each band, top to bottom. */
  left: Float64Array;
  right: Float64Array;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** The shapes a gate stamped, by key. A key whose record is not well formed is left out (that key reads as the idle's). */
export function readSilhouettes(gate: RigGate | undefined): Map<string, KeyShape> {
  const out = new Map<string, KeyShape>();
  const all = gate?.silhouettes;
  if (!all || typeof all !== 'object') return out;
  for (const [pose, s] of Object.entries(all)) {
    const box = s?.box;
    if (!Array.isArray(box) || box.length !== 4 || !box.every(finite) || !(box[2]! > box[0]!) || !(box[3]! > box[1]!)) continue;
    const l = s.profile?.left;
    const r = s.profile?.right;
    if (!Array.isArray(l) || !Array.isArray(r) || l.length === 0 || l.length !== r.length) continue;
    const w = box[2]! - box[0]!;
    const left = new Float64Array(l.length);
    const right = new Float64Array(l.length);
    for (let i = 0; i < l.length; i++) {
      const [a, b] = [l[i], r[i]];
      left[i] = finite(a) && finite(b) ? box[0]! + a * w : Number.NaN;
      right[i] = finite(a) && finite(b) ? box[0]! + b * w : Number.NaN;
    }
    out.set(pose, { box: [box[0]!, box[1]!, box[2]!, box[3]!], feet: Array.isArray(s.feet) && s.feet.length === 2 && s.feet.every(finite) ? [s.feet[0]!, s.feet[1]!] : null, left, right });
  }
  return out;
}

const mix = (a: number, b: number, t: number): number => (Number.isNaN(a) ? b : Number.isNaN(b) ? a : a + (b - a) * t);

/** The shape `t` (0..1) of the way from `a` to `b`, eased as the bones are (the game's own ease): the boxes and the fronts by straight lines, a band empty in one taken from the other. */
export function blendShape(a: KeyShape, b: KeyShape, t: number): KeyShape {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const e = Easing.quadInOut(t);
  const n = Math.min(a.left.length, b.left.length);
  const left = new Float64Array(n);
  const right = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    // the bands are fractions of each box's height: band i of one key meets band i of the other
    left[i] = mix(a.left[i]!, b.left[i]!, e);
    right[i] = mix(a.right[i]!, b.right[i]!, e);
  }
  const feet: [number, number] | null = a.feet && b.feet ? [mix(a.feet[0], b.feet[0], e), mix(a.feet[1], b.feet[1], e)] : (b.feet ?? a.feet);
  return { box: [mix(a.box[0], b.box[0], e), mix(a.box[1], b.box[1], e), mix(a.box[2], b.box[2], e), mix(a.box[3], b.box[3], e)], feet, left, right };
}

/**
 * The painted front of a shape as `engine/motion/Silhouette.ts` reads it: per band, the fraction of the box width where the first and the last painted pixel sit (NaN where a band holds
 * nothing). `mirrored` (the plane is turned the other way, `mesh.scale.x < 0`) flips the front, as the painting's mask is flipped.
 */
export function profileOfShape(s: KeyShape, mirrored: boolean): Profile {
  const w = s.box[2] - s.box[0];
  const n = s.left.length;
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const l = (s.left[i]! - s.box[0]) / w;
    const r = (s.right[i]! - s.box[0]) / w;
    left[i] = mirrored ? 1 - r : l;
    right[i] = mirrored ? 1 - l : r;
  }
  return { left, right };
}
