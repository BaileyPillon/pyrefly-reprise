/**
 * **The FFX camera director** (`src/engine/ffxcam/director.ts`): FFX's camera programs driven from our battle beats. Synthetic programs only (rule 8): a made-up encounter whose programs do nothing but
 * move the camera between recognisable places, so every assertion is about which program ran, when, and where the camera is.
 *
 * Pins:
 *
 * 1. **the answers**: `true` for a beat it takes once the FFX camera is live, `false` while it has no programs (the website) or no program for Enter, so the chapter falls back to the normal camera;
 * 2. **the beat map**: battleStart = Enter, turnStart = Select, actionOpen = command accepted then the ability's start requests, the first impact = its launch requests, actionClose = Normal,
 *    victory 66, defeat 67 and a range change = the scene program then Normal; the ability, the plain Attack of a side, a monster's own move and an unknown ability each find their row;
 * 3. **time**: 29.97 steps a second from a clock it is given, the playback speed scales them (fast play about three times as many), a skipped or hurried beat jumps to every program's end state;
 * 4. **the pose** reaches the sink (and a sink that throws costs the shot, never the battle);
 * 5. **randomness** is the camera's own, seeded: the same seed gives the same shots and the battle's RNG is untouched.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { SeededRng } from '../../src/battle/common/rng.ts';
import type { ActionShot, ActorShot, ImpactShot, ShotBeat, ShotCtx, ShotDirector, ShotSubject } from '../../src/engine/ShotDirector.ts';
import { ProgramBook, type ActionRow, type FfxCameraPrograms } from '../../src/engine/ffxcam/book.ts';
import { FfxCameraDirector, LOGIC_HZ, type DirectorOptions } from '../../src/engine/ffxcam/director.ts';
import { D2R, bin, call, jf, jt, near, prog, q, ret, set, sw, v } from './helpers/ffxcamKit.ts';
import { ManualClock, RecordingSink, shotCtx, subject } from './helpers/ffxcamDirectorKit.ts';

const BEATS: readonly ShotBeat[] = ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory'];

/** The made-up encounter. Tags (camera slot): 0 scene, 24/25/28 the default view, 26 the attack view, 27 the cast, 61 accepted, 66 victory, 67 defeat; the fire spell's worker (slot 65, tag 66). */
const DEFAULT_VIEW = prog('default', [
  jf(bin('!=', v('battle:0x240'), 1), 3), // as the real one: a v13 of 1 skips the resets
  call('camResetMove'),
  call('refResetMove'),
  set('battle:0x240', 0),
  jt(bin('==', q('readBtlChrProperty', 20, 30), 3), 10),
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
const ACCEPT = prog('accept', [set('battle:0x240', 1), ret()]);
const ATTACK = prog('attack', [call('refSetPos', 1, 2, 3), call('camSetPolar', 90, 0, 10), ret()]); // eye (1, 2, 13)
/** The cast: a 20-step blend whose end is one of two places by a presentation draw. */
const CAST = prog('cast', [
  call('refSetPos', 0, 0, 0),
  call('camSetPolar', 0, 0, 50),
  call('camMove', 20),
  sw(bin('mod', q('camRand', 0), 2), [[0, 5], [1, 7]], 5),
  ret(),
  call('camSetPolar', 0, 0, 150), // A: eye (150, 0, 0)
  ret(),
  call('camSetPolar', 0, 0, 250), // B: eye (250, 0, 0)
  ret(),
]);
const FIRE_SHOT = prog('fire-shot', [call('refSetPos', 0, 0, 0), call('camSetPolar', 90, 0, 100), call('camMove', 30), call('camSetPolar', 90, 0, 300), call('wait', 5), ret()]); // eye ends (0, 0, 300)
const BREATH_SHOT = prog('breath-shot', [call('refSetPos', 7, 7, 7), call('camSetPolar', 0, 0, 7), ret()]); // eye (14, 7, 7)
const VICTORY = prog('victory', [call('refSetPos', 0, 0, 0), call('camSetPolar', 0, 0, 10), call('camMove', 10), call('camSetPolar', 0, 0, 70), ret()]);
const DEFEAT = prog('defeat', [call('refSetPos', 0, 0, 0), call('camSetPolar', 0, 0, 5), ret()]);
/** The airship scene: v0 == 1 pulls back (60 steps), else moves in (40). */
const SCENE = prog('scene', [
  jt(bin('==', v('battle:0x4'), 1), 6),
  call('refSetPos', 0, 0, 0),
  call('camSetPolar', 0, 0, 500),
  call('camMove', 40),
  call('camSetPolar', 0, 0, 100),
  ret(),
  call('refSetPos', 0, 0, 0),
  call('camSetPolar', 0, 0, 100),
  call('camMove', 60),
  call('camSetPolar', 0, 0, 500),
  ret(),
]);

const TAGS = {
  's:0:0': 'scene',
  's:0:24': 'default',
  's:0:25': 'default',
  's:0:28': 'default',
  's:0:26': 'attack',
  's:0:27': 'cast',
  's:0:61': 'accept',
  's:0:66': 'victory',
  's:0:67': 'defeat',
  's:65:66': 'fire-shot', // command 0x3042 (Fire): worker slot 0x41 = 65, tag 0x042 = 66
  's:74:97': 'breath-shot', // command 0x6061: worker slot 0x4a = 74, tag 0x061 = 97
};

const row = (command: number, ...steps: ActionRow['steps'][number][]): ActionRow => ({ command, steps });
const CAST_STEPS = [{ at: 'start', tags: [27], worker: false }, { at: 'launch', tags: [52], worker: true }] as const;

function encounter(over: Partial<FfxCameraPrograms> = {}, drop: string[] = []): FfxCameraPrograms {
  const all = [DEFAULT_VIEW, ACCEPT, ATTACK, CAST, FIRE_SHOT, BREATH_SHOT, VICTORY, DEFEAT, SCENE].filter((p) => !drop.includes(p.id));
  return {
    encounter: 'synthetic',
    source: 'made up for the tests',
    book: new ProgramBook(all, TAGS, ['s']),
    actions: {
      party: { fire: row(0x3042, ...CAST_STEPS), cheer: row(0x301a, ...CAST_STEPS), 'spiral-cut': row(0x3060, { at: 'start', tags: [27], worker: false }) },
      monster: { 'big-breath': row(0x6061, { at: 'start', tags: [44], worker: false }, { at: 'launch', tags: [45], worker: true }) },
      items: { potion: row(0x2000, { at: 'start', tags: [27], worker: false }) },
      attack: { party: row(0x3000, { at: 'start', tags: [29, 26], worker: true }), monster: row(0x407f, { at: 'start', tags: [49, 26], worker: true }) },
    },
    constants: {},
    range: { tag: 0, variable: 'battle:0x4', chr: 20, distanceProp: 30, pullBack: { value: 1, distance: 3 }, moveIn: { value: 2, distance: 0 } },
    ...over,
  };
}

interface Fixture {
  readonly director: FfxCameraDirector;
  readonly sink: RecordingSink;
  readonly clock: ManualClock;
  readonly started: string[];
  readonly warnings: string[];
}

function fixture(programs: FfxCameraPrograms | null = encounter(), opts: Partial<DirectorOptions> = {}): Fixture {
  const sink = new RecordingSink();
  const clock = new ManualClock();
  const started: string[] = [];
  const warnings: string[] = [];
  const director = new FfxCameraDirector({ programs, sink, clock, seed: 7, onStart: (p) => started.push(p.id), warn: (m) => warnings.push(m), ...opts });
  director.host.setRoster([
    { id: 'tidus', chr: 0, side: 'party' },
    { id: 'lulu', chr: 5, side: 'party' },
    { id: 'evrae', chr: 20, side: 'monster', monsterNumber: 119 },
  ]);
  return { director, sink, clock, started, warnings };
}

const TIDUS = subject('tidus', 'party');
const EVRAE = subject('evrae', 'enemy');
const open = (ctx: ShotCtx, actor: ShotSubject, targets: ShotSubject[], abilityId: string | undefined, commandKind: 'attack' | 'ability' | 'item' | 'overdrive' = 'ability'): ActionShot => ({
  ...ctx,
  actor,
  targets,
  action: { kind: 'cast', abilityId, commandKind },
});
const hit = (ctx: ShotCtx, actor: ShotSubject | undefined, target: ShotSubject, hitIndex = 0, abilityId?: string): ImpactShot => ({
  ...ctx,
  actor,
  action: actor ? { kind: 'cast', abilityId, commandKind: 'ability' } : undefined,
  target,
  hitIndex,
  heavy: false,
});
const closing = (ctx: ShotCtx): ActorShot => ({ ...ctx, actor: TIDUS });
const startShot = (ctx: ShotCtx): Parameters<NonNullable<ShotDirector['battleStart']>>[0] => ({ ...ctx, partyIds: ['tidus'], boss: EVRAE, bossName: 'Evrae' });
const rise = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

describe('the answers', () => {
  it('without programs (the website) it has a handler for every beat and declines all ten, moving nothing', async () => {
    const f = fixture(null);
    const ctx = shotCtx();
    expect(f.director.vm).toBeNull();
    expect(await f.director.battleStart?.(startShot(ctx))).toBe(false);
    expect(await f.director.turnStart?.({ ...ctx, actor: TIDUS })).toBe(false);
    expect(await f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'fire'))).toBe(false);
    expect(f.director.impact?.(hit(ctx, TIDUS, EVRAE, 0, 'fire'))).toBe(false);
    expect(await f.director.actionClose?.(closing(ctx))).toBe(false);
    expect(await f.director.overdriveStart?.(open(ctx, TIDUS, [EVRAE], 'spiral-cut', 'overdrive'))).toBe(false);
    expect(await f.director.overdriveEnd?.(closing(ctx))).toBe(false);
    expect(await f.director.telegraph?.({ ...ctx, enemy: EVRAE, stage: 1 })).toBe(false);
    expect(await f.director.formChange?.({ ...ctx, enemy: EVRAE })).toBe(false);
    expect(await f.director.victory?.(ctx)).toBe(false);
    expect(f.director.defeat(ctx)).toBe(false);
    expect(f.director.rangeChange('pullBack', ctx)).toBe(false);
    expect(f.sink.poses).toHaveLength(0);
    expect(f.director.live).toBe(false);
    expect(() => f.director.update()).not.toThrow();
    expect(() => f.director.advance(1000)).not.toThrow();
  });

  it('has a handler for each of the ten beats', () => {
    const d = fixture().director;
    for (const beat of BEATS) expect(typeof d[beat], beat).toBe('function');
  });

  it('with programs, takes every beat once the FFX camera is live', async () => {
    const f = fixture();
    const ctx = shotCtx();
    expect(await f.director.battleStart?.(startShot(ctx))).toBe(true);
    expect(f.director.live).toBe(true);
    expect(await f.director.turnStart?.({ ...ctx, actor: TIDUS })).toBe(true);
    expect(await f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'fire'))).toBe(true);
    expect(f.director.impact?.(hit(ctx, TIDUS, EVRAE, 0, 'fire'))).toBe(true);
    expect(await f.director.actionClose?.(closing(ctx))).toBe(true);
    expect(await f.director.overdriveStart?.(open(ctx, TIDUS, [EVRAE], 'spiral-cut', 'overdrive'))).toBe(true);
    expect(await f.director.overdriveEnd?.(closing(ctx))).toBe(true);
    expect(await f.director.telegraph?.({ ...ctx, enemy: EVRAE, stage: 1 })).toBe(true);
    expect(await f.director.formChange?.({ ...ctx, enemy: EVRAE })).toBe(true);
    expect(await f.director.victory?.(ctx)).toBe(true);
  });

  it('declines the beats that have no camera of their own until the FFX camera is live', () => {
    const f = fixture();
    const ctx = shotCtx();
    expect(f.director.impact?.(hit(ctx, undefined, EVRAE))).toBe(false);
    expect(f.director.telegraph?.({ ...ctx, enemy: EVRAE, stage: 2 })).toBe(false);
    expect(f.director.overdriveEnd?.(closing(ctx))).toBe(false);
    expect(f.started).toEqual([]);
  });

  it('declines the opening when the book has no Enter, so the chapter falls back to its own camera', () => {
    const f = fixture(encounter({}, ['default']));
    expect(f.director.battleStart?.(startShot(shotCtx()))).toBe(false);
    expect(f.director.live).toBe(false);
    expect(f.sink.poses).toHaveLength(0);
  });

  it('leaves the camera where it is for a beat FFX has no shot for (a telegraph, a form change, an Overdrive\'s end, a hit with no launch shot)', async () => {
    const f = fixture();
    const ctx = shotCtx();
    await f.director.battleStart?.(startShot(ctx));
    const before = f.sink.poses.length;
    f.started.length = 0;
    await f.director.telegraph?.({ ...ctx, enemy: EVRAE, stage: 1 });
    await f.director.formChange?.({ ...ctx, enemy: EVRAE });
    await f.director.overdriveEnd?.(closing(ctx));
    f.director.impact?.(hit(ctx, undefined, EVRAE));
    expect(f.started).toEqual([]);
    expect(f.sink.poses).toHaveLength(before);
  });
});

