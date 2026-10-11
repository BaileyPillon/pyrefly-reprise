#!/usr/bin/env node
/**
 * The THEMES.md stereo gate, measured on the MP3 a player decodes (driver item 53e, 2026-10-11).
 *
 *   node tools/audio/stereo-gate.mjs [--json=PATH] <cue | file.mp3> ...
 *
 * The gate (THEMES.md "Since 2026-10-07 (ElevenLabs)", `GATES` in remaster-score.mjs) has three measures over the whole decoded file:
 *   L/R correlation        0.60 to 0.85
 *   side-to-mid            -10 to -6 dB   (S = (L-R)/2, M = (L+R)/2, 10 log10 of mean S^2 over mean M^2)
 *   mono-sum loss          no worse than -1 dB   (10 log10 of mean M^2 over the mean channel power)
 * The formulas are the ones the round-24 auditor used on `boss-bahamut` (0.408, -3.72, -1.54: reproduced to the digit on 2026-10-11) and
 * that `tools/audio/remaster-measure.py` and `quality-measure.py` use (they differ in the fourth decimal only: a mean-removed Pearson here,
 * the plain sum of products there). A bare name is `public/audio/music/<name>.mp3`.
 *
 * Game case: both (shared measuring code; which cue is which game's is the record's business).
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const FFMPEG = process.env.FFMPEG_PATH ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
export const SAMPLE_RATE = 44100;

/** The three windows of the gate. */
export const STEREO_GATE = { corr: [0.6, 0.85], sideMid: [-10, -6], monoLossMin: -1 };

/** Decode any file ffmpeg reads to two Float32Array channels at 44.1 kHz, as a browser does (no normalisation, no dither). */
export function decodeStereo(file, ffmpeg = FFMPEG) {
  const buf = execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SAMPLE_RATE), '-'], { maxBuffer: 1 << 30 });
  const all = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
  const frames = all.length / 2;
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    left[i] = all[2 * i];
    right[i] = all[2 * i + 1];
  }
  return { left, right };
}

/** { corr, sideMid, monoLoss } of a stereo pair, unrounded. */
export function measureStereo(left, right) {
  const n = left.length;
  let sl = 0;
  let sr = 0;
  let sll = 0;
  let srr = 0;
  let slr = 0;
  let sm = 0;
  let ss = 0;
  for (let i = 0; i < n; i++) {
    const l = left[i];
    const r = right[i];
    sl += l;
    sr += r;
    sll += l * l;
    srr += r * r;
    slr += l * r;
    const m = (l + r) / 2;
    const s = (l - r) / 2;
    sm += m * m;
    ss += s * s;
  }
  const ml = sl / n;
  const mr = sr / n;
  const cov = slr / n - ml * mr;
  const vl = sll / n - ml * ml;
  const vr = srr / n - mr * mr;
  return {
    corr: cov / Math.sqrt(vl * vr),
    sideMid: 10 * Math.log10(ss / sm),
    monoLoss: 10 * Math.log10(sm / n / ((sll + srr) / 2 / n)),
  };
}

const within = (x, [low, high]) => x >= low && x <= high;

/** { ok: { corr, sideMid, monoLoss }, pass }: which of the three measures pass, and whether all do. */
export function judgeStereo(m, gate = STEREO_GATE) {
  const corr = within(m.corr, gate.corr);
  const sideMid = within(m.sideMid, gate.sideMid);
  const monoLoss = m.monoLoss >= gate.monoLossMin;
  return { ok: { corr, sideMid, monoLoss }, pass: corr && sideMid && monoLoss };
}

export function measureFile(file, ffmpeg = FFMPEG) {
  const { left, right } = decodeStereo(file, ffmpeg);
  const m = measureStereo(left, right);
  return { ...m, ...judgeStereo(m), samples: left.length };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const jsonPath = args.find((a) => a.startsWith('--json='))?.slice(7);
  const names = args.filter((a) => !a.startsWith('--'));
  if (!names.length) {
    console.log('usage: node tools/audio/stereo-gate.mjs [--json=PATH] <cue | file.mp3> ...');
    process.exit(1);
  }
  const rows = {};
  for (const name of names) {
    const file = /[\\/]|\.(mp3|wav|flac)$/i.test(name) ? name : join(ROOT, 'public/audio/music', `${name}.mp3`);
    const r = measureFile(file);
    rows[name] = r;
    console.log(`${name.padEnd(28)} corr ${r.corr.toFixed(3)}  side/mid ${r.sideMid.toFixed(2)}  mono loss ${r.monoLoss.toFixed(2)}  ${r.pass ? 'PASS' : 'FAIL'}`);
  }
  if (jsonPath) writeFileSync(jsonPath, `${JSON.stringify(rows, null, 2)}\n`);
  if (Object.values(rows).some((r) => !r.pass)) process.exitCode = 2;
}
