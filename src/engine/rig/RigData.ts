/**
 * Reading a rig file (`src/data/art/rigTypes.ts`): the parsed JSON becomes typed arrays the skeleton and the meshes use, or a REASON the figure draws as the
 * painting set instead. Pure TypeScript: no `three`, no DOM (so a Node tool and the unit tests import it).
 *
 * Nothing here trusts the file. Every index is range-checked and every number must be finite, because the first frame after a bad file would otherwise be NaN
 * positions on a figure the player is looking at. The reasons are short and end up in the `[rig] subject off (reason)` line.
 */
import { RIG_REQUIRED_KEYS, RIG_VERSIONS, type RigFile, type RigGate, type RigKey, type RigMotion } from '../../data/art/rigTypes.ts';
import { readMesh, type RigMeshData } from './RigMesh.ts';

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

/** Another image of a part (format v2): its file names, rim mode, and mesh (the part's own when the variant gave none). */
export interface RigVariantData extends RigMeshData {
  name: string;
  png: string;
  rim: string | null;
  rimMode: 'mask' | 'all' | 'off';
}

export interface RigPartData extends RigMeshData {
  name: string;
  order: number;
  png: string;
  /** The rim mask file, or null. */
  rim: string | null;
  /** `mask`: the rim runs where the mask is white; `all`: along the whole alpha edge; `off`: no rim light on this part. */
  rimMode: 'mask' | 'all' | 'off';
  /** v2: hidden at rest (see `RigPartState.ts`). */
  hidden: boolean;
  /** v2: the images a key may swap in, in the order the file lists them (a state names one by its index). Empty for a v1 part. */
  variants: RigVariantData[];
}

export interface RigLandmarkData {
  bone: number;
  x: number;
  y: number;
}

export interface RigData {
  /** The file's `version` (1 or 2). */
  version: number;
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

/** The rim mask file and mode of a part or variant: `noRim` is the prototype's spelling of `rimEverywhere` (the mask is ignored). */
function rimOf(p: Record<string, unknown>): { rim: string | null; rimMode: 'mask' | 'all' | 'off' } {
  const rim = typeof p['rim'] === 'string' && p['rim'] ? p['rim'] : null;
  return { rim, rimMode: p['rimEverywhere'] === true || p['noRim'] === true ? 'all' : rim ? 'mask' : 'off' };
}

/** Parse and check a rig file. `raw` is the JSON as fetched. */
export function readRig(raw: unknown): RigRead {
  if (!isObj(raw)) return fail('not an object');
  const f = raw as unknown as Partial<RigFile> & Record<string, unknown>;
  if (typeof f.version !== 'number' || !RIG_VERSIONS.includes(f.version)) return fail(`version ${String(f.version)} (this build reads ${RIG_VERSIONS.join(' and ')})`);
  const v2 = f.version >= 2;
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
    if (!v2 && (p.hidden !== undefined || p.variants !== undefined)) return fail(`part ${p.name}: hidden and variants need version 2 (this file says ${String(f.version)})`);
    if (p.hidden !== undefined && typeof p.hidden !== 'boolean') return fail(`part ${p.name}: bad hidden`);
    const mesh = readMesh(p, `part ${p.name}`, bones.length, boneRef);
    if (!mesh.ok) return fail(mesh.reason);
    const { rim, rimMode } = rimOf(p);
    const variants: RigVariantData[] = [];
    if (p.variants !== undefined) {
      if (!isObj(p.variants)) return fail(`part ${p.name}: bad variants`);
      for (const [vn, v] of Object.entries(p.variants)) {
        const where = `part ${p.name} variant ${vn}`;
        if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(vn)) return fail(`${where}: the name is not a plain name`);
        if (!isObj(v) || typeof v.png !== 'string' || !v.png) return fail(`${where}: bad fields`);
        const own = ['box', 'verts', 'uvs', 'uv', 'triangles', 'tris', 'bone', 'bones', 'weights'].some((k) => v[k] !== undefined);
        let vm: RigMeshData = mesh.mesh;
        if (own) {
          // its own mesh: read like a part's; a variant that names no skin of its own is rigid on the part's `bone` (a part skinned by weights must give its variant's)
          const skinned = v.bone !== undefined || v.weights !== undefined || v.bones !== undefined;
          const r = readMesh({ ...v, box: v.box ?? p.box, ...(skinned || p.bone === undefined ? {} : { bone: p.bone }) }, where, bones.length, boneRef);
          if (!r.ok) return fail(r.reason);
          vm = r.mesh;
        }
        variants.push({ ...vm, name: vn, png: v.png, ...rimOf(v) });
      }
    }
    parts.push({ ...mesh.mesh, name: p.name, order: p.order, png: p.png, rim, rimMode, hidden: p.hidden === true, variants });
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
    if (k.fadeMs !== undefined && (!finite(k.fadeMs) || k.fadeMs < 0 || k.fadeMs > 2000)) return fail(`key ${name}: bad fadeMs`); // v2.1: 0 to 2000; the runtime plays at most 400
    if (k.layers !== undefined) {
      if (!isObj(k.layers)) return fail(`key ${name}: bad layers`);
      for (const [pn, v] of Object.entries(k.layers)) if (!seenParts.has(pn) || !finite(v)) return fail(`key ${name}: layers names a part that is not there or a non-number: ${pn}`);
    }
    if (k.parts !== undefined) {
      if (!v2) return fail(`key ${name}: parts need version 2 (this file says ${String(f.version)})`);
      if (!isObj(k.parts)) return fail(`key ${name}: bad parts`);
      if (name === 'idle' && Object.keys(k.parts).length) return fail('the idle key names parts (it is the rest: hide a part by marking it hidden)');
      for (const [pn, e] of Object.entries(k.parts)) {
        const part = parts.find((x) => x.name === pn);
        if (!part) return fail(`key ${name}: parts names a part that is not there: ${pn}`);
        if (!isObj(e) || (e.show !== undefined && typeof e.show !== 'boolean') || (e.image !== undefined && typeof e.image !== 'string')) return fail(`key ${name}: part ${pn} has bad fields`);
        if (e.image !== undefined && !part.variants.some((v) => v.name === e.image)) return fail(`key ${name}: part ${pn} has no variant ${String(e.image)}`);
      }
    }
    keys.set(name, k as unknown as RigKey);
  }
  for (const p of parts) {
    if (p.hidden && ![...keys].some(([kn, k]) => kn !== 'idle' && k.parts?.[p.name] !== undefined && k.parts[p.name]!.show !== false)) return fail(`part ${p.name} is hidden at rest and no key shows it`);
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
      version: f.version,
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
