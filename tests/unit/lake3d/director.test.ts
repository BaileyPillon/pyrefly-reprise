/**
 * The flying camera and the beat tap (`src/engine/lake3d/director.ts`, `beats.ts`; FFX only), against a fake battle camera and the presenter's beat contexts: the flights are flown, the camera is never fought for, the
 * beats the director takes are the four it names, and the tap tells the listener each action's lead, its ability and its wind-up.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BattleCamera } from '../../../src/engine/BattleCamera.ts';
import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import type { ActionShot, ActorShot, BattleStartShot, ImpactShot, ShotCtx } from '../../../src/engine/ShotDirector.ts';
import { LUNGE_MS, WINDUP_MAX, tapDirector, type BeatListener } from '../../../src/engine/lake3d/beats.ts';
import { CameraDirector } from '../../../src/engine/lake3d/director.ts';
import { FLY_RIG, OPENING, RIGS, flightLength, winFlight } from '../../../src/engine/lake3d/layout.ts';

/** The parts of the battle camera the director uses, recording what it is told. */
class FakeCam {
  rigName = 'idle';
  roll = 0;
  fov = 32;
  readonly rigs = new Map<string, { position: number[]; lookAt: number[]; fov?: number }>();
  readonly snaps: string[] = [];
  readonly camera = { position: { x: 0, y: 2, z: 10 } };
  addRig(name: string, rig: { position: number[]; lookAt: number[]; fov?: number }): void {
    this.rigs.set(name, rig);
  }
  snapTo(name: string): void {
    this.snaps.push(name);
    this.rigName = name;
    const r = this.rigs.get(name);
    if (r) {
      this.camera.position = { x: r.position[0]!, y: r.position[1]!, z: r.position[2]! };
      if (r.fov !== undefined) this.fov = r.fov;
    }
  }
  setRoll(deg: number): void {
    this.roll = deg;
  }
}
const asCam = (c: FakeCam): BattleCamera => c as unknown as BattleCamera;

function ctxBase(over: Partial<ShotCtx> = {}): ShotCtx {
  const snaps: string[] = [];
  return {
    camera: { moveTo: async () => undefined, snapTo: (r: string) => void snaps.push(r), shake: () => undefined, punch: async () => undefined, _snaps: snaps } as unknown as ShotCtx['camera'],
    speed: 'normal',
    skipping: false,
    ms: (base: number) => base,
    ...over,
  } as ShotCtx;
}
const action = (actorId: string, abilityId: string | undefined, kind = 'attack', over: Partial<ShotCtx> = {}): ActionShot => ({ ...ctxBase(over), actor: { id: actorId, side: actorId === 'wendigo' ? 'enemy' : 'party' }, targets: [{ id: 'tidus', side: 'party' }], action: { kind, abilityId } }) as ActionShot;

const step = (d: CameraDirector, seconds: number, dt = 1 / 60): void => {
  for (let t = 0; t < seconds; t += dt) d.update(dt);
};

afterEach(() => vi.useRealTimers());

