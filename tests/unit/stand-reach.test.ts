import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { ActionMotionPort } from '../../src/engine/BattlePresenterMotion.ts';
import { heldOffStage, partyOffStage } from '../../src/engine/SummonStaging.ts';
import { blowPose } from '../../src/engine/KeyPoses.ts';
import { BANDS, frontClearance, type Profile, type Shape } from '../../src/engine/motion/Silhouette.ts';
import type { StageMotionPort } from '../../src/engine/motion/StageMotionPort.ts';
import { CONTACT_PX, LANE, MIN_SHARED_PX, NEAR_PX, REACH_CAP, reachAlong, type ReachWorld } from '../../src/engine/motion/StandReach.ts';
import { HOUSE_LUNGE, blowTargets, lungeDistance, strikeReach } from '../../src/engine/motion/StrikeReach.ts';
import { FakeActor, FakeStage, noSleep } from './helpers/FakeStage.ts';

/**
 * The strike reaches its target (r391-reach, both games): the house lunge is 1.4 world units, which stops short wherever the picture puts the foe further away.
 * The solver (`motion/StandReach.ts`) finds the lunge at which the attacker's painted FRONT is CONTACT_PX into the target's over the rows they share (read from the
 * paintings' alpha, `motion/Silhouette.ts`), never less than today's and never more than REACH_CAP further, and keeps the attacker out of a figure in its lane that
 * today's lunge is clear of. The presenter half (`motion/StrikeReach.ts`) decides who gets it, from the game's port.
 */

// ------------------------------------------------------------------ the solver, on a model with perspective (a near fighter, a far boss)

const rows = (l: number, r: number, at: Record<number, [number, number] | null> = {}): Profile => {
  const left = new Float32Array(BANDS).fill(l);
  const right = new Float32Array(BANDS).fill(r);
  for (const [k, v] of Object.entries(at)) {
    left[Number(k)] = v ? v[0] : Number.NaN;
    right[Number(k)] = v ? v[1] : Number.NaN;
  }
  return { left, right };
};

interface ModelOpts {
  dir?: 1 | -1;
  /** px a camera with yaw bends the screen: x gets + bend * x^2. */
  bend?: number;
  /** The target's box, px (default: a 413 x 400 box starting at 1500, rows 300 to 700, as the fighter's). */
  target?: { x?: number; y?: number; w?: number; h?: number };
  aProfile?: Profile;
  tProfile?: Profile;
  scale?: number;
  lane?: Array<{ x: number; y?: number; w?: number; profile?: Profile }>;
}

/** The fighter is near the camera (220 px per world unit, a 311 px box) and its feet stand at x 560 for a party member, 1500 for a fiend (which faces -x). */
function model(o: ModelOpts = {}): ReachWorld & { calls: number } {
  const dir = o.dir ?? 1;
  const bend = o.bend ?? 0;
  const t = o.target ?? {};
  const w = { calls: 0 } as ReachWorld & { calls: number };
  const at = (x: number): number => x + bend * ((x - 800) / 100) ** 2;
  return Object.assign(w, {
    dir,
    scale: o.scale ?? 1,
    attacker: (along: number): Shape | null => {
      w.calls++;
      const x0 = dir > 0 ? 560 : 1400;
      return { rect: { x: at(x0 + dir * 220 * along), y: 300, w: 311, h: 400 }, profile: o.aProfile };
    },
    target: (): Shape | null => {
      w.calls++;
      const left = t.x ?? (dir > 0 ? 1500 : 200);
      return { rect: { x: left, y: t.y ?? 300, w: t.w ?? 413, h: t.h ?? 400 }, profile: o.tProfile };
    },
    lane: (o.lane ?? []).map((l) => () => ({ rect: { x: l.x, y: l.y ?? 300, w: l.w ?? 200, h: 400 }, profile: l.profile })),
  });
}

/** The clearance (+ air, - overlap) the model leaves at lunge `l`. */
const clearAt = (w: ReachWorld, l: number): number => frontClearance(w.dir, w.attacker(l)!, w.target()!)!.gap;

