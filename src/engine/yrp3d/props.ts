/**
 * **The girls' weapons** (the hidden 3D Bahamut chapter, FFX-2 only): the three models hold nothing, so the weapons are small low-poly props built in code, original shapes (no one's asset), parented to the models' hand
 * bones so they move with the animation, and given the same toon material and ink as the figure (the model's own pass, `./toon.ts`, turns every mesh under it toon; props are added to the scene before that pass).
 *
 * - **Yuna**: two pistols, one in each hand: a gunmetal blue-grey slide with a barrel and a small sight on top, a darker grip across the palm.
 * - **Rikku**: two daggers, one in each hand: a short curved steel blade, a small guard, a brown grip.
 * - **Paine**: one long sword in the right hand: a dark blade with a point, a red guard, a red grip and pommel.
 *
 * ## The hand
 *
 * The files' hand bones (`RightHand`, `LeftHand`; the same 24 bone names in all three) have their local **+Y along the arm toward the fingers** and **+Z toward the thumb** (forward, with the arms hanging in the bind
 * pose); the origin is the wrist. A prop is built in its own frame (**+Z the way it points, +Y up**: a pistol's barrel is +Z and its sight +Y) and turned into the hand's: its +Z (the barrel, the blade) is the hand's +Y (along
 * the arm) and its +Y (the sight, the edge) is the hand's +Z (toward the thumb), so the grip lies across the palm, perpendicular to the forearm, as a fist holds one. It is placed `PALM` along the hand from the wrist.
 * Sizes are in metres for a figure `REFERENCE_HEIGHT` tall and scaled by the model's own height; the files' armature scale is baked to 1, so a bone's units are the file's.
 *
 * Needs three.js only; no DOM. Game case: FFX-2 only.
 */

import {
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

/** How far along the hand from the wrist the grip of a prop sits, metres at the reference height. */
export const PALM = 0.075;

/** The colours: a gunmetal blue-grey, a darker grip, steel, a brown wrap, a dark blade and a red hilt. */
export const PROP_COLOUR = { gun: 0x5b6b80, gunGrip: 0x2d3440, steel: 0xc9d3de, wrap: 0x5a3a2a, darkBlade: 0x23262f, red: 0xa82424, redDark: 0x7e1a1a } as const;

/** A prop's frame to the hand's: its +Z (the way it points) is the hand's +Y (along the arm) and its +Y (up) the hand's +Z (toward the thumb). A proper rotation. */
export const PROP_TO_HAND: Quaternion = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3(-1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, 1, 0)));

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

/** Which hand holds which prop, by figure: `[bone, builder, tilt]`, `tilt` raising the point (radians about the hand's x, toward the thumb). */
const KIT: Readonly<Partial<Record<YrpId, ReadonlyArray<readonly [string, (unit: number) => Prop, number]>>>> = {
  yuna: [
    ['RightHand', pistol, 0],
    ['LeftHand', pistol, 0],
  ],
  rikku: [
    ['RightHand', dagger, 0],
    ['LeftHand', dagger, 0],
  ],
  paine: [['RightHand', sword, 0.2]],
};

/** What was attached, by bone name (the model frees the geometries). */
export interface Attached {
  readonly props: ReadonlyArray<{ bone: string; prop: Prop }>;
  dispose(): void;
}

/**
 * Parent each of `id`'s props to its hand bone under `root` (the model's scene), scaled by `height` over {@link REFERENCE_HEIGHT}. A figure with no kit (Bahamut) or a scene with no such bone (a capsule) gets none. Call it
 * before the toon pass so the props become toon with the rest.
 */
export function attachProps(id: YrpId, root: Object3D, height: number): Attached {
  const unit = height > 0 ? height / REFERENCE_HEIGHT : 1;
  const props: Array<{ bone: string; prop: Prop }> = [];
  for (const [boneName, build, tilt] of KIT[id] ?? []) {
    const bone = root.getObjectByName(boneName);
    if (!bone) continue;
    const prop = build(unit);
    prop.object.name = `prop-${id}-${boneName}`;
    prop.object.quaternion.copy(PROP_TO_HAND);
    if (tilt) prop.object.quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -tilt)); // raise the point toward the thumb side
    prop.object.position.set(0, PALM * unit, 0);
    bone.add(prop.object);
    props.push({ bone: boneName, prop });
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
