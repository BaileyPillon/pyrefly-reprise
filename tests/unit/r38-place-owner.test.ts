/**
 * r38-motion repair: who owns a figure's place on the floor (`motion/PlaceOwner.ts`) and what the MAX mix's staging does about it.
 *
 * RUN-IN moves a girl along the floor with `moveTo` (absolute positions) and brings her home; the staging keeps a share of x in the
 * same `position.x` and reads any x it did not write as the stage re-seating her. The hand-over is explicit (`ownPlace`), so the
 * staging never has to guess, and it holds for the staging as it is today and for r38-restage's slots, which read an x-only
 * move as a formation nudge and a move with z as a re-seat (their `Staging.write`, copied verbatim below). `r38-run-in-staging.test.ts`
 * plays the whole run against the real classes; this file pins the contract.
 */
import { describe, expect, it } from 'vitest';
import { Object3D, Vector3 } from 'three';
import type { Actor } from '../../src/engine/fx/mix/geometry.ts';
import { Staging } from '../../src/engine/fx/mix/staging.ts';
import { ownPlace, placeOwned } from '../../src/engine/motion/PlaceOwner.ts';

const figure = (name: string, facing: number, x: number, z = 0): Actor => {
  const a = new Object3D() as unknown as Actor;
  a.name = name;
  (a as unknown as { facing: number }).facing = facing;
  a.position.set(x, 0, z);
  return a;
};

describe('PlaceOwner', () => {
  it('owns a figure until it is given back, per object, and keeps nothing else', () => {
    const a = {};
    const b = {};
    expect(placeOwned(a)).toBe(false);
    ownPlace(a, true);
    expect(placeOwned(a)).toBe(true);
    expect(placeOwned(b)).toBe(false);
    ownPlace(a, true); // asking twice is one ownership
    ownPlace(a, false);
    expect(placeOwned(a)).toBe(false);
    ownPlace(b, false); // giving back what was never taken is nothing
    expect(placeOwned(b)).toBe(false);
  });
});