describe('reachAlong: the lunge that puts the painted front CONTACT_PX into the target, solved on the screen', () => {
  it('carries the fighter until the fronts overlap by CONTACT_PX, within a pixel', () => {
    const w = model();
    const l = reachAlong(1.4, w);
    expect(l).toBeGreaterThan(1.4);
    expect(clearAt(w, l)).toBeCloseTo(-CONTACT_PX, 0);
    // by hand: the box ends at 560 + 311 + 220 l and the target starts at 1500: 1500 - (871 + 220 l) = -14
    expect(l).toBeCloseTo((1500 + CONTACT_PX - 871) / 220, 2);
  });

  it("is today's lunge, to the unit, when the strike already reaches (the fronts overlap by at least the contact)", () => {
    expect(reachAlong(1.4, model({ target: { x: 1000 } }))).toBe(1.4); // overlapped by 1000 - 871 - 308 = deeper than the contact
    const w = model();
    const exact = reachAlong(1.4, w);
    expect(reachAlong(exact, w)).toBe(exact); // solved once, solved: it does not creep
  });

  it('is never less than the base, even when the attacker passes the target (a deeper overlap is not pulled back)', () => {
    expect(reachAlong(1.4, model({ target: { x: 300 } }))).toBe(1.4);
    expect(reachAlong(2.0, model({ target: { x: 1100 } }))).toBe(2.0);
  });

  it('solves a fiend striking toward the party the same way (it faces -x)', () => {
    const w = model({ dir: -1 });
    const l = reachAlong(1.4, w);
    expect(l).toBeGreaterThan(1.4);
    expect(clearAt(w, l)).toBeCloseTo(-CONTACT_PX, 0);
  });

  it('lands on a bent screen (a camera with yaw) within a pixel', () => {
    const w = model({ bend: 6 });
    const l = reachAlong(1.4, w);
    expect(Math.abs(clearAt(w, l) + CONTACT_PX)).toBeLessThan(1);
  });

  it('scales its margins with the frame: 2560 wide is 1.6 times the contact', () => {
    const w = model({ scale: 1.6 });
    const l = reachAlong(1.4, w);
    expect(clearAt(w, l)).toBeCloseTo(-CONTACT_PX * 1.6, 0);
  });

  it('never goes further than the cap', () => {
    const huge = model({ target: { x: 9000 } });
    expect(reachAlong(1.4, huge)).toBeCloseTo(1.4 + REACH_CAP, 6);
  });

  it('reads the painted front, not the box: a sword tip reaches before the body, so the lunge is shorter than the boxes alone would ask', () => {
    const sword = rows(0, 0.5, { 10: [0, 1] }); // the body ends halfway across the box, one row carries a sword to its edge
    const withSword = model({ aProfile: sword });
    const bodyOnly = model({ aProfile: rows(0, 0.5) });
    const boxes = model();
    const a = reachAlong(1.4, withSword);
    const b = reachAlong(1.4, bodyOnly);
    const c = reachAlong(1.4, boxes);
    expect(a).toBeLessThan(b); // the sword closes the gap that the body alone would have to
    expect(c).toBeLessThan(b); // and the full box (the cheap stand-in) is the shortest of all
    expect(clearAt(withSword, a)).toBeCloseTo(-CONTACT_PX, 0);
  });

  it('is not fooled by transparent box corners: boxes overlapping by 150 px with the paintings still apart are still short', () => {
    // the attacker's body fills the left 40 percent of its box, the target's near side is 60 percent in: the boxes overlap long before the paint does
    const w = model({ aProfile: rows(0, 0.4), tProfile: rows(0.6, 1), target: { x: 1000 } });
    expect(reachAlong(1.4, w)).toBeGreaterThan(1.4);
    expect(clearAt(w, reachAlong(1.4, w))).toBeCloseTo(-CONTACT_PX, 0);
  });

  it('leaves a target that shares no row with the attacker alone when it is far above or below (a lateral lunge only runs under it)', () => {
    expect(reachAlong(1.4, model({ target: { y: 0, h: 100 } }))).toBe(1.4); // 200 px of air above the attacker's rows
    expect(reachAlong(1.4, model({ target: { y: 760, h: 300 } }))).toBe(1.4); // 60 px of air below: further than NEAR_PX
    expect(NEAR_PX).toBeLessThan(200);
  });

  it('lines the strike up beside a target a little above or below (NEAR_PX): it cannot touch it, and it ends as close as a lateral lunge gets', () => {
    const w = model({ target: { y: 300 - 400 - 25, h: 400 } }); // its rows end 25 px above the attacker's rows start
    const l = reachAlong(1.4, w);
    expect(l).toBeGreaterThan(1.4);
    const a = w.attacker(l)!;
    const t = w.target()!;
    expect(a.rect.x + a.rect.w - t.rect.x).toBeCloseTo(0, 0); // the front stands at the near side: aligned, no overlap asked of rows that cannot touch
  });

  it('wants rows in common before it asks for overlap: a sliver of shared rows is a graze (under MIN_SHARED_PX), so it only lines up', () => {
    const w = model({ target: { y: 300 - 400 + (MIN_SHARED_PX - 4), h: 400 } }); // 6 px of shared rows
    const l = reachAlong(1.4, w);
    const a = w.attacker(l)!;
    expect(a.rect.x + a.rect.w - w.target()!.rect.x).toBeCloseTo(0, 0);
  });

  it('leaves a colossus alone: an attacker wider than half the frame is the field, not a fighter that crosses it', () => {
    const w = model({ target: { x: 9000 } });
    const wide: ReachWorld = { ...w, attacker: (a: number) => ({ rect: { x: 100 + 220 * a, y: 300, w: 801, h: 400 } }) };
    expect(reachAlong(1.4, wide)).toBe(1.4);
    const narrow: ReachWorld = { ...w, attacker: (a: number) => ({ rect: { x: 100 + 220 * a, y: 300, w: 799, h: 400 } }) };
    expect(reachAlong(1.4, narrow)).toBeGreaterThan(1.4);
    expect(reachAlong(1.4, { ...wide, scale: 1.6 })).toBeGreaterThan(1.4); // 801 px is under half of a 2560-wide frame
  });

  it("leaves today's lunge when a shape is unknown or the gap does not close with the lunge", () => {
    const w = model();
    expect(reachAlong(1.4, { ...w, target: () => null })).toBe(1.4);
    expect(reachAlong(1.4, { ...w, attacker: () => null })).toBe(1.4);
    expect(reachAlong(1.4, { ...w, attacker: () => ({ rect: { x: 100, y: 300, w: 100, h: 400 } }) })).toBe(1.4); // the box does not move with the lunge
    expect(reachAlong(1.4, { ...w, target: () => ({ rect: { x: Number.NaN, y: 0, w: 100, h: 100 } }) })).toBe(1.4); // a box that projects to nothing
    expect(reachAlong(1.4, { ...w, attacker: (a: number) => (a > 1.5 ? null : { rect: { x: 560, y: 300, w: 311, h: 400 } }) })).toBe(1.4); // a box that goes missing in the search
  });
});

