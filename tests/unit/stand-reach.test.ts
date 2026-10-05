import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { ActionMotionPort } from '../../src/engine/BattlePresenterMotion.ts';
import type { Actor } from '../../src/engine/fx/mix/geometry.ts';
import { Staging, type Side } from '../../src/engine/fx/mix/staging.ts';
import { ALL_ROWS, setStageTable, setStandOverride, sideShift, standFor, STAGE_TABLE } from '../../src/engine/fx/mix/stageTable.ts';
import type { Rect, StageMotionPort } from '../../src/engine/motion/StageMotionPort.ts';
import { REACH_CAP, lateralGap, reachAlong, standMove, standMoveOf, type ReachWorld } from '../../src/engine/motion/StandReach.ts';
import { FakeActor, FakeStage, noSleep } from './helpers/FakeStage.ts';

/**
 * The strike follows the stand (r39-looks, FFX only): the house lunge is 1.4 world units, and a staging row that asks for it (`follow`, Chapter III's)
 * has the strike solved on the screen so it leaves the fighter and its target the gap the stage's own seats leave. Everything else registers nothing,
 * reads no box, and lunges 1.4 to the unit.
 */

const figs: object[] = [];
const fig = (): object => {
  const o = {};
  figs.push(o);
  return o;
};
afterEach(() => {
  for (const f of figs.splice(0)) standMove(f, null);
  setStandOverride(null);
});

// ------------------------------------------------------------------ the solver, on a model with perspective (a near fighter, a far boss)

/**
 * A pinhole stand-in: the fighter is near the camera (220 px per world unit, a 311 px box) and the boss far behind it (54 px per unit, a 413 px box), both
 * boxes starting at screen x = 800 + k x. The table moved the fighter 0.35 and the boss 2.612 right.
 */
function model(opts: { dir?: 1 | -1; moved?: boolean; bend?: number } = {}): ReachWorld & { calls: number } {
  const dir = opts.dir ?? 1;
  const moved = opts.moved ?? true;
  const bend = opts.bend ?? 0;
  // world x of each figure's feet: where it stands now, and the stage's seat (the move undone)
  const aNow = dir > 0 ? -1.12 + (moved ? 0.35 : 0) : 5.0;
  const aSeat = dir > 0 ? -1.12 : 2.39;
  const tNow = dir > 0 ? 2.39 + (moved ? 2.612 : 0) : -1.12 + (moved ? 0.35 : 0);
  const tSeat = dir > 0 ? 2.39 : -1.12;
  const w = { calls: 0 } as ReachWorld & { calls: number };
  const box = (x: number, k: number, width: number): Rect => ({ x: 800 + k * x + bend * x * x, y: 300, w: width, h: 400 });
  return Object.assign(w, {
    dir,
    attacker: (along: number, seat: boolean): Rect | null => {
      w.calls++;
      return box((seat ? aSeat : aNow) + dir * along, 220, 311);
    },
    target: (seat: boolean): Rect | null => {
      w.calls++;
      return box(seat ? tSeat : tNow, 54, 413);
    },
  });
}

