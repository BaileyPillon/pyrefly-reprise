#!/usr/bin/env node
/**
 * SFX parity: the project's own meter for one cue, for `sfx-parity-sprite.py`.
 *
 *   node tools/audio/sfx-parity-measure.mjs <stereo-f32le.raw> [sampleRate=44100]
 *
 * Prints `{ lufs, truePeakDb }` as JSON: the loudest 400 ms, K-weighted (BS.1770, `measure.mjs`; a cue under 400 ms
 * is measured whole), and the 4x oversampled true peak. The raw file is interleaved stereo float32.
 * Game case: both (shared plumbing).
 */
import { readFileSync } from 'node:fs';
import { measureMomentaryLufs, measureTruePeak } from './measure.mjs';

const [file, rate = '44100'] = process.argv.slice(2);
if (!file) {
  console.error('usage: node tools/audio/sfx-parity-measure.mjs <stereo-f32le.raw> [sampleRate]');
  process.exit(2);
}
const buf = readFileSync(file);
const n = Math.floor(buf.length / 8);
const left = new Float32Array(n);
const right = new Float32Array(n);
for (let i = 0; i < n; i++) {
  left[i] = buf.readFloatLE(i * 8);
  right[i] = buf.readFloatLE(i * 8 + 4);
}
console.log(JSON.stringify({ lufs: measureMomentaryLufs(left, right, Number(rate)), truePeakDb: measureTruePeak(left, right) }));