describe('from beats to requests', () => {
  it('battleStart is Enter: the default view for the range, a hard cut, on the sink at once', () => {
    const f = fixture();
    f.director.battleStart?.(startShot(shotCtx()));
    expect(f.started).toEqual(['default']);
    const pose = f.sink.last;
    near(pose.eye, [110, 0, 0]);
    near(pose.ref, [10, 0, 0]);
    expect(pose.fovDeg).toBeCloseTo(26.38, 2);
    expect(pose.roll).toBe(0);
  });

  it('turnStart is Select: the same default view, for the range as it stands now', () => {
    const f = fixture();
    f.director.battleStart?.(startShot(shotCtx()));
    f.director.host.setProperty(20, 30, 3); // the airship has pulled back
    f.director.turnStart?.({ ...shotCtx(), actor: TIDUS });
    expect(f.started).toEqual(['default', 'default']);
    near(f.sink.last.eye, [300, 0, 0]);
    near(f.sink.last.ref, [500, 0, 0]);
  });

  it('a plain attack: command accepted, then the immediate launch (tag 29, falling back to 26) with the command\'s worker; Normal after', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.started.length = 0;
    f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], undefined, 'attack'));
    expect(f.started).toEqual(['accept', 'attack']);
    expect(f.director.host.command).toBe(0x3000);
    near(f.sink.last.eye, [1, 2, 13]);
    f.director.impact?.(hit(ctx, TIDUS, EVRAE)); // an attack has no launch request: the shot holds
    expect(f.started).toEqual(['accept', 'attack']);
    near(f.sink.last.eye, [1, 2, 13]);
    f.director.actionClose?.(closing(ctx));
    expect(f.started).toEqual(['accept', 'attack', 'default']);
    near(f.sink.last.eye, [110, 0, 0]);
  });

  it('a spell: accepted, the cast (start), the spell\'s own shot on the FIRST hit only (launch, the worker of its command), Normal after', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.started.length = 0;
    f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'fire'));
    expect(f.started).toEqual(['accept', 'cast']);
    expect(f.director.host.command).toBe(0x3042);
    f.director.impact?.(hit(ctx, TIDUS, EVRAE, 0, 'fire'));
    expect(f.started).toEqual(['accept', 'cast', 'fire-shot']);
    f.director.impact?.(hit(ctx, TIDUS, EVRAE, 1, 'fire')); // a multi-hit or multi-target spell launches its shot once
    f.director.impact?.(hit(ctx, TIDUS, subject('lulu', 'party'), 0, 'fire'));
    expect(f.started).toEqual(['accept', 'cast', 'fire-shot']);
    f.director.actionClose?.(closing(ctx));
    expect(f.started).toEqual(['accept', 'cast', 'fire-shot', 'default']);
  });

  it('a launch request whose worker has nothing for the command leaves the cast\'s shot up', () => {
    const f = fixture();
    const ctx = shotCtx('skip');
    f.director.battleStart?.(startShot(ctx));
    f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'cheer')); // Cheer: tag 52 and no worker program in the book
    f.started.length = 0;
    f.director.impact?.(hit(ctx, TIDUS, EVRAE, 0, 'cheer'));
    expect(f.started).toEqual([]);
  });

  it('an Overdrive opens like an action: accepted, then its start request', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.started.length = 0;
    f.director.overdriveStart?.(open(ctx, TIDUS, [EVRAE], 'spiral-cut', 'overdrive'));
    expect(f.started).toEqual(['accept', 'cast']);
    expect(f.director.host.command).toBe(0x3060);
  });

  it('an item is found by its item id', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.started.length = 0;
    f.director.actionOpen?.(open(ctx, TIDUS, [TIDUS], 'potion', 'item'));
    expect(f.started).toEqual(['accept', 'cast']);
    expect(f.director.host.command).toBe(0x2000);
  });

  it('a monster\'s move uses the monster table; its plain Attack the monster\'s Attack', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.started.length = 0;
    f.director.actionOpen?.(open(ctx, EVRAE, [TIDUS], 'big-breath'));
    expect(f.started).toEqual(['accept']); // start tag 44 has no handler in the made-up book
    expect(f.director.host.command).toBe(0x6061);
    f.director.impact?.(hit(ctx, EVRAE, TIDUS, 0, 'big-breath'));
    expect(f.started).toEqual(['accept', 'breath-shot']); // the launch: worker slot 74, tag 97
    near(f.sink.last.eye, [14, 7, 7]);
    f.started.length = 0;
    f.director.actionClose?.(closing(ctx));
    f.director.actionOpen?.(open(ctx, EVRAE, [TIDUS], undefined, 'attack'));
    expect(f.started).toEqual(['default', 'accept', 'attack']);
    expect(f.director.host.command).toBe(0x407f);
  });

  it('an ability it has no row for is accepted and nothing more: the camera stays', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.started.length = 0;
    expect(f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'mystery'))).toBe(true);
    expect(f.started).toEqual(['accept']);
    expect(f.director.host.command).toBe(0);
    near(f.sink.last.eye, [110, 0, 0]);
  });

  it('tells the host who is acting and who is targeted, as FFX character numbers', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE, subject('stranger', 'party')], 'fire'));
    expect(f.director.host.select(-2)).toEqual([0]);
    expect(f.director.host.select(-3)).toEqual([20]); // the stranger is not in the roster: not a character
  });

  it('a hit with no action open starts nothing; the next action still gets its launch', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.started.length = 0;
    f.director.impact?.(hit(ctx, undefined, EVRAE));
    expect(f.started).toEqual([]);
    f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'fire'));
    f.director.impact?.(hit(ctx, TIDUS, EVRAE, 0, 'fire'));
    expect(f.started).toEqual(['accept', 'cast', 'fire-shot']);
  });

  it('victory is tag 66 on the camera slot, and defeat() tag 67 (the seam has no defeat beat)', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.started.length = 0;
    f.director.victory?.(ctx);
    expect(f.started).toEqual(['victory']); // not the Fire worker's tag 66 on slot 65
    f.director.advance(1000); // the victory blend plays out, so the defeat is a clean cut
    expect(f.director.defeat(ctx)).toBe(true);
    expect(f.started).toEqual(['victory', 'defeat']);
    near(f.sink.last.eye, [5, 0, 0]);
  });

  it('the command accepted sets the guard the default view reads: Normal does not cancel a move that is still running (v13 = 1), Select does reset', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'fire')); // accepted: v13 = 1; the cast's 20-step blend is running
    expect(f.director.vm?.vars.get('battle:0x240')).toBe(1);
    f.director.actionClose?.(closing(ctx)); // Normal re-aims the running move: the camera does NOT cut to the default view
    expect(f.director.vm?.vars.get('battle:0x240')).toBe(0);
    expect(f.director.vm?.idle).toBe(false);
    expect(f.sink.last.eye[0]).not.toBe(110);
    f.director.turnStart?.({ ...ctx, actor: TIDUS }); // Select with v13 = 0: resets, then a hard cut
    near(f.sink.last.eye, [110, 0, 0]);
    expect(f.director.vm?.idle).toBe(true);
  });
});

