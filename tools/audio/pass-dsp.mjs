/**
 * The audio pass's offline measuring library (conference demo sound pass, 2026-10-22; decision 184). Node only, no dependencies but ffmpeg (the repo's usual `D:/Tools/FFmpeg` copy, or `FFMPEG_PATH`).
 *
 * It decodes the shipped sprites (`public/audio/sfx/*.mp3`) to float samples, cuts a cue by its manifest offset, shapes it the way the mixer does (`sfxSource.ts`: skip, playback rate, trim, fade,
 * gain), sums layers on a timeline, and measures: EBU R128 K-weighted loudness of a window (BS.1770 filters, 400 ms momentary and 3 s short-term blocks, gated integrated), sample peak, 4x
 * oversampled true peak, spectral band shares, centroid, attack. Agents cannot hear (AGENTS.md rule 13): every pick of the pass is read off these numbers.
 *
 * Pure functions on `Float32Array` pairs plus the decode helper; the tools (`pass-onsets.mjs`, `pass-render.mjs`) and the scratch measuring scripts use it.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const FFMPEG = process.env.FFMPEG_PATH || 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
export const RATE = 44100;

const cache = new Map();

/** Decode an audio file to two Float32Arrays (L, R) at 44.1 kHz. Cached by path. */
export function decodeFile(file, rate = RATE) {
  const key = `${file}@${rate}`;
  if (cache.has(key)) return cache.get(key);
  // A mono file plays into the stereo bus as L = R = M (the 'speakers' up-mix, no -3 dB); ffmpeg's own -ac 2 would attenuate it by 3 dB, so mono is duplicated explicitly.
  const probe = spawnSync(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const mono = /Stream #\d+:\d+.*Audio:.*(mono)/.test(String(probe.stderr));
  const af = mono ? ['-af', 'pan=stereo|c0=c0|c1=c0'] : ['-ac', '2'];
  const p = spawnSync(FFMPEG, ['-v', 'error', '-i', file, ...af, '-f', 'f32le', '-ar', String(rate), '-'], { maxBuffer: 1024 * 1024 * 1024 });
  if (p.status !== 0) throw new Error(`ffmpeg failed on ${file}: ${String(p.stderr).slice(0, 200)}`);
  const f = new Float32Array(p.stdout.buffer, p.stdout.byteOffset, Math.floor(p.stdout.byteLength / 4));
  const n = f.length >> 1;
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    L[i] = f[2 * i];
    R[i] = f[2 * i + 1];
  }
  const out = { L, R, rate };
  cache.set(key, out);
  return out;
}

/** The manifest of a `public/audio` directory. */
export function readManifest(pub) {
  return JSON.parse(fs.readFileSync(path.join(pub, 'manifest.json'), 'utf8'));
}

/** The slice of a cue: `{L, R}` cut at the manifest offset and duration. `ref` is `first:<name>`, `v2:<name>` or `parity-<pack>:<name>`. */
export function cutCue(pub, manifest, ref) {
  const [kind, name] = [ref.slice(0, ref.indexOf(':')), ref.slice(ref.indexOf(':') + 1)];
  let sprite;
  let cue;
  if (kind === 'first') {
    sprite = manifest.sfx;
    cue = sprite.cues[name];
  } else if (kind === 'v2') {
    sprite = manifest.sfxV2;
    cue = sprite.cues[name];
  } else {
    const pack = kind.replace(/^parity-/, '');
    sprite = manifest.sfxParity.packs[pack];
    cue = sprite?.cues[name];
  }
  if (!cue) throw new Error(`no cue ${ref}`);
  const buf = decodeFile(path.join(pub, sprite.file));
  const a = Math.round(cue.offset * buf.rate);
  const n = Math.round(cue.duration * buf.rate);
  return { L: buf.L.slice(a, a + n), R: buf.R.slice(a, a + n), rate: buf.rate, cue };
}

/** First sample at or over `thresholdDb` re the slice's peak, in ms (the cue's own silence before it speaks). */
export function onsetMs(sig, thresholdDb = -30) {
  let pk = 0;
  for (let i = 0; i < sig.L.length; i++) pk = Math.max(pk, Math.abs(sig.L[i]), Math.abs(sig.R[i]));
  const thr = pk * 10 ** (thresholdDb / 20);
  for (let i = 0; i < sig.L.length; i++) if (Math.abs(sig.L[i]) >= thr || Math.abs(sig.R[i]) >= thr) return (i / sig.rate) * 1000;
  return 0;
}

/**
 * Shape a slice like `startSfxSource` does: start `skipMs` into it, play at `pitch` (linear resampling), at most `trimMs` of output, fade the last `fadeMs`, times `gain`.
 */
