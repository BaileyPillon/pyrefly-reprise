#!/usr/bin/env node
/**
 * Site C's thumbnail generator. The inventory at `explode` 1 lays out every
 * shipped piece — a hundred and more tiles — and the real paintings are
 * 832x1216 to 2688x1536 PNGs, far too heavy to put a hundred of on one page.
 * This writes a ~160px WebP of each one into `./thumbs/`, which `thumbs.ts`
 * picks up with `import.meta.glob` so they bundle with the page.
 *
 * It also writes `./thumbs/index.json`: each thumbnail's **measured** source
 * dimensions, read from the PNG itself by sharp. Nothing here is typed by
 * hand (AGENTS.md hard rule 6) — a card that says "painted at 832 x 1216"
 * says it because this file measured it.
 *
 * `public/art/` is gitignored and local-only, so this is run once, on a
 * machine that has the art, and the small WebPs are what travel. Run from the
 * repo root:
 *   node learn/exploded/make-thumbs.mjs
 */
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const ART = 'public/art/';
const OUT = 'learn/exploded/thumbs/';

await mkdir(OUT, { recursive: true });

const manifest = JSON.parse(await readFile(ART + 'manifest.json', 'utf8'));

/** Every thumbnail's measured source size, keyed by the same id `thumbs.ts` looks a URL up with. */
const sizes = {};

async function shrink(key, src, options) {
  const meta = await sharp(src).metadata();
  await sharp(src)
    .resize(options)
    .webp({ quality: 80, alphaQuality: 80 })
    .toFile(`${OUT}${key}.webp`);
  sizes[key] = { w: meta.width, h: meta.height, src: src.slice(ART.length) };
}

// Painted cutouts: the subject's idle pose, or its first state when it has no idle.
for (const [id, subject] of Object.entries(manifest.subjects)) {
  const state = subject.states.includes('idle') ? 'idle' : subject.states[0];
  await shrink(`sub-${id}`, `${ART}characters/${id}/${state}.png`, { height: 160 });
}

// Wide matte paintings and pause plates: width-limited, they are 16:9-ish.
for (const id of manifest.backdrops) {
  await shrink(`bd-${id}`, `${ART}backdrops/${id}.png`, { width: 240 });
}
for (const id of manifest.pause) {
  await shrink(`pp-${id}`, `${ART}pause/${id}.png`, { width: 240 });
}

// Head-and-shoulders crops, square like the HUD's own CTB tiles.
for (const id of manifest.portraits) {
  await shrink(`pt-${id}`, `${ART}portraits/${id}.png`, { width: 160, height: 160, fit: 'cover', position: 'top' });
}

// The five painted poses of the frame's own boss, for the detail card's pose strip.
const BOSS = 'yunalesca-1';
for (const state of manifest.subjects[BOSS]?.states ?? []) {
  await shrink(`pose-${BOSS}-${state}`, `${ART}characters/${BOSS}/${state}.png`, { height: 160 });
}

await writeFile(`${OUT}index.json`, `${JSON.stringify({ generatedBy: 'learn/exploded/make-thumbs.mjs', sizes }, null, 1)}\n`);
console.log(`wrote ${Object.keys(sizes).length} thumbnails to ${OUT}`);
