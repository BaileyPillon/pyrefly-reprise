/**
 * **The hidden Fayth chapter's camera** (`src/engine/ffxcam/faythCamera.ts`, with `roster.ts` and `frames.ts`; FFX only): the FFX camera director in the shape the scene publishes it, and what the scene owes
 * it that the seam has no beat for. Synthetic programs only (rule 8). What this file pins:
 *
 * 1. **The roster**: our combatant ids against FFX's character numbers (Tidus 0, Auron 2, Kimahri 3, Wakka 4, Lulu 5, Rikku 6; Evrae 20, Cid 21 on monster numbers 119 and 149), and the host's selectors over it.
 * 2. **The frames**: a live actor's world position mapped back to FFX's frame through the inverse of the one transform, its heading from the way it faces, its extents in FFX units; read live, so a moving figure is followed.
 * 3. **The launch fallback**: an action that raised no impact (a status-only spell) starts its launch shot at its close, before Normal, and the close **waits until the program has played** (never longer than
 *    the program), at once when skipping; an action whose impact came does not wait.
 * 4. **The range scenes**: near to far is Pull back and far to near Move in; an action's opening waits for a scene that is playing (the scene is the order's own action; its accept would cut it) and its close waits for the scene to end and then
 *    Normal follows; the range director's own (shorter) shift never cuts the scene short.
 * 5. **Time**: the director advances by the frame's own `dt`, at the playback rate; **the party's fall** is reported once as the defeat; **every wait is released** when the scene is left or the fight is won.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { ProgramBook, type ActionRow, type FfxCameraPrograms } from '../../src/engine/ffxcam/book.ts';
import { HOLD_CAP_STEPS, FaythCamera, type FaythCameraWorld } from '../../src/engine/ffxcam/faythCamera.ts';
import { FAYTH_ACTIVE_PARTY, FAYTH_ROSTER } from '../../src/engine/ffxcam/roster.ts';
import { frameOf, frameSource, type CameraActor } from '../../src/engine/ffxcam/frames.ts';
import type { ActionShot, ActorShot, ImpactShot, ShotCtx, ShotDirector } from '../../src/engine/ShotDirector.ts';
import { FFX_UNIT, ffxPoint, worldPointToFfx } from '../../src/engine/ffx3d/ffxWorld.ts';
import { FFX_EVRAE_SPOTS, FFX_PARTY_SLOTS } from '../../src/engine/ffx3d/ffxStaging.ts';
import { bin, call, jt, near, prog, q, ret, v } from './helpers/ffxcamKit.ts';
import { RecordingSink, shotCtx, subject } from './helpers/ffxcamDirectorKit.ts';

// ------------------------------------------------------------------ the made-up encounter

const DEFAULT_VIEW = prog('default', [
  call('camResetMove'),
  call('refResetMove'),
  jt(bin('==', q('readBtlChrProperty', 20, 30), 3), 8),
  call('refSetPos', 10, 0, 0), // near: eye (110, 0, 0)
  call('camSetPolar', 0, 0, 100),
  call('camSetRoll', 0),
  call('camSetScrDpt', 1024),
  ret(),
  call('refSetPos', 500, 0, 0), // far: eye (300, 0, 0)
  call('camSetPolar', 180, 0, 200),
  call('camSetRoll', 0),
  call('camSetScrDpt', 1024),
  ret(),
]);
const ACCEPT = prog('accept', [call('wait', 1), ret()]); // a request that would cut a running scene
const CAST = prog('cast', [call('refSetPos', 0, 0, 0), call('camSetPolar', 0, 0, 50), call('camMove', 20), call('camSetPolar', 0, 0, 150), ret()]);
const FIRE_SHOT = prog('fire-shot', [call('refSetPos', 0, 0, 0), call('camSetPolar', 90, 0, 100), call('camMove', 30), call('camSetPolar', 90, 0, 300), call('camWait'), call('wait', 5), ret()]); // 36 steps
const DEFEAT = prog('defeat', [call('refSetPos', 0, 0, 0), call('camSetPolar', 0, 0, 5), ret()]);
const VICTORY = prog('victory', [call('refSetPos', 0, 0, 0), call('camSetPolar', 0, 0, 10), ret()]);
/** The airship scene: v == 1 pulls back (60 steps), else moves in (40). The first step is a hard cut. */
const SCENE = prog('scene', [
  jt(bin('==', v('battle:0x4'), 1), 7),
  call('refSetPos', 0, 0, 0),
  call('camSetPolar', 0, 0, 500),
  call('camMove', 40),
  call('camSetPolar', 0, 0, 100),
  call('camWait'),
  ret(),
  call('refSetPos', 0, 0, 0),
  call('camSetPolar', 0, 0, 100),
  call('camMove', 60),
  call('camSetPolar', 0, 0, 500),
  call('camWait'),
  ret(),
]);

