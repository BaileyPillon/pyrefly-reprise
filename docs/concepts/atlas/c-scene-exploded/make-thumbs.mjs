#!/usr/bin/env node
/**
 * One-off: small previews of the real paintings for the option C mockups, so the
 * HTML stays light. Reads public/art/manifest.json and writes into ./thumbs and
 * ./thumbs/layers. Run from the repo root:
 *   node docs/concepts/atlas/c-scene-exploded/make-thumbs.mjs
 * Also prints the counts the frames quote, straight from the manifests.
 */
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const HERE = 'docs/concepts/atlas/c-scene-exploded/';
const ART = 'public/art/';
await mkdir(HERE + 'thumbs', { recursive: true });
await mkdir(HERE + 'thumbs/layers', { recursive: true });

const m = JSON.parse(await readFile(ART + 'manifest.json', 'utf8'));
const audio = JSON.parse(await readFile('public/audio/manifest.json', 'utf8'));

const subjects = [];
for (const [id, s] of Object.entries(m.subjects)) {
  const state = s.states.includes('idle') ? 'idle' : s.states[0];
  const src = `${ART}characters/${id}/${state}.png`;
  const meta = await sharp(src).metadata();
  await sharp(src).resize({ height: 112 }).webp({ quality: 80, alphaQuality: 80 }).toFile(`${HERE}thumbs/sub-${id}.webp`);
  subjects.push({ id, poses: s.states.length, w: meta.width, h: meta.height, area: meta.width * meta.height });
}
const backdrops = [];
for (const id of m.backdrops) {
  const src = `${ART}backdrops/${id}.png`;
  const meta = await sharp(src).metadata();
  await sharp(src).resize({ width: 224 }).jpeg({ quality: 80 }).toFile(`${HERE}thumbs/bd-${id}.jpg`);
  backdrops.push({ id, w: meta.width, h: meta.height });
}
const portraits = [];
for (const id of m.portraits) {
  const src = `${ART}portraits/${id}.png`;
  const meta = await sharp(src).metadata();
  await sharp(src).resize({ width: 96, height: 96, fit: 'cover', position: 'top' }).flatten({ background: '#15131f' }).jpeg({ quality: 80 }).toFile(`${HERE}thumbs/pt-${id}.jpg`);
  portraits.push({ id, w: meta.width, h: meta.height, alpha: meta.hasAlpha });
}
const pause = [];
for (const id of m.pause) {
  const src = `${ART}pause/${id}.png`;
  const meta = await sharp(src).metadata();
  await sharp(src).resize({ width: 176 }).flatten({ background: '#15131f' }).jpeg({ quality: 80 }).toFile(`${HERE}thumbs/pp-${id}.jpg`);
  pause.push({ id, w: meta.width, h: meta.height });
}

// The five poses of the selected billboard, for the detail card.
for (const p of ['idle', 'attack', 'cast', 'hurt', 'ko']) {
  await sharp(`${ART}characters/yunalesca-1/${p}.png`).resize({ height: 120 }).webp({ quality: 82 }).toFile(`${HERE}thumbs/pose-yunalesca-1-${p}.webp`);
}

// Working-size layers for the specimen (chapter 2, Zanarkand Dome).
await sharp(`${ART}backdrops/zanarkand-dome.png`).resize({ width: 1600 }).jpeg({ quality: 86 }).toFile(`${HERE}thumbs/layers/backdrop.jpg`);
for (const [id, pose] of [['yunalesca-1', 'hurt'], ['tidus', 'attack'], ['yuna', 'idle'], ['auron', 'idle']]) {
  await sharp(`${ART}characters/${id}/${pose}.png`).resize({ height: 720 }).webp({ quality: 88, alphaQuality: 90 }).toFile(`${HERE}thumbs/layers/${id}-${pose}.webp`);
}
for (const id of ['tidus', 'yuna', 'auron']) {
  await sharp(`${ART}portraits/${id}.png`).resize({ width: 160, height: 160, fit: 'cover', position: 'top' }).flatten({ background: '#15131f' }).jpeg({ quality: 84 }).toFile(`${HERE}thumbs/layers/face-${id}.jpg`);
}

const poses = subjects.reduce((n, s) => n + s.poses, 0);
const sfx = Object.keys(audio.sfx.cues).length;
const music = Object.keys(audio.music).length;
const counts = {
  subjects: subjects.length, poses, backdrops: backdrops.length, portraits: portraits.length, pausePlates: pause.length,
  paintings: poses + backdrops.length + portraits.length + pause.length,
  musicCues: music, sfxCues: sfx, audioCues: music + sfx,
  sfxByCategory: Object.values(audio.sfx.cues).reduce((a, c) => ((a[c.category] = (a[c.category] ?? 0) + 1), a), {}),
};
await writeFile(HERE + 'thumbs/index.json', JSON.stringify({ counts, subjects, backdrops, portraits, pause, music: Object.keys(audio.music) }, null, 1));
console.log(counts);
console.log('backdrops', backdrops.map(b => `${b.id} ${b.w}x${b.h}`).join(', '));
console.log('portrait sizes', [...new Set(portraits.map(p => `${p.w}x${p.h}${p.alpha ? 'a' : ''}`))]);
console.log('pause sizes', [...new Set(pause.map(p => `${p.w}x${p.h}`))]);
