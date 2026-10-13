/**
 * **The camera keeps its subjects** (`src/engine/ffxcam/faythCamera.ts` with `safetyNet.ts`, `shotSubjects.ts`, `farFit.ts`, `extents.ts`, `frames.ts`; FFX only). Synthetic programs and actors only (rule 8); the party's slots and
 * Evrae's spot are the chapter's staging constants, which are in the repo.
 *
 * What this file pins, through a whole `FaythCamera`:
 *
 * 1. **The net acts on a lost shot and only on one.** A default view that frames nobody is the shot's own for six logic steps and the net's from the seventh (blending in over twelve, then holding the party in
 *    frame); a shot that keeps its subjects reaches the sink exactly as it does with the net off, pose for pose; with the net off, or without default views to re-aim, nothing is touched.
 * 2. **Every intervention is logged**, with the beat, the program and the lost steps.
 * 3. **The FAR fit**: `refSetPos(<the script's FAR look-at>)` is turned into the party's column, the same call with other numbers and every other call are left alone.
 * 4. **The extents**: with the camera folder's camHeight and camWidth a character-relative shot is raised by the game's height, without them by the model's own.
 * 5. **The roster follows the field**: a character on the field is the party for the programs' selectors, one that is not is the reserve.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { ProgramBook, type FfxCameraPrograms } from '../../src/engine/ffxcam/book.ts';
import { FaythCamera, type FaythCameraOptions, type FaythCameraWorld } from '../../src/engine/ffxcam/faythCamera.ts';
import { boxOf, type CameraActor } from '../../src/engine/ffxcam/frames.ts';
import { SEEN_MIN, visibleFraction } from '../../src/engine/ffxcam/framing.ts';
import { SAFETY_NET, type HomeView, type NetEvent } from '../../src/engine/ffxcam/safetyNet.ts';
import type { CameraPose } from '../../src/engine/ffxcam/solver.ts';
import type { ActionShot, ActorShot, BattleStartShot, ShotCtx } from '../../src/engine/ShotDirector.ts';
import { FFX_FAR_VIEW, FFX_NEAR_VIEW, FFX_PARTY_SLOTS } from '../../src/engine/ffx3d/ffxStaging.ts';
import { FFX_UNIT, ffxPoint } from '../../src/engine/ffx3d/ffxWorld.ts';
import { call, jt, bin, near, prog, q, ret } from './helpers/ffxcamKit.ts';
import { RecordingSink, shotCtx, subject } from './helpers/ffxcamDirectorKit.ts';

// ------------------------------------------------------------------ the made-up encounter

/** The default view: near looks at the party's column from the side; far (BattleDistance 3) looks at a point 5,000 units away from everyone, which frames nobody. */
const DEFAULT_VIEW = prog('default', [
  call('camResetMove'),
  call('refResetMove'),
  jt(bin('==', q('readBtlChrProperty', 20, 30), 3), 8),
  call('refSetPos', -20, -45, 80),
  call('camSetPolar', -90, -10, 250),
  call('camSetRoll', 0),
  call('camSetScrDpt', 1024),
  ret(),
  call('refSetPos', 5000, -45, 80),
  call('camSetPolar', -90, -10, 250),
  call('camSetRoll', 0),
  call('camSetScrDpt', 1024),
  ret(),
]);
const ACCEPT = prog('accept', [call('wait', 1), ret()]);
/** A shot that keeps the party: the same aim as the near default. */
const GOOD_SHOT = prog('good-shot', [call('refSetPos', -20, -45, 80), call('camSetPolar', -90, -10, 250), call('camSetRoll', 0), call('camSetScrDpt', 1024), ret()]);
/** A shot that looks at a point 5,000 units from everyone: it frames nobody. */
const AWAY_SHOT = prog('away-shot', [call('refSetPos', 5000, -45, 80), call('camSetPolar', -90, -10, 250), call('camSetRoll', 0), call('camSetScrDpt', 1024), ret()]);
/** A shot at the script's FAR look-at (87, -55, 55), the one the fit moves. */
const FAR_SHOT = prog('far-shot', [call('refSetPos', 87, -55, 55), call('camSetPolar', -105.99998, -6, 250), call('camSetRoll', 0), call('camSetScrDpt', 1024), ret()]);
/** A shot at another look-at: not the FAR one. */
const OTHER_SHOT = prog('other-shot', [call('refSetPos', 60, -55, 55), call('camSetPolar', -105.99998, -6, 250), call('camSetRoll', 0), call('camSetScrDpt', 1024), ret()]);
/** A character-relative shot: the look-at is the acting character raised by one height. */
const BTL_SHOT = prog('btl-shot', [call('refSetBtl', -2, -1, 100, 0, 0, 0), call('camSetPolar', -90, -10, 250), call('camSetRoll', 0), call('camSetScrDpt', 1024), ret()]);

