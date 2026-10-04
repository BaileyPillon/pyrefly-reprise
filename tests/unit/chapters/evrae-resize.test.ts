/**
 * **The second check's M1 (2026-10-04): a window that changes shape after Chapter VIII's battle has bound keeps its old stand-back.**
 *
 * The director read the window's aspect once, at the bind (`nearAspectFor`), so 1440x790 resized to 1440x900 put 1,030 px of
 * the coil inside the turn rail's rect for the rest of the fight (1600x900 to 1024x768: 2,954 px; a fullscreen toggle on a 16:10
 * laptop does it). The director now listens for the window's `resize` (`WindowShape`), waits for the shape to hold still, and
 * follows it: the rigs and the trim at once (never mid range shift), the camera only between beats (no command menu open, nothing
 * forced on a camera that is mid-beat).
 *
 * What this holds, driven through the director's public face only (`bindCamera`, `bindEvrae`, `update`, a stand-in window that
 * fires `resize`): the rigs and Evrae's trim follow a resize (the 16:10 and 4:3 cases, and back to 16:9), only once the window held
 * still, one read for a whole drag, never mid-shift, under an open command menu they are registered but the camera is not moved (the
 * menu keeps its frame, the return to idle that ends the next beat lands on the new stand-back), a camera resting on `idle` with no
 * menu open settles onto the new stand-back (a cut under REDUCE MOTION) while one on any other rig is left alone, nothing happens when
 * the stand-back is the same (16:9 and wider) or when nothing resizes, a resize that lands while Evrae's painting loads is not undone
 * when the load finishes (the placement reads its spot after the load), and the watch is held for Chapter VIII's Evrae on a desktop
 * window only and let go on unbind and dispose.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Evrae is Chapter VIII's boss, the stand-back is its stage, and no FFX-2 chapter
 * binds this director.
 */
import { Group, PerspectiveCamera, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetArtManifest, setArtManifest, type ArtManifest } from '../../../src/engine/ArtManifest.ts';
import { BattleCamera } from '../../../src/engine/BattleCamera.ts';
import { LightRig } from '../../../src/engine/Lighting.ts';
import { EVRAE_AIRSHIP_DECK_RIGS as RIGS } from '../../../src/scenes/evrae-airship-deck.ts';
import { AirshipRangeDirector } from '../../../src/scenes/evrae-airship-director.ts';
import { nearAspectFor, nearDollyFor } from '../../../src/scenes/evrae-airship-aspect.ts';
import { EVRAE_NEAR_SPOT, RANGE_STAGING } from '../../../src/scenes/evrae-airship-range.ts';
import type { AirshipDeck } from '../../../src/scenes/evrae-airship-sky.ts';
import { phoneRig } from '../../../src/scenes/evrae-airship-subjects.ts';

