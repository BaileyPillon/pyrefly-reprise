/**
 * **The neutral stand-in figure** (the hidden Wendigo chapter's 3D stage; FFX only): what stands in a slot whose model file is missing from `public/models-exp/lake/`. A capsule body with a head and a small nose on the front
 * (so the facing reads), in a plain colour of its own per figure; the Wendigo's is broad with long arms, the Guardians' tall and narrow. Built in code: no file, nothing to commit, nothing of any game's character in it.
 * It faces +Z and stands on y 0, about its native height (`../../data/ffx/lake-models.ts`). Needs three.js only.
 */

import { BoxGeometry, CapsuleGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, type BufferGeometry } from 'three';
import { LAKE_NATIVE_HEIGHT, type LakeId } from '../../data/ffx/lake-models.ts';

const COLOUR: Readonly<Record<string, number>> = { wendigo: 0x6f7b8e, 'lake-guardian-a': 0xb9a46a, 'lake-guardian-b': 0xa8b0c4 };

function part(group: Group, geometry: BufferGeometry, colour: number, at: [number, number, number], name: string): Mesh {
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: colour, roughness: 0.9, metalness: 0 }));
  mesh.name = name;
  mesh.position.set(...at);
  group.add(mesh);
  return mesh;
}

/** The stand-in for `id`. */
export function capsuleFigure(id: LakeId): Group {
  const h = LAKE_NATIVE_HEIGHT[id];
  const g = new Group();
  g.name = `capsule-${id}`;
  const colour = COLOUR[id] ?? 0xd8d2c8;
  const wide = id === 'wendigo' ? 1.5 : 1;
  const r = 0.12 * h * wide;
  part(g, new CapsuleGeometry(r, h * 0.5, 6, 14), colour, [0, h * 0.42, 0], 'body');
  part(g, new SphereGeometry(h * 0.075, 18, 12), colour, [0, h * 0.86, 0], 'head');
  part(g, new BoxGeometry(h * 0.03, h * 0.03, h * 0.04), 0x2a2a30, [0, h * 0.86, h * 0.07], 'nose');
  if (id === 'wendigo') {
    for (const side of [-1, 1]) part(g, new CapsuleGeometry(h * 0.06, h * 0.4, 4, 10), colour, [side * h * 0.2, h * 0.5, 0], 'arm');
  }
  return g;
}
