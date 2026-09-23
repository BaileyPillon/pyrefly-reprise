#!/usr/bin/env node
/**
 * Render the NEAR and FAR balances of `boss-evrae` for the audition page, and
 * a demo that cross-fades between them the way the range flip would.
 *
 *   node tools/audio/render-range.mjs
 *
 * GAME CASE (AGENTS.md rule 14): FFX only. Evrae's airship range mechanic has
 * no FFX-2 counterpart (research/ffx-evrae-airship.md §0.4, §12.6).
 *
 * WHY THIS EXISTS. §12.6 asks for the battle cue in two states — NEAR (dry,
 * loud, percussion forward) and FAR (thinner, wider reverb, the melody at
 * distance) — cross-faded on the range flip, and says "the two range variants
 * must be auditionable back to back with the cross-fade, or the idea cannot be
 * evaluated at all". The game cannot switch yet (it needs a presenter hook on
 * the flip), so nothing here is routed: the files go to
 * `public/audio/candidates/` and are NOT listed in `public/audio/manifest.json`.
 *
 * The balances come from `rangeVariant()` and `rangeSendScale()` in
 * `src/audio/tracks/fahrenheit.ts`: the same notes as the shipped cue, so the
 * two renders line up to the sample and the cross-fade moves only the room.
 * Everything else — the sampled voices, the seating, the hall, the master, the
 * loop layout — is the shipped pipeline's (`tools/audio/render.mjs`, whose
 * resolver, spatialiser and hall this mirrors; that file runs its CLI on import,
 * so it cannot be imported here).
 */

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FFMPEG =
  process.env.PYREFLY_FFMPEG ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
const RATE = 44100;
const OUT = join(ROOT, 'public/audio/candidates');
const WORK = join(ROOT, 'build/audio-range');

const { renderTrack } = await import('../../src/audio/render.ts');
const { getTrack } = await import('../../src/audio/tracks/index.ts');
const { rangeVariant, rangeSendScale } = await import('../../src/audio/tracks/fahrenheit.ts');
const { effectiveJitterMs, performanceKey } = await import('../../src/audio/score.ts');
const { Hall } = await import('../../src/audio/dsp/hall.ts');
const presets = await import('../../src/audio/voices/presets/index.ts');
const { voiceForPreset, missingLibs } = await import('./libs.mjs');
const { masterToTarget, limit } = await import('./master.mjs');
const { measureAll } = await import('./measure.mjs');

/** Seconds of the loop head repeated after loopEnd — render.mjs LOOP_TAIL_SEC. */
const LOOP_TAIL_SEC = 3;
/** The demo's range flips, in seconds, and the fade (AudioManager's default 1.2 s). */
const FLIPS = [
  { at: 14, to: 'far' },
  { at: 26, to: 'near' },
  { at: 50, to: 'far' },
  { at: 62, to: 'near' },
];
const FADE_SEC = 1.2;
const DEMO_SEC = 75;

function resolver() {
  const cache = new Map();
  return (name, perform) => {
    const key = `${name}${performanceKey(perform)}`;
    if (cache.has(key)) return cache.get(key);
    const preset = presets.getPreset(name);
    const wanted = effectiveJitterMs(preset.timingJitterMs ?? 0, perform);
    const tuned = wanted === (preset.timingJitterMs ?? 0) ? preset : { ...preset, timingJitterMs: wanted };
    const voice = voiceForPreset(tuned, performanceKey(perform));
    cache.set(key, voice);
    return voice;
  };
}

function spatialiser(range) {
  return (channel) => {
    const preset = presets.getPreset(channel.instrument);
    const seat = presets.seatOf(preset.seat);
    const pan = Math.max(-1, Math.min(1, seat.pan * 0.78 + (channel.pan ?? 0) * 0.35));
    return { pan, reverb: presets.sendOf(seat) * rangeSendScale(channel, range) };
  };
}

const hall = (bus, rate) =>
  new Hall(rate, { rt60: 2.2, hfDamping: 2.8, preDelay: 0.019, width: 0.95, earlyLevel: 0.55, lowCutHz: 95 }).render(bus);

function renderRange(range) {
  const track = rangeVariant(getTrack('boss-evrae'), range);
  const out = renderTrack(track, RATE, {
    voiceFor: resolver(),
    spatialise: spatialiser(range),
    reverbRender: hall,
    master: (mix, rate) => masterToTarget(mix, rate, { targetLufs: -16, ceilingDbtp: -1 }),
  });
  const { loopStartSample: ls, loopEndSample: le } = out;
  const tail = Math.min(Math.round(LOOP_TAIL_SEC * RATE), le - ls);
  const left = new Float32Array(le + tail);
  const right = new Float32Array(le + tail);
  left.set(out.left.subarray(0, le));
  right.set(out.right.subarray(0, le));
  left.set(out.left.subarray(ls, ls + tail), le);
  right.set(out.right.subarray(ls, ls + tail), le);
  return { range, left, right, ls, le, measured: measureAll(left, right, RATE, ls, le) };
}

