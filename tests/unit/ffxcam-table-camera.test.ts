/**
 * **The table camera** (`src/engine/ffxcam/tableCamera.ts` on `cameraCore.ts`; FFX only): the table director in the shape the scene publishes it, on a made-up table and a fake world. The core is the same code
 * the dev server's FFX camera runs (`ffxcam-fayth.test.ts` pins it against programs), so this file pins that the table is wired into it the same way:
 *
 * 1. **The roster**: the party on the deck in slot order is told to the director, so a reserve member standing in a slot plays that slot's shot.
 * 2. **The launch fallback**: an action that raised no hit starts its launch at its close, **the close waits** until the shot has played and then plays Normal; a skipping beat does not wait; `dispose` releases it.
 * 3. **The range scenes**: a range flip plays the scene; an action's opening waits for it, a turn start is not raised during it, and Normal follows its end.
 * 4. **The defeat** plays once, when the whole party is down.
 * 5. **The tracking net** is on with FFX's default views: a shot that has lost the party for more than six steps is taken over, and the event is logged.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import type { EvraeShotTable, ShotDef, ShotKey } from '../../src/data/ffx/camera/shotTypes.ts';
import type { ActionShot, ActorShot, ShotCtx, ShotDirector } from '../../src/engine/ShotDirector.ts';
import { HOLD_CAP_STEPS, type FaythCameraWorld } from '../../src/engine/ffxcam/cameraCore.ts';
import type { CameraActor } from '../../src/engine/ffxcam/frames.ts';
import type { NetEvent } from '../../src/engine/ffxcam/safetyNet.ts';
import { TableCamera } from '../../src/engine/ffxcam/tableCamera.ts';
import { FFX_EVRAE_SPOTS, FFX_FAR_VIEW, FFX_NEAR_VIEW, FFX_PARTY_SLOTS } from '../../src/engine/ffx3d/ffxStaging.ts';
import { FFX_UNIT, ffxPoint, ffxEye } from '../../src/engine/ffx3d/ffxWorld.ts';
import { RecordingSink, shotCtx, subject } from './helpers/ffxcamDirectorKit.ts';

const key = (step: number, x: number, shape: ShotKey[5] = 1): ShotKey => [step, [x, -50, 100], [0, -40, 0], 0, 1024, shape];
const move = (kind: ShotDef['kind'], x: number, len: number): ShotDef => ({ kind, len, keys: [key(0, x, 0), key(len, x + 100, 1)] });

/** A default view at FFX's own near and far numbers, and shots that play from a made-up eye. */
const NEAR = ffxEye(FFX_NEAR_VIEW);
const view = (eye: readonly number[], ref: readonly number[]): ShotDef => ({ kind: 'default', len: 0, keys: [[0, [eye[0]!, eye[1]!, eye[2]!], [ref[0]!, ref[1]!, ref[2]!], 0, 1024, 0]] });

const TABLE: EvraeShotTable = {
  format: 'echoes-evrae-shots/1',
  shots: {
    dn: view(NEAR, FFX_NEAR_VIEW.ref),
    df: view(ffxEye(FFX_FAR_VIEW), FFX_FAR_VIEW.ref),
    c0: move('action', 20, 20),
    c1: move('action', 30, 20),
    c2: move('action', 40, 20),
    ev: move('action', 170, 25),
    pb: move('scene', 100, 40),
    mi: move('scene', 110, 30),
    v1: move('victory', 120, 10),
    x0: move('defeat', 140, 10),
    away: view([4000, -50, 4000], [4100, -50, 4100]),
  },
  routes: { cast: { '*0*': [['c0', 1]], '*1*': [['c1', 1]], '*2*': [['c2', 1]] }, slowL: { '***': [['ev', 1]] } },
  rows: { fire: { open: 'cast' }, slow: { open: 'cast', launch: 'slowL' } },
  views: { near: 'dn', far: 'df' },
  scenes: { pullBack: [['pb', 1]], moveIn: [['mi', 1]] },
  victory: { n: [['v1', 1]], f: [['v1', 1]] },
  defeat: { n0: [['x0', 1]], n1: [['x0', 1]], n2: [['x0', 1]], f0: [['x0', 1]], f1: [['x0', 1]], f2: [['x0', 1]] },
};

// ------------------------------------------------------------------ the fake world

const body = (p: readonly [number, number, number], facingDir: 1 | -1, height: number, width: number): CameraActor => {
  const w = ffxPoint(p);
  return { position: { x: w.x, y: w.y, z: w.z }, facingDir, height, width };
};

