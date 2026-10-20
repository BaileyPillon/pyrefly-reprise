/**
 * Where a world point is in a rig's painting (pass 3 of the animation prototype; both games, presentation only): the inverse of `RigActor.landmark`, through the camera. The doll's throw (`anim/AnimDoll.ts`) is aimed
 * at where the target is ON SCREEN: the target stands far behind the figure in depth, so its world x and y are not where it appears on the figure's own plane; the ray from the camera through the target, cut with the
 * figure's plane, is.
 *
 * `landmark` takes a point of the painting (px, y down) through the rig's plane and the carrier's inner group into the actor's local space. This undoes both: the world point to the figure's plane along the camera's
 * ray (a flat projection where the camera has not drawn yet), to the actor's local space, back through the inner group and the plane, and to painting px.
 */
import { Matrix4, Vector3, type Object3D, type PerspectiveCamera } from 'three';

/** What the conversion needs of the figure. */
export interface PaintFrame {
  /** The actor's world position (the figure's feet). */
  position: { x: number; y: number; z: number };
  /** The rig's plane (carries the master's size) and the carrier's inner group (carries the figure's motion): `landmark`'s two matrices. */
  plane: Object3D;
  inner: Object3D;
  /** The master's size, px. */
  image: { w: number; h: number };
  /** The camera that last drew the figure, or null. */
  camera: PerspectiveCamera | null;
}

const a = new Matrix4();
const b = new Matrix4();
const ray = new Vector3();
const eye = new Vector3();
const p = new Vector3();

/** Painting px of the point in the world `at`, as the figure's plane shows it to the camera; null when the plane cannot be inverted. */
export function paintPointOf(at: { x: number; y: number; z: number }, f: PaintFrame): { x: number; y: number } | null {
  p.set(at.x, at.y, at.z);
  if (f.camera) {
    eye.setFromMatrixPosition(f.camera.matrixWorld);
    ray.copy(p).sub(eye);
    if (Math.abs(ray.z) < 1e-6) return null;
    const s = (f.position.z - eye.z) / ray.z;
    if (!(s > 0)) return null;
    p.copy(eye).addScaledVector(ray, s);
  }
  p.set(p.x - f.position.x, p.y - f.position.y, 0);
  f.plane.updateMatrix();
  f.inner.updateMatrix();
  if (Math.abs(a.copy(f.inner.matrix).determinant()) < 1e-12 || Math.abs(b.copy(f.plane.matrix).determinant()) < 1e-12) return null;
  p.applyMatrix4(a.copy(f.inner.matrix).invert()).applyMatrix4(b.copy(f.plane.matrix).invert());
  return { x: (p.x + 0.5) * f.image.w, y: (0.5 - p.y) * f.image.h };
}
