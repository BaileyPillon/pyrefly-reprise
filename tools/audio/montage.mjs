#!/usr/bin/env node
/**
 * Build `docs/audio/sfx-montage.mp3` — twelve effects in one short listen.
 *
 * The audition page has always linked a montage, but nothing built it: it was
 * a file somebody made once, by hand, and then the sprite was re-rendered
 * underneath it. A demo that does not come from the shipped sprite is a demo
 * of audio that may no longer exist, which is the same class of bug as a
 * manifest that disagrees with its files.
 *
 * So this cuts the montage out of `public/audio/sfx/sprite.mp3` using the
 * manifest's own offsets. It is therefore always exactly what the game fires.
 *
 * The twelve are chosen to walk the catalogue in SOUND-DESIGN.md's own order —
 * interface, then steel, then magic, then the two loud ones, then the room
 * tone — so a listener hears the palette rather than a shuffle: glass, steel,
 * choir, sub.
 *
 *   node tools/audio/montage.mjs [--out=PATH] [--gap=SECONDS]
 */

import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FFMPEG =
  process.env.FFMPEG_PATH ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
const SAMPLE_RATE = 44100;

const args = process.argv.slice(2);
const outPath = args.find((a) => a.startsWith('--out='))?.slice(6)
  ?? path.join(ROOT, 'docs/audio/sfx-montage.mp3');
/**
 * Air between effects.
 *
 * Long enough that each tail decays into the hall instead of being stepped on
 * by the next attack — "tails bloom into the hall" is one of the five hard
 * rules, and a montage that crops them demonstrates the opposite of the thing
 * it is meant to demonstrate.
 */
const gap = Number(args.find((a) => a.startsWith('--gap='))?.slice(6) ?? 1.15);

/** The twelve, and what each one is in the montage to prove. */
const PROGRAMME = [
  ['cursor-move', 'glass, struck softly — the quietest thing in the game'],
  ['confirm', 'two attacks 50 ms apart, the second quieter'],
  ['menu-open', 'harp harmonics, with a breath underneath'],
  ['sword-slash-1', 'cloth moves 40 ms before the steel'],
  ['sword-slash-2', 'the same gesture, not the same sample'],
  ['guard', 'weight without brightness'],
  ['critical', 'the one place a transient is allowed to be sharp'],
  ['cure', 'choir "oo" blooming from the b6 to the tonic'],
  ['thunder', 'air, then sub, then the room'],
  ['overdrive-full', 'orchestral stab over B1 — the one place loud is allowed'],
  ['summon', 'the longest tail in the bank'],
  ['fayth-hum', 'room tone: what the hall sounds like with almost nothing in it'],
];

async function decode(file) {
  const { stdout } = await execFileAsync(
    FFMPEG,
    ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SAMPLE_RATE), '-'],
    { maxBuffer: 1 << 30, encoding: 'buffer' },
  );
  const frames = Math.floor(stdout.length / 8);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    left[i] = stdout.readFloatLE(i * 8);
    right[i] = stdout.readFloatLE(i * 8 + 4);
  }
  return { left, right };
}

/** 32-bit float WAV, so ffmpeg is the only thing that ever quantises. */
function encodeWavF32(left, right, rate) {
  const frames = left.length;
  const dataBytes = frames * 8;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(3, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 8, 28);
  buffer.writeUInt16LE(8, 32);
  buffer.writeUInt16LE(32, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);
  let at = 44;
  for (let i = 0; i < frames; i++) {
    buffer.writeFloatLE(left[i], at);
    buffer.writeFloatLE(right[i], at + 4);
    at += 8;
  }
  return buffer;
}

const manifest = JSON.parse(await readFile(path.join(ROOT, 'public/audio/manifest.json'), 'utf8'));
const sprite = await decode(path.join(ROOT, 'public/audio', manifest.sfx.file));
const cues = manifest.sfx.cues ?? manifest.sfx;

const gapFrames = Math.round(gap * SAMPLE_RATE);
const slices = [];
for (const [name, why] of PROGRAMME) {
  const cue = cues[name];
  if (!cue || typeof cue !== 'object') throw new Error(`sprite has no cue "${name}"`);
  const from = Math.round(cue.offset * SAMPLE_RATE);
  // Take the cue's whole declared duration. Trimming to "where it gets quiet"
  // would cut exactly the decay the montage exists to show.
  const to = Math.min(from + Math.round(cue.duration * SAMPLE_RATE), sprite.left.length);
  slices.push({ name, why, from, to, seconds: (to - from) / SAMPLE_RATE });
}

const total = slices.reduce((a, s) => a + (s.to - s.from), 0) + gapFrames * (slices.length - 1);
const left = new Float32Array(total);
const right = new Float32Array(total);
let at = 0;
for (const [i, s] of slices.entries()) {
  for (let j = s.from; j < s.to; j++) {
    left[at] = sprite.left[j];
    right[at] = sprite.right[j];
    at++;
  }
  if (i < slices.length - 1) at += gapFrames;
}

const tmpWav = path.join(path.dirname(outPath), '.montage-tmp.wav');
await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(tmpWav, encodeWavF32(left, right, SAMPLE_RATE));
await execFileAsync(FFMPEG, [
  '-y', '-loglevel', 'error',
  '-i', tmpWav,
  '-codec:a', 'libmp3lame', '-q:a', '5',
  '-ar', String(SAMPLE_RATE), '-ac', '2',
  outPath,
]);
await rm(tmpWav, { force: true });

const bytes = (await readFile(outPath)).length;
let peak = 0;
for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
for (const s of slices) console.log(`  ${s.name.padEnd(16)} ${s.seconds.toFixed(2)}s  ${s.why}`);
console.log(
  `\nsfx-montage: ${slices.length} effects, ${(total / SAMPLE_RATE).toFixed(1)}s, ` +
    `${(bytes / 1e6).toFixed(2)} MB, peak ${(20 * Math.log10(peak)).toFixed(2)} dBFS`,
);
console.log(`wrote ${path.relative(ROOT, outPath)}`);
