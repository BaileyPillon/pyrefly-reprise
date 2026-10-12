/**
 * **The table director** (`src/engine/ffxcam/tableDirector.ts`; FFX only): the website's camera for the hidden Fayth chapter, on a made-up shot table (the real one is `ffxcam-table-data.test.ts`'s). What this
 * file pins:
 *
 * 1. **Beats**: Enter and Select play the default view of the current range, an action's opening finds its shot by the ability (or the plain Attack of its side), the acting slot, the target and the range,
 *    its launch plays on the first hit only, Normal is the default view again, the victory and the defeat have their cameras, and a beat with no shot leaves the camera where it is.
 * 2. **Targets**: Evrae, the actor itself, one other party member (by slot), several, or both sides are told apart; a cell the route lacks falls back through the `*` forms and, with none, plays nothing.
 * 3. **Branches** are drawn by weight from the camera's own presentation dice (never `Math.random`, never the battle's RNG): the same seed plays the same shots, another seed another, and the draws are counted.
 * 4. **Time**: 29.97 steps a second scaled by the beat's playback rate, a shot is busy until it lands, a skipping or hurried beat runs it to its end at once, the beat's own step is paid for.
 * 5. **The airship's scenes**: Pull back and Move in play their shot and then Normal for the range they end in; `rangeSettled` ends one early.
 * 6. **Answers**: false until some beat has started a shot (so Chapter VIII's camera plays), true after.
 *
 * Game case: FFX only.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Branch, EvraeShotTable, ShotDef, ShotKey } from '../../src/data/ffx/camera/shotTypes.ts';
import type { ActionShot, ActorShot, BattleStartShot, ImpactShot, ShotCtx } from '../../src/engine/ShotDirector.ts';
import { LOGIC_HZ } from '../../src/engine/ffxcam/director.ts';
import { PresentationRandom } from '../../src/engine/ffxcam/host.ts';
import { TABLE_LOGIC_HZ, TableDirector } from '../../src/engine/ffxcam/tableDirector.ts';
import { RecordingSink, shotCtx, subject } from './helpers/ffxcamDirectorKit.ts';

// ------------------------------------------------------------------ a made-up table

const key = (step: number, x: number, shape: ShotKey[5] = 1): ShotKey => [step, [x, -50, 100], [0, -40, 0], 0, 1024, shape];
const still = (kind: ShotDef['kind'], x: number): ShotDef => ({ kind, len: 0, keys: [key(0, x, 0)] });
const move = (kind: ShotDef['kind'], x: number, len: number): ShotDef => ({ kind, len, keys: [key(0, x, 0), key(len, x + 100, 1)] });

const SHOTS: Record<string, ShotDef> = {
  dn: still('default', 1),
  df: still('default', 2),
  atk: still('action', 10),
  c0: move('action', 20, 20),
  c1: move('action', 30, 20),
  c2: move('action', 40, 20),
  fl: move('action', 50, 30),
  fl2: move('action', 60, 30),
  hs: move('action', 70, 10),
  hp: move('action', 80, 10),
  ha: move('action', 90, 10),
  pb: move('scene', 100, 40),
  mi: move('scene', 110, 30),
  v1: move('victory', 120, 10),
  v2: move('victory', 130, 10),
  x0: move('defeat', 140, 10),
  x1: move('defeat', 150, 10),
  x2: move('defeat', 160, 10),
  ev: move('action', 170, 25),
};

const ROUTES: Record<string, Record<string, readonly Branch[]>> = {
  attack: { 'n**': [['atk', 1]], 'f**': [['', 1]] },
  cast: { '*0*': [['c0', 1]], '*1*': [['c1', 1]], '*2*': [['c2', 1]] },
  fire: { '***': [['fl', 3], ['fl2', 1]] },
  haste: { '*0e': [['hs', 1]], '*0s': [['hs', 1]], '*0p': [['hp', 1]], '*0a1': [['ha', 1]], '**x': [['hp', 1]] },
  slowL: { 'n**': [['ev', 1]] },
};

const TABLE: EvraeShotTable = {
  format: 'echoes-evrae-shots/1',
  shots: SHOTS,
  routes: ROUTES,
  rows: {
    '@attack.party': { open: 'attack' },
    '@attack.monster': { open: 'attack' },
    fire: { open: 'cast', launch: 'fire' },
    haste: { open: 'haste' },
    slow: { open: 'cast', launch: 'slowL' },
    'evrae-inhale': { open: 'attack' },
  },
  views: { near: 'dn', far: 'df' },
  scenes: { pullBack: [['pb', 1]], moveIn: [['mi', 1]] },
  victory: { n: [['v1', 1], ['v2', 1]], f: [['v1', 1]] },
  defeat: { n0: [['x0', 1]], n1: [['x1', 1]], n2: [['x2', 1]], f0: [['x0', 1]], f1: [['x1', 1]], f2: [['x2', 1]] },
};

// ------------------------------------------------------------------ the rig

const TIDUS = subject('tidus', 'party');
const WAKKA = subject('wakka', 'party');
const RIKKU = subject('rikku', 'party');
const EVRAE = subject('evrae', 'enemy');
const LINEUP = ['tidus', 'wakka', 'rikku'];

interface Rig {
  readonly d: TableDirector;
  readonly sink: RecordingSink;
  readonly started: string[];
  range: 'near' | 'far';
}

function rig(seed = 1, table: EvraeShotTable = TABLE): Rig {
  const sink = new RecordingSink();
  const started: string[] = [];
  const r = { range: 'near' as 'near' | 'far' };
  const d = new TableDirector({ table, sink, seed, range: () => r.range, onStart: (id) => started.push(id) });
  d.setLineup(LINEUP);
  return Object.assign(r, { d, sink, started }) as Rig;
}

const startCtx = (ctx: ShotCtx): BattleStartShot => ({ ...ctx, partyIds: LINEUP, boss: EVRAE, bossName: 'Evrae' });
const open = (ctx: ShotCtx, actor = TIDUS, targets = [EVRAE], abilityId?: string, commandKind = 'ability'): ActionShot => ({ ...ctx, actor, targets, action: { kind: 'cast', ...(abilityId === undefined ? {} : { abilityId }), commandKind: commandKind as never } });
const hit = (ctx: ShotCtx, actor = TIDUS, abilityId = 'fire', hitIndex = 0): ImpactShot => ({ ...ctx, actor, action: { kind: 'cast', abilityId, commandKind: 'ability' }, target: EVRAE, hitIndex, heavy: false });
const closing = (ctx: ShotCtx, actor = TIDUS): ActorShot => ({ ...ctx, actor });
const STEP_MS = 1000 / TABLE_LOGIC_HZ;

afterEach(() => vi.restoreAllMocks());

describe('answers', () => {
  it('declines every beat until a shot has started, then takes them all (a beat with no shot of its own leaves the camera where it is)', () => {
    const { d } = rig();
    const ctx = shotCtx();
    expect(d.live).toBe(false);
    expect(d.impact(hit(ctx))).toBe(false);
    expect(d.overdriveEnd(closing(ctx))).toBe(false);
    expect(d.battleStart(startCtx(ctx))).toBe(true);
    expect(d.live).toBe(true);
    expect(d.telegraph({ ...ctx, enemy: EVRAE, stage: 1 })).toBe(true);
    expect(d.formChange({ ...ctx, enemy: EVRAE })).toBe(true);
    expect(d.overdriveEnd(closing(ctx))).toBe(true);
    expect(d.impact(hit(ctx))).toBe(true);
  });

  it('runs at the same rate as the programs\' director', () => {
    expect(TABLE_LOGIC_HZ).toBe(LOGIC_HZ);
  });
});

describe('the beats', () => {
  it('Enter and Select play the default view of the current range; Normal plays it again', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    expect(r.started).toEqual(['dn']);
    expect(r.sink.last.eye[0]).toBe(1);
    r.range = 'far';
    r.d.turnStart({ ...ctx, actor: TIDUS });
    expect(r.started).toEqual(['dn', 'df']);
    expect(r.sink.last.eye[0]).toBe(2);
    r.d.actionClose(closing(ctx));
    expect(r.started).toEqual(['dn', 'df', 'df']);
  });

  it('publishes the beat\'s own first pose at once, and one pose per step after it', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    r.d.actionOpen(open(ctx, TIDUS, [EVRAE], 'fire'));
    expect(r.sink.poses.length).toBe(2); // the view's and the opening's
    expect(r.sink.last.eye[0]).toBe(20); // c0, step 0
    r.d.advance(STEP_MS * 1.001); // the beat's step was paid for: this frame owes none
    expect(r.sink.poses.length).toBe(2);
    r.d.advance(STEP_MS * 1.001);
    expect(r.sink.poses.length).toBe(3);
    expect(r.sink.last.eye[0]).toBeCloseTo(20 + 100 / 20, 6); // step 1 of a 20-step blend of 100 units
  });

  it('an opening finds its shot by ability, acting slot and range; the plain Attack of a side has its own row', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    r.d.actionOpen(open(ctx, TIDUS, [EVRAE], 'fire'));
    r.d.actionOpen(open(ctx, WAKKA, [EVRAE], 'fire'));
    r.d.actionOpen(open(ctx, RIKKU, [EVRAE], 'fire'));
    expect(r.started.slice(1)).toEqual(['c0', 'c1', 'c2']);
    r.d.actionOpen(open(ctx, TIDUS, [EVRAE], undefined, 'attack'));
    r.d.actionOpen(open(ctx, EVRAE, [TIDUS], undefined, 'attack'));
    expect(r.started.slice(4)).toEqual(['atk', 'atk']);
    r.range = 'far';
    r.d.actionOpen(open(ctx, TIDUS, [EVRAE], undefined, 'attack'));
    expect(r.started.length).toBe(6); // at far the Attack's route leaves the camera alone: nothing starts
  });

  it('a monster stands in slot m, a reserve member in the slot of the one it replaced', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    r.d.setLineup(['tidus', 'wakka', 'lulu']);
    r.d.actionOpen(open(ctx, subject('lulu', 'party'), [EVRAE], 'fire'));
    expect(r.started[1]).toBe('c2'); // Lulu stands in Rikku's slot
    r.d.actionOpen(open(ctx, EVRAE, [TIDUS], 'evrae-inhale'));
    expect(r.started[2]).toBe('atk'); // the route is slot-free
  });

  it('an ability the table does not have starts nothing and leaves the camera as it is', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    const before = r.sink.poses.length;
    expect(r.d.actionOpen(open(ctx, TIDUS, [EVRAE], 'no-such-ability'))).toBe(true); // live, but nothing new played
    expect(r.started).toEqual(['dn']);
    expect(r.sink.poses.length).toBe(before);
  });

  it('a launch plays on the first hit only, and not again for the later hits of a multi-hit action', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    r.d.actionOpen(open(ctx, TIDUS, [EVRAE], 'fire'));
    r.d.impact(hit(ctx));
    r.d.impact(hit(ctx, TIDUS, 'fire', 1));
    r.d.impact(hit(ctx, TIDUS, 'fire', 2));
    expect(r.started.filter((s) => s === 'fl' || s === 'fl2').length).toBe(1);
    r.d.actionClose(closing(ctx));
    r.d.impact(hit(ctx)); // no action is open: nothing owed
    expect(r.started.filter((s) => s === 'fl' || s === 'fl2').length).toBe(1);
  });

  it('an action that raised no hit owes its launch at the close: it starts it once, and says so', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    r.d.actionOpen(open(ctx, TIDUS, [EVRAE], 'slow'));
    expect(r.d.launchOwed(ctx)).toBe(true);
    expect(r.started[r.started.length - 1]).toBe('ev');
    expect(r.d.launchOwed(ctx)).toBe(false); // once
    r.d.actionOpen(open(ctx, TIDUS, [EVRAE], 'haste'));
    expect(r.d.launchOwed(ctx)).toBe(false); // an ability with no launch shot owes none
  });

  it('the victory plays its camera for the range; the defeat plays one of the three members\' (the dice choose)', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    r.d.victory(ctx);
    expect(['v1', 'v2']).toContain(r.started[r.started.length - 1]);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const q = rig(seed);
      q.d.battleStart(startCtx(ctx));
      q.d.defeat(ctx);
      seen.add(q.started[q.started.length - 1]!);
    }
    expect([...seen].sort()).toEqual(['x0', 'x1', 'x2']);
  });
});

describe('the targets', () => {
  it('tells Evrae, the actor, one other party member by slot, several, and both sides apart', () => {
    const ctx = shotCtx();
    const play = (actor: typeof TIDUS, targets: Array<typeof TIDUS>): string | undefined => {
      const r = rig();
      r.d.battleStart(startCtx(ctx));
      r.d.actionOpen(open(ctx, actor, targets, 'haste'));
      return r.started[1];
    };
    expect(play(TIDUS, [EVRAE])).toBe('hs'); // e
    expect(play(TIDUS, [TIDUS])).toBe('hs'); // s
    expect(play(TIDUS, [WAKKA])).toBe('ha'); // a1
    expect(play(TIDUS, [WAKKA, RIKKU])).toBe('hp'); // p
    expect(play(TIDUS, [TIDUS, WAKKA, RIKKU])).toBe('hp'); // p: the actor among them is still the whole party
    expect(play(TIDUS, [WAKKA, EVRAE])).toBe('hp'); // x
    expect(play(TIDUS, [RIKKU])).toBeUndefined(); // a2: the route has no such cell, and no wildcard for it
  });

  it('falls back through the wildcard forms: a route that does not depend on a dimension answers for any value', () => {
    const table: EvraeShotTable = { ...TABLE, routes: { r: { '**e': [['c0', 1]] } }, rows: { fire: { open: 'r' } } };
    const ctx = shotCtx();
    for (const range of ['near', 'far'] as const) {
      const r = rig(1, table);
      r.range = range;
      r.d.battleStart(startCtx(ctx));
      r.d.actionOpen(open(ctx, RIKKU, [EVRAE], 'fire'));
      expect(r.started[1], range).toBe('c0');
    }
    const r = rig(1, table);
    r.d.battleStart(startCtx(ctx));
    r.d.actionOpen(open(ctx, RIKKU, [WAKKA], 'fire'));
    expect(r.started.length).toBe(1); // another target: no cell
  });
});

describe('the branches', () => {
  it('are drawn by weight from the camera\'s own dice: the same seed plays the same shots, another seed another', () => {
    const run = (seed: number): string[] => {
      const r = rig(seed);
      const ctx = shotCtx();
      r.d.battleStart(startCtx(ctx));
      for (let i = 0; i < 40; i++) {
        r.d.actionOpen(open(ctx, TIDUS, [EVRAE], 'fire'));
        r.d.impact(hit(ctx));
        r.d.actionClose(closing(ctx));
      }
      return r.started.filter((s) => s === 'fl' || s === 'fl2');
    };
    const a = run(7);
    expect(a.length).toBe(40);
    expect(run(7)).toEqual(a);
    expect(run(8)).not.toEqual(a);
    const share = a.filter((s) => s === 'fl').length / a.length;
    expect(share).toBeGreaterThan(0.5); // weights 3 to 1
    expect(share).toBeLessThan(0.97);
  });

  it('never touch Math.random, and draw from stream 14 of the presentation source (a single branch draws nothing)', () => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('the camera used Math.random');
    });
    const r = rig(3);
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    expect(r.d.random.draws).toBe(0); // the default view has one branch
    r.d.actionOpen(open(ctx, TIDUS, [EVRAE], 'fire'));
    expect(r.d.random.draws).toBe(0); // the cast's opening: one branch
    r.d.impact(hit(ctx));
    expect(r.d.random.drawsOf(14)).toBe(1); // the launch: two branches
    expect(r.d.random.draws).toBe(1);
    expect(spy).not.toHaveBeenCalled();
    // the dice are the presentation source, seeded, and the same one for the same seed
    expect(r.d.random).toBeInstanceOf(PresentationRandom);
    expect(r.d.random.seed).toBe(3);
  });
});

describe('time', () => {
  it('a shot is busy until it lands; the beat\'s step is paid for; the steps are counted', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    expect(r.d.busy).toBe(false); // a hard cut has nothing after it
    const base = r.d.steps;
    r.d.actionOpen(open(ctx, TIDUS, [EVRAE], 'fire')); // c0: 20 steps
    expect(r.d.busy).toBe(true);
    expect(r.d.steps).toBe(base + 1);
    for (let i = 0; i < 20; i++) r.d.advance(STEP_MS * 1.001);
    expect(r.d.busy).toBe(true); // the first frame after a beat owes none: 19 steps run
    r.d.advance(STEP_MS * 1.001);
    expect(r.d.busy).toBe(false);
    expect(r.d.steps).toBe(base + 1 + 20);
    expect(r.sink.last.eye[0]).toBeCloseTo(120, 9); // landed on the last key
    const n = r.sink.poses.length;
    r.d.advance(STEP_MS * 1.001); // idle: the pose keeps being published, as the programs' director does
    expect(r.sink.poses.length).toBe(n + 1);
    expect(r.sink.poses[n]).toBe(r.sink.poses[n - 1]); // and it is the same object: nothing is rebuilt
  });

  it('fast play runs about three times as many steps in the same time; a skipping beat runs the shot to its end at once', () => {
    const fast = rig();
    fast.d.battleStart(startCtx(shotCtx('fast')));
    fast.d.actionOpen(open(shotCtx('fast'), TIDUS, [EVRAE], 'fire'));
    const slow = rig();
    slow.d.battleStart(startCtx(shotCtx()));
    slow.d.actionOpen(open(shotCtx(), TIDUS, [EVRAE], 'fire'));
    const f0 = fast.d.steps;
    const s0 = slow.d.steps;
    for (let i = 0; i < 6; i++) {
      fast.d.advance(STEP_MS * 1.001);
      slow.d.advance(STEP_MS * 1.001);
    }
    expect((fast.d.steps - f0) / (slow.d.steps - s0)).toBeGreaterThan(2.5);
    const skip = rig();
    const s = shotCtx('skip');
    skip.d.battleStart(startCtx(s));
    skip.d.actionOpen(open(s, TIDUS, [EVRAE], 'fire'));
    expect(skip.d.busy).toBe(false); // ran to its end at once
    expect(skip.sink.last.eye[0]).toBeCloseTo(120, 9);
  });

  it('a long gap (a tab in the background) does not replay minutes of camera', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    r.d.actionOpen(open(ctx, TIDUS, [EVRAE], 'slow'));
    r.d.launchOwed(ctx); // ev: 25 steps
    const s0 = r.d.steps;
    r.d.advance(60_000);
    expect(r.d.steps - s0).toBeLessThanOrEqual(30);
  });

  it('update() reads the clock it was given', () => {
    let now = 1000;
    const sink = new RecordingSink();
    const d = new TableDirector({ table: TABLE, sink, range: () => 'near', clock: { now: () => now } });
    d.setLineup(LINEUP);
    const ctx = shotCtx();
    d.battleStart(startCtx(ctx));
    d.actionOpen(open(ctx, TIDUS, [EVRAE], 'fire'));
    d.update(); // the first read only sets the clock
    const s0 = d.steps;
    now += 1000; // one second
    d.update();
    expect(d.steps - s0).toBeGreaterThanOrEqual(28);
    expect(d.steps - s0).toBeLessThanOrEqual(30);
  });
});

describe('the airship\'s scenes', () => {
  it('Pull back plays its shot and then Normal for the range it ends in; the scene is running until then', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    r.range = 'far'; // the engine flips the flag as it resolves the order, before the scene is raised
    expect(r.d.rangeChange('pullBack', ctx)).toBe(true);
    expect(r.d.sceneRunning).toBe(true);
    expect(r.started[r.started.length - 1]).toBe('pb');
    for (let i = 0; i < 45; i++) r.d.advance(STEP_MS * 1.001); // 40 steps, and the beat's was paid
    expect(r.d.sceneRunning).toBe(false);
    expect(r.started.slice(-2)).toEqual(['pb', 'df']);
  });

  it('Move in plays the other scene; rangeSettled ends a scene early with Normal; with no scene it does nothing', () => {
    const r = rig();
    const ctx = shotCtx();
    r.d.battleStart(startCtx(ctx));
    r.d.rangeSettled();
    expect(r.started).toEqual(['dn']);
    r.d.rangeChange('moveIn', ctx);
    expect(r.started[r.started.length - 1]).toBe('mi');
    r.d.rangeSettled();
    expect(r.d.sceneRunning).toBe(false);
    expect(r.started.slice(-2)).toEqual(['mi', 'dn']);
  });

  it('a skipping beat runs the scene to its end at once and Normal follows', () => {
    const r = rig();
    const s = shotCtx('skip');
    r.d.battleStart(startCtx(s));
    r.range = 'far';
    r.d.rangeChange('pullBack', s);
    expect(r.d.sceneRunning).toBe(false);
    expect(r.started.slice(-2)).toEqual(['pb', 'df']);
  });
});

describe('the whole-fight shots', () => {
  it('are every shot that is not an action\'s own: the default views, the scenes, the victory and the defeat', () => {
    expect([...TableDirector.wholeFightShots(TABLE)].sort()).toEqual(['dn', 'df', 'pb', 'mi', 'v1', 'v2', 'x0', 'x1', 'x2'].sort());
  });
});
