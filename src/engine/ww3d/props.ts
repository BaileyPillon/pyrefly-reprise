/**
 * **The girls' weapons** (the hidden Wind Waker chapter, FFX-2 only): the three models hold nothing, so the weapons are separate toon props **parented to the hand bones**, which makes them follow every clip. Ported from
 * the look lab's `js/props.mjs`: Yuna one chunky pistol in each hand, Rikku one short dagger in each, Paine one long red serrated sword in the right (TARGET-C). Flat colours, no texture, chunky like Wind Waker props.
 *
 * ## Swappable
 *
 * The procedural props are stand-ins. If `public/models-exp/windwaker/props/<pistol|dagger|sword>.glb` exists (`./swaps.ts`), that file is used in its place: **origin at the grip, +Z along the blade or barrel, +Y up**
 * (the convention below), authored in metres for a girl of her native height (about 1.2 m, so a pistol 0.22 m long), used at scale 1 and mirrored in the left hand (the files are made for the right: `PropSpec.mirrorSwapped`). A name with no file keeps its procedural prop, and a missing folder
 * changes nothing ({@link chooseProp}).
 *
 * ## The grip frame
 *
 * Every prop is built with its origin in the grip, +Z along the forearm (the barrel, the blade), +Y "up" (the sights, the edge side). {@link gripFrame} computes, from the rest pose, the rotation that takes that frame to
 * the hand bone's: +Z = the forearm direction (elbow to wrist, pointing away from the body), +Y = the character's forward (+Z at rest) made perpendicular to it (the thumb side). In the combat stance the forearms are
 * carried low and toward the camera while the picture holds the weapons at the boss, so {@link aimProps} (called once, with the girl posed in her stance and turned to her final yaw) changes each prop's rotation relative to
 * its bone so the weapon points toward `target` at the spec's elevation, bending no more than `turn` degrees away from the forearm. The result is a fixed offset from the bone, so the weapon still follows every clip.
 *
 * Needs three.js only. Game case: FFX-2 only.
 */

import { BoxGeometry, CylinderGeometry, ExtrudeGeometry, Group, Matrix4, Mesh, MathUtils, Object3D, Quaternion, Shape, SphereGeometry, TorusGeometry, Vector3, type BufferGeometry, type IUniform, type MeshToonMaterial } from 'three';
import type { PropName } from './layout.ts';
import { makeToonMaterial } from './toon.ts';
import { toonify } from './toonify.ts';

type Uniforms = Record<string, IUniform>;

function part(group: Group, geo: BufferGeometry, mat: MeshToonMaterial, at?: [number, number, number], rot?: [number, number, number]): Mesh {
  const m = new Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = false;
  if (at) m.position.set(...at);
  if (rot) m.rotation.set(...rot);
  group.add(m);
  return m;
}

/** A flat blade (an extruded polygon): width along X, length along +Z, thickness along Y. `teeth` > 0 saws both edges (Paine's sword). */
function blade(len: number, width: number, thick: number, teeth = 0, tipFrac = 0.18): BufferGeometry {
  const w = width / 2;
  const body = len * (1 - tipFrac);
  const right: Array<[number, number]> = [[w, 0]];
  if (teeth) {
    for (let k = 0; k < teeth; k++) {
      const y0 = (body * k) / teeth;
      const y1 = (body * (k + 0.5)) / teeth;
      const y2 = (body * (k + 1)) / teeth;
      right.push([w, y0 + (y1 - y0) * 0.2], [w * 1.6, y1], [w, y2]);
    }
  } else right.push([w, body]);
  const pts: Array<[number, number]> = [...right, [0, len], ...right.map(([x, y]): [number, number] => [-x, y]).reverse()];
  const s = new Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  g.translate(0, 0, -thick / 2);
  g.rotateX(Math.PI / 2); // length (+Y) -> +Z, thickness (Z) -> Y
  return g;
}

export function makePistol(uniforms: Uniforms): Group {
  const t = (c: number): MeshToonMaterial => makeToonMaterial(uniforms, { color: c });
  const g = new Group();
  g.name = 'prop:pistol';
  const black = t(0x1d1d2c);
  const steel = t(0x3b3f55);
  const gold = t(0xe2b53c);
  const grip = t(0x35264a);
  part(g, new BoxGeometry(0.075, 0.095, 0.24), black, [0, 0.07, 0.1]); // frame / slide
  part(g, new CylinderGeometry(0.034, 0.034, 0.12, 12).rotateX(Math.PI / 2), steel, [0, 0.07, 0.27]); // barrel
  part(g, new TorusGeometry(0.036, 0.011, 6, 14), gold, [0, 0.07, 0.3]); // gold muzzle ring
  part(g, new BoxGeometry(0.078, 0.02, 0.2), gold, [0, 0.125, 0.1]); // gold rib on top
  part(g, new BoxGeometry(0.06, 0.15, 0.07), grip, [0, -0.02, -0.01], [-0.22, 0, 0]); // grip, raked back
  part(g, new BoxGeometry(0.02, 0.03, 0.04), black, [0, 0.14, 0.0]); // rear sight
  part(g, new BoxGeometry(0.01, 0.07, 0.07), gold, [0.04, 0.07, 0.12]); // gold inlay, one side
  part(g, new BoxGeometry(0.01, 0.07, 0.07), gold, [-0.04, 0.07, 0.12]);
  return g;
}

