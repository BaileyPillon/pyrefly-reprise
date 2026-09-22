/**
 * Float PCM in and out of any file ffmpeg can read, for sketch C
 * (render-c.mjs, texture.mjs, round1.mjs).
 *
 *   decodeStereo(file, { rate, start, duration, filter })  -> { left, right, rate }
 *   writeWavF32(file, left, right, rate)                    32-bit float stereo WAV
 *   writeWavS16Mono(file, left, right, rate)                what ace-measure.py reads
 *   writeWavS16(file, left, right, rate)                    what ComfyUI's LoadAudio is given
 *
 * ffmpeg does every decode (Ogg, Opus, MP3, FLAC, float WAV) so one code path
 * reads the shipped MP3, sketch A's float WAV, sketch B's FLAC and ACE-Step's
 * output alike.
 */

import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { FFMPEG } from './loudness.mjs';

const run = promisify(execFile);

export async function decodeStereo(file, { rate = 44100, start, duration, filter } = {}) {
  const args = ['-hide_banner', '-loglevel', 'error'];
  if (start !== undefined) args.push('-ss', String(start));
  if (duration !== undefined) args.push('-t', String(duration));
  args.push('-i', file);
  if (filter) args.push('-af', filter);
  args.push('-ac', '2', '-ar', String(rate), '-f', 'f32le', '-');
  const { stdout } = await run(FFMPEG, args, { encoding: 'buffer', maxBuffer: 1 << 30, windowsHide: true });
  const frames = Math.floor(stdout.length / 8);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  for (let i = 0, at = 0; i < frames; i++, at += 8) {
    left[i] = stdout.readFloatLE(at);
    right[i] = stdout.readFloatLE(at + 4);
  }
  return { left, right, rate };
}

function header(b, { channels, rate, bits, format, dataBytes }) {
  const block = channels * (bits / 8);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + dataBytes, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(format, 20);
  b.writeUInt16LE(channels, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * block, 28);
  b.writeUInt16LE(block, 32);
  b.writeUInt16LE(bits, 34);
  b.write('data', 36);
  b.writeUInt32LE(dataBytes, 40);
}

export function writeWavF32(file, left, right, rate) {
  const n = left.length;
  const b = Buffer.alloc(44 + n * 8);
  header(b, { channels: 2, rate, bits: 32, format: 3, dataBytes: n * 8 });
  for (let i = 0, at = 44; i < n; i++, at += 8) {
    b.writeFloatLE(left[i], at);
    b.writeFloatLE(right[i], at + 4);
  }
  writeFileSync(file, b);
}

const s16 = (v) => Math.max(-32768, Math.min(32767, Math.round(v * 32767)));

export function writeWavS16(file, left, right, rate) {
  const n = left.length;
  const b = Buffer.alloc(44 + n * 4);
  header(b, { channels: 2, rate, bits: 16, format: 1, dataBytes: n * 4 });
  for (let i = 0, at = 44; i < n; i++, at += 4) {
    b.writeInt16LE(s16(left[i]), at);
    b.writeInt16LE(s16(right[i]), at + 2);
  }
  writeFileSync(file, b);
}

export function writeWavS16Mono(file, left, right, rate) {
  const n = left.length;
  const b = Buffer.alloc(44 + n * 2);
  header(b, { channels: 1, rate, bits: 16, format: 1, dataBytes: n * 2 });
  for (let i = 0, at = 44; i < n; i++, at += 2) b.writeInt16LE(s16((left[i] + right[i]) / 2), at);
  writeFileSync(file, b);
}

/** Shift a buffer earlier by `frames` (negative = later), zero-filled. */
export function shiftEarlier(buf, frames) {
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    const j = i + frames;
    if (j >= 0 && j < buf.length) out[i] = buf[j];
  }
  return out;
}

export function fitLength(buf, n) {
  if (buf.length === n) return buf;
  const out = new Float32Array(n);
  out.set(buf.subarray(0, Math.min(n, buf.length)));
  return out;
}
