/**
 * **The girls' weapons** (`src/engine/yrp3d/props.ts`; the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only): small low-poly props built in code and parented to the real models' hands. What it pins, on a made-up
 * skeleton built the way the real ones are (nodes that are only offsets, named `SkeletonNode_<n>`, arms out and down, a palm with finger chains under it, the thumb toward +Z; the arm numbers differ per figure, so a hand is
 * found by its shape, never by its name):
 *
 * 1. **Finding the hands**: the palm is the node with three or more finger chains standing farthest out on each side, the wrist its parent; the shoulder (three children too, but near the axis) is not a hand; a figure with
 *    its arms in, a capsule and an empty scene have none.
 * 2. **Who holds what**: Yuna two pistols, Rikku two daggers, Paine one sword in the right hand (the figure's right, -X when it faces +Z); Bahamut and a figure with no hands hold nothing.
 * 3. **How they sit in the hand**: the barrel or blade (the prop's +Z) lies along the arm, the sight or edge (+Y) toward the thumb, a proper rotation, the grip in the middle of the palm, scaled by the figure's height; the
 *    barrel keeps following the forearm when the arm is turned (the motion); Paine's sword is tilted up a little.
 * 4. **What they are**: a pistol, a dagger, a sword, about the sizes they should be.
 * 5. **Through the model**: the props are covered with the soft material with the figure, do not change its fit, and are freed with it.
 */
