/**
 * Release 38 integration: the real MERGED `Staging` (r38-restage's slots and per-axis write rule, r38-motion's hand-over) driven by plain figures,
 * with the chapter's slots ACTIVE (a `Side`). No shipped fight combines the two (the slots are FFX only, RUN-IN is FFX-2 only), but this is exactly
 * the code the merge of the two lanes conflicted in (`src/engine/fx/mix/staging.ts`: the imports, the header comment, `release()`), so the
 * resolution stays guarded here. It is the re-check's scratch test (`mr-combined.test.ts`, 2026-10-04) moved into the repo; the copy of restage's
 * `Staging` in `r38-place-owner.test.ts` ("when r38-restage lands, drop this copy") is left as it is.
 *
 * The case: FFX only for the slots, FFX-2 only for the run-in, both for the hand-over guard that is shared plumbing and inert in FFX.
 */
import { describe, expect, it } from 'vitest';
import { Object3D, Vector3 } from 'three';
import { Staging, shiftOf, type Side } from '../../src/engine/fx/mix/staging.ts';
import { ownPlace, placeOwned } from '../../src/engine/motion/PlaceOwner.ts';
import type { Actor } from '../../src/engine/fx/mix/geometry.ts';
import { TweenGroup } from '../../src/engine/Tween.ts';

class Fig extends Object3D {
  readonly tweens = new TweenGroup();
  facing: number;
  worldHeight = 1.8;
  constructor(name: string, x: number, z: number, facing = 1) {
    super();
    this.name = name;
    this.facing = facing;
    this.position.set(x, 0, z);
  }
  /** PaintedActor.moveTo's own code: an absolute tween of the group's position. */
  moveTo(to: { x: number; y: number; z: number }, ms = 400): Promise<void> {
    const from = this.position.clone();
    const t = new Vector3(to.x, to.y, to.z);
    return this.tweens.toAsync(0, 1, { durationMs: ms, easing: 'quadInOut', onUpdate: (u) => void this.position.lerpVectors(from, t, u) });
  }
}
const DT = 1 / 60;
const as = (f: Fig): Actor => f as unknown as Actor;
const flush = async (): Promise<void> => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

/** A table side like Chapter II's (party left and nearer, fiends right and further) plus a move of its own for one fiend. */
const SIDE: Side = { party: { dx: -0.1, dz: 0.04 }, enemy: { dx: 0.75, dz: -0.47 }, enemyBy: [{ id: /^pagoda/, shift: { dx: 2, dz: -2.4 } }], boss: null };
const SEATS = { tidus: [-1.0, 1.8], yuna: [0.0, 0.8], auron: [1.2, -0.7], boss: [2.8, -4.4], pagoda: [1.3, -5.1] } as const;

function field(): { fig: Record<string, Fig>; all: Actor[]; st: Staging } {
  const fig: Record<string, Fig> = {
    tidus: new Fig('tidus', SEATS.tidus[0], SEATS.tidus[1]),
    yuna: new Fig('yuna', SEATS.yuna[0], SEATS.yuna[1]),
    auron: new Fig('auron', SEATS.auron[0], SEATS.auron[1]),
    boss: new Fig('boss', SEATS.boss[0], SEATS.boss[1], -1),
    pagoda: new Fig('pagoda', SEATS.pagoda[0], SEATS.pagoda[1], -1),
  };
  const st = new Staging();
  st.side = SIDE;
  return { fig, all: Object.values(fig).map(as), st };
}
const tick = (f: ReturnType<typeof field>, frames: number, extra: Fig[] = []): void => {
  for (let i = 0; i < frames; i++) {
    for (const a of [...Object.values(f.fig), ...extra]) a.tweens.update(DT);
    f.st.apply([...f.all, ...extra.map(as)], true);
  }
};
const frames = async (f: ReturnType<typeof field>, n: number, extra: Fig[] = []): Promise<void> => { for (let i = 0; i < n; i++) { tick(f, 1, extra); await flush(); } };
const seatPlusShare = (id: keyof typeof SEATS, f: ReturnType<typeof field>): [number, number] => {
  const s = shiftOf(SIDE, as(f.fig[id]!));
  return [SEATS[id][0] + s.dx, SEATS[id][1] + s.dz];
};
const snap = async (g: Fig, to: { x: number; y: number; z: number }): Promise<void> => { const p = g.moveTo(to, 1); for (let i = 0; i < 3; i++) g.tweens.update(DT); await p; };
const place = (f: ReturnType<typeof field>): Record<string, [number, number]> => Object.fromEntries(Object.entries(f.fig).map(([k, a]) => [k, [a.position.x, a.position.z]]));

