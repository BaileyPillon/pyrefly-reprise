/**
 * **Lulu's front views as format v2** (2026-10-18; FFX only: Lulu is an FFX figure): her version 1 rig (`D:/pyrefly-art-rigs/lulu`, the one release 55 ships) turned into a NEW rig folder that uses the
 * v2 fields instead of the "speck" hack. The v1 folder is only read.
 *
 *   node tools/rig/subjects/lulu-v2-from-v1.mjs --from D:/pyrefly-art-rigs/lulu --to D:/pyrefly-art-rigs/lulu-v2
 *   node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --art D:/pyrefly-art-r50          (stamps it; run it twice if `key-fit-stale` names defend or od-fury: the first run reads, `--fit-claims` below writes)
 *
 * What v1 had to do (`lulu_hooks.py`, pass 2): the front-view upper body of the DEFEND painting (`fdef`) and of the OD-FURY painting (`fod`) were two parts that are ALWAYS in the file, stored as a speck
 * (the mesh divided by 16, hidden at the hips on a chain of two bones `fdef1/fdef2`, `fod1/fod2`) that the key scaled 4 x 4 times and moved to the figure, with the side head, collar and the shell bones
 * shrunk to 0.8, the hanging arm swung in behind the skirt and the braid swung down behind the chest, all by `layers` and scales, because a v1 key can neither hide a part nor swap an image.
 *
 * What v2 says instead:
 *   - ONE part `front`, hidden at rest, drawn in front (order 20): its own image is the defend upper body; its variant `od-fury` is the Overdrive one, with a mesh and a box of its own. Both are skinned
 *     rigidly to `root` and carry the REAL vertices, not the speck: the vertices are the positions the speck chain gave them in that key (computed here from the v1 rig itself, so the picture is the same
 *     pixels in the same place), taken back through the root's transform, which is the identity in these two keys.
 *   - the keys `defend` and `od-fury` show `front` (the second with `image: "od-fury"`) and HIDE the side-view parts the front body replaces (head, shoulders, the hanging arm, the braid, the doll). The
 *     chains, the shell-bone scales, the hanging-arm and braid swings and the `layers` are gone, and the four chain bones with them. The back arm on her hip stays, behind the front part, as in v1.
 * Everything else (the skeleton below the waist, the skirt, the hips shift that puts the head bone on the front head, every other key) is byte for byte v1's.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normaliseRig } from '../rig-format.mjs';
import { keyPose, skinPart, solve } from '../rig-pose.mjs';

const argv = process.argv.slice(2);
const get = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };

/** The v1 chain bones and the parts that rode on them, by key. */
export const FRONTS = [
  { key: 'defend', part: 'fdef', chain: ['fdef1', 'fdef2'], variant: null },
  { key: 'od-fury', part: 'fod', chain: ['fod1', 'fod2'], variant: 'od-fury' },
];
/** The side-view parts a front-view upper body replaces (they were shrunk or swung out of the way in v1). `armA`, the back arm with the hand on her hip, is NOT hidden: in v1 it stayed on her hip
 * behind the front part, and hiding it opens a small hole at its joint half way into od-fury (the gate caught it: 23 px at the back shoulder, 75 percent of the way from hurt). */
export const HIDES = ['head', 'shoulders', 'armB', 'braid', 'doll'];
/** The bone entries of the two keys that only existed to hide those parts or to move the speck. */
export const HACK_BONES = ['headS', 'chestS', 'upperarm', 'braid0'];

const round = (v) => Math.round(v * 1000) / 1000;

/** Drop bones by name and renumber everything that points at a bone (parents, the four-number skin, `bone` indices). Names (keys, landmarks, chains, `bone: "name"`) need nothing. */
export function dropBones(raw, names) {
  const drop = new Set(names);
  const keep = raw.bones.map((b) => !drop.has(b.name));
  const newIndex = []; let n = 0;
  raw.bones.forEach((_, i) => { newIndex[i] = keep[i] ? n++ : -1; });
  raw.bones = raw.bones.filter((_, i) => keep[i]).map((b) => {
    if (b.parent >= 0 && newIndex[b.parent] < 0) throw new Error(`bone ${b.name} hangs from a dropped one`);
    return { ...b, parent: b.parent < 0 ? -1 : newIndex[b.parent] };
  });
  const remap = (i) => (i < 0 ? i : newIndex[i]);
  for (const p of raw.parts) {
    if (Array.isArray(p.weights) && p.weights.length % 4 === 0 && p.bones === undefined) for (let i = 0; i < p.weights.length; i += 4) { p.weights[i] = remap(p.weights[i]); p.weights[i + 2] = remap(p.weights[i + 2]); }
    if (typeof p.bone === 'number') p.bone = remap(p.bone);
  }
  for (const l of Object.values(raw.landmarks)) if (typeof l.bone === 'number') l.bone = remap(l.bone);
  return raw;
}