describe('time', () => {
  it('ticks 29.97 steps a second from the clock it is given, and publishes after the steps it ran', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'fire')); // the cast: eye x from 50 over 20 steps
    f.director.update(); // the first reading starts the clock: no time has passed
    const startSteps = f.director.vm?.steps ?? 0;
    f.clock.t = 500;
    f.director.update();
    expect((f.director.vm?.steps ?? 0) - startSteps).toBe(Math.floor(0.5 * LOGIC_HZ - 1)); // half a second owes 14.98 steps, one of them the beat's own, already run
    const now = f.sink.last.eye[0];
    f.clock.t = 1500;
    f.director.update();
    expect(f.sink.last.eye[0]).toBeGreaterThan(now);
  });

  it('a blend plays out in real time: 20 steps take about two thirds of a second', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'fire'));
    f.director.advance(1000 / LOGIC_HZ); // one step
    const early = f.sink.last.eye[0];
    expect(early).toBeLessThan(100);
    f.director.advance(1000);
    const end = f.sink.last.eye[0];
    expect([150, 250]).toContain(Math.round(end));
    f.director.advance(1000);
    expect(f.sink.last.eye[0]).toBe(end); // held
  });

  it('fast playback runs about three times as many steps in the same real time (BattleMoments\' 0.32 scale); normal runs one for one', () => {
    const steps = (speed: 'normal' | 'fast'): number => {
      const f = fixture();
      const ctx = shotCtx(speed);
      f.director.battleStart?.(startShot(ctx));
      f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'fire'));
      const before = f.director.vm?.steps ?? 0;
      f.director.advance(200);
      return (f.director.vm?.steps ?? 0) - before;
    };
    const normal = steps('normal');
    const fast = steps('fast');
    expect(normal).toBe(Math.floor(0.2 * LOGIC_HZ - 1)); // the beat's own step is paid for
    expect(fast).toBe(Math.floor((0.2 * LOGIC_HZ) / 0.32 - 1)); // BattleMoments scales durations by 0.32 at 'fast', so the camera runs 1 / 0.32 times as quick
    expect(fast).toBeGreaterThanOrEqual(3 * normal);
  });

  it('a skipped beat jumps to the end state of every program it starts, with no time passing', () => {
    const f = fixture();
    const ctx = shotCtx('skip');
    f.director.battleStart?.(startShot(ctx));
    near(f.sink.last.eye, [110, 0, 0]);
    f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'fire'));
    expect([150, 250]).toContain(Math.round(f.sink.last.eye[0])); // the cast's blend is over
    expect(f.director.vm?.idle).toBe(true);
    f.director.impact?.(hit(ctx, TIDUS, EVRAE, 0, 'fire'));
    near(f.sink.last.eye, [0, 0, 300], 1e-9); // the spell's 30-step blend and its wait are over
    expect(f.director.vm?.idle).toBe(true);
    f.director.actionClose?.(closing(ctx));
    near(f.sink.last.eye, [110, 0, 0]);
    f.director.victory?.(ctx);
    near(f.sink.last.eye, [70, 0, 0], 1e-9);
  });

  it('a hurried beat (the pacing option collapses every wait) jumps too, though the speed says normal', () => {
    const f = fixture();
    const ctx: ShotCtx = { ...shotCtx(), ms: () => 0 };
    f.director.battleStart?.(startShot(ctx));
    f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'fire'));
    expect(f.director.vm?.idle).toBe(true);
  });

  it('dropping into skip mid-program finishes the program on the next update', async () => {
    const f = fixture();
    f.director.battleStart?.(startShot(shotCtx()));
    f.director.actionOpen?.(open(shotCtx(), TIDUS, [EVRAE], 'fire'));
    expect(f.director.vm?.idle).toBe(false);
    await f.director.overdriveEnd?.(closing(shotCtx('skip'))); // any beat at skip speed carries the new context (it moves nothing itself)
    expect(f.director.vm?.idle).toBe(false);
    f.director.advance(16);
    expect(f.director.vm?.idle).toBe(true);
    expect([150, 250]).toContain(Math.round(f.sink.last.eye[0]));
  });

  it('a long stall runs a bounded number of steps, not minutes of camera', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'fire'));
    const before = f.director.vm?.steps ?? 0;
    f.director.advance(10 * 60 * 1000);
    expect((f.director.vm?.steps ?? 0) - before).toBeLessThanOrEqual(30);
  });

  it('does nothing before the FFX camera is live', () => {
    const f = fixture();
    f.director.advance(5000);
    f.director.update();
    expect(f.sink.poses).toHaveLength(0);
    expect(f.director.vm?.steps).toBe(0);
  });

  it('keeps ticking an idle camera (a recipe follows its actors) and publishes each update', () => {
    const f = fixture();
    f.director.battleStart?.(startShot(shotCtx()));
    const n = f.sink.poses.length;
    f.director.advance(100);
    f.director.advance(100);
    expect(f.sink.poses.length).toBeGreaterThan(n);
  });
});

