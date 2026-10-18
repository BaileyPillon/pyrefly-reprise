/**
 * Reading a rig file (`src/data/art/rigTypes.ts`): the parsed JSON becomes typed arrays the skeleton and the meshes use, or a REASON the figure draws as the
 * painting set instead. Pure TypeScript: no `three`, no DOM (so a Node tool and the unit tests import it).
 *
 * Nothing here trusts the file. Every index is range-checked and every number must be finite, because the first frame after a bad file would otherwise be NaN
 * positions on a figure the player is looking at. The reasons are short and end up in the `[rig] subject off (reason)` line.
 */
import { RIG_REQUIRED_KEYS, RIG_VERSION, type RigFile, type RigGate, type RigKey, type RigMotion } from '../../data/art/rigTypes.ts';

export interface RigBoneData {
  name: string;
  /** Index of the parent, -1 for a root. */
  parent: number;
  /** The joint (painting px). */
  x: number;
  y: number;
  /** The joint's offset from its parent's joint (the bind translation). */
  bx: number;
  by: number;
}

export interface RigPartData {
  name: string;
  order: number;
  png: string;
  /** The rim mask file, or null. */
  rim: string | null;
  /** `mask`: the rim runs where the mask is white; `all`: along the whole alpha edge; `off`: no rim light on this part. */
  rimMode: 'mask' | 'all' | 'off';
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

export interface RigLandmarkData {
  bone: number;
  x: number;
  y: number;
}

export interface RigData {
  name: string;
  image: { w: number; h: number };
  baselineY: number;
  costume: { painting: string; sha: string };
  bones: RigBoneData[];
  boneIndex: ReadonlyMap<string, number>;
  /** Indices of the root bones (parent -1): the whole-figure offset of a key lands on each. */
  roots: number[];
  parts: RigPartData[];
  landmarks: ReadonlyMap<string, RigLandmarkData>;
  keys: ReadonlyMap<string, RigKey>;
  motion: RigMotion | undefined;
  gate: RigGate | undefined;
}

export type RigRead = { ok: true; data: RigData } | { ok: false; reason: string };

const fail = (reason: string): RigRead => ({ ok: false, reason });
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const isObj = (o: unknown): o is Record<string, unknown> => typeof o === 'object' && o !== null && !Array.isArray(o);
const allFinite = (a: unknown, len?: number): a is number[] => Array.isArray(a) && (len === undefined || a.length === len) && a.every(finite);

/** Parse and check a rig file. `raw` is the JSON as fetched. */
export function readRig(raw: unknown): RigRead {
  if (!isObj(raw)) return fail('not an object');
  const f = raw as unknown as Partial<RigFile> & Record<string, unknown>;
  if (f.version !== RIG_VERSION) return fail(`version ${String(f.version)} (this build reads ${RIG_VERSION})`);
  if (typeof f.name !== 'string' || !f.name) return fail('no name');
  if (!isObj(f.image) || !finite(f.image.w) || !finite(f.image.h) || f.image.w <= 0 || f.image.h <= 0) return fail('bad image size');
  if (!finite(f.baselineY)) return fail('bad baselineY');
  const costume = f.costume;
  if (!isObj(costume) || typeof costume.painting !== 'string' || !costume.painting) return fail('no costume painting');

  // ---- bones
  if (!Array.isArray(f.bones) || f.bones.length === 0) return fail('no bones');
  const bones: RigBoneData[] = [];
  const boneIndex = new Map<string, number>();
  for (let i = 0; i < f.bones.length; i++) {
    const b = f.bones[i];
    if (!isObj(b) || typeof b.name !== 'string' || !finite(b.parent) || !finite(b.x) || !finite(b.y)) return fail(`bone ${i}: bad fields`);
    const parent = Math.trunc(b.parent);
    if (parent >= i) return fail(`bone ${b.name}: parent ${parent} does not come before it`);
    if (boneIndex.has(b.name)) return fail(`bone ${b.name}: duplicated`);
    const p = parent >= 0 ? bones[parent]! : null;
    bones.push({ name: b.name, parent: parent < 0 ? -1 : parent, x: b.x, y: b.y, bx: b.x - (p ? p.x : 0), by: b.y - (p ? p.y : 0) });
    boneIndex.set(b.name, i);
  }
  const roots = bones.flatMap((b, i) => (b.parent < 0 ? [i] : []));
  if (!roots.length) return fail('no root bone');
  const boneRef = (v: unknown): number => (typeof v === 'string' ? (boneIndex.get(v) ?? -1) : finite(v) && Number.isInteger(v) && v >= 0 && v < bones.length ? v : -1);

  // ---- parts
  if (!Array.isArray(f.parts) || f.parts.length === 0) return fail('no parts');
  const parts: RigPartData[] = [];
  const seenParts = new Set<string>();
  for (const p of f.parts as unknown[]) {
    if (!isObj(p) || typeof p.name !== 'string' || typeof p.png !== 'string' || !finite(p.order) || Math.abs(p.order) > 1000) return fail('a part has bad fields');
    if (seenParts.has(p.name)) return fail(`part ${p.name}: duplicated`);
    seenParts.add(p.name);
    const box = p.box;
    if (!allFinite(box, 4) || box[2]! <= 0 || box[3]! <= 0) return fail(`part ${p.name}: bad box`);
    const [bx, by, bw, bh] = box as [number, number, number, number];
    const verts = p.verts === undefined ? [bx, by, bx + bw, by, bx + bw, by + bh, bx, by + bh] : p.verts;
    if (!allFinite(verts) || verts.length < 6 || verts.length % 2) return fail(`part ${p.name}: bad verts`);
    const n = verts.length / 2;
    const tri = p.triangles ?? p.tris ?? (p.verts === undefined ? [0, 1, 2, 0, 2, 3] : undefined);
    if (!allFinite(tri) || tri.length === 0 || tri.length % 3) return fail(`part ${p.name}: bad triangles`);
    if (tri.some((i) => !Number.isInteger(i) || i < 0 || i >= n)) return fail(`part ${p.name}: a triangle index is out of range`);
    // `uvs` is v DOWN (the painting's own px); the prototype's `uv` is v up (three.js flipY). The mesh wants v up.
    const uvsIn = p.uvs ?? p.uv;
    const vDown = p.uvs !== undefined || p.uv === undefined;
    let uvs: number[];
    if (uvsIn === undefined) {
      uvs = new Array<number>(n * 2);
      for (let i = 0; i < n; i++) {
        uvs[i * 2] = (verts[i * 2]! - bx) / bw;
        uvs[i * 2 + 1] = (verts[i * 2 + 1]! - by) / bh;
      }
    } else if (allFinite(uvsIn, n * 2)) uvs = uvsIn.slice();
    else return fail(`part ${p.name}: bad uvs`);
    if (vDown) for (let i = 0; i < n; i++) uvs[i * 2 + 1] = 1 - uvs[i * 2 + 1]!;

    const boneA = new Int16Array(n);
    const boneB = new Int16Array(n).fill(-1);
    const wA = new Float32Array(n);
    const wB = new Float32Array(n);
    if (p.bone !== undefined) {
      const bi = boneRef(p.bone);
      if (bi < 0) return fail(`part ${p.name}: no bone ${String(p.bone)}`);
      boneA.fill(bi);
      wA.fill(1);
    } else {
      // [b0, w0, b1, w1, ...] (four a vertex, the pipeline's), or the prototype's `bones` + `weights` (two each)
      let pb: number[];
      let pw: number[];
      if (allFinite(p.weights, n * 4) && p.bones === undefined) {
        pb = p.weights.filter((_, i) => i % 2 === 0);
        pw = p.weights.filter((_, i) => i % 2 === 1);
      } else if (allFinite(p.bones, n * 2) && allFinite(p.weights, n * 2)) {
        pb = p.bones;
        pw = p.weights;
      } else return fail(`part ${p.name}: needs "bone", or "weights" with four numbers a vertex, or "bones" and "weights" with two`);
      for (let i = 0; i < n; i++) {
        const a = pb[i * 2]!;
        const b = pb[i * 2 + 1]!;
        if (!Number.isInteger(a) || a < 0 || a >= bones.length) return fail(`part ${p.name}: vertex ${i} has no first bone`);
        if (!Number.isInteger(b) || b >= bones.length) return fail(`part ${p.name}: vertex ${i} has a bad second bone`);
        boneA[i] = a;
        boneB[i] = b < 0 ? -1 : b;
        wA[i] = pw[i * 2]!;
        wB[i] = b < 0 ? 0 : pw[i * 2 + 1]!;
      }
    }
    const rim = typeof p.rim === 'string' && p.rim ? p.rim : null;
    const rimMode = p.rimEverywhere === true || p.noRim === true ? 'all' : rim ? 'mask' : 'off'; // `noRim` is the prototype's spelling of rimEverywhere (the mask is ignored)
    parts.push({
      name: p.name,
      order: p.order,
      png: p.png,
      rim,
      rimMode,
      box: [bx, by, bw, bh],
      verts: Float32Array.from(verts),
      uvs: Float32Array.from(uvs),
      triangles: n > 65535 ? Uint32Array.from(tri) : Uint16Array.from(tri),
      boneA,
      boneB,
      wA,
      wB,
    });
  }
  parts.sort((a, b) => a.order - b.order);

  // ---- landmarks
  const landmarks = new Map<string, RigLandmarkData>();
  if (f.landmarks !== undefined) {
    if (!isObj(f.landmarks)) return fail('bad landmarks');
    for (const [name, l] of Object.entries(f.landmarks)) {
      if (!isObj(l) || !finite(l.x) || !finite(l.y)) return fail(`landmark ${name}: bad fields`);
      const bi = boneRef(l.bone);
      if (bi < 0) return fail(`landmark ${name}: no bone ${String(l.bone)}`);
      landmarks.set(name, { bone: bi, x: l.x, y: l.y });
    }
  }

  // ---- keys
  if (!isObj(f.keys)) return fail('no keys');
  const keys = new Map<string, RigKey>();
  for (const [name, k] of Object.entries(f.keys)) {
    if (!isObj(k) || !isObj(k.bones)) return fail(`key ${name}: bad fields`);
    for (const [bn, x] of Object.entries(k.bones)) {
      if (!boneIndex.has(bn)) return fail(`key ${name}: no bone ${bn}`);
      if (!isObj(x) || Object.values(x).some((v) => !finite(v))) return fail(`key ${name}: bone ${bn} has a non-number`);
      if (Math.abs((x as { rot?: number }).rot ?? 0) > 2 * Math.PI) return fail(`key ${name}: bone ${bn} rot is past 2 pi (keys are radians)`);
    }
    if (k.root !== undefined && (!isObj(k.root) || Object.values(k.root).some((v) => !finite(v)) || Math.abs((k.root as { rot?: number }).rot ?? 0) > 2 * Math.PI)) return fail(`key ${name}: bad root`);
    if (k.ms !== undefined && (!finite(k.ms) || k.ms < 0)) return fail(`key ${name}: bad ms`);
    if (k.layers !== undefined) {
      if (!isObj(k.layers)) return fail(`key ${name}: bad layers`);
      for (const [pn, v] of Object.entries(k.layers)) if (!seenParts.has(pn) || !finite(v)) return fail(`key ${name}: layers names a part that is not there or a non-number: ${pn}`);
    }
    keys.set(name, k as unknown as RigKey);
  }
  for (const need of RIG_REQUIRED_KEYS) if (!keys.has(need)) return fail(`no "${need}" key`);

  // ---- motion (chains name bones)
  const motion = f.motion as RigMotion | undefined;
  if (motion !== undefined) {
    if (typeof motion !== 'object' || motion === null) return fail('bad motion');
    for (const c of motion.chains ?? []) {
      if (!Array.isArray(c.bones) || c.bones.length === 0 || c.bones.some((b) => !boneIndex.has(b)) || !boneIndex.has(c.follow)) return fail('a chain names a bone that does not exist');
      if (!finite(c.f) || c.f <= 0 || !finite(c.z) || c.z < 0) return fail('a chain has a bad f or z');
    }
    const idle = motion.idle;
    if (idle) {
      for (const bn of Object.keys(idle.bones ?? {})) if (!boneIndex.has(bn)) return fail(`idle names a bone that does not exist: ${bn}`);
      if (!finite(idle.hz) || idle.hz <= 0) return fail('idle has a bad hz');
    }
  }

  return {
    ok: true,
    data: {
      name: f.name,
      image: { w: f.image.w, h: f.image.h },
      baselineY: f.baselineY,
      costume: { painting: costume.painting, sha: typeof costume.sha === 'string' ? costume.sha : '' },
      bones,
      boneIndex,
      roots,
      parts,
      landmarks,
      keys,
      motion,
      gate: isObj(f.gate) && typeof f.gate.status === 'string' ? (f.gate as unknown as RigGate) : undefined,
    },
  };
}

/**
 * The master's own name for a painting path or URL, so `/pyrefly-reprise/art/characters/kimahri/idle@2x.png`, `…idle%402x.webp`, `art/characters/kimahri/idle.png` and
 * the rig file's `characters/kimahri/idle` all compare equal: `characters/kimahri/idle`.
 */
export function masterName(path: string): string {
  const clean = path.split(/[?#]/)[0]!.replace(/%40/gi, '@');
  const at = clean.search(/(?:^|\/)art\//);
  const tail = at < 0 ? clean : clean.slice(at).replace(/^\/?art\//, '');
  return tail.replace(/\.(?:png|webp)$/i, '').replace(/@[0-9]+x$/i, '').replace(/^\/+/, '');
}

/** Does this rig's costume name the painting `idleUrl` (the figure's idle, in any tier or shipped form)? */
export function costumeMatches(data: RigData, idleUrl: string): boolean {
  return masterName(data.costume.painting) === masterName(idleUrl);
}

/** Why this rig may not be drawn, or null when it may: the pipeline's gate. */
export function gateProblem(data: RigData): string | null {
  if (!data.gate) return 'no gate';
  if (data.gate.status !== 'ok') return `gate ${String(data.gate.status)}${data.gate.why ? ` (${data.gate.why})` : ''}`;
  return null;
}
