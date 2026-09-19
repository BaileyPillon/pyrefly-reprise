/**
 * Face-crop measuring rig for `src/ui/common/portrait.ts`.
 *
 * The crop table in that file is hand-measured data about paintings the art
 * fleet re-rolls, and the last round shipped a row (`auron`) whose eye line sat
 * on the character's mouth. A number typed from memory is exactly what this
 * script exists to replace: everything here is read off the pixels.
 *
 * Two jobs:
 *
 * 1. `detect` — find, from the file alone, the top of the subject's head and
 *    the head's horizontal centre. White-background art, so "ink" is anything
 *    that is not near-white; the head is the topmost compact blob. These are
 *    the numbers the guard test asserts against, and nothing about them comes
 *    from the table, so a wrong row cannot make the test pass.
 * 2. `sheet` — render a head-region blow-up with a labelled grid, so the eye
 *    line and the eye-to-eye distance can be read off the painting to the
 *    nearest 0.005 of the file rather than guessed.
 *
 * Usage:
 *   node tools/portraits/measure-face-crops.mjs detect > detected.json
 *   node tools/portraits/measure-face-crops.mjs sheet auron out.png
 *   node tools/portraits/measure-face-crops.mjs fixture   # rewrite the test fixture
 */

import sharp from 'sharp';
import { readdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Ink is opacity.
 *
 * Every painting in `public/art` is an alpha cut-out — the pipeline removes the
 * generator's white background before it lands — so "where is the subject" is
 * just "where is alpha", with no tone threshold to tune and nothing that a dark
 * costume or a pale one can confuse. (The first draft of this rig thresholded
 * luminance against a white background and reported every head top as row 0,
 * because it was reading a cut-out's black zero-alpha pixels as ink.)
 */
const MIN_ALPHA = 96;

/** A row needs this many ink pixels to count as "the subject starts here" (kills stray matte speckle). */
const MIN_ROW_INK = 4;

async function inkMask(file) {
  const img = sharp(file).ensureAlpha();
  const { width, height } = await img.metadata();
  const raw = await img.raw().toBuffer();
  const ink = new Uint8Array(width * height);
  for (let i = 3, p = 0; i < raw.length; i += 4, p++) {
    if (raw[i] >= MIN_ALPHA) ink[p] = 1;
  }
  return { ink, width, height };
}

/** Longest contiguous run of ink on one row, as `[x0, x1]` (exclusive), or null. */
function longestRun(ink, width, y) {
  let best = null;
  let start = -1;
  for (let x = 0; x <= width; x++) {
    const on = x < width && ink[y * width + x] === 1;
    if (on && start < 0) start = x;
    if (!on && start >= 0) {
      if (!best || x - start > best[1] - best[0]) best = [start, x];
      start = -1;
    }
  }
  return best;
}

function rowInk(ink, width, y) {
  let n = 0;
  for (let x = 0; x < width; x++) n += ink[y * width + x];
  return n;
}

/**
 * Head top and head centre, from the pixels.
 *
 * The head is the topmost thing in every painting in this pipeline (portraits
 * are head-and-shoulders, full bodies are "standing, full body"), so the first
 * inked row is the crown. The centre is the median centre of the longest ink
 * run over the band just under the crown — a median rather than a mean because
 * a weapon or a wing that reaches the same rows shows up as an outlier row, and
 * the longest *contiguous* run rather than the row's whole span because a
 * greatsword held out to one side is a separate run from the head.
 */
export async function detectHead(file) {
  const { ink, width, height } = await inkMask(file);
  let top = -1;
  for (let y = 0; y < height; y++) {
    if (rowInk(ink, width, y) >= MIN_ROW_INK) {
      top = y;
      break;
    }
  }
  if (top < 0) return null;

  // Head band: from the crown down by a fraction of the *width*, which tracks
  // head size far better than the canvas height does (a full-body canvas is the
  // same height as a portrait one but the head is a third the size).
  const band = Math.max(8, Math.round(width * 0.12));
  const centres = [];
  const widths = [];
  for (let y = top; y < Math.min(height, top + band); y++) {
    const run = longestRun(ink, width, y);
    if (!run || run[1] - run[0] < 3) continue;
    centres.push((run[0] + run[1]) / 2);
    widths.push(run[1] - run[0]);
  }
  if (!centres.length) return null;
  centres.sort((a, b) => a - b);
  widths.sort((a, b) => a - b);
  const median = (a) => a[Math.floor(a.length / 2)];
  return {
    width,
    height,
    headTopY: top / height,
    headCentreX: median(centres) / width,
    headBandWidth: median(widths) / width,
  };
}

const GRID_STEP_Y = 0.01;
const GRID_STEP_X = 0.02;

/**
 * A head-region blow-up with a labelled grid, for reading an eye line off the
 * painting. Lines are labelled in fractions **of the whole file**, which is the
 * unit `PortraitCrop` uses, so a number read here goes straight into the table.
 */
export async function headSheet(file, out, { from = 0.0, to = 0.62, scale = 1.6 } = {}) {
  const meta = await sharp(file).metadata();
  const y0 = Math.round(meta.height * from);
  const y1 = Math.round(meta.height * to);
  const cw = Math.round(meta.width * scale);
  const ch = Math.round((y1 - y0) * scale);
  const base = await sharp(file)
    .extract({ left: 0, top: y0, width: meta.width, height: y1 - y0 })
    .flatten({ background: '#1b1b22' })
    .resize(cw, ch)
    .toBuffer();

  let lines = '';
  for (let f = 0; f <= 1.0001; f += GRID_STEP_Y) {
    if (f < from - 1e-9 || f > to + 1e-9) continue;
    const y = (f * meta.height - y0) * scale;
    const major = Math.abs(f * 100 - Math.round(f * 100)) < 1e-6 && Math.round(f * 100) % 5 === 0;
    lines +=
      `<line x1="0" y1="${y.toFixed(1)}" x2="${cw}" y2="${y.toFixed(1)}" stroke="${major ? '#ff00ff' : '#00e5ff'}" stroke-width="${major ? 1.6 : 0.8}" opacity="${major ? 0.95 : 0.55}"/>` +
      (major
        ? `<text x="4" y="${(y - 3).toFixed(1)}" font-family="monospace" font-size="16" fill="#ff00ff" stroke="#000" stroke-width="0.6">${f.toFixed(3)}</text>`
        : '');
  }
  for (let f = 0; f <= 1.0001; f += GRID_STEP_X) {
    const x = f * meta.width * scale;
    const major = Math.round(f * 100) % 10 === 0;
    lines +=
      `<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${ch}" stroke="${major ? '#ffd166' : '#7fffd4'}" stroke-width="${major ? 1.6 : 0.8}" opacity="${major ? 0.9 : 0.45}"/>` +
      (major
        ? `<text x="${(x + 3).toFixed(1)}" y="18" font-family="monospace" font-size="16" fill="#ffd166" stroke="#000" stroke-width="0.6">${f.toFixed(2)}</text>`
        : '');
  }
  const svg = Buffer.from(`<svg width="${cw}" height="${ch}" xmlns="http://www.w3.org/2000/svg">${lines}</svg>`);
  await sharp(base).composite([{ input: svg, top: 0, left: 0 }]).png().toFile(out);
  return out;
}

/**
 * A window of the painting with a grid labelled in **file pixels** — the
 * measuring tool the rows are actually read off.
 *
 * Reading a rendered tile by eye and converting back was tried first and is
 * where this rig went wrong: a head 70 px across in a 609 px file is a dozen
 * pixels in a contact-sheet tile, and a misjudged cell there put Paine's Dark
 * Knight eye line a whole head above her eyes. Here the number under the
 * crosshair *is* the number the row wants — `fx = x / width`, `fy = y / height`
 * — with no arithmetic in between to get wrong.
 */
export async function probe(file, out, { cx = 0.5, cy = 0.2, half = 220, scale = 1.6, step = 20 } = {}) {
  const m = await sharp(file).metadata();
  const px = Math.round(cx * m.width);
  const py = Math.round(cy * m.height);
  const left = Math.max(0, Math.min(m.width - 1, px - half));
  const top = Math.max(0, Math.min(m.height - 1, py - half));
  const w = Math.min(m.width - left, half * 2);
  const h = Math.min(m.height - top, half * 2);
  const base = await sharp(file)
    .extract({ left, top, width: w, height: h })
    .flatten({ background: '#1b1b22' })
    .resize(Math.round(w * scale), Math.round(h * scale))
    .toBuffer();
  let g = '';
  for (let x = Math.ceil(left / step) * step; x < left + w; x += step) {
    const sx = (x - left) * scale;
    const major = x % (step * 5) === 0;
    g +=
      `<line x1="${sx.toFixed(1)}" y1="0" x2="${sx.toFixed(1)}" y2="${h * scale}" stroke="#ffd166" stroke-width="${major ? 1.4 : 0.6}" opacity="${major ? 0.85 : 0.35}"/>` +
      (major ? `<text x="${(sx + 2).toFixed(1)}" y="16" font-family="monospace" font-size="14" fill="#ffd166" stroke="#000" stroke-width="0.5">${x}</text>` : '');
  }
  for (let y = Math.ceil(top / step) * step; y < top + h; y += step) {
    const sy = (y - top) * scale;
    const major = y % (step * 5) === 0;
    g +=
      `<line x1="0" y1="${sy.toFixed(1)}" x2="${w * scale}" y2="${sy.toFixed(1)}" stroke="#00e5ff" stroke-width="${major ? 1.4 : 0.6}" opacity="${major ? 0.85 : 0.35}"/>` +
      (major ? `<text x="2" y="${(sy - 3).toFixed(1)}" font-family="monospace" font-size="14" fill="#00e5ff" stroke="#000" stroke-width="0.5">${y}</text>` : '');
  }
  const svg = Buffer.from(
    `<svg width="${Math.round(w * scale)}" height="${Math.round(h * scale)}" xmlns="http://www.w3.org/2000/svg">${g}` +
      `<text x="4" y="${Math.round(h * scale) - 6}" font-family="monospace" font-size="16" fill="#e8dcc0" stroke="#000" stroke-width="0.6">${m.width}x${m.height}</text></svg>`,
  );
  const png = await sharp(base).composite([{ input: svg, top: 0, left: 0 }]).png().toBuffer();
  if (out) await sharp(png).toFile(out);
  return png;
}

// ------------------------------------------------------- the shipped crop

/**
 * A verbatim port of `cropStyle` in `src/ui/common/portrait.ts`.
 *
 * It is a port rather than an import because this is a node script and that is
 * a browser TypeScript module; `tests/unit/ui-portrait-face-crop.test.ts`
 * asserts the real `faceCropStyle` produces exactly these four numbers for
 * every id in the fixture, so the two cannot drift apart in silence.
 */
export const TARGET_IPD = 0.3;
export const TARGET_EYE_Y = 0.42;

const clamp = (min, max, v) => Math.max(min, Math.min(max, v));

export function cropBox(crop, opts = {}) {
  let w = ((opts.ipd ?? TARGET_IPD) / crop.ipd) * 100;
  let h = w / crop.aspect;
  const grow = Math.max(1, 100 / w, 100 / h);
  w *= grow;
  h *= grow;
  const left = clamp(100 - w, 0, 50 - crop.fx * w);
  const top = clamp(100 - h, 0, (opts.eyeY ?? TARGET_EYE_Y) * 100 - crop.fy * h);
  return { w, h, left, top };
}

/** Where a point of the *file* lands in the tile, as a fraction of the tile. */
export function placeInTile(crop, opts, fx, fy) {
  const { w, h, left, top } = cropBox(crop, opts);
  return { x: (left + fx * w) / 100, y: (top + fy * h) / 100 };
}

/** Render one id through {@link cropBox} into a `size` square, crosshair optional. */
export async function renderTile(file, crop, size = 260, { crosshair = true, grid = false, opts = {} } = {}) {
  const { w, h, left, top } = cropBox(crop, opts);
  const rw = Math.max(1, Math.round((w / 100) * size));
  const rh = Math.max(1, Math.round((h / 100) * size));
  const scaled = sharp(file).flatten({ background: '#1b1b22' }).resize(rw, rh, { fit: 'fill' });
  // The `<img>` is positioned at a possibly negative offset inside a frame with
  // `overflow: hidden`, so what the tile shows is the intersection — sharp will
  // not composite a layer that overhangs, and a bare `.composite` here is what
  // the first draft of this rig died on.
  const lx = Math.round((left / 100) * size);
  const ly = Math.round((top / 100) * size);
  const sx = Math.max(0, -lx);
  const sy = Math.max(0, -ly);
  const sw = Math.max(1, Math.min(rw - sx, size - Math.max(0, lx)));
  const sh = Math.max(1, Math.min(rh - sy, size - Math.max(0, ly)));
  const visible = await sharp(await scaled.png().toBuffer())
    .extract({ left: sx, top: sy, width: sw, height: sh })
    .toBuffer();
  let out = await sharp({ create: { width: size, height: size, channels: 3, background: '#1b1b22' } })
    .composite([{ input: visible, left: Math.max(0, lx), top: Math.max(0, ly) }])
    .png()
    .toBuffer();
  if (crosshair) {
    const eye = Math.round((opts.eyeY ?? TARGET_EYE_Y) * size);
    const ipd = (opts.ipd ?? TARGET_IPD) * size;
    // A decile grid in *tile* coordinates: reading "the eye is 12 % below the
    // line" off this converts straight into a row correction, because a point
    // at tile fraction `t` sits at file fraction `(t * 100 - top) / h`.
    let mesh = '';
    if (grid) {
      for (let i = 1; i < 10; i++) {
        const p = (i / 10) * size;
        mesh +=
          `<line x1="0" y1="${p}" x2="${size}" y2="${p}" stroke="#00e5ff" stroke-width="0.8" opacity="0.45"/>` +
          `<line x1="${p}" y1="0" x2="${p}" y2="${size}" stroke="#00e5ff" stroke-width="0.8" opacity="0.35"/>` +
          `<text x="2" y="${p - 2}" font-family="monospace" font-size="11" fill="#00e5ff">${(i / 10).toFixed(1)}</text>` +
          `<text x="${p + 2}" y="${size - 3}" font-family="monospace" font-size="11" fill="#00e5ff">${(i / 10).toFixed(1)}</text>`;
      }
    }
    const svg = Buffer.from(
      `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${mesh}` +
        `<line x1="0" y1="${eye}" x2="${size}" y2="${eye}" stroke="#ff2d9b" stroke-width="1.5" opacity="0.95"/>` +
        `<line x1="${size / 2}" y1="0" x2="${size / 2}" y2="${size}" stroke="#ff2d9b" stroke-width="1" opacity="0.5"/>` +
        `<circle cx="${size / 2 - ipd / 2}" cy="${eye}" r="4" fill="none" stroke="#39ff14" stroke-width="2"/>` +
        `<circle cx="${size / 2 + ipd / 2}" cy="${eye}" r="4" fill="none" stroke="#39ff14" stroke-width="2"/>` +
        `<rect x="0.5" y="0.5" width="${size - 1}" height="${size - 1}" fill="none" stroke="#c8a24a" stroke-width="1"/>` +
        `</svg>`,
    );
    out = await sharp(out).composite([{ input: svg, top: 0, left: 0 }]).png().toBuffer();
  }
  return out;
}

/** A labelled contact sheet of rendered tiles. */
export async function contactSheet(entries, out, { size = 260, cols = 5 } = {}) {
  const pad = 26;
  const rows = Math.ceil(entries.length / cols);
  const cw = size + pad;
  const chh = size + pad;
  const composites = [];
  let labels = '';
  for (let i = 0; i < entries.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cw + pad / 2;
    const y = row * chh + pad - 4;
    composites.push({ input: entries[i].png, left: x, top: y });
    labels += `<text x="${x + 2}" y="${y - 6}" font-family="monospace" font-size="15" fill="#e8dcc0">${entries[i].label}</text>`;
  }
  const W = cols * cw;
  const H = rows * chh + 8;
  const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${labels}</svg>`);
  await sharp({ create: { width: W, height: H, channels: 3, background: '#12121a' } })
    .composite([...composites, { input: svg, top: 0, left: 0 }])
    .png()
    .toFile(out);
  return out;
}

// ---------------------------------------------------------------- subjects

export function portraitIds() {
  const dir = resolve(ROOT, 'public/art/portraits');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.png') && !f.includes('.raw.') && !/\.\d+\.png$/.test(f))
    .map((f) => f.replace(/\.png$/, ''))
    .sort();
}

export function bodyIds() {
  const dir = resolve(ROOT, 'public/art/characters');
  return readdirSync(dir)
    .filter((id) => existsSync(resolve(dir, id, 'idle.png')))
    .sort();
}

export function portraitFile(id) {
  return resolve(ROOT, 'public/art/portraits', `${id}.png`);
}

export function bodyFile(id) {
  return resolve(ROOT, 'public/art/characters', id, 'idle.png');
}

async function detectAll() {
  const out = { portraits: {}, bodies: {} };
  for (const id of portraitIds()) out.portraits[id] = await detectHead(portraitFile(id));
  for (const id of bodyIds()) out.bodies[id] = await detectHead(bodyFile(id));
  return out;
}

/** The shipped table — the same file `src/ui/common/portrait.ts` imports. */
export function crops() {
  return JSON.parse(readFileSync(resolve(ROOT, 'src/ui/common/face-crops.json'), 'utf8'));
}

function rowToCrop(row) {
  return { fx: row.fx, fy: row.fy, ipd: row.ipd, aspect: row.px[0] / row.px[1] };
}

/**
 * The acceptance sheet: every measured row rendered through the shipped
 * geometry, with the target eye line and the eye-to-eye ticks drawn on top.
 *
 * This is the test a human can fail. The old handoff's acceptance test was
 * "no tile has bare frame on any edge", which `cropStyle`'s own cover clamp
 * makes impossible to fail — it proved nothing about whether a face was in the
 * frame. Here a row is right when the pupils sit on the crosshair.
 */
export async function acceptanceSheet(out, { size = 320, cols = 6 } = {}) {
  const data = crops();
  const entries = [];
  for (const [id, row] of Object.entries(data.portraits)) {
    entries.push({ label: id, png: await renderTile(portraitFile(id), rowToCrop(row), size, { grid: true }) });
  }
  for (const [id, row] of Object.entries(data.bodies)) {
    entries.push({ label: id, png: await renderTile(bodyFile(id), rowToCrop(row), size, { grid: true }) });
  }
  await contactSheet(entries, out, { size, cols });
  return out;
}

const [, , cmd, a, b] = process.argv;
if (cmd === 'detect') {
  console.log(JSON.stringify(await detectAll(), null, 2));
} else if (cmd === 'sheet') {
  const file = existsSync(portraitFile(a)) ? portraitFile(a) : bodyFile(a);
  await headSheet(file, b ?? resolve(ROOT, 'head-sheet.png'));
} else if (cmd === 'probe') {
  const file = existsSync(portraitFile(a)) ? portraitFile(a) : bodyFile(a);
  const data = crops();
  const row = data.portraits[a] ?? data.bodies[a];
  await probe(file, b ?? resolve(ROOT, `probe-${a}.png`), {
    cx: row?.fx ?? 0.5,
    cy: row?.fy ?? 0.2,
    half: 190,
    scale: 1.4,
    step: 20,
  });
  console.log(`wrote ${b ?? `probe-${a}.png`}`);
} else if (cmd === 'accept') {
  console.log(`wrote ${await acceptanceSheet(a ?? resolve(ROOT, 'face-crops-acceptance.png'))}`);
} else if (cmd === 'fixture') {
  const data = await detectAll();
  const target = resolve(ROOT, 'tests/fixtures/face-crop-detected.json');
  writeFileSync(
    target,
    `${JSON.stringify(
      {
        note:
          'Generated by tools/portraits/measure-face-crops.mjs — head top and head centre read off the pixels of every painting in public/art. Regenerate after an art re-roll; tests/unit/ui-portrait-face-crop.test.ts asserts the crop table frames these.',
        generatedAt: new Date().toISOString().slice(0, 10),
        ...data,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`wrote ${target}`);
}