describe('reachAlong: the lunge that leaves the stage-seat gap, solved on the screen', () => {
  it("is today's lunge when the table moved nothing (the two readings agree)", () => {
    const w = model({ moved: false });
    expect(reachAlong(1.4, w)).toBe(1.4);
  });

  it("carries the fighter until the gap is the one the stage's own seats leave, by the screen and not by the world units of the boss's move", () => {
    const w = model();
    const l = reachAlong(1.4, w);
    // by hand: the seat gap at 1.4 is 929.06 - (800 + 220 * 0.28 + 311) = -243.5; now the gap is 1070 - (800 + 220 * (-0.77 + l) + 311) = 128.4 - 220 l
    expect(l).toBeCloseTo((128.4 + 243.5) / 220, 2);
    expect(l).toBeGreaterThan(1.4);
    expect(l).toBeLessThan(1.4 + 2.262); // far less than the boss's own 2.26: the fighter is near the camera, a unit of lunge is ~4x the pixels
    const a = w.attacker(l, false)!;
    const t = w.target(false)!;
    const seatGap = lateralGap(1, w.attacker(1.4, true)!, w.target(true)!);
    expect(lateralGap(1, a, t)).toBeCloseTo(seatGap, 0);
  });

  it('solves a fiend striking toward the party the same way (it faces -x)', () => {
    const w = model({ dir: -1 });
    const l = reachAlong(1.4, w);
    expect(l).toBeGreaterThan(1.4);
    const seatGap = lateralGap(-1, w.attacker(1.4, true)!, w.target(true)!);
    expect(lateralGap(-1, w.attacker(l, false)!, w.target(false)!)).toBeCloseTo(seatGap, 0);
  });

  it('lands on a bent screen (a camera with yaw) within a pixel', () => {
    const w = model({ bend: 6 });
    const l = reachAlong(1.4, w);
    const seatGap = lateralGap(1, w.attacker(1.4, true)!, w.target(true)!);
    expect(Math.abs(lateralGap(1, w.attacker(l, false)!, w.target(false)!) - seatGap)).toBeLessThan(1);
  });

  it('never goes further than the cap, and never less than the base', () => {
    const far = model();
    // push the boss's own move far enough that the seat gap cannot be met inside the cap
    const huge: ReachWorld = { ...far, target: (seat) => ({ x: seat ? 929 : 5000, y: 300, w: 413, h: 400 }) };
    expect(reachAlong(1.4, huge)).toBeCloseTo(1.4 + REACH_CAP, 6);
    // a strike that already overlaps deeper than the stage's own seat leaves it is not pulled back
    const deep: ReachWorld = { ...far, target: (seat) => ({ x: seat ? 1000 : 700, y: 300, w: 413, h: 400 }) };
    expect(reachAlong(1.4, deep)).toBe(1.4);
  });

  it("leaves today's lunge when a box is unknown or the gap does not close with the lunge", () => {
    const w = model();
    expect(reachAlong(1.4, { ...w, target: () => null })).toBe(1.4);
    expect(reachAlong(1.4, { ...w, attacker: () => null })).toBe(1.4);
    expect(reachAlong(1.4, { ...w, attacker: (_a: number, seat: boolean) => ({ x: seat ? 100 : 900, y: 0, w: 100, h: 100 }) })).toBe(1.4); // the box does not move with the lunge
    expect(reachAlong(1.4, { ...w, target: () => ({ x: Number.NaN, y: 0, w: 100, h: 100 }) })).toBe(1.4); // a box that projects to nothing (behind the camera)
    expect(reachAlong(1.4, { ...w, attacker: (a: number, seat: boolean) => ({ x: seat ? 100 : Number.NaN, y: 0, w: 100, h: 100 + a }) })).toBe(1.4);
  });
});

describe('the registry of what the table moved', () => {
  it('is empty for a figure nobody moved, keeps the move while the table plays and forgets it (null, or a zero move)', () => {
    const a = fig();
    expect(standMoveOf(a)).toBeNull();
    expect(standMoveOf(undefined)).toBeNull();
    standMove(a, { dx: 0.35, dz: 0 });
    expect(standMoveOf(a)).toEqual({ dx: 0.35, dz: 0 });
    standMove(a, null);
    expect(standMoveOf(a)).toBeNull();
    standMove(a, { dx: 0, dz: 0 });
    expect(standMoveOf(a)).toBeNull();
    standMove(a, { dx: Number.NaN, dz: 0 });
    expect(standMoveOf(a)).toBeNull();
  });
});

