/**
 * **The pose latch and the render hook** (`src/engine/ffxcam/latch.ts`; the hidden Fayth chapter, FFX only): the order in which the replayed FFX camera reaches the screen. What this file pins:
 *
 * 1. **The sink runs after `BattleCamera.update`.** One frame is run in the order the game runs it (the scene's update and so the director's step, then `BattleCamera.update`, then the MAX mix's view offset, then
 *    the render) against a stand-in for the head of `WebGLRenderer.render` that does what three.js does there (the matrices, then `scene.onBeforeRender`, then it reads the camera's matrices): the camera
 *    the frame draws is the director's pose, with no view offset, and not the battle camera's rig. The **negative control** writes the same pose at the director's step (as a sink without the latch would) and the
 *    battle camera overwrites it, so the test would have caught the wrong order.
 * 2. **One pose, however many renders**, and only for the camera hooked: a second render of the frame writes the same pose; a render with another camera leaves it alone.
 * 3. **Before the first pose, and after unbinding, nothing is written**: the scene's own camera plays.
 * 4. **The latch keeps the director's pose unfiltered and shows the filtered one** (variant B), and counts what it published and presented (a logged frame's proof of the order).
 * 5. **The hook chains and comes off**: a hook that was on the scene still runs; taking ours off puts it back.
 *
 * The program is made up (rule 8). Game case: FFX only.
 */
import { PerspectiveCamera, Scene } from 'three';
import { describe, expect, it } from 'vitest';

import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { ProgramBook, type FfxCameraPrograms } from '../../src/engine/ffxcam/book.ts';
import { FfxCameraDirector } from '../../src/engine/ffxcam/director.ts';
import { PoseLatch, hookBeforeRender } from '../../src/engine/ffxcam/latch.ts';
import { ThreeCameraSink } from '../../src/engine/ffxcam/sink.ts';
import type { CameraPose } from '../../src/engine/ffxcam/solver.ts';
import { clampAzimuth } from '../../src/engine/ffxcam/variant.ts';
import { FFX_UNIT, ffxWorldMatrix } from '../../src/engine/ffx3d/ffxWorld.ts';
import { call, prog, ret } from './helpers/ffxcamKit.ts';
import { HeadOfRender, RecordingSink, shotCtx } from './helpers/ffxcamDirectorKit.ts';

/** The made-up default view: look at (10, 0, 0) from 100 away on the +x side, so the eye is FFX (110, 0, 0). */
const DEFAULT_VIEW = prog('default', [call('refSetPos', 10, 0, 0), call('camSetPolar', 0, 0, 100), call('camSetRoll', 0), call('camSetScrDpt', 1024), ret()]);

const programs: FfxCameraPrograms = {
  encounter: 'synthetic',
  source: 'made up for the tests',
  book: new ProgramBook([DEFAULT_VIEW], { 's:0:24': 'default' }, ['s']),
  actions: { party: {}, monster: {}, items: {}, attack: {} },
  constants: {},
  range: null,
  extents: {},
};

/** The battle camera's own rig: nowhere near the FFX eye. */
const RIG = { position: [0, 3, 9] as [number, number, number], lookAt: [0, 1, 0] as [number, number, number], fov: 34 };

interface Frame {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly battle: BattleCamera;
  readonly director: FfxCameraDirector;
  readonly latch: PoseLatch;
  readonly renderer: HeadOfRender;
  /** One frame in the game's order: the scene's update (the director's step), the battle camera, the mix's view offset, the render. */
  run(dt?: number): void;
}

function setup(opts: { hook?: boolean; eager?: boolean; filter?: (p: CameraPose) => CameraPose } = {}): Frame {
  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 16 / 9, 0.1, 400);
  const battle = new BattleCamera(camera, { rigs: { idle: RIG }, initial: 'idle' });
  const latch = new PoseLatch(opts.filter ?? null);
  const sink = new ThreeCameraSink(camera, ffxWorldMatrix(), { clearViewOffset: true });
  latch.bind(sink);
  const director = new FfxCameraDirector({ programs, sink: opts.eager ? sink : latch, seed: 1 });
  if (opts.hook !== false) hookBeforeRender(scene, camera, () => latch.present());
  const renderer = new HeadOfRender();
  const frame: Frame = {
    scene,
    camera,
    battle,
    director,
    latch,
    renderer,
    run(dt = 1 / 60): void {
      director.advance(dt * 1000); // the scene's update: the director steps and publishes
      battle.update(dt); // BattleCamera.update: position, aim and roll, every frame
      camera.setViewOffset(1920, 1080, -77, -43, 1920, 1080); // the MAX mix's lens shift (`framing.applyLens`), after the rig
      renderer.render(scene, camera);
    },
  };
  return frame;
}