/**
 * A linear cross-fade between the two renders at each flip. Linear, not
 * equal-power: the two renders are the same notes, so they are correlated and
 * an equal-power fade would bulge by 3 dB mid-flip. Then the shipped ceiling.
 */
function crossfadeDemo(near, far) {
  const n = Math.round(DEMO_SEC * RATE);
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  const farWeight = (t) => {
    let w = 0;
    for (const flip of FLIPS) {
      const x = Math.min(1, Math.max(0, (t - flip.at) / FADE_SEC));
      if (t >= flip.at) w = flip.to === 'far' ? x : 1 - x;
    }
    return w;
  };
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const w = farWeight(t);
    const gf = w;
    const gn = 1 - w;
    const out = t > DEMO_SEC - 3 ? (DEMO_SEC - t) / 3 : 1; // a three-second fade at the end
    left[i] = (near.left[i] * gn + far.left[i] * gf) * out;
    right[i] = (near.right[i] * gn + far.right[i] * gf) * out;
  }
  limit({ left, right }, RATE, Math.pow(10, -1.4 / 20));
  return { left, right };
}

/**
 * How percussive a render is: the mean rise, in dB, of a 10 ms RMS envelope
 * from one frame to the next. Attacks push it up; a wash of hall pulls it
 * down. NEAR should read higher than FAR — the one number that says the two
 * balances differ in kind and not just in level.
 */
function attackIndex(left, right) {
  const hop = Math.round(RATE * 0.01);
  let prev = null;
  let sum = 0;
  let count = 0;
  for (let i = 0; i + hop <= left.length; i += hop) {
    let e = 0;
    for (let j = i; j < i + hop; j++) e += left[j] * left[j] + right[j] * right[j];
    const db = 10 * Math.log10(e / (2 * hop) + 1e-12);
    if (prev !== null && db > -60) {
      sum += Math.max(0, db - prev);
      count++;
    }
    prev = db;
  }
  return count ? sum / count : 0;
}

function wavF32(left, right) {
  const frames = left.length;
  const b = Buffer.alloc(44 + frames * 8);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + frames * 8, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(3, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(RATE, 24);
  b.writeUInt32LE(RATE * 8, 28);
  b.writeUInt16LE(8, 32);
  b.writeUInt16LE(32, 34);
  b.write('data', 36);
  b.writeUInt32LE(frames * 8, 40);
  for (let i = 0, at = 44; i < frames; i++, at += 8) {
    b.writeFloatLE(left[i], at);
    b.writeFloatLE(right[i], at + 4);
  }
  return b;
}

async function toMp3(name, left, right) {
  const wav = join(WORK, `${name}.wav`);
  const mp3 = join(OUT, `${name}.mp3`);
  await writeFile(wav, wavF32(left, right));
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-q:a', '5', '-ar', String(RATE), '-ac', '2', mp3]);
  await rm(wav, { force: true });
  return { file: `candidates/${name}.mp3`, bytes: (await readFile(mp3)).length };
}

async function main() {
  const missing = missingLibs();
  if (missing.length) throw new Error(`Missing sample libraries: ${missing.join(', ')} (docs/audio/CREDITS.md)`);
  await mkdir(OUT, { recursive: true });
  await mkdir(WORK, { recursive: true });
  const report = { cue: 'boss-evrae', game: 'ffx', rendered: new Date().toISOString(), flips: FLIPS, fadeSec: FADE_SEC, files: [] };
  const renders = {};
  for (const range of ['near', 'far']) {
    const started = Date.now();
    const r = renderRange(range);
    renders[range] = r;
    const file = await toMp3(`evrae-${range}`, r.left, r.right);
    const m = r.measured;
    report.files.push({
      ...file, range, seconds: r.left.length / RATE, loopStart: r.ls / RATE, loopEnd: r.le / RATE,
      lufs: m.lufs, truePeakDb: m.truePeakDb, seamOk: m.seam.ok, balanceOk: m.balance.ok,
      spectrumDb: m.spectrum.bands ?? m.spectrum, attackIndexDb: attackIndex(r.left, r.right), renderSec: (Date.now() - started) / 1000,
    });
    const ai = report.files.at(-1).attackIndexDb;
    console.log(`  ${range}: ${file.file} ${(file.bytes / 1e6).toFixed(2)} MB ${m.lufs.toFixed(1)} LUFS ${m.truePeakDb.toFixed(2)} dBTP seam ${m.seam.ok ? 'ok' : 'FAIL'} spectrum ${m.balance.ok ? 'ok' : 'FAIL'} attack index ${ai.toFixed(3)} dB`);
  }
  const demo = crossfadeDemo(renders.near, renders.far);
  const file = await toMp3('evrae-range-crossfade', demo.left, demo.right);
  report.files.push({ ...file, range: 'crossfade', seconds: DEMO_SEC });
  console.log(`  crossfade: ${file.file} ${(file.bytes / 1e6).toFixed(2)} MB`);
  await writeFile(join(ROOT, 'docs/audio/evrae-range-report.json'), JSON.stringify(report, null, 2) + '\n');
}

await main();
