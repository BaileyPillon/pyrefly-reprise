/**
 * **The girls' weapons** (`src/engine/yrp3d/props.ts`; the hidden 3D Bahamut chapter, FFX-2 only): small low-poly props built in code and parented to the models' hand bones. What it pins, on made-up skeletons (a
 * bone named `RightHand` and one named `LeftHand`, with the local axes the real files' hands have: +Y along the arm, +Z toward the thumb):
 *
 * 1. **Who holds what**: Yuna two pistols (one a hand), Rikku two daggers, Paine one sword in the right hand; Bahamut and a figure with no such bone hold nothing.
 * 2. **How they sit in the hand**: the prop's barrel or blade (its +Z) is the hand's +Y, its sight or edge (+Y) the hand's +Z, placed `PALM` along the hand, scaled by the figure's height; Paine's sword is tilted up a little.
 * 3. **What they are**: a pistol with a slide, a barrel, a sight and a grip; a dagger with a curved blade that bends up and tapers; a sword with a long dark blade, a point, a red guard, grip and pommel. About the sizes they should be.
 * 4. **Through the model**: the props become toon with the figure (hull and all), do not change the figure's fit, and are freed with it.
 */
import { Box3, Bone, BoxGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, MeshToonMaterial, Object3D, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { YrpModel } from '../../../src/engine/yrp3d/model.ts';
import { PALM, PROP_COLOUR, PROP_TO_HAND, REFERENCE_HEIGHT, attachProps, dagger, pistol, sword } from '../../../src/engine/yrp3d/props.ts';
import { PARTY_HEIGHT, YRP_CAST, type YrpId } from '../../../src/engine/yrp3d/layout.ts';

/** A skeleton with two hand bones (at the wrists, in a 1.6 m figure) and a body; the bones have no rotation, so the hand's axes are the scene's. */
function skeleton(): { root: Group; right: Bone; left: Bone } {
  const root = new Group();
  const right = new Bone();
  right.name = 'RightHand';
  right.position.set(-0.4, 0.9, 0);
  const left = new Bone();
  left.name = 'LeftHand';
  left.position.set(0.4, 0.9, 0);
  root.add(right, left);
  return { root, right, left };
}

const size = (o: Object3D): Vector3 => new Box3().setFromObject(o).getSize(new Vector3());
const meshes = (o: Object3D): Mesh[] => {
  const out: Mesh[] = [];
  o.traverse((c) => (c as Mesh).isMesh && out.push(c as Mesh));
  return out;
};

describe('the hand frame', () => {
  it('turns a prop\'s +Z (barrel, blade) into the hand\'s +Y (along the arm) and its +Y (sight, edge) into the hand\'s +Z (toward the thumb), a proper rotation', () => {
    const z = new Vector3(0, 0, 1).applyQuaternion(PROP_TO_HAND);
    const y = new Vector3(0, 1, 0).applyQuaternion(PROP_TO_HAND);
    const x = new Vector3(1, 0, 0).applyQuaternion(PROP_TO_HAND);
    expect(z.toArray().map((v) => Math.round(v * 1e6) / 1e6 + 0)).toEqual([0, 1, 0]);
    expect(y.toArray().map((v) => Math.round(v * 1e6) / 1e6 + 0)).toEqual([0, 0, 1]);
    expect(x.toArray().map((v) => Math.round(v * 1e6) / 1e6 + 0)).toEqual([-1, 0, 0]);
    expect(new Matrix4().makeRotationFromQuaternion(PROP_TO_HAND).determinant()).toBeCloseTo(1, 9); // not a mirror
  });
});

describe('who holds what', () => {
  it('gives Yuna two pistols, Rikku two daggers and Paine one sword in the right hand, each parented to its hand bone', () => {
    const y = skeleton();
    const yuna = attachProps('yuna', y.root, REFERENCE_HEIGHT);
    expect(yuna.props.map((p) => [p.bone, p.prop.object.name])).toEqual([['RightHand', 'prop-yuna-RightHand'], ['LeftHand', 'prop-yuna-LeftHand']]);
    expect(y.right.children).toHaveLength(1);
    expect(y.left.children).toHaveLength(1);
    expect(meshes(y.right).map((m) => m.name)).toContain('barrel');
    const r = skeleton();
    expect(attachProps('rikku', r.root, REFERENCE_HEIGHT).props.map((p) => p.bone)).toEqual(['RightHand', 'LeftHand']);
    expect(meshes(r.right).map((m) => m.name)).toContain('blade-0');
    const p = skeleton();
    const paine = attachProps('paine', p.root, REFERENCE_HEIGHT);
    expect(paine.props.map((q) => q.bone)).toEqual(['RightHand']);
    expect(p.left.children).toHaveLength(0);
    expect(meshes(p.right).map((m) => m.name)).toEqual(expect.arrayContaining(['blade', 'guard', 'grip', 'pommel', 'point']));
  });

  it('gives Bahamut nothing, and a scene with no such bone (a capsule) nothing, without an error', () => {
    const b = skeleton();
    expect(attachProps('bahamut', b.root, 7).props).toEqual([]);
    expect(b.right.children).toHaveLength(0);
    for (const id of ['yuna', 'rikku', 'paine'] as YrpId[]) expect(attachProps(id, new Group(), 1.6).props).toEqual([]);
    const half = new Group();
    const lone = new Bone();
    lone.name = 'RightHand';
    half.add(lone);
    expect(attachProps('yuna', half, 1.6).props.map((q) => q.bone)).toEqual(['RightHand']); // only the bone that exists
  });
});

describe('how they sit in the hand', () => {
  it('points the barrel or blade along the arm (the hand\'s +Y) from PALM beyond the wrist, scaled by the figure\'s height', () => {
    for (const [id, height] of [['yuna', 1.6], ['yuna', 1.6 * 1.25], ['rikku', 1.55]] as const) {
      const { root, right } = skeleton();
      const kit = attachProps(id, root, height);
      const unit = height / REFERENCE_HEIGHT;
      const object = kit.props[0]!.prop.object;
      expect(object.position.toArray()).toEqual([0, PALM * unit, 0]);
      const barrel = object.getObjectByName(id === 'yuna' ? 'barrel' : 'blade-4')!;
      root.updateMatrixWorld(true);
      const tip = barrel.getWorldPosition(new Vector3());
      const wrist = right.getWorldPosition(new Vector3());
      const along = tip.sub(wrist);
      expect(along.y, id).toBeGreaterThan(PALM * unit); // out along the hand's +Y beyond the grip
      expect(Math.abs(along.x) + Math.abs(along.z), id).toBeLessThan(along.y * 0.5); // and nearly straight along it
    }
  });

  it('puts the sight and the edge toward the thumb (the hand\'s +Z), and tilts Paine\'s sword up toward it', () => {
    const { root } = skeleton();
    const kit = attachProps('yuna', root, REFERENCE_HEIGHT);
    root.updateMatrixWorld(true);
    const grip = kit.props[0]!.prop.object.getObjectByName('grip')!.getWorldPosition(new Vector3());
    const sight = kit.props[0]!.prop.object.getObjectByName('sight')!.getWorldPosition(new Vector3());
    expect(sight.z).toBeGreaterThan(grip.z); // the sight is toward the thumb of the grip
    const s = skeleton();
    const p = attachProps('paine', s.root, REFERENCE_HEIGHT);
    s.root.updateMatrixWorld(true);
    const blade = p.props[0]!.prop.object.getObjectByName('blade')!.getWorldPosition(new Vector3());
    const wrist = s.right.getWorldPosition(new Vector3());
    expect(blade.z - wrist.z).toBeGreaterThan(0.05); // raised toward the thumb side by the tilt
    expect(blade.y - wrist.y).toBeGreaterThan(0.4);
    const tilted = new Quaternion().copy(p.props[0]!.prop.object.quaternion);
    expect(tilted.angleTo(PROP_TO_HAND)).toBeCloseTo(0.2, 6);
    expect(new Quaternion().copy(kit.props[0]!.prop.object.quaternion).angleTo(PROP_TO_HAND)).toBeCloseTo(0, 9); // the pistols are not tilted
  });
});

describe('what they are', () => {
  it('a pistol: a slide, a barrel, a sight and a grip, about 0.2 m long, in gunmetal blue-grey with a darker grip', () => {
    const { object, geometries } = pistol();
    expect(meshes(object).map((m) => m.name).sort()).toEqual(['barrel', 'grip', 'guard', 'sight', 'slide']);
    expect(geometries).toHaveLength(5);
    expect(size(object).z).toBeGreaterThan(0.17);
    expect(size(object).z).toBeLessThan(0.25);
    expect((object.getObjectByName('slide') as Mesh & { material: { color: { getHex(): number } } }).material.color.getHex()).toBe(PROP_COLOUR.gun);
    expect((object.getObjectByName('grip') as Mesh & { material: { color: { getHex(): number } } }).material.color.getHex()).toBe(PROP_COLOUR.gunGrip);
  });

  it('a dagger: a curved blade of five tapering segments that bends up, a guard and a wrapped grip, about a third of a metre', () => {
    const { object } = dagger();
    const blade = meshes(object).filter((m) => m.name.startsWith('blade-'));
    expect(blade).toHaveLength(5);
    const heights = blade.map((m) => (m.geometry as unknown as { parameters: { height: number } }).parameters.height);
    for (let i = 1; i < heights.length; i++) expect(heights[i]!).toBeLessThan(heights[i - 1]!); // taper
    const ys = blade.map((m) => m.position.y);
    for (let i = 1; i < ys.length; i++) expect(ys[i]!).toBeGreaterThan(ys[i - 1]!); // bends up
    for (let i = 1; i < blade.length; i++) expect(blade[i]!.position.z).toBeGreaterThan(blade[i - 1]!.position.z); // and goes on out
    expect(size(object).z).toBeGreaterThan(0.28);
    expect(size(object).z).toBeLessThan(0.42);
    expect(object.getObjectByName('guard')).toBeDefined();
  });

  it('a sword: a long dark blade with a point, a red guard, grip and pommel, over a metre with its hilt', () => {
    const { object } = sword();
    expect(size(object).z).toBeGreaterThan(1.1);
    expect(size(object).z).toBeLessThan(1.35);
    const colour = (n: string): number => (object.getObjectByName(n) as Mesh & { material: { color: { getHex(): number } } }).material.color.getHex();
    expect([colour('blade'), colour('point'), colour('guard'), colour('grip')]).toEqual([PROP_COLOUR.darkBlade, PROP_COLOUR.darkBlade, PROP_COLOUR.red, PROP_COLOUR.red]);
    expect(colour('pommel')).toBe(PROP_COLOUR.redDark);
    expect(size(sword(2).object).z).toBeCloseTo(size(object).z * 2, 4); // scales with the unit
  });

  it('frees what it made: the parts leave the bone and every geometry is disposed', () => {
    const { root, right } = skeleton();
    const kit = attachProps('yuna', root, REFERENCE_HEIGHT);
    let disposed = 0;
    for (const { prop } of kit.props) for (const g of prop.geometries) g.addEventListener('dispose', () => disposed++);
    const made = kit.props.reduce((n, p) => n + p.prop.geometries.length, 0);
    kit.dispose();
    expect(disposed).toBe(made);
    expect(right.children).toHaveLength(0);
  });
});

describe('through the model', () => {
  it('turns the props toon with the figure, hull and all, and does not change the figure\'s fit (the box is measured before they are added)', () => {
    const make = (): Group => {
      const g = new Group();
      const body = new Mesh(new BoxGeometry(0.5, 1.6, 0.3), new MeshStandardMaterial({ color: 0x889988 }));
      body.position.y = 0.8;
      const right = new Bone();
      right.name = 'RightHand';
      right.position.set(-0.4, 0.9, 0);
      g.add(body, right);
      return g;
    };
    const withSword = new YrpModel('paine', make(), [], PARTY_HEIGHT);
    const box = new Box3().setFromObject(withSword.root);
    expect(box.max.y - box.min.y).toBeGreaterThan(PARTY_HEIGHT - 1e-6); // at least the body: the sword reaches further out and down, but the body alone sets the scale
    const swordMeshes = meshes(withSword.root).filter((m) => ['blade', 'guard', 'grip', 'pommel', 'point'].includes(m.name));
    expect(swordMeshes).toHaveLength(5);
    for (const m of swordMeshes) expect(m.material, m.name).toBeInstanceOf(MeshToonMaterial);
    const hulls = meshes(withSword.root).filter((m) => m.userData['yrpHull'] === true && m.parent === swordMeshes[0]!.parent);
    expect(hulls).toHaveLength(5); // an ink hull beside each part
    expect(withSword.height).toBe(PARTY_HEIGHT);
    const none = new YrpModel('bahamut', make(), [], PARTY_HEIGHT);
    expect(meshes(none.root).filter((m) => m.name === 'blade')).toHaveLength(0);
    withSword.dispose();
    expect(meshes(withSword.root).filter((m) => m.name === 'blade')).toHaveLength(0);
    expect(YRP_CAST).toContain('paine');
  });
});