describe('Staging and a figure that is out on a run', () => {
  it('still reads a foreign x as the stage re-seating the figure (an arrival): the share goes on top of the new seat', () => {
    const st = new Staging();
    const g = figure('paine', 1, -1);
    st.plan.set(g, { k: 1, dx: 0.3 });
    st.apply([g], true);
    expect(g.position.x).toBeCloseTo(-0.7, 9);
    g.position.x = 2; // the stage moved her
    st.apply([g], true);
    expect(g.position.x).toBeCloseTo(2.3, 9);
    st.apply([g], true);
    expect(g.position.x).toBeCloseTo(2.3, 9);
  });

  it('leaves an owned figure alone, whatever the owner does to it, and the plan reaches it again when it is given back', () => {
    const st = new Staging();
    const g = figure('rikku', 1, -1.4);
    st.plan.set(g, { k: 1.2, dx: -0.07 });
    st.apply([g], true);
    const home = g.position.x;
    const scale = g.scale.y;
    expect(home).toBeCloseTo(-1.47, 9);
    ownPlace(g, true);
    for (const x of [-1.2, 0.4, 1.9, 1.9, 0.2]) {
      g.position.x = x;
      st.apply([g], true);
      expect(g.position.x).toBe(x); // nothing added, nothing taken
      expect(g.scale.y).toBe(scale);
    }
    g.position.x = home; // the run home ends where it began
    ownPlace(g, false);
    st.apply([g], true);
    expect(g.position.x).toBeCloseTo(home, 9); // the share was not added a second time
    st.apply([g], true);
    expect(g.position.x).toBeCloseTo(home, 9);
  });

  it('keeps an owned figure\'s record through `release`, so a re-plan that lands while she is out puts the new share on once', () => {
    const st = new Staging();
    const g = figure('rikku', 1, -1.4);
    const other = figure('yuna', 1, -2);
    st.plan.set(g, { k: 1, dx: -0.07 });
    st.plan.set(other, { k: 1, dx: -0.17 });
    st.apply([g, other], true);
    const home = g.position.x;
    ownPlace(g, true);
    g.position.x = 3; // out at the foe
    st.release(); // the framing commits a new plan: everyone else goes back to the seat the stage left them in
    expect(g.position.x).toBe(3);
    expect(other.position.x).toBeCloseTo(-2, 9);
    st.plan.set(g, { k: 1, dx: -0.2 });
    st.plan.set(other, { k: 1, dx: -0.1 });
    st.apply([g, other], true);
    expect(g.position.x).toBe(3);
    expect(other.position.x).toBeCloseTo(-2.1, 9);
    g.position.x = home; // home again, with the old share in her position
    ownPlace(g, false);
    st.apply([g, other], true);
    expect(g.position.x).toBeCloseTo(-1.4 - 0.2, 9); // seat plus the NEW share, once
    st.apply([g, other], true);
    expect(g.position.x).toBeCloseTo(-1.6, 9);
  });

  it('puts a figure that was out when the plan was cleared back where the stage left it, once she is home (no plan for her now)', () => {
    const st = new Staging();
    const g = figure('paine', 1, -0.8);
    st.plan.set(g, { k: 1, dx: 0.02 });
    st.apply([g], true);
    ownPlace(g, true);
    g.position.x = 2;
    st.release();
    g.position.x = -0.78;
    ownPlace(g, false);
    st.apply([g], true); // the plan is empty: her record says she carries 0.02 she no longer should
    expect(g.position.x).toBeCloseTo(-0.8, 9);
  });

  it('a figure the plan did not name stays unrecorded while she runs, and a plan that arrives meanwhile reaches her once, at home', () => {
    const st = new Staging();
    const g = figure('paine', 1, -0.8);
    st.apply([g], true); // nothing planned: no record
    ownPlace(g, true);
    g.position.x = 2;
    st.plan.set(g, { k: 1, dx: 0.5 });
    st.apply([g], true);
    expect(g.position.x).toBe(2);
    g.position.x = -0.8;
    ownPlace(g, false);
    st.apply([g], true);
    expect(g.position.x).toBeCloseTo(-0.3, 9);
    st.apply([g], true);
    expect(g.position.x).toBeCloseTo(-0.3, 9);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------
// r38-restage's slots. This is `Staging` as origin/r38-restage (24181cb1) has it, its `apply`, `write` and `release` copied verbatim
// (the planners and `stats` left out), plus the one line this repair adds to `apply` and the three to `release`: the lanes are
// compatible when the same hand-over keeps a run out of the formation rule. When r38-restage lands, drop this copy and give the real
// `Staging` a `side` (`st.side = { party, enemy, boss: null }`) in the run-in test.

interface Shift {
  dx: number;
  dz: number;
}
interface Slots {
  party: Shift;
  enemy: Shift;
}
interface Rec {
  k: number;
  wroteK: number;
  dx: number;
  sx: number;
  sz: number;
  wroteX: number;
  wroteZ: number;
}

class RestageStaging {
  private readonly recs = new Map<Actor, Rec>();
  readonly plan = new Map<Actor, { k: number; dx: number }>();
  side: Slots | null = null;

  constructor(private readonly honourHold: boolean) {}

  apply(actors: readonly Actor[], on: boolean): void {
    const side = on ? this.side : null;
    for (const a of actors) {
      if (this.honourHold && placeOwned(a)) continue; // this repair
      const p = this.plan.get(a);
      const s = side ? (a.facing >= 0 ? side.party : side.enemy) : null;
      this.write(a, on ? (p?.k ?? 1) : 1, on ? (p?.dx ?? 0) : 0, s);
    }
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
    if (Math.abs(a.scale.y - r.wroteK) > 1e-6) r.k = 1;
    const movedX = Math.abs(a.position.x - r.wroteX) > 1e-6;
    const movedZ = Math.abs(a.position.z - r.wroteZ) > 1e-6;
    if (movedZ) r.sz = 0;
    if (movedX && (movedZ || (r.sx === 0 && r.sz === 0))) {
      r.dx = 0;
      r.sx = 0;
    }
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

  release(): void {
    for (const a of [...this.recs.keys()]) {
      if (this.honourHold && placeOwned(a)) continue; // this repair
      this.write(a, 1, 0, null);
      this.recs.delete(a);
    }
    this.plan.clear();
  }
}

describe('with r38-restage\'s formation rule (an x-only move is a nudge, a move with z is a re-seat)', () => {
  const SLOTS: Slots = { party: { dx: -0.5, dz: 0.2 }, enemy: { dx: 0.5, dz: -0.3 } };

  /** A girl out along the floor to `spot` and back, written the way `moveTo` writes (absolute), the mix applying every frame. */
  function excursion(st: RestageStaging, all: Actor[], g: Actor, spot: Vector3, owned: boolean): void {
    const home = g.position.clone();
    if (owned) ownPlace(g, true);
    const frames = 18;
    for (let i = 1; i <= frames; i++) {
      g.position.lerpVectors(home, spot, i / frames);
      st.apply(all, true);
    }
    for (let i = 1; i <= frames; i++) {
      g.position.lerpVectors(spot, home, i / frames);
      st.apply(all, true);
    }
    if (owned) ownPlace(g, false);
    for (let i = 0; i < 5; i++) st.apply(all, true);
  }

  function staged(hold: boolean): { st: RestageStaging; all: Actor[]; girl: Actor; rest: Vector3 } {
    const girl = figure('rikku', 1, -1.4, 0.1);
    const others = [figure('paine', 1, -0.8, -1.5), figure('yuna', 1, -2.2, 1.45), figure('boss', -1, 1.6, -5.8)];
    const all = [girl, ...others];
    const st = new RestageStaging(hold);
    st.side = SLOTS;
    st.plan.set(girl, { k: 1, dx: -0.07 });
    st.plan.set(others[0]!, { k: 1, dx: 0.02 });
    st.apply(all, true);
    return { st, all, girl, rest: girl.position.clone() };
  }

  const SPOTS: Record<string, (rest: Vector3) => Vector3> = {
    'a stop on her own lane (z unchanged)': (rest) => new Vector3(2, 0, rest.z),
    'a stop deeper in the field (z changes)': () => new Vector3(2.4, 0, -2.2),
  };

  it('an owned run along her own lane and an owned run that changes depth both leave her place alone, 30 times over', () => {
    for (const [name, spotOf] of Object.entries(SPOTS)) {
      const { st, all, girl, rest } = staged(true);
      for (let n = 0; n < 30; n++) {
        excursion(st, all, girl, spotOf(rest), true);
        expect(girl.position.distanceTo(rest), `${name}, run ${n}`).toBeLessThan(1e-9);
      }
    }
  });

  it('control: without the hand-over a run that changes depth is read as a re-seat and walks her by the slots\' share each time', () => {
    const { st, all, girl, rest } = staged(false);
    excursion(st, all, girl, new Vector3(2.4, 0, -2.2), false);
    expect(girl.position.distanceTo(rest)).toBeGreaterThan(0.3); // the share of x and of z, put on again
    const once = girl.position.clone();
    excursion(st, all, girl, new Vector3(2.4, 0, -2.2), false);
    expect(girl.position.distanceTo(once)).toBeGreaterThan(0.3); // and again
  });

  it('control: with no slots at all (Chapter IV) the same rule reads even an x-only run as a re-seat: the bug this repair fixes', () => {
    const girl = figure('rikku', 1, -1.4, 0.1);
    const all = [girl, figure('paine', 1, -0.8, -1.5)];
    const st = new RestageStaging(false);
    st.plan.set(girl, { k: 1, dx: -0.07 });
    st.apply(all, true);
    const rest = girl.position.x;
    excursion(st, all, girl, new Vector3(2, 0, girl.position.z), false);
    expect(girl.position.x - rest).toBeCloseTo(-0.07, 6);
    const held = new RestageStaging(true);
    const g2 = figure('rikku', 1, -1.4, 0.1);
    const all2 = [g2, figure('paine', 1, -0.8, -1.5)];
    held.plan.set(g2, { k: 1, dx: -0.07 });
    held.apply(all2, true);
    const rest2 = g2.position.x;
    for (let n = 0; n < 30; n++) excursion(held, all2, g2, new Vector3(2, 0, g2.position.z), true);
    expect(g2.position.x).toBeCloseTo(rest2, 9);
  });
});