class World implements FaythCameraWorld {
  readonly actors = new Map<string, CameraActor>();
  rangeState: { current: 'near' | 'far'; shifting: boolean } | null = { current: 'near', shifting: false };
  fallen = false;
  constructor(members: readonly string[] = ['tidus', 'wakka', 'rikku']) {
    members.forEach((id, i) => this.actors.set(id, body(FFX_PARTY_SLOTS[i]!, -1, 18 * FFX_UNIT, 5 * FFX_UNIT)));
    this.actors.set('evrae', body(FFX_EVRAE_SPOTS.near, 1, 49 * FFX_UNIT, 114 * FFX_UNIT));
  }
  actor(id: string): CameraActor | undefined {
    return this.actors.get(id);
  }
  range(): { current: 'near' | 'far'; shifting: boolean } | null {
    return this.rangeState;
  }
  partyFallen(): boolean {
    return this.fallen;
  }
}

const STEP = 1 / 29.97;
const flush = async (): Promise<void> => {
  for (let i = 0; i < 4; i++) await Promise.resolve();
};

function rig(opts: { world?: World; table?: EvraeShotTable; net?: boolean } = {}) {
  const world = opts.world ?? new World();
  const sink = new RecordingSink();
  const started: string[] = [];
  const events: NetEvent[] = [];
  const cam = new TableCamera({
    table: opts.table ?? TABLE,
    sink,
    world,
    seed: 1,
    homes: { near: FFX_NEAR_VIEW, far: FFX_FAR_VIEW },
    net: opts.net ?? false,
    netLog: (e) => events.push(e),
    onStart: (id) => started.push(id),
  });
  return { cam, world, sink, started, events, dir: cam.shotDirector as Required<ShotDirector> };
}

const TIDUS = subject('tidus', 'party');
const EVRAE = subject('evrae', 'enemy');
const startShot = (ctx: ShotCtx): Parameters<ShotDirector['battleStart'] & ((c: never) => unknown)>[0] => ({ ...ctx, partyIds: ['tidus'], boss: EVRAE, bossName: 'Evrae' }) as never;
const open = (ctx: ShotCtx, actor = TIDUS, abilityId = 'fire'): ActionShot => ({ ...ctx, actor, targets: [EVRAE], action: { kind: 'cast', abilityId, commandKind: 'ability' } });
const closing = (ctx: ShotCtx, actor = TIDUS): ActorShot => ({ ...ctx, actor });

async function runUntil(update: (dt: number) => void, done: () => boolean, max = 400): Promise<number> {
  let n = 0;
  while (!done() && n < max) {
    update(STEP);
    await flush();
    n++;
  }
  return n;
}

describe('the roster', () => {
  it('tells the director the party on the deck in slot order: a reserve member standing in a slot plays that slot\'s shot', () => {
    const { dir, started } = rig({ world: new World(['tidus', 'wakka', 'lulu']) });
    const ctx = shotCtx();
    dir.battleStart(startShot(ctx));
    dir.actionOpen(open(ctx, subject('lulu', 'party')));
    expect(started).toEqual(['dn', 'c2']); // Lulu is in the third slot
    dir.actionOpen(open(ctx, subject('wakka', 'party')));
    expect(started[2]).toBe('c1');
  });

  it('follows a switch: the line-up is read at every beat', () => {
    const { dir, world, started } = rig();
    const ctx = shotCtx();
    dir.battleStart(startShot(ctx));
    dir.actionOpen(open(ctx, subject('wakka', 'party')));
    expect(started[1]).toBe('c1');
    world.actors.delete('wakka'); // Wakka leaves; Lulu stands where he stood
    world.actors.set('lulu', body(FFX_PARTY_SLOTS[1]!, -1, 17 * FFX_UNIT, 6 * FFX_UNIT));
    dir.actionOpen(open(ctx, subject('lulu', 'party')));
    expect(started[2]).toBe('c1');
  });
});

