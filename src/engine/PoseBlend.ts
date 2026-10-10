/**
 * ONE OWNED POSE BLEND PER ACTOR (visual-and-feel fix FB-1; PR-0379; both games).
 *
 * `PaintedActor` shows a pose change as a crossfade between its two planes. Until this module the crossfade was a
 * tween nobody owned: a second request while it ran re-pointed the plane that was still fading out (the painting
 * the player was looking at) to the new pose at once, so the new pose popped in at about a third strength, the
 * first tween was never stopped (two tweens wrote the same two fades), and a hit-stop that held the field clock
 * held the half-mixed frame for 2 to 5 more frames. The attack key chain (ready, attack, follow 83 ms later) hit
 * all three: 240 of 271 FFX attack-to-follow swaps in round 23 read exactly eight ghost frames.
 *
 * The rules, all pure arithmetic on two planes' fades (no `three`, no DOM, deterministic):
 *
 * 1. **One blend at a time.** A request ends the blend before it.
 * 2. **A request in mid-blend keeps the stronger plane as the outgoing painting** and re-points only the weaker
 *    one, whose fade starts from 0. (The weaker plane's painting is dropped: at most two paintings above 0.02.)
 * 3. **A request naming a painting a plane already holds reverses to it** without touching any fade: no pop.
 * 4. **A request naming the painting already on its way in is nothing** (`same`): the running blend goes on.
 * 5. **The clock is the caller's.** `advance(ms)` takes real milliseconds; `PaintedActor.update(dt, realDt)` hands
 *    it the unscaled frame time, so neither the hit-stop nor the pacing option stretches or freezes a blend.
 * 6. **The shape is injected.** Today's `quadInOut` by default; a symmetric `(u) => s` or a pair of curves
 *    ({@link BlendCurves}) per request, so a capped or stepped shape (FB-2) or the KO cross ({@link KO_CROSS})
 *    plugs in without touching this file again.
 *
 * The fades are written on the planes the caller hands in (`PaintedActor.slots`), the very fields the harness
 * probe and the twirl pin read, so nothing downstream changes.
 */

import { Easing } from './Tween.ts';

/** What a blend needs of a plane: the painting's name and how much of it shows. `PaintedActor`'s `PlaneSlot` is one. */
export interface BlendPlane {
  fade: number;
  pose: string;
}

/** A symmetric shape: progress 0..1 in, the share of the way across 0..1 out. Outgoing = start * (1 - s), incoming = start + (1 - start) * s. */
export type BlendShape = (u: number) => number;

/**
 * Two curves, for a shape whose planes do not mirror each other. `out(u)` is the share of the outgoing plane's
 * starting fade that is left (1 at the start, 0 at the end); `inn(u)` is the share of the way the incoming plane
 * has come (0 to 1).
 */
export interface BlendCurves {
  readonly out: (u: number) => number;
  readonly inn: (u: number) => number;
}

/** What a request may carry beyond the painting and the length. */
export type BlendShapeSpec = BlendShape | BlendCurves;

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Today's blend, the one the actor has always had. */
export const QUAD_IN_OUT: BlendShape = Easing.quadInOut;

/**
 * The knock-out cross (for the KO lane): the standing painting goes out linearly, the lying one comes in on a
 * square, so the two never share much. `min(from, to)` peaks where `1 - u = u * u`, at 0.382 (never above it, at
 * any frame rate, for a painting that starts from 0), which keeps the double image under the check's 0.40 even
 * for the pairs that barely overlap.
 */
export const KO_CROSS: BlendCurves = { out: (u) => 1 - clamp01(u), inn: (u) => clamp01(u) * clamp01(u) };

/** The most the lesser of the two planes can ever show on {@link KO_CROSS}: (3 - sqrt 5) / 2. */
export const KO_CROSS_PEAK = (3 - Math.sqrt(5)) / 2;

/** The KO cross as plain numbers: the fades of the outgoing (`from = 1 - s`) and the incoming (`to = s * s`) painting at progress `s`. */
export function koCross(s: number): { from: number; to: number } {
  return { from: KO_CROSS.out(s), to: KO_CROSS.inn(s) };
}

/**
 * What {@link PoseBlend.request} decided: `same` (the requested painting is already the one on its way in, so the blend that runs goes on and there is
 * nothing to do), or the plane the pose is now on its way into (the actor's new `active`), whether that plane has to be pointed at the painting (it
 * held another, and its fade was set to 0), and whether the request turned a running blend round on a painting a plane already held (no fade moved).
 */