describe('CameraDirector.fly', () => {
  it('takes the seat on the first key and writes a pose into the camera every frame', () => {
    const cam = new FakeCam();
    const d = new CameraDirector();
    d.bind(asCam(cam));
    void d.fly(OPENING);
    expect(cam.rigName).toBe(FLY_RIG);
    expect(d.flying).toBe(true);
    expect(d.current).toBe('opening');
    expect(cam.rigs.get(FLY_RIG)!.position).toEqual([...OPENING.keys[0]!.pos]);
    step(d, 1);
    const p = cam.rigs.get(FLY_RIG)!.position;
    expect(p).not.toEqual([...OPENING.keys[0]!.pos]);
  });

  it('flies to the last key, resolves, and hands the camera back level', async () => {
    const cam = new FakeCam();
    const d = new CameraDirector();
    d.bind(asCam(cam));
    const done = d.fly(OPENING);
    step(d, flightLength(OPENING) + 0.1);
    await done;
    expect(d.flying).toBe(false);
    cam.rigs.get(FLY_RIG)!.position.forEach((v, i) => expect(v).toBeCloseTo(RIGS['idle']!.position[i]!, 6));
    expect(cam.roll).toBeCloseTo(0, 6);
    expect(d.flown).toEqual(['opening']);
  });

  it('resolves at awaitAt and keeps flying', async () => {
    const cam = new FakeCam();
    const d = new CameraDirector();
    d.bind(asCam(cam));
    let resolved = false;
    void d.fly(OPENING, { awaitAt: 1 }).then(() => (resolved = true));
    step(d, 0.9);
    await Promise.resolve();
    expect(resolved).toBe(false);
    step(d, 0.2);
    await Promise.resolve();
    expect(resolved).toBe(true);
    expect(d.flying).toBe(true);
  });

  it('flies faster at a higher rate', () => {
    const slow = new FakeCam();
    const fast = new FakeCam();
    const a = new CameraDirector();
    const b = new CameraDirector();
    a.bind(asCam(slow));
    b.bind(asCam(fast));
    void a.fly(OPENING);
    void b.fly(OPENING, { rate: 2 });
    step(a, 2);
    step(b, 1);
    const [x, y, z] = slow.rigs.get(FLY_RIG)!.position;
    const [fx, fy, fz] = fast.rigs.get(FLY_RIG)!.position;
    expect(Math.hypot(x! - fx!, y! - fy!, z! - fz!)).toBeLessThan(0.3); // twice the rate in half the time (to a frame)
  });

  it('ends at once, leaving the camera, when anything else moves it', async () => {
    const cam = new FakeCam();
    const d = new CameraDirector();
    d.bind(asCam(cam));
    const done = d.fly(OPENING);
    step(d, 0.5);
    cam.rigName = 'idle'; // the presenter's own move
    d.update(1 / 60);
    await done;
    expect(d.flying).toBe(false);
    const snaps = cam.snaps.length;
    step(d, 1);
    expect(cam.snaps.length).toBe(snaps); // it does not fight for it
  });

  it('holds the shot when told not to release (the win): the roll stays and the camera stays where the flight ended', () => {
    const cam = new FakeCam();
    const d = new CameraDirector();
    d.bind(asCam(cam));
    const win = winFlight([0, 2, 10]);
    void d.fly(win, { release: false });
    step(d, flightLength(win) + 0.1);
    expect(d.flying).toBe(false);
    expect(cam.rigName).toBe(FLY_RIG);
  });

  it('a new flight replaces one in the air, and nothing happens with no camera bound', async () => {
    const d = new CameraDirector();
    await d.fly(OPENING); // no camera: nothing to fly
    expect(d.flying).toBe(false);
    const cam = new FakeCam();
    d.bind(asCam(cam));
    const first = d.fly(OPENING);
    void d.fly(winFlight([0, 2, 10]));
    await first;
    expect(d.current).toBe('win');
  });
});

