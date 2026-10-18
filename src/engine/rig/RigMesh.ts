/**
 * Reading one mesh of a rig file: a part's, or (format v2) a variant's own. Pure TypeScript: no `three`, no DOM. Split out of `RigData.ts` when variants arrived, so a part and a variant are read by
 * the same code and refused for the same reasons (the messages are unchanged for a part: `part <name>: bad box`).
 *
 * A mesh is: `box` `[x, y, w, h]` of the PNG in the master; `verts` flat `[x, y, ...]` (painting px, bind pose; a quad of the box when absent); `triangles` (alias `tris`); `uvs` flat in 0..1,
 * **v DOWN** (the prototype's `uv` alias is v UP and is flipped here: the mesh wants v up); and the skin, one of `bone` (rigid), `weights` alone (four numbers a vertex, `[b0, w0, b1, w1]`), or the
 * prototype's `bones` + `weights` (two each).
 */

export interface RigMeshData {
  box: [number, number, number, number];
  /** Bind positions, painting px, x/y pairs. */
  verts: Float32Array;
  /** u/v pairs, 0..1, v up. */
  uvs: Float32Array;
  triangles: Uint16Array | Uint32Array;
  /** Two influences a vertex: bone indices (-1 = none) and weights. */
  boneA: Int16Array;
  boneB: Int16Array;
  wA: Float32Array;
  wB: Float32Array;
}

export type MeshRead = { ok: true; mesh: RigMeshData } | { ok: false; reason: string };

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const allFinite = (a: unknown, len?: number): a is number[] => Array.isArray(a) && (len === undefined || a.length === len) && a.every(finite);

/**
 * Read the mesh in `p` (a part's or a variant's fields). `label` starts every reason (`part head`, `part head variant front`); `boneCount` and `boneRef` are the skeleton's
 * (`boneRef` turns a bone name or index into an index, -1 when it is none).
 */
export function readMesh(p: Record<string, unknown>, label: string, boneCount: number, boneRef: (v: unknown) => number): MeshRead {
  const fail = (why: string): MeshRead => ({ ok: false, reason: `${label}: ${why}` });
  const box = p['box'];
  if (!allFinite(box, 4) || box[2]! <= 0 || box[3]! <= 0) return fail('bad box');
  const [bx, by, bw, bh] = box as [number, number, number, number];
  const verts = p['verts'] === undefined ? [bx, by, bx + bw, by, bx + bw, by + bh, bx, by + bh] : p['verts'];
  if (!allFinite(verts) || verts.length < 6 || verts.length % 2) return fail('bad verts');
  const n = verts.length / 2;
  const tri = p['triangles'] ?? p['tris'] ?? (p['verts'] === undefined ? [0, 1, 2, 0, 2, 3] : undefined);
  if (!allFinite(tri) || tri.length === 0 || tri.length % 3) return fail('bad triangles');
  if (tri.some((i) => !Number.isInteger(i) || i < 0 || i >= n)) return fail('a triangle index is out of range');
  // `uvs` is v DOWN (the painting's own px); the prototype's `uv` is v up (three.js flipY). The mesh wants v up.
  const uvsIn = p['uvs'] ?? p['uv'];
  const vDown = p['uvs'] !== undefined || p['uv'] === undefined;
  let uvs: number[];
  if (uvsIn === undefined) {
    uvs = new Array<number>(n * 2);
    for (let i = 0; i < n; i++) {
      uvs[i * 2] = (verts[i * 2]! - bx) / bw;
      uvs[i * 2 + 1] = (verts[i * 2 + 1]! - by) / bh;
    }
  } else if (allFinite(uvsIn, n * 2)) uvs = uvsIn.slice();
  else return fail('bad uvs');
  if (vDown) for (let i = 0; i < n; i++) uvs[i * 2 + 1] = 1 - uvs[i * 2 + 1]!;

  const boneA = new Int16Array(n);
  const boneB = new Int16Array(n).fill(-1);
  const wA = new Float32Array(n);
  const wB = new Float32Array(n);
  if (p['bone'] !== undefined) {
    const bi = boneRef(p['bone']);
    if (bi < 0) return fail(`no bone ${String(p['bone'])}`);
    boneA.fill(bi);
    wA.fill(1);
  } else {
    // [b0, w0, b1, w1, ...] (four a vertex, the pipeline's), or the prototype's `bones` + `weights` (two each)
    let pb: number[];
    let pw: number[];
    const weights = p['weights'];
    const bones = p['bones'];
    if (allFinite(weights, n * 4) && bones === undefined) {
      pb = weights.filter((_, i) => i % 2 === 0);
      pw = weights.filter((_, i) => i % 2 === 1);
    } else if (allFinite(bones, n * 2) && allFinite(weights, n * 2)) {
      pb = bones;
      pw = weights;
    } else return fail('needs "bone", or "weights" with four numbers a vertex, or "bones" and "weights" with two');
    for (let i = 0; i < n; i++) {
      const a = pb[i * 2]!;
      const b = pb[i * 2 + 1]!;
      if (!Number.isInteger(a) || a < 0 || a >= boneCount) return fail(`vertex ${i} has no first bone`);
      if (!Number.isInteger(b) || b >= boneCount) return fail(`vertex ${i} has a bad second bone`);
      boneA[i] = a;
      boneB[i] = b < 0 ? -1 : b;
      wA[i] = pw[i * 2]!;
      wB[i] = b < 0 ? 0 : pw[i * 2 + 1]!;
    }
  }
  return {
    ok: true,
    mesh: { box: [bx, by, bw, bh], verts: Float32Array.from(verts), uvs: Float32Array.from(uvs), triangles: n > 65535 ? Uint32Array.from(tri) : Uint16Array.from(tri), boneA, boneB, wA, wB },
  };
}
