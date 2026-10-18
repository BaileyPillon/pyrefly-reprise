/**
 * The audio half of `voice-ship.mjs`: decode a candidate, trim its silence, bring it to the dialogue loudness target, encode it
 * in the shipped format and measure what came out. Every number is the project's own (`measure.mjs`: BS.1770 K-weighted
 * integrated loudness and 4x oversampled true peak), so a voice line is "measured as the other assets are". Agents cannot hear:
 * these are the gates; the verdict on how a line sounds is Bailey's.
 *
 * Loudness is measured DUAL MONO (the same signal on both channels), which is how a mono buffer plays through the game's stereo
 * graph: it matches how the stereo music at -16 LUFS reaches the listener. A clip shorter than one 400 ms gating block is looped
 * for the measurement only (BS.1770 has no answer for it otherwise).
 *
 * Game case: FFX only for now (the set it ships), but nothing here knows a game.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { measureLufs, measureTruePeak } from './measure.mjs';

export const FFMPEG = process.env.FFMPEG_PATH ?? process.env.PYREFLY_FFMPEG ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';

/** The shipped format (docs/audio/voice-integration-design.md section 2): mono, 24 kHz, 64 kbps MP3. */
export const ENCODE = { codec: 'mp3', channels: 1, rate: 24000, bitrate: '64k' };
/** The design's dialogue target: -19 LUFS integrated per line, true peak at most -1 dBTP. */
export const TARGET_LUFS = -19;
export const CEILING_DBTP = -1;
/** The working rate the candidates are decoded to (their own rate, 44.1 kHz). */
export const WORK_RATE = 44100;

export function ffmpegAvailable() {
  return spawnSync(FFMPEG, ['-version'], { encoding: 'utf8' }).status === 0;
}

const run = (args, input) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-v', 'error', ...args], { input, maxBuffer: 256 << 20 });
  if (r.status !== 0) throw new Error(`ffmpeg ${args.slice(0, 6).join(' ')}... failed: ${r.stderr?.toString().slice(0, 300) || r.error?.message}`);
  return r.stdout;
};

/** Decode any audio file to mono float32 at `rate`. */
export function decodeToF32(file, rate = WORK_RATE) {
  const out = run(['-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(rate), 'pipe:1']);
  return new Float32Array(out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength));
}

const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
const lin = (d) => 10 ** (d / 20);

/**
 * Cut leading and trailing silence, keeping a short, fixed head and tail so every line starts and ends the same way and the
 * hold the box adds (recording plus tail) means the same thing for every line. Silence = below `thresholdDb` of full scale.
 */
export function trimSilence(samples, rate, { thresholdDb = -50, headMs = 35, tailMs = 90 } = {}) {
  const gate = lin(thresholdDb);
  let first = 0;
  while (first < samples.length && Math.abs(samples[first]) < gate) first++;
  if (first === samples.length) return new Float32Array(0);
  let last = samples.length - 1;
  while (last > first && Math.abs(samples[last]) < gate) last--;
  const head = Math.round((headMs / 1000) * rate);
  const tail = Math.round((tailMs / 1000) * rate);
  const out = new Float32Array(head + (last - first + 1) + tail);
  out.set(samples.subarray(first, last + 1), head);
  return out;
}

/** A linear fade in and out on the line's own ends, so the cut never clicks. Mutates and returns `samples`. */
export function fadeEnds(samples, rate, inMs = 4, outMs = 25) {
  const fi = Math.min(samples.length, Math.round((inMs / 1000) * rate));
  const fo = Math.min(samples.length, Math.round((outMs / 1000) * rate));
  for (let i = 0; i < fi; i++) samples[i] *= i / fi;
  for (let i = 0; i < fo; i++) samples[samples.length - 1 - i] *= i / fo;
  return samples;
}

/** The first and last samples above the gate; the stretch between is the speech. */
function speechSpan(samples, gate) {
  let first = 0;
  while (first < samples.length && Math.abs(samples[first]) < gate) first++;
  let last = samples.length - 1;
  while (last > first && Math.abs(samples[last]) < gate) last--;
  return [first, last];
}

/** Longest run, in ms, of samples under -50 dBFS strictly inside the speech (not the head or tail). */
export function longestInnerSilenceMs(samples, rate, thresholdDb = -50) {
  const gate = lin(thresholdDb);
  const [first, last] = speechSpan(samples, gate);
  let run = 0;
  let best = 0;
  for (let i = first; i <= last; i++) {
    if (Math.abs(samples[i]) < gate) best = Math.max(best, ++run);
    else run = 0;
  }
  return (best / rate) * 1000;
}

/** Integrated loudness (LUFS, dual mono) and true peak (dBTP) of one line. */
export function measureLine(samples, rate) {
  if (!samples.length) return { lufs: -Infinity, truePeakDb: -Infinity, samplePeak: 0 };
  let looped = samples;
  const need = Math.round(rate * 1.2);
  if (samples.length < need) {
    looped = new Float32Array(Math.ceil(need / samples.length) * samples.length);
    for (let n = 0; n < looped.length; n += samples.length) looped.set(samples, n);
  }
  let samplePeak = 0;
  for (const s of samples) samplePeak = Math.max(samplePeak, Math.abs(s));
  return { lufs: measureLufs(looped, looped, rate), truePeakDb: measureTruePeak(samples, samples), samplePeak };
}

/**
 * The gain, in dB, that brings a line to `targetLufs` without its true peak passing `ceilingDb`. When the peak would pass, the gain
 * is cut to fit the ceiling and `limited` is true (the line plays quieter than the target rather than clip).
 */
export function gainFor(measured, targetLufs = TARGET_LUFS, ceilingDb = CEILING_DBTP) {
  const wanted = targetLufs - measured.lufs;
  const room = ceilingDb - measured.truePeakDb;
  return wanted <= room ? { gainDb: wanted, limited: false } : { gainDb: room, limited: true };
}

export function applyGain(samples, gainDb) {
  const g = lin(gainDb);
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] * g;
  return out;
}