afterEach(() => {
  resetArtManifest();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------------------------------------------------------
// The harness: a window that fires `resize`, a command menu the HUD can open, the director bound to a real BattleCamera
// ---------------------------------------------------------------------------------------------------------------------------

function evraeManifest(): ArtManifest {
  return {
    version: 1,
    generatedAt: 'test',
    subjects: { evrae: { states: ['attack', 'breath-charge', 'hurt', 'idle', 'idle-far', 'idle-near', 'ko'], portrait: false, facing: 'left' } },
    portraits: [],
    backdrops: [],
    pause: [],
    pause2x: [],
    title: [],
    title2x: [],
  } as ArtManifest;
}

function fakeDeck(): AirshipDeck {
  return { group: new Group(), layers: [], wind: 1, setHaze(): void {}, update(): void {}, dispose(): void {} } as unknown as AirshipDeck;
}

function fakeActor() {
  return {
    pose: 'idle',
    u: { rimStrength: { value: 0.7 } },
    extents: { maxExtent: 2.2, minExtent: 0.5, proneAspect: 1.15 },
    lifeState: 'alive',
    position: new Vector3(),
    scale: new Vector3(1, 1, 1),
    userData: {} as Record<string, unknown>,
    poseSize: [10, 5] as [number, number],
    setAlpha(): void {},
    async loadPoses(): Promise<void> {},
  };
}

/** A window stand-in with the `resize` listeners the game's own code registers (`WindowShape`, the renderer, the HUDs). */
function stubWindow(w: number, h: number, phone = false) {
  const listeners = new Set<() => void>();
  const win = {
    innerWidth: w,
    innerHeight: h,
    phone,
    matchMedia: () => ({ matches: win.phone }),
    addEventListener: (type: string, fn: () => void): void => void (type === 'resize' && listeners.add(fn)),
    removeEventListener: (type: string, fn: () => void): void => void (type === 'resize' && listeners.delete(fn)),
  };
  vi.stubGlobal('window', win);
  return {
    listeners,
    win,
    /** What a fullscreen toggle or a dragged edge does: the size changes and `resize` fires. */
    resize(nw: number, nh: number): void {
      win.innerWidth = nw;
      win.innerHeight = nh;
      for (const fn of [...listeners]) fn();
    },
  };
}

/** The HUD's command menu as `menuOpen` reads it (`.ffx-cmd-area` with a row in it): open or closed. */
function stubMenu() {
  const state = { open: false };
  const el = { hidden: false, closest: () => null, getBoundingClientRect: () => ({ width: 320, height: 240 }), querySelector: () => ({}) };
  vi.stubGlobal('document', { querySelectorAll: () => (state.open ? [el] : []) });
  return state;
}

async function bound(id = 'evrae', withFoe = true) {
  setArtManifest(evraeManifest());
  const palette = { sky: 0x6d8fbd, horizon: 0xc7d3e6, ground: 0x7a8394, key: 0xffe0b0, bounce: 0x8894a8 };
  const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
  const camera = new BattleCamera(new PerspectiveCamera(34, 16 / 9, 0.1, 400), { rigs: RIGS as Record<string, never>, initial: 'idle', swayAmplitude: 0 });
  const actor = fakeActor();
  director.bindCamera(camera);
  await director.bindEvrae((withFoe ? actor : null) as never, id); // no foe: Chapter XVIII's face (link 4 binds nothing)
  return { director, camera, actor };
}

type Bound = Awaited<ReturnType<typeof bound>>;

/** Step the scene's frames: the director and the camera, `seconds` of them. */
function frames(b: Bound, seconds: number, dt = 0.05): void {
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    b.director.update(dt);
    b.camera.update(dt);
  }
}

async function settle(): Promise<void> {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

const rigAt = (camera: BattleCamera, name: string): number[] => (camera.getRig(name)!.position as Vector3).toArray();
const authored = (name: 'idle' | 'action' | 'enemy'): number[] => [...RANGE_STAGING.near.rigs[name].position];
const stoodBack = (name: 'idle' | 'action' | 'enemy', aspect: number): number[] => [...phoneRig(RANGE_STAGING.near.rigs[name], { dolly: nearDollyFor(aspect) }).position];
const restAt = (camera: BattleCamera): number[] => camera.restCamera().position.toArray();
const RIGS3 = ['idle', 'action', 'enemy'] as const;

// ---------------------------------------------------------------------------------------------------------------------------

describe('a window that changes shape after the bind (the second check\'s M1)', () => {
  it('1440x790 -> 1440x900: NEAR\'s three rigs stand back for 16:10 and Evrae takes the trim, as a fresh bind at 1440x900 would', async () => {
    const win = stubWindow(1440, 790);
    const b = await bound();
    for (const n of RIGS3) expect(rigAt(b.camera, n), `${n} at 1440x790`).toEqual(authored(n));
    expect(b.actor.position.x).toBe(EVRAE_NEAR_SPOT[0]);

    win.resize(1440, 900);
    frames(b, 1);

    for (const n of RIGS3) {
      expect(rigAt(b.camera, n), `${n} after the resize`).toEqual(stoodBack(n, 1440 / 900));
      expect((b.camera.getRig(n)!.lookAt as Vector3).toArray(), `${n} aim`).toEqual([...RANGE_STAGING.near.rigs[n].lookAt]);
    }
    expect(b.actor.position.x).toBeCloseTo(EVRAE_NEAR_SPOT[0] + nearAspectFor(1440 / 900).dx, 9);
    expect(nearAspectFor(1440 / 900).dx).toBeLessThan(0);
    expect([b.actor.position.y, b.actor.position.z]).toEqual([EVRAE_NEAR_SPOT[1], EVRAE_NEAR_SPOT[2]]);

    // the same stage a window that was 1440x900 from the start gets
    stubWindow(1440, 900);
    const fresh = await bound();
    for (const n of RIGS3) expect(rigAt(b.camera, n), `${n} against a fresh bind`).toEqual(rigAt(fresh.camera, n));
    expect(b.actor.position.x).toBeCloseTo(fresh.actor.position.x, 12);
  });

  it('1600x900 -> 1024x768 (4:3) stands the rigs back to the cap\'s neighbourhood, and 1024x768 -> 1600x900 puts the authored stage back', async () => {
    const win = stubWindow(1600, 900);
    const b = await bound();
    win.resize(1024, 768);
    frames(b, 1);
    for (const n of RIGS3) expect(rigAt(b.camera, n), `${n} at 4:3`).toEqual(stoodBack(n, 1024 / 768));
    expect(nearDollyFor(1024 / 768)).toBeGreaterThan(1.4);
    expect(b.actor.position.x).toBeCloseTo(EVRAE_NEAR_SPOT[0] + nearAspectFor(1024 / 768).dx, 9);

    win.resize(1600, 900);
    frames(b, 1);
    for (const n of RIGS3) expect(rigAt(b.camera, n), `${n} back at 16:9`).toEqual(authored(n));
    expect(b.actor.position.x).toBe(EVRAE_NEAR_SPOT[0]);
  });

  it('1600x900 -> 1280x800 -> 1600x900, and a 16:10 window growing to 16:9 (1440x900 -> 1600x900)', async () => {
    const win = stubWindow(1600, 900);
    const b = await bound();
    win.resize(1280, 800);
    frames(b, 1);
    expect(rigAt(b.camera, 'idle')).toEqual(stoodBack('idle', 1.6));
    win.resize(1600, 900);
    frames(b, 1);
    expect(rigAt(b.camera, 'idle')).toEqual(authored('idle'));

    const win2 = stubWindow(1440, 900);
    const c = await bound();
    expect(rigAt(c.camera, 'idle')).toEqual(stoodBack('idle', 1.6));
    win2.resize(1600, 900);
    frames(c, 1);
    expect(rigAt(c.camera, 'idle')).toEqual(authored('idle'));
    expect(c.actor.position.x).toBe(EVRAE_NEAR_SPOT[0]);
  });

  it('waits for the window to hold still, then reads it once: a long drag is one read, not one per event', async () => {
    const win = stubWindow(1600, 900);
    const b = await bound();
    const add = vi.spyOn(b.camera, 'addRig');
    const move = vi.spyOn(b.camera, 'moveTo');
    // a dragged edge: `resize` every 0.04 s for 0.4 s, the shape changing each time (frames of 0.02 s)
    for (let i = 0; i < 10; i++) {
      win.resize(1600 - 40 * i, 900);
      frames(b, 0.04, 0.02);
    }
    expect(add).not.toHaveBeenCalled();
    expect(rigAt(b.camera, 'idle')).toEqual(authored('idle'));
    frames(b, 0.04, 0.02); // the 0.04 s just stepped plus this: 0.08 s since the last event, not yet
    expect(add).not.toHaveBeenCalled();
    frames(b, 0.1, 0.02); // 0.18 s of quiet: read
    expect(add).toHaveBeenCalledTimes(3); // one registration of the three rigs
    expect(move).toHaveBeenCalledTimes(1); // one settle onto them
    expect(rigAt(b.camera, 'idle')).toEqual(stoodBack('idle', (1600 - 360) / 900));
    frames(b, 3); // and nothing more without another resize
    expect(add).toHaveBeenCalledTimes(3);
    expect(move).toHaveBeenCalledTimes(1);
  });

  it('under an open command menu the rigs and the trim are registered but the camera stays: the menu keeps its frame, and the return to idle that ends the next beat lands on the new stand-back', async () => {
    const win = stubWindow(1440, 790);
    const menu = stubMenu();
    const b = await bound();
    menu.open = true;
    win.resize(1440, 900);
    const move = vi.spyOn(b.camera, 'moveTo');
    const snap = vi.spyOn(b.camera, 'snapTo');
    frames(b, 2);
    // registered at once (the mix plans on it on the calm frames the open menu gives it)...
    for (const n of RIGS3) expect(rigAt(b.camera, n), `${n} registered under the menu`).toEqual(stoodBack(n, 1.6));
    expect(b.actor.position.x).toBeCloseTo(EVRAE_NEAR_SPOT[0] + nearAspectFor(1.6).dx, 9);
    // ...but nothing under the player's hand moves: no move, no cut, the camera's resting pose is the old one
    expect(move).not.toHaveBeenCalled();
    expect(snap).not.toHaveBeenCalled();
    expect(restAt(b.camera)).toEqual(authored('idle'));
    menu.open = false;
    frames(b, 1); // the menu closing moves nothing either: the beat's own moves come next
    expect(move).not.toHaveBeenCalled();
    expect(snap).not.toHaveBeenCalled();
    void b.camera.moveTo('action', 900); // the presenter's beat...
    frames(b, 1);
    void b.camera.moveTo('idle', 620); // ...and its return
    expect(restAt(b.camera)).toEqual(stoodBack('idle', 1.6));
  });

  it('never mid-shift: a resize during a range shift waits for it to finish, and lands on NEAR\'s stage', async () => {
    const win = stubWindow(1440, 790);
    const b = await bound();
    b.director.setRange('far', { immediate: true });
    await settle();
    b.director.setRange('near'); // the shift back to NEAR, in real time
    expect(b.director.shifting).toBe(true);
    win.resize(1440, 900);
    for (let i = 0; i < 24; i++) {
      frames(b, 0.05);
      await settle();
    }
    expect(b.director.shifting).toBe(true); // 1.2 s into a 1.5 s shift
    expect(b.actor.position.x).toBe(EVRAE_NEAR_SPOT[0]);
    for (let i = 0; i < 40 && b.director.shifting; i++) {
      frames(b, 0.05);
      await settle();
    }
    expect(b.director.shifting).toBe(false);
    frames(b, 0.5);
    for (const n of RIGS3) expect(rigAt(b.camera, n), `${n} after the shift`).toEqual(stoodBack(n, 1.6));
    expect(b.actor.position.x).toBeCloseTo(EVRAE_NEAR_SPOT[0] + nearAspectFor(1.6).dx, 9);
  });

  it('at FAR it only keeps the new stand-back: FAR\'s rigs, spot and camera stay as authored, and the swap back to NEAR uses it', async () => {
    const win = stubWindow(1440, 790);
    const b = await bound();
    b.director.setRange('far', { immediate: true });
    await settle();
    const far = RIGS3.map((n) => rigAt(b.camera, n));
    const add = vi.spyOn(b.camera, 'addRig');
    const move = vi.spyOn(b.camera, 'moveTo');
    const snap = vi.spyOn(b.camera, 'snapTo');
    win.resize(1440, 900);
    frames(b, 1);
    expect(add).not.toHaveBeenCalled();
    expect(move).not.toHaveBeenCalled();
    expect(snap).not.toHaveBeenCalled();
    expect(RIGS3.map((n) => rigAt(b.camera, n))).toEqual(far);
    expect(b.actor.position.toArray()).toEqual([...RANGE_STAGING.far.evrae]);
    b.director.setRange('near', { immediate: true });
    await settle();
    for (const n of RIGS3) expect(rigAt(b.camera, n), `${n} back at NEAR`).toEqual(stoodBack(n, 1.6));
    expect(b.actor.position.x).toBeCloseTo(EVRAE_NEAR_SPOT[0] + nearAspectFor(1.6).dx, 9);
  });

  it('a camera mid-beat is left alone: the rigs take the stand-back, and the beat\'s return to idle lands on it', async () => {
    const win = stubWindow(1440, 790);
    const b = await bound();
    void b.camera.moveTo('action', 900);
    expect(b.camera.rigName).toBe('action');
    const move = vi.spyOn(b.camera, 'moveTo');
    const snap = vi.spyOn(b.camera, 'snapTo');
    win.resize(1440, 900);
    frames(b, 0.5); // the beat is still playing (0.9 s)
    expect(b.camera.rigName).toBe('action');
    expect(move).not.toHaveBeenCalled();
    expect(snap).not.toHaveBeenCalled();
    for (const n of RIGS3) expect(rigAt(b.camera, n), `${n} registered`).toEqual(stoodBack(n, 1.6));
    frames(b, 1);
    void b.camera.moveTo('idle', 620); // the presenter's own return
    expect(restAt(b.camera)).toEqual(stoodBack('idle', 1.6));
  });

  it('a camera resting on idle settles onto the new stand-back by a move, and by a cut under REDUCE MOTION', async () => {
    const win = stubWindow(1440, 790);
    const b = await bound();
    expect(b.camera.rigName).toBe('idle');
    const move = vi.spyOn(b.camera, 'moveTo');
    const snap = vi.spyOn(b.camera, 'snapTo');
    win.resize(1440, 900);
    frames(b, 1);
    expect(move).toHaveBeenCalledTimes(1);
    expect(move.mock.calls[0]![0]).toBe('idle');
    expect(snap).not.toHaveBeenCalled();
    expect(restAt(b.camera)).toEqual(stoodBack('idle', 1.6));
    frames(b, 1); // the move finishes
    b.camera.camera.position.toArray().forEach((v, i) => expect(v).toBeCloseTo(stoodBack('idle', 1.6)[i]!, 9));

    const calm = await bound();
    calm.camera.swayOff = () => true;
    const cut = vi.spyOn(calm.camera, 'snapTo');
    const glide = vi.spyOn(calm.camera, 'moveTo');
    win.resize(1280, 1024);
    frames(calm, 1);
    expect(cut).toHaveBeenCalledWith('idle');
    expect(glide).not.toHaveBeenCalled();
  });

  it('changes nothing when the stand-back is the same (16:9 and wider), or when the window never resizes', async () => {
    const win = stubWindow(1600, 900);
    const b = await bound();
    const add = vi.spyOn(b.camera, 'addRig');
    const move = vi.spyOn(b.camera, 'moveTo');
    const snap = vi.spyOn(b.camera, 'snapTo');
    frames(b, 5); // no resize at all
    win.resize(1920, 1080); // same shape, other size
    frames(b, 1);
    win.resize(2560, 1080); // wider
    frames(b, 1);
    expect(add).not.toHaveBeenCalled();
    expect(move).not.toHaveBeenCalled();
    expect(snap).not.toHaveBeenCalled();
    for (const n of RIGS3) expect(rigAt(b.camera, n)).toEqual(authored(n));
    expect(b.actor.position.toArray()).toEqual([...EVRAE_NEAR_SPOT]);
  });

  it('a resize that lands while Evrae\'s painting loads is not undone when the load finishes (the spot is read after the load)', async () => {
    const win = stubWindow(1440, 790);
    const b = await bound();
    let release = (): void => {};
    b.actor.loadPoses = () => new Promise<void>((resolve) => void (release = resolve));
    b.director.sync({ flags: { 'airship.range': 'near', 'airship.breathCharged': true } }); // the Inhale painting: the placement starts and waits on its load
    win.resize(1440, 900);
    frames(b, 1);
    const trimmed = EVRAE_NEAR_SPOT[0] + nearAspectFor(1440 / 900).dx;
    expect(b.actor.position.x).toBeCloseTo(trimmed, 9);
    release();
    await settle();
    expect(b.actor.position.x).toBeCloseTo(trimmed, 9);
  });

  it('keeps a defeated Evrae where it falls (the rigs still follow)', async () => {
    const win = stubWindow(1440, 790);
    const b = await bound();
    b.actor.lifeState = 'down';
    win.resize(1440, 900);
    frames(b, 1);
    expect(b.actor.position.x).toBe(EVRAE_NEAR_SPOT[0]);
    expect(rigAt(b.camera, 'idle')).toEqual(stoodBack('idle', 1.6));
  });

  it('leaves a window that has become a phone to the phone\'s own camera', async () => {
    const win = stubWindow(1440, 790);
    const b = await bound();
    win.win.phone = true;
    win.resize(390, 844);
    frames(b, 1);
    for (const n of RIGS3) expect(rigAt(b.camera, n), `${n} on a phone-shaped window`).toEqual(authored(n));
    expect(b.actor.position.x).toBe(EVRAE_NEAR_SPOT[0]);
  });

  it('is held for Chapter VIII\'s Evrae on a desktop window only: not for a Fin, for no foe, or for a phone', async () => {
    const win = stubWindow(1440, 790);
    const evrae = await bound();
    expect(win.listeners.size).toBe(1);
    await bound('left-fin');
    expect(win.listeners.size).toBe(1); // the Evrae director's, not the Fin's
    await bound('evrae', false);
    expect(win.listeners.size).toBe(1); // nor one with no foe bound
    win.resize(1440, 900);
    const fin = await bound('left-fin');
    frames(fin, 1);
    expect(rigAt(fin.camera, 'idle')).toEqual(authored('idle'));
    frames(evrae, 1);
    expect(rigAt(evrae.camera, 'idle')).toEqual(stoodBack('idle', 1.6));

    const phone = stubWindow(390, 844, true);
    await bound();
    expect(phone.listeners.size).toBe(0);
  });

  it('lets go of the window when Evrae unbinds and when the director is disposed', async () => {
    const win = stubWindow(1440, 900);
    const b = await bound();
    expect(win.listeners.size).toBe(1);
    await b.director.bindEvrae(null);
    expect(win.listeners.size).toBe(0);
    await b.director.bindEvrae(b.actor as never);
    expect(win.listeners.size).toBe(1);
    await b.director.bindEvrae(b.actor as never); // a second bind never adds a second listener
    expect(win.listeners.size).toBe(1);
    b.director.dispose();
    expect(win.listeners.size).toBe(0);
  });
});
