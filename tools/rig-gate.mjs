#!/usr/bin/env node
/**
 * **The rig gate** (the rig program; both games, shared plumbing). Bailey, 2026-10-17: "start rigging for all chapters please. i want a permanent fix now."
 * A rig (one approved painting cut into parts on a bone rig) ships only when this says `ok`:
 *
 *   node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/kimahri                    judge one rig, write `gate` into its rig.json, exit 1 when it refuses
 *   node tools/rig-gate.mjs --rig a,b,c --art D:/pyrefly-art-r50                 several; the art folder holds characters/<subject>/ (default public/art)
 *   node tools/rig-gate.mjs --rig D:/.../kimahri --check                         judge and report, write nothing (what the pose gate and the deploy do)
 *   node tools/rig-gate.mjs --rig D:/.../kimahri --verify [--art DIR]           the cheap check only, and the one the DEPLOY runs on every shipped rig (`tools/rig/rig-ship.mjs`; no rendering): the stamp is `ok`, by these
 *                                                                               rules, for exactly this content, with FULL coverage; the costume painting in --art is the master the parts were cut from; every painted
 *                                                                               pose has a key; the 1x twins are exactly the half of the textures; the folder holds nothing the rig does not name
 *   node tools/rig-gate.mjs --rig D:/.../kimahri --no-blends --json out.json     skip the 25/50/75 percent blends; also write the full result
 *   node tools/rig-gate.mjs --rig D:/.../kimahri --allow-partial                 FULL COVERAGE IS THE DEFAULT (the driver's rule, 2026-10-17: a figure turns its rig on only with a key for every pose it is painted in, no per-pose
 *                                                                               fallback to paintings). This turns it off for a rig still being fitted; the stamp then says `coverage: "partial"`, which --verify and the deploy refuse.
 *                                                                               (`--require-coverage` is still accepted and means what the default means.)
 *
 * The rules (all must hold; `tools/rig/rig-gate-lib.mjs` has the codes): the file is valid; it is cut from the ONE approved master (sha256, size, ground row); the rest pose
 * draws that painting (0.97 overlap); every key overlaps the approved painting of its pose by 0.85 or more, both registered at the idle's scale and feet; every key's stature
 * (a props-out pose reads head to soles), real head and feet are inside the pose class's band (`tools/posescale/pose-bands.mjs`); no alpha hole at any body joint in any key or
 * at 25, 50 and 75 percent between any two keys; parts, bones, vertices and textures inside the budget. Exit: 0 ok, 1 refused, 2 usage.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { loadModelInputs } from './posescale/pose-model.mjs';
import { ROOT, formatRigFailure, gateRig, stampRig } from './rig/rig-gate-lib.mjs';
import { verifyShippableRig } from './rig/rig-ship.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const get = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};

async function main() {
  const rigs = (get('--rig') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!rigs.length) { console.error('usage: node tools/rig-gate.mjs --rig <folder with rig.json>[,<folder>...] [--art DIR] [--root DIR] [--table JSON] [--check | --verify] [--no-blends] [--json F]  (see the header of tools/rig-gate.mjs)'); return 2; }
  const root = resolve(get('--root', ROOT));
  const artDir = get('--art') ? resolve(get('--art')) : undefined;
  // --table <json>: a registration table to read instead of the repository's (a fixture, a candidate table)
  const inputs = get('--table') ? await loadModelInputs({ root, artDir, table: JSON.parse(readFileSync(resolve(get('--table')), 'utf8')), tableSource: {}, koScale: {}, records: { subjects: {} } }) : undefined;
  let code = 0;
  const all = [];
  for (const rig of rigs) {
    if (flag('--verify')) {
      const v = await verifyShippableRig({ dir: resolve(rig), artDir: artDir ?? join(root, 'public', 'art'), allowPartial: flag('--allow-partial') });
      console.log(`rig-gate: ${rig}: ${v.ok ? `verified: stamp ok (${v.info.keys.length} key(s), full coverage${v.info.exempt.length ? `, ${v.info.exempt.length} exempt` : ''}), 1x tier proved (${v.info.tiers?.checked ?? 0} file(s))` : `NOT ok (${v.problems.length} problem(s))`}`);
      for (const p of v.problems) console.log(`  ${v.subject}  ${p.code}  ${p.message}`);
      if (!v.ok) code = 1;
      continue;
    }
    const t0 = Date.now();
    let r;
    try { r = await gateRig({ rig: resolve(rig), root, artDir, inputs, blends: !flag('--no-blends'), requireCoverage: !flag('--allow-partial') }); } catch (e) { console.error(`rig-gate: ${rig}: ${e instanceof Error ? e.message : String(e)}`); code = Math.max(code, 1); continue; }
    all.push(r);
    const okKeys = r.keys.filter((k) => k.ok).length;
    console.log(`rig-gate: ${r.subject ?? rig}: ${r.status.toUpperCase()}; ${okKeys} of ${r.keys.length} key(s) pass; rest overlap ${r.rest?.iou === null || r.rest?.iou === undefined ? 'n/a' : r.rest.iou.toFixed(3)}; ${r.holes ? `${r.holes.rendered} poses scanned for holes at ${r.holes.joints.length} joints; ` : ''}${r.size.parts} parts, ${r.size.bones} bones, ${r.size.verts} vertices, ${(r.size.texels / 1e6).toFixed(2)} Mpx, ${(r.size.bytes / 1e6).toFixed(2)} MB; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    if (r.uncovered.length) console.log(`  no key for ${r.uncovered.length} registered pose(s): ${r.uncovered.join(', ')}${flag('--allow-partial') ? ' (--allow-partial: the stamp will say coverage partial, and the deploy refuses it)' : ''}`);
    for (const k of r.keys) console.log(`  ${k.ok ? 'ok  ' : 'FAIL'} ${k.pose.padEnd(10)} ${k.class.padEnd(8)} iou ${k.iou === null ? 'n/a  ' : k.iou.toFixed(3)}  stature ${k.statureRead === null ? 'n/a  ' : k.statureRead.toFixed(3)}${k.propsOut ? ' (head to soles)' : ''}  feet ${k.feet ? `${k.feet.dx.toFixed(3)}, ${k.feet.dy.toFixed(3)}` : 'n/a'}  head ${k.headReal === null ? 'n/a' : k.headReal.toFixed(3)}`);
    for (const x of r.failures.slice(0, Number(get('--max', 40)))) console.log(`FAIL  ${formatRigFailure(r.subject ?? '?', x)}`);
    if (r.failures.length > Number(get('--max', 40))) console.log(`... and ${r.failures.length - Number(get('--max', 40))} more (--max N)`);
    if (!flag('--check') && r.rigDir) {
      const g = stampRig(r.rigDir, r);
      console.log(`rig-gate: wrote gate.status ${g.status} into ${r.rigDir}`);
    }
    if (r.status !== 'ok') code = 1;
  }
  if (get('--json')) writeFileSync(resolve(get('--json')), `${JSON.stringify(all.map((r) => ({ ...r, rigDir: undefined })), null, 1)}\n`);
  if (code === 0) console.log('rig-gate: PASS');
  else console.log('rig-gate: REFUSED. A rig that is not `ok` does not ship; its painting-per-pose rows stay the fallback.');
  return code;
}

process.exitCode = await main();
