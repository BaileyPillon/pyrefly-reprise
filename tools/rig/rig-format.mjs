/**
 * **The rig file, formats v1 and v2: read it, check it, fingerprint it** (the rig program, 2026-10-17; both games, shared plumbing). Bailey, 2026-10-17: "start rigging for all
 * chapters please. i want a permanent fix now." A figure is ONE approved painting (its costume) cut into parts on a bone rig; every pose is that painting bent, so two
 * poses can never differ in size, feet or costume.
 *
 * The contract is `src/data/art/rigTypes.ts` (the engine lane's; the runtime reads `src/engine/rig/RigData.ts`). This module is the Node side of the same file: it reads
 * what the cutting pipeline (`tools/rig/rig_export.py`) writes, checks it as strictly as the runtime does and more, and gives the gate (`rig-gate-lib.mjs`) a runtime form
 * (`rt`): skin as two influences a vertex, bone references as indices, texture rows from the top. In the file key angles (`rot`, `root.rot`) are RADIANS clockwise on screen,
 * `uvs` are v DOWN like the painting's px (the prototype's `uv` alias is v UP and is flipped here), a part is skinned by `bone`, by `weights` (four numbers a vertex: b0, w0, b1, w1)
 * or by the prototype's `bones` + `weights` (two each). A rig lives in `<rig root>/<subject>/rig.json` with one PNG per part (`D:/pyrefly-art-rigs` on this machine), never in `public/art`.
 *
 * **Format v2 (2026-10-18; additive)**: a part may be `hidden` (at rest) and may have `variants` (other images of it, by name, each with the part's mesh or its own), and a key may carry `parts`
 * (`{ <part>: { show?, image? } }`: show or hide the part, swap its image for a variant). The reader accepts versions 1 and 2; a v1 file with a v2 field is refused. The state a key describes is
 * `rig-pose.mjs#keyState`, the flip halfway through a move `stateAt`: the runtime's `RigPartState.ts` is the same function, and a test feeds both the same vectors.
 *
 * Beyond the types the pipeline writes (additive, the runtime ignores them): `costume.sha2x` (the `@Nx` master the parts are cut from) and, in `gate`, `rules` and `keys`. The runtime
 * draws a rig whose `gate.status` is `ok`; `rig-gate-lib.mjs#verifyStamp` is how the pose gate and the installer know the `ok` is the gate's and still true of this content.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** The newest version (the pipeline writes 2 only when a rig uses a v2 field) and the ones this module reads. */
export const RIG_VERSION = 2;
export const RIG_VERSIONS = Object.freeze([1, 2]);
export const RIG_FILE = 'rig.json';
/** Who may write `gate.by`. */
export const GATE_BY = 'tools/rig-gate.mjs';
export const GATE_RULES = 'rig-gate/1';
/** Where rigs live: one folder per subject under this root (the dev server serves it at `/art/rigs/`). `PYREFLY_RIGS_DIR` overrides it. */
export const DEFAULT_RIGS_ROOT = process.env.PYREFLY_RIGS_DIR ?? 'D:/pyrefly-art-rigs';
/** The channels of a bone's pose, with their rest values. */
export const CHANNELS = Object.freeze({ rot: 0, dx: 0, dy: 0, sx: 1, sy: 1 });

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isNumArray = (a, len) => Array.isArray(a) && (len === undefined || a.length === len) && a.every(isNum);

/** Read `rig.json` from a folder (or the file itself). @returns {{raw: object, dir: string, file: string}} */
export function readRigFile(pathOrDir) {
  const p = resolve(pathOrDir);
  const file = p.endsWith('.json') ? p : join(p, RIG_FILE);
  if (!existsSync(file)) throw new Error(`rig: no ${RIG_FILE} at ${file}`);
  const dirOf = file.slice(0, file.length - RIG_FILE.length).replace(/[\\/]+$/, '');
  return { raw: JSON.parse(readFileSync(file, 'utf8')), dir: dirOf, file };
}