describe('the launch fallback', () => {
  it('an action that raised no hit starts its launch at its close; the close waits until the shot has played, then plays Normal', async () => {
    const { cam, dir, started } = rig();
    const ctx = shotCtx();
    dir.battleStart(startShot(ctx));
    dir.actionOpen(open(ctx, TIDUS, 'slow'));
    let closed = false;
    void Promise.resolve(dir.actionClose(closing(ctx))).then(() => (closed = true));
    await flush();
    expect(started[started.length - 1]).toBe('ev'); // the launch shot, 25 steps
    expect(closed).toBe(false);
    const steps = await runUntil((dt) => cam.update(dt), () => closed);
    expect(closed).toBe(true);
    expect(steps).toBeGreaterThanOrEqual(24);
    expect(steps).toBeLessThanOrEqual(HOLD_CAP_STEPS);
    expect(started[started.length - 1]).toBe('dn'); // Normal after it
  });

  it('does not wait when the beat is skipping (the shot ran to its end at once), nor for an action that owes nothing', async () => {
    const { dir } = rig();
    const s = shotCtx('skip');
    dir.battleStart(startShot(s));
    dir.actionOpen(open(s, TIDUS, 'slow'));
    expect(await Promise.race([Promise.resolve(dir.actionClose(closing(s))).then(() => 'closed'), flush().then(() => 'waiting')])).toBe('closed');
    const r2 = rig();
    const ctx = shotCtx();
    r2.dir.battleStart(startShot(ctx));
    r2.dir.actionOpen(open(ctx, TIDUS, 'fire')); // no launch row
    expect(await Promise.race([Promise.resolve(r2.dir.actionClose(closing(ctx))).then(() => 'closed'), flush().then(() => 'waiting')])).toBe('closed');
  });

  it('dispose releases every wait', async () => {
    const { cam, dir } = rig();
    const ctx = shotCtx();
    dir.battleStart(startShot(ctx));
    dir.actionOpen(open(ctx, TIDUS, 'slow'));
    let closed = false;
    void Promise.resolve(dir.actionClose(closing(ctx))).then(() => (closed = true));
    await flush();
    expect(closed).toBe(false);
    cam.dispose();
    await flush();
    expect(closed).toBe(true);
  });
});

describe('the range scenes', () => {
  it('a range flip plays the scene; an opening waits for it and a turn start is not raised; Normal follows its end', async () => {
    const { cam, dir, world, started } = rig();
    const ctx = shotCtx();
    dir.battleStart(startShot(ctx));
    cam.update(STEP);
    world.rangeState = { current: 'far', shifting: true }; // the engine resolved Cid's order
    cam.update(STEP);
    expect(started[started.length - 1]).toBe('pb');
    const before = started.length;
    expect(dir.turnStart({ ...ctx, actor: TIDUS })).toBe(true); // answered, not raised
    expect(started.length).toBe(before);
    let opened = false;
    void Promise.resolve(dir.actionOpen(open(ctx))).then(() => (opened = true));
    await flush();
    expect(opened).toBe(false); // the scene is the order's own action: the next one waits for it
    world.rangeState = { current: 'far', shifting: false };
    await runUntil((dt) => cam.update(dt), () => opened);
    expect(opened).toBe(true);
    expect(started.slice(started.indexOf('pb'), started.indexOf('pb') + 3)).toEqual(['pb', 'df', 'c0']); // the scene, Normal for the new range, then the action's own
  });

  it('far to near is Move in', () => {
    const { cam, dir, world, started } = rig();
    const ctx = shotCtx();
    world.rangeState = { current: 'far', shifting: false };
    dir.battleStart(startShot(ctx));
    cam.update(STEP);
    world.rangeState = { current: 'near', shifting: true };
    cam.update(STEP);
    expect(started[started.length - 1]).toBe('mi');
  });
});

describe('the defeat', () => {
  it('plays once when the whole party is down, and not before', () => {
    const { cam, dir, world, started } = rig();
    dir.battleStart(startShot(shotCtx()));
    cam.update(STEP);
    expect(started).toEqual(['dn']);
    world.fallen = true;
    cam.update(STEP);
    cam.update(STEP);
    expect(started).toEqual(['dn', 'x0']);
  });
});

describe('the tracking net', () => {
  it('takes over a shot that has lost the party for more than six steps and logs it; the same shot with the net off reaches the sink as the table says it', () => {
    const away: EvraeShotTable = { ...TABLE, views: { near: 'away', far: 'away' } };
    const off = rig({ table: away, net: false });
    const on = rig({ table: away, net: true });
    for (const r of [off, on]) {
      r.dir.battleStart(startShot(shotCtx()));
      for (let i = 0; i < 20; i++) r.cam.update(STEP);
    }
    expect(off.sink.last.eye[0]).toBe(4000); // the shot, untouched
    expect(on.events.some((e) => e.kind === 'engage')).toBe(true);
    expect(on.sink.last.eye[0]).not.toBe(4000); // the net's picture
    expect(on.cam.net.events.length).toBeGreaterThan(0);
  });

  it('leaves a shot that holds the party alone: the pose is the table\'s own object', () => {
    const { cam, dir, sink, events } = rig({ net: true });
    dir.battleStart(startShot(shotCtx()));
    for (let i = 0; i < 20; i++) cam.update(STEP);
    expect(events).toEqual([]);
    expect(sink.last.eye[0]).toBeCloseTo(NEAR[0], 9);
  });
});