describe('the lane: no new collisions', () => {
  it('stops the lunge at the near side of a figure in the attacker\'s lane that today\'s lunge is clear of', () => {
    // the target is far (1500); a teammate stands at x 1100 (clear of the 1.4 lunge: 871 + 308 = 1179? no: 560 + 311 + 308 = 1179 > 1100) - use 1250
    const w = model({ lane: [{ x: 1250, w: 150 }] });
    const l = reachAlong(1.4, w);
    const free = reachAlong(1.4, model());
    expect(l).toBeLessThan(free);
    expect(l).toBeGreaterThan(1.4);
    expect(clearAt({ ...w, target: () => w.lane![0]!() }, l)).toBeGreaterThanOrEqual(-0.5); // it stops at the figure's near side, not in it
    expect(clearAt({ ...w, target: () => w.lane![0]!() }, l)).toBeLessThan(2);
  });

  it("leaves a figure today's lunge already overlaps alone: the solver is not what runs the attacker into it", () => {
    const w = model({ lane: [{ x: 1000, w: 150 }] }); // 871 + 308 = 1179: the 1.4 lunge already reaches into it
    expect(reachAlong(1.4, w)).toBe(reachAlong(1.4, model()));
  });

  it('ignores a lane figure with no row in common with the attacker, and one that is not shown', () => {
    const above = model({ lane: [{ x: 1250, y: 0, w: 150 }] }); // rows 0 to 400, the attacker's are 300 to 700: they share 100 px, so it counts...
    const none = model({ lane: [{ x: 1250, y: -500, w: 150 }] });
    expect(reachAlong(1.4, none)).toBe(reachAlong(1.4, model()));
    expect(reachAlong(1.4, above)).toBeLessThan(reachAlong(1.4, model()));
    const hidden = model();
    hidden.lane = [() => null];
    expect(reachAlong(1.4, hidden)).toBe(reachAlong(1.4, model()));
  });

  it('never goes below the base: a figure in the way of the base itself leaves the base', () => {
    const w = model({ lane: [{ x: 1180, w: 150 }] }); // 1.4 ends at 1179, one pixel clear: the first step of the extension runs into it
    expect(reachAlong(1.4, w)).toBeGreaterThanOrEqual(1.4);
    expect(reachAlong(1.4, w)).toBeLessThan(1.4 + 0.1);
  });

  it('exposes the lane as a distance in depth (half a world unit: two painted figures that close intersect on the floor)', () => {
    expect(LANE).toBe(0.5);
  });
});