export function makeDagger(uniforms: Uniforms): Group {
  const t = (c: number): MeshToonMaterial => makeToonMaterial(uniforms, { color: c });
  const g = new Group();
  g.name = 'prop:dagger';
  const gold = t(0xf6c637);
  const red = t(0xd24a1d);
  const brown = t(0x5a3a22);
  part(g, new CylinderGeometry(0.026, 0.026, 0.12, 10).rotateX(Math.PI / 2), brown, [0, 0, 0]); // grip
  part(g, new SphereGeometry(0.034, 10, 8), red, [0, 0, -0.07]); // pommel
  part(g, new BoxGeometry(0.03, 0.12, 0.03), red, [0, 0, 0.075]); // cross-guard (long axis along the edge side)
  part(g, blade(0.27, 0.075, 0.022, 0, 0.28), gold, [0, 0, 0.09]);
  return g;
}

export function makeSword(uniforms: Uniforms): Group {
  const t = (c: number): MeshToonMaterial => makeToonMaterial(uniforms, { color: c });
  const g = new Group();
  g.name = 'prop:sword';
  const red = t(0xc7222d);
  const tip = t(0xf0e6ea);
  const dark = t(0x24242f);
  const wrap = t(0x8a1620);
  part(g, new CylinderGeometry(0.03, 0.03, 0.2, 10).rotateX(Math.PI / 2), dark, [0, 0, 0]); // grip
  part(g, new CylinderGeometry(0.031, 0.031, 0.05, 10).rotateX(Math.PI / 2), wrap, [0, 0, 0.05]); // red wrap
  part(g, new SphereGeometry(0.045, 10, 8), dark, [0, 0, -0.11]); // pommel
  part(g, new BoxGeometry(0.05, 0.22, 0.045), dark, [0, 0, 0.115]); // cross-guard
  part(g, new SphereGeometry(0.032, 8, 6), red, [0, 0.1, 0.115]);
  part(g, new SphereGeometry(0.032, 8, 6), red, [0, -0.1, 0.115]);
  const b = part(g, blade(0.8, 0.07, 0.026, 6, 0.16), red, [0, 0, 0.14]);
  b.name = 'blade';
  part(g, blade(0.14, 0.05, 0.036, 0, 0.55), tip, [0, 0, 0.14 + 0.8 - 0.1]); // pale tip
  return g;
}

/** One weapon of a girl. */
export interface PropSpec {
  readonly hand: 'LeftHand' | 'RightHand';
  readonly name: PropName;
  /** Size factor on the procedural prop as built (TARGET-C: pistols about 0.18 of a girl's height, daggers about 0.2, Paine's sword about 0.75). A swapped file is used at 1. */
  readonly scale: number;
  /** Degrees the tip is raised toward the thumb side. */
  readonly tilt: number;
  /** How far along the arm the grip sits past the wrist bone, model units. */
  readonly grip: number;
  /** Where the weapon points in the combat stance: degrees above the horizon, and the most the wrist may bend away from the forearm line. */
  readonly aim: { readonly elev: number; readonly turn: number };
  /** A swapped file is made for one hand: in the other (the left) it is used mirrored across the plane the barrel or blade lies in (`scale.x = -1`; three flips the winding of a mirrored mesh). The procedural props are not mirrored. */
  readonly mirrorSwapped: boolean;
}

export const PROP_SPECS: Readonly<Record<'yuna' | 'rikku' | 'paine', readonly PropSpec[]>> = {
  yuna: [
    { hand: 'LeftHand', name: 'pistol', scale: 0.62, tilt: 0, grip: 0.07, aim: { elev: 22, turn: 85 }, mirrorSwapped: true },
    { hand: 'RightHand', name: 'pistol', scale: 0.62, tilt: 0, grip: 0.07, aim: { elev: 8, turn: 85 }, mirrorSwapped: false },
  ],
  rikku: [
    { hand: 'LeftHand', name: 'dagger', scale: 0.78, tilt: 0, grip: 0.06, aim: { elev: -25, turn: 70 }, mirrorSwapped: true },
    { hand: 'RightHand', name: 'dagger', scale: 0.78, tilt: 0, grip: 0.06, aim: { elev: -15, turn: 70 }, mirrorSwapped: false },
  ],
  paine: [{ hand: 'RightHand', name: 'sword', scale: 0.65, tilt: 0, grip: 0.07, aim: { elev: 25, turn: 80 }, mirrorSwapped: false }],
};

const MAKERS: Readonly<Record<PropName, (u: Uniforms) => Group>> = { pistol: makePistol, dagger: makeDagger, sword: makeSword };

/** The swapped files found, by prop name (`./swaps.ts`). */
export type PropSwaps = Readonly<Partial<Record<PropName, Object3D>>>;

