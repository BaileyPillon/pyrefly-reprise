/**
 * Helpers for the tests that read the hidden 3D Bahamut's real model files (local only, `public/models-exp/`, gitignored; FFX-2 only): a binary glTF with its textures taken out (three's loader needs a DOM for them and no
 * test here looks at colour), and the world position of every vertex of a posed skinned model. Shared by `yrp3d/real-boss-fit.test.ts`; `yrp3d/real-files.test.ts` keeps its own older copy of the first.
 */
import { readFileSync } from 'node:fs';
import { Vector3, type Mesh, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** The file's bytes as an ArrayBuffer with every image, texture, sampler and texture reference taken out of its JSON chunk. */
export function stripImages(buf: Buffer): ArrayBuffer {
  const len = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + len).toString('utf8')) as Record<string, unknown> & { materials?: Array<Record<string, unknown>> };
  delete json['images'];
  delete json['textures'];
  delete json['samplers'];
  for (const m of json.materials ?? []) {
    const pbr = m['pbrMetallicRoughness'] as Record<string, unknown> | undefined;
    if (pbr) for (const k of ['baseColorTexture', 'metallicRoughnessTexture']) delete pbr[k];
    for (const k of ['normalTexture', 'occlusionTexture', 'emissiveTexture', 'extensions']) delete m[k];
  }
  delete json['extensionsRequired'];
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const rest = buf.subarray(20 + len);
  const out = Buffer.alloc(20 + js.length + rest.length);
  out.write('glTF', 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(js.length, 12);
  out.write('JSON', 16);
  js.copy(out, 20);
  rest.copy(out, 20 + js.length);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

/** Parse a local binary glTF without its textures. */
export const parseReal = (path: string): ReturnType<GLTFLoader['parseAsync']> => new GLTFLoader().parseAsync(stripImages(readFileSync(path)), '');

/** The world position of every vertex of every mesh under `root`, skinning applied at the pose the bones are in now. */
export function worldVertices(root: Object3D): Vector3[] {
  root.updateMatrixWorld(true);
  const out: Vector3[] = [];
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const pos = m.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const v = new Vector3();
      m.getVertexPosition(i, v);
      out.push(v.applyMatrix4(m.matrixWorld));
    }
  });
  return out;
}