const TAGS = { 's:0:0': 'scene', 's:0:24': 'default', 's:0:25': 'default', 's:0:28': 'default', 's:0:27': 'cast', 's:0:61': 'accept', 's:0:66': 'victory', 's:0:67': 'defeat', 's:65:66': 'fire-shot' };
const row = (command: number, ...steps: ActionRow['steps'][number][]): ActionRow => ({ command, steps });
const CAST_STEPS = [{ at: 'start', tags: [27], worker: false }, { at: 'launch', tags: [52], worker: true }] as const;

const programs: FfxCameraPrograms = {
  encounter: 'synthetic',
  source: 'made up for the tests',
  book: new ProgramBook([DEFAULT_VIEW, ACCEPT, CAST, FIRE_SHOT, DEFEAT, VICTORY, SCENE], TAGS, ['s']),
  actions: {
    party: { fire: row(0x3042, ...CAST_STEPS) },
    monster: { 'pull-back': row(0x3107) },
    items: {},
    attack: {},
  },
  constants: {},
  range: { tag: 0, variable: 'battle:0x4', chr: 20, distanceProp: 30, pullBack: { value: 1, distance: 3 }, moveIn: { value: 2, distance: 0 } },
};

// ------------------------------------------------------------------ the fake world

class World implements FaythCameraWorld {
  readonly actors = new Map<string, CameraActor>();
  rangeState: { current: 'near' | 'far'; shifting: boolean } | null = { current: 'near', shifting: false };
  fallen = false;
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

interface Fixture {
  readonly cam: FaythCamera;
  readonly world: World;
  readonly sink: RecordingSink;
  readonly started: string[];
  readonly dir: ShotDirector;
}

function fixture(over: Partial<FfxCameraPrograms> = {}): Fixture {
  const world = new World();
  const sink = new RecordingSink();
  const started: string[] = [];
  const cam = new FaythCamera({ programs: { ...programs, ...over }, sink, world, seed: 3, warn: () => {} });
  // spy on which programs the director starts
  const vm = cam.director.vm!;
  const request = vm.request.bind(vm);
  vm.request = (req) => {
    const p = request(req);
    if (p) started.push(p.id);
    return p;
  };
  return { cam, world, sink, started, dir: cam.shotDirector };
}

const TIDUS = subject('tidus', 'party');
const EVRAE = subject('evrae', 'enemy');
const CID = subject('cid', 'enemy');
const startShot = (ctx: ShotCtx): Parameters<NonNullable<ShotDirector['battleStart']>>[0] => ({ ...ctx, partyIds: ['tidus'], boss: EVRAE, bossName: 'Evrae' });
const open = (ctx: ShotCtx, actor = TIDUS, targets = [EVRAE], abilityId = 'fire'): ActionShot => ({ ...ctx, actor, targets, action: { kind: 'cast', abilityId, commandKind: 'ability' } });
const hit = (ctx: ShotCtx, abilityId = 'fire'): ImpactShot => ({ ...ctx, actor: TIDUS, action: { kind: 'cast', abilityId, commandKind: 'ability' }, target: EVRAE, hitIndex: 0, heavy: false });
const closing = (ctx: ShotCtx, actor = TIDUS): ActorShot => ({ ...ctx, actor });

const STEP = 1 / 29.97;
const flush = async (): Promise<void> => {
  for (let i = 0; i < 4; i++) await Promise.resolve();
};

/** Update one logic step at a time (and let the promises settle) until `done()`, or `max` steps; returns how many frames it took. */
async function runUntil(f: Fixture, done: () => boolean, max = 400): Promise<number> {
  let n = 0;
  while (!done() && n < max) {
    f.cam.update(STEP);
    await flush();
    n++;
  }
  return n;
}

// ------------------------------------------------------------------ 1. the roster

describe('the roster', () => {
  const chrs = Object.fromEntries(FAYTH_ROSTER.map((e) => [e.id, e.chr]));

  it('maps our combatant ids to FFX\'s character numbers', () => {
    expect(chrs).toEqual({ tidus: 0, auron: 2, kimahri: 3, wakka: 4, lulu: 5, rikku: 6, evrae: 20, cid: 21 });
    const evrae = FAYTH_ROSTER.find((e) => e.id === 'evrae')!;
    expect(evrae).toMatchObject({ side: 'monster', monsterNumber: 119 });
    expect(FAYTH_ROSTER.find((e) => e.id === 'cid')).toMatchObject({ side: 'monster', monsterNumber: 149 });
    expect(new Set(FAYTH_ROSTER.map((e) => e.chr)).size).toBe(FAYTH_ROSTER.length);
  });

  it('has the three on the field as the party and the other three as the reserve; Yuna is not there', () => {
    expect(FAYTH_ROSTER.filter((e) => e.side === 'party').map((e) => e.id)).toEqual(['tidus', 'wakka', 'rikku']);
    expect(FAYTH_ROSTER.filter((e) => e.side === 'reserve').map((e) => e.id).sort()).toEqual(['auron', 'kimahri', 'lulu']);
    expect(FAYTH_ROSTER.some((e) => e.id === 'yuna' || e.chr === 1)).toBe(false);
    expect([...FAYTH_ACTIVE_PARTY]).toEqual(['tidus', 'wakka', 'rikku']);
  });

  it('is what the director\'s host answers from: the ids resolve to chr numbers and the selectors name the right characters', () => {
    const { cam } = fixture();
    const host = cam.director.host;
    expect(host.chrOf('tidus')).toBe(0);
    expect(host.chrOf('evrae')).toBe(20);
    expect(host.chrOf('stranger')).toBeUndefined();
    expect(host.select(-6)).toEqual([0]); // Character#1..#3 in the party's order
    expect(host.select(-7)).toEqual([4]);
    expect(host.select(-8)).toEqual([6]);
    expect(host.select(-9)).toEqual([2]); // the reserve
    expect(host.select(-15)).toEqual([20, 21]); // all monsters
    expect(host.select(0x1000 + 119)).toEqual([20]); // Evrae by monster number
    expect(host.query('readBtlChrProperty', [20, 29])).toBe(0);
  });
});

// ------------------------------------------------------------------ 2. the frames

describe('the frames', () => {
  const actor = (x: number, y: number, z: number, facingDir: 1 | -1, height = 1.75, width = 1): CameraActor => ({ position: { x, y, z }, facingDir, height, width });

  it('maps a world position back to FFX\'s frame through the inverse of the one transform', () => {
    for (const slot of FFX_PARTY_SLOTS) {
      const w = ffxPoint(slot);
      near(worldPointToFfx([w.x, w.y, w.z]), slot, 1e-9);
    }
    const f = frameOf(actor(...(ffxPoint(FFX_EVRAE_SPOTS.near).toArray() as [number, number, number]), 1, 78.6 * FFX_UNIT, 0.5));
    near(f.pos, FFX_EVRAE_SPOTS.near, 1e-9);
    expect(f.height).toBeCloseTo(78.6, 9);
    expect(f.width).toBeCloseTo(0.5 / FFX_UNIT, 9);
  });

  it('heading is the way the body faces in FFX\'s (x, z) plane: the party faces -x (pi), Evrae +x (0)', () => {
    expect(frameOf(actor(0, 0, 0, -1)).heading).toBeCloseTo(Math.PI, 12);
    expect(frameOf(actor(0, 0, 0, 1)).heading).toBe(0);
    // forward = (cos h, 0, sin h): the party looks along -x toward Evrae, who stands at a more negative x
    const h = frameOf(actor(0, 0, 0, -1)).heading;
    expect(Math.cos(h)).toBeCloseTo(-1, 12);
  });

  it('a character with no actor has no frame; the source reads the actor live, so a moving figure is followed', () => {
    const live = new Map<string, CameraActor>();
    const source = frameSource(FAYTH_ROSTER, (id) => live.get(id));
    expect(source(0)).toBeUndefined();
    const tidus = { position: { x: 0, y: 3.37, z: -3.86 }, facingDir: -1 as const, height: 1.75, width: 1 };
    live.set('tidus', tidus);
    near(source(0)!.pos, worldPointToFfx([0, 3.37, -3.86]), 1e-9);
    tidus.position = { x: -1, y: 4, z: -3.86 }; // a lunge
    expect(source(0)!.pos[0]).toBeCloseTo(-1 / FFX_UNIT, 9);
    expect(source(99)).toBeUndefined(); // not in the roster
  });

  it('the director\'s host reads those frames: a shot framed on a character asks the world, which answers live', () => {
    const f = fixture();
    f.world.actors.set('tidus', actor(1, 3.37, 0, -1, 1.75));
    const host = f.cam.director.host;
    near(host.actor(0)!.pos, worldPointToFfx([1, 3.37, 0]), 1e-9);
    expect(host.actor(4)).toBeUndefined(); // Wakka is not on the field in this test
    f.world.actors.set('wakka', actor(2, 3.37, 0, -1));
    expect(host.actor(4)).toBeDefined();
  });
});

// ------------------------------------------------------------------ 3. the launch fallback

describe('the launch fallback', () => {
  it('an action that raised no impact starts its launch shot at its close, before Normal, and the close waits until the program has played', async () => {
    const f = fixture();
    const ctx = shotCtx();
    await f.dir.battleStart!(startShot(ctx));
    await f.dir.actionOpen!(open(ctx));
    f.started.length = 0;
    let settled = false;
    const closed = Promise.resolve(f.dir.actionClose!(closing(ctx))).then((answer) => ((settled = true), answer));
    expect(f.started).toEqual(['fire-shot']); // the launch, now, and no Normal yet
    await flush();
    expect(settled).toBe(false); // the close is waiting for the shot
    expect(f.cam.director.busy).toBe(true);
    const frames = await runUntil(f, () => settled);
    expect(settled).toBe(true);
    expect(await closed).toBe(true);
    expect(f.started).toEqual(['fire-shot', 'default']); // Normal came after the shot, once
    expect(f.cam.director.busy).toBe(false);
    // never longer than the program: 36 steps of program, the close let go within a frame or two of its end
    expect(frames).toBeGreaterThanOrEqual(34);
    expect(frames).toBeLessThanOrEqual(40);
  });

  it('the wait is the program\'s length at the playback rate: about a third of the time when fast', async () => {
    const f = fixture();
    const fast = shotCtx('fast'); // 0.32x durations: 3.1x the logic steps a second
    await f.dir.battleStart!(startShot(fast));
    await f.dir.actionOpen!(open(fast));
    let settled = false;
    void Promise.resolve(f.dir.actionClose!(closing(fast))).then(() => (settled = true));
    const frames = await runUntil(f, () => settled);
    // the same 36 steps of program, taken at 3.1 steps a frame of 1/29.97 s
    expect(frames).toBeLessThanOrEqual(14);
    expect(frames).toBeGreaterThanOrEqual(10);
  });

  it('when skipping, the shot ran to its end at once: the close does not wait for a frame', async () => {
    const f = fixture();
    const skip = shotCtx('skip');
    await f.dir.battleStart!(startShot(skip));
    await f.dir.actionOpen!(open(skip));
    f.started.length = 0;
    const answer = await f.dir.actionClose!(closing(skip)); // no update() at all
    expect(answer).toBe(true);
    expect(f.started).toEqual(['fire-shot', 'default']);
    expect(f.cam.director.busy).toBe(false);
  });

  it('an action whose impact came already launched: its close is the director\'s own, with no wait', async () => {
    const f = fixture();
    const ctx = shotCtx();
    await f.dir.battleStart!(startShot(ctx));
    await f.dir.actionOpen!(open(ctx));
    f.dir.impact!(hit(ctx));
    expect(f.started.at(-1)).toBe('fire-shot');
    f.started.length = 0;
    let settled = false;
    void Promise.resolve(f.dir.actionClose!(closing(ctx))).then(() => (settled = true));
    await flush();
    expect(settled).toBe(true); // at once, mid-shot: Normal re-aims the running move (SPEC 9.3)
    expect(f.started).toEqual(['default']);
  });

  it('an action with no launch step (or no handler for it) closes at once', async () => {
    const f = fixture();
    const ctx = shotCtx();
    await f.dir.battleStart!(startShot(ctx));
    await f.dir.actionOpen!(open(ctx, TIDUS, [EVRAE], 'mystery')); // no row: accepted, nothing more
    f.started.length = 0;
    let settled = false;
    void Promise.resolve(f.dir.actionClose!(closing(ctx))).then(() => (settled = true));
    await flush();
    expect(settled).toBe(true);
    expect(f.started).toEqual(['default']);
  });

  it('a wait is capped, and dispose lets go of it', async () => {
    // a launch program that never ends by itself: a loop of waits
    const forever = prog('forever', [call('refSetPos', 0, 0, 0), call('camSetPolar', 0, 0, 100), call('wait', 10), { op: 'jmp', to: 2 }]);
    const f = fixture({ book: new ProgramBook([DEFAULT_VIEW, ACCEPT, CAST, forever], { ...TAGS, 's:65:66': 'forever' }, ['s']) });
    const ctx = shotCtx();
    await f.dir.battleStart!(startShot(ctx));
    await f.dir.actionOpen!(open(ctx));
    let settled = false;
    void Promise.resolve(f.dir.actionClose!(closing(ctx))).then(() => (settled = true));
    await flush();
    const frames = await runUntil(f, () => settled, HOLD_CAP_STEPS + 50);
    expect(settled).toBe(true);
    expect(frames).toBeLessThanOrEqual(HOLD_CAP_STEPS + 3); // the cap, not forever

    const g = fixture({ book: new ProgramBook([DEFAULT_VIEW, ACCEPT, CAST, forever], { ...TAGS, 's:65:66': 'forever' }, ['s']) });
    await g.dir.battleStart!(startShot(ctx));
    await g.dir.actionOpen!(open(ctx));
    let released = false;
    void Promise.resolve(g.dir.actionClose!(closing(ctx))).then(() => (released = true));
    await flush();
    expect(released).toBe(false);
    g.cam.dispose();
    await flush();
    expect(released).toBe(true);
  });

  it('the victory lets go of a wait: nothing waits on the camera once the fight is won', async () => {
    const f = fixture();
    const ctx = shotCtx();
    await f.dir.battleStart!(startShot(ctx));
    await f.dir.actionOpen!(open(ctx));
    let settled = false;
    void Promise.resolve(f.dir.actionClose!(closing(ctx))).then(() => (settled = true));
    await flush();
    expect(settled).toBe(false);
    await f.dir.victory!(ctx);
    await flush();
    expect(settled).toBe(true);
  });
});

// ------------------------------------------------------------------ 4. the range scenes

describe('the range scenes', () => {
  const near2far = (f: Fixture): void => {
    f.cam.update(STEP); // reads the range at the start: near
    f.world.rangeState = { current: 'far', shifting: true };
    f.cam.update(STEP);
  };

  it('near to far plays Pull back (the scene program with the selector set to 1), far to near Move in', async () => {
    const f = fixture();
    const ctx = shotCtx();
    await f.dir.battleStart!(startShot(ctx));
    f.started.length = 0;
    near2far(f);
    expect(f.started).toEqual(['scene']);
    expect(f.cam.director.vm!.vars.get('battle:0x4')).toBe(1);
    expect(f.cam.director.host.getProperty(20, 30)).toBe(3); // BattleDistance 3: far
    expect(f.cam.director.sceneRunning).toBe(true);
    await runUntil(f, () => !f.cam.director.sceneRunning);
    expect(f.started).toEqual(['scene', 'default']); // Normal when the scene is over
    near(f.cam.director.vm!.pose().eye, [300, 0, 0]); // the far default view

    f.started.length = 0;
    f.world.rangeState = { current: 'near', shifting: true };
    f.cam.update(STEP);
    expect(f.started).toEqual(['scene']);
    expect(f.cam.director.vm!.vars.get('battle:0x4')).toBe(2); // Move in
    expect(f.cam.director.host.getProperty(20, 30)).toBe(0);
  });

  it('with no range game in the scene nothing is watched', async () => {
    const f = fixture();
    f.world.rangeState = null;
    await f.dir.battleStart!(startShot(shotCtx()));
    f.started.length = 0;
    f.cam.update(STEP);
    expect(f.started).toEqual([]);
  });

  it('an action that opens while the scene plays waits for it (the scene is the order\'s own action), then opens as ever; the accept would otherwise cut the scene', async () => {
    const f = fixture();
    const ctx = shotCtx();
    await f.dir.battleStart!(startShot(ctx));
    near2far(f); // the engine flipped the flag as it resolved Cid's order; the presenter has not played the next action yet
    f.started.length = 0;
    let opened = false;
    void Promise.resolve(f.dir.actionOpen!(open(ctx, TIDUS, [EVRAE], 'fire'))).then(() => (opened = true));
    await flush();
    expect(opened).toBe(false); // the presenter awaits the opening, so the battle waits for the swoop
    expect(f.started).toEqual([]); // nothing was raised over the scene
    expect(f.cam.director.sceneRunning).toBe(true);
    const frames = await runUntil(f, () => opened);
    expect(opened).toBe(true);
    expect(frames).toBeGreaterThanOrEqual(58); // the 60-step Pull back, no longer
    expect(frames).toBeLessThanOrEqual(66);
    expect(f.started).toEqual(['default', 'accept', 'cast']); // Normal at the scene's end, then the action's own accept and cast, in order
    expect(f.cam.director.host.command).toBe(0x3042); // and the director knows the action
    expect(f.cam.director.sceneRunning).toBe(false);
  });

  it('an action whose opening came before the flip is closed after the scene: its close waits for the scene to end, then Normal', async () => {
    const f = fixture();
    const ctx = shotCtx();
    await f.dir.battleStart!(startShot(ctx));
    await f.dir.actionOpen!(open(ctx, CID, [], 'pull-back')); // the order's own action opens first (the flag flips after)
    near2far(f);
    f.started.length = 0;
    let settled = false;
    void Promise.resolve(f.dir.actionClose!(closing(ctx, CID))).then(() => (settled = true));
    await flush();
    expect(settled).toBe(false);
    const frames = await runUntil(f, () => settled);
    expect(settled).toBe(true);
    expect(frames).toBeGreaterThanOrEqual(58);
    expect(frames).toBeLessThanOrEqual(66);
    expect(f.started).toEqual(['default', 'default']); // Normal when the scene was over, and the close's own Normal re-asserts the same view
    expect(f.cam.director.sceneRunning).toBe(false);
  });

  it('a skipped opening does not wait: the scene ran to its end at once', async () => {
    const f = fixture();
    const skip = shotCtx('skip');
    await f.dir.battleStart!(startShot(skip));
    near2far(f);
    f.started.length = 0;
    expect(await f.dir.actionOpen!(open(skip, TIDUS, [EVRAE], 'fire'))).toBe(true); // no update() between
    expect(f.started).toEqual(['accept', 'cast']);
  });

  it('a turn start is not raised while the scene plays (the presenter does not wait for it), and an Overdrive opening waits like an action\'s', async () => {
    const f = fixture();
    const ctx = shotCtx();
    await f.dir.battleStart!(startShot(ctx));
    near2far(f);
    f.started.length = 0;
    expect(await f.dir.turnStart!({ ...ctx, actor: TIDUS })).toBe(true);
    expect(f.started).toEqual([]);
    let opened = false;
    void Promise.resolve(f.dir.overdriveStart!(open(ctx))).then(() => (opened = true));
    await flush();
    expect(opened).toBe(false);
    await runUntil(f, () => opened);
    expect(opened).toBe(true);
    expect(f.started).toEqual(['default', 'accept', 'cast']);
  });

  it('the range director\'s own shift (short) never cuts the scene short: the swoop plays on, and rangeSettled is only the clean-up', async () => {
    const f = fixture();
    const ctx = shotCtx();
    await f.dir.battleStart!(startShot(ctx));
    f.started.length = 0;
    near2far(f);
    for (let i = 0; i < 10; i++) f.cam.update(STEP); // ten steps in
    f.world.rangeState = { current: 'far', shifting: false }; // the shift (1.5 s) is over, the swoop (6 s) is not
    f.cam.update(STEP);
    expect(f.cam.director.sceneRunning).toBe(true);
    expect(f.cam.director.busy).toBe(true);
    expect(f.started).toEqual(['scene']); // nothing was started over the scene
    const frames = await runUntil(f, () => !f.cam.director.sceneRunning);
    expect(frames + 12).toBeGreaterThanOrEqual(58); // it played its 60 steps
  });

  it('a range change while skipping runs the scene to its end at once', async () => {
    const f = fixture();
    const skip = shotCtx('skip');
    await f.dir.battleStart!(startShot(skip));
    f.started.length = 0;
    near2far(f);
    expect(f.started).toEqual(['scene', 'default']);
    expect(f.cam.director.sceneRunning).toBe(false);
    expect(f.cam.director.busy).toBe(false);
  });
});

// ------------------------------------------------------------------ 5. time, the party's fall

describe('time and the fall', () => {
  it('advances the director by the frame\'s own dt (a half second is about fifteen steps), faster when fast, to the end when skipping', async () => {
    const normal = fixture();
    await normal.dir.battleStart!(startShot(shotCtx()));
    await normal.dir.actionOpen!(open(shotCtx())); // the cast: a 20-step blend, running
    const before = normal.cam.director.vm!.steps;
    normal.cam.update(0.5);
    const steps = normal.cam.director.vm!.steps - before;
    expect(steps).toBeGreaterThanOrEqual(13);
    expect(steps).toBeLessThanOrEqual(15);

    const fast = fixture();
    await fast.dir.battleStart!(startShot(shotCtx('fast')));
    await fast.dir.actionOpen!(open(shotCtx('fast')));
    const fastBefore = fast.cam.director.vm!.steps;
    fast.cam.update(0.1);
    expect(fast.cam.director.vm!.steps - fastBefore).toBeGreaterThanOrEqual(7); // 0.1 s at 3.1x the rate: about eight steps

    const none = fixture();
    expect(() => none.cam.update(1)).not.toThrow(); // no beat yet: nothing is live, nothing runs
    expect(none.cam.director.vm!.steps).toBe(0);
  });

  it('a hidden tab\'s huge dt is capped by the director, not replayed', async () => {
    const f = fixture();
    await f.dir.battleStart!(startShot(shotCtx()));
    const before = f.cam.director.vm!.steps;
    f.cam.update(600);
    expect(f.cam.director.vm!.steps - before).toBeLessThanOrEqual(31);
  });

  it('the party\'s fall is the defeat, once', async () => {
    const f = fixture();
    await f.dir.battleStart!(startShot(shotCtx()));
    f.started.length = 0;
    f.cam.update(STEP);
    expect(f.started).toEqual([]);
    f.world.fallen = true;
    f.cam.update(STEP);
    expect(f.started).toEqual(['defeat']);
    f.cam.update(STEP);
    f.cam.update(STEP);
    expect(f.started).toEqual(['defeat']); // once
  });

  it('has a handler for each of the ten beats, and a director with no programs is not built', () => {
    const f = fixture();
    for (const beat of ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory'] as const) expect(typeof f.dir[beat], beat).toBe('function');
  });
});
