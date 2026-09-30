/**
 * fb2-0929 camera comfort presets. Bailey picked `calm` as the default for
 * everyone (2026-09-29, D-291): no parameter plays `calm`, `?cam=current` must be
 * byte-for-byte the old camera; `steady` and `originals` stay switchable options
 * (`docs/concepts/fb2-0929/camera/`). REDUCE MOTION still wins over whatever plays.
 * Game case: `current`/`calm`/`steady` both games; `originals` FFX only.
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { StillCamera } from '../../src/engine/ComfortCamera.ts';
import {
  CAMERA_PRESETS,
  DEFAULT_CAMERA_PRESET,
  PresetCamera,
  cameraPreset,
  cameraPresetFor,
  cameraPresetFromSearch,
  rigTurnDeg,
  setCameraPreset,
  type CameraPresetName,
} from '../../src/engine/CameraPreset.ts';

const rigs = {
  idle: { position: [0, 3, 9] as [number, number, number], lookAt: [0, 1.4, 0] as [number, number, number] },
  party: { position: [-3, 2, 6] as [number, number, number], lookAt: [-2.2, 1.2, 0] as [number, number, number] },
  enemy: { position: [3, 2.4, 6] as [number, number, number], lookAt: [2.4, 1.6, 0] as [number, number, number] },
  victory: { position: [-6, 2, 3] as [number, number, number], lookAt: [-2, 1.2, 0] as [number, number, number] },
};

function rig(name: CameraPresetName) {
  const cam = new PerspectiveCamera(35, 16 / 9, 0.1, 100);
  const bc = new BattleCamera(cam, { rigs, initial: 'idle', swayAmplitude: 0 });
  const port = new PresetCamera(bc, () => CAMERA_PRESETS[name]);
  return { cam, bc, port };
}

/** Run the camera at 60 fps for `ms`, returning the peak view-direction speed in deg/s. */
function run(bc: BattleCamera, cam: PerspectiveCamera, ms: number): number {
  let peak = 0;
  const dir = new Vector3();
  const prev = new Vector3();
  cam.getWorldDirection(prev);
  for (let t = 0; t < ms; t += 1000 / 60) {
    bc.update(1 / 60);
    cam.updateMatrixWorld(true);
    cam.getWorldDirection(dir);
    peak = Math.max(peak, (dir.angleTo(prev) * 180) / Math.PI * 60);
    prev.copy(dir);
  }
  return peak;
}

describe('camera presets: `current` is the old camera, behind ?cam=current (both games)', () => {
  it('passes every call straight through', () => {
    const a = rig('current');
    const cam2 = new PerspectiveCamera(35, 16 / 9, 0.1, 100);
    const b = new BattleCamera(cam2, { rigs, initial: 'idle', swayAmplitude: 0 });
    void a.port.moveTo('party', 300);
    void b.moveTo('party', 300);
    a.port.shake(0.08, 220);
    b.shake(0.08, 220);
    void a.port.roll(-4, 620);
    void b.roll(-4, 620);
    for (let i = 0; i < 20; i++) {
      a.bc.update(1 / 60);
      b.update(1 / 60);
    }
    expect(a.cam.position.distanceTo(cam2.position)).toBeLessThan(0.5); // shake phase is random; the move is not
    expect(a.bc.rollDeg).toBeCloseTo(b.rollDeg, 6);
    expect(a.port.rigName).toBe('party');
  });

  it('only the calm and steady options rest the enemy-intent slab; today it follows the boss live', () => {
    expect(CAMERA_PRESETS.current.labelsAtRest).toBe(false);
    expect(CAMERA_PRESETS.originals.labelsAtRest).toBe(false);
    expect(CAMERA_PRESETS.calm.labelsAtRest).toBe(true);
    expect(CAMERA_PRESETS.steady.labelsAtRest).toBe(true);
  });

  it('calm is the default for everyone (D-291), and ?cam= picks another', () => {
    expect(DEFAULT_CAMERA_PRESET).toBe('calm');
    expect(cameraPresetFromSearch('')).toBeNull();
    expect(cameraPreset()).toBe('calm'); // no parameter
    expect(cameraPresetFromSearch('?cam=current')).toBe('current');
    expect(cameraPresetFromSearch('?cam=calm')).toBe('calm');
    expect(cameraPresetFromSearch('?cam=wobbly')).toBeNull();
    expect(setCameraPreset('nope')).toBe('calm'); // an unknown name keeps the default
  });

  it('with no parameter both games play calm, and the FFX-2 intent card rests over the boss', () => {
    expect(cameraPresetFor('ffx').name).toBe('calm');
    expect(cameraPresetFor('ffx2').name).toBe('calm');
    expect(cameraPresetFor('ffx2').labelsAtRest).toBe(true);
  });

  it('?cam=current (or cam("current")) still gives the old camera, and it can be switched back', () => {
    expect(setCameraPreset('current')).toBe('current');
    expect(cameraPresetFor('ffx').name).toBe('current');
    expect(cameraPresetFor('ffx2').labelsAtRest).toBe(false);
    expect(setCameraPreset('calm')).toBe('calm');
  });
});