describe('the table: only Chapter III asks for it', () => {
  beforeAll(() => setStageTable(ALL_ROWS));
  afterAll(() => setStageTable(STAGE_TABLE));

  it("Chapter III's row follows; Chapter II's (a smaller move that leaves every strike landing) does not", () => {
    const iii = ALL_ROWS.find((r) => r.chapter === 'braskas-final-aeon')!;
    const ii = ALL_ROWS.find((r) => r.chapter === 'yunalesca')!;
    expect(iii.follow).toBe(true);
    expect(ii.follow).toBeUndefined();
    expect(standFor('ffx', ['braskas-final-aeon-1', 'yu-pagoda', 'yu-pagoda'], false)!.slots.follow).toBe(true);
    expect(standFor('ffx', ['yunalesca-1'], false)!.slots.follow).toBeUndefined();
  });

  it('is nowhere else: FFX-2, the phone, `?stand=off` and a checks-only move give a table with no follow (or none at all)', () => {
    expect(standFor('ffx2', ['braskas-final-aeon-1'], false)).toBeNull();
    expect(standFor('ffx', ['braskas-final-aeon-1'], true)).toBeNull();
    setStandOverride('off');
    expect(standFor('ffx', ['braskas-final-aeon-1'], false)).toBeNull();
    setStandOverride({ party: { right: 0.1, toward: 0 }, enemy: { right: 2, toward: 0 } });
    expect(standFor('ffx', ['braskas-final-aeon-1'], false)!.slots.follow).toBeUndefined();
  });

  it('the side carries the flag from the row to the staging', () => {
    const pose = { pos: { x: 0, y: 2, z: 10 }, look: { x: 0, y: 2, z: 0 }, fov: 32 } as never;
    const row = ALL_ROWS.find((r) => r.chapter === 'braskas-final-aeon')!;
    const side = sideShift({ party: row.party, enemy: row.enemy, ...(row.follow ? { follow: true } : {}) }, pose, row.boss);
    expect(side.follow).toBe(true);
    expect(sideShift({ party: row.party, enemy: row.enemy }, pose, row.boss).follow).toBeUndefined();
  });
});

const actor = (name: string, facing: number, x = 0, z = 0): Actor => {
  const a = new Object3D() as unknown as Actor;
  a.name = name;
  (a as unknown as { facing: number }).facing = facing;
  a.position.set(x, 0, z);
  return a;
};

describe('Staging registers the move for a row that follows, and only while it plays', () => {
  const side = (follow: boolean): Side => ({ party: { dx: 0.35, dz: 0 }, enemy: { dx: 2.612, dz: -0.915 }, enemyBy: [{ id: /^yu-pagoda-left/, shift: { dx: 0.732, dz: -2.39 } }], boss: null, ...(follow ? { follow: true } : {}) });

  it('writes the table move of each figure into the registry, the pagoda by its own', () => {
    const tidus = actor('tidus', 1, -1.12, 1.6);
    const boss = actor('braskas-final-aeon-1', -1, 2.39, -8);
    const pagoda = actor('yu-pagoda-left', -1, -0.18, -5.1);
    for (const a of [tidus, boss, pagoda]) figs.push(a);
    const s = new Staging();
    s.side = side(true);
    s.apply([tidus, boss, pagoda], true);
    expect(standMoveOf(tidus)).toEqual({ dx: 0.35, dz: 0 });
    expect(standMoveOf(boss)).toEqual({ dx: 2.612, dz: -0.915 });
    expect(standMoveOf(pagoda)).toEqual({ dx: 0.732, dz: -2.39 });
    expect(boss.position.x).toBeCloseTo(2.39 + 2.612, 6); // the move itself is the staging's, as before
    expect(boss.position.z).toBeCloseTo(-8 - 0.915, 6);
  });

  it('registers nothing for a row that does not follow (Chapter II)', () => {
    const tidus = actor('tidus', 1);
    const boss = actor('yunalesca-1', -1);
    for (const a of [tidus, boss]) figs.push(a);
    const s = new Staging();
    s.side = side(false);
    s.apply([tidus, boss], true);
    expect(boss.position.x).toBeGreaterThan(2); // staged ...
    expect(standMoveOf(boss)).toBeNull(); // ... but the lunge is today's
    expect(standMoveOf(tidus)).toBeNull();
  });

  it('lets go the frame the table does (switched off, released)', () => {
    const tidus = actor('tidus', 1);
    const boss = actor('braskas-final-aeon-1', -1);
    for (const a of [tidus, boss]) figs.push(a);
    const s = new Staging();
    s.side = side(true);
    s.apply([tidus, boss], true);
    expect(standMoveOf(boss)).not.toBeNull();
    s.apply([tidus, boss], false); // EYE CANDY off: CHAPTER FRAMING does not play
    expect(standMoveOf(boss)).toBeNull();
    expect(standMoveOf(tidus)).toBeNull();
    s.apply([tidus, boss], true);
    expect(standMoveOf(boss)).not.toBeNull();
    s.release();
    expect(standMoveOf(boss)).toBeNull();
  });
});

