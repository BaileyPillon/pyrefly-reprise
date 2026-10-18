#!/usr/bin/env node
/**
 * **What a rig's keys are fitted to** (the rig program; both games): for every pose the game has a registered painting of, the approved painting's silhouette on the pose
 * model's common grid, registered at the idle's scale and feet (`rig-read.mjs#approvedTarget`), plus the numbers the fitter needs to place a posed rig on the same grid.
 * The fitter (`tools/rig/rig_fit.py`, Python) optimises bone transforms against these masks; the rig gate (`rig-gate-lib.mjs`) then re-reads the result with the model, so the
 * two never share a rasteriser.
 *
 *   node tools/rig/rig-targets.mjs --subject kimahri --out D:/pyrefly-art-rigs-work/kimahri/targets [--art D:/pyrefly-art-r50] [--costume idle] [--scale 2] [--baseline 1182] [--poses a,b]
 *
 * Writes `<out>/targets.json` and `<out>/<pose>.png` (a GW x GH 8-bit mask, 255 inside). `--baseline` is the costume's ground row in 1x painting px (default: the pose model's
 * registered anchor); `--scale` the master tier the parts are cut from (default 2). The poses are the paintings in the art folder `characters/<subject>/` the registration table has a
 * row for: the ones the game can draw (`--poses` narrows it).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { loadModelInputs, listPoses, readSubject, referenceOf } from '../posescale/pose-model.mjs';
import { readPaint } from '../posescale/pose-pixels.mjs';
import { ROOT } from './rig-gate-lib.mjs';
import { GRID, approvedTarget, statureBand } from './rig-read.mjs';

/**
 * The targets of one subject. @returns {Promise<{info: object, masks: Record<string, Uint8Array>}>}
 * @param {object} o `{ inputs, subject, costume, scale, baseline, poses, turn }`; `turn`: poses whose painting faces the other way from the rig (the file faces left, the rig right): their TARGET is the painting turned about
 * its stance, registered as the model registers a painting drawn the other way, and `place` says so (mirror turned), so a landmark mark of such a pose is the painting's own pixel, as the gate reads it for a key that says `turn: true`
 */
export async function buildTargets({ inputs, subject, costume = 'idle', scale = 2, baseline, poses, turn = [] }) {
  const R = await referenceOf(inputs, subject);
  const names = (poses ?? listPoses(inputs, subject)).filter((p) => inputs.table[subject]?.[p] || p === R.refName);
  const readings = await readSubject(inputs, subject, { poses: [...new Set([costume, ...names])] });
  const cr = readings.find((r) => r.pose === costume);
  if (!cr) throw new Error(`rig-targets: no costume painting ${subject}/${costume}.png`);
  const [W1, H1] = cr.size;
  const anchor1 = baseline ?? cr.drawn.anchor;
  const { upp, shift, mirror } = cr.drawn;
  const { GS, GU0, GV1 } = GRID;
  const info = {
    schema: 'rig-targets/1', subject, scale,
    grid: { GS, GW: GRID.GW, GH: GRID.GH, GU0, GV1 },
    costume: { pose: costume, size: [W1, H1], anchor1, upp, shift, mirror, row: inputs.table[subject]?.[costume] ?? null },
    // grid cell of an image (master) px: X = ax x + bx, Y = ay y + by
    gridFromMaster: {
      ax: (upp * mirror * GS) / scale, bx: ((-W1 / 2) * upp * mirror + shift - GU0) * GS,
      ay: (upp * GS) / scale, by: (GV1 - anchor1 * upp) * GS,
    },
    ref: { refName: R.refName, figH: R.figH, solesGap: R.solesGap, stanceMeasuredOff: R.stanceMeasuredOff, bodyH: R.bodyH, headSize: R.headSize, upp: R.upp },
    poses: {},
  };
  const masks = {};
  for (const r of readings) {
    if (r.pose === costume && !names.includes(costume)) continue;
    const m = await readPaint(join(inputs.artDir, 'characters', subject, `${r.pose}.png`), r.pose);
    const t = approvedTarget({ R, inputs }, r, m); // the model's own registration: where the gate reads this painting
    const turned = turn.includes(r.pose) ? approvedTarget({ R, inputs }, { ...r, drawn: { ...r.drawn, mirror: -r.drawn.mirror } }, m) : null;
    masks[r.pose] = (turned ?? t).mask;
    info.poses[r.pose] = {
      class: r.class, band: statureBand(r.class, r.pose), propsOut: t.propsOut, normK: Math.round(t.k * 1000) / 1000, registered: t.registered,
      stature: r.stature, bodyStature: r.bodyStature, headReal: r.headReal, status: r.status, feetPx: r.feetPx, png: `${r.pose}.png`,
      // how this pose's painting was placed on the grid (u = (x - W/2) upp mirror + shift, v = (anchor - y) upp, x and y in the painting's 1x px): the fitter puts the painting's landmark marks where the gate does
      place: { W: m.W, upp: (turned ?? t).upp, anchor: (turned ?? t).anchor, shift: (turned ?? t).shift, mirror: turned ? -r.drawn.mirror : r.drawn.mirror },
      ...(turned ? { mirroredTarget: true } : {}),
    };
  }
  return { info, masks };
}

async function main() {
  const argv = process.argv.slice(2);
  const get = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
  const subject = get('--subject');
  const out = get('--out');
  if (!subject || !out) { console.error('usage: node tools/rig/rig-targets.mjs --subject <id> --out <folder> [--art DIR] [--root DIR] [--table JSON] [--costume idle] [--scale 2] [--baseline px] [--poses a,b] [--mirror a,b]'); return 2; }
  // --table <json>: a registration table to read instead of the repository's (`{ subject: { pose: row } }`): a fixture, a candidate table
  const table = get('--table') ? JSON.parse(readFileSync(resolve(get('--table')), 'utf8')) : undefined;
  const inputs = await loadModelInputs({ root: resolve(get('--root', ROOT)), artDir: get('--art') ? resolve(get('--art')) : undefined, ...(table ? { table, tableSource: {}, koScale: {}, records: { subjects: {} } } : {}) });
  const { info, masks } = await buildTargets({ inputs, subject, costume: get('--costume', 'idle'), scale: Number(get('--scale', 2)), baseline: get('--baseline') ? Number(get('--baseline')) : undefined, poses: get('--poses')?.split(','), turn: get('--mirror')?.split(',') ?? [] });
  mkdirSync(resolve(out), { recursive: true });
  for (const [pose, mask] of Object.entries(masks)) {
    const buf = Buffer.alloc(mask.length);
    for (let i = 0; i < mask.length; i++) buf[i] = mask[i] ? 255 : 0;
    await sharp(buf, { raw: { width: GRID.GW, height: GRID.GH, channels: 1 } }).toColourspace('b-w').png().toFile(join(resolve(out), `${pose}.png`));
  }
  writeFileSync(join(resolve(out), 'targets.json'), JSON.stringify(info, null, 1));
  console.log(`rig-targets: ${Object.keys(masks).length} pose(s) of ${subject} -> ${resolve(out)}: ${Object.keys(masks).join(', ')}`);
  return 0;
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('rig-targets.mjs')) process.exitCode = await main();
