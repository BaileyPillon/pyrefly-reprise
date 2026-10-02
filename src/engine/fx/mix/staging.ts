import type { Vector3 } from 'three';
import { figOf, subjectId, type Actor } from './geometry.ts';
import { MULTIPART } from './masters.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's static staging, written onto the figures and held for the
 * rest of the fight (ported from option C's prototype, `fx/max/c/staging.ts`). Presentation only (rule
 * 1): a figure's group scale and x offset, never the engine's state. Each write is tracked, so a re-seat
 * by the stage (a formation relax, an arrival) is respected and the mix's share is put back on top of it.
 *
 * - BOSS SCALE (VP-1001-13, -43): a colossus grown about its feet so its on-screen height reaches the
 *   class target against the party's mean. Multi-part machines keep their drawn scale.
 * - SPACING (VP-1001-44, PR-0002): the party spread about its leftmost member so nobody hides another
 *   (the judges' Evrae finding: Tidus in front of Wakka).
 *
 * Game case: both; the spread's limits are per game (FFX-2's looser spread, perspectives B.1).
 */

interface Rec {
  k: number;
  wroteK: number;
  dx: number;
  wroteX: number;
}

export class Staging {
  private readonly recs = new Map<Actor, Rec>();
  readonly plan = new Map<Actor, { k: number; dx: number }>();

  /**
   * Plan the scale per boss against the party's mean, seen from `camPos`. Colossi only ever grow;
   * `frac` takes a share of the growth (1 = the class target, 0 = the drawn scale).
   */
  planScale(actors: readonly Actor[], camPos: Vector3, target: (id: string) => number | null, frac = 1): void {
    const party = actors.filter((a) => a.facing >= 0);
    if (!party.length) return;
    const persp = (a: Actor): number => {
      const f = figOf(a);
      return f.h / Math.abs(a.scale.y || 1) / Math.max(0.5, f.feet.distanceTo(camPos));
    };
    const pMean = party.reduce((s, a) => s + persp(a), 0) / party.length;
    for (const a of actors) {
      if (a.facing >= 0) continue;
      const id = subjectId(a);
      const t = target(id);
      if (t === null || MULTIPART.test(id)) continue;
      const ratio = persp(a) / pMean;
      const k = 1 + (Math.min(2.6, Math.max(1, t / Math.max(0.05, ratio))) - 1) * frac;
      if (Math.abs(k - 1) < 0.04) continue;
      const p = this.plan.get(a) ?? { k: 1, dx: 0 };
      p.k = k;
      this.plan.set(a, p);
    }
  }

  /** Plan the party's spread about its leftmost member (world x). */
  planSpread(actors: readonly Actor[], spread: number): void {
    const party = actors.filter((a) => a.facing >= 0);
    if (party.length < 2) return;
    const xs = party.map((a) => a.position.x - (this.recs.get(a)?.dx ?? 0));
    const x0 = Math.min(...xs);
    party.forEach((a, i) => {
      const p = this.plan.get(a) ?? { k: 1, dx: 0 };
      p.dx = (xs[i]! - x0) * (spread - 1);
      this.plan.set(a, p);
    });
  }

  clearPlan(): void {
    this.plan.clear();
  }

  /** Every frame: write the plan (or nothing, for figures it does not name). */
  apply(actors: readonly Actor[], on: boolean): void {
    for (const a of actors) {
      const p = this.plan.get(a);
      this.write(a, on ? (p?.k ?? 1) : 1, on ? (p?.dx ?? 0) : 0);
    }
  }

  /** BOSS SCALE's factor on a figure now (1 = drawn scale). */
  kOf(a: Actor): number {
    return this.recs.get(a)?.k ?? 1;
  }

  private write(a: Actor, k: number, dx: number): void {
    let r = this.recs.get(a);
    if (!r) {
      if (k === 1 && dx === 0) return;
      r = { k: 1, wroteK: a.scale.y, dx: 0, wroteX: a.position.x };
      this.recs.set(a, r);
    }
    // The stage moved or re-scaled it: start from its value.
    if (Math.abs(a.scale.y - r.wroteK) > 1e-6) r.k = 1;
    if (Math.abs(a.position.x - r.wroteX) > 1e-6) r.dx = 0;
    const baseK = a.scale.y / r.k;
    const baseX = a.position.x - r.dx;
    a.scale.set((a.scale.x / r.k) * k, baseK * k, (a.scale.z / r.k) * k);
    a.position.x = baseX + dx;
    r.k = k;
    r.dx = dx;
    r.wroteK = a.scale.y;
    r.wroteX = a.position.x;
  }

  /** Put every figure back as the stage left it. */
  release(): void {
    for (const a of this.recs.keys()) this.write(a, 1, 0);
    this.recs.clear();
    this.plan.clear();
  }

  stats(): Record<string, { k: number; dx: number }> {
    const out: Record<string, { k: number; dx: number }> = {};
    for (const [a, p] of this.plan) out[subjectId(a)] = { k: Math.round(p.k * 100) / 100, dx: Math.round(p.dx * 100) / 100 };
    return out;
  }
}
