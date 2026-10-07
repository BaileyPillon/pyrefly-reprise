import type { HeadBox } from '../data/art/poseRegistrationTypes.ts';
import type { PoseScale } from './PaintedScale.ts';

/**
 * **The engine keeps the head steady** (D-510, Bailey's pick of 2026-10-06, both games; lane r394-headlock).
 *
 * A pose's painting is sized so that its registered head is the idle's head (`PoseRegistration.ts`: one `scale` per pose, from
 * rulers), but the stage camera does not draw every painting alike: a lying body is rolled onto the floor and a standing one is
 * upright, a victory pose's head sits a third of a figure lower than the idle's, and a camera that converges draws the lower head
 * smaller. Across 165 knock-out swaps the lying head over the standing head fell from x1.05 to x0.97 as the camera's perspective
 * went from 0.98 to 1.04 (`docs/handoff/r392-size.md` section 4a), so Chapter V's Rikku and Chapter XVII's Yuna failed CHK-026's
 * 3 percent at the cut of a collapse, and no table value could hold it: the number that is wrong is the camera's, and it changes.
 *
 * So the head is held on screen, not in the table. For a plane with a registered head box, whose actor has a registered idle,
 * the plane is scaled about the figure's feet so that the head box, projected through THIS frame's camera and the plane's own
 * transform, is as big on screen as the idle's head box is where the idle stands, under the same transform. Every pose is held to
 * the same number, so a swap from any pose to any pose reads x1.00 and a revive under a camera that moved since the fall does too.
 * It is recomputed every frame from the camera in hand (a pure function of the frame: no history, nothing to drift, no pop when
 * the camera moves later), as a factor on the table's own `scale` bounded to {@link HEAD_BAND}; a hit of the band is reported
 * ({@link HeadLockStats}), never absorbed.
 *
 * What "size" is: the square root of the area of the head box's four corners as drawn, in NDC units. That is the continuity
 * harness's own figure (`critic/runner/lib/continuity-pure.mjs` `headSizePx`) up to one constant (the canvas's width times its
 * height over four) that every box on a canvas shares, so a ratio of two of them is the same number the check judges; the plane
 * is flat, so projecting the box's four corners is exactly the harness's projective map of the painting's four.
 *
 * Presentation only, no game number: the table, the harness and the check's tolerances are untouched. Pure: no `three`, no DOM
 * (`PaintedActor.holdHead` and `HeadLockStage.ts` are the `three` half).
 */

export type { HeadBox };

/** The band the factor may move the table's scale in: the same 0.9 to 1.1 a camera allowance is held to (`tools/pose-scale-check.mjs`). */
export const HEAD_BAND: readonly [number, number] = [0.9, 1.1];

/** Below this a size or a clip `w` is no size at all (a box edge-on to the camera, or a corner on or behind it). */
const TINY = 1e-9;

// ------------------------------------------------------------------ the kill switch

let off: boolean | null = null;

/** `?headlock=off` (captures and A/B comparisons only): the planes keep the table's scale, as before D-510. Read once, like the other URL switches' first look. */
export function headLockOff(): boolean {
  if (off === null) off = new URLSearchParams(globalThis.location?.search ?? '').get('headlock') === 'off';
  return off;
}

/** Tests: force the switch (`null` reads the address again). */
export function setHeadLockOff(value: boolean | null): void {
  off = value;
}

// ------------------------------------------------------------------ the measure

const quad = new Float64Array(8);

/**
 * How big a head box is on screen, in NDC units: the square root of the area its four corners cover.
 * `mvp` is a column-major 4x4 (a `Matrix4`'s `elements`) taking the plane's local frame to clip space, and a corner `(u, t)` of the
 * box is the local point `(u - 0.5, 0.5 - t, 0)`: the plane is a unit square centred on its origin and the mesh's scale and mirror
 * are in `mvp` (the same corners `PaintedActor.paintPoint` and the harness's probe use). NaN when a corner is on or behind the camera.
 */
export function projectedHeadSize(mvp: ArrayLike<number>, head: HeadBox): number {
  const [u0, t0, u1, t1] = head;
  for (let i = 0; i < 4; i++) {
    // top-left, top-right, bottom-right, bottom-left: the harness's order, so the polygon is traced round
    const lx = (i === 1 || i === 2 ? u1 : u0) - 0.5;
    const ly = 0.5 - (i >= 2 ? t1 : t0);
    const w = mvp[3]! * lx + mvp[7]! * ly + mvp[15]!;
    if (!(w > TINY)) return Number.NaN;
    quad[2 * i] = (mvp[0]! * lx + mvp[4]! * ly + mvp[12]!) / w;
    quad[2 * i + 1] = (mvp[1]! * lx + mvp[5]! * ly + mvp[13]!) / w;
  }
  let twice = 0;
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    twice += quad[2 * i]! * quad[2 * j + 1]! - quad[2 * j]! * quad[2 * i + 1]!;
  }
  return Math.sqrt(Math.abs(twice) / 2);
}