const TAGS = { 's:0:24': 'default', 's:0:25': 'default', 's:0:28': 'default', 's:0:61': 'accept', 's:0:26': 'good-shot', 's:0:27': 'far-shot', 's:0:50': 'other-shot', 's:0:59': 'btl-shot' };

function programs(over: Partial<FfxCameraPrograms> = {}): FfxCameraPrograms {
  return {
    encounter: 'synthetic',
    source: 'made up for the tests',
    book: new ProgramBook([DEFAULT_VIEW, ACCEPT, GOOD_SHOT, FAR_SHOT, OTHER_SHOT, BTL_SHOT], TAGS, ['s']),
    actions: { party: {}, monster: {}, items: {}, attack: { party: { command: 0x3000, steps: [{ at: 'start', tags: [26], worker: false }] } } },
    constants: {},
    range: { tag: 0, variable: 'battle:0x4', chr: 20, distanceProp: 30, pullBack: { value: 1, distance: 3 }, moveIn: { value: 2, distance: 0 } },
    extents: {},
    ...over,
  };
}

// ------------------------------------------------------------------ the fake world

const at = (p: readonly [number, number, number]): { x: number; y: number; z: number } => {
  const w = ffxPoint(p);
  return { x: w.x, y: w.y, z: w.z };
};
/** A party member standing on a slot: 18 FFX units tall and 8 wide, drawn. */
const member = (slot: number): CameraActor => ({ position: at(FFX_PARTY_SLOTS[slot]!), facingDir: -1, height: 18 * FFX_UNIT, width: 8 * FFX_UNIT, shown: true });

class World implements FaythCameraWorld {
  readonly actors = new Map<string, CameraActor>([
    ['tidus', member(0)],
    ['wakka', member(1)],
    ['rikku', member(2)],
    ['evrae', { position: at([-140, -35, 80]), facingDir: 1, height: 109 * FFX_UNIT, width: 351 * FFX_UNIT, shown: true }],
  ]);
  rangeState: { current: 'near' | 'far'; shifting: boolean } | null = { current: 'near', shifting: false };
  actor(id: string): CameraActor | undefined {
    return this.actors.get(id);
  }
  range(): { current: 'near' | 'far'; shifting: boolean } | null {
    return this.rangeState;
  }
  partyFallen(): boolean {
    return false;
  }
  aspect(): number {
    return 16 / 9;
  }
}

const homes: { near: HomeView; far: HomeView } = { near: FFX_NEAR_VIEW, far: FFX_FAR_VIEW };
const STEP = 1 / 29.97;

interface Fixture {
  readonly cam: FaythCamera;
  readonly world: World;
  readonly sink: RecordingSink;
  readonly events: NetEvent[];
}

function fixture(over: Partial<FaythCameraOptions> = {}, extra: Partial<FfxCameraPrograms> = {}): Fixture {
  const world = new World();
  const sink = new RecordingSink();
  const events: NetEvent[] = [];
  const cam = new FaythCamera({ programs: programs(extra), sink, world, seed: 1, warn: () => {}, homes, netLog: (e) => events.push(e), ...over });
  return { cam, world, sink, events };
}