const eyeWorld = (): number[] => [110 * FFX_UNIT, 0, 0]; // the FFX eye (110, 0, 0) through the one transform: (x, -y, -z) * FFX_UNIT
const close = (got: readonly number[], want: readonly number[], digits = 6): void => want.forEach((w, i) => expect(got[i], `component ${i}`).toBeCloseTo(w, digits));

describe('the sink runs after BattleCamera.update', () => {
  it('a frame draws the director\'s pose, with no view offset, and not the battle camera\'s rig', () => {
    const f = setup();
    f.director.battleStart?.({ ...shotCtx(), partyIds: [], boss: null, bossName: null }); // Enter: the default view, a hard cut
    f.run();
    close(f.renderer.last.position, eyeWorld());
    expect(f.renderer.last.fov).toBeCloseTo(26.3812, 3);
    expect(f.renderer.last.viewEnabled).toBe(false); // the mix's lens shift was cleared at the render
    // the battle camera did write its own rig that frame: it is the sink that put the director's pose over it
    expect(Math.abs(f.camera.position.x - RIG.position[0])).toBeGreaterThan(5);
    // and the matrices the draw reads are the director's pose's, not the rig's: a second camera given the same pose through a sink of its own has the same view matrix
    const probe = new PerspectiveCamera(34, 16 / 9, 0.1, 400);
    new ThreeCameraSink(probe, ffxWorldMatrix()).apply(f.director.vm!.pose());
    close(f.renderer.last.inverse, probe.matrixWorldInverse.toArray(), 5);
  });

  it('every frame: the pose is written once per render, and holds while the director has nothing new', () => {
    const f = setup();
    f.director.battleStart?.({ ...shotCtx(), partyIds: [], boss: null, bossName: null });
    for (let i = 0; i < 5; i++) f.run();
    expect(f.latch.presented).toBe(5);
    expect(f.latch.published).toBeGreaterThanOrEqual(1); // the beat's pose, and one per logic step the frames owed (29.97 a second): the same pose, the program being over
    for (const d of f.renderer.drawn) close(d.position, eyeWorld());
  });

  it('negative control: written at the director\'s step, as a sink without the latch would, the same pose is overwritten by the battle camera', () => {
    const f = setup({ hook: false, eager: true });
    f.director.battleStart?.({ ...shotCtx(), partyIds: [], boss: null, bossName: null }); // the eager sink wrote the pose now...
    f.run(); // ...and BattleCamera.update (and the mix) overwrote it before the draw
    expect(f.renderer.last.position[0]).toBeCloseTo(RIG.position[0], 0); // the rig, not the pose
    expect(f.renderer.last.viewEnabled).toBe(true);
    expect(Math.abs(f.renderer.last.position[0]! - eyeWorld()[0]!)).toBeGreaterThan(5);
  });

  it('a logged frame: the director published in the logic and the camera was written at the render, in that order', () => {
    const f = setup();
    const log: string[] = [];
    const publish = f.latch.apply.bind(f.latch);
    f.latch.apply = (pose) => (log.push('director publishes'), publish(pose));
    const present = f.latch.present.bind(f.latch);
    f.latch.present = () => (log.push('sink writes the camera'), present());
    const update = f.battle.update.bind(f.battle);
    f.battle.update = (dt) => (log.push('BattleCamera.update'), update(dt));
    f.director.battleStart?.({ ...shotCtx(), partyIds: [], boss: null, bossName: null });
    f.run();
    expect(log).toEqual(['director publishes', 'BattleCamera.update', 'sink writes the camera']);
  });
});

