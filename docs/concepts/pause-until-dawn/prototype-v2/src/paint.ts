/**
 * Which painted key shows, decided apart from the geometry (v3.2).
 *
 * v3.1 cross-faded the paint of the two bracket keys by the RENDERED yaw
 * (`paintWeight(t)`), so a gaze held near a bracket's middle left two
 * different paintings 10-90 percent mixed for most of the time, and the idle
 * sway swept the mix from 0 to 1 every few seconds (measured by the check:
 * 78 percent of the time at targets of 20-25 degrees; the portrait "pulsed"
 * between the frontal plate and the turn key).
 *
 * Now the geometry still follows the rendered yaw continuously (the mesh
 * warp), but the PAINT is one key at a time: the key nearest the head's
 * BASE yaw (the spring alone, no idle sway), with hysteresis around the
 * swap point so a held gaze never flickers, and a short temporal dissolve
 * (both keys warped onto the same landmarks) when it does change. A held
 * pose is therefore always exactly one painting; two show only for
 * `dissolveS` after a real change of pose.
 *
 * Pure (no DOM, no GL): driven and asserted on directly.
 */
export interface PaintKey {
  id: string;
  yawDeg: number;
}

export interface PaintState {
  /** The key being dissolved to (or the settled key). */
  to: string;
  /** The key being dissolved from; null when settled. */
  from: string | null;
  /** Weight of `to` in the mix, 0..1 (1 when settled). */
  w: number;
}

export const PAINT_HYSTERESIS_DEG = 6;
export const PAINT_DISSOLVE_S = 0.2;
/** A dissolve is also complete once the head has turned this far past the swap point (a fast turn: 2-3 frames). */
export const PAINT_DISSOLVE_DEG = 8;

/**
 * v4.1 'warp': the same one-painting-at-a-time rule for the feature-registered
 * keys (`warp/dense.ts`). v4 mixed the two bracket keys by the RENDERED yaw
 * over an 8-degree window, so the idle sway swept a held gaze in and out of
 * the mix (the check: two paintings in 40 of 40 samples at -30, -50, -72, +30,
 * +50, +72; the v3.1 pulse again). Now the paint follows the spring's base yaw
 * with hysteresis; with the keys registered feature by feature, the swap can
 * be quick: 0.2 s, or 5 degrees of a fast turn.
 */
export const WARP_PAINT = { hysteresisDeg: 3, dissolveS: 0.2, dissolveDeg: 5 } as const;

function smoothstep(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

export class PaintSelector {
  private readonly keys: PaintKey[];
  private current: PaintKey;
  private from: PaintKey | null = null;
  private progress = 1;
  /** Base yaw when the current dissolve began: the dissolve also completes by the time the head reaches the new key. */
  private swapYaw = 0;

  constructor(
    keys: readonly PaintKey[],
    private readonly hysteresisDeg = PAINT_HYSTERESIS_DEG,
    private readonly dissolveS = PAINT_DISSOLVE_S,
    private readonly dissolveDeg = PAINT_DISSOLVE_DEG,
  ) {
    if (keys.length === 0) throw new Error('PaintSelector needs at least one key');
    this.keys = [...keys].sort((a, b) => a.yawDeg - b.yawDeg);
    this.current = this.keys.reduce((best, k) => (Math.abs(k.yawDeg) < Math.abs(best.yawDeg) ? k : best));
  }

  /** The key nearest `yawDeg`, keeping the current one unless another is nearer by more than the hysteresis. */
  private choose(yawDeg: number): PaintKey {
    let best = this.current;
    let bestD = Math.abs(yawDeg - this.current.yawDeg);
    for (const k of this.keys) {
      const d = Math.abs(yawDeg - k.yawDeg);
      if (k !== this.current && d + this.hysteresisDeg < bestD) {
        best = k;
        bestD = d + this.hysteresisDeg;
      }
    }
    return best;
  }

  /** Advance by `dt` seconds with the head's base (sway-free) yaw. */
  update(baseYawDeg: number, dt: number): PaintState {
    const next = this.choose(baseYawDeg);
    if (next !== this.current) {
      this.swapYaw = baseYawDeg;
      if (this.from === next && this.progress < 1) {
        // turning back mid-dissolve: run the same dissolve in reverse, no pop
        this.from = this.current;
        this.progress = 1 - this.progress;
      } else {
        this.from = this.current;
        this.progress = 0;
      }
      this.current = next;
    }
    if (this.progress < 1) {
      // time-based for a held or slow pose; during a fast turn it keeps pace
      // with the head, so the old painting is gone when the head reaches the
      // new key (it can no longer be warped once the geometry leaves the
      // bracket the two share)
      const toward = Math.sign(this.current.yawDeg - this.swapYaw) || 1;
      const spatial = Math.max(0, Math.min(1, ((baseYawDeg - this.swapYaw) * toward) / this.dissolveDeg));
      this.progress = Math.min(1, Math.max(this.progress + (this.dissolveS > 0 ? dt / this.dissolveS : 1), spatial));
    }
    if (this.progress >= 1) this.from = null;
    return this.state();
  }

  /** Jump straight to the key for `baseYawDeg` (mount, tests). */
  snap(baseYawDeg: number): PaintState {
    this.current = this.keys.reduce((best, k) => (Math.abs(k.yawDeg - baseYawDeg) < Math.abs(best.yawDeg - baseYawDeg) ? k : best));
    this.from = null;
    this.progress = 1;
    return this.state();
  }

  state(): PaintState {
    return { to: this.current.id, from: this.from ? this.from.id : null, w: this.from ? smoothstep(this.progress) : 1 };
  }
}
