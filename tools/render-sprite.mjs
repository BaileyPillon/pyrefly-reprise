#!/usr/bin/env node
/**
 * Render a sprite definition to PNGs so an author can *look* at their work.
 *
 *   node tools/render-sprite.mjs src/sprites/characters/tidus.ts
 *   node tools/render-sprite.mjs src/sprites/characters/tidus.ts --all --grid
 *   node tools/render-sprite.mjs src/sprites/characters/tidus.ts --state=attack --scale=10
 *   node tools/render-sprite.mjs src/sprites/characters --contact
 *
 * Flags:
 *   --state=NAME   render one state (default: the sprite's defaultState)
 *   --all          render every state, plus a combined review sheet
 *   --scale=N      preview zoom (default: the sprite's `scale`, else 8)
 *   --out=DIR      output directory (default: build/sprites)
 *   --grid         draw a faint 1px grid line every logical pixel on previews
 *   --contact      treat the path as a folder and build one contact sheet
 *   --quiet        print only the written paths
 *
 * Sprite modules are plain TypeScript with type-only imports, so Node's built-in
 * type stripping loads them directly — no bundler, no dependencies.
 */

import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { rasterize } from '../src/sprites/raster.ts';
import { frameDuration } from '../src/sprites/format.ts';
import { Image, rgba } from './png.mjs';
import { drawText, textWidth } from './pixel-font.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const BG = rgba('#171a24');
const BG_ALT = rgba('#1e2230');
const GRID = rgba('#ffffff14');
const RULE = rgba('#2c3446');
const TEXT = rgba('#c8d2e4');
const DIM = rgba('#7b869c');
const ANCHOR = rgba('#ff4fa3');

const PAD = 10;
const LABEL = 5;

// ------------------------------------------------------------------- args

function parseArgs(argv) {
  const opts = { path: null, state: null, all: false, scale: null, out: null, grid: false, contact: false, quiet: false };
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=');
      if (k === 'state') opts.state = v ?? null;
      else if (k === 'all') opts.all = true;
      else if (k === 'scale') opts.scale = Number(v);
      else if (k === 'out') opts.out = v ?? null;
      else if (k === 'grid') opts.grid = true;
      else if (k === 'contact') opts.contact = true;
      else if (k === 'quiet') opts.quiet = true;
      else if (k === 'help') opts.help = true;
      else throw new Error(`unknown flag --${k}`);
    } else if (opts.path === null) {
      opts.path = arg;
    } else {
      throw new Error(`unexpected argument "${arg}"`);
    }
  }
  return opts;
}

// ------------------------------------------------------------------ loading

/** Import a sprite module and return its `SpriteDef`. */
async function loadSprite(file) {
  const mod = await import(pathToFileURL(resolve(file)).href);
  const candidates = [mod.default, ...Object.values(mod)];
  const def = candidates.find((v) => v && typeof v === 'object' && v.states && v.palette && v.size);
  if (!def) throw new Error(`${file}: no exported SpriteDef (need { name, size, palette, states })`);
  return def;
}

function listSpriteFiles(dir) {
  const skip = new Set(['format.ts', 'raster.ts', 'shapes.ts', 'canvas.ts', 'index.ts', 'TEMPLATE.ts']);
  const out = [];
  const walk = (d) => {
    for (const entry of readdirSync(d).sort()) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (
        extname(entry) === '.ts' &&
        !skip.has(entry) &&
        !entry.startsWith('_') &&
        !entry.endsWith('.d.ts')
      )
        out.push(full);
    }
  };
  walk(dir);
  return out;
}

// ------------------------------------------------------------------ drawing

