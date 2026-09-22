/**
 * sfizz as the sample engine, driven through its command-line renderer.
 *
 * Why the CLI and not the C API: the Windows build on disk
 * (D:/Tools/sfizz, unzipped from the approved sfizz-1.2.3-win64.zip) ships
 * `sfizz.dll` and `sfizz_render.exe` but no headers, and Node has no FFI
 * without an npm install (which this track may not do). The CLI takes a
 * Standard MIDI File, and a MIDI file carries everything the performance
 * model needs: note-on velocity, CC1 (dynamic-layer crossfade), CC11
 * (expression), and held-note overlap (which is what fires sfizz's
 * `trigger=legato` regions). CCs are per MIDI channel rather than per note, so
 * the caller splits a polyphonic part into monophonic LANES and renders each
 * lane on its own when it wants per-note curves (see perform.mjs).
 *
 * sfizz_render writes 16-bit PCM. The wrapper SFZ adds a headroom gain so a
 * stem uses the top of that range; `renderStem` measures the result, and if
 * the stem clipped or sat too low it re-renders once with a corrected gain.
 * The returned Float32 buffers have the headroom gain taken back out, so a
 * stem's level is the patch's own level whatever gain was used to carry it.
 */

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { writeSmf } from './midi.mjs';
import { wrapperText } from './sfz.mjs';

const run = promisify(execFile);

export const SFIZZ =
  process.env.PYREFLY_SFIZZ ?? 'D:/Tools/sfizz/bin/Release/sfizz_render.exe';

export function sfizzAvailable() {
  return existsSync(SFIZZ);
}

/** Read a PCM16 / float32 WAV into two Float32Arrays. */
export function readWav(path) {
  const buf = readFileSync(path);
  let at = 12;
  let fmt = null;
  let data = null;
  while (at + 8 <= buf.length) {
    const id = buf.toString('ascii', at, at + 4);
    const size = buf.readUInt32LE(at + 4);
    if (id === 'fmt ') {
      fmt = {
        format: buf.readUInt16LE(at + 8),
        channels: buf.readUInt16LE(at + 10),
        rate: buf.readUInt32LE(at + 12),
        bits: buf.readUInt16LE(at + 22),
      };
    } else if (id === 'data') {
      data = { start: at + 8, size: Math.min(size, buf.length - at - 8) };
    }
    at += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error(`${path}: not a WAV sfizz could have written`);
  const bytes = fmt.bits / 8;
  const frames = Math.floor(data.size / (bytes * fmt.channels));
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  let clipped = 0;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < Math.min(2, fmt.channels); c++) {
      const off = data.start + (i * fmt.channels + c) * bytes;
      let v;
      if (fmt.format === 3) v = buf.readFloatLE(off);
      else if (fmt.bits === 16) {
        const s = buf.readInt16LE(off);
        if (s >= 32767 || s <= -32768) clipped++;
        v = s / 32768;
      } else if (fmt.bits === 24) v = buf.readIntLE(off, 3) / 8388608;
      else throw new Error(`${path}: ${fmt.bits}-bit PCM not handled`);
      if (c === 0) left[i] = v;
      else right[i] = v;
    }
    if (fmt.channels === 1) right[i] = left[i];
  }
  return { left, right, rate: fmt.rate, clipped };
}

function peakDb(stereo) {
  let p = 0;
  for (let i = 0; i < stereo.left.length; i++) {
    const a = Math.abs(stereo.left[i]);
    const b = Math.abs(stereo.right[i]);
    if (a > p) p = a;
    if (b > p) p = b;
  }
  return p > 0 ? 20 * Math.log10(p) : -Infinity;
}

async function renderOnce(workDir, tag, sfz, wrapOpts, events, sampleRate) {
  const text = wrapperText(sfz, wrapOpts);
  const hash = createHash('sha1').update(text).digest('hex').slice(0, 12);
  const sfzPath = join(workDir, `${hash}.sfz`);
  if (!existsSync(sfzPath)) writeFileSync(sfzPath, text);
  const midPath = join(workDir, `${tag}.mid`);
  const wavPath = join(workDir, `${tag}.wav`);
  writeSmf(midPath, events);
  await run(SFIZZ, ['--sfz', sfzPath, '--midi', midPath, '--wav', wavPath, '-s', String(sampleRate), '-q', '3', '-p', '128'], {
    maxBuffer: 1 << 24,
    windowsHide: true,
  });
  return readWav(wavPath);
}

/**
 * Render one stem: `events` (see midi.mjs) through `sfz` (a parsed patch)
 * with `wrapOpts` (see sfz.mjs wrapperText). Returns { left, right, gainDb, peakDb }.
 */
export async function renderStem({ workDir, tag, sfz, wrapOpts = {}, events, sampleRate = 44100 }) {
  mkdirSync(workDir, { recursive: true });
  let gainDb = wrapOpts.gainDb ?? 0;
  let out = await renderOnce(workDir, tag, sfz, { ...wrapOpts, gainDb }, events, sampleRate);
  let pk = peakDb(out);
  let passes = 1;
  // One correction pass: clipped -> back off; buried under -24 dBFS -> lift.
  if (out.clipped > 0 || pk > -1 || pk < -24) {
    const target = -6;
    const delta = out.clipped > 0 ? -12 : Math.max(-30, Math.min(30, target - pk));
    gainDb += delta;
    out = await renderOnce(workDir, tag, sfz, { ...wrapOpts, gainDb }, events, sampleRate);
    pk = peakDb(out);
    passes++;
    if (out.clipped > 0) {
      passes++;
      gainDb -= 18;
      out = await renderOnce(workDir, tag, sfz, { ...wrapOpts, gainDb }, events, sampleRate);
      pk = peakDb(out);
    }
  }
  if (out.rate !== sampleRate) throw new Error(`sfizz wrote ${out.rate} Hz, asked for ${sampleRate}`);
  const undo = Math.pow(10, -gainDb / 20);
  for (let i = 0; i < out.left.length; i++) {
    out.left[i] *= undo;
    out.right[i] *= undo;
  }
  return { left: out.left, right: out.right, gainDb, peakDb: pk, clipped: out.clipped, passes };
}
