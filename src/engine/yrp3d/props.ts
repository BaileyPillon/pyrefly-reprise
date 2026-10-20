/**
 * **The girls' weapons** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only): the real models hold nothing (the Gunner model's own notes say "no pistols are in the model file"), and the real weapon
 * models are not extracted yet, so the weapons are small low-poly props built in code, original shapes (no one's asset), parented to the models' hands so they move with the game's own motion, and given the same soft material
 * as the figure (the model's own pass, `./shade.ts`, covers every mesh under it; props are added to the scene before that pass).
 *
 * - **Yuna**: two pistols, one in each hand: a gunmetal blue-grey slide with a barrel and a small sight on top, a darker grip across the palm.
 * - **Rikku**: two daggers, one in each hand: a short curved steel blade, a small guard, a brown grip.
 * - **Paine**: one long sword in her right hand: a dark blade with a point, a red guard, a red grip and pommel.
 *
 * ## The hand
 *
 * The real skeletons name their bones `SkeletonNode_<n>` and number them differently per figure, so a hand is found by its shape ({@link findHands}): in the bind pose (arms out and down, the thumb toward +Z) the **palm** is the
 * node with three or more finger chains under it that stands farthest out to each side, and the **wrist** is its parent. The bones' bind rotations are identity (a node is only an offset), so a prop's frame is built from
 * the world directions of the bind pose and turned into the palm's own: a prop's **+Z (the barrel, the blade) lies along the arm toward the fingers** and its **+Y (the sight, the edge) toward the thumb** (forward, with the
 * arms hanging), so the grip lies across the palm, perpendicular to the forearm, as a fist holds one, and the barrel follows the forearm wherever the motion takes it. It is placed in the middle of the palm. Sizes are in
 * metres for a figure `REFERENCE_HEIGHT` tall and scaled by the model's own height in the file's units.
 *
 * Needs three.js only; no DOM. Game case: FFX-2 only.
 */

import {
  Box3,
  BoxGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type Object3D,
} from 'three';
import type { YrpId } from './layout.ts';

/** The height the prop sizes below are written for, metres (Yuna's file is 1.60 m, Rikku's 1.55, Paine's 1.70). */
export const REFERENCE_HEIGHT = 1.6;

/** The colours: a gunmetal blue-grey, a darker grip, steel, a brown wrap, a dark blade and a red hilt. */
export const PROP_COLOUR = { gun: 0x5b6b80, gunGrip: 0x2d3440, steel: 0xc9d3de, wrap: 0x5a3a2a, darkBlade: 0x23262f, red: 0xa82424, redDark: 0x7e1a1a } as const;

/** What a builder hands back: the prop, and the geometries it made (so the model can free them). */
export interface Prop {
  readonly object: Group;
  readonly geometries: BufferGeometry[];
}

type V3 = readonly [number, number, number];

/** Collects the parts of one prop. Sizes and positions are metres at the reference height; `unit` scales them to the figure. */
class Builder {
  readonly object = new Group();
  readonly geometries: BufferGeometry[] = [];

  constructor(readonly unit: number) {}

  box(w: number, h: number, l: number): BoxGeometry {
    return new BoxGeometry(w * this.unit, h * this.unit, l * this.unit);
  }

  /** A cylinder along its own y (turn it with `rotate` to lie along z). */
  cylinder(rTop: number, rBottom: number, length: number, segments = 10): CylinderGeometry {
    return new CylinderGeometry(rTop * this.unit, rBottom * this.unit, length * this.unit, segments);
  }

  ball(r: number): SphereGeometry {
    return new SphereGeometry(r * this.unit, 8, 6);
  }

  /** Add a part: a mesh of `geometry` in `colour` at `at` (prop frame), turned by `rotate` (euler x, y, z). */
  add(name: string, geometry: BufferGeometry, colour: number, at: V3, rotate: V3 = [0, 0, 0]): Mesh {
    this.geometries.push(geometry);
    const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: colour, roughness: 1, metalness: 0 }));
    mesh.name = name;
    mesh.position.set(at[0] * this.unit, at[1] * this.unit, at[2] * this.unit);
    mesh.rotation.set(rotate[0], rotate[1], rotate[2]);
    this.object.add(mesh);
    return mesh;
  }

  done(): Prop {
    return { object: this.object, geometries: this.geometries };
  }
}

const LIE_ALONG_Z: V3 = [Math.PI / 2, 0, 0];

