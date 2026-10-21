/**
 * **Fixtures for the Wind Waker chapter's model and skin tests** (FFX-2 only): a girl of 1.2 m with the bones the chapter reads (`Hips`, the legs, the shoulders, forearms and hands, `Head`, `headfront`) and three clips
 * (`idle_combat`, `attack`, `hit`), Valefor as one static mesh of 3.5 m by 6.8 m, and file IO over a table of file names (a name in `broken` fetches but does not parse; any other is not there).
 */
import { AnimationClip, Bone, BoxGeometry, Group, Mesh, MeshStandardMaterial, Object3D, QuaternionKeyframeTrack } from 'three';
import type { LoaderIO } from '../../../src/engine/ww3d/io.ts';

export type File = () => { scene: Object3D; animations: AnimationClip[] };

export const GLB = new Uint8Array(32);
GLB.set([0x67, 0x6c, 0x54, 0x46], 0);

export const rotY = (angle: number): number[] => [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];

/** A girl of 1.2 m with the bones the chapter reads, a stance clip, an attack and a hit. She faces +Z. */
export function girl(): { scene: Object3D; animations: AnimationClip[] } {
  const scene = new Group();
  const bone = (name: string, x: number, y: number, z: number, parent: Object3D): Bone => {
    const b = new Bone();
    b.name = name;
    b.position.set(x, y, z);
    parent.add(b);
    return b;
  };
  const hips = bone('Hips', 0, 0.55, 0, scene);
  bone('LeftUpLeg', 0.1, 0, 0, hips);
  bone('RightUpLeg', -0.1, 0, 0, hips);
  const spine = bone('Spine', 0, 0.25, 0, hips);
  const head = bone('Head', 0, 0.25, 0, spine);
  bone('headfront', 0, 0, 0.1, head);
  for (const [side, x] of [['Left', 0.18], ['Right', -0.18]] as const) {
    const sh = bone(`${side}Shoulder`, x, 0.2, 0, spine);
    const fore = bone(`${side}ForeArm`, 0, -0.2, 0, sh);
    bone(`${side}Hand`, 0, -0.2, 0, fore);
  }
  const body = new Mesh(new BoxGeometry(0.4, 1.2, 0.2), new MeshStandardMaterial({ color: 0xaa8866 }));
  body.position.y = 0.6; // bind pose: the feet on y 0, 1.2 tall
  scene.add(body);
  const idle = new AnimationClip('idle_combat', 1, [new QuaternionKeyframeTrack('Spine.quaternion', [0, 0.5, 1], [...rotY(0), ...rotY(0.05), ...rotY(0)])]);
  const attack = new AnimationClip('attack', 2, [new QuaternionKeyframeTrack('Spine.quaternion', [0, 0.8, 0.9, 1.0, 2], [...rotY(0), ...rotY(0), ...rotY(0.9), ...rotY(0), ...rotY(0)])]);
  const hit = new AnimationClip('hit', 0.6, [new QuaternionKeyframeTrack('Spine.quaternion', [0, 0.3, 0.6], [...rotY(0), ...rotY(0.4), ...rotY(0)])]);
  return { scene, animations: [idle, attack, hit] };
}

/** Valefor as `valefor-v2.glb` is: one static mesh, 3.5 tall and 6.6 wide, even wings about x 0.03, origin between the claws, no skeleton, no clips. */
export function valefor(): { scene: Object3D; animations: AnimationClip[] } {
  const scene = new Group();
  const m = new Mesh(new BoxGeometry(6.62, 3.5, 2.03), new MeshStandardMaterial({ color: 0x17b8a6 }));
  m.position.set(0.03, 1.75, -0.33);
  scene.add(m);
  return { scene, animations: [] };
}

export function fakeIo(files: Record<string, File>, broken: string[] = []): LoaderIO {
  const withUrl = (url: string): ArrayBuffer => {
    const tail = new TextEncoder().encode(url);
    const out = new Uint8Array(12 + tail.length);
    out.set(GLB.subarray(0, 12));
    out.set(tail, 12);
    return out.buffer;
  };
  return {
    async fetchBytes(url) {
      return Object.keys(files).some((f) => url.endsWith(f)) || broken.some((f) => url.endsWith(f)) ? withUrl(url) : null;
    },
    async parse(bytes) {
      const url = new TextDecoder().decode(new Uint8Array(bytes, 12));
      if (broken.some((f) => url.endsWith(f))) throw new Error('bad glTF');
      const key = Object.keys(files).find((f) => url.endsWith(f))!;
      return files[key]!();
    },
    async clone(scene) {
      return scene.clone(true);
    },
  };
}