function cellBackground(img, x, y, w, h, raster, scale, grid, anchor) {
  img.fillRect(x, y, w, h, BG_ALT);
  if (grid) {
    for (let gx = scale; gx < w; gx += scale) img.fillRect(x + gx, y, 1, h, GRID);
    for (let gy = scale; gy < h; gy += scale) img.fillRect(x, y + gy, w, 1, GRID);
  }
  if (anchor) {
    const ax = x + Math.round(anchor[0] * scale);
    const ay = y + Math.round(anchor[1] * scale);
    img.fillRect(x, ay, w, 1, [ANCHOR[0], ANCHOR[1], ANCHOR[2], 70]);
    img.fillRect(ax, y, 1, h, [ANCHOR[0], ANCHOR[1], ANCHOR[2], 70]);
  }
  img.blit(raster, x, y, scale);
}

/** One row of frames for a state, laid out left to right with index labels. */
function stateSheet(def, state, rasters, scale, grid) {
  const [w, h] = def.size;
  const cellW = w * scale;
  const cellH = h * scale;
  const n = Math.max(1, rasters.length);
  const width = PAD + n * (cellW + PAD);
  const height = PAD + LABEL + 4 + cellH + 4 + LABEL + PAD;
  const img = new Image(width, height, BG);
  drawText(img, `${def.name} ${state}`, PAD, PAD, 1, TEXT);
  const top = PAD + LABEL + 4;
  rasters.forEach((r, i) => {
    const x = PAD + i * (cellW + PAD);
    cellBackground(img, x, top, cellW, cellH, r, scale, grid, def.anchor);
    const label = `${i} ${frameDuration(def, def.states[state][i])}MS`;
    drawText(img, label, x, top + cellH + 4, 1, DIM);
  });
  return img;
}

/** Every state stacked vertically — the single image an author reviews. */
function reviewSheet(def, states, scale, grid) {
  const [w, h] = def.size;
  const cellW = w * scale;
  const cellH = h * scale;
  const rows = states.map(([state, rasters]) => ({ state, rasters }));
  const cols = Math.max(1, ...rows.map((r) => r.rasters.length));
  const labelW = 44;
  const stripW = cols * (w + 2) + PAD;
  const width = PAD + labelW + cols * (cellW + PAD) + stripW;
  const rowH = cellH + PAD + LABEL + 6;
  const height = PAD + LABEL + 8 + rows.length * rowH + PAD;
  const img = new Image(width, height, BG);

  drawText(img, `${def.name}  ${w}X${h}  ${Object.keys(def.palette).length} COLOURS`, PAD, PAD, 1, TEXT);
  let y = PAD + LABEL + 8;
  for (const row of rows) {
    img.fillRect(PAD, y - 3, width - PAD * 2, 1, RULE);
    drawText(img, row.state, PAD, y + Math.round(cellH / 2), 1, TEXT);
    row.rasters.forEach((r, i) => {
      const x = PAD + labelW + i * (cellW + PAD);
      cellBackground(img, x, y, cellW, cellH, r, scale, grid, def.anchor);
      drawText(img, `${i}`, x, y + cellH + 3, 1, DIM);
    });
    // 1x strip beside the zoomed frames, so the author sees the real size too
    const stripX = PAD + labelW + row.rasters.length * (cellW + PAD);
    img.fillRect(stripX, y, cols * (w + 2), h + 2, BG_ALT);
    row.rasters.forEach((r, i) => img.blit(r, stripX + 1 + i * (w + 2), y + 1, 1));
    y += rowH;
  }
  return img;
}

/** All sprites in a folder at a glance. */
function contactSheet(entries, scale) {
  const cellW = Math.max(...entries.map((e) => e.def.size[0])) * scale;
  const cellH = Math.max(...entries.map((e) => e.def.size[1])) * scale;
  const cols = Math.min(6, Math.max(1, entries.length));
  const rows = Math.ceil(entries.length / cols);
  const width = PAD + cols * (cellW + PAD);
  const height = PAD + LABEL + 8 + rows * (cellH + LABEL + 8 + PAD);
  const img = new Image(width, height, BG);
  drawText(img, `CONTACT SHEET ${entries.length} SPRITES`, PAD, PAD, 1, TEXT);
  entries.forEach((e, i) => {
    const cx = PAD + (i % cols) * (cellW + PAD);
    const cy = PAD + LABEL + 8 + Math.floor(i / cols) * (cellH + LABEL + 8 + PAD);
    cellBackground(img, cx, cy, cellW, cellH, e.raster, scale, false, null);
    const name = e.def.name.slice(0, Math.floor(cellW / 4));
    drawText(img, name, cx + Math.max(0, (cellW - textWidth(name)) >> 1), cy + cellH + 3, 1, TEXT);
  });
  return img;
}

