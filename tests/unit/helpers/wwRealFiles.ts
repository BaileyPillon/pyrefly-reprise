/**
 * **Reading the real Wind Waker model files in Node** (FFX-2 only; `public/models-exp/windwaker/`, kept out of git; they do ship in a production build). Shared by `ww3d/files.test.ts` and `ww3d/assets.test.ts`, which skip
 * themselves on a machine without the files.
 *
 * - {@link readGltf} / {@link boxOf}: the glTF's JSON chunk and a mesh's position box, with no renderer and no loader;
 * - {@link stripImages}: the file with its pictures taken out of the JSON (there is no image decoder in Node), so three's own `GLTFLoader` parses the real geometry, skeleton and clips;
 * - {@link realIo}: `LoaderIO` over that, reading `public/<url without the base>` from disk, for the chapter's own loaders (`loadWwModels`, `loadSwaps`).
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { expect } from 'vitest';

import { looksLikeGlb } from '../../../src/engine/ww3d/layout.ts';
import type { LoaderIO } from '../../../src/engine/ww3d/io.ts';

/** `public/` of the worktree. */
export const publicDir = fileURLToPath(new URL('../../../public/', import.meta.url));

/** `public/models-exp/windwaker/`. */
export const modelsDir = join(publicDir, 'models-exp', 'windwaker');

export interface Gltf {
  nodes: Array<{ name?: string; skin?: number; mesh?: number }>;
  skins?: Array<{ joints: number[] }>;
  meshes: Array<{ primitives: Array<{ attributes: Record<string, number>; indices?: number; material?: number }> }>;
  accessors: Array<{ min?: number[]; max?: number[]; count: number }>;
  materials?: Array<{ pbrMetallicRoughness?: { baseColorTexture?: unknown } }>;
  animations?: Array<{ name?: string }>;
}

/** The JSON chunk of a binary glTF. */
export function readGltf(file: string): Gltf {
  const bytes = readFileSync(file);
  expect(looksLikeGlb(bytes)).toBe(true);
  const length = bytes.readUInt32LE(12);
  expect(bytes.toString('ascii', 16, 20)).toBe('JSON');
  return JSON.parse(bytes.toString('utf8', 20, 20 + length)) as Gltf;
}

/** The position box of the first primitive of mesh 0 (its accessor's min and max). */
export function boxOf(g: Gltf): { min: number[]; max: number[] } {
  const acc = g.accessors[g.meshes[0]!.primitives[0]!.attributes['POSITION']!]!;
  return { min: acc.min!, max: acc.max! };
}

/** The triangles of mesh 0's first primitive (its index accessor's count over three). */
export function trianglesOf(g: Gltf): number {
  const idx = g.meshes[0]!.primitives[0]!.indices;
  return idx === undefined ? 0 : g.accessors[idx]!.count / 3;
}

/** The file with its pictures taken out of the JSON (no decoder in Node): the geometry, the skeleton and the clips are the real ones. */
export function stripImages(bytes: Buffer): ArrayBuffer {
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength)) as Record<string, unknown> & { materials?: Array<Record<string, unknown> & { pbrMetallicRoughness?: Record<string, unknown> }> };
  delete json['images'];
  delete json['textures'];
  delete json['samplers'];
  for (const m of json.materials ?? []) {
    if (m.pbrMetallicRoughness) {
      delete m.pbrMetallicRoughness['baseColorTexture'];
      delete m.pbrMetallicRoughness['metallicRoughnessTexture'];
    }
    for (const key of ['normalTexture', 'occlusionTexture', 'emissiveTexture']) delete m[key]; // the anime girls' files carry a normal map too (the cel never reads it)
  }
  const text = Buffer.from(JSON.stringify(json), 'utf8');
  const padded = Buffer.concat([text, Buffer.alloc((4 - (text.length % 4)) % 4, 0x20)]);
  const rest = bytes.subarray(20 + jsonLength); // the BIN chunk, untouched
  const header = Buffer.alloc(20);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + padded.length + rest.length, 8);
  header.writeUInt32LE(padded.length, 12);
  header.write('JSON', 16, 'ascii');
  const out = Buffer.concat([header, padded, rest]);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

/** File IO over the real files: a url (`/models-exp/windwaker/props/pistol.glb`) is read from `public/`, with its pictures stripped; a url with no file is not there. */
export function realIo(): LoaderIO {
  return {
    fetchBytes: async (url) => {
      const file = join(publicDir, url.replace(/^\//, ''));
      return existsSync(file) ? stripImages(readFileSync(file)) : null;
    },
    parse: async (bytes) => {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const gltf = await new GLTFLoader().parseAsync(bytes, '');
      return { scene: gltf.scene, animations: gltf.animations };
    },
    clone: async (scene) => {
      const { clone } = await import('three/addons/utils/SkeletonUtils.js');
      return clone(scene);
    },
  };
}
