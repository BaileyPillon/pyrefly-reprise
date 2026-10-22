/**
 * THE CONTACT SHADOW FOLLOWS (`?shadow=follow`; `FeelSwitch.ts` has the switch; both games). Bailey, 2026-10-22: "Contact shadow follows": it stays under the feet through the
 * lunge, shrinks and fades when the figure is in the air, and spreads a little on landing; party and bosses.
 *
 * **What today does.** `PaintedActor` draws the shadow as a disc on the floor under the actor's group and slides it with the figure's offset at 0.55 of the way
 * (`shadow.position.x = ox * 0.55`), so on a 1.4 to 4 unit lunge the shadow is left up to 45 percent of the lunge BEHIND the boots. It shrinks (42 percent) and fades (50 percent) with
 * the hop and the hover together, which on a 0.035 H step hop is a 2 percent change nobody can see.
 *
 * **What `follow` does.**
 * - {@link shadowX}: the shadow's x is the figure's whole offset (lunge, recoil, lean, shake), so it is under the feet at every frame of a lunge. The part of the offset that is a
 *   body lying down (a KO'd figure's plane swings about its feet, `lieDx`) keeps today's 0.55, because a lying body's footprint is not under its pivot.
 * - {@link ShadowFollow.step}: a shrink and a fade by how far the figure is OFF the ground right now (a hop, or the lunge's arc once the motion lane adds one: the actor passes the
 *   sum), smoothstepped, in addition to today's; a boss's steady hover is not counted, so its resting shadow is exactly what it was. A spread of up to 16 percent when the figure
 *   comes down, decaying over about 70 ms of field time (so a hit-stop holds it, and 60 and 144 Hz agree), a little thinner while it spreads.
 *
 * Every number is `[ours]`. Pure: no `three`, no DOM.
 */

/** The lift, as a fraction of the figure's height, at which the shadow has shrunk and faded all the way. */
export const AIR_REF = 0.3;
/** The share of its radius the shadow loses at full lift. */
export const AIR_SHRINK = 0.35;
/** The share of its opacity the shadow loses at full lift. */
export const AIR_FADE = 0.45;
/** The landing spread, as a fraction of the radius, for a full-height landing (a small hop lands with a quarter of it at least). */
export const LAND_SPREAD = 0.16;
/** The spread decays by this time constant, seconds of field time. */
export const LAND_TAU = 0.07;
/** Under this fraction of the figure's height the figure counts as on the ground. */
export const GROUND_EPS = 0.012;

/** The shadow's x for an actor offset of `ox` (of which `lieDx` is a lying body's swing about its feet). */
export function shadowX(ox: number, lieDx: number, follow: boolean): number {
  return follow ? ox - 0.45 * lieDx : ox * 0.55;
}

/** Multipliers on the shadow's radius and opacity (1, 1 at rest). */
export interface ShadowMul {
  radius: number;
  opacity: number;
}

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

export class ShadowFollow {
  private prev = 0;
  private peak = 0;
  private spread = 0;

  /**
   * One frame. `dt` is field seconds, `lift` the figure's height off the ground in world units (0 on the ground), `height` its world height.
   * The landing is the frame the lift falls back under {@link GROUND_EPS} of the height after being above it.
   */
  step(dt: number, lift: number, height: number): ShadowMul {
    const h = Math.max(0.001, height);
    const eps = GROUND_EPS * h;
    const ref = AIR_REF * h;
    const up = lift > 0 ? lift : 0;
    if (dt > 0) this.spread *= Math.exp(-dt / LAND_TAU);
    if (up > eps) {
      if (up > this.peak) this.peak = up;
    } else if (this.prev > eps) {
      this.spread = Math.max(this.spread, LAND_SPREAD * Math.min(1, Math.max(0.25, this.peak / ref)));
      this.peak = 0;
    }
    this.prev = up;
    if (this.spread < 1e-4) this.spread = 0;
    const k = clamp01(up / ref);
    const air = k * k * (3 - 2 * k);
    return {
      radius: (1 - AIR_SHRINK * air) * (1 + this.spread),
      opacity: (1 - AIR_FADE * air) * (1 - 0.4 * (this.spread / LAND_SPREAD)), // a little thinner while it spreads
    };
  }

  reset(): void {
    this.prev = 0;
    this.peak = 0;
    this.spread = 0;
  }
}