const ctx: ShotCtx = shotCtx();
const startShot = (): BattleStartShot => ({ ...ctx, partyIds: ['tidus'], boss: subject('evrae', 'enemy'), bossName: 'Evrae' });
const opens = (actor = 'tidus', targets = ['evrae']): ActionShot => ({ ...ctx, actor: subject(actor, 'party'), targets: targets.map((t) => subject(t, t === 'evrae' ? 'enemy' : 'party')), action: { kind: 'attack', abilityId: undefined, commandKind: 'attack' } });
const closes = (actor = 'tidus'): ActorShot => ({ ...ctx, actor: subject(actor, 'party') });

/** One logic step (a frame of exactly 1/29.97 s). */
const tick = (f: Fixture, n = 1): void => {
  for (let i = 0; i < n; i++) f.cam.update(STEP);
};

/** The party's boxes in FFX's frame. */
const partyBoxes = (f: Fixture) => ['tidus', 'wakka', 'rikku'].map((id) => boxOf(f.world.actors.get(id)!));
const partyFraction = (f: Fixture, pose: CameraPose): number => Math.min(...partyBoxes(f).map((b) => visibleFraction(pose, b, 16 / 9)));

// ------------------------------------------------------------------ 1. the net acts on a lost shot, and only on one

describe('the net on a lost shot', () => {
  /** Far: the default view frames nobody. */
  function lostFixture(): Fixture {
    const f = fixture();
    f.world.rangeState = { current: 'far', shifting: false };
    f.cam.director.host.setProperty(20, 30, 3);
    return f;
  }

  it('leaves the shot alone for six steps, takes the picture on the seventh, and holds the party in frame once the blend is over', () => {
    const f = lostFixture();
    f.cam.shotDirector.battleStart?.(startShot());
    const raw = f.sink.last;
    expect(partyFraction(f, raw)).toBeLessThan(SEEN_MIN); // the shot frames nobody
    expect(f.cam.net.state).toBe('idle');
    tick(f, SAFETY_NET.triggerSteps - 1);
    expect(f.cam.net.state).toBe('idle');
    expect(f.cam.net.events).toEqual([]);
    tick(f, 2);
    expect(f.cam.net.state).toBe('in');
    tick(f, SAFETY_NET.blendSteps + 2);
    expect(f.cam.net.state).toBe('hold');
    expect(partyFraction(f, f.sink.last)).toBeGreaterThanOrEqual(SAFETY_NET.holdFraction - 1e-9);
    expect(f.sink.last.eye).not.toEqual(raw.eye);
  });

  it('logs the engagement with the beat, the program and the steps it was lost', () => {
    const f = lostFixture();
    f.cam.shotDirector.battleStart?.(startShot());
    tick(f, 10);
    expect(f.events).toHaveLength(1);
    expect(f.events[0]).toMatchObject({ kind: 'engage' });
    expect(f.events[0]?.key.startsWith('battleStart:default:')).toBe(true);
    expect(f.events[0]?.lostSteps).toBeGreaterThan(SAFETY_NET.triggerSteps);
    expect(f.cam.net.engagements).toBe(1);
  });

  it('with the net off, or with no default views to re-aim, the shot reaches the sink untouched', () => {
    for (const over of [{ net: false }, { homes: undefined }] as Array<Partial<FaythCameraOptions>>) {
      const f = lostFixture();
      const g = fixture(over);
      g.world.rangeState = { current: 'far', shifting: false };
      g.cam.director.host.setProperty(20, 30, 3);
      const bare = fixture({ homes: undefined });
      bare.world.rangeState = { current: 'far', shifting: false };
      bare.cam.director.host.setProperty(20, 30, 3);
      g.cam.shotDirector.battleStart?.(startShot());
      bare.cam.shotDirector.battleStart?.(startShot());
      tick(g, 60);
      tick(bare, 60);
      expect(g.sink.poses.length).toBe(bare.sink.poses.length);
      for (let i = 0; i < g.sink.poses.length; i++) expect(g.sink.poses[i]).toEqual(bare.sink.poses[i]);
      expect(g.cam.net.engagements).toBe(0);
      void f;
    }
  });

  it('an action by a figure that is not on the field (Cid) is waiting for nothing: the net acts on the first lost step, and for a drawn actor only on the seventh', async () => {
    const away = { book: new ProgramBook([DEFAULT_VIEW, ACCEPT, AWAY_SHOT], { ...TAGS, 's:0:26': 'away-shot' }, ['s']) };
    const engagedAfter = async (actor: string): Promise<number> => {
      const f = fixture({}, away);
      f.cam.shotDirector.battleStart?.(startShot());
      tick(f, 3);
      await f.cam.shotDirector.actionOpen?.(opens(actor, ['evrae']));
      for (let i = 1; i <= 20; i++) {
        tick(f);
        if (f.cam.net.state !== 'idle') return i;
      }
      return -1;
    };
    const cid = await engagedAfter('cid'); // not in the world: no figure
    const tidus = await engagedAfter('tidus'); // drawn, and the same shot looks away from him and from Evrae
    expect(cid).toBeGreaterThan(0);
    expect(tidus).toBeGreaterThan(0);
    expect(tidus - cid).toBeGreaterThanOrEqual(SAFETY_NET.triggerSteps - SAFETY_NET.triggerStepsNoActor - 1);
  });

  it('a new beat whose shot keeps its subjects ends the net with a cut to that shot', async () => {
    const f = lostFixture();
    f.cam.shotDirector.battleStart?.(startShot());
    tick(f, 30);
    expect(f.cam.net.state).toBe('hold');
    // Tidus attacks: the attack fallback here is a shot that holds the party
    await f.cam.shotDirector.actionOpen?.(opens('tidus', ['evrae']));
    tick(f, 3);
    expect(f.cam.net.state).toBe('idle');
    expect(f.events.map((e) => e.kind)).toEqual(['engage', 'drop']);
    expect(partyFraction(f, f.sink.last)).toBeGreaterThanOrEqual(SEEN_MIN);
  });
});

