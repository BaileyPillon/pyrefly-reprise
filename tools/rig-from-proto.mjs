#!/usr/bin/env node
/**
 * Convert the Quality Leap prototype's `rig/<subject>/` (rig.json + part PNGs + rim masks) to the rig file, format v1 (`src/data/art/rigTypes.ts`), in a rig art folder.
 * The rig program, 2026-10-17; both games, shared plumbing. A converter and a FIXTURE MAKER for the engine's smoke run, not the cutting pipeline and not the gate.
 *
 *   node tools/rig-from-proto.mjs --from D:/Tools/pyrefly-scratch/2026-10-15/quality-leap/proto-25d/rig/kimahri --to D:/pyrefly-art-rigs/kimahri-proto \
 *        [--subject kimahri] [--painting D:/pyrefly-art-r50/characters/kimahri/idle@2x.png] [--gate ok|none]
 *
 * What it does: `uv` (v up) becomes `uvs` (v down); `tris` becomes `triangles`; the prototype's two-entries-a-vertex `bones` + `weights` become four numbers a vertex
 * (`[b0, w0, b1, w1]`); `noRim` becomes `rimEverywhere`; `costume` is the master painting's name and sha256; `head` and `feet` landmarks are added; and a minimal KEY set
 * (idle, ready, attack, hurt: bone transforms in radians, legs counter-rotating the pelvis so the feet stay put) and, for Kimahri, the prototype's lag chains and idle
 * (`motion`) are written. `--gate ok` stamps `gate.status: "ok"` (`by` says it is the fixture maker's, not `tools/rig-gate.mjs`'s); the smoke run needs it, nothing ships on it.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

const argv = process.argv.slice(2);
const get = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d;
};

/** Kimahri's prototype motion (`proto-25d/src/choreo/kimahri.ts`): the lag chains, the wind as `drag` (the prototype's `wind * deg` over a 7 u/s run), and the 2 s idle. */
export const KIMAHRI_MOTION = {
  chains: [
    { bones: ['mane0', 'mane1', 'mane2'], follow: 'chest', f: 2.6, z: 0.42, fFalloff: 0.85, hang: 0.1, drag: [4, 4.86, 5.14] },
    { bones: ['tail0', 'tail1', 'tail2', 'tail3', 'tail4'], follow: 'pelvis', f: 2.2, z: 0.4, fFalloff: 0.88, hang: 0.22, limit: 60, drag: [1.43, 2, 2.57, 3.14, 3.43] },
    { bones: ['sash0', 'sash1'], follow: 'pelvis', f: 3.0, z: 0.38, fFalloff: 0.9, hang: 0.35, drag: [3.14, 4.29] },
    { bones: ['beard0', 'beard1'], follow: 'head', f: 3.2, z: 0.45, fFalloff: 0.9, hang: 0.4, limit: 40, drag: [0.86, 1.43] },
    { bones: ['hair'], follow: 'head', f: 3.4, z: 0.45, hang: 0.9, limit: 40, drag: [2.86] },
  ],
  idle: {
    hz: 0.5,
    bones: {
      pelvis: { rot: 0.35, phase: 0.4 },
      spine: { rot: 0.55, phase: -0.9 },
      chest: { rot: 1.5, phase: -1.2 },
      head: { rot: 0.8, phase: -1.8 },
      upperarm: { rot: 0.5, phase: -1.6 },
      forearm: { rot: 0.4, phase: -2.0 },
      thighN: { rot: -0.35, phase: 0.4 },
      thighF: { rot: -0.35, phase: 0.4 },
    },
  },
};