export function shape(sig, { skipMs = 0, pitch = 1, trimMs, fadeMs = 0, gain = 1 }) {
  const rate = sig.rate;
  const start = Math.round((skipMs / 1000) * rate);
  const avail = Math.max(0, sig.L.length - start);
  const naturalOut = avail / pitch;
  const outN = Math.min(naturalOut, trimMs !== undefined ? (trimMs / 1000) * rate : Infinity);
  const n = Math.max(0, Math.floor(outN));
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const fadeN = Math.min(n, Math.round((fadeMs / 1000) * rate));
  for (let i = 0; i < n; i++) {
    const pos = start + i * pitch;
    const i0 = Math.floor(pos);
    const f = pos - i0;
    const a = sig.L[i0] ?? 0;
    const b = sig.L[i0 + 1] ?? a;
    const c = sig.R[i0] ?? 0;
    const d = sig.R[i0 + 1] ?? c;
    let g = gain;
    if (fadeN > 0 && i >= n - fadeN) g *= (n - i) / fadeN;
    L[i] = (a + (b - a) * f) * g;
    R[i] = (c + (d - c) * f) * g;
  }
  return { L, R, rate };
}

/** Sum signals onto one timeline: each `{sig, atMs}`. */
export function sum(parts, rate = RATE, minMs = 0) {
  let n = Math.round((minMs / 1000) * rate);
  for (const p of parts) n = Math.max(n, Math.round((p.atMs / 1000) * rate) + p.sig.L.length);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (const p of parts) {
    const o = Math.round((p.atMs / 1000) * rate);
    for (let i = 0; i < p.sig.L.length; i++) {
      L[o + i] += p.sig.L[i];
      R[o + i] += p.sig.R[i];
    }
  }
  return { L, R, rate };
}

export const db = (x) => 20 * Math.log10(Math.max(x, 1e-9));
export const fromDb = (d) => 10 ** (d / 20);

export function samplePeakDb(sig) {
  let pk = 0;
  for (let i = 0; i < sig.L.length; i++) pk = Math.max(pk, Math.abs(sig.L[i]), Math.abs(sig.R[i]));
  return db(pk);
}

/** True peak by 4x linear-phase-free oversampling (cubic Hermite): good to a few tenths of a dB, enough to check a ceiling. */
export function truePeakDb(sig) {
  let pk = 0;
  for (const ch of [sig.L, sig.R]) {
    for (let i = 1; i < ch.length - 2; i++) {
      const y0 = ch[i - 1], y1 = ch[i], y2 = ch[i + 1], y3 = ch[i + 2];
      for (let k = 1; k < 4; k++) {
        const t = k / 4;
        const a = -0.5 * y0 + 1.5 * y1 - 1.5 * y2 + 0.5 * y3;
        const b = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
        const c = -0.5 * y0 + 0.5 * y2;
        pk = Math.max(pk, Math.abs(((a * t + b) * t + c) * t + y1));
      }
      pk = Math.max(pk, Math.abs(y1));
    }
  }
  return db(pk);
}

// ---- BS.1770 K-weighting (two biquads, coefficients for 48 kHz re-derived for any rate) ----
function kCoeffs(rate) {
  // Stage 1: high shelf (+4 dB at high frequencies), stage 2: RLB high-pass. Coefficients from the BS.1770 analogue prototypes by the bilinear transform.
  const shelf = (() => {
    const f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196;
    const K = Math.tan((Math.PI * f0) / rate);
    const Vh = 10 ** (G / 20), Vb = Vh ** 0.4996667741545416;
    const a0 = 1 + K / Q + K * K;
    return { b: [(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0], a: [1, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0] };
  })();
  const hp = (() => {
    const f0 = 38.13547087602444, Q = 0.5003270373238773;
    const K = Math.tan((Math.PI * f0) / rate);
    const a0 = 1 + K / Q + K * K;
    return { b: [1, -2, 1], a: [1, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0] };
  })();
  return [shelf, hp];
}

function biquad(x, c) {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = c.b[0] * x[i] + c.b[1] * x1 + c.b[2] * x2 - c.a[1] * y1 - c.a[2] * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v;
    y[i] = v;
  }
  return y;
}

/** K-weighted mean-square per sample, summed over channels (L+R), as a Float64Array of z values. */
function kSquares(sig) {
  const [s, h] = kCoeffs(sig.rate);
  const L = biquad(biquad(sig.L, s), h);
  const R = biquad(biquad(sig.R, s), h);
  const z = new Float64Array(L.length);
  for (let i = 0; i < z.length; i++) z[i] = L[i] * L[i] + R[i] * R[i];
  return z;
}

const lufsOf = (meanSq) => -0.691 + 10 * Math.log10(Math.max(meanSq, 1e-12));