/** The subject and pose a costume painting path names (`characters/kimahri/idle`, `art/characters/kimahri/idle@2x.png`: kimahri, idle), or null. */
export function costumeParts(painting) {
  const m = /(?:^|\/)characters\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:@\d+x)?(?:\.(?:png|webp))?$/i.exec(String(painting).replace(/\\/g, '/').replace(/%40/gi, '@'));
  return m ? { subject: m[1], pose: m[2] } : null;
}

/** Per-vertex bones and weights as typed arrays (two influences a vertex): `bone` (a name or an index, rigid), `weights` alone (four numbers a vertex: b0, w0, b1, w1), or `bones` + `weights` (two each). */
function skinOf(part, n, bones, problems, where) {
  const b = new Int16Array(n * 2).fill(-1);
  const w = new Float32Array(n * 2);
  const ref = (v) => (typeof v === 'string' ? bones.findIndex((x) => x.name === v) : Number.isInteger(v) && v >= 0 && v < bones.length ? v : -1);
  if (part.bone !== undefined) {
    const bi = ref(part.bone);
    if (bi < 0) problems.push({ code: 'rig-part', message: `${where}: no bone ${JSON.stringify(part.bone)}` });
    for (let i = 0; i < n; i++) { b[i * 2] = bi; w[i * 2] = 1; }
    return { b, w };
  }
  let fb = null;
  let fw = null;
  if (isNumArray(part.weights, n * 4) && part.bones === undefined) {
    fb = part.weights.filter((_, i) => i % 2 === 0);
    fw = part.weights.filter((_, i) => i % 2 === 1);
  } else if (isNumArray(part.bones, n * 2) && isNumArray(part.weights, n * 2)) {
    fb = part.bones;
    fw = part.weights;
  } else {
    problems.push({ code: 'rig-part', message: `${where}: needs \`bone\`, or \`weights\` with four numbers a vertex (b0, w0, b1, w1), or \`bones\` and \`weights\` with two each (got ${Array.isArray(part.weights) ? part.weights.length : 'none'} weights for ${n} vertices)` });
    return { b, w };
  }
  for (let i = 0; i < n; i++) {
    const a = fb[i * 2];
    const c = fb[i * 2 + 1];
    if (!Number.isInteger(a) || a < 0 || a >= bones.length || !Number.isInteger(c) || c >= bones.length) { problems.push({ code: 'rig-part', message: `${where}: vertex ${i} names bones ${a}, ${c}` }); return { b, w }; }
    const wa = fw[i * 2];
    const wc = c < 0 ? 0 : fw[i * 2 + 1];
    if (wa < 0 || wc < 0 || Math.abs(wa + wc - 1) > 0.02) { problems.push({ code: 'rig-part', message: `${where}: vertex ${i}'s weights ${wa}, ${wc} do not add to 1` }); return { b, w }; }
    b[i * 2] = a; b[i * 2 + 1] = c < 0 ? -1 : c; w[i * 2] = wa; w[i * 2 + 1] = wc;
  }
  return { b, w };
}

/** A plain variant name: no colon (the stamp lists a variant's textures as `<part>:<variant>`) and no path. */
export const VARIANT_NAME = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/** The members of a part or variant record that give it a mesh or a skin of its own (a variant with none of them uses the part's). */
const OWN_MESH = ['box', 'verts', 'uvs', 'uv', 'triangles', 'tris', 'bone', 'bones', 'weights'];

/**
 * One part's (or variant's) mesh, skin and files, in the runtime form: `{png, rim, box, verts, tris, tuv, b, w}`, or null when it is malformed (the problem is pushed). `p` is the record,
 * `where` the words every problem starts with. Checks the PNG and rim exist when `dir` is given.
 */
