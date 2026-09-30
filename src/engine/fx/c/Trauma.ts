/**
 * Option C4: the trauma model of camera shake (eye-candy options round, 2026-09-29).
 *
 * Blows add trauma (0..1); it decays linearly per second; the offset is
 * `max * trauma^2 * noise(t * hz)`, so small knocks barely move the frame and a crit or an
 * Overdrive's last blow throws it. Plus a quick dolly kick. The hit-stop does not stop it: the
 * frame shakes while the figures hold, which is what sells the weight.
 *
 * Pure: no DOM and no `three`. Game case: both (per-game numbers in `SpectacleRules.ts`).
 */

export interface TraumaParams {
  max: number;
  rollMaxDeg: number;
  hz: number;
  decay: number;
}

/** Smooth 1D value noise in -1..1 (cosine-interpolated hash lattice). */
export function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number): number => {
    const s = Math.sin((n + seed * 57.13) * 127.1) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  const u = (1 - Math.cos(f * Math.PI)) * 0.5;
  return h(i) * (1 - u) + h(i + 1) * u;
}

export class Trauma {
  amount = 0;
  private t = 0;
  private kickAmt = 0;
  private kickAge = 1e9;
  private readonly kickIn = 0.09;
  private readonly kickOut = 0.38;

  constructor(public params: TraumaParams) {}

  add(v: number): void {
    this.amount = Math.min(1, this.amount + Math.max(0, v));
  }

  /** A dolly kick toward the subject: in over 90 ms, back over 380 ms. */
  kick(fraction: number): void {
    if (fraction <= 0) return;
    this.kickAmt = Math.max(fraction, this.kickAmt * this.kickEnvelope());
    this.kickAge = 0;
  }

  private kickEnvelope(): number {
    const a = this.kickAge;
    if (a < this.kickIn) return a / this.kickIn;
    const b = (a - this.kickIn) / this.kickOut;
    return b >= 1 ? 0 : 1 - b * b * (3 - 2 * b);
  }

  update(dt: number): void {
    this.t += dt;
    this.kickAge += dt;
    this.amount = Math.max(0, this.amount - this.params.decay * dt);
  }

  get active(): boolean {
    return this.amount > 0.001 || this.kickEnvelope() > 0.001;
  }

  reset(): void {
    this.amount = 0;
    this.kickAge = 1e9;
  }

  /** The offset right now: x / y in world units along the camera's right / up, roll in radians, dolly fraction. */
  offset(): { x: number; y: number; roll: number; dolly: number } {
    const s = this.amount * this.amount;
    const p = this.params;
    const x = p.max * s * noise1(this.t * p.hz, 1);
    const y = p.max * s * 0.8 * noise1(this.t * p.hz, 2);
    const roll = ((p.rollMaxDeg * Math.PI) / 180) * s * noise1(this.t * p.hz * 0.7, 3);
    return { x, y, roll, dolly: this.kickAmt * this.kickEnvelope() };
  }
}

/**
 * C2: the hit-stop clock. `freeze(ms)` holds the presentation's dt at 0 for that long of real
 * time; a second freeze while one runs takes the longer remainder. The engine never sees it.
 */
export class HitStop {
  private leftMs = 0;
  /** Frames held, for the snapshot. */
  held = 0;

  freeze(ms: number): void {
    this.leftMs = Math.max(this.leftMs, Math.max(0, ms));
  }

  get frozen(): boolean {
    return this.leftMs > 0;
  }

  /** The dt the stage should see this frame, given the real dt in seconds. */
  scale(dt: number): number {
    if (this.leftMs <= 0) return dt;
    const ms = dt * 1000;
    if (ms <= this.leftMs) {
      this.leftMs -= ms;
      this.held++;
      return 0;
    }
    const rest = (ms - this.leftMs) / 1000;
    this.leftMs = 0;
    return rest;
  }

  clear(): void {
    this.leftMs = 0;
  }
}