describe('merged Staging: slots active, a figure that runs under its own steam (hand-over)', () => {
  it('control: the slots land once, on every figure, and hold', async () => {
    const f = field();
    await frames(f, 60);
    for (const id of Object.keys(SEATS) as (keyof typeof SEATS)[]) {
      const [x, z] = seatPlusShare(id, f);
      expect(f.fig[id]!.position.x).toBeCloseTo(x, 6);
      expect(f.fig[id]!.position.z).toBeCloseTo(z, 6);
    }
    const before = place(f);
    await frames(f, 600);
    expect(place(f)).toEqual(before);
  });

  for (const [label, dz] of [['her own lane', 0], ['a change of depth', 0.5]] as const) {
    it(`30 runs out and back along ${label} (tween with the stage's absolute x/z): she never walks, nobody else moves`, async () => {
      const f = field();
      await frames(f, 60);
      const home = place(f);
      const girl = f.fig['yuna']!;
      for (let n = 1; n <= 30; n++) {
        const here = { x: girl.position.x, y: 0, z: girl.position.z };
        ownPlace(girl, true);
        const out = girl.moveTo({ x: here.x + 2.2, y: 0, z: here.z - dz }, 300);
        for (let i = 0; i < 40; i++) { tick(f, 1); await flush(); }
        await out;
        tick(f, 6);
        const back = girl.moveTo(here, 240);
        for (let i = 0; i < 30; i++) { tick(f, 1); await flush(); }
        await back;
        ownPlace(girl, false);
        tick(f, 30);
        const now = place(f);
        for (const id of Object.keys(home)) {
          expect(Math.abs(now[id]![0] - home[id]![0]), `run ${n} ${id} x`).toBeLessThan(0.001);
          expect(Math.abs(now[id]![1] - home[id]![1]), `run ${n} ${id} z`).toBeLessThan(0.001);
        }
      }
    });
  }

  it('control without the hand-over and with a change of depth: she DOES walk (the stage reads a z move as a re-seat), so the hand-over is what holds her', async () => {
    const f = field();
    await frames(f, 60);
    const girl = f.fig['yuna']!;
    const x0 = girl.position.x, z0 = girl.position.z;
    for (let n = 1; n <= 10; n++) {
      const here = { x: girl.position.x, y: 0, z: girl.position.z };
      const out = girl.moveTo({ x: here.x + 2.2, y: 0, z: here.z - 0.5 }, 300);
      for (let i = 0; i < 40; i++) { tick(f, 1); await flush(); }
      await out;
      const back = girl.moveTo(here, 240);
      for (let i = 0; i < 30; i++) { tick(f, 1); await flush(); }
      await back;
      tick(f, 30);
    }
    expect(Math.hypot(girl.position.x - x0, girl.position.z - z0)).toBeGreaterThan(0.05);
  });

  it('a figure that arrives while another is out stands on its slot from its first write and never steps; the runner is untouched until she is home', async () => {
    const f = field();
    await frames(f, 60);
    const girl = f.fig['tidus']!;
    const home = { x: girl.position.x, y: 0, z: girl.position.z };
    ownPlace(girl, true);
    const out = girl.moveTo({ x: home.x + 2, y: 0, z: home.z - 0.3 }, 300);
    // Wakka arrives (a Switch): the stage seats him at its own slot, then the mix writes his slot in the next frame.
    const wakka = new Fig('wakka', 0.22, 1.1);
    const xs: number[] = [];
    for (let i = 0; i < 90; i++) {
      if (i === 5) f.all.push(as(wakka));
      f.fig['wakka'] = wakka;
      tick(f, 1);
      if (i >= 5) xs.push(wakka.position.x);
      await flush();
    }
    await out;
    // His first write put the slot on at once: one value, no later step.
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(1e-9);
    expect(xs[0]).toBeCloseTo(0.22 + SIDE.party.dx, 6);
    expect(wakka.position.z).toBeCloseTo(1.1 + SIDE.party.dz, 6);
    ownPlace(girl, false);
    await snap(girl, home);
    tick(f, 30);
    expect(girl.position.x).toBeCloseTo(home.x, 6);
    expect(girl.position.z).toBeCloseTo(home.z, 6);
  });

  it('release(): a figure that is home goes back to the stage\'s own seat (slots and shares off); one that is out keeps its record and gets the share again once, when she is home', async () => {
    const f = field();
    await frames(f, 60);
    f.st.plan.set(as(f.fig['auron']!), { k: 1, dx: 0.3 });
    tick(f, 5);
    const runner = f.fig['yuna']!;
    const home = { x: runner.position.x, y: 0, z: runner.position.z };
    ownPlace(runner, true);
    const out = runner.moveTo({ x: home.x + 2, y: 0, z: home.z }, 300);
    for (let i = 0; i < 10; i++) { tick(f, 1); await flush(); }
    f.st.release(); // CHAPTER FRAMING let go while she is out
    for (const id of ['tidus', 'auron', 'boss', 'pagoda'] as const) {
      expect(f.fig[id]!.position.x, `${id} bare seat x`).toBeCloseTo(SEATS[id][0], 6);
      expect(f.fig[id]!.position.z, `${id} bare seat z`).toBeCloseTo(SEATS[id][1], 6);
    }
    expect(placeOwned(runner)).toBe(true);
    for (let i = 0; i < 40; i++) { tick(f, 1); await flush(); }
    await out;
    await snap(runner, home);
    ownPlace(runner, false);
    // The mix is on again with a new plan: the share goes on her once, from the seat, wherever the run left her record.
    f.st.plan.set(as(runner), { k: 1, dx: -0.2 });
    tick(f, 30);
    const s = SIDE.party;
    expect(runner.position.x).toBeCloseTo(SEATS.yuna[0] + s.dx - 0.2, 6);
    expect(runner.position.z).toBeCloseTo(SEATS.yuna[1] + s.dz, 6);
    tick(f, 300);
    expect(runner.position.x).toBeCloseTo(SEATS.yuna[0] + s.dx - 0.2, 6);
  });
});