function meshOf(p, where, raw, bones, problems, dir) {
  if (!isNumArray(p?.box, 4) || p.box[2] <= 0 || p.box[3] <= 0) { problems.push({ code: 'rig-part', message: `${where}: box [x, y, w, h] is missing` }); return null; }
  const [bx, by, bw, bh] = p.box;
  if (raw.image && (bx < -1 || by < -1 || bx + bw > raw.image.w + 1 || by + bh > raw.image.h + 1)) problems.push({ code: 'rig-box', message: `${where}: box ${JSON.stringify(p.box)} leaves the ${raw.image.w} x ${raw.image.h} image` });
  const verts = p.verts ?? [bx, by, bx + bw, by, bx + bw, by + bh, bx, by + bh];
  if (!isNumArray(verts) || verts.length < 6 || verts.length % 2) { problems.push({ code: 'rig-part', message: `${where}: verts is not a list of x, y pairs` }); return null; }
  const n = verts.length / 2;
  const tri = p.triangles ?? p.tris ?? (p.verts === undefined ? [0, 1, 2, 0, 2, 3] : undefined);
  if (!Array.isArray(tri) || tri.length < 3 || tri.length % 3 || tri.some((t) => !Number.isInteger(t) || t < 0 || t >= n)) { problems.push({ code: 'rig-part', message: `${where}: triangles do not index its ${n} vertices` }); return null; }
  const uvIn = p.uvs ?? p.uv;
  const uvUp = p.uvs === undefined && p.uv !== undefined; // the prototype's `uv` alias is v UP
  if (uvIn && !isNumArray(uvIn, n * 2)) { problems.push({ code: 'rig-part', message: `${where}: uvs is not 2 numbers a vertex` }); return null; }
  const png = typeof p.png === 'string' && !/[\\/]|^\./.test(p.png) ? p.png : null;
  if (!png) problems.push({ code: 'rig-part', message: `${where}: png ${JSON.stringify(p.png)} is not a file name beside rig.json` });
  else if (dir && !existsSync(join(dir, png))) problems.push({ code: 'rig-file', message: `${where}: ${png} does not exist beside rig.json` });
  if (typeof p.rim === 'string' && dir && !existsSync(join(dir, p.rim))) problems.push({ code: 'rig-file', message: `${where}: ${p.rim} does not exist beside rig.json` });
  const { b, w } = skinOf(p, n, bones, problems, where);
  // texture rows from the top: `uvs` run DOWN like the painting's px; the prototype's `uv` alias runs UP and is flipped
  const tuv = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    tuv[k * 2] = uvIn ? uvIn[k * 2] : (verts[k * 2] - bx) / bw;
    tuv[k * 2 + 1] = uvIn ? (uvUp ? 1 - uvIn[k * 2 + 1] : uvIn[k * 2 + 1]) : (verts[k * 2 + 1] - by) / bh;
  }
  return { png, rim: p.rim ?? null, box: p.box, verts: Float32Array.from(verts), tris: Uint32Array.from(tri), tuv, b, w };
}

/** Every image file a rig names, with whose it is: `{part, variant: string|null, png, rim, box}`, parts first (in file order), each followed by its variants. A variant's box is its own or the part's. */
export function partImages(raw) {
  const out = [];
  for (const p of raw.parts ?? []) {
    out.push({ part: p.name, variant: null, png: p.png, rim: p.rim ?? null, box: p.box });
    for (const [vn, v] of Object.entries(p.variants ?? {})) out.push({ part: p.name, variant: vn, png: v?.png, rim: v?.rim ?? null, box: v?.box ?? p.box });
  }
  return out;
}

/** Does the file use a field only format v2 has? (The exporter writes version 2 exactly then.) */
export function usesV2(raw) {
  return (raw.parts ?? []).some((p) => p?.hidden !== undefined || p?.variants !== undefined) || Object.values(raw.keys ?? {}).some((k) => k?.parts !== undefined);
}

/**
 * Check a parsed rig and build the runtime form. Problems are `{code, message}`; a rig with any is not usable and the gate refuses it. `dir` (optional) checks that every
 * PNG the rig names exists. Never throws on a malformed rig: it says what is wrong.
 * @returns {{problems: Array<{code: string, message: string}>, rt: object|null}}
 */