import { Box3, BoxGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { YrpModel } from '../../../src/engine/yrp3d/model.ts';
import { GRIP_BACK, HAND_REACH, PROP_COLOUR, REFERENCE_HEIGHT, attachProps, dagger, findHands, gripPosition, gripRotation, pistol, sword } from '../../../src/engine/yrp3d/props.ts';
import { PARTY_HEIGHT, type YrpId } from '../../../src/engine/yrp3d/layout.ts';

interface Arm {
  shoulder: Object3D;
  wrist: Object3D;
  palm: Object3D;
}

/** An arm on side `s` (+1 the figure's left, +X): shoulder, elbow, wrist, palm and three finger chains, with the offsets of a real 16-tall girl (the arm runs out and down, 45 degrees). */
function arm(s: 1 | -1, base: number): Arm {
  const node = (name: string, x: number, y: number, z: number, parent?: Object3D): Object3D => {
    const o = new Object3D();
    o.name = name;
    o.position.set(s * x, y, z);
    parent?.add(o);
    return o;
  };
  const shoulder = node(`SkeletonNode_${base}`, 1.3, 13.5, -0.4);
  const elbow = node(`SkeletonNode_${base + 1}`, 1.8, -1.8, -0.1, shoulder);
  const wrist = node(`SkeletonNode_${base + 2}`, 1.7, -1.8, 0, elbow);
  const palm = node(`SkeletonNode_${base + 3}`, 0.6, -0.6, 0, wrist);
  node(`SkeletonNode_${base + 4}`, 0.2, -0.1, -0.3, palm);
  node(`SkeletonNode_${base + 5}`, 0.25, -0.15, 0, palm);
  node(`SkeletonNode_${base + 6}`, 0.15, -0.2, 0.3, palm);
  node(`SkeletonNode_${base + 7}`, 0.4, 0.2, 0.5, shoulder); // a node of the shoulder's own (the shoulder has 2 children: the elbow and this)
  node(`SkeletonNode_${base + 8}`, 0.1, 0.2, 0.2, shoulder); // and a third: the shoulder has three children too, but stands near the axis
  return { shoulder, wrist, palm };
}

/** A 16-tall figure with a body, arms out and down, facing +Z: the left arm (+X) numbered 28 and up, the right (-X) 56 and up, as in Yuna's file. */
function skeleton(): { root: Group; left: Arm; right: Arm } {
  const root = new Group();
  const body = new Mesh(new BoxGeometry(2, 16, 1), new MeshStandardMaterial({ color: 0x889988 }));
  body.position.y = 8;
  const left = arm(1, 28);
  const right = arm(-1, 56);
  root.add(body, left.shoulder, right.shoulder);
  root.updateMatrixWorld(true);
  return { root, left, right };
}

const size = (o: Object3D): Vector3 => new Box3().setFromObject(o).getSize(new Vector3());
const meshes = (o: Object3D): Mesh[] => {
  const out: Mesh[] = [];
  o.traverse((c) => (c as Mesh).isMesh && out.push(c as Mesh));
  return out;
};
const world = (o: Object3D): Vector3 => o.getWorldPosition(new Vector3());

describe('finding the hands', () => {
  it('finds the palm of each side by its finger chains and takes its parent for the wrist, whatever the nodes are called', () => {
    const { root, left, right } = skeleton();
    const hands = findHands(root);
    expect(hands.map((h) => h.side).sort()).toEqual(['left', 'right']);
    const l = hands.find((h) => h.side === 'left')!;
    const r = hands.find((h) => h.side === 'right')!;
    expect([l.palm, l.wrist]).toEqual([left.palm, left.wrist]);
    expect([r.palm, r.wrist]).toEqual([right.palm, right.wrist]);
    expect(world(l.palm).x).toBeGreaterThan(0); // the figure's left is +X when it faces +Z
    expect(world(r.palm).x).toBeLessThan(0);
  });

  it('is not fooled by a shoulder with three children (it stands within the reach of the axis), and finds none when the arms are in, in a capsule or in nothing', () => {
    const { root } = skeleton();
    const palms = findHands(root).map((h) => world(h.palm).x);
    for (const x of palms) expect(Math.abs(x)).toBeGreaterThan(16 * HAND_REACH);
    const armsIn = skeleton();
    armsIn.left.shoulder.position.x = 0.1;
    armsIn.left.shoulder.children[0]!.position.set(0.1, -1.8, 0); // the elbow and everything under it hang straight down by the body
    armsIn.left.shoulder.children[0]!.children[0]!.position.set(0, -1.8, 0);
    armsIn.left.palm.position.set(0.05, -0.6, 0);
    armsIn.root.updateMatrixWorld(true);
    expect(findHands(armsIn.root).map((h) => h.side)).toEqual(['right']); // only the arm that is out
    expect(findHands(new Group())).toEqual([]);
  });
});

describe('who holds what', () => {
  it('gives Yuna two pistols, Rikku two daggers and Paine one sword in the right hand, each parented to its palm', () => {
    const y = skeleton();
    const yuna = attachProps('yuna', y.root, REFERENCE_HEIGHT);
    expect(yuna.props.map((p) => [p.side, p.prop.object.name])).toEqual([['right', 'prop-yuna-right'], ['left', 'prop-yuna-left']]);
    expect(y.right.palm.getObjectByName('prop-yuna-right')).toBeDefined();
    expect(y.left.palm.getObjectByName('prop-yuna-left')).toBeDefined();
    expect(meshes(y.right.palm).map((m) => m.name)).toContain('barrel');
    const r = skeleton();
    expect(attachProps('rikku', r.root, REFERENCE_HEIGHT).props.map((p) => p.side)).toEqual(['right', 'left']);
    expect(meshes(r.right.palm).map((m) => m.name)).toContain('blade-0');
    const p = skeleton();
    expect(attachProps('paine', p.root, REFERENCE_HEIGHT).props.map((q) => q.side)).toEqual(['right']);
    expect(meshes(p.left.palm)).toHaveLength(0);
    expect(meshes(p.right.palm).map((m) => m.name)).toEqual(expect.arrayContaining(['blade', 'guard', 'grip', 'pommel', 'point']));
  });

  it('gives Bahamut nothing, and a scene with no hands (a capsule) nothing, without an error', () => {
    const b = skeleton();
    expect(attachProps('bahamut', b.root, 7).props).toEqual([]);
    expect(meshes(b.right.palm)).toHaveLength(0);
    for (const id of ['yuna', 'rikku', 'paine'] as YrpId[]) expect(attachProps(id, new Group(), 1.6).props).toEqual([]);
  });
});

describe('how they sit in the hand', () => {
  /** Where the +Z and +Y of a prop point in the world. */
  const axes = (o: Object3D): { z: Vector3; y: Vector3 } => {
    o.updateWorldMatrix(true, false);
    const q = o.getWorldQuaternion(new Quaternion());
    return { z: new Vector3(0, 0, 1).applyQuaternion(q), y: new Vector3(0, 1, 0).applyQuaternion(q) };
  };

  it('lies the barrel along the arm (wrist to palm) and the sight toward the thumb (+Z, forward), a proper rotation', () => {
    const { root, left, right } = skeleton();
    const kit = attachProps('yuna', root, REFERENCE_HEIGHT);
    for (const [side, a] of [['left', left], ['right', right]] as const) {
      const object = kit.props.find((p) => p.side === side)!.prop.object;
      const { z, y } = axes(object);
      const along = world(a.palm).sub(world(a.wrist)).normalize();
      expect(z.dot(along), side).toBeGreaterThan(0.999); // the barrel along the arm
      expect(y.dot(new Vector3(0, 0, 1)), side).toBeGreaterThan(0.999); // the sight toward the thumb: forward
    }
    const q = gripRotation(findHands(root)[0]!);
    expect(new Matrix4().makeRotationFromQuaternion(q).determinant()).toBeCloseTo(1, 9); // not a mirror
  });

  it('keeps the barrel along the forearm when the arm is turned (the game\'s motion): raise the shoulder\'s arm forward and the barrel follows', () => {
    const { root, right } = skeleton();
    const kit = attachProps('yuna', root, REFERENCE_HEIGHT);
    const object = kit.props.find((p) => p.side === 'right')!.prop.object;
    right.shoulder.rotation.x = -Math.PI / 2; // swing the arm up and forward (about the figure's x axis)
    root.updateMatrixWorld(true);
    const { z } = axes(object);
    const along = world(right.palm).sub(world(right.wrist)).normalize();
    expect(z.dot(along)).toBeGreaterThan(0.999);
    expect(along.z).toBeGreaterThan(0.5); // and the arm really did swing forward
  });

  it('puts the grip in the middle of the palm (GRIP_BACK of the way from the palm node toward the wrist), scaled to the figure: a taller one holds a longer pistol', () => {
    const { root, right } = skeleton();
    const kit = attachProps('yuna', root, REFERENCE_HEIGHT);
    const object = kit.props.find((p) => p.side === 'right')!.prop.object;
    const hand = findHands(root).find((h) => h.side === 'right')!;
    const mid = world(hand.palm).lerp(world(hand.wrist), GRIP_BACK);
    expect(world(object).distanceTo(mid)).toBeLessThan(1e-6);
    expect(gripPosition(hand).length()).toBeGreaterThan(0.1); // not on the palm node itself
    expect(right.palm.children).toContain(object);
    const small = size(attachProps('yuna', skeleton().root, 1.6).props[0]!.prop.object);
    const big = size(attachProps('yuna', skeleton().root, 3.2).props[0]!.prop.object);
    expect(big.z).toBeCloseTo(small.z * 2, 4);
  });

  it('holds the daggers and the sword across the palm with the blade out of the thumb side (forward), not dragged along the forearm: the pistols keep the barrel along the arm', () => {
    const { root, left, right } = skeleton();
    const rikku = attachProps('rikku', root, REFERENCE_HEIGHT);
    for (const [side, a] of [['left', left], ['right', right]] as const) {
      const object = rikku.props.find((q) => q.side === side)!.prop.object;
      const { z } = axes(object);
      const along = world(a.palm).sub(world(a.wrist)).normalize();
      expect(z.z, side).toBeGreaterThan(0.95); // the blade points forward, the thumb's way
      expect(Math.abs(z.dot(along)), side).toBeLessThan(0.3); // and is no longer along the forearm
    }
    const pistols = attachProps('yuna', skeleton().root, REFERENCE_HEIGHT);
    expect(pistols.props).toHaveLength(2);
  });

  it('tilts the dagger a little and the sword of Paine more, toward the shoulder (back along the forearm), and leaves the pistols straight', () => {
    const s = skeleton();
    const p = attachProps('paine', s.root, REFERENCE_HEIGHT);
    const hand = findHands(s.root).find((h) => h.side === 'right')!;
    const straight = gripRotation(hand, 0, 'thumb');
    const object = p.props[0]!.prop.object;
    expect(object.quaternion.angleTo(straight)).toBeCloseTo(0.3, 6);
    const along = world(s.right.palm).sub(world(s.right.wrist)).normalize();
    const { z } = axes(object);
    expect(z.dot(along)).toBeLessThan(-Math.sin(0.25)); // the point rises back toward the shoulder
    expect(z.z).toBeGreaterThan(Math.cos(0.35)); // and still points forward
    const r = skeleton();
    const dagger = attachProps('rikku', r.root, REFERENCE_HEIGHT).props.find((q) => q.side === 'right')!.prop.object;
    expect(dagger.quaternion.angleTo(gripRotation(findHands(r.root).find((h) => h.side === 'right')!, 0, 'thumb'))).toBeCloseTo(0.15, 6);
    const y = skeleton();
    const pistol = attachProps('yuna', y.root, REFERENCE_HEIGHT).props[0]!.prop.object;
    expect(pistol.quaternion.angleTo(gripRotation(findHands(y.root).find((h) => h.side === 'right')!))).toBeCloseTo(0, 6);
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

  it('frees what it made: the parts leave the palm and every geometry is disposed', () => {
    const { root, right } = skeleton();
    const kit = attachProps('yuna', root, REFERENCE_HEIGHT);
    let disposed = 0;
    for (const { prop } of kit.props) for (const g of prop.geometries) g.addEventListener('dispose', () => disposed++);
    const made = kit.props.reduce((n, p) => n + p.prop.geometries.length, 0);
    kit.dispose();
    expect(disposed).toBe(made);
    expect(meshes(right.palm)).toHaveLength(0);
  });
});

describe('through the model', () => {
  it('covers the props with the soft material with the figure, and does not change the figure\'s fit (the box is measured before they are added)', () => {
    const { root } = skeleton();
    const withSword = new YrpModel('paine', root, [], PARTY_HEIGHT);
    const box = new Box3().setFromObject(withSword.root);
    expect(box.max.y - box.min.y).toBeGreaterThan(PARTY_HEIGHT - 1e-6); // at least the body: the sword reaches further out and down, but the body alone sets the scale
    const swordMeshes = meshes(withSword.root).filter((m) => ['blade', 'guard', 'grip', 'pommel', 'point'].includes(m.name));
    expect(swordMeshes).toHaveLength(5);
    for (const m of swordMeshes) expect(withSword.materials, m.name).toContain(m.material as MeshStandardMaterial); // driven with the figure
    expect(meshes(withSword.root).filter((m) => m.name.endsWith('-ink'))).toHaveLength(0); // no ink hull
    expect(withSword.height).toBe(PARTY_HEIGHT);
    const none = new YrpModel('bahamut', skeleton().root, [], PARTY_HEIGHT);
    expect(meshes(none.root).filter((m) => m.name === 'blade')).toHaveLength(0);
    withSword.dispose();
    expect(meshes(withSword.root).filter((m) => m.name === 'blade')).toHaveLength(0);
  });
});