describe('a shot that keeps its subjects is never touched', () => {
  it('the sink gets the same poses with the net on as with it off, over a whole turn', async () => {
    const run = async (net: boolean): Promise<CameraPose[]> => {
      const f = fixture({ net });
      f.cam.shotDirector.battleStart?.(startShot());
      tick(f, 20);
      f.cam.shotDirector.turnStart?.({ ...ctx, actor: subject('tidus', 'party') });
      tick(f, 10);
      await f.cam.shotDirector.actionOpen?.(opens());
      tick(f, 40);
      f.cam.shotDirector.impact?.({ ...closes(), action: { kind: 'attack', commandKind: 'attack' }, target: subject('evrae', 'enemy'), hitIndex: 0, heavy: false });
      tick(f, 10);
      await f.cam.shotDirector.actionClose?.(closes());
      tick(f, 30);
      return f.sink.poses;
    };
    const on = await run(true);
    const off = await run(false);
    expect(on.length).toBe(off.length);
    expect(on.length).toBeGreaterThan(50);
    for (let i = 0; i < on.length; i++) expect(on[i]).toEqual(off[i]);
  });
});

// ------------------------------------------------------------------ 3. the FAR fit

describe('the FAR fit', () => {
  const farFit = { ref: [87, -55, 55] as const, party: FFX_PARTY_SLOTS };

  it('turns the script\'s FAR look-at into the party\'s column at the script\'s height', async () => {
    const f = fixture({ farFit, net: false }, {});
    f.cam.director.vm!.request({ tags: [27] });
    f.cam.director.vm!.tick();
    near(f.cam.director.vm!.pose().ref, [-20, -55, 80], 1e-4);
    expect(f.cam.director.vm!.pose().fovDeg).toBeCloseTo(26.38, 1);
    // the eye keeps the script's direction and distance: 250 from the look-at on the script's yaw and pitch
    const p = f.cam.director.vm!.pose();
    expect(Math.hypot(p.eye[0] - p.ref[0], p.eye[1] - p.ref[1], p.eye[2] - p.ref[2])).toBeCloseTo(250, 3);
  });

  it('leaves the script\'s own look-at when the fit is not given, and any other look-at when it is', () => {
    const bare = fixture({ net: false });
    bare.cam.director.vm!.request({ tags: [27] });
    bare.cam.director.vm!.tick();
    near(bare.cam.director.vm!.pose().ref, [87, -55, 55], 1e-4);
    const fitted = fixture({ farFit, net: false });
    fitted.cam.director.vm!.request({ tags: [50] });
    fitted.cam.director.vm!.tick();
    near(fitted.cam.director.vm!.pose().ref, [60, -55, 55], 1e-4);
  });
});