export function normaliseRig(raw, { dir } = {}) {
  const problems = [];
  const bad = (code, message) => problems.push({ code, message });
  if (!raw || typeof raw !== 'object') return { problems: [{ code: 'rig-shape', message: 'rig.json is not an object' }], rt: null };
  if (!RIG_VERSIONS.includes(raw.version)) bad('rig-version', `version ${JSON.stringify(raw.version)} is not ${RIG_VERSIONS.join(' or ')}`);
  else if (raw.version < 2 && usesV2(raw)) bad('rig-version', 'the file uses hidden, variants or key parts, which are format v2, but says version 1');
  if (typeof raw.name !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(raw.name)) bad('rig-shape', `name ${JSON.stringify(raw.name)} is not a subject id (lowercase kebab)`);
  if (!isNum(raw.scale) || raw.scale <= 0) bad('rig-shape', `scale ${JSON.stringify(raw.scale)} is not a positive number`);
  if (!raw.image || !Number.isInteger(raw.image.w) || !Number.isInteger(raw.image.h) || raw.image.w < 8 || raw.image.h < 8) bad('rig-shape', 'image {w, h} is missing');
  if (!isNum(raw.baselineY)) bad('rig-shape', 'baselineY is missing');
  const cp = costumeParts(raw.costume?.painting);
  if (!cp) bad('rig-costume', `costume.painting ${JSON.stringify(raw.costume?.painting)} is not a characters/<subject>/<pose> painting path`);
  else if (cp.subject !== raw.name) bad('rig-costume', `costume.painting is ${cp.subject}'s but the rig is ${raw.name}'s`);
  if (!/^[0-9a-f]{16,64}$/.test(String(raw.costume?.sha ?? ''))) bad('rig-costume', 'costume.sha (the first 16 hex of the master PNG\'s sha256, or all 64) is missing: a rig must name the ONE approved master it is cut from');
  const bonesRaw = Array.isArray(raw.bones) ? raw.bones : [];
  if (!bonesRaw.length) bad('rig-bones', 'a rig has bones');
  const bones = [];
  const seen = new Set();
  bonesRaw.forEach((b, i) => {
    if (typeof b?.name !== 'string' || seen.has(b.name)) bad('rig-bones', `bone ${i}: the name ${JSON.stringify(b?.name)} is missing or listed twice`);
    seen.add(b?.name);
    if (!isNum(b?.x) || !isNum(b?.y)) bad('rig-bones', `bone ${b?.name}: no joint position`);
    const parent = Math.trunc(b?.parent);
    if (!Number.isInteger(parent) || parent >= i || parent < -1) bad('rig-bones', `bone ${b?.name}: parent ${JSON.stringify(b?.parent)} must be -1 or an EARLIER bone (parents come before children)`);
    bones.push({ name: b?.name, parent, x: b?.x, y: b?.y, bx: 0, by: 0 });
  });
  for (const b of bones) { const p = b.parent >= 0 ? bones[b.parent] : null; b.bx = b.x - (p ? p.x : 0); b.by = b.y - (p ? p.y : 0); }
  if (bones.length && !bones.some((b) => b.parent < 0)) bad('rig-bones', 'no root bone (parent -1)');
  const parts = [];
  const names = new Set();
  (Array.isArray(raw.parts) ? raw.parts : []).forEach((p, i) => {
    const where = `part ${p?.name ?? i}`;
    if (typeof p?.name !== 'string' || names.has(p.name)) bad('rig-part', `${where}: the name is missing or listed twice`);
    names.add(p?.name);
    if (p?.hidden !== undefined && typeof p.hidden !== 'boolean') bad('rig-part', `${where}: hidden is not true or false`);
    const m = meshOf(p, where, raw, bones, problems, dir);
    if (!m) return;
    const variants = {};
    for (const [vn, v] of Object.entries(p.variants ?? {})) {
      const vw = `${where} variant ${vn}`;
      if (!VARIANT_NAME.test(vn) || !v || typeof v !== 'object') { bad('rig-part', `${vw}: the name is not a plain name or the record is not an object`); continue; }
      let vm = { ...m, png: v.png, rim: v.rim ?? null };
      if (OWN_MESH.some((k) => v[k] !== undefined)) {
        const skinned = v.bone !== undefined || v.weights !== undefined || v.bones !== undefined;
        vm = meshOf({ ...v, box: v.box ?? p.box, ...(skinned || p.bone === undefined ? {} : { bone: p.bone }) }, vw, raw, bones, problems, dir);
        if (!vm) continue;
      } else {
        const png = typeof v.png === 'string' && !/[\\/]|^\./.test(v.png) ? v.png : null;
        if (!png) bad('rig-part', `${vw}: png ${JSON.stringify(v.png)} is not a file name beside rig.json`);
        else if (dir && !existsSync(join(dir, png))) bad('rig-file', `${vw}: ${png} does not exist beside rig.json`);
        if (typeof v.rim === 'string' && dir && !existsSync(join(dir, v.rim))) bad('rig-file', `${vw}: ${v.rim} does not exist beside rig.json`);
        vm = { ...m, png, rim: v.rim ?? null };
      }
      variants[vn] = { ...vm, alpha: null };
    }
    parts.push({ name: p.name, order: isNum(p.order) ? p.order : i, ...m, hidden: p.hidden === true, variants, alpha: null });
  });
  if (!parts.length) bad('rig-part', 'a rig has parts');
  parts.sort((a, b) => a.order - b.order);
  const landmarks = {};
  for (const [k, l] of Object.entries(raw.landmarks ?? {})) {
    const bone = typeof l?.bone === 'string' ? bones.findIndex((b) => b.name === l.bone) : l?.bone;
    if (!Number.isInteger(bone) || bone < 0 || bone >= bones.length || !isNum(l?.x) || !isNum(l?.y)) { bad('rig-landmark', `landmark ${k} is not {bone, x, y}`); continue; }
    landmarks[k] = { bone, x: l.x, y: l.y };
  }
  if (!landmarks.head) {
    const hb = bones.findIndex((b) => b.name === 'head');
    if (hb >= 0) landmarks.head = { bone: hb, x: bones[hb].x, y: bones[hb].y };
    else bad('rig-landmark', 'landmark `head` is missing (the gate reads the head\'s size through the bone that carries it)');
  }
  const keys = {};
  const boneIdx = new Map(bones.map((b, i) => [b.name, i]));
  for (const [pose, k] of Object.entries(raw.keys ?? {})) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(pose)) { bad('rig-key', `key ${JSON.stringify(pose)} is not a pose name the game can ask for`); continue; }
    if (typeof k?.source !== 'string' || !k.source) bad('rig-key', `key ${pose}: \`source\` (the approved painting it was fitted to, or "authored") is missing`);
    const out = { bones: {}, root: { dx: 0, dy: 0, rot: 0 }, source: k?.source ?? null, fit: k?.fit ?? null, planted: k?.planted !== false, parts: null };
    for (const [bn, ch] of Object.entries(k?.bones ?? {})) {
      if (!boneIdx.has(bn)) { bad('rig-key', `key ${pose}: bone ${bn} does not exist`); continue; }
      const c = { ...CHANNELS };
      for (const [cn, v] of Object.entries(ch ?? {})) {
        if (!(cn in CHANNELS) || !isNum(v)) { bad('rig-key', `key ${pose}.${bn}: ${cn} = ${JSON.stringify(v)} is not a channel (${Object.keys(CHANNELS).join(', ')}) or not a number`); continue; }
        c[cn] = v;
      }
      if (Math.abs(c.rot) > 2 * Math.PI || Math.abs(c.dx) > raw.image?.w || Math.abs(c.dy) > raw.image?.h || c.sx <= 0 || c.sy <= 0 || c.sx > 4 || c.sy > 4) bad('rig-key', `key ${pose}.${bn} is out of any sane range`);
      out.bones[bn] = c;
    }
    for (const [cn, v] of Object.entries(k?.root ?? {})) {
      if (!['dx', 'dy', 'rot'].includes(cn) || !isNum(v)) bad('rig-key', `key ${pose}.root: ${cn} = ${JSON.stringify(v)} is not dx, dy or rot`);
      else out.root[cn] = v;
    }
    if (k?.parts !== undefined) {
      if (!k.parts || typeof k.parts !== 'object' || Array.isArray(k.parts)) bad('rig-key', `key ${pose}: parts is not an object`);
      else {
        out.parts = {};
        if (pose === 'idle' && Object.keys(k.parts).length) bad('rig-key', 'the idle key names parts (it is the rest: hide a part by marking it hidden)');
        for (const [pn, e] of Object.entries(k.parts)) {
          const part = parts.find((x) => x.name === pn);
          if (!part) { bad('rig-key', `key ${pose}: parts names a part that is not there: ${pn}`); continue; }
          if (!e || typeof e !== 'object' || (e.show !== undefined && typeof e.show !== 'boolean') || (e.image !== undefined && typeof e.image !== 'string')) { bad('rig-key', `key ${pose}.${pn}: show is not true or false, or image is not a name`); continue; }
          if (e.image !== undefined && !part.variants[e.image]) { bad('variant-missing', `key ${pose}: part ${pn} has no variant ${JSON.stringify(e.image)}`); continue; }
          out.parts[pn] = { show: e.show !== false, image: e.show === false ? null : (e.image ?? null) };
        }
      }
    }
    keys[pose] = out;
  }
  if (!keys.idle) bad('rig-key', 'no `idle` key (every rig has one: the costume painting, at rest)');
  if (problems.length) return { problems, rt: null };
  return { problems, rt: { raw, name: raw.name, scale: raw.scale, image: raw.image, baselineY: raw.baselineY, costume: { ...raw.costume, ...cp }, bones, parts, landmarks, keys } };
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}` : JSON.stringify(v));

/**
 * The fingerprint a gate stamp is bound to: the rig without its `gate` field plus the bytes of every part PNG it names (and rim). Any edit to the keys, the meshes
 * or a texture changes it, so an `ok` stamp cannot outlive the thing it vouched for. First 32 hex of a sha256.
 */
export function rigDigest(raw, dir) {
  const h = createHash('sha256');
  const { gate: _gate, ...rest } = raw;
  h.update(canon(rest));
  // a v1 rig has no variants, so its list is the part files in part order, exactly as before; a v2 variant's files follow their part's
  for (const p of [...(raw.parts ?? [])].sort((a, b) => (a.name < b.name ? -1 : 1))) {
    for (const f of [p.png, p.rim, ...Object.entries(p.variants ?? {}).sort(([x], [y]) => (x < y ? -1 : 1)).flatMap(([, v]) => [v?.png, v?.rim])]) {
      if (!f) continue;
      const file = join(dir, f);
      h.update(`\n${f}:`);
      h.update(existsSync(file) ? sha256(readFileSync(file)) : 'missing');
    }
  }
  return h.digest('hex').slice(0, 32);
}

/** The total parts, bones, texels, PNG bytes, vertices and triangles of a rig, as the budget counts them. */
export function rigSize(raw, dir) {
  let texels = 0;
  let bytes = 0;
  let verts = 0;
  let tris = 0;
  let variants = 0;
  const png = (name) => { const f = join(dir, name ?? ''); if (name && existsSync(f)) bytes += readFileSync(f).length; };
  for (const p of raw.parts ?? []) {
    png(p.png);
    texels += (p.box?.[2] ?? 0) * (p.box?.[3] ?? 0);
    verts += p.verts ? p.verts.length / 2 : 4;
    tris += ((p.triangles ?? p.tris)?.length ?? 6) / 3;
    // format v2: every variant is another texture (and, with a mesh of its own, more vertices); a variant that uses the part's mesh adds none
    for (const v of Object.values(p.variants ?? {})) {
      variants++;
      png(v?.png);
      const box = v?.box ?? p.box;
      texels += (box?.[2] ?? 0) * (box?.[3] ?? 0);
      if (OWN_MESH.some((k) => v?.[k] !== undefined)) {
        verts += v.verts ? v.verts.length / 2 : 4;
        tris += ((v.triangles ?? v.tris)?.length ?? 6) / 3;
      }
    }
  }
  return { parts: (raw.parts ?? []).length, bones: (raw.bones ?? []).length, texels, bytes, verts, tris, variants };
}
