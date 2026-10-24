#!/usr/bin/env node
/**
 * THE PRESS PAGE'S PICTURES (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b: the press page leads with the game; both games). Turns real captures of the build into the web-size JPEGs that
 * `public/press/index.html` shows: resized to 1600 px wide, JPEG at the highest quality that keeps each file under 300 KB (the page's limit; a visitor on a phone downloads these), written to `public/press/frames/`.
 *
 * Re-run it after the build is locked (the frames in the repo are stand-ins from the playtest build r63-play; the HUD and the camera may change in the Saturday pass):
 *   node tools/press-frames.mjs                      (reads tools/press-frames.json, writes public/press/frames/*.jpg and public/press/frames/frames.json)
 *   node tools/press-frames.mjs --config <file> --out <dir>
 *
 * The config is a list of { name, src, clean?, art? }: `src` is an absolute path to a 2560 x 1440 capture (a PNG or JPEG of our own build) or, with `art`, a path under `public/art/`. `clean: "switchboard"` takes the playtest
 * switchboard's corner label (the small key list at the top right that `?switchboard=1` draws over every playtest capture) out of the picture by taking the median of the picture over it: only for frames whose
 * top right is smooth dark ground (a capture of the label over a face or a bright light must be taken again without the label, not cleaned). Nothing else in the picture is touched.
 *
 * Game case: both (the frame set names which game each frame is from; Seymour Flux is FFX, Bahamut is FFX-2).
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 ? process.argv[at + 1] : fallback;
};
const configPath = resolve(arg('config', join(root, 'tools', 'press-frames.json')));
const outDir = resolve(arg('out', join(root, 'public', 'press', 'frames')));
export const MAX_BYTES = 300 * 1024;
export const WIDTH = 1600;

/**
 * The switchboard label's box, in a 2560 x 1440 capture: x 1770 to the right edge, y 6 to 110. The label is thin faint text, so inside the box (and a feathered margin around it) the picture is replaced by its own
 * 21 x 21 median, which keeps wings, light and edges that run through the box and drops the strokes of the text; the margin blends back to the original so no box edge shows. Only for frames whose top right is smooth.
 */
export async function cleanSwitchboard(buf, width, height) {
  const k = width / 2560;
  const x0 = Math.round(1770 * k);
  const y0 = Math.max(0, Math.round(6 * k));
  const y1 = Math.round(110 * k);
  const m = Math.round(28 * k);
  const left = x0 - m;
  const top = Math.max(0, y0 - m);
  const bottom = Math.min(height - 1, y1 + m);
  const region = { left, top, width: width - left, height: bottom - top + 1 };
  const med = await sharp(buf, { raw: { width, height, channels: 3 } }).extract(region).median(21).raw().toBuffer();
  const out = Buffer.from(buf);
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = top; y <= bottom; y++) {
    const dy = y < y0 ? (y0 - y) / m : y > y1 ? (y - y1) / m : 0;
    for (let x = left; x < width; x++) {
      const dx = x < x0 ? (x0 - x) / m : 0;
      const w = smooth(Math.max(0, 1 - Math.hypot(dx, dy)));
      if (w <= 0) continue;
      const o = (y * width + x) * 3;
      const r = ((y - top) * region.width + (x - left)) * 3;
      for (let c = 0; c < 3; c++) out[o + c] = Math.round(buf[o + c] * (1 - w) + med[r + c] * w);
    }
  }
  return out;
}

/** The highest JPEG quality (from 86 down) that keeps `image` under {@link MAX_BYTES}. */
async function encode(image) {
  for (let q = 86; q >= 52; q -= 2) {
    const buf = await image.clone().jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
    if (buf.length <= MAX_BYTES) return { buf, q };
  }
  throw new Error('a frame does not fit under 300 KB even at quality 52');
}

async function main() {
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  mkdirSync(outDir, { recursive: true });
  const manifest = [];
  for (const f of config) {
    const src = f.art ? join(root, 'public', 'art', f.art) : f.src;
    statSync(src);
    let input = sharp(src).removeAlpha();
    if (f.clean === 'switchboard') {
      const { data, info } = await input.raw().toBuffer({ resolveWithObject: true });
      input = sharp(await cleanSwitchboard(data, info.width, info.height), { raw: { width: info.width, height: info.height, channels: 3 } });
    }
    const { buf, q } = await encode(input.resize({ width: WIDTH, withoutEnlargement: true }));
    const meta = await sharp(buf).metadata();
    writeFileSync(join(outDir, `${f.name}.jpg`), buf);
    manifest.push({ name: f.name, file: `${f.name}.jpg`, width: meta.width, height: meta.height, bytes: buf.length, quality: q, game: f.game ?? null, caption: f.caption ?? null, from: f.note ?? null });
    console.log(`${f.name}.jpg  ${meta.width}x${meta.height}  q${q}  ${(buf.length / 1024).toFixed(0)} KB`);
  }
  writeFileSync(join(outDir, 'frames.json'), JSON.stringify(manifest, null, 2) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
