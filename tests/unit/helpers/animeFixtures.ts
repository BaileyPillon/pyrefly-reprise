/**
 * **Fixtures for the anime chapter's tests** (FFX-2 only): a skinned girl of 1.6 m with the Meshy toon rig's bone names (`Hips`, `Spine`, `Head`, `head_end`, `headfront`, the legs, the shoulders, forearms and hands), one
 * `SkinnedMesh` whose first four vertices are on the face, the hair, the top of the head and its back, and the clips the toon girls carry (`idle`, `attack`, `hit`, `cast`, `ko`). Her head is 0.3 m long (Head to `head_end`),
 * so the face ellipse of `faceMask.ts` (Yuna's fit: centre 0.25 of that above the Head bone, 0.36 wide, 0.31 high, the face from the Head's front) has a known place.
 */
import { AnimationClip, Bone, BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, Object3D, QuaternionKeyframeTrack, Skeleton, SkinnedMesh, Texture } from 'three';

export interface Girl {
  scene: Object3D;
  animations: AnimationClip[];
  mesh: SkinnedMesh;
  skeleton: Skeleton;
  material: MeshStandardMaterial;
}

const rotY = (angle: number): number[] => [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];

/** Vertex 0 is on the face, 1 beside it, 2 behind the head (hair), 3 on top of the head, 4 on the hips, 5 at the feet. The head bone's origin is at y 1.3. */
export function skinnedGirl(opts: { clipNames?: readonly string[] } = {}): Girl {
  const scene = new Group();
  const bone = (name: string, x: number, y: number, z: number, parent: Object3D): Bone => {
    const b = new Bone();
    b.name = name;
    b.position.set(x, y, z);
    parent.add(b);
    return b;
  };
  const hips = bone('Hips', 0, 0.8, 0, scene);
  bone('LeftUpLeg', 0.1, 0, 0, hips);
  bone('RightUpLeg', -0.1, 0, 0, hips);
  const spine = bone('Spine', 0, 0.3, 0, hips);
  const head = bone('Head', 0, 0.2, 0, spine);
  bone('head_end', 0, 0.3, 0, head);
  bone('headfront', 0, 0, 0.1, head);
  for (const [side, x] of [['Left', 0.2], ['Right', -0.2]] as const) {
    const sh = bone(`${side}Shoulder`, x, 0.15, 0, spine);
    const fore = bone(`${side}ForeArm`, 0, -0.25, 0, sh);
    bone(`${side}Hand`, 0, -0.25, 0, fore);
  }
  const bones = [hips, spine, head];
  scene.updateMatrixWorld(true); // the bind pose is the pose the bones stand in now
  const skeleton = new Skeleton(bones);
  const geometry = new BufferGeometry();
  const pos = [0, 1.375, 0.1, 0.03, 1.36, 0.1, 0, 1.4, -0.1, 0, 1.58, 0, 0, 0.8, 0, 0, 0, 0];
  const nor = [0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, 1, 0, 0, 1];
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(12), 2));
  const joint = (i: number): number[] => (i < 4 ? [2, 0, 0, 0] : [0, 0, 0, 0]);
  geometry.setAttribute('skinIndex', new BufferAttribute(new Uint16Array([0, 1, 2, 3, 4, 5].flatMap(joint)), 4));
  geometry.setAttribute('skinWeight', new BufferAttribute(new Float32Array([0, 1, 2, 3, 4, 5].flatMap(() => [1, 0, 0, 0])), 4));
  geometry.setIndex([0, 1, 2, 2, 3, 0, 4, 5, 0]);
  const material = new MeshStandardMaterial({ color: 0xaa8866, side: DoubleSide });
  material.map = new Texture();
  material.normalMap = new Texture();
  const mesh = new SkinnedMesh(geometry, material);
  mesh.name = 'Mesh_0';
  scene.add(mesh);
  mesh.bind(skeleton);
  scene.updateMatrixWorld(true);
  const track = (name: string, dur: number): AnimationClip => new AnimationClip(name, dur, [new QuaternionKeyframeTrack('Spine.quaternion', [0, dur / 2, dur], [...rotY(0), ...rotY(0.2), ...rotY(0)])]);
  const names = opts.clipNames ?? ['idle', 'attack', 'hit', 'cast', 'ko'];
  return { scene, animations: names.map((n) => track(n, n === 'idle' ? 2 : 1.5)), mesh, skeleton, material };
}

/** Another mesh in the scene with no skin (a weapon or Valefor): a triangle. */
export function plainMesh(name = 'Mesh_0'): Mesh {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(6), 2));
  const m = new Mesh(g, new MeshStandardMaterial({ color: 0x17b8a6 }));
  m.name = name;
  return m;
}