/** The prop for `name`: the swapped file's clone (made toon, at scale 1) when there is one, else the procedural one. `swapped` says which. */
export function chooseProp(name: PropName, uniforms: Uniforms, swaps: PropSwaps | undefined): { object: Object3D; swapped: boolean } {
  const file = swaps?.[name];
  if (file) {
    const object = file.clone(true);
    object.name = `prop:${name}`;
    toonify(object, uniforms, { receive: false });
    return { object, swapped: true };
  }
  return { object: MAKERS[name](uniforms), swapped: false };
}

/**
 * The grip frame in the hand bone's own space, from the rest pose: +Z of the prop = the forearm direction (elbow to wrist, pointing away from the body), +Y = the character's forward (+Z at rest) made perpendicular
 * to it (the thumb side). Null when the model lacks the hand or forearm bone. Call with the model in its rest pose.
 */
export function gripFrame(model: Object3D, handName: string): { quat: Quaternion; hand: Object3D } | null {
  model.updateMatrixWorld(true);
  const hand = model.getObjectByName(handName);
  const fore = model.getObjectByName(handName.replace('Hand', 'ForeArm'));
  if (!hand || !fore) return null;
  const ph = hand.getWorldPosition(new Vector3());
  const pf = fore.getWorldPosition(new Vector3());
  const q = hand.getWorldQuaternion(new Quaternion());
  const a = ph.sub(pf).normalize();
  const up = new Vector3(0, 0, 1);
  up.addScaledVector(a, -up.dot(a)).normalize();
  const x = new Vector3().crossVectors(up, a).normalize();
  const world = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, up, a));
  return { quat: q.invert().multiply(world), hand };
}

/** What a girl's props are: the objects (parented to her hand bones) and how many came from files. */
export interface Attached {
  readonly props: readonly Object3D[];
  readonly swapped: number;
}

/** Parent the girl's weapons to her hand bones (the model must be in its rest pose and not yet scaled by the fit's parents differently from how it will be drawn: the frame is in the bone's own space). */
export function attachProps(model: Object3D, who: string, uniforms: Uniforms, swaps?: PropSwaps): Attached {
  const out: Object3D[] = [];
  let swapped = 0;
  const specs = (PROP_SPECS as Readonly<Record<string, readonly PropSpec[] | undefined>>)[who] ?? [];
  for (const spec of specs) {
    const f = gripFrame(model, spec.hand);
    if (!f) continue;
    const chosen = chooseProp(spec.name, uniforms, swaps);
    const prop = chosen.object;
    if (chosen.swapped) swapped++;
    const tilt = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -MathUtils.degToRad(spec.tilt));
    prop.quaternion.copy(f.quat).multiply(tilt);
    if (chosen.swapped) prop.scale.set(spec.mirrorSwapped ? -1 : 1, 1, 1);
    else prop.scale.setScalar(spec.scale);
    prop.position.copy(new Vector3(0, 0, spec.grip).applyQuaternion(f.quat));
    prop.userData['spec'] = spec;
    f.hand.add(prop);
    out.push(prop);
  }
  return { props: out, swapped };
}

/** Free the geometry of procedural props (a swapped file's belongs to its cache) and take them off the bones. */
export function disposeProps(attached: Attached): void {
  for (const p of attached.props) {
    p.removeFromParent();
    p.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) m.dispose();
      }
    });
  }
}

/**
 * Calibrate each prop in the combat stance (call once, with the girl posed at her stance and turned to her final yaw): the prop's rotation relative to its hand bone is changed so the weapon points toward `target`
 * (a world point, Valefor's chest) at the spec's elevation, bending no more than `turn` degrees away from where the forearm points.
 */
export function aimProps(model: Object3D, props: readonly Object3D[], target: Vector3): void {
  model.updateMatrixWorld(true);
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  for (const prop of props) {
    const spec = prop.userData['spec'] as PropSpec | undefined;
    const hand = prop.parent;
    if (!spec || !hand) continue;
    const handPos = hand.getWorldPosition(new Vector3());
    const handQ = hand.getWorldQuaternion(new Quaternion());
    const wq = prop.getWorldQuaternion(new Quaternion());
    const fwd = new Vector3(0, 0, 1).applyQuaternion(wq);
    const flat = target.clone().sub(handPos).setY(0).normalize();
    const e = MathUtils.degToRad(spec.aim.elev);
    const desired = flat.multiplyScalar(Math.cos(e)).addScaledVector(up, Math.sin(e)).normalize();
    const angle = fwd.angleTo(desired);
    const k = angle > 1e-4 ? Math.min(1, MathUtils.degToRad(spec.aim.turn) / angle) : 0;
    const full = q.clone().setFromUnitVectors(fwd, desired);
    const partial = new Quaternion().slerpQuaternions(new Quaternion(), full, k);
    prop.quaternion.copy(handQ.invert().multiply(partial.multiply(wq)));
    prop.userData['aimed'] = { angle: MathUtils.radToDeg(angle), applied: MathUtils.radToDeg(angle * k) };
  }
}