// -------------------------------------------------------------------- write

function write(file, buf, written) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buf);
  written.push(file);
}

async function renderOne(opts, written) {
  const def = await loadSprite(opts.path);
  const scale = opts.scale && opts.scale > 0 ? Math.round(opts.scale) : (def.scale ?? 8);
  const outDir = resolve(opts.out ?? join(ROOT, 'build', 'sprites'), def.name);
  const wanted = opts.all
    ? Object.keys(def.states)
    : [opts.state ?? def.defaultState].filter((s) => {
        if (def.states[s]) return true;
        throw new Error(`sprite "${def.name}" has no state "${s}" (have: ${Object.keys(def.states).join(', ')})`);
      });

  const rendered = [];
  for (const state of wanted) {
    const rasters = def.states[state].map((f) => rasterize(def, f));
    rendered.push([state, rasters]);
    rasters.forEach((r, i) => {
      write(join(outDir, `${state}-${i}.png`), pngOf(r), written);
    });
    write(join(outDir, `${state}@${scale}x.png`), stateSheet(def, state, rasters, scale, opts.grid).toPng(), written);
  }
  if (rendered.length > 1) {
    write(join(outDir, `${def.name}-review@${scale}x.png`), reviewSheet(def, rendered, scale, opts.grid).toPng(), written);
  }
  return def;
}

function pngOf(raster) {
  const img = new Image(raster.width, raster.height);
  img.blit(raster, 0, 0, 1);
  return img.toPng();
}

async function renderContact(opts, written) {
  const dir = resolve(opts.path);
  const files = listSpriteFiles(dir);
  const entries = [];
  for (const file of files) {
    try {
      const def = await loadSprite(file);
      const state = def.states[def.defaultState] ? def.defaultState : Object.keys(def.states)[0];
      entries.push({ def, raster: rasterize(def, def.states[state][0]) });
    } catch (err) {
      console.error(`  skipped ${relative(ROOT, file)}: ${err.message}`);
    }
  }
  if (!entries.length) throw new Error(`no sprite modules found under ${dir}`);
  const scale = opts.scale && opts.scale > 0 ? Math.round(opts.scale) : 4;
  const out = resolve(opts.out ?? join(ROOT, 'build', 'sprites'), `contact@${scale}x.png`);
  write(out, contactSheet(entries, scale).toPng(), written);
  return entries.length;
}

// --------------------------------------------------------------------- main

const HELP = `render-sprite — sprite definition -> PNG previews

  node tools/render-sprite.mjs <sprite.ts> [--state=idle] [--all] [--scale=8] [--out=dir] [--grid]
  node tools/render-sprite.mjs <folder> --contact [--scale=4] [--out=dir]
`;

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.path) {
    process.stdout.write(HELP);
    process.exit(opts.path ? 0 : 1);
  }
  const written = [];
  if (opts.contact) {
    const n = await renderContact(opts, written);
    if (!opts.quiet) console.log(`contact sheet: ${n} sprites`);
  } else {
    const def = await renderOne(opts, written);
    if (!opts.quiet) {
      console.log(`${def.name}  ${def.size[0]}x${def.size[1]}  anchor ${def.anchor.join(',')}  ${Object.keys(def.palette).length} colours`);
    }
  }
  for (const file of written) console.log(relative(process.cwd(), file).replaceAll('\\', '/'));
}

main().catch((err) => {
  console.error(`render-sprite: ${err.message}`);
  process.exitCode = 1;
});
