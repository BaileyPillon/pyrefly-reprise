#!/usr/bin/env node
/**
 * node tools/special-part-anchors.mjs [--masks <dir>] [--sidecars <dir>] [--out <file>]   writes src/data/art/specialParts.ts
 * node tools/special-part-anchors.mjs --check [...]                                        exits 1 when the committed table differs from a fresh run, 2 when the input is invalid
 *
 * The anchor table of the FFX-2 Special dresspheres (game case: FFX-2 only: Floral Fallal, Machina Maw and Full Throttle exist only in FFX-2). Each Special is ONE connected figure painted
 * once, with three alpha masks per painted pose (the main body, the right part, the left part) cut by the art kit from the model renders. This tool reads the masks and writes the
 * small table the stage uses: per pose, each part's centre and ring radius in the painting's pixels, the crop box of its HUD plate, the whole figure's box and its number point.
 *
 * Input, `--masks <dir>` (default tests/fixtures/specials/masks): `<special>/<pose>/{main,right,left}.png` (+ `whole.png`, else the union of the three), all one size; a pixel is drawn when its
 * alpha (a grey mask: its value) is above 16, the preflight's rule. `<special>/<pose>/meta.json` `{width, height, baselineY?, contentTop?}` is the painting's size when the masks are smaller
 * than it (the committed fixtures are 1/4 size); absent, the mask's own size, the figure's lowest drawn row and its highest. `--sidecars <dir>` (`<dir>/<artId>/<pose>.json`, the game's
 * sidecar) overrides the painting size, feet line and top with the real painting's (a sidecar without a top: the figure's box scaled to its size), and clears `provisional` for a Special only
 * when EVERY one of its posed rows matched a sidecar. Right and left come from the FILE NAME, never from where the part sits (Full Throttle's right
 * wing crosses to the screen-right of its left wing in the attack). The poses are the four the preflight picked; `victory` is owed (its render is not made yet).
 *
 * Output: only the table file, deterministic (keys sorted, whole pixels, fractions to 0.001). Regenerate it whenever the art changes. Every `[ours]` below is a table value, not game data.
 * No python; `sharp` only (a devDependency).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The painted pose -> the render frame the preflight picked for it (the masks are cut per frame, then named by pose). */
export const POSE_FRAME = { idle: 'idle-1', attack: 'attack-2', cast: 'cast-3', hurt: 'hurt-2' };
const POSES = ['idle', 'attack', 'cast', 'hurt'];
const ALPHA = 16; // drawn when above this
const NUMBER_POINT_Y = 0.3; // [ours] the damage numbers hang at this fraction of the figure's box height from its top: "over the figure's upper middle"
const RADIUS_CAP = 0.35; // [ours] a part's ring radius is at most this share of the figure's width
const CROP_GROW = 1.15; // [ours] a part's plate tile is its box grown to a square of this many times its longer side, round its centre
const SPECIALS = [
  { id: 'floral-fallal', girl: 'yuna', silhouetteGirls: 2.63, widthOverHeight: 0.76, provisional: false },
  { id: 'machina-maw', girl: 'rikku', silhouetteGirls: 2.02, widthOverHeight: 1.13, provisional: false },
  { id: 'full-throttle', girl: 'paine', silhouetteGirls: 2.97, widthOverHeight: 0.94, provisional: true }, // 0.94 is with the swords (about 1.07 without): provisional
];
/** [ours] the trial row's sizes in girls (floral-fallal, machina-maw, full-throttle) and the window share each takes at them, desktop and phone (the preflight's paper widths; Full Throttle's provisional). */
const TRIAL_GIRLS = { desktop: [1.55, 1.45, 1.55], phone: [1.15, 1.0, 1.15] };
const TRIAL_WIDTH_PERCENT = { desktop: [24, 33, 33], phone: [42, 55, 59] };
const WIDTH_CAP_PERCENT = { desktop: 35, phone: 60 };
const r0 = (v) => Math.round(v);
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

function widthCapGirls() {
  const out = {};
  for (const s of ['desktop', 'phone']) out[s] = TRIAL_GIRLS[s].map((g, i) => r2((g * WIDTH_CAP_PERCENT[s]) / TRIAL_WIDTH_PERCENT[s][i]));
  return out;
}