/**
 * R128 loudness of a signal: integrated (gated: absolute -70 LUFS, relative -10 LU), the loudest momentary (400 ms) and short-term (3 s) windows, and the series of short-term values
 * every 100 ms (for percentiles). A signal shorter than a block is zero-padded to one block, so a 0.3 s cue has a defined reading.
 */
export function loudness(sig) {
  const rate = sig.rate;
  const z = kSquares(sig);
  const win = (ms) => Math.round((ms / 1000) * rate);
  const prefix = new Float64Array(z.length + 1);
  for (let i = 0; i < z.length; i++) prefix[i + 1] = prefix[i] + z[i];
  const meanSq = (a, b) => (prefix[Math.min(b, z.length)] - prefix[a]) / (b - a);
  const block = (ms, hop) => {
    const w = win(ms);
    const out = [];
    for (let a = 0; a === 0 || a + w <= z.length; a += hop) {
      const b = a + w;
      out.push(lufsOf(meanSq(a, b)));
      if (a + hop + w > z.length) break;
    }
    return out;
  };
  const mom = block(400, win(100));
  const st = block(3000, win(100));
  // gated integrated from 400 ms blocks with 75 % overlap
  const w4 = win(400);
  const hop = win(100);
  const blocks = [];
  for (let a = 0; a + w4 <= z.length; a += hop) blocks.push(meanSq(a, a + w4));
  if (blocks.length === 0) blocks.push(meanSq(0, z.length));
  const abs = blocks.filter((m) => lufsOf(m) > -70);
  let integrated = -Infinity;
  if (abs.length) {
    const rel = lufsOf(abs.reduce((s, m) => s + m, 0) / abs.length) - 10;
    const kept = abs.filter((m) => lufsOf(m) > rel);
    integrated = lufsOf(kept.reduce((s, m) => s + m, 0) / Math.max(1, kept.length));
  }
  return { integrated, momentaryMax: Math.max(...mom), shortTermMax: Math.max(...st), shortTerm: st, momentary: mom };
}

/** Value at percentile `p` (0..100) of an array of numbers (ignores -Infinity). */
export function percentile(values, p) {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  return v[Math.min(v.length - 1, Math.max(0, Math.round((p / 100) * (v.length - 1))))];
}

// ---- spectrum ----
function fftInPlace(re, im) {
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

/** Band shares of the energy in the first `ms` of a signal (mono mix, Hann window): lt120, 120-500, 500-2k, 2k-6k, over 6k, and the spectral centroid in Hz. */
export function bands(sig, ms = 250, startMs = 0) {
  const a = Math.round((startMs / 1000) * sig.rate);
  const len = Math.min(Math.round((ms / 1000) * sig.rate), sig.L.length - a);
  if (len < 32) return null;
  let n = 1;
  while (n < len) n <<= 1;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < len; i++) re[i] = ((sig.L[a + i] + sig.R[a + i]) / 2) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (len - 1)));
  fftInPlace(re, im);
  const edges = [0, 120, 500, 2000, 6000, Infinity];
  const e = [0, 0, 0, 0, 0];
  let tot = 0, cs = 0;
  for (let k = 1; k < n / 2; k++) {
    const f = (k * sig.rate) / n;
    const p = re[k] * re[k] + im[k] * im[k];
    tot += p; cs += p * f;
    for (let b = 0; b < 5; b++) if (f >= edges[b] && f < edges[b + 1]) { e[b] += p; break; }
  }
  tot = tot || 1e-20;
  return { lt120: e[0] / tot, b120_500: e[1] / tot, b500_2k: e[2] / tot, b2k_6k: e[3] / tot, gt6k: e[4] / tot, centroidHz: cs / tot };
}

/** Time from the first audible sample (-30 dB re peak) to the first sample within 6 dB of the peak, ms (the attack of the hit). */
export function attackMs(sig) {
  let pk = 0;
  for (let i = 0; i < sig.L.length; i++) pk = Math.max(pk, Math.abs(sig.L[i]), Math.abs(sig.R[i]));
  const thr = pk * 10 ** (-30 / 20), top = pk * 0.5;
  let a = -1;
  for (let i = 0; i < sig.L.length; i++) {
    const v = Math.max(Math.abs(sig.L[i]), Math.abs(sig.R[i]));
    if (a < 0 && v >= thr) a = i;
    if (v >= top) return a < 0 ? 0 : ((i - a) / sig.rate) * 1000;
  }
  return 0;
}

/** Write a signal as a 16-bit stereo WAV (for listening by Bailey on the audition page; the tools never listen). */
export function writeWav(file, sig) {
  const n = sig.L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(sig.rate, 24); buf.writeUInt32LE(sig.rate * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(sig.L[i] * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(sig.R[i] * 32767))), 46 + i * 4);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
}