describe('a range change', () => {
  it('runs the scene program with the selector set and the distance changed, then Normal when it is over: the far default', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.started.length = 0;
    expect(f.director.rangeChange('pullBack', ctx)).toBe(true);
    expect(f.started).toEqual(['scene']);
    expect(f.director.vm?.vars.get('battle:0x4')).toBe(1);
    expect(f.director.host.getProperty(20, 30)).toBe(3);
    near(f.sink.last.eye, [100, 0, 0]); // the scene's first shot
    f.director.advance(1000); // 29 steps in: still moving
    expect(f.started).toEqual(['scene']);
    expect(f.sink.last.eye[0]).toBeGreaterThan(100);
    f.director.advance(1000);
    expect(f.started).toEqual(['scene']); // 59 steps in; the 60-step blend is evaluated through its 61st
    f.director.advance(1000); // the blend ends; Normal follows
    expect(f.started).toEqual(['scene', 'default']);
    near(f.sink.last.eye, [300, 0, 0]); // the far default
    near(f.sink.last.ref, [500, 0, 0]);
    f.director.advance(1000);
    expect(f.started).toEqual(['scene', 'default']); // Normal is raised once
  });

  it('a move in selects the other branch and ends on the near default', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.director.host.setProperty(20, 30, 3);
    f.director.rangeChange('moveIn', ctx);
    expect(f.director.vm?.vars.get('battle:0x4')).toBe(2);
    expect(f.director.host.getProperty(20, 30)).toBe(0);
    f.director.advance(1000);
    f.director.advance(1000);
    expect(f.started.slice(-1)).toEqual(['default']);
    near(f.sink.last.eye, [110, 0, 0]);
  });

  it('rangeSettled ends the scene early with Normal now', () => {
    const f = fixture();
    const ctx = shotCtx();
    f.director.battleStart?.(startShot(ctx));
    f.director.rangeChange('pullBack', ctx);
    f.director.advance(300);
    f.director.rangeSettled();
    expect(f.started.slice(-2)).toEqual(['scene', 'default']);
    near(f.sink.last.eye, [300, 0, 0]);
    f.director.rangeSettled(); // already over: nothing
    expect(f.started.slice(-2)).toEqual(['scene', 'default']);
  });

  it('is skipped to its end when the beat is', () => {
    const f = fixture();
    const ctx = shotCtx('skip');
    f.director.battleStart?.(startShot(ctx));
    f.director.rangeChange('pullBack', ctx);
    expect(f.started).toEqual(['default', 'scene', 'default']); // the scene ran to its end at once, and Normal followed
    near(f.sink.last.eye, [300, 0, 0]);
  });

  it('is false for an encounter with no range game', () => {
    const f = fixture(encounter({ range: null }));
    f.director.battleStart?.(startShot(shotCtx()));
    expect(f.director.rangeChange('pullBack')).toBe(false);
  });
});