// ------------------------------------------------------------------ the presenter

/** A fake actor that records the distance the presenter asked of its lunge. */
class LungeActor extends FakeActor {
  readonly asked: number[] = [];
  override async lunge(distance?: number): Promise<void> {
    this.asked.push(distance ?? Number.NaN);
  }
}

/**
 * A stage with the perspective model above behind `stage.motion.rect`: the party is near the camera (220 px per unit, boxes 311 wide), fiends far (54, 413).
 * `reads` counts every box the presenter asked for.
 */
function field(party: string[], enemies: string[]): { stage: FakeStage; at: (id: string) => LungeActor; reads: { n: number } } {
  const stage = new FakeStage(party, enemies);
  for (const id of [...party, ...enemies]) stage.actors.set(id, new LungeActor(id, stage.calls));
  for (const id of enemies) stage.actors.get(id)!.setFacing(-1); // a fiend faces the party, as a PaintedActor does
  for (const f of stage.actors.values()) figs.push(f);
  const reads = { n: 0 };
  const motion: Partial<StageMotionPort> = {
    rect(id, o) {
      reads.n++;
      const a = stage.actors.get(id);
      if (!a) return null;
      const near = stage.sides.get(id) !== 'enemy';
      const x = o?.at ? o.at.x : a.position.x;
      return { x: 800 + (near ? 220 : 54) * x, y: 300, w: near ? 311 : 413, h: 400 };
    },
  };
  (stage as unknown as { motion: Partial<StageMotionPort> }).motion = motion;
  return { stage, at: (id) => stage.actors.get(id) as LungeActor, reads };
}

/** Chapter III's shape: Tidus seated at -1.12 and moved 0.35, the boss seated at 2.39 and moved 2.612, the left pagoda seated at -0.9 and moved 0.732. */
function chapterThree(): ReturnType<typeof field> {
  const f = field(['tidus', 'yuna'], ['seymour-flux', 'yu-pagoda']);
  const set = (id: string, seat: number, dx: number): void => {
    f.at(id).position.x = seat + dx;
    standMove(f.at(id), { dx, dz: 0 });
  };
  set('tidus', -1.12, 0.35);
  set('yuna', -0.4, 0.35);
  set('seymour-flux', 2.39, 2.612);
  set('yu-pagoda', -0.9, 0.732);
  return f;
}

/** One physical attack played through the presenter. */
async function attack(stage: FakeStage, actorId: string, target: string, motion?: ActionMotionPort): Promise<void> {
  const events = [
    { type: 'action-start', actorId, command: { kind: 'attack', targets: [target] }, targets: [target] },
    { type: 'damage', targetId: target, amount: 900, element: 'none', crit: false, hitIndex: 0, hitCount: 1 },
    { type: 'action-end', actorId },
  ].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
  await new BattlePresenter({ stage, sleep: noSleep, ...(motion ? { actionMotion: motion } : {}) }).play(events);
}

