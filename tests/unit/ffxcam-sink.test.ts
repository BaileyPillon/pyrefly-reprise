/**
 * **The camera sink** (`src/engine/ffxcam/sink.ts`): a pose in FFX's units and axes applied to a `THREE.PerspectiveCamera` through the scene's FFX-to-world matrix.
 *
 * Pins: the eye and the look-at are mapped as points through the matrix given (an axis flip with a uniform scale, as the scene will build it from the converter's AXES.md; FFX's Y points down), the
 * camera looks from the mapped eye at the mapped look-at with FFX's up as its up, the vertical field of view is set (and the aspect is left to the renderer), roll turns the picture about the view
 * axis (by the option's sign, and the same way on screen through a mirroring matrix), a swapped matrix takes effect, and a degenerate pose (eye on the look-at) leaves the aim alone.
 *
 * Game case: FFX only.
 */
import { Matrix4, PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { ThreeCameraSink } from '../../src/engine/ffxcam/sink.ts';
import type { CameraPose } from '../../src/engine/ffxcam/solver.ts';
import { D2R, near } from './helpers/ffxcamKit.ts';

/** FFX (x, y down, z) to world (x, y up, z): flip y and z (a half turn about x), then a uniform scale. A proper rotation. */
const flip = (scale = 0.01): Matrix4 => new Matrix4().makeScale(scale, scale, scale).multiply(new Matrix4().makeRotationX(Math.PI));
/** The same with one axis mirrored: a negative determinant. */
const mirror = (scale = 0.01): Matrix4 => new Matrix4().makeScale(-scale, scale, scale).multiply(new Matrix4().makeRotationX(Math.PI));

const pose = (over: Partial<CameraPose> = {}): CameraPose => ({ eye: [0, -100, 300], ref: [0, -100, 0], roll: 0, scrDpt: 1024, fovDeg: 26.3812, ...over });
const cam = (): PerspectiveCamera => new PerspectiveCamera(50, 16 / 9, 0.1, 1000);
const dir = (c: PerspectiveCamera): Vector3 => c.getWorldDirection(new Vector3());
/** The camera's own up vector in the world (its +y axis). */
const upOf = (c: PerspectiveCamera): Vector3 => new Vector3(0, 1, 0).applyQuaternion(c.quaternion);

describe('placing and aiming', () => {
  it('maps the eye and the look-at as points: flipped y and z, scaled', () => {
    const c = cam();
    new ThreeCameraSink(c, flip()).apply(pose());
    near(c.position.toArray(), [0, 1, -3], 1e-9); // (0, -100, 300) * 0.01 with y and z flipped
    near(dir(c).toArray(), [0, 0, 1], 1e-9); // looking from z = -3 at the origin plane: along +z
  });

  it('aims at the mapped look-at, whatever it is', () => {
    const c = cam();
    const sink = new ThreeCameraSink(c, flip(0.5));
    sink.apply(pose({ eye: [10, -20, 30], ref: [-40, 5, 60] }));
    const eye = new Vector3(10, 20, -30).multiplyScalar(0.5);
    const ref = new Vector3(-40, -5, -60).multiplyScalar(0.5);
    near(c.position.toArray(), eye.toArray(), 1e-9);
    near(dir(c).toArray(), ref.clone().sub(eye).normalize().toArray(), 1e-9);
  });

  it('FFX\'s up (negative y) is the world\'s up through a flip: a level picture stays level', () => {
    const c = cam();
    new ThreeCameraSink(c, flip()).apply(pose());
    near(upOf(c).toArray(), [0, 1, 0], 1e-9);
  });

  it('a matrix that does not flip leaves FFX\'s up where the matrix puts it', () => {
    const c = cam();
    new ThreeCameraSink(c, new Matrix4().makeScale(0.01, 0.01, 0.01)).apply(pose({ eye: [0, 0, 300], ref: [0, 0, 0] }));
    near(upOf(c).toArray(), [0, -1, 0], 1e-9); // FFX is Y down: unflipped, its up is -y, and the picture is upside down on purpose
  });

  it('a swapped matrix takes effect from the next pose', () => {
    const c = cam();
    const sink = new ThreeCameraSink(c, flip(0.01));
    sink.apply(pose());
    sink.setTransform(flip(0.02));
    sink.apply(pose());
    near(c.position.toArray(), [0, 2, -6], 1e-9);
  });

  it('copies the matrix it is given: changing the original afterwards changes nothing', () => {
    const c = cam();
    const m = flip();
    const sink = new ThreeCameraSink(c, m);
    m.makeScale(100, 100, 100);
    sink.apply(pose());
    near(c.position.toArray(), [0, 1, -3], 1e-9);
  });
});

describe('the lens', () => {
  it('sets the vertical field of view and leaves the aspect to the renderer (the picture widens horizontally)', () => {
    const c = cam();
    c.aspect = 21 / 9;
    new ThreeCameraSink(c, flip()).apply(pose({ fovDeg: 36.7 }));
    expect(c.fov).toBe(36.7);
    expect(c.aspect).toBe(21 / 9);
    expect(c.projectionMatrix.elements[5]).toBeCloseTo(1 / Math.tan((36.7 * D2R) / 2), 9); // the projection was rebuilt for the new field
  });

  it('does not rebuild the projection when the field is unchanged', () => {
    const c = cam();
    const sink = new ThreeCameraSink(c, flip());
    sink.apply(pose({ fovDeg: 30 }));
    const before = c.projectionMatrix.elements.slice();
    c.projectionMatrix.elements[5] = 123; // a marker a rebuild would overwrite
    sink.apply(pose({ fovDeg: 30 }));
    expect(c.projectionMatrix.elements[5]).toBe(123);
    expect(before[5]).not.toBe(123);
  });
});

describe('roll', () => {
  const turned = (roll: number, options?: { rollSign?: 1 | -1 }, matrix = flip()): { up: Vector3; forward: Vector3 } => {
    const c = cam();
    new ThreeCameraSink(c, matrix, options).apply(pose({ roll }));
    return { up: upOf(c), forward: dir(c) };
  };

  it('turns the up vector about the view axis by the roll', () => {
    const level = turned(0);
    const rolled = turned(20 * D2R);
    expect(Math.acos(Math.min(1, level.up.dot(rolled.up)))).toBeCloseTo(20 * D2R, 9);
    expect(Math.abs(rolled.up.dot(rolled.forward))).toBeLessThan(1e-9); // still perpendicular to the view
    near(rolled.forward.toArray(), level.forward.toArray(), 1e-9); // the aim is unchanged
  });

  it('turns the other way with rollSign -1', () => {
    const a = turned(20 * D2R, { rollSign: 1 });
    const b = turned(20 * D2R, { rollSign: -1 });
    const level = turned(0);
    // the two rolled ups are mirror images about the level up, across the view axis
    near(a.up.clone().add(b.up).normalize().toArray(), level.up.toArray(), 1e-9);
    expect(a.up.distanceTo(b.up)).toBeGreaterThan(0.5);
  });

  it('keeps the picture FFX\'s through any matrix: the camera\'s up is FFX\'s rolled up, mapped (a mirroring matrix reverses the sense of a rotation, so the sink does too)', () => {
    for (const [name, m] of [['a proper flip', flip()], ['a mirror', mirror()]] as const) {
      const p = pose({ eye: [30, -50, 300], ref: [10, -80, 20], roll: 25 * D2R });
      const c = cam();
      new ThreeCameraSink(c, m).apply(p);
      // FFX's own camera, worked out in FFX space: its up (0, -1, 0) turned about the view axis by the roll, then carried to the world by the same matrix
      const viewAxis = new Vector3(...p.ref).sub(new Vector3(...p.eye)).normalize();
      const ffxUp = new Vector3(0, -1, 0).applyAxisAngle(viewAxis, p.roll);
      // (the pose's view axis is not exactly perpendicular to FFX's up, so compare after dropping the part along the view: what the camera shows as "up")
      const worldAxis = viewAxis.clone().transformDirection(m);
      const mapped = ffxUp.clone().transformDirection(m);
      mapped.addScaledVector(worldAxis, -mapped.dot(worldAxis)).normalize();
      const shown = upOf(c);
      near(shown.toArray(), mapped.toArray(), 1e-9);
      expect(shown.dot(dir(c)), name).toBeCloseTo(0, 9);
    }
  });

  it('with no roll the up is exactly the mapped up', () => {
    near(turned(0).up.toArray(), [0, 1, 0], 1e-9);
  });
});

describe('a degenerate pose', () => {
  it('with the eye on the look-at the aim is left alone and nothing is NaN', () => {
    const c = cam();
    const sink = new ThreeCameraSink(c, flip());
    sink.apply(pose());
    const aim = dir(c).toArray();
    sink.apply(pose({ eye: [5, 5, 5], ref: [5, 5, 5] }));
    near(c.position.toArray(), [0.05, -0.05, -0.05], 1e-9);
    near(dir(c).toArray(), aim, 1e-9);
    for (const n of [...c.position.toArray(), ...c.quaternion.toArray()]) expect(Number.isFinite(n)).toBe(true);
  });

  it('updates the camera\'s world matrix, so a render in the same frame sees the new pose', () => {
    const c = cam();
    new ThreeCameraSink(c, flip()).apply(pose());
    const p = new Vector3().setFromMatrixPosition(c.matrixWorld);
    near(p.toArray(), [0, 1, -3], 1e-9);
  });
});
