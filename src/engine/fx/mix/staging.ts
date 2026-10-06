import type { Vector3 } from 'three';
import { STAGE_HOLD_KEY } from '../../StageRelax.ts';
import { placeOwned } from '../../motion/PlaceOwner.ts';
import { figOf, subjectId, type Actor } from './geometry.ts';
import { MULTIPART } from './masters.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's static staging, written onto the figures and held for the
 * rest of the fight (ported from option C's prototype, `fx/max/c/staging.ts`). Presentation only (rule
 * 1): a figure's group scale and x offset, never the engine's state. Each write is tracked, so a re-seat
 * by the stage (an arrival, a spot) is respected and the mix's share is put back on top of it.
 * A figure that is out on a run of its own (`motion/PlaceOwner.ts`, RUN-IN) is no re-seat: it is left alone, record
 * and all, until it is home (r38-motion repair; before it, every run added the share to the girl's home once more).
 *
 * - BOSS SCALE (VP-1001-13, -43): a colossus grown about its feet so its on-screen height reaches the
 *   class target against the party's mean. Multi-part machines keep their drawn scale.
 * - SPACING (VP-1001-44, PR-0002): the party spread about its leftmost member so nobody hides another
 *   (the judges' Evrae finding: Tidus in front of Wakka).
 * - THE CHAPTER'S SLOTS (`stageTable.ts`, PR-0310): one move on the floor for every figure of the party, one for every
 *   fiend (and one of its own for a fiend or a party member a row names, `enemyBy` and `partyBy`), held per SIDE (a figure that arrives later, an aeon or a second
 *   fiend, stands in the same formation). A fiend that carries a slot is HELD against the stage's formation relaxation
 *   (`StageRelax.ts`, {@link STAGE_HOLD_KEY}): the table's formation is the formation that plays, whatever the camera and the
 *   HUD do in the battle's first seconds (r38-restage repair: the relaxation re-spread it to the camera of the moment).
 *
 * Game case: both; the spread's limits are per game (FFX-2's looser spread, perspectives B.1); the slots are FFX only.
 */

interface Rec {
  k: number;
  wroteK: number;
  /** The plan's x offset. */
  dx: number;
  /** The chapter's slots: the figure's x and z offset. */
  sx: number;
  sz: number;
  wroteX: number;
  wroteZ: number;
}

/** A move on the floor: world x and z added to a figure's place. */
export interface Shift {
  dx: number;
  dz: number;
}

/** The chapter's slots: one move for the party, one for the fiends, and a move of its own for a fiend a row names. */
export interface Side {
  party: Shift;
  enemy: Shift;
  /** A move of its own for the fiends whose painted id matches (the first match wins); every other fiend takes `enemy`. */
  enemyBy?: readonly { id: RegExp; shift: Shift }[];
  /**
   * A move of its own for the party members whose combatant id or painted id matches (the first match wins); every other member takes `party`.
   * A row that spreads a heap (Chapter XII's: three figures inside one figure-width) moves each member by his own step, as a row moves a fiend by
   * `enemyBy`; the whole side's `party` is what a member with no step of his own takes.
   */
  partyBy?: readonly { id: RegExp; shift: Shift }[];
  /** They hold while a fiend with one of these painted ids stands on the stage (the chapter's boss); null: whatever is on it. */
  boss: RegExp | null;
}

/** The move a side gives this figure. */
export function shiftOf(side: Side, a: Actor): Shift {
  if (a.facing >= 0) {
    if (side.partyBy?.length) {
      const id = subjectId(a);
      for (const p of side.partyBy) if (p.id.test(a.name) || p.id.test(id)) return p.shift;
    }
    return side.party;
  }
  if (side.enemyBy?.length) {
    // The combatant's own id first (the two Yu Pagodas paint the same art, `yu-pagoda`, and stand as `yu-pagoda-left` and `-right`), then the painted one.
    const id = subjectId(a);
    for (const e of side.enemyBy) if (e.id.test(a.name) || e.id.test(id)) return e.shift;
  }
  return side.enemy;
}

export class Staging {
  private readonly recs = new Map<Actor, Rec>();
  readonly plan = new Map<Actor, { k: number; dx: number }>();
  /** The chapter's slots (`stageTable.ts`), added on top of the plan; null = the stage's own. Survives `release`, which only puts figures back. */
  side: Side | null = null;
  /** The fiends held against the formation relaxation. */
  private readonly held = new Set<Actor>();

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
    const xs = party.map((a) => a.position.x - (this.recs.get(a)?.dx ?? 0) - (this.recs.get(a)?.sx ?? 0));
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

  /**
   * Hold every fiend of the fight against the stage's formation relaxation (`on`), or let them go. Called every frame while the
   * chapter has a row, from the first frame its figures are seen: the relaxation is a live solver (the camera, the HUD's panels
   * as they appear) and would otherwise re-spread the table's formation to whatever the first seconds were doing.
   */
  hold(actors: readonly Actor[], on: boolean): void {
    if (!on && !this.held.size) return;
    const want = new Set(on ? actors.filter((a) => a.facing < 0) : []);
    for (const a of this.held) {
      if (want.has(a)) continue;
      delete a.userData[STAGE_HOLD_KEY];
      this.held.delete(a);
    }
    for (const a of want) {
      if (this.held.has(a)) continue;
      a.userData[STAGE_HOLD_KEY] = true;
      this.held.add(a);
    }
  }

  /** Every frame: write the plan (or nothing, for figures it does not name). */
  apply(actors: readonly Actor[], on: boolean): void {
    // The slots belong to the chapter's boss: once the next link's fiends are on the stage (Chapter III's possessed aeons) they let go.
    const side = on && this.side && (!this.side.boss || actors.some((a) => a.facing < 0 && this.side!.boss!.test(subjectId(a)))) ? this.side : null;
    for (const a of actors) {
      if (placeOwned(a)) continue; // out on a run: its x is hers (not a re-seat to read back), and the plan reaches it again when she is home
      const p = this.plan.get(a);
      const shift = side ? shiftOf(side, a) : null;
      this.write(a, on ? (p?.k ?? 1) : 1, on ? (p?.dx ?? 0) : 0, shift);
    }
  }

  /** BOSS SCALE's factor on a figure now (1 = drawn scale). */
  kOf(a: Actor): number {
    return this.recs.get(a)?.k ?? 1;
  }

  private write(a: Actor, k: number, dx: number, side: Shift | null): void {
    const sx = side?.dx ?? 0;
    const sz = side?.dz ?? 0;
    let r = this.recs.get(a);
    if (!r) {
      if (k === 1 && dx === 0 && sx === 0 && sz === 0) return;
      r = { k: 1, wroteK: a.scale.y, dx: 0, sx: 0, sz: 0, wroteX: a.position.x, wroteZ: a.position.z };
      this.recs.set(a, r);
    }
    // The stage moved or re-scaled it: start from its value.
    if (Math.abs(a.scale.y - r.wroteK) > 1e-6) r.k = 1;
    // Any write to an axis that is not ours is the stage's (a spot, `add`) or a tween's, in the stage's own coordinates (an arrival slides to the
    // stage's slot, x alone): the axis carries none of our share, and the share goes on top of it again. Nothing nudges a figure by a step from
    // where it stands but the formation relaxation, which never moves a party member in the scenes that hold their party (`holdParty`, Chapters I to
    // III) and is held off every fiend of a table fight (`hold`). Reading an x-only write as such a nudge kept the figure where a tween left it, in
    // the stage's slot without ours (r38-restage CHECK, B2).
    if (Math.abs(a.position.x - r.wroteX) > 1e-6) {
      r.dx = 0;
      r.sx = 0;
    }
    if (Math.abs(a.position.z - r.wroteZ) > 1e-6) r.sz = 0;
    const baseK = a.scale.y / r.k;
    const baseX = a.position.x - r.dx - r.sx;
    const baseZ = a.position.z - r.sz;
    a.scale.set((a.scale.x / r.k) * k, baseK * k, (a.scale.z / r.k) * k);
    a.position.x = baseX + dx + sx;
    a.position.z = baseZ + sz;
    r.k = k;
    r.dx = dx;
    r.sx = sx;
    r.sz = sz;
    r.wroteK = a.scale.y;
    r.wroteX = a.position.x;
    r.wroteZ = a.position.z;
  }

  /** Put every figure back as the stage left it. */
  release(): void {
    for (const a of [...this.recs.keys()]) {
      // Out on a run: her position holds none of the share now, and she returns to the place that does. Keep the record, so the
      // next write takes the old share off and puts the new plan's on, once.
      if (placeOwned(a)) continue;
      this.write(a, 1, 0, null);
      this.recs.delete(a);
    }
    this.plan.clear();
  }

  stats(): Record<string, { k: number; dx: number; sx?: number; sz?: number }> {
    const out: Record<string, { k: number; dx: number; sx?: number; sz?: number }> = {};
    for (const [a, p] of this.plan) out[subjectId(a)] = { k: Math.round(p.k * 100) / 100, dx: Math.round(p.dx * 100) / 100 };
    for (const a of this.recs.keys()) {
      const s = this.side ? shiftOf(this.side, a) : null;
      if (!s) continue;
      // The two Yu Pagodas paint one art: the second keeps its combatant id so both show.
      const id = subjectId(a);
      const key = out[id]?.sx !== undefined ? a.name : id;
      out[key] = { ...(out[key] ?? { k: 1, dx: 0 }), sx: Math.round(s.dx * 100) / 100, sz: Math.round(s.dz * 100) / 100 };
    }
    return out;
  }
}
