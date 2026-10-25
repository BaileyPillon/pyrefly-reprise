/**
 * Voice over music in the speech band, measured as a true band level (conference demo sound pass, 2026-10-22; decision 184; the method of the review of branch audio-pass, minor 5).
 *
 *   node tools/audio/pass-speech-band.mjs <run.json> [--ducks=-3.5,-9,-12.5] [--chapter=seymour-flux]
 *
 * `<run.json>` is the trace of a real-time recording of a fight (`measure/tools/run-trace.mjs` in the pass's scratch folder: its `events` carry the music cue that was playing and, for every voice line,
 * the time it finished). For every voice line the fight played, this takes the line's own file (`public/audio/voice/` or `voice-pass/`), finds the music cue and the track position it landed on (the loop wraps
 * at the manifest's loop points), and prints the speech-band (300 to 3400 Hz) MEAN-SQUARE level of the voice and of that slice of music, and the margin of voice over music at each duck depth, both through the
 * game's own paths (voice bus 0.9 and master 0.8; music bus 0.7 and master 0.8).
 *
 * The level is Parseval's: the energy of the whole zero-padded line in the band, divided by its length. The pass's first figures divided a Hann-windowed 8192-point FFT's band power by N squared, which depends on
 * N and rewards a tonal voice over noise-like music by about 6 dB (the quoted worst case of +8.4 dB at -9 dB was +2.6 dB measured this way). Agents cannot hear (AGENTS.md rule 13): this is a number, not a verdict.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FFMPEG } from './pass-dsp.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pub = path.join(root, 'public/audio');
const args = process.argv.slice(2);
const runFile = args.find((a) => !a.startsWith('--'));
if (!runFile) throw new Error('usage: pass-speech-band.mjs <run.json> [--ducks=-3.5,-9,-12.5] [--chapter=seymour-flux]');
const opt = (name, fallback) => (args.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).split('=')[1];
const DUCKS = opt('ducks', '-3.5,-9,-12.5').split(',').map(Number);
const CHAPTER = opt('chapter', 'seymour-flux');
const RATE = 48000;

function decode(file, ss, t) {
  const a = ['-v', 'error'];
  if (ss !== undefined) a.push('-ss', String(ss), '-t', String(t));
  a.push('-i', file, '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-');
  const r = spawnSync(FFMPEG, a, { maxBuffer: 1 << 29 });
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.byteLength / 4));
}

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = i + k + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

/** Mean-square level of the 300 to 3400 Hz band of `x`, dB (Parseval on the zero-padded whole slice: no window, no dependence on the FFT size). */
export function bandMsDb(x, lo = 300, hi = 3400) {
  let N = 1;
  while (N < x.length) N <<= 1;
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let i = 0; i < x.length; i++) re[i] = x[i];
  fft(re, im);
  let e = 0;
  for (let k = 1; k < N / 2; k++) {
    const f = (k * RATE) / N;
    if (f >= lo && f < hi) e += re[k] * re[k] + im[k] * im[k];
  }
  return 10 * Math.log10((2 * e) / N / x.length);
}

const man = JSON.parse(fs.readFileSync(path.join(pub, 'manifest.json'), 'utf8'));
const run = JSON.parse(fs.readFileSync(runFile, 'utf8'));
const index = {};
for (const [dir, file] of [['voice', `voice/${CHAPTER}.json`], ['voice-pass', `voice-pass/${CHAPTER}.json`]]) {
  const p = path.join(pub, file);
  if (fs.existsSync(p)) for (const e of Object.values(JSON.parse(fs.readFileSync(p, 'utf8')).lines)) index[e.id] = [dir, e];
}
const music = run.events.filter((e) => e.k === 'music' && e.current).map((e) => ({ t: e.tMs / 1000, name: e.current.name }));
const VOICE_PATH = 20 * Math.log10(0.9 * 0.8);
const MUSIC_PATH = 20 * Math.log10(0.7 * 0.8);
const rows = [];
for (const v of run.events.filter((e) => e.k === 'voice')) {
  const hit = index[v.id];
  if (!hit) continue;
  const [dir, e] = hit;
  const dur = e.ms / 1000;
  const voiceDb = bandMsDb(decode(path.join(pub, dir, e.file)));
  const startT = v.tMs / 1000 - 0.12 - dur; // the poll sees a finished line within about 0.25 s
  const m = [...music].reverse().find((mm) => mm.t <= startT) ?? music[0];
  const track = man.music[m.name];
  let pos = startT - m.t;
  if (pos > track.loopEnd) pos = track.loopStart + ((pos - track.loopStart) % (track.loopEnd - track.loopStart));
  const musicDb = bandMsDb(decode(path.join(pub, 'music', `${m.name}.mp3`), Math.max(0, pos), Math.max(1, dur)));
  rows.push({ line: v.id.replace(`${CHAPTER}.`, ''), cue: m.name, pos: +Math.max(0, pos).toFixed(1), voiceDb: +voiceDb.toFixed(1), musicDb: +musicDb.toFixed(1), margins: Object.fromEntries(DUCKS.map((d) => [d, +(voiceDb + VOICE_PATH - (musicDb + MUSIC_PATH + d)).toFixed(1)])) });
}
console.log(`line`.padEnd(38), 'music cue'.padEnd(15), 'pos'.padStart(5), 'voice'.padStart(7), 'music'.padStart(7), '  margin dB at duck', DUCKS.join(' / '));
for (const r of rows) console.log(r.line.padEnd(38), r.cue.padEnd(15), String(r.pos).padStart(5), String(r.voiceDb).padStart(7), String(r.musicDb).padStart(7), '  ', DUCKS.map((d) => String(r.margins[d]).padStart(6)).join(' '));
for (const d of DUCKS) {
  const ms = rows.map((r) => r.margins[d]);
  console.log(`duck ${d} dB: lines ${rows.length}, minimum margin ${Math.min(...ms)} dB (${rows.find((r) => r.margins[d] === Math.min(...ms))?.line}), lines under +6 dB: ${rows.filter((r) => r.margins[d] < 6).map((r) => r.line).join(', ') || 'none'}`);
}