/** A pistol, barrel +Z, sight +Y, centred on its grip: a slide and barrel, a sight, a grip hanging down and a small trigger guard. About 0.2 m long. */
export function pistol(unit = 1): Prop {
  const b = new Builder(unit);
  b.add('slide', b.box(0.036, 0.04, 0.15), PROP_COLOUR.gun, [0, 0.012, 0.045]);
  b.add('barrel', b.cylinder(0.011, 0.011, 0.06), PROP_COLOUR.gun, [0, 0.004, 0.14], LIE_ALONG_Z);
  b.add('sight', b.box(0.01, 0.012, 0.02), PROP_COLOUR.gunGrip, [0, 0.038, 0.095]);
  b.add('grip', b.box(0.03, 0.085, 0.04), PROP_COLOUR.gunGrip, [0, -0.045, -0.012], [0.18, 0, 0]);
  b.add('guard', b.box(0.008, 0.012, 0.045), PROP_COLOUR.gunGrip, [0, -0.018, 0.028]);
  return b.done();
}

/** A dagger, point +Z, edge up +Y, centred on its grip: a curved blade built from five tapering segments that bend toward +Y, a guard and a wrapped grip. About 0.33 m with its grip. */
export function dagger(unit = 1): Prop {
  const b = new Builder(unit);
  b.add('grip', b.cylinder(0.013, 0.013, 0.1, 8), PROP_COLOUR.wrap, [0, 0, 0], LIE_ALONG_Z);
  b.add('pommel', b.ball(0.017), PROP_COLOUR.wrap, [0, 0, -0.055]);
  b.add('guard', b.box(0.012, 0.05, 0.014), PROP_COLOUR.steel, [0, 0, 0.056]);
  // the blade: segments along an arc that bends up (+Y), each narrower than the last
  const segments = 5;
  const segment = 0.045;
  const bend = 0.16; // radians a segment turns the point by
  let angle = 0;
  let y = 0;
  let z = 0.063;
  for (let i = 0; i < segments; i++) {
    const width = 0.036 * (1 - i / (segments + 0.6));
    angle += bend / 2;
    b.add(`blade-${i}`, b.box(0.008, width, segment * 1.04), PROP_COLOUR.steel, [0, y + Math.sin(angle) * (segment / 2), z + Math.cos(angle) * (segment / 2)], [-angle, 0, 0]);
    y += Math.sin(angle) * segment;
    z += Math.cos(angle) * segment;
    angle += bend / 2;
  }
  return b.done();
}

/** A long sword, point +Z, edge up +Y, centred on its grip: a dark blade about 0.95 m with a point, a red guard, a red grip and a pommel. About 1.2 m long. */
export function sword(unit = 1): Prop {
  const b = new Builder(unit);
  b.add('grip', b.cylinder(0.016, 0.016, 0.16, 8), PROP_COLOUR.red, [0, 0, 0], LIE_ALONG_Z);
  b.add('pommel', b.ball(0.026), PROP_COLOUR.redDark, [0, 0, -0.095]);
  b.add('guard', b.box(0.02, 0.2, 0.026), PROP_COLOUR.red, [0, 0, 0.09]);
  b.add('blade', b.box(0.012, 0.052, 0.95), PROP_COLOUR.darkBlade, [0, 0, 0.103 + 0.475]);
  const tip = b.add('point', b.cylinder(0, 0.026, 0.12, 4), PROP_COLOUR.darkBlade, [0, 0, 0.103 + 0.95 + 0.06], [Math.PI / 2, Math.PI / 4, 0]);
  tip.scale.set(0.23, 1, 1); // flat like the blade
  return b.done();
}

/** Which side of the body a hand is on: `left` is the figure's left, +X when it faces +Z. */
export type Side = 'left' | 'right';

/** A hand found in a skeleton: its wrist, its palm (the node the finger chains hang from) and its side. */
export interface Hand {
  readonly side: Side;
  readonly wrist: Object3D;
  readonly palm: Object3D;
}

/** How many finger chains a palm has at least, and how far out from the body's axis a hand stands at least, as a share of the figure's height. */
export const PALM_CHAINS = 3;
export const HAND_REACH = 0.12;

/**
 * The two hands of a skeleton in its bind pose, by shape (see the file's header): of the nodes with at least {@link PALM_CHAINS} children that are not meshes and stand at least {@link HAND_REACH} of the height out from the
 * axis, the farthest on each side is the palm. A side with none (a capsule, a model with its arms in) has no hand.
 */