describe('the house lunge in the presenter: 1.4, or the solved reach in a fight whose table follows', () => {
  it('is 1.4 to the unit, and reads no painted box at all, where the table moved nothing (every chapter but Chapter III)', async () => {
    const { stage, at, reads } = field(['tidus', 'yuna'], ['seymour-flux', 'yu-pagoda']);
    at('tidus').position.x = -1.12;
    at('seymour-flux').position.x = 2.39;
    await attack(stage, 'tidus', 'seymour-flux');
    expect(at('tidus').asked).toEqual([1.4]);
    expect(reads.n).toBe(0);
  });

  it("carries the party's strike on the boss the solved distance (Chapter III), and the boss's strike on the party", async () => {
    const { stage, at } = chapterThree();
    await attack(stage, 'tidus', 'seymour-flux');
    expect(at('tidus').asked).toHaveLength(1);
    const a = at('tidus').asked[0]!;
    expect(a).toBeGreaterThan(1.4);
    // the gap at the strike is the gap the stage's own seats leave at 1.4: Tidus's box right edge against the boss's left edge
    const right = (x: number): number => 800 + 220 * x + 311;
    const seatGap = 800 + 54 * 2.39 - right(-1.12 + 1.4);
    expect(800 + 54 * (2.39 + 2.612) - right(-1.12 + 0.35 + a)).toBeCloseTo(seatGap, 0);
    await attack(stage, 'seymour-flux', 'tidus');
    expect(at('seymour-flux').asked).toHaveLength(1);
    expect(at('seymour-flux').asked[0]!).toBeGreaterThan(1.4);
  });

  it('reads the target the action names, not the nearest: the left pagoda, which the table barely moved, needs far less than the boss', async () => {
    const { stage, at } = chapterThree();
    await attack(stage, 'tidus', 'seymour-flux');
    await attack(stage, 'tidus', 'yu-pagoda');
    const [boss, pagoda] = at('tidus').asked as [number, number];
    expect(boss).toBeGreaterThan(pagoda);
    expect(pagoda).toBeGreaterThanOrEqual(1.4);
  });

  it("reads every foe when the action names none (a fiend's ability picks its target as it resolves) and goes no further than the shortest reach", async () => {
    const { stage, at } = chapterThree();
    const events = [{ type: 'action-start', actorId: 'seymour-flux', command: { kind: 'attack', targets: [] }, targets: [] }, { type: 'action-end', actorId: 'seymour-flux' }].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
    await new BattlePresenter({ stage, sleep: noSleep }).play(events);
    await attack(stage, 'seymour-flux', 'tidus');
    await attack(stage, 'seymour-flux', 'yuna');
    const [none, tidus, yuna] = at('seymour-flux').asked as [number, number, number];
    expect(none).toBeCloseTo(Math.min(tidus, yuna), 9);
  });

  it('adds nothing to a lunge toward someone on its own side, or toward nobody', async () => {
    const { stage, at, reads } = chapterThree();
    await attack(stage, 'tidus', 'yuna');
    const events = [{ type: 'action-start', actorId: 'tidus', command: { kind: 'attack', targets: [] }, targets: [] }, { type: 'action-end', actorId: 'tidus' }].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
    const before = reads.n;
    await new BattlePresenter({ stage, sleep: noSleep }).play(events);
    expect(at('tidus').asked[0]).toBe(1.4); // yuna is on the party's side: no foe to solve against
    expect(reads.n).toBeGreaterThan(before); // the second, nameless action reads every foe ...
    expect(at('tidus').asked[1]).toBe(1.4); // ... and the left pagoda, which the table barely moved, needs none: the shortest reach rules
  });

  it("leaves 1.4 when the stage offers no painted boxes (a stage without the motion port)", async () => {
    const { stage, at } = chapterThree();
    delete (stage as unknown as { motion?: unknown }).motion;
    await attack(stage, 'tidus', 'seymour-flux');
    expect(at('tidus').asked).toEqual([1.4]);
  });

  it("FFX-2's strike after a run-in keeps its own 0.6 (the port answers first; no table moves an FFX-2 figure, so nothing is registered)", async () => {
    const motion: ActionMotionPort = { open() {}, close() {}, lungeFor: () => 0.6 };
    const { stage, at, reads } = field(['tidus', 'yuna'], ['seymour-flux']);
    await attack(stage, 'tidus', 'seymour-flux', motion);
    expect(at('tidus').asked).toEqual([0.6]);
    expect(reads.n).toBe(0);
  });
});
