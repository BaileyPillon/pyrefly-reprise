/**
 * Where a rigged figure's painted silhouette is NOW, in the world (the rig program, 2026-10-17; both games, shared plumbing): the key shown, or the blend between the key it left and the key it
 * is moving to, mapped through the idle plane the rig is drawn on. `RigActor` answers `contentQuad` (the HUD's target brackets), `poseShape` (the strike's look at the pose a blow lands in) and
 * `rigProfile` (the painted front, in rows) from this, instead of from the idle painting the rig's carrier loads. The shapes are the gate's (`RigSilhouette.ts`).
 */
import { Vector3, type Mesh, type Texture } from 'three';
import type { RigGate } from '../../data/art/rigTypes.ts';
import type { PoseShape } from '../PaintedActor.ts';
import type { Profile } from '../motion/Silhouette.ts';
import { blendShape, profileOfShape, readSilhouettes, type KeyShape } from './RigSilhouette.ts';

type Quad = [Vector3, Vector3, Vector3, Vector3];

export class ShapeTrack {
  private readonly shapes: Map<string, KeyShape>;
  private from: KeyShape | null = null;

  /** `image` is the master's size (`rig.json` `image`); `plane` the idle plane's mesh, whose live matrix carries the stance, the mirror and every stage move. */
  constructor(gate: RigGate | undefined, private readonly image: { w: number; h: number }, private readonly plane: () => Mesh) {
    this.shapes = readSilhouettes(gate);
  }

  get size(): number {
    return this.shapes.size;
  }

  /** The shape of the figure now: `key` shown, or the blend from the one it left while a move is in flight (`progress` 0..1). Null where the gate stamped none: the idle plane's box stands in. */
  current(key: string, busy: boolean, progress: number): KeyShape | null {
    const to = this.shapes.get(key);
    if (!to) return this.from ?? this.shapes.get('idle') ?? null;
    return this.from && busy ? blendShape(this.from, to, progress) : to;
  }

  /** A move to another key begins: what is showing now is where the blend starts. */
  leave(key: string, busy: boolean, progress: number): void {
    this.from = this.current(key, busy, progress);
  }

  /** A box in the master's px as the four world corners of the idle plane's frame (bottom-left, bottom-right, top-right, top-left), through the plane's live matrix. */
  quad(box: readonly number[], out?: Quad): Quad {
    const c: Quad = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    const { w, h } = this.image;
    const [u0, u1] = [box[0]! / w - 0.5, box[2]! / w - 0.5];
    const [v0, v1] = [0.5 - box[3]! / h, 0.5 - box[1]! / h];
    c[0].set(u0, v0, 0);
    c[1].set(u1, v0, 0);
    c[2].set(u1, v1, 0);
    c[3].set(u0, v1, 0);
    const mesh = this.plane();
    mesh.updateWorldMatrix(true, false);
    for (const v of c) v.applyMatrix4(mesh.matrixWorld);
    return c;
  }

  /** The lowest foot of a shape as a world point (the plane's live matrix), or null where the gate found no foot landmark. */
  feet(s: KeyShape | null): Vector3 | null {
    if (!s?.feet) return null;
    const { w, h } = this.image;
    const mesh = this.plane();
    mesh.updateWorldMatrix(true, false);
    return new Vector3(s.feet[0] / w - 0.5, 0.5 - s.feet[1] / h, 0).applyMatrix4(mesh.matrixWorld);
  }

  /** The key's box as the strike solver wants it (`PaintedActor.poseShape`), or null where the gate stamped none for the key. `tex` is the idle painting (a rig has no other; the profile does not read it). */
  poseShape(key: string | null, tex: Texture): PoseShape | null {
    const s = key ? this.shapes.get(key) : undefined;
    if (!s) return null;
    const { w, h } = this.image;
    return { corners: this.quad(s.box), tex, u0: s.box[0] / w, u1: s.box[2] / w, v0: 1 - s.box[3] / h, v1: 1 - s.box[1] / h, mirrored: this.plane().scale.x < 0 };
  }

  /** The painted front of the key (or, with no `key`, of `now`) in rows, flipped with the plane when it is mirrored. */
  profile(key: string | null, now: KeyShape | null): Profile | undefined {
    const s = key === null ? now : this.shapes.get(key);
    return s ? profileOfShape(s, this.plane().scale.x < 0) : undefined;
  }
}