describe('the director\'s beats', () => {
  it('flies the opening on battleStart and answers when it lands', async () => {
    const cam = new FakeCam();
    const d = new CameraDirector();
    d.bind(asCam(cam));
    const answer = d.shotDirector.battleStart!({ ...ctxBase(), partyIds: [], boss: null, bossName: null } as BattleStartShot);
    expect(answer).toBeInstanceOf(Promise);
    step(d, flightLength(OPENING) + 0.1);
    await expect(answer).resolves.toBe(true);
  });

  it('snaps to idle at skip speed or with reduced motion, and takes the beat without a flight', () => {
    const d = new CameraDirector();
    d.bind(asCam(new FakeCam()));
    const snaps: string[] = [];
    const ctx = { ...ctxBase({ skipping: true }), partyIds: [], boss: null, bossName: null } as BattleStartShot;
    (ctx.camera as unknown as { snapTo(r: string): void }).snapTo = (r) => void snaps.push(r);
    expect(d.shotDirector.battleStart!(ctx)).toBe(true);
    expect(snaps).toEqual(['idle']);
    expect(d.flying).toBe(false);
  });

  it('flies the Double Punch, the arms going up and an Overdrive, and declines every other action', async () => {
    const cam = new FakeCam();
    const d = new CameraDirector((id) => (id === 'wendigo' ? [2.5, 0, -5.8] : [0, 0, 1.8]));
    d.bind(asCam(cam));
    expect(d.shotDirector.actionOpen!(action('wendigo', 'wendigo-punch'))).toBe(false);
    expect(d.shotDirector.actionOpen!(action('tidus', 'wendigo-haymaker'))).toBe(false);
    expect(d.shotDirector.actionOpen!(action('lake-guardian-a', undefined, 'cast'))).toBe(false);
    const hay = d.shotDirector.actionOpen!(action('wendigo', 'wendigo-haymaker'));
    expect(hay).toBeInstanceOf(Promise);
    expect(d.current).toBe('haymaker');
    step(d, 0.8);
    await expect(hay).resolves.toBe(true);
    const raise = d.shotDirector.actionOpen!(action('wendigo', 'wendigo-raise-arms', 'cast'));
    expect(d.current).toBe('raise');
    step(d, 1.3);
    await expect(raise).resolves.toBe(true);
    const od = d.shotDirector.overdriveStart!(action('tidus', undefined, 'overdrive'));
    expect(d.current).toBe('overdrive');
    step(d, 1);
    await expect(od).resolves.toBe(true);
  });

  it('declines every beat with no camera bound, so the presenter plays its own', () => {
    const d = new CameraDirector();
    expect(d.shotDirector.actionOpen!(action('wendigo', 'wendigo-haymaker'))).toBe(false);
    expect(d.shotDirector.victory!(ctxBase())).toBe(false);
    expect(d.shotDirector.actionClose!({ ...ctxBase(), actor: { id: 'tidus', side: 'party' } } as ActorShot)).toBe(false);
    expect(d.shotDirector.overdriveStart!(action('tidus', undefined, 'overdrive'))).toBe(false);
  });
});

describe('the win and the ice break', () => {
  /** A director whose end seam is a fake: `down` says whether every foe has fallen, `started` counts the starts, `over()` ends the break. */
  function ending(): { d: CameraDirector; cam: FakeCam; state: { down: boolean; started: number }; over(): void } {
    const state = { down: false, started: 0 };
    let over: () => void = () => undefined;
    const d = new CameraDirector(() => null, {
      finished: () => state.down,
      start: () => {
        state.started++;
        return new Promise<void>((resolve) => {
          over = resolve;
        });
      },
    });
    const cam = new FakeCam();
    d.bind(asCam(cam));
    return { d, cam, state, over: () => over() };
  }
  const close = (over: Partial<ShotCtx> = {}): ActorShot => ({ ...ctxBase(over), actor: { id: 'tidus', side: 'party' } }) as ActorShot;

  it('lets an ordinary close be the presenter\'s while a foe still stands', () => {
    const { d, state } = ending();
    expect(d.shotDirector.actionClose!(close())).toBe(false);
    expect(state.started).toBe(0);
    expect(d.breaking).toBe(false);
  });

  it('starts the win and the break at the close after which every foe is down, flies the win flight and holds the beat until the break is over', async () => {
    const { d, cam, state, over } = ending();
    state.down = true;
    let released = false;
    const answer = (d.shotDirector.actionClose!(close()) as Promise<boolean>).then((a) => ((released = true), a));
    expect(state.started).toBe(1);
    expect(d.breaking).toBe(true);
    expect(d.current).toBe('win');
    expect(cam.rigName).toBe(FLY_RIG);
    await Promise.resolve();
    expect(released).toBe(false);
    over();
    await expect(answer).resolves.toBe(true);
  });

  it('plays once: later closes and the victory beat do not start it again, and the victory beat is taken so the presenter\'s own victory shot does not move the camera', () => {
    const { d, state } = ending();
    state.down = true;
    void d.shotDirector.actionClose!(close());
    expect(d.shotDirector.actionClose!(close())).toBe(false);
    expect(d.shotDirector.victory!(ctxBase())).toBe(true);
    expect(state.started).toBe(1);
  });

  it('starts at the victory beat when no close saw the last foe fall (a petrified foe), which the presenter does not wait for', () => {
    const { d, state } = ending();
    expect(d.shotDirector.victory!(ctxBase())).toBe(true);
    expect(state.started).toBe(1);
    expect(d.current).toBe('win');
  });

  it('does not play at skip speed, and with reduced motion the epilogue plays without the camera flying', () => {
    const skip = ending();
    skip.state.down = true;
    expect(skip.d.shotDirector.actionClose!(close({ skipping: true }))).toBe(false);
    expect(skip.d.shotDirector.victory!(ctxBase({ skipping: true }))).toBe(false);
    expect(skip.state.started).toBe(0);
    const calm = ending();
    calm.state.down = true;
    void calm.d.shotDirector.actionClose!(close({ reducedMotion: true }));
    expect(calm.state.started).toBe(1);
    expect(calm.d.flying).toBe(false);
  });

  it('with no end seam (or no camera) the close and the victory are the presenter\'s', () => {
    const d = new CameraDirector();
    d.bind(asCam(new FakeCam()));
    expect(d.shotDirector.actionClose!(close())).toBe(false);
    expect(d.shotDirector.victory!(ctxBase())).toBe(true);
  });
});