// ------------------------------------------------------------------ the presenter: who reaches, and what it reads

const figs: object[] = [];
afterEach(() => {
  figs.length = 0;
});

/** A fake actor that records the distance the presenter asked of its lunge. */
class LungeActor extends FakeActor {
  readonly asked: number[] = [];
  /** The part of each lunge that is the house lunge (the rest rides the eased step). */
  readonly houses: Array<number | undefined> = [];
  override async lunge(distance?: number, _ms?: number, _contact?: unknown, house?: number): Promise<void> {
    this.asked.push(distance ?? Number.NaN);
    this.houses.push(house);
  }
}

/**
 * A stage with a pinhole model behind `stage.motion`: a figure's box starts at screen x = 800 + k x with k 220 for a party member (a 311 px box) and 54 for a fiend (a
 * 413 px box). `reads` counts every shape the presenter asked for, `posed` the pose each read named.
 */
function field(party: string[], enemies: string[], o: { shape?: boolean; z?: Record<string, number> } = {}): { stage: FakeStage; at: (id: string) => LungeActor; reads: { n: number; posed: Array<string | undefined>; rigs: Array<string | undefined> } } {
  const stage = new FakeStage(party, enemies);
  for (const id of [...party, ...enemies]) stage.actors.set(id, new LungeActor(id, stage.calls));
  for (const id of enemies) stage.actors.get(id)!.setFacing(-1); // a fiend faces the party, as a PaintedActor does
  for (const [id, z] of Object.entries(o.z ?? {})) stage.actors.get(id)!.position.z = z;
  for (const f of stage.actors.values()) figs.push(f);
  const reads = { n: 0, posed: [] as Array<string | undefined>, rigs: [] as Array<string | undefined> };
  const box = (id: string, at?: { x: number }): { x: number; y: number; w: number; h: number } | null => {
    const a = stage.actors.get(id);
    if (!a) return null;
    const near = stage.sides.get(id) !== 'enemy';
    const x = at ? at.x : a.position.x;
    return { x: 800 + (near ? 220 : 54) * x, y: 300, w: near ? 311 : 413, h: 400 };
  };
  const motion: Partial<StageMotionPort> = {
    rect(id, opts) {
      reads.n++;
      return box(id, opts?.at);
    },
    view: () => ({ w: 1600, h: 900 }),
  };
  if (o.shape) {
    motion.shape = (id, opts) => {
      reads.n++;
      reads.posed.push(opts?.pose);
      reads.rigs.push(opts?.rig);
      const rect = box(id, opts?.at);
      return rect ? { rect } : null;
    };
  }
  (stage as unknown as { motion: Partial<StageMotionPort> }).motion = motion;
  return { stage, at: (id) => stage.actors.get(id) as LungeActor, reads };
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

/**
 * Tidus at x -1.12, the boss far right at 9 and a pagoda nearer at 5: the party's box ends at 800 + 220 x + 311 (1172.6 after the 1.4 lunge), the boss's starts at
 * 800 + 54 x (1286: 113 px of air at the strike), the pagoda's at 1070 (already overlapped at the strike).
 */
function chapter(): ReturnType<typeof field> {
  const f = field(['tidus', 'yuna'], ['seymour-flux', 'yu-pagoda'], { shape: true, z: { tidus: 1.6, yuna: 0.4, 'seymour-flux': -7.6, 'yu-pagoda': -7.6 } });
  f.at('tidus').position.x = -1.12;
  f.at('yuna').position.x = 0.6;
  f.at('seymour-flux').position.x = 9;
  f.at('yu-pagoda').position.x = 5;
  return f;
}

describe('the house lunge in the presenter: 1.4, or the lunge that reaches, in every chapter whose game lets it', () => {
  it('reaches in a fight with no port (FFX): the party member carried until the fronts overlap by the contact, the boss struck', async () => {
    const { stage, at } = chapter();
    await attack(stage, 'tidus', 'seymour-flux');
    const d = at('tidus').asked[0]!;
    expect(d).toBeGreaterThan(HOUSE_LUNGE);
    expect(at('tidus').houses[0]).toBe(HOUSE_LUNGE); // the house part is today's lunge; the rest rides the eased step
    const right = (x: number): number => 800 + 220 * x + 311;
    expect(800 + 54 * 9 - right(-1.12 + d)).toBeCloseTo(-CONTACT_PX, 0);
    await attack(stage, 'seymour-flux', 'tidus');
    expect(at('seymour-flux').asked[0]!).toBeGreaterThan(HOUSE_LUNGE);
  });

  it('is 1.4 to the unit where the strike already reaches, and where the stage offers no painted boxes', async () => {
    const near = field(['tidus'], ['seymour-flux'], { shape: true });
    near.at('tidus').position.x = -1.12; // the strike ends at 1172.6 and the boss starts at 800 + 54 * 2.39 = 929: overlapped by 243 px
    near.at('seymour-flux').position.x = 2.39;
    await attack(near.stage, 'tidus', 'seymour-flux');
    expect(near.at('tidus').asked).toEqual([1.4]);
    const { stage, at } = chapter();
    delete (stage as unknown as { motion?: unknown }).motion;
    await attack(stage, 'tidus', 'seymour-flux');
    expect(at('tidus').asked).toEqual([1.4]);
  });

  it('reads the boxes alone from a stage without the shape port (the painted front cannot be read: the box stands in)', async () => {
    const f = field(['tidus'], ['seymour-flux']);
    f.at('tidus').position.x = -1.12;
    f.at('seymour-flux').position.x = 9;
    await attack(f.stage, 'tidus', 'seymour-flux');
    expect(f.at('tidus').asked[0]!).toBeGreaterThan(HOUSE_LUNGE);
    expect(f.reads.n).toBeGreaterThan(0);
  });

  it('reads the target the action names, not the nearest, and the shortest reach when it names none (a fiend\'s ability picks its target as it resolves)', async () => {
    const { stage, at } = chapter();
    await attack(stage, 'tidus', 'seymour-flux');
    await attack(stage, 'tidus', 'yu-pagoda');
    const [boss, pagoda] = at('tidus').asked as [number, number];
    expect(boss).toBeGreaterThan(pagoda); // the pagoda stands nearer
    const events = [{ type: 'action-start', actorId: 'tidus', command: { kind: 'attack', targets: [] }, targets: [] }, { type: 'action-end', actorId: 'tidus' }].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
    await new BattlePresenter({ stage, sleep: noSleep }).play(events);
    expect(at('tidus').asked[2]!).toBeCloseTo(Math.min(boss, pagoda), 9);
  });

  it('adds nothing to a lunge toward someone on its own side, or toward nobody', async () => {
    const { stage, at } = chapter();
    await attack(stage, 'tidus', 'yuna');
    expect(at('tidus').asked[0]).toBe(1.4); // yuna is on the party's side: no foe to solve against
  });

  it("reads the attacker in the pose its blow lands in (the impact painting), and nobody else in any pose but the one showing", async () => {
    const f = chapter();
    const d = strikeReach({ stage: f.stage }, { actorId: 'tidus', targets: ['seymour-flux'] }, 1.4, 'attack');
    expect(d).toBeGreaterThan(1.4);
    expect(f.reads.posed.filter((p) => p === 'attack').length).toBeGreaterThan(0);
    expect(f.reads.posed.every((p) => p === undefined || p === 'attack')).toBe(true);
    // the target and the others are read as they show: only the attacker names a pose
    const reads = f.reads.posed.length;
    strikeReach({ stage: f.stage }, { actorId: 'tidus', targets: ['seymour-flux'] }, 1.4);
    expect(f.reads.posed.slice(reads).every((p) => p === undefined)).toBe(true);
  });
});

describe('the pose the blow lands in, through the real beat (KeyPoses.blowPose)', () => {
  const posed = async (paints: string[]): Promise<Array<string | undefined>> => {
    const f = chapter();
    (f.stage as unknown as { paints: (id: string, pose: string) => boolean }).paints = (id, pose) => id === 'tidus' && paints.includes(pose);
    await attack(f.stage, 'tidus', 'seymour-flux');
    return f.reads.posed;
  };

  it('is the impact painting whenever a wind-up leads (the key frame of the blow; the follow-through carries on from it), with or without a follow-through painting', async () => {
    for (const paints of [['ready', 'follow'], ['ready']]) {
      const named = (await posed(paints)).filter((p) => p !== undefined);
      expect(named.length).toBeGreaterThan(0);
      expect(named.every((p) => p === 'attack')).toBe(true);
    }
  });

  it('is the pose showing (none named) when no wind-up leads: the attack painting is up from the start and stays up', async () => {
    const plain = await posed([]);
    expect(plain.length).toBeGreaterThan(0);
    expect(plain.every((p) => p === undefined)).toBe(true);
    expect((await posed(['follow'])).every((p) => p === undefined)).toBe(true); // a follow-through with no wind-up never plays (KeyPoses)
    expect(blowPose(false)).toBeUndefined();
    expect(blowPose(true)).toBe('attack');
  });
});

describe("a fiend's ability names its target as it resolves: the burst holds it (blowTargets)", () => {
  const ev = (e: Record<string, unknown>, i: number): BattleEvent => ({ ...e, seq: i }) as unknown as BattleEvent;
  const burst = (events: BattleEvent[], at: number): { events: readonly BattleEvent[]; at: number } => ({ events, at });

  it("collects the targets of the actor's own blows between its action-start and its action-end: not another source's, not its own, each once", () => {
    const events = [
      ev({ type: 'action-start', actorId: 'seymour-flux', command: { kind: 'attack', targets: [] }, targets: [] }, 0),
      ev({ type: 'status-add', targetId: 'kimahri' }, 1),
      ev({ type: 'damage', targetId: 'tidus', sourceId: 'seymour-flux', amount: 5 }, 2),
      ev({ type: 'damage', targetId: 'tidus', sourceId: 'seymour-flux', amount: 5 }, 3), // a second hit on the same target
      ev({ type: 'miss', targetId: 'yuna', sourceId: 'seymour-flux', reason: 'evaded' }, 4),
      ev({ type: 'damage', targetId: 'seymour-flux', sourceId: 'seymour-flux', amount: 1 }, 5), // its own recoil
      ev({ type: 'damage', targetId: 'auron', sourceId: 'kimahri', amount: 9 }, 6), // someone else's blow (a counter)
      ev({ type: 'action-end', actorId: 'seymour-flux' }, 7),
      ev({ type: 'damage', targetId: 'kimahri', sourceId: 'seymour-flux', amount: 5 }, 8), // after its action ended
    ];
    expect(blowTargets(burst(events, 0), 'seymour-flux')).toEqual(['tidus', 'yuna']);
    expect(blowTargets(undefined, 'seymour-flux')).toEqual([]);
    expect(blowTargets(burst(events.slice(0, 1), 0), 'seymour-flux')).toEqual([]); // an ATB charge: the blows come in a later burst
  });

  it('lunges for the target of its first blow, not for the shortest reach over every foe', async () => {
    const f = chapter();
    // the boss (x 9, facing -x) striking: Tidus at -1.12 is far from it, Yuna at 0.6 near; with no target named the old rule went no further than Yuna needed
    const named = async (target: string): Promise<number> => {
      const g = chapter();
      await attack(g.stage, 'seymour-flux', target);
      return g.at('seymour-flux').asked[0]!;
    };
    const events = [
      { type: 'action-start', actorId: 'seymour-flux', command: { kind: 'attack', targets: [] }, targets: [] },
      { type: 'damage', targetId: 'tidus', sourceId: 'seymour-flux', amount: 900, element: 'none', crit: false, hitIndex: 0, hitCount: 1 },
      { type: 'action-end', actorId: 'seymour-flux' },
    ].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
    await new BattlePresenter({ stage: f.stage, sleep: noSleep }).play(events);
    const tidus = await named('tidus');
    const yuna = await named('yuna');
    expect(tidus).toBeGreaterThan(yuna);
    expect(f.at('seymour-flux').asked[0]!).toBeCloseTo(tidus, 9);
    // with no blow in the burst (an ATB charge) it is the shortest over the foes, as before
    const g = chapter();
    const bare = [{ type: 'action-start', actorId: 'seymour-flux', command: { kind: 'attack', targets: [] }, targets: [] }, { type: 'action-end', actorId: 'seymour-flux' }].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
    await new BattlePresenter({ stage: g.stage, sleep: noSleep }).play(bare);
    expect(g.at('seymour-flux').asked[0]!).toBeCloseTo(Math.min(tidus, yuna), 9);
  });
});

describe("the camera the blow is seen through: the struck figure's rig (the first hit hard-cuts to it)", () => {
  it("reads every figure through the enemy's rig for a blow on a fiend and the party's for a blow on a party member", async () => {
    const f = chapter();
    await attack(f.stage, 'tidus', 'seymour-flux');
    expect(f.reads.rigs.length).toBeGreaterThan(0);
    expect(f.reads.rigs.every((r) => r === 'enemy')).toBe(true);
    const g = chapter();
    await attack(g.stage, 'seymour-flux', 'tidus');
    expect(g.reads.rigs.length).toBeGreaterThan(0);
    expect(g.reads.rigs.every((r) => r === 'party')).toBe(true);
  });

  it("falls back to the scene's action or idle rig when it publishes no enemy or party rig, and to the shot the camera is on when it publishes neither", async () => {
    const f = chapter();
    (f.stage.camera as unknown as { rigNames: string[] }).rigNames = ['idle', 'action'];
    await attack(f.stage, 'tidus', 'seymour-flux');
    expect(f.reads.rigs.every((r) => r === 'action')).toBe(true);
    const g = chapter();
    (g.stage.camera as unknown as { rigNames: string[] }).rigNames = [];
    await attack(g.stage, 'tidus', 'seymour-flux');
    expect(g.reads.rigs.every((r) => r === undefined)).toBe(true);
  });
});

describe('who gets it: the game\'s port answers (FFX has none)', () => {
  const reach = (over: Partial<ActionMotionPort>): ActionMotionPort => ({ open() {}, close() {}, ...over });

  it("FFX-2's girls with no run-in do not (a menu open, a long-range dressphere): 1.4 whatever the picture; after a run-in her own 0.6 is the start (a port that does not let it reach keeps it)", async () => {
    const motion = reach({ lungeFor: (id) => (id === 'tidus' ? 0.6 : undefined), reachFor: () => false });
    const { stage, at, reads } = chapter();
    await attack(stage, 'tidus', 'seymour-flux', motion);
    expect(at('tidus').asked).toEqual([0.6]);
    await attack(stage, 'yuna', 'seymour-flux', motion);
    expect(at('yuna').asked).toEqual([1.4]);
    expect(reads.n).toBe(0);
  });

  it("a counter is a blow like any other: its short 0.6 lunge is carried until it reaches, and stays 0.6 toward an ally or where the game's rules do not let it reach", async () => {
    const counter = async (stage: FakeStage, actorId: string, targetId: string, motion?: ActionMotionPort): Promise<void> => {
      const events = [{ type: 'counter', actorId, targetId, abilityId: 'counterattack', cause: 'counterattack' }].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
      await new BattlePresenter({ stage, sleep: noSleep, ...(motion ? { actionMotion: motion } : {}) }).play(events);
    };
    const { stage, at } = chapter();
    await counter(stage, 'seymour-flux', 'tidus'); // a boss's counter on the party: the same reach as its strike, from 0.6
    expect(at('seymour-flux').asked[0]!).toBeGreaterThan(0.6);
    expect(at('seymour-flux').houses[0]).toBe(0.6); // the counter's own lunge is the house part
    await counter(stage, 'tidus', 'yuna'); // an ally (auto-potion): nobody to reach
    expect(at('tidus').asked[0]).toBe(0.6);
    await counter(stage, 'tidus', 'seymour-flux', reach({ reachFor: () => false })); // FFX-2's girls: the port keeps the lunge
    expect(at('tidus').asked[1]).toBe(0.6);
    await counter(stage, 'tidus', 'seymour-flux', reach({ reachFor: () => true }));
    expect(at('tidus').asked[2]!).toBeGreaterThan(0.6);
  });

  it("FFX-2's fiends do: a fiend has no run, its lunge is its whole approach, and the port says so (`reachFor`)", async () => {
    const motion = reach({ reachFor: (id) => id === 'seymour-flux' });
    const { stage, at } = chapter();
    await attack(stage, 'seymour-flux', 'tidus', motion);
    expect(at('seymour-flux').asked[0]!).toBeGreaterThan(1.4);
    await attack(stage, 'tidus', 'seymour-flux', motion);
    expect(at('tidus').asked).toEqual([1.4]);
  });

  it('a long-range dressphere fires from where she stands: no run, and the port does not let her lunge reach (sourced: no run-in at all)', async () => {
    const motion = reach({ longRange: () => true, reachFor: () => false });
    const { stage, at } = chapter();
    await attack(stage, 'tidus', 'seymour-flux', motion);
    expect(at('tidus').asked).toEqual([1.4]);
  });

  it("FF7's port does not answer (it runs its own melee): 1.4, nothing read", async () => {
    const { stage, at, reads } = chapter();
    await attack(stage, 'tidus', 'seymour-flux', reach({ ownsWindUp: () => false }));
    expect(at('tidus').asked).toEqual([1.4]);
    expect(reads.n).toBe(0);
  });

  it('lungeDistance is the port\'s own number after a run-in, else the solved reach where the game lets it, else the house lunge', () => {
    const { stage } = chapter();
    const ctx = { stage };
    const ev = { actorId: 'tidus', targets: ['seymour-flux'] };
    expect(lungeDistance(ctx, ev, undefined)).toBeGreaterThan(1.4);
    expect(lungeDistance(ctx, ev, null)).toBeGreaterThan(1.4);
    expect(lungeDistance(ctx, ev, reach({ lungeFor: () => 0.6 }))).toBe(0.6);
    const closed = lungeDistance(ctx, ev, reach({ lungeFor: () => 0.6, reachFor: () => true })); // a girl who has run in, and her stop leaves a gap: the lunge closes the rest, from 0.6
    expect(closed).toBeGreaterThan(0.6);
    expect(closed).toBeLessThanOrEqual(0.6 + REACH_CAP + 1e-9); // never more than the cap further than its start
    expect(lungeDistance(ctx, ev, reach({}))).toBe(1.4);
    expect(lungeDistance(ctx, ev, reach({ reachFor: () => true }))).toBeGreaterThan(1.4);
  });
});

describe('the lane in the presenter: depth decides who stands in the attacker\'s way', () => {
  /** Tidus at -1.12 (the 1.4 lunge ends at 1172.6), the boss far to the right (box from 1286), and a teammate at x 1.8 (box 1196 to 1507: clear of the 1.4 lunge by 23 px, in the way of the longer one). */
  const lane = (zYuna: number): ReturnType<typeof field> => {
    const f = field(['tidus', 'yuna'], ['seymour-flux'], { shape: true, z: { tidus: 1.6, yuna: zYuna, 'seymour-flux': -7.6 } });
    f.at('tidus').position.x = -1.12;
    f.at('yuna').position.x = 1.8;
    f.at('seymour-flux').position.x = 9;
    return f;
  };

  it("stops short of a teammate at the attacker's own depth that the 1.4 lunge is clear of", async () => {
    const same = lane(1.6);
    const apart = lane(0.2);
    await attack(same.stage, 'tidus', 'seymour-flux');
    await attack(apart.stage, 'tidus', 'seymour-flux');
    expect(same.at('tidus').asked[0]!).toBeLessThan(apart.at('tidus').asked[0]!);
    expect(same.at('tidus').asked[0]!).toBeGreaterThanOrEqual(1.4);
  });

  it('does not count a figure the summon has taken off the field, or one the stage reports as not shown', async () => {
    const f = lane(1.6);
    const apart = lane(0.2);
    await partyOffStage(f.stage, 'seymour-flux'); // tidus and yuna are held off (heldOffStage): the aeon is not their obstacle
    expect(heldOffStage(f.stage).has('yuna')).toBe(true);
    await attack(f.stage, 'tidus', 'seymour-flux');
    await attack(apart.stage, 'tidus', 'seymour-flux');
    expect(f.at('tidus').asked[0]!).toBeCloseTo(apart.at('tidus').asked[0]!, 9);
    const hidden = lane(1.6);
    (hidden.stage as unknown as { motion: { shape: StageMotionPort['shape'] } }).motion.shape = (id, o) => (id === 'yuna' ? null : { rect: { x: 800 + (id === 'tidus' ? 220 : 54) * (o?.at ? o.at.x : hidden.at(id).position.x), y: 300, w: id === 'tidus' ? 311 : 413, h: 400 } });
    await attack(hidden.stage, 'tidus', 'seymour-flux');
    expect(hidden.at('tidus').asked[0]!).toBeCloseTo(apart.at('tidus').asked[0]!, 9);
  });
});