describe('calm (both games)', () => {
  it('goes half way, takes longer, and stays under 20 deg/s where today whips past 30', () => {
    const today = rig('current');
    void today.port.moveTo('party', 300);
    const todayPeak = run(today.bc, today.cam, 400);
    const calm = rig('calm');
    void calm.port.moveTo('party', 300);
    const calmPeak = run(calm.bc, calm.cam, 3000);
    expect(todayPeak).toBeGreaterThan(30);
    expect(calmPeak).toBeLessThanOrEqual(20.5);
    // Half the travel: the camera stops half way between the master and the close shot.
    expect(calm.cam.position.x).toBeCloseTo(-1.5, 1);
    expect(calm.port.rigName).toBe('party'); // the moments read back what they asked for
  });

  it('no roll, no shake on a routine hit, half a heavy one', () => {
    const { bc, port } = rig('calm');
    void port.roll(-4, 620);
    bc.update(0.1);
    expect(bc.rollDeg).toBe(0);
    const spy: number[] = [];
    const inner = { shake: (a: number) => spy.push(a) } as unknown as BattleCamera;
    const p = new PresetCamera(Object.assign(Object.create(bc), inner), () => CAMERA_PRESETS.calm);
    p.shake(0.08, 220);
    p.shake(0.2, 520);
    expect(spy).toEqual([0.1]);
  });
});

describe('steady (both games)', () => {
  it('holds the master for a close shot, and a long rig change is a cut, not a whip', () => {
    const { bc, cam, port } = rig('steady');
    void port.moveTo('party', 300);
    port.snapTo('enemy');
    run(bc, cam, 1500);
    expect(bc.rigName).toBe('idle');
    expect(cam.position.distanceTo(new Vector3(0, 3, 9))).toBeLessThan(0.01);
    expect(rigTurnDeg(rigs.idle, rigs.victory)).toBeGreaterThan(12);
    void port.moveTo('victory', 900);
    bc.update(1 / 60);
    expect(cam.position.distanceTo(new Vector3(-6, 2, 3))).toBeLessThan(0.01); // cut
  });
});

describe('originals: FFX only', () => {
  it('in FFX every rig change is a cut and the shot holds (no roll, no push)', () => {
    const spec = cameraPresetFor('ffx', 'originals');
    expect(spec.name).toBe('originals');
    const cam = new PerspectiveCamera(35, 16 / 9, 0.1, 100);
    const bc = new BattleCamera(cam, { rigs, initial: 'idle', swayAmplitude: 0 });
    const port = new PresetCamera(bc, () => spec);
    void port.moveTo('party', 300);
    bc.update(1 / 60);
    expect(cam.position.distanceTo(new Vector3(-3, 2, 6))).toBeLessThan(0.01);
    void port.roll(-4, 620);
    void port.push(0.06, 600);
    bc.update(0.2);
    expect(bc.rollDeg).toBe(0);
    expect(bc.pushAmount).toBe(0);
  });

  it('an FFX-2 chapter plays `current` under it (the sources are silent on FFX-2)', () => {
    expect(cameraPresetFor('ffx2', 'originals').name).toBe('current');
  });
});

describe('REDUCE MOTION still wins over a preset', () => {
  it('a calm move under REDUCE MOTION is a cut to the calm shot', () => {
    const { bc, cam } = rig('calm');
    const still = new StillCamera(new PresetCamera(bc, () => CAMERA_PRESETS.calm), () => true);
    void still.moveTo('party', 300);
    bc.update(1 / 60);
    expect(cam.position.x).toBeCloseTo(-1.5, 2);
  });

  it('at the default (no parameter) a move under REDUCE MOTION is still a cut, in both games', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      const { bc, cam } = rig('calm');
      const still = new StillCamera(new PresetCamera(bc, () => cameraPresetFor(game)), () => true);
      void still.moveTo('party', 300);
      bc.update(1 / 60);
      expect(cam.position.x).toBeCloseTo(-1.5, 2);
      void still.roll(-4, 600);
      bc.update(1 / 60);
      expect(bc.rollDeg).toBe(0);
    }
  });
});