describe('the battle HUD during the ice break (phase 4)', () => {
  /** A director with an end seam that never finishes by itself, and a HUD spy on every context. */
  function hudRig(): { d: CameraDirector; down: { value: boolean }; hud: boolean[]; ctx: (over?: Partial<ShotCtx>) => ShotCtx } {
    const down = { value: false };
    const hud: boolean[] = [];
    const d = new CameraDirector(() => null, { finished: () => down.value, start: () => new Promise<void>(() => undefined) });
    d.bind(asCam(new FakeCam()));
    return { d, down, hud, ctx: (over = {}) => ctxBase({ setHud: (v: boolean) => void hud.push(v), ...over }) };
  }
  const closeOf = (ctx: ShotCtx): ActorShot => ({ ...ctx, actor: { id: 'tidus', side: 'party' } }) as ActorShot;

  it('is hidden once, at the close after which every foe is down, and not for an ordinary close', () => {
    const { d, down, hud, ctx } = hudRig();
    expect(d.shotDirector.actionClose!(closeOf(ctx()))).toBe(false);
    expect(hud).toEqual([]);
    down.value = true;
    void d.shotDirector.actionClose!(closeOf(ctx()));
    expect(hud).toEqual([false]);
    d.shotDirector.actionClose!(closeOf(ctx()));
    d.shotDirector.victory!(ctx());
    expect(hud, 'the break plays once, the HUD is hidden once, and nothing here puts it back').toEqual([false]);
  });

  it('is hidden at the victory beat when no close saw the last foe fall, and with reduced motion too (the white fade still plays)', () => {
    const late = hudRig();
    late.d.shotDirector.victory!(late.ctx());
    expect(late.hud).toEqual([false]);
    const calm = hudRig();
    calm.down.value = true;
    void calm.d.shotDirector.actionClose!(closeOf(calm.ctx({ reducedMotion: true })));
    expect(calm.hud).toEqual([false]);
  });

  it('is left alone at skip speed (nothing plays) and for a context that has no HUD hook', () => {
    const skip = hudRig();
    skip.down.value = true;
    skip.d.shotDirector.actionClose!(closeOf(skip.ctx({ skipping: true })));
    skip.d.shotDirector.victory!(skip.ctx({ skipping: true }));
    expect(skip.hud).toEqual([]);
    const plain = hudRig();
    plain.down.value = true;
    expect(() => plain.d.shotDirector.actionClose!(closeOf(ctxBase()))).not.toThrow(); // a test's own context: no setHud
    expect(plain.d.breaking).toBe(true);
  });
});