export function convert(rawIn, dir) {
  const raw = JSON.parse(JSON.stringify(rawIn));
  delete raw.gate;
  const { problems, rt } = normaliseRig(rawIn, { dir });
  if (!rt) throw new Error(`the v1 rig does not read: ${JSON.stringify(problems)}`);
  const root = rt.bones.findIndex((b) => b.parent < 0);
  const byName = new Map(raw.parts.map((p) => [p.name, p]));
  const placed = {};
  for (const f of FRONTS) {
    const p = byName.get(f.part);
    if (!p) throw new Error(`no part ${f.part}`);
    const part = rt.parts.find((x) => x.name === f.part);
    const k = solve(rt, keyPose(rt, rt.keys[f.key])).k;
    const out = new Float64Array(part.verts.length);
    skinPart(part, k, out);
    // the part is rigid on `root`: v = inverse(root's skin matrix in this key) applied to where the speck chain put the vertex
    const [a, b, c, d, e, g] = [k[root * 6], k[root * 6 + 1], k[root * 6 + 2], k[root * 6 + 3], k[root * 6 + 4], k[root * 6 + 5]];
    const det = a * d - b * c;
    const verts = [];
    for (let i = 0; i < out.length; i += 2) {
      const x = out[i] - e; const y = out[i + 1] - g;
      verts.push(round((d * x - c * y) / det), round((-b * x + a * y) / det));
    }
    placed[f.part] = { verts, p };
  }
  const defend = placed['fdef'].p;
  const od = placed['fod'].p;
  // the one part: defend's image as its own, Overdrive's as the variant
  const front = {
    name: 'front', order: 20, png: defend.png, rim: defend.rim, box: defend.box, verts: placed['fdef'].verts, uvs: defend.uvs, triangles: defend.triangles, bone: 'root', hidden: true,
    variants: { 'od-fury': { png: od.png, rim: od.rim, box: od.box, verts: placed['fod'].verts, uvs: od.uvs, triangles: od.triangles, bone: 'root' } },
  };
  raw.parts = [...raw.parts.filter((p) => !['fdef', 'fod'].includes(p.name)), front];
  raw.version = 2;
  for (const f of FRONTS) {
    const key = raw.keys[f.key];
    for (const n of [...f.chain, ...HACK_BONES]) delete key.bones[n];
    delete key.layers;
    key.parts = { front: f.variant ? { image: f.variant } : {}, ...Object.fromEntries(HIDES.map((n) => [n, { show: false }])) };
  }
  for (const k of Object.values(raw.keys)) for (const n of FRONTS.flatMap((f) => f.chain)) delete k.bones?.[n];
  dropBones(raw, FRONTS.flatMap((f) => f.chain));
  return raw;
}

function main() {
  const from = resolve(get('--from', 'D:/pyrefly-art-rigs/lulu'));
  const to = resolve(get('--to', 'D:/pyrefly-art-rigs/lulu-v2'));
  if (to === from) throw new Error('--to is the v1 folder: this tool never writes into it');
  const raw = JSON.parse(readFileSync(join(from, 'rig.json'), 'utf8'));
  const out = convert(raw, from);
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from)) { if (f === 'rig.json' || statSync(join(from, f)).isDirectory()) continue; copyFileSync(join(from, f), join(to, f)); }
  writeFileSync(join(to, 'rig.json'), JSON.stringify(out));
  // the claims of the two keys are the pipeline's, not readings: the gate says what it reads, and `--fit-claims <gate.json>` writes those into the keys
  const claims = get('--fit-claims');
  if (claims && existsSync(claims)) {
    const g = JSON.parse(readFileSync(claims, 'utf8'));
    const rep = (Array.isArray(g) ? g[0] : g).keys;
    const cur = JSON.parse(readFileSync(join(to, 'rig.json'), 'utf8'));
    for (const r of rep) if (cur.keys[r.pose]?.fit) { cur.keys[r.pose].fit.iou = round(r.iou ?? cur.keys[r.pose].fit.iou); if (r.statureRead != null) cur.keys[r.pose].fit.stature = round(r.statureRead); }
    writeFileSync(join(to, 'rig.json'), JSON.stringify(cur));
  }
  console.log(`lulu-v2-from-v1: ${out.parts.length} parts, ${out.bones.length} bones, version ${out.version} -> ${to}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