/** A minimal key set for the smoke run: radians, the legs counter the pelvis so the feet stay on the floor. */
export function protoKeys(subject) {
  const key = (source, bones, extra = {}) => ({ bones, source: `characters/${subject}/${source}`, planted: true, ...extra });
  const legs = (pelvis) => ({ thighN: { rot: -pelvis }, thighF: { rot: -pelvis } });
  return {
    idle: { bones: {}, source: `characters/${subject}/idle` },
    ready: key('ready', { pelvis: { rot: 0.06 }, spine: { rot: 0.08 }, chest: { rot: 0.1 }, head: { rot: 0.06 }, upperarm: { rot: -0.2 }, ...legs(0.06) }),
    attack: key(
      'attack',
      { pelvis: { rot: 0.12 }, spine: { rot: 0.2 }, chest: { rot: 0.3 }, head: { rot: 0.16 }, upperarm: { rot: -0.95 }, forearm: { rot: -0.3 }, hand: { rot: -0.1 }, ...legs(0.12) },
      { ms: 140 },
    ),
    hurt: key('hurt', { pelvis: { rot: -0.1 }, spine: { rot: -0.18 }, chest: { rot: -0.26 }, head: { rot: -0.3 }, upperarm: { rot: 0.4 }, forearm: { rot: 0.3 }, ...legs(-0.1) }),
  };
}

export function convertProto(proto, { subject, paintingName, sha, gate }) {
  const parts = proto.parts.map((p) => {
    const n = p.verts.length / 2;
    const out = { name: p.name, order: p.order, png: p.png, box: p.box, verts: p.verts, triangles: p.tris ?? p.triangles };
    if (p.rim && !p.noRim) out.rim = p.rim;
    if (p.noRim) out.rimEverywhere = true;
    const uv = p.uv ?? p.uvs;
    if (uv) out.uvs = uv.map((v, i) => (i % 2 ? Math.round((1 - v) * 1e6) / 1e6 : v)); // the prototype's uv is v up, uvs is v down
    const w = new Array(n * 4);
    for (let i = 0; i < n; i++) {
      const b1 = p.bones[i * 2 + 1];
      w[i * 4] = p.bones[i * 2];
      w[i * 4 + 1] = p.weights[i * 2];
      w[i * 4 + 2] = b1 < 0 ? -1 : b1;
      w[i * 4 + 3] = b1 < 0 ? 0 : p.weights[i * 2 + 1];
    }
    out.weights = w;
    return out;
  });
  const landmarks = { ...proto.landmarks, head: proto.landmarks.headCenter, feet: proto.landmarks.footN };
  return {
    version: 1,
    name: subject,
    scale: proto.scale,
    image: proto.image,
    baselineY: proto.baselineY,
    costume: { painting: paintingName, pose: 'idle', sha },
    bones: proto.bones,
    parts,
    landmarks,
    keys: protoKeys(subject),
    ...(subject === 'kimahri' ? { motion: KIMAHRI_MOTION } : {}),
    ...(gate ? { gate } : {}),
  };
}

function main() {
  const from = get('--from');
  const to = get('--to');
  if (!from || !to) {
    console.error('usage: node tools/rig-from-proto.mjs --from <proto rig dir> --to <rig art folder> [--subject kimahri] [--painting <idle@2x.png>] [--gate ok|none]');
    return 2;
  }
  const proto = JSON.parse(readFileSync(join(resolve(from), 'rig.json'), 'utf8'));
  const subject = get('--subject', proto.name);
  const painting = resolve(get('--painting', `D:/pyrefly-art-r50/characters/${subject}/idle@2x.png`));
  const sha = createHash('sha256').update(readFileSync(painting)).digest('hex');
  const gate = get('--gate', 'ok') === 'ok' ? { status: 'ok', at: new Date().toISOString(), by: 'tools/rig-from-proto.mjs (smoke fixture, not the rig gate)' } : null;
  const rig = convertProto(proto, { subject, paintingName: `characters/${subject}/idle`, sha, gate });
  mkdirSync(resolve(to), { recursive: true });
  for (const p of proto.parts) {
    copyFileSync(join(resolve(from), p.png), join(resolve(to), p.png));
    if (p.rim) copyFileSync(join(resolve(from), p.rim), join(resolve(to), p.rim));
  }
  writeFileSync(join(resolve(to), 'rig.json'), `${JSON.stringify(rig)}\n`);
  console.log(`rig-from-proto: ${subject}: ${rig.parts.length} parts, ${rig.bones.length} bones, ${Object.keys(rig.keys).length} keys -> ${resolve(to)} (gate ${gate ? gate.status : 'none'})`);
  return 0;
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('rig-from-proto.mjs')) process.exit(main());