// ------------------------------------------------------------------ 4. the extents

describe('the extents', () => {
  /** The acting character's look-at after the character-relative shot: its position raised by its height. */
  const lookAtY = (f: Fixture): number => {
    const host = f.cam.director.host;
    host.setActing(host.chrOf('tidus'));
    f.cam.director.vm!.request({ tags: [59] });
    f.cam.director.vm!.tick();
    return f.cam.director.vm!.pose().ref[1];
  };

  it('with the camera folder\'s camHeight the look-at is raised by the game\'s height', () => {
    const f = fixture({ net: false }, { extents: { '0': { height: 21, width: 7 }, '20': { height: 60, width: 90 } } });
    expect(lookAtY(f)).toBeCloseTo(-35 - 21, 4);
  });

  it('without them it is raised by the figure\'s own measured height (a fit)', () => {
    const f = fixture({ net: false });
    f.world.actors.set('tidus', { ...member(0), height: 25 * FFX_UNIT });
    expect(lookAtY(f)).toBeCloseTo(-35 - 25, 4);
  });

  it('the host answers the programs\' height and width queries with the same numbers', () => {
    const f = fixture({ net: false }, { extents: { '0': { height: 21, width: 7 }, '20': { height: 60, width: 90 } } });
    const host = f.cam.director.host;
    expect(host.actor(0)?.height).toBe(21);
    expect(host.actor(0)?.width).toBe(7);
    expect(host.actor(20)?.height).toBe(60);
    expect(host.actor(20)?.width).toBe(90);
    expect(host.actor(4)?.height).toBeCloseTo(18, 6); // no extent for Wakka's number in this table: his measured height
  });
});

// ------------------------------------------------------------------ 5. the roster follows the field

describe('the roster follows the field', () => {
  it('a character on the field is the party for the programs\' selectors and one that is not is the reserve', async () => {
    const f = fixture({ net: false });
    f.cam.shotDirector.battleStart?.(startShot());
    const host = f.cam.director.host;
    expect(host.select(-14)).toEqual([0, 4, 6]);
    expect([-9, -10, -11].map((s) => host.select(s)[0])).toEqual([2, 3, 5]); // CharacterReserve#1..#3: Auron, Kimahri, Lulu
    f.world.actors.delete('wakka');
    f.world.actors.set('lulu', member(1)); // Lulu stands in the slot Wakka stood in
    await f.cam.shotDirector.actionOpen?.(opens('lulu', ['evrae']));
    expect(host.select(-14)).toEqual([0, 5, 6]); // the party, in the order of its slots: Tidus, Lulu, Rikku
    expect(host.select(-7)).toEqual([5]); // Character#2 is Lulu, in Wakka's place
    expect([-9, -10, -11].map((s) => host.select(s)[0])).toEqual([4, 2, 3]); // and Wakka is in the reserve
  });
});