describe('the sink', () => {
  it('a sink that throws costs the shot, never the battle: one warning, the director goes on', async () => {
    const warnings: string[] = [];
    const throwing = { apply: (): void => { throw new Error('boom'); } };
    const d = new FfxCameraDirector({ programs: encounter(), sink: throwing, warn: (m) => warnings.push(m) });
    expect(await d.battleStart?.(startShot(shotCtx()))).toBe(true);
    expect(() => d.advance(500)).not.toThrow();
    expect(await d.actionClose?.(closing(shotCtx()))).toBe(true);
    expect(warnings.filter((w) => /sink/.test(w))).toHaveLength(1);
  });

  it('a host that throws mid-shot costs the shot, not the frame loop: advance and update catch it, with one warning', () => {
    const framed = prog('framed', [call('refSetBtl', -2, -1, 0), call('camSetPolar', 0, 0, 10), ret()]); // a recipe: re-solved against the actors every step
    const book = new ProgramBook([framed], { 's:0:24': 'framed' }, ['s']);
    const f = fixture(encounter({ book }));
    f.director.host.setFrame(0, { pos: [0, 0, 0], heading: 0, height: 1, width: 1 });
    f.director.host.setActing(0);
    f.director.battleStart?.(startShot(shotCtx()));
    f.director.host.setSource(() => {
      throw new Error('the actors are gone');
    });
    expect(() => f.director.advance(500)).not.toThrow();
    expect(() => {
      f.clock.t = 1000;
      f.director.update();
    }).not.toThrow();
    expect(f.warnings.filter((w) => /could not advance/.test(w))).toHaveLength(1);
  });

  it('receives FFX units: eye and look-at, the roll in radians, the lens and the vertical field of view', () => {
    const f = fixture();
    f.director.battleStart?.(startShot(shotCtx()));
    const p = f.sink.last;
    expect(Object.keys(p).sort()).toEqual(['eye', 'fovDeg', 'ref', 'roll', 'scrDpt']);
    expect(p.scrDpt).toBe(1024);
    expect(p.fovDeg).toBeCloseTo((2 * Math.atan(240 / 1024)) / D2R, 9);
  });
});

describe('the camera\'s own dice', () => {
  /** The place each of `n` casts ends in, skipped to the end, under `seed`. */
  function casts(seed: number, n: number): number[] {
    const f = fixture(encounter(), { seed });
    const ctx = shotCtx('skip');
    f.director.battleStart?.(startShot(ctx));
    return rise(n).map(() => {
      f.director.actionOpen?.(open(ctx, TIDUS, [EVRAE], 'cheer'));
      const x = f.sink.last.eye[0];
      f.director.actionClose?.(closing(ctx));
      return Math.round(x);
    });
  }

  it('the same seed gives the same shots, another seed other ones, and both ends come up', () => {
    expect(casts(11, 40)).toEqual(casts(11, 40));
    expect(casts(11, 40)).not.toEqual(casts(12, 40));
    expect(new Set(casts(11, 40))).toEqual(new Set([150, 250]));
  });

  it('a whole fight draws nothing from the battle\'s RNG', () => {
    const battle = new SeededRng(11);
    const before = battle.saveState();
    casts(11, 60);
    expect(battle.saveState()).toBe(before);
  });
});
