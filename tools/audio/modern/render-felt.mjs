#!/usr/bin/env node
/**
 * The felt-piano audition: the piano parts of `title` (FAREWELL, solo piano —
 * the quiet end of the score), played twice by the SAME performance through
 * the same hall: once on the shipped concert `piano` voice, once on
 * `felt-piano`. Only the instrument differs, so the pair isolates it.
 *
 *   node tools/audio/modern/render-felt.mjs
 *
 * Writes public/audio/candidates/A-felt-piano-title-excerpt.ogg and
 * A-concert-piano-title-excerpt.ogg (12 s each, loudness-matched), and adds a
 * `feltPiano` block to docs/audio/sketch-a-report.json.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const { getTrack } = await import('../../../src/audio/tracks/index.ts');
const { tempoCurveOf } = await import('../../../src/audio/tempo.ts');
const { Hall } = await import('../../../src/audio/dsp/hall.ts');
const { panGains } = await import('../../../src/audio/dsp/shaper.ts');
const { midiToFreq } = await import('../../../src/audio/score.ts');
const { hashSeed } = await import('../../../src/audio/dsp/oscillators.ts');
const presets = await import('../../../src/audio/voices/presets/index.ts');
const { voiceForPreset } = await import('../libs.mjs');
const { measureLufs } = await import('../measure.mjs');
const { performChannel, performanceStats } = await import('./perform.mjs');
const { synthHallIr, matchEnergy, hallEnergy, convolutionHall } = await import('./hall-ir.mjs');
const { makeFeltPiano, salamanderLayerReport } = await import('./felt-piano.mjs');
const { toOgg, measureDynamics } = await import('./loudness.mjs');

const RATE = 44100;
const CUE = 'title';
const OUT = join(ROOT, 'public/audio/candidates');
const WAVS = join(ROOT, 'build/audio-candidates');
const EXCERPT_SEC = 12;
const TARGET_LUFS = -20; // a quiet cue sits under the -16 battle reference (plan A3.7)

function wavF32(left, right) {
  const b = Buffer.alloc(44 + left.length * 8);
  b.write('RIFF', 0); b.writeUInt32LE(36 + left.length * 8, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(3, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(RATE, 24);
  b.writeUInt32LE(RATE * 8, 28); b.writeUInt16LE(8, 32); b.writeUInt16LE(32, 34); b.write('data', 36);
  b.writeUInt32LE(left.length * 8, 40);
  for (let i = 0, at = 44; i < left.length; i++, at += 8) { b.writeFloatLE(left[i], at); b.writeFloatLE(right[i], at + 4); }
  return b;
}

const track = getTrack(CUE);
const tempo = tempoCurveOf(track);
const pianoChannels = track.channels.map((c, ci) => ({ c, ci })).filter(({ c }) => c.instrument === 'piano');
const firstBeat = Math.min(...pianoChannels.flatMap(({ c }) => c.notes.map((n) => n[0])));
const start = tempo.secondsAt(firstBeat);
const end = start + EXCERPT_SEC + 4;
const total = Math.ceil(end * RATE);
const ir = synthHallIr(RATE);
matchEnergy(ir, hallEnergy(Hall, RATE, { rt60: 2.2, hfDamping: 2.8, preDelay: 0.019, width: 0.95, earlyLevel: 0.55, lowCutHz: 95 }));

const concert = voiceForPreset({ ...presets.getPreset('piano'), timingJitterMs: 0 }, 'modern');
const felt = makeFeltPiano();
const seat = presets.seatOf('piano');
const send = presets.sendOf(seat);
const perf = pianoChannels.map(({ c, ci }) => ({ c, ci, notes: performChannel(track, tempo, c, { role: 'piano', seed: `${CUE}|${ci}|piano` }).notes }));

const results = {};
for (const [label, voice] of [['felt', felt], ['concert', concert]]) {
  const dry = { left: new Float32Array(total), right: new Float32Array(total) };
  const verb = { left: new Float32Array(total), right: new Float32Array(total) };
  for (const { c, ci, notes } of perf) {
    const pg = panGains(Math.max(-1, Math.min(1, seat.pan * 0.78 + (c.pan ?? 0) * 0.35)));
    const vol = c.volume ?? 1;
    for (const n of notes) {
      if (n.on > end) continue;
      const buf = voice({ sampleRate: RATE, freq: midiToFreq(n.midi), dur: n.off - n.on, velocity: n.vel, seed: hashSeed(`A|${CUE}|${ci}|${n.index}|${n.beat}`) });
      const at = Math.round(n.on * RATE);
      for (let i = 0; i < buf.left.length && at + i < total; i++) {
        dry.left[at + i] += buf.left[i] * vol * pg.left;
        dry.right[at + i] += buf.right[i] * vol * pg.right;
        verb.left[at + i] += buf.left[i] * vol * pg.left * send;
        verb.right[at + i] += buf.right[i] * vol * pg.right * send;
      }
    }
  }
  const wet = convolutionHall(verb, RATE, ir);
  const s0 = Math.round(start * RATE);
  const n = Math.round(EXCERPT_SEC * RATE);
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    left[i] = dry.left[s0 + i] + wet.left[s0 + i];
    right[i] = dry.right[s0 + i] + wet.right[s0 + i];
  }
  const g = Math.pow(10, (TARGET_LUFS - measureLufs(left, right, RATE)) / 20);
  for (let i = 0; i < n; i++) { left[i] *= g; right[i] *= g; }
  mkdirSync(WAVS, { recursive: true });
  const wav = join(WAVS, `A-${label}-piano-title-excerpt.wav`);
  writeFileSync(wav, wavF32(left, right));
  const ogg = join(OUT, `A-${label}-piano-title-excerpt.ogg`);
  await toOgg(wav, ogg, { duration: EXCERPT_SEC, fadeSec: 0.3 });
  // Brightness: share of energy above 2 kHz, a felt piano's defining number.
  let hi = 0, all = 0, lp = 0;
  const a = Math.exp((-2 * Math.PI * 2000) / RATE);
  for (let i = 0; i < n; i++) { lp = (1 - a) * left[i] + a * lp; hi += (left[i] - lp) ** 2; all += left[i] ** 2; }
  results[label] = { file: `public/audio/candidates/A-${label}-piano-title-excerpt.ogg`, above2kHzDb: Number((10 * Math.log10(hi / all)).toFixed(2)), dynamics: await measureDynamics(ogg) };
}

const reportPath = join(ROOT, 'docs/audio/sketch-a-report.json');
const report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : {};
report.feltPiano = {
  cue: CUE,
  excerptStartSec: Number(start.toFixed(3)),
  seconds: EXCERPT_SEC,
  loudnessMatchedLufs: TARGET_LUFS,
  salamander: [48, 60, 72].map((k) => salamanderLayerReport(k)),
  performance: perf.map(({ c, notes }) => ({ channel: c.name, ...performanceStats(notes) })),
  results,
};
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.feltPiano, null, 2));