/** The three fit rows (`SpecialStaging.specialFitGirls` reads them). `trial` is the working default; `larger` is "about 2 girls" on the desktop; `true` is the silhouettes, no enemy and no width term. */
function fitRows() {
  const caps = widthCapGirls();
  const widthCapShare = { desktop: WIDTH_CAP_PERCENT.desktop / 100, phone: WIDTH_CAP_PERCENT.phone / 100 };
  const silhouettes = SPECIALS.map((s) => s.silhouetteGirls);
  return {
    larger: { enemyShare: 0.9, formGirls: { desktop: [2, 2, 2], phone: TRIAL_GIRLS.phone }, widthCapGirls: caps, widthCapShare },
    trial: { enemyShare: 0.9, formGirls: TRIAL_GIRLS, widthCapGirls: caps, widthCapShare },
    true: { enemyShare: null, formGirls: { desktop: silhouettes, phone: silhouettes }, widthCapGirls: null, widthCapShare: null },
  };
}

async function readMask(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const alpha = info.channels === 2 || info.channels === 4 ? info.channels - 1 : 0; // the alpha when there is one, else the grey value
  const drawn = new Uint8Array(info.width * info.height);
  for (let i = 0; i < drawn.length; i++) drawn[i] = data[i * info.channels + alpha] > ALPHA ? 1 : 0;
  return { w: info.width, h: info.height, drawn };
}

/** Box (edges: x1, y1 are one past the last drawn pixel) and centroid of the drawn pixels, in mask pixels; null when nothing is drawn. */
function measure({ w, h, drawn }) {
  let n = 0, sx = 0, sy = 0, x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!drawn[y * w + x]) continue;
      n++; sx += x + 0.5; sy += y + 0.5;
      if (x < x0) x0 = x; if (x + 1 > x1) x1 = x + 1; if (y < y0) y0 = y; if (y + 1 > y1) y1 = y + 1;
    }
  }
  return n ? { box: [x0, y0, x1, y1], at: [sx / n, sy / n] } : null;
}

/** A sidecar counts only with its own width and height (a file without them says nothing about the painting's scale). */
const usable = (side) => (side && side.width > 0 && side.height > 0 ? side : undefined);

/**
 * One pose's rows from its masks; `paint` is the painting's size and feet line when the sidecar gives it. With a usable sidecar, EVERY paint
 * number is in the sidecar's scale (its `baselineY` and `contentTop` when it has them, else the whole mask's box scaled to that size); `meta.json` (the render's scale) is read only
 * when no sidecar matched, so a row never mixes the two scales.
 */
async function poseRows(dir, sidecar) {
  const named = {};
  for (const name of ['main', 'right', 'left']) named[name] = await readMask(join(dir, `${name}.png`));
  const { w, h } = named.main;
  let whole;
  if (existsSync(join(dir, 'whole.png'))) whole = await readMask(join(dir, 'whole.png'));
  else whole = { w, h, drawn: named.main.drawn.map((v, i) => v | named.right.drawn[i] | named.left.drawn[i]) };
  for (const m of [named.right, named.left, whole]) if (m.w !== w || m.h !== h) throw new Error(`${dir}: the masks are not all one size`);
  const meta = existsSync(join(dir, 'meta.json')) ? JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8')) : {};
  const size = { width: sidecar ? sidecar.width : meta.width ?? w, height: sidecar ? sidecar.height : meta.height ?? h };
  const kx = size.width / w, ky = size.height / h;
  const all = measure(whole);
  if (!all) throw new Error(`${dir}: the whole figure is empty`);
  const wholeW = (all.box[2] - all.box[0]) * kx, wholeH = (all.box[3] - all.box[1]) * ky;
  const box = [r0(all.box[0] * kx), r0(all.box[1] * ky), r0(all.box[2] * kx), r0(all.box[3] * ky)];
  const own = sidecar ?? meta; // the numbers that share the size's scale
  const paint = { baselineY: r0(own.baselineY ?? box[3]), contentTop: r0(own.contentTop ?? box[1]), height: size.height, width: size.width };
  const part = (m, name) => {
    const s = measure(m);
    if (!s) throw new Error(`${dir}: the ${name} mask is empty`);
    const bw = (s.box[2] - s.box[0]) * kx, bh = (s.box[3] - s.box[1]) * ky, cx = s.at[0] * kx, cy = s.at[1] * ky;
    const side = CROP_GROW * Math.max(bw, bh);
    const lo = (c, extent) => Math.max(0, Math.min(c - side / 2, extent - side)); // the square kept inside the painting by sliding it
    const x0 = lo(cx, size.width), y0 = lo(cy, size.height);
    const crop = [x0 / size.width, y0 / size.height, Math.min(size.width, x0 + side) / size.width, Math.min(size.height, y0 + side) / size.height].map(r3);
    return { crop, px: [r0(cx), r0(cy)], radiusPx: r0(Math.min(0.5 * Math.max(bw, bh), RADIUS_CAP * wholeW)) };
  };
  return {
    left: part(named.left, 'left'),
    paint,
    right: part(named.right, 'right'),
    whole: { box, numberPoint: [r0((box[0] + box[2]) / 2), r0(box[1] + NUMBER_POINT_Y * wholeH)] },
  };
}