export type BlendPlan = { same: true } | { same: false; to: 0 | 1; repoint: boolean; reversed: boolean };

interface Running {
  readonly from: 0 | 1;
  readonly to: 0 | 1;
  readonly fromStart: number;
  readonly toStart: number;
  readonly duration: number;
  readonly curves: BlendCurves;
  elapsed: number;
}

/** Normalise either spelling of a shape to the pair of curves. */
function curvesOf(spec: BlendShapeSpec): BlendCurves {
  if (typeof spec !== 'function') return spec;
  return { out: (u) => 1 - spec(u), inn: spec };
}

export class PoseBlend {
  private run: Running | null = null;
  private readonly planes: readonly [BlendPlane, BlendPlane];
  private readonly fallback: BlendCurves;

  /** @param planes the two planes whose `fade` this controller writes (read live: another writer's change, such as the twirl pin, is taken as the state). */
  constructor(planes: readonly [BlendPlane, BlendPlane], shape: BlendShapeSpec = QUAD_IN_OUT) {
    this.planes = planes;
    this.fallback = curvesOf(shape);
  }

  /** True while a blend is running (a `PaintedActor.blending`, which `stillActor` reads). */
  get blending(): boolean {
    return this.run !== null;
  }

  /** Progress of the running blend, 0 to 1 (1 when none runs). */
  get progress(): number {
    const r = this.run;
    return r ? clamp01(r.elapsed / r.duration) : 1;
  }

  /**
   * Ask for painting `key` over `durationMs`. `active` is the plane the actor counts as showing the current pose
   * (the one on its way in, or the one at full when nothing runs). The caller points `plan.to` at the painting
   * when `plan.repoint`, and makes `plan.to` its active plane. Fades are changed here only for a re-pointed plane
   * (to 0). A length of 0 or less is the caller's cut, not a blend; it is treated as a very short blend here so
   * the planes still end at 1 and 0 on the next advance.
   */
  request(key: string, durationMs: number, active: 0 | 1, shape?: BlendShapeSpec): BlendPlan {
    const P = this.planes;
    const target = P[active];
    if (target.pose === key) return { same: true };

    const other: 0 | 1 = active === 0 ? 1 : 0;
    // The stronger plane is the one showing more; a tie is the one on its way in.
    const strong: 0 | 1 = P[other].fade > target.fade ? other : active;
    const weak: 0 | 1 = strong === 0 ? 1 : 0;

    const mid = this.run !== null; // a blend in flight: naming a painting a plane holds turns it round
    let inn: 0 | 1;
    let repoint = false;
    let reversed = false;
    if (P[weak].pose === key) {
      inn = weak;
      reversed = mid;
    } else if (P[strong].pose === key) {
      inn = strong;
      reversed = mid;
    } else {
      inn = weak;
      repoint = true;
      P[weak].fade = 0;
    }
    const out: 0 | 1 = inn === 0 ? 1 : 0;
    this.run = {
      from: out,
      to: inn,
      fromStart: P[out].fade,
      toStart: P[inn].fade,
      duration: Math.max(1, durationMs),
      curves: shape ? curvesOf(shape) : this.fallback,
      elapsed: 0,
    };
    return { same: false, to: inn, repoint, reversed };
  }

  /**
   * Move the running blend on by `ms` of real time. Returns true when the planes' fades were written this call
   * (the caller then syncs the opacities). A zero `ms` writes the same fades again and moves nothing.
   */
  advance(ms: number): boolean {
    const r = this.run;
    if (!r) return false;
    const step = ms > 0 && Number.isFinite(ms) ? ms : 0;
    r.elapsed += step;
    const from = this.planes[r.from];
    const to = this.planes[r.to];
    if (r.elapsed >= r.duration) {
      to.fade = 1;
      from.fade = 0;
      this.run = null;
      return true;
    }
    const u = r.elapsed / r.duration;
    from.fade = clamp01(r.fromStart * r.curves.out(u));
    to.fade = clamp01(r.toStart + (1 - r.toStart) * r.curves.inn(u));
    return true;
  }

  /** Drop the running blend where it stands (a cut, a dispose): the planes keep the fades they have. */
  cancel(): void {
    this.run = null;
  }
}
