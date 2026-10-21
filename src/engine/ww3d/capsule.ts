/**
 * **The neutral stand-in figure** (the hidden Wind Waker chapter, FFX-2 only): what stands in a slot whose model file is missing from `public/models-exp/windwaker/`. A capsule body with a big round head and a small nose
 * on the front (so the facing reads), in a plain colour of its own per figure; Valefor's is wider, with a long neck, a tail and two wings spread, so the target shot's layout (three short girls under a bird filling the right
 * half) can be judged before a single real model is on disk. Built in code: no file, no download, nothing to commit, and nothing of any game's character in it. The model turns every mesh under it toon
 * (`./model.ts`), like a real model.
 *
 * Units are the metres of the real files (a girl about 1.2 tall, Valefor 3.5 tall with a 6.8 span); the figure faces +Z and stands on y 0, as a model file must (`./layout.ts`). Needs three.js only.
 */

import { BoxGeometry, CapsuleGeometry, ConeGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, type BufferGeometry } from 'three';
import { WW_BOSS_ID, type WwId } from './layout.ts';

/** One plain colour per figure: Yuna's pale, Rikku's yellow, Paine's dark, Valefor's teal (the lab's placeholder's). */
export const CAPSULE_COLOUR: Readonly<Record<WwId, number>> = { yuna: 0xe8d6dd, rikku: 0xe6c64a, paine: 0x4a4d63, 'x2-valefor': 0x17b8a6 };

function part(group: Group, geometry: BufferGeometry, colour: number, at: [number, number, number], name: string, rotation: [number, number, number] = [0, 0, 0]): Mesh {
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: colour, roughness: 1, metalness: 0 }));
  mesh.name = name;
  mesh.position.set(...at);
  mesh.rotation.set(...rotation);
  group.add(mesh);
  return mesh;
}

/** The stand-in for `id`: a group of meshes, about 1.2 tall for a girl (a 3-head figure: the head is the largest part and the highest point) and Valefor 3.5 tall, her wings spreading about 5 wide. */
export function capsuleFigure(id: WwId): Group {
  const g = new Group();
  g.name = `capsule-${id}`;
  const colour = CAPSULE_COLOUR[id];
  if (id !== WW_BOSS_ID) {
    part(g, new CapsuleGeometry(0.17, 0.3, 6, 14), colour, [0, 0.4, 0], 'body');
    part(g, new SphereGeometry(0.22, 20, 14), colour, [0, 0.98, 0], 'head');
    part(g, new BoxGeometry(0.06, 0.06, 0.08), 0x2a2a30, [0, 0.96, 0.21], 'nose'); // the way it faces
    return g;
  }
  part(g, new CapsuleGeometry(0.6, 1.0, 6, 16), colour, [0, 1.3, 0], 'body');
  for (const x of [-0.3, 0.3]) part(g, new BoxGeometry(0.2, 0.5, 0.2), 0xd9b43c, [x, 0.25, 0.2], x < 0 ? 'talon-left' : 'talon-right'); // she stands on the floor
  part(g, new CapsuleGeometry(0.22, 0.8, 4, 10), colour, [0, 2.45, 0.5], 'neck', [0.35, 0, 0]);
  part(g, new SphereGeometry(0.42, 18, 12), colour, [0, 3.08, 0.9], 'head');
  part(g, new BoxGeometry(0.2, 0.18, 0.4), 0xd9b43c, [0, 2.98, 1.3], 'beak');
  const tail = part(g, new ConeGeometry(0.4, 2.4, 12), colour, [0, 0.9, -1.7], 'tail', [-Math.PI / 2 - 0.25, 0, 0]);
  tail.scale.set(1, 1, 0.6);
  // the wings: two flat panels, spread to either side and raised, each pivoting at the shoulder
  for (const side of [-1, 1]) {
    const wing = part(g, new BoxGeometry(2.4, 0.06, 1.5), 0x1d4fb0, [side * 1.9, 2.0, -0.2], side < 0 ? 'wing-left' : 'wing-right', [0, side * 0.2, side * 0.32]);
    wing.castShadow = true;
  }
  return g;
}