/** Everything the table holds, from the masks. A pose with no folder gets no row; `idle` is required. */
export async function buildTable(masksDir, sidecarsDir) {
  const specials = {};
  const missing = [];
  const unmatched = []; // poses that have masks but no usable sidecar while `--sidecars` was given
  for (const s of SPECIALS) {
    const poses = {};
    const artId = `${s.girl}-${s.id}`;
    let everyPoseMatched = true;
    for (const pose of POSES) {
      const dir = join(masksDir, s.id, pose);
      if (!existsSync(join(dir, 'main.png'))) {
        missing.push(`${s.id}/${pose}`);
        continue;
      }
      const side = sidecarsDir && existsSync(join(sidecarsDir, artId, `${pose}.json`)) ? usable(JSON.parse(readFileSync(join(sidecarsDir, artId, `${pose}.json`), 'utf8'))) : undefined;
      if (!side) {
        everyPoseMatched = false;
        if (sidecarsDir) unmatched.push(`${s.id}/${pose}`);
      }
      poses[pose] = await poseRows(dir, side);
    }
    if (!poses.idle) throw new Error(`${s.id}: no idle masks under ${masksDir} (idle is required)`);
    // provisional until EVERY posed row of this Special was measured against a real painting's sidecar (the flag alone proves nothing)
    specials[s.id] = { artId, poses, provisional: !(sidecarsDir && everyPoseMatched) || s.provisional, silhouetteGirls: s.silhouetteGirls, widthOverHeight: s.widthOverHeight };
  }
  return { specials, missing, unmatched };
}

const list = (a) => `[${a.join(', ')}]`;
const num = (v) => (v === null ? 'null' : String(v));
const surfaces = (o, f) => `{ desktop: ${f(o.desktop)}, phone: ${f(o.phone)} }`;