/**
 * A pose's {@link PoseScale} with the pose's `scale` multiplied by `factor`. Every length of it is the pixel scale times a pixel count
 * (the plane's size, where the anchor row lifts it, the footprint, the content box), so each scales; the anchor row (a pixel), `prone`
 * and `clamped` do not. Placing the result as `applyPose` places any scale (`placeSlot`) is "about the feet": the anchor row sits on the
 * actor's ground point at every scale, and the registration's stance shift follows the pixel scale.
 */
export function scaledPose(scale: PoseScale, factor: number): PoseScale {
  if (factor === 1) return scale;
  const b = scale.contentBox;
  return {
    ...scale,
    unitsPerPixel: scale.unitsPerPixel * factor,
    width: scale.width * factor,
    height: scale.height * factor,
    offsetY: scale.offsetY * factor,
    topY: scale.topY * factor,
    footprint: scale.footprint * factor,
    contentBox: { x0: b.x0 * factor, x1: b.x1 * factor, y0: b.y0 * factor, y1: b.y1 * factor },
  };
}

// ------------------------------------------------------------------ the solve

export interface HeadSolve {
  /** The factor to put on the table's scale: inside the band, or 1 when `skipped`. */
  factor: number;
  /** What the geometry asked for before the band (the second pass's answer). */
  raw: number;
  /** -1 when the band's floor held the factor, 1 when its ceiling did, 0 when it did not bite. */
  clamp: -1 | 0 | 1;
  /** True when the frame's geometry was degenerate (no size to read, a corner behind the camera): the table's scale stands. */
  skipped: boolean;
  /** The factor the last call of `sizeAt` was made at, so a caller that already holds the plane at it does not place it again. */
  evaluated: number;
}

const finite = (v: number): boolean => Number.isFinite(v) && v > TINY;

/**
 * The factor that makes a plane's head `want` big on screen. `sizeAt(f)` puts the plane at the table's scale times `f` and says how big
 * its head is then. The head's size is proportional to the factor to a very good approximation, so the first answer is `want` over the size at 1;
 * scaling about the feet moves the head a little (nearer, farther, off the middle of the lens), so a second look at the answer corrects that
 * (the first answer is good to about 0.2 percent at the stage cameras, the second to about 0.01 percent). The band holds both.
 */
export function solveHeadFactor(sizeAt: (factor: number) => number, want: number, band: readonly [number, number] = HEAD_BAND): HeadSolve {
  const [lo, hi] = band;
  const s1 = sizeAt(1);
  if (!finite(s1) || !finite(want)) return { factor: 1, raw: 1, clamp: 0, skipped: true, evaluated: 1 };
  const first = Math.min(hi, Math.max(lo, want / s1));
  const s2 = sizeAt(first);
  const raw = finite(s2) ? (first * want) / s2 : want / s1;
  const factor = Math.min(hi, Math.max(lo, raw));
  return { factor, raw, clamp: raw < lo ? -1 : raw > hi ? 1 : 0, skipped: false, evaluated: first };
}

// ------------------------------------------------------------------ the report

/** What an actor's lock did: how often, over what range, and every time the band bit (D-510: "the clamp hit reported"). */
export class HeadLockStats {
  /** Planes held (a plane counts once per frame it was solved). */
  planes = 0;
  /** Frames a plane could not be solved (a degenerate view) and kept the table's scale. */
  skipped = 0;
  /** Times the band's floor, and its ceiling, held a factor. */
  clampedLow = 0;
  clampedHigh = 0;
  /** The smallest and the largest factor applied, and the raw answer farthest from 1 (a clamp hit's real size). */
  min = Infinity;
  max = -Infinity;
  worstRaw = 1;
  /** The last plane solved. */
  last: { pose: string; factor: number; raw: number; clamp: -1 | 0 | 1 } | null = null;
  private readonly warned = new Set<string>();

  /** Count one solved plane; true the first time a pose of this actor hits the band (the caller says so once). */
  note(pose: string, res: HeadSolve): boolean {
    if (res.skipped) {
      this.skipped++;
      return false;
    }
    this.planes++;
    this.min = Math.min(this.min, res.factor);
    this.max = Math.max(this.max, res.factor);
    if (Math.abs(Math.log(res.raw)) > Math.abs(Math.log(this.worstRaw))) this.worstRaw = res.raw;
    if (this.last) {
      this.last.pose = pose; // in place: a plane is noted every frame it shows
      this.last.factor = res.factor;
      this.last.raw = res.raw;
      this.last.clamp = res.clamp;
    } else this.last = { pose, factor: res.factor, raw: res.raw, clamp: res.clamp };
    if (res.clamp === 0) return false;
    if (res.clamp < 0) this.clampedLow++;
    else this.clampedHigh++;
    if (this.warned.has(pose)) return false;
    this.warned.add(pose);
    return true;
  }

  get clamped(): number {
    return this.clampedLow + this.clampedHigh;
  }

  snapshot(): { planes: number; skipped: number; clampedLow: number; clampedHigh: number; min: number | null; max: number | null; worstRaw: number; last: HeadLockStats['last'] } {
    return {
      planes: this.planes,
      skipped: this.skipped,
      clampedLow: this.clampedLow,
      clampedHigh: this.clampedHigh,
      min: this.planes ? this.min : null,
      max: this.planes ? this.max : null,
      worstRaw: this.worstRaw,
      last: this.last ? { ...this.last } : null,
    };
  }
}
