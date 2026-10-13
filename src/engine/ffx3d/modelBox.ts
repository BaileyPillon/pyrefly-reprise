/**
 * **Where a model's body is, cheaply** (the `ffx` skin; FFX only): the box the FFX camera's tracking safety net holds a figure by (`../ffxcam/frames.ts`). The honest box is every vertex of the animated mesh,
 * which costs thousands of skin evaluations; the figure's **bones** are a few hundred points and follow the animation just as well, so the box is the bones' box widened by what the vertices stand beyond
 * them: measured once, from the idle pose, as the difference between the vertex box and the bone box, per side.
 *
 * Everything is measured in the model's own frame (the root group the skin attaches, which turns and moves with the actor), so the widening turns with the body: Evrae's tail stays behind him however the
 * presenter turns his group. The result is the world box of that local box. Pure `three` math, no renderer.
 *
 * Game case: FFX only.
 */

import { Box3, Matrix4, Vector3, type Object3D, type SkinnedMesh } from 'three';

/** Vertices sampled per mesh for the honest box when no stride is given. */
export const SAMPLE_VERTICES = 2500;

/** A world-space axis-aligned box. */
export interface WorldBox {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

/**
 * Bring every world matrix under `root` up to date, **through the nodes' own `updateMatrixWorld`**: a skinned mesh in the default 'attached' bind mode keeps `bindMatrixInverse` as the inverse of its world matrix
 * and refreshes it there, not in `updateWorldMatrix`, so a skinned vertex read after the model moved would otherwise be placed with the old inverse.
 */
function refresh(root: Object3D): void {
  root.parent?.updateWorldMatrix(true, false);
  root.updateMatrixWorld(true);
}

/** The bones below `root` (every skinned mesh's skeleton, once each). */
function bonesOf(root: Object3D): Object3D[] {
  const seen = new Set<Object3D>();
  root.traverse((o) => {
    const skinned = o as Partial<SkinnedMesh>;
    if (skinned.isSkinnedMesh && skinned.skeleton) for (const b of skinned.skeleton.bones) seen.add(b);
  });
  return [...seen];
}

/** The box, in the frame of `root`, of every vertex of the visible meshes below it, skinned (the honest box); empty when there is none. `stride` samples every n-th vertex (default: about {@link SAMPLE_VERTICES} a mesh). */
export function vertexBoxLocal(root: Object3D, stride?: number): Box3 {
  refresh(root);
  const toLocal = new Matrix4().copy(root.matrixWorld).invert();
  const box = new Box3();
  const v = new Vector3();
  root.traverse((o) => {
    const mesh = o as Partial<SkinnedMesh> & Object3D;
    const position = mesh.geometry?.attributes['position'];
    if (!mesh.isMesh || !position || !mesh.getVertexPosition) return;
    for (let p: Object3D | null = o; p; p = p.parent) if (!p.visible) return;
    const every = stride ?? Math.max(1, Math.floor(position.count / SAMPLE_VERTICES));
    for (let i = 0; i < position.count; i += every) {
      mesh.getVertexPosition(i, v);
      box.expandByPoint(v.applyMatrix4(mesh.matrixWorld).applyMatrix4(toLocal));
    }
  });
  return box;
}

/** The box, in the frame of `root`, of the bones' world positions. */
function boneBoxLocal(bones: readonly Object3D[], root: Object3D, into: Box3): Box3 {
  refresh(root);
  const toLocal = new Matrix4().copy(root.matrixWorld).invert();
  const p = new Vector3();
  into.makeEmpty();
  for (const b of bones) {
    const e = b.matrixWorld.elements;
    into.expandByPoint(p.set(e[12]!, e[13]!, e[14]!).applyMatrix4(toLocal));
  }
  return into;
}

/**
 * A live box for `root`: the box of its bones in its own frame, widened by the margins measured now, in the world. Call it once the model is in the scene and posed (the idle pose); the function it returns
 * is cheap enough to call every logic step. Null when the model has no bones or no vertices (it is framed by its extents then).
 */
export function liveBoxOf(root: Object3D): (() => WorldBox | null) | null {
  const bones = bonesOf(root);
  if (bones.length === 0) return null;
  const honest = vertexBoxLocal(root);
  if (honest.isEmpty()) return null;
  const scratch = new Box3();
  const idle = boneBoxLocal(bones, root, scratch).clone();
  if (idle.isEmpty()) return null;
  // How far the vertices stand beyond the bones on each side in the idle pose, in the model's frame (never negative: a bone outside the skin does not shrink the box).
  const lo = new Vector3().subVectors(idle.min, honest.min).max(new Vector3());
  const hi = new Vector3().subVectors(honest.max, idle.max).max(new Vector3());
  const corner = new Vector3();
  return () => {
    const b = boneBoxLocal(bones, root, scratch);
    if (b.isEmpty()) return null;
    const mn = [Infinity, Infinity, Infinity];
    const mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? b.max.x + hi.x : b.min.x - lo.x, i & 2 ? b.max.y + hi.y : b.min.y - lo.y, i & 4 ? b.max.z + hi.z : b.min.z - lo.z).applyMatrix4(root.matrixWorld);
      mn[0] = Math.min(mn[0]!, corner.x);
      mn[1] = Math.min(mn[1]!, corner.y);
      mn[2] = Math.min(mn[2]!, corner.z);
      mx[0] = Math.max(mx[0]!, corner.x);
      mx[1] = Math.max(mx[1]!, corner.y);
      mx[2] = Math.max(mx[2]!, corner.z);
    }
    return { min: [mn[0]!, mn[1]!, mn[2]!], max: [mx[0]!, mx[1]!, mx[2]!] };
  };
}
