#!/usr/bin/env node
/**
 * Render the NEW-CHAPTER MUSIC SKETCHES for Bailey's ear.
 *
 *   node tools/audio/scores/render-sketches.mjs
 *   node tools/audio/scores/render-sketches.mjs --only=leblanc-farce
 *
 * These are SKETCHES, not cues. Nothing here is registered in
 * `src/audio/tracks/index.ts`, nothing lands in `public/audio/`, and nothing is
 * routed into the game: hard rule 9 says a thing Bailey will hear needs an
 * approved target first, and hard rule 13 says only Bailey can judge it. The
 * output is `docs/audio/sketches/<date>/*.mp3` plus a row in
 * `docs/audio/audition.html`.
 *
 * It deliberately reuses the shipped pipeline rather than a toy one, because a
 * sketch rendered through different instruments or a different room answers a
 * different question than the one Bailey is being asked. Same preset resolver,
 * same seating, same hall, same master chain and the same measurements as
 * `tools/audio/render.mjs`.
 *
 * Game case (AGENTS.md rule 14): this tool is BOTH — it is shared plumbing for
 * sketching, and it plays whatever score file it is handed. The individual
 * scores carry their own case in their headers.
 */

import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');

const FFMPEG =
  process.env.PYREFLY_FFMPEG ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';

const { renderTrack } = await import('../../../src/audio/render.ts');
const { effectiveJitterMs, performanceKey } = await import('../../../src/audio/score.ts');
const { Hall } = await import('../../../src/audio/dsp/hall.ts');
const presets = await import('../../../src/audio/voices/presets/index.ts');
const { voiceForPreset } = await import('../libs.mjs');
const { masterToTarget } = await import('../master.mjs');
const { measureLufs, measureTruePeak, measureSpectrum, checkSpectralBalance } =
  await import('../measure.mjs');

/** The sketch set, in the order Bailey should hear them. */
const SKETCHES = [
  'macalania-a-court-dance',
  'macalania-b-processional',
  'evrae-battle',
  'evrae-approach',
  'leblanc-farce',
  'leblanc-disquiet',
];

const DATE = '2026-09-21';
const SAMPLE_RATE = 44100;

const flags = new Map();
for (const arg of process.argv.slice(2)) {
  if (!arg.startsWith('--')) continue;
  const [k, v] = arg.slice(2).split('=');
  flags.set(k, v ?? 'true');
}
const only = flags.get('only')?.split(',').map((s) => s.trim());

// --------------------------------------------------------------- pipeline

function buildVoiceResolver() {
  const cache = new Map();
  return (name, perform) => {
    const variant = performanceKey(perform);
    const key = `${name}${variant}`;
    const hit = cache.get(key);
    if (hit) return hit;
    if (!presets.hasPreset(name)) {
      throw new Error(`Sketch names instrument "${name}", which has no sampled preset.`);
    }
    const preset = presets.getPreset(name);
    const presetJitter = preset.timingJitterMs ?? 0;
    const wanted = effectiveJitterMs(presetJitter, perform);
    const tuned = wanted === presetJitter ? preset : { ...preset, timingJitterMs: wanted };
    const voice = voiceForPreset(tuned, variant);
    cache.set(key, voice);
    return voice;
  };
}

function buildSpatialiser() {
  return (channel) => {
    if (!presets.hasPreset(channel.instrument)) return undefined;
    const preset = presets.getPreset(channel.instrument);
    const seat = presets.seatOf(preset.seat);
    const composed = channel.pan ?? 0;
    return {
      pan: Math.max(-1, Math.min(1, seat.pan * 0.78 + composed * 0.35)),
      reverb: presets.sendOf(seat),
    };
  };
}

/** The same one room as every shipped cue. */
function hallFor() {
  return (bus, rate) =>
    new Hall(rate, {
      rt60: 2.2,
      hfDamping: 2.8,
      preDelay: 0.019,
      width: 0.95,
      earlyLevel: 0.55,
      lowCutHz: 95,
    }).render(bus);
}

function encodeWavF32(left, right, rate) {
  const frames = Math.min(left.length, right.length);
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
    buffer.writeFloatLE(left[i] ?? 0, at);
    buffer.writeFloatLE(right[i] ?? 0, at + 4);
    at += 8;
  }
  return buffer;
}

// ------------------------------------------------------------------ main

const resolver = buildVoiceResolver();
const spatialiser = buildSpatialiser();
const outDir = resolve(ROOT, 'docs/audio/sketches', DATE);
await mkdir(outDir, { recursive: true });

const rows = [];
for (const id of SKETCHES) {
  if (only && !only.includes(id)) continue;
  const mod = await import(`./${DATE}/${id}.mjs`);
  const track = mod.default ?? mod.track;
  const started = Date.now();

  let master = null;
  const rendered = renderTrack(track, SAMPLE_RATE, {
    voiceFor: resolver,
    spatialise: spatialiser,
    reverbRender: hallFor(),
    master: (mix, rate) => {
      master = masterToTarget(mix, rate, { targetLufs: -16, ceilingDbtp: -1 });
    },
  });

  const { left, right } = rendered;
  const lufs = measureLufs(left, right, SAMPLE_RATE);
  const truePeak = measureTruePeak(left, right);
  const spectrum = measureSpectrum(left, right, SAMPLE_RATE);
  const balance = checkSpectralBalance(spectrum);
  const seconds = left.length / SAMPLE_RATE;

  const wavPath = join(outDir, `${id}.wav`);
  const mp3Path = join(outDir, `${id}.mp3`);
  await writeFile(wavPath, encodeWavF32(left, right, SAMPLE_RATE));
  await run(FFMPEG, [
    '-y', '-loglevel', 'error',
    '-i', wavPath,
    '-codec:a', 'libmp3lame', '-q:a', '5',
    '-ar', String(SAMPLE_RATE), '-ac', '2',
    mp3Path,
  ]);
  const bytes = (await readFile(mp3Path)).length;
  await rm(wavPath, { force: true });

  rows.push({
    id,
    name: track.name,
    seconds: Number(seconds.toFixed(2)),
    bytes,
    notes: rendered.noteCount,
    lufs: Number(lufs.toFixed(2)),
    truePeakDb: Number(truePeak.toFixed(2)),
    tiltDbPerBand: Number(balance.tilt.toFixed(2)),
    tiltPasses: balance.ok,
    masterReport: master ? { lufs: Number(master.lufs.toFixed(2)), truePeakDb: Number(master.truePeakDb.toFixed(2)) } : null,
    renderMs: Date.now() - started,
  });
  console.log(
    `${id.padEnd(26)} ${seconds.toFixed(1).padStart(5)}s  ` +
      `${(bytes / 1024).toFixed(0).padStart(4)} KB  ` +
      `${lufs.toFixed(2).padStart(7)} LUFS  ` +
      `${truePeak.toFixed(2).padStart(6)} dBTP  ` +
      `tilt ${balance.tilt.toFixed(1)} ${balance.ok ? 'pass' : 'FAIL'}  ` +
      `${rendered.noteCount} notes  ${Date.now() - started} ms`,
  );
}

await writeFile(join(outDir, 'measurements.json'), `${JSON.stringify(rows, null, 2)}\n`);
console.log(`\nWrote ${rows.length} sketch(es) to docs/audio/sketches/${DATE}/`);