/** The table as the text of `src/data/art/specialParts.ts`. */
export function render({ specials }) {
  const L = [];
  L.push('// Generated by tools/special-part-anchors.mjs; do not edit by hand');
  L.push('// FFX-2 only: the three Special dresspheres (Floral Fallal, Machina Maw, Full Throttle) exist only in FFX-2. One figure per Special, painted once, with a main, a right and a left part mask per pose.');
  L.push('// Pixels are the painting\'s own. `provisional` is true while the masks are the model-render fixtures; regenerate (`node tools/special-part-anchors.mjs`) whenever the art changes.');
  L.push('');
  L.push('export interface PartRow { px: [number, number]; radiusPx: number; crop: [number, number, number, number] /* fractions x0,y0,x1,y1 of the painting: the plate tile */ }');
  L.push('export interface PoseRows { paint: { width: number; height: number; baselineY: number; contentTop: number }; right: PartRow; left: PartRow; whole: { box: [number, number, number, number]; numberPoint: [number, number] } }');
  L.push('export type SpecialPartsId = \'floral-fallal\' | \'machina-maw\' | \'full-throttle\';');
  L.push('export interface SpecialPartsRow { artId: string; silhouetteGirls: number; widthOverHeight: number; provisional: boolean; poses: Record<string, PoseRows> }');
  L.push('export type FitRowName = \'trial\' | \'larger\' | \'true\';');
  L.push('export interface FitRow { formGirls: Record<\'desktop\' | \'phone\', [number, number, number]>; enemyShare: number | null; widthCapShare: Record<\'desktop\' | \'phone\', number> | null; widthCapGirls: Record<\'desktop\' | \'phone\', [number, number, number]> | null }');
  L.push('');
  L.push('export const SPECIAL_PARTS: Record<SpecialPartsId, SpecialPartsRow> = {');
  for (const id of Object.keys(specials).sort()) {
    const s = specials[id];
    L.push(`  '${id}': {`);
    L.push(`    artId: '${s.artId}', silhouetteGirls: ${s.silhouetteGirls}, widthOverHeight: ${s.widthOverHeight}, provisional: ${s.provisional},`);
    L.push('    poses: {');
    for (const pose of Object.keys(s.poses).sort()) {
      const p = s.poses[pose];
      const row = (r) => `{ crop: ${list(r.crop)}, px: ${list(r.px)}, radiusPx: ${r.radiusPx} }`;
      L.push(`      ${pose}: {`);
      L.push(`        left: ${row(p.left)},`);
      L.push(`        paint: { baselineY: ${p.paint.baselineY}, contentTop: ${p.paint.contentTop}, height: ${p.paint.height}, width: ${p.paint.width} },`);
      L.push(`        right: ${row(p.right)},`);
      L.push(`        whole: { box: ${list(p.whole.box)}, numberPoint: ${list(p.whole.numberPoint)} },`);
      L.push('      },');
    }
    L.push('    },');
    L.push('  },');
  }
  L.push('};');
  L.push('');
  L.push('/** The size rows, in girls (a girl is the scene\'s party height): index 0 floral-fallal, 1 machina-maw, 2 full-throttle. `[ours]` throughout: the trial values are the preflight\'s; `widthCapGirls` is derived (trial girls x the window-share cap / the paper share); `larger` is "about 2 girls"; `true` is the silhouettes. */');
  L.push('export const FIT_ROWS: Record<FitRowName, FitRow> = {');
  const rows = fitRows();
  for (const name of Object.keys(rows).sort()) {
    const r = rows[name];
    const triple = (t) => list(t);
    L.push(`  ${name}: {`);
    L.push(`    enemyShare: ${num(r.enemyShare)},`);
    L.push(`    formGirls: ${surfaces(r.formGirls, triple)},`);
    L.push(`    widthCapGirls: ${r.widthCapGirls ? surfaces(r.widthCapGirls, triple) : 'null'},`);
    L.push(`    widthCapShare: ${r.widthCapShare ? surfaces(r.widthCapShare, String) : 'null'},`);
    L.push('  },');
  }
  L.push('};');
  L.push('');
  L.push('/** Where a Special\'s figure stands: \'own\' is the main girl\'s own slot (D-5). \'middle\' is not implemented (it needs an entry and an exit move). */');
  L.push('export const STAND_POINT: Record<\'yuna\' | \'rikku\' | \'paine\', \'own\' | \'middle\'> = { paine: \'own\', rikku: \'own\', yuna: \'own\' };');
  return L.join('\n') + '\n';
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  const masks = resolve(root, opt('--masks') ?? 'tests/fixtures/specials/masks');
  const sidecars = opt('--sidecars') ? resolve(root, opt('--sidecars')) : undefined;
  const out = resolve(root, opt('--out') ?? 'src/data/art/specialParts.ts');
  let text;
  try {
    const table = await buildTable(masks, sidecars);
    text = render(table);
    if (table.missing.length) process.stderr.write(`no row for: ${table.missing.join(', ')}\n`);
    if (table.unmatched.length) process.stderr.write(`no sidecar for (rows stay in the mask scale, the Special stays provisional): ${table.unmatched.join(', ')}\n`);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(2);
  }
  if (args.includes('--check')) {
    const have = existsSync(out) ? readFileSync(out, 'utf8').replace(/\r\n/g, '\n') : null;
    if (have === text) {
      process.stdout.write('specialParts.ts is up to date.\n');
    } else {
      process.stderr.write(`specialParts.ts is ${have === null ? 'missing' : 'stale'}: run  node tools/special-part-anchors.mjs  and commit it with the art change.\n`);
      process.exit(1);
    }
  } else {
    writeFileSync(out, text);
    process.stdout.write(`wrote ${out}\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
