/**
 * **The neutral stand-in figure** (the hidden 3D Bahamut chapter, FFX-2 only): what stands in a slot whose model file is missing from `public/models-exp/yrp/`. A capsule body with a head and a small nose on the front (so the
 * facing reads), in a plain colour of its own per figure; Bahamut's is wider, with a tail and two wings spread, so frame A's layout (a giant over three girls, the wings over the left half) can be judged before a single
 * real model is on disk. Built in code: no file, no download, nothing to commit, and nothing of any game's character in it. Toon-shaded and outlined like a real model (`./toon.ts` turns every mesh under it toon).
 *
 * Units are arbitrary (the fit scales the figure's box to the figure's world height); the figure faces +Z and stands on y 0, as a model file must (`./model.ts`). Needs three.js only.
 */

import { BoxGeometry, CapsuleGeometry, ConeGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, type BufferGeometry } from 'three';
import type { YrpId } from './layout.ts';

/** One plain colour per figure: Yuna's pale, Rikku's yellow, Paine's dark, Bahamut's violet (the possession colour of the chamber's boss pool). */
export const CAPSULE_COLOUR: Readonly<Record<YrpId, number>> = { yuna: 0xe8d6dd, rikku: 0xe6c64a, paine: 0x4a4d63, bahamut: 0x6a3fa8 };

function part(group: Group, geometry: BufferGeometry, colour: number, at: [number, number, number], name: string, rotation: [number, number, number] = [0, 0, 0]): Mesh {
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: colour, roughness: 1, metalness: 0 }));
  mesh.name = name;
  mesh.position.set(...at);
  mesh.rotation.set(...rotation);
  group.add(mesh);
  return mesh;
}

/** The stand-in for `id`: a group of meshes, about 1 unit tall for a girl (the head is the highest point of every figure) and Bahamut's wings spreading about 1.9 wide. */
export function capsuleFigure(id: YrpId): Group {
  const g = new Group();
  g.name = `capsule-${id}`;
  const colour = CAPSULE_COLOUR[id];
  if (id !== 'bahamut') {
    part(g, new CapsuleGeometry(0.16, 0.42, 6, 14), colour, [0, 0.37, 0], 'body');
    part(g, new SphereGeometry(0.115, 18, 12), colour, [0, 0.86, 0], 'head');
    part(g, new BoxGeometry(0.05, 0.05, 0.07), 0x2a2a30, [0, 0.86, 0.12], 'nose'); // the way it faces
    return g;
  }
  part(g, new CapsuleGeometry(0.24, 0.5, 6, 16), colour, [0, 0.49, 0], 'body');
  part(g, new CapsuleGeometry(0.09, 0.3, 4, 10), colour, [0, 0.94, 0.1], 'neck', [0.35, 0, 0]);
  part(g, new SphereGeometry(0.15, 18, 12), colour, [0, 1.14, 0.2], 'head');
  part(g, new BoxGeometry(0.08, 0.07, 0.14), 0x2a2a30, [0, 1.13, 0.34], 'snout');
  const tail = part(g, new ConeGeometry(0.17, 0.95, 12), colour, [0, 0.26, -0.7], 'tail', [-Math.PI / 2 - 0.25, 0, 0]);
  tail.scale.set(1, 1, 0.6);
  // the wings: two flat panels, spread to either side and raised, each pivoting at the shoulder
  for (const side of [-1, 1]) {
    const wing = part(g, new BoxGeometry(0.95, 0.025, 0.55), 0xb05a2a, [side * 0.55, 0.82, -0.1], side < 0 ? 'wing-left' : 'wing-right', [0, side * 0.2, side * 0.32]);
    wing.castShadow = true;
  }
  return g;
}
