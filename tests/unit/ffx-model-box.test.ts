/**
 * **Where a model's body is, cheaply** (`src/engine/ffx3d/modelBox.ts`; FFX only): the bones' box widened by what the idle pose's vertices stand beyond them, measured once in the model's own frame. A synthetic
 * skinned mesh (a 2-bone rig: a root and a hand that can move) stands in for a converted FFX model (rule 8: no retail data in the tests).
 *
 * Pins: the honest vertex box is the skinned mesh's (it follows a moving bone); the live box at the idle pose is the vertex box (the widening makes up what the bones leave out), and it follows a bone that
 * moves, a model that is turned or moved (the widening turns with the body: it is kept in the model's frame), and one that is scaled; a model with no bones gets no live box; a hidden mesh is not part
 * of the honest box.
 *
 * Game case: FFX only.
 */
import { BufferAttribute, BufferGeometry, Bone, Group, Mesh, MeshBasicMaterial, Skeleton, SkinnedMesh } from 'three';
import { describe, expect, it } from 'vitest';

import { liveBoxOf, vertexBoxLocal } from '../../src/engine/ffx3d/modelBox.ts';

/** A rig: `root` at the origin, `hand` a unit above it; a box of vertices from y = -0.5 to 1.5 (the root half, then the hand half), 2 wide, skinned by height. */
function rig(): { model: Group; root: Bone; hand: Bone; mesh: SkinnedMesh } {
  const root = new Bone();
  const hand = new Bone();
  hand.position.set(0, 1, 0);
  root.add(hand);
  const positions: number[] = [];
  const skinIndex: number[] = [];
  const skinWeight: number[] = [];
  // two rings of four vertices: the lower ring (y -0.5) follows the root, the upper (y 1.5) the hand
  for (const [y, bone] of [[-0.5, 0], [1.5, 1]] as const) {
    for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      positions.push(x, y, z);
      skinIndex.push(bone, 0, 0, 0);
      skinWeight.push(1, 0, 0, 0);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('skinIndex', new BufferAttribute(new Uint16Array(skinIndex), 4));
  geometry.setAttribute('skinWeight', new BufferAttribute(new Float32Array(skinWeight), 4));
  const mesh = new SkinnedMesh(geometry, new MeshBasicMaterial());
  mesh.add(root);
  mesh.bind(new Skeleton([root, hand]));
  const model = new Group();
  model.add(mesh);
  return { model, root, hand, mesh };
}

const round = (v: readonly number[]): number[] => v.map((n) => Math.round(n * 1e6) / 1e6);

describe('the honest box', () => {
  it('is the skinned mesh\'s vertices in the model\'s frame: the rest pose, and a moving bone', () => {
    const { model, hand } = rig();
    expect(round(vertexBoxLocal(model, 1).min.toArray())).toEqual([-1, -0.5, -1]);
    expect(round(vertexBoxLocal(model, 1).max.toArray())).toEqual([1, 1.5, 1]);
    hand.position.y = 3; // the hand's vertices rise with it
    expect(round(vertexBoxLocal(model, 1).max.toArray())).toEqual([1, 3.5, 1]);
  });

  it('leaves a hidden mesh out and an empty model empty', () => {
    const { model, mesh } = rig();
    mesh.visible = false;
    expect(vertexBoxLocal(model, 1).isEmpty()).toBe(true);
    expect(vertexBoxLocal(new Group(), 1).isEmpty()).toBe(true);
    expect(vertexBoxLocal(new Group().add(new Mesh()), 1).isEmpty()).toBe(true);
  });
});

describe('the live box', () => {
  it('at the idle pose is the honest box: the widening makes up what the bones leave out', () => {
    const { model } = rig();
    const live = liveBoxOf(model)!;
    const box = live()!;
    expect(round(box.min)).toEqual([-1, -0.5, -1]);
    expect(round(box.max)).toEqual([1, 1.5, 1]);
  });

  it('follows a bone that moves, keeping the widening', () => {
    const { model, hand } = rig();
    const live = liveBoxOf(model)!;
    hand.position.y = 3; // the bones now span y 0..3; the vertices stood 0.5 below the root's bone and 0.5 above the hand's
    const box = live()!;
    expect(round(box.min)).toEqual([-1, -0.5, -1]);
    expect(round(box.max)).toEqual([1, 3.5, 1]);
  });

  it('moves with the model, and the widening turns with it (a quarter turn about y swaps x and z, which are symmetric here; a long box shows it)', () => {
    const { model } = rig();
    model.position.set(10, 0, -4);
    model.rotation.y = Math.PI / 2;
    const live = liveBoxOf(model)!;
    const box = live()!;
    expect(round(box.min)).toEqual([9, -0.5, -5]);
    expect(round(box.max)).toEqual([11, 1.5, -3]);
  });

  it('a scaled model has a scaled box', () => {
    const { model } = rig();
    model.scale.setScalar(2);
    const box = liveBoxOf(model)!()!;
    expect(round(box.min)).toEqual([-2, -1, -2]);
    expect(round(box.max)).toEqual([2, 3, 2]);
  });

  it('a model with no bones, or no vertices, has no live box', () => {
    expect(liveBoxOf(new Group())).toBeNull();
    const plain = new Group();
    plain.add(new Mesh(new BufferGeometry().setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 1, 2, 0, 1]), 3)), new MeshBasicMaterial()));
    expect(liveBoxOf(plain)).toBeNull();
  });
});
