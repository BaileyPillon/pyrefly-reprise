/**
 * A bone that is CARRIED by a landmark (`?anim=proto`; both games, presentation only; erasable TS, no `three`): Lulu's moogle doll rides her fist. In the rig the doll is a bone of its own that each key
 * puts at the hand by a `dx` and a `dy` of hundreds of painting px, so two keys blended straight fly the doll its own straight line while the hand swings an arc, and the doll leaves the palm.
 *
 * A carried bone's pose is instead derived: each pose of a clip has an OFFSET, where the bone's joint sits from the landmark in that pose (read off the skeleton, so it is exactly what the key
 * drew); the offset is blended with the clip's own move (the same eased progress, so a back curve overshoots it too), and the bone is put at the landmark plus that offset. The doll then follows the hand
 * through the whole move and slides to its place in the next pose; the secondary layer's point spring on it adds the lag and the bob.
 */

/** What the carry needs of a skeleton: solve a pose, the world matrices (six numbers a bone: x' = a x + c y + e, y' = b x + d y + f), and a landmark's place in painting px. */
export interface CarrySkeleton {
  solve(pose: Float64Array): void;
  readonly m: Float64Array;
  landmark(name: string, out?: { x: number; y: number }): { x: number; y: number } | null;
}

export interface CarrySpec {
  bone: string;
  landmark: string;
}

const CH = 5;

export class Carry {
  private readonly bone: number;
  private readonly parent: number;
  /** The bone's bind joint relative to its parent's (painting px). */
  private readonly bx: number;
  private readonly by: number;
  private readonly landmark: string;
  private readonly sk: CarrySkeleton;
  private readonly pt = { x: 0, y: 0 };

  private constructor(bone: number, parent: number, bx: number, by: number, landmark: string, sk: CarrySkeleton) {
    this.bone = bone;
    this.parent = parent;
    this.bx = bx;
    this.by = by;
    this.landmark = landmark;
    this.sk = sk;
  }

  /** The carry for `spec`, or null when the rig has no such bone (or it is a root, which has nothing to be placed against). */
  static create(bones: ReadonlyArray<{ x: number; y: number; parent: number }>, boneIndex: ReadonlyMap<string, number>, spec: CarrySpec, sk: CarrySkeleton): Carry | null {
    const b = boneIndex.get(spec.bone);
    if (b === undefined) return null;
    const p = bones[b]!.parent;
    if (p < 0) return null;
    return new Carry(b, p, bones[b]!.x - bones[p]!.x, bones[b]!.y - bones[p]!.y, spec.landmark, sk);
  }

  /** Where the bone's joint is from the landmark in `pose` (painting px), into `out[at]` and `out[at + 1]`. */
  offsetOf(pose: Float64Array, out: Float64Array, at: number): void {
    this.sk.solve(pose);
    const f = this.sk.landmark(this.landmark, this.pt);
    out[at] = this.sk.m[this.bone * 6 + 4]! - (f?.x ?? 0);
    out[at + 1] = this.sk.m[this.bone * 6 + 5]! - (f?.y ?? 0);
  }

  /** The offsets of a list of poses, two numbers each. */
  offsetsOf(poses: readonly Float64Array[]): Float64Array {
    const o = new Float64Array(poses.length * 2);
    poses.forEach((p, i) => this.offsetOf(p, o, i * 2));
    return o;
  }

  /**
   * Put the bone at its landmark plus the offset blended `e` of the way from `from` (two numbers) to segment `seg` of `offsets`: `pose` is the clip's pose for that moment and gets the bone's `dx`
   * and `dy`. (`e` is the move's eased progress and may leave 0..1.) `move` (pass 3: the doll's throw) may put the joint somewhere else, in painting px of the master: it is given where the hand carries it.
   */
  place(pose: Float64Array, offsets: Float64Array, from: Float64Array, seg: number, e: number, move?: (x: number, y: number) => { x: number; y: number } | null): void {
    const px = seg === 0 ? from[0]! : offsets[2 * (seg - 1)]!;
    const py = seg === 0 ? from[1]! : offsets[2 * (seg - 1) + 1]!;
    const sk = this.sk;
    sk.solve(pose);
    const f = sk.landmark(this.landmark, this.pt);
    if (!f) return;
    const q = this.parent * 6;
    let jx = f.x + px + (offsets[2 * seg]! - px) * e;
    let jy = f.y + py + (offsets[2 * seg + 1]! - py) * e;
    const moved = move?.(jx, jy);
    if (moved) {
      jx = moved.x;
      jy = moved.y;
    }
    const wx = jx - sk.m[q + 4]!;
    const wy = jy - sk.m[q + 5]!;
    const m0 = sk.m[q]!, m1 = sk.m[q + 1]!, m2 = sk.m[q + 2]!, m3 = sk.m[q + 3]!;
    const det = m0 * m3 - m1 * m2;
    if (Math.abs(det) < 1e-9) return;
    pose[this.bone * CH + 1] = (wx * m3 - wy * m2) / det - this.bx;
    pose[this.bone * CH + 2] = (m0 * wy - m1 * wx) / det - this.by;
  }
}