export function findHands(root: Object3D): Hand[] {
  root.updateWorldMatrix(true, true); // the parents too, so the box and the positions below agree whether or not the scene is already in a figure
  const box = new Box3().setFromObject(root);
  const reach = (box.max.y - box.min.y) * HAND_REACH;
  const best: Partial<Record<Side, { node: Object3D; x: number }>> = {};
  const at = new Vector3();
  root.traverse((o) => {
    if ((o as Mesh).isMesh || !o.parent || o.children.filter((c) => !(c as Mesh).isMesh).length < PALM_CHAINS) return;
    o.getWorldPosition(at);
    if (Math.abs(at.x) < reach) return;
    const side: Side = at.x > 0 ? 'left' : 'right';
    if (!best[side] || Math.abs(at.x) > Math.abs(best[side]!.x)) best[side] = { node: o, x: at.x };
  });
  const out: Hand[] = [];
  for (const side of ['left', 'right'] as const) {
    const found = best[side];
    if (found?.node.parent) out.push({ side, wrist: found.node.parent, palm: found.node });
  }
  return out;
}

/** The turn that puts a prop in a hand: its +Z along the arm (wrist to palm) and its +Y toward the thumb (forward, +Z of the model, squared to the arm), as a rotation in the palm's own frame; `tilt` raises the point toward the thumb. */
export function gripRotation(hand: Hand, tilt = 0): Quaternion {
  const wrist = hand.wrist.getWorldPosition(new Vector3());
  const palm = hand.palm.getWorldPosition(new Vector3());
  const along = palm.clone().sub(wrist).normalize();
  const thumb = new Vector3(0, 0, 1);
  thumb.addScaledVector(along, -thumb.dot(along));
  if (thumb.lengthSq() < 1e-6) thumb.set(0, 1, 0).addScaledVector(along, -along.y);
  thumb.normalize();
  const side = new Vector3().crossVectors(thumb, along);
  const world = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(side, thumb, along));
  const q = hand.palm.getWorldQuaternion(new Quaternion()).invert().multiply(world);
  if (tilt) q.multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -tilt)); // raise the point toward the thumb side
  return q;
}

/** Where in the palm's frame the middle of the hand is: halfway from the palm node back toward the wrist (the grip sits in the fist, not at the knuckles). */
export function gripPosition(hand: Hand): Vector3 {
  const wrist = hand.wrist.getWorldPosition(new Vector3());
  const palm = hand.palm.getWorldPosition(new Vector3());
  return hand.palm.worldToLocal(palm.clone().lerp(wrist, GRIP_BACK));
}

/** How far back from the palm node toward the wrist the grip sits, as a share of the way. */
export const GRIP_BACK = 0.45;

/** Which hand holds which prop, by figure: `[side, builder, tilt]`, `tilt` raising the point (radians about the prop's x, toward the thumb). */
const KIT: Readonly<Partial<Record<YrpId, ReadonlyArray<readonly [Side, (unit: number) => Prop, number]>>>> = {
  yuna: [
    ['right', pistol, 0],
    ['left', pistol, 0],
  ],
  rikku: [
    ['right', dagger, 0],
    ['left', dagger, 0],
  ],
  paine: [['right', sword, 0.2]],
};

/** What was attached, by side (the model frees the geometries). */
export interface Attached {
  readonly props: ReadonlyArray<{ side: Side; prop: Prop }>;
  dispose(): void;
}

/**
 * Parent each of `id`'s props to its hand's palm under `root` (the model's scene), scaled by `height` (the figure's height in the units of the palm's own frame) over {@link REFERENCE_HEIGHT}. A figure with no kit
 * (Bahamut) or a scene with no hands (a capsule) gets none. Call it before the soft pass so the props are covered with the rest.
 */
export function attachProps(id: YrpId, root: Object3D, height: number): Attached {
  const unit = height > 0 ? height / REFERENCE_HEIGHT : 1;
  const props: Array<{ side: Side; prop: Prop }> = [];
  const hands = findHands(root);
  for (const [side, build, tilt] of KIT[id] ?? []) {
    const hand = hands.find((h) => h.side === side);
    if (!hand) continue;
    const prop = build(unit);
    prop.object.name = `prop-${id}-${side}`;
    prop.object.quaternion.copy(gripRotation(hand, tilt));
    prop.object.position.copy(gripPosition(hand));
    hand.palm.add(prop.object);
    props.push({ side, prop });
  }
  return {
    props,
    dispose(): void {
      for (const { prop } of props) {
        prop.object.removeFromParent();
        for (const g of prop.geometries) g.dispose();
      }
    },
  };
}