describe('tapDirector', () => {
  const recorder =(): { events: string[]; listener: BeatListener } => {
    const events: string[] = [];
    return {
      events,
      listener: {
        open: (id, kind, lead, ability) => events.push(`open ${id} ${kind} ${lead.toFixed(3)} ${ability ?? '-'}`),
        windup: () => 0,
        impact: (id, target, heavy) => events.push(`impact ${id} ${target} ${heavy}`),
        close: (id) => events.push(`close ${id}`),
      },
    };
  };

  it('with no inner director answers every beat "not taken" and reports the action, the blow and the close', () => {
    const r = recorder();
    const tap = tapDirector(undefined, r.listener);
    expect(tap.actionOpen!(action('wendigo', 'wendigo-punch'))).toBe(false);
    expect(tap.impact!({ ...ctxBase(), actor: { id: 'wendigo', side: 'enemy' }, target: { id: 'tidus', side: 'party' }, hitIndex: 0, heavy: true } as ImpactShot)).toBe(false);
    expect(tap.actionClose!({ ...ctxBase(), actor: { id: 'wendigo', side: 'enemy' } } as ActorShot)).toBe(false);
    const lead = ((LUNGE_MS * ATTACK_IMPACT) / 1000).toFixed(3);
    expect(r.events).toEqual([`open wendigo attack ${lead} wendigo-punch`, 'impact wendigo tidus true', 'close wendigo']);
  });

  it('tells the listener when the inner director\'s answer has come, not before', async () => {
    const r = recorder();
    let release: (v: boolean) => void = () => undefined;
    const inner = { actionOpen: () => new Promise<boolean>((res) => (release = res)) };
    const tap = tapDirector(inner, r.listener);
    const answer = tap.actionOpen!(action('tidus', undefined));
    expect(r.events).toEqual([]);
    release(true);
    await expect(answer).resolves.toBe(true);
    expect(r.events).toHaveLength(1);
  });

  it('holds the blow for the wind-up of the ids that need one, and tells the listener the longer lead', async () => {
    vi.useFakeTimers();
    const events: string[] = [];
    const listener: BeatListener = { windup: () => 0.8, open: (_id, _kind, lead) => events.push(`lead ${lead.toFixed(2)}`) };
    const tap = tapDirector(undefined, listener, new Set(['wendigo']));
    let settled = false;
    const answer = (tap.actionOpen!(action('wendigo', 'wendigo-punch')) as Promise<boolean>).then((a) => ((settled = true), a));
    expect(events).toEqual([`lead ${(0.8 + (LUNGE_MS * ATTACK_IMPACT) / 1000).toFixed(2)}`]);
    await vi.advanceTimersByTimeAsync(700);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(150);
    await expect(answer).resolves.toBe(false);
  });

  it('never holds longer than the cap, never at skip speed, never for a cast, never for an id with no wind-up', async () => {
    const listener: BeatListener = { windup: () => 5, open: () => undefined };
    const tap = tapDirector(undefined, listener, new Set(['wendigo']));
    vi.useFakeTimers();
    let settled = false;
    void (tap.actionOpen!(action('wendigo', 'wendigo-punch')) as Promise<boolean>).then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(WINDUP_MAX * 1000 + 20);
    expect(settled).toBe(true);
    expect(tap.actionOpen!(action('wendigo', 'wendigo-punch', 'attack', { skipping: true }))).toBe(false);
    expect(tap.actionOpen!(action('wendigo', 'lake-berserk', 'cast'))).toBe(false);
    expect(tap.actionOpen!(action('tidus', undefined))).toBe(false);
  });

  it('survives a listener that throws', () => {
    const tap = tapDirector(undefined, { open: () => { throw new Error('x'); }, impact: () => { throw new Error('y'); } });
    expect(() => tap.actionOpen!(action('tidus', undefined))).not.toThrow();
    expect(() => tap.impact!({ ...ctxBase(), actor: { id: 'tidus', side: 'party' }, target: { id: 'wendigo', side: 'enemy' }, hitIndex: 0, heavy: false } as ImpactShot)).not.toThrow();
  });

  it('keeps the inner director\'s own answers', () => {
    const tap = tapDirector({ victory: () => true }, {});
    expect(tap.victory!(ctxBase())).toBe(true);
    expect(tap.battleStart!({ ...ctxBase(), partyIds: [], boss: null, bossName: null } as BattleStartShot)).toBe(false);
  });
});