describe('one pose, however many renders, and only for the camera hooked', () => {
  it('a second render of the same frame writes the same pose; a render with another camera leaves the pose alone', () => {
    const f = setup();
    f.director.battleStart?.({ ...shotCtx(), partyIds: [], boss: null, bossName: null });
    f.run();
    const first = [...f.renderer.last.position];
    f.renderer.render(f.scene, f.camera); // the post chain's other pass
    expect(f.latch.presented).toBe(2);
    close(f.renderer.last.position, first);
    const other = new PerspectiveCamera(50, 1, 0.1, 100);
    other.position.set(1, 2, 3);
    f.renderer.render(f.scene, other);
    expect(f.latch.presented).toBe(2); // not written
    expect(f.renderer.last.position).toEqual([1, 2, 3]);
  });
});

describe('before the first pose, and after unbinding, nothing is written', () => {
  it('the director has not started a program: the scene\'s own camera plays', () => {
    const f = setup();
    f.run(); // no beat yet
    expect(f.latch.latest).toBeNull();
    expect(f.latch.present()).toBe(false);
    expect(f.latch.presented).toBe(0);
    expect(f.renderer.last.position[0]).toBeCloseTo(RIG.position[0], 0);
  });

  it('unbinding the target stops the writes (the scene is leaving)', () => {
    const f = setup();
    f.director.battleStart?.({ ...shotCtx(), partyIds: [], boss: null, bossName: null });
    f.latch.bind(null);
    f.run();
    expect(f.latch.presented).toBe(0);
    expect(f.latch.latest).not.toBeNull(); // it still holds the pose
  });
});

describe('the latch', () => {
  it('keeps the director\'s pose unfiltered and shows the filtered one (variant B), and counts both ends', () => {
    const filter = (p: CameraPose): CameraPose => clampAzimuth(p, 101.52377, 35);
    const f = setup({ filter });
    f.director.battleStart?.({ ...shotCtx(), partyIds: [], boss: null, bossName: null });
    // the made-up default view's eye sits on the +x side of its look-at point: azimuth 0, which is 101.5 degrees from the centre, so B turns it to the edge of the arc
    expect(f.latch.latest!.eye).toEqual([110, 0, 0]);
    const shown = f.latch.shown!;
    expect(shown.eye[0]).not.toBe(110);
    expect(Math.hypot(shown.eye[0] - shown.ref[0], shown.eye[2] - shown.ref[2])).toBeCloseTo(100, 9);
    f.run();
    expect(f.latch.published).toBe(1);
    expect(f.latch.presented).toBe(1);
    expect(f.renderer.last.position[2]).not.toBeCloseTo(0, 3); // the camera drew the filtered pose
  });

  it('is a CameraSink: a plain recording sink sees the same poses the latch is given', () => {
    const sink = new RecordingSink();
    const latch = new PoseLatch();
    latch.bind(sink);
    const pose: CameraPose = { eye: [1, 2, 3], ref: [0, 0, 0], roll: 0, scrDpt: 1024, fovDeg: 26.38 };
    latch.apply(pose);
    expect(sink.poses).toHaveLength(0); // keeping is not writing
    expect(latch.present()).toBe(true);
    expect(sink.poses).toEqual([pose]);
  });
});

describe('the hook', () => {
  it('chains the hook that was on the scene, and taking ours off puts it back', () => {
    const scene = new Scene();
    const camera = new PerspectiveCamera();
    const calls: string[] = [];
    const earlier: Scene['onBeforeRender'] = () => void calls.push('earlier');
    scene.onBeforeRender = earlier;
    const off = hookBeforeRender(scene, camera, () => calls.push('ours'));
    expect(scene.onBeforeRender).not.toBe(earlier);
    scene.onBeforeRender(null as never, scene, camera, null as never, null as never, null as never);
    expect(calls).toEqual(['earlier', 'ours']);
    off();
    expect(scene.onBeforeRender).toBe(earlier);
    calls.length = 0;
    scene.onBeforeRender(null as never, scene, camera, null as never, null as never, null as never);
    expect(calls).toEqual(['earlier']);
  });

  it('a hook taken off after something else chained on it stays as a harmless wrapper', () => {
    const scene = new Scene();
    const camera = new PerspectiveCamera();
    const calls: string[] = [];
    const off = hookBeforeRender(scene, camera, () => calls.push('ours'));
    const ours = scene.onBeforeRender;
    scene.onBeforeRender = function (this: Scene, ...args) {
      ours.apply(this, args);
      calls.push('later');
    };
    off();
    scene.onBeforeRender(null as never, scene, camera, null as never, null as never, null as never);
    expect(calls).toEqual(['later']); // ours is dead; the later one still runs
  });
});