/** Encode mono float32 to the shipped MP3. Written through a temp file: a piped mp3 has no seekable Xing header (and so a wrong length). */
export function encodeMp3(samples, rate, { outRate = ENCODE.rate, bitrate = ENCODE.bitrate } = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'voice-ship-'));
  const file = path.join(dir, 'line.mp3');
  try {
    run(['-y', '-f', 'f32le', '-ar', String(rate), '-ac', '1', '-i', 'pipe:0', '-ar', String(outRate), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', bitrate, '-fflags', '+bitexact', '-flags:a', '+bitexact', file], Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
    return readFileSync(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Decode a shipped MP3 the way a browser would (gapless: the encoder delay is trimmed by its header), for the post-encode measurements. */
export function decodeMp3Bytes(bytes, rate = ENCODE.rate) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'voice-ship-'));
  const file = path.join(dir, 'line.mp3');
  try {
    writeFileSync(file, bytes);
    return decodeToF32(file, rate);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Process one candidate end to end and report what the shipped file measures.
 * `fixes` counts how many times the gain was lowered because the encoded file's true peak passed the ceiling.
 */
export function processLine(sourceFile, { targetLufs = TARGET_LUFS, ceilingDb = CEILING_DBTP, bitrate = ENCODE.bitrate } = {}) {
  const decoded = decodeToF32(sourceFile, WORK_RATE);
  const trimmed = trimSilence(decoded, WORK_RATE);
  if (trimmed.length < WORK_RATE * 0.15) return { error: `only ${((trimmed.length / WORK_RATE) * 1000).toFixed(0)} ms of audio after trimming silence` };
  const before = measureLine(trimmed, WORK_RATE);
  let { gainDb, limited } = gainFor(before, targetLufs, ceilingDb);
  let bytes;
  let after;
  let pcm;
  let fixes = 0;
  let tunes = 0;
  for (;;) {
    const shaped = fadeEnds(applyGain(trimmed, gainDb), WORK_RATE);
    bytes = encodeMp3(shaped, WORK_RATE, { bitrate });
    pcm = decodeMp3Bytes(bytes);
    after = measureLine(pcm, ENCODE.rate);
    if (after.truePeakDb > ceilingDb && fixes < 4) {
      gainDb -= after.truePeakDb - ceilingDb + 0.1; // the lossy codec overshot the ceiling: lower the gain and encode again
      limited = true;
      fixes++;
      continue;
    }
    // Land on the target as the browser will decode it (fades, the 24 kHz resample and the codec move the reading a few tenths).
    const off = targetLufs - after.lufs;
    if (!limited && Math.abs(off) > 0.2 && tunes < 2 && Number.isFinite(off)) {
      gainDb += off;
      tunes++;
      continue;
    }
    break;
  }
  return {
    bytes,
    ms: Math.round((pcm.length / ENCODE.rate) * 1000),
    before: { lufs: round(before.lufs), truePeakDb: round(before.truePeakDb) },
    after: { lufs: round(after.lufs), truePeakDb: round(after.truePeakDb), samplePeak: round(db(after.samplePeak)) },
    gainDb: round(gainDb),
    limited,
    fixes,
    innerSilenceMs: Math.round(longestInnerSilenceMs(pcm, ENCODE.rate)),
  };
}

const round = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : n);

/**
 * The findings for one processed line. `fail` blocks the ship; `warn` is for Bailey's ear and the retake pass.
 *  - fail: true peak over the ceiling, clipped samples, a silence of more than 400 ms inside the line, a line under 150 ms
 *  - warn: loudness more than 1.5 LU off the target (and not limited), a length more than 30 percent off the planning estimate
 */
export function findings(result, estSpeechMs, { targetLufs = TARGET_LUFS, ceilingDb = CEILING_DBTP } = {}) {
  const fail = [];
  const warn = [];
  if (result.after.truePeakDb > ceilingDb + 0.05) fail.push(`true peak ${result.after.truePeakDb} dBTP over ${ceilingDb}`);
  if (result.after.samplePeak >= -0.1) fail.push(`clipping: sample peak ${result.after.samplePeak} dBFS`);
  if (result.innerSilenceMs > 400) fail.push(`${result.innerSilenceMs} ms of silence inside the line (over 400)`);
  if (result.ms < 150) fail.push(`only ${result.ms} ms long`);
  if (!result.limited && Math.abs(result.after.lufs - targetLufs) > 1.5) warn.push(`loudness ${result.after.lufs} LUFS, ${Math.abs(result.after.lufs - targetLufs).toFixed(1)} LU off the ${targetLufs} target`);
  if (result.limited) warn.push(`peak-limited to ${result.after.lufs} LUFS (target ${targetLufs}): quieter than its neighbours`);
  const ratio = result.ms / estSpeechMs;
  if (ratio > 1.3 || ratio < 0.7) warn.push(`${result.ms} ms is ${Math.round(Math.abs(ratio - 1) * 100)} percent ${ratio > 1 ? 'over' : 'under'} the ${estSpeechMs} ms planning estimate: listen for a stray word or a clipped end`);
  return { fail, warn };
}
