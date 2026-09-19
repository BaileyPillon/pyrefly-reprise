#!/usr/bin/env node
/**
 * Is a failing loop seam a defect, or is it the manifest's rounding?
 *
 * `manifest.json` stores loop points to four decimal places, so the sample the
 * game wraps on can sit up to two samples away from the one the renderer
 * crossfaded. On a bright cue two samples of slope is a large number, and the
 * seam gate reads it as a click that is not there.
 *
 * So: slide the wrap point across a window and report the step at every
 * offset. If the minimum sits at or near zero offset and is small, the loop is
 * sound and the gate was reading rounding. If the step stays large everywhere
 * in the window, the material genuinely does not join and the cue needs
 * re-rendering, not a tolerance.
 *
 *   node tools/audio/seam-probe.mjs [cue ...]
 */

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIO_DIR = path.join(ROOT, 'public/audio');
const FFMPEG =
  process.env.FFMPEG_PATH ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
const SR = 44100;

async function decode(file) {
  const { stdout } = await execFileAsync(
    FFMPEG,
    ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'],
    { maxBuffer: 1 << 30, encoding: 'buffer' },
  );
  const frames = Math.floor(stdout.length / 8);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    left[i] = stdout.readFloatLE(i * 8);
    right[i] = stdout.readFloatLE(i * 8 + 4);
  }
  return { left, right };
}

const argv = process.argv.slice(2);
const FIX = argv.includes('--fix');
const manifest = JSON.parse(await readFile(path.join(AUDIO_DIR, 'manifest.json'), 'utf8'));
const names = argv.filter((a) => !a.startsWith('--')).length
  ? argv.filter((a) => !a.startsWith('--'))
  : Object.keys(manifest.music);
const fixes = [];

console.log('cue                         start@0   min-step  at off   blk@0   blk-min@off   verdict');
console.log('-'.repeat(88));

for (const name of names) {
  const entry = manifest.music[name];
  if (!entry) continue;
  const { left, right } = await decode(path.join(AUDIO_DIR, entry.file));
  const ls = Math.round(entry.loopStart * SR);
  const le = Math.round(entry.loopEnd * SR);

  // Local slope around the loop start — what one sample of slip costs here.
  let motion = 0;
  for (let i = ls - 256; i < ls + 256; i++) {
    motion += Math.abs(left[i] - left[i - 1]) + Math.abs(right[i] - right[i - 1]);
  }
  motion /= 1024;

  const stepAt = (off) =>
    Math.max(
      Math.abs(left[ls] - left[le - 1 + off]),
      Math.abs(right[ls] - right[le - 1 + off]),
    );
  const entryStep = Math.max(
    Math.abs(left[ls] - left[ls - 1]),
    Math.abs(right[ls] - right[ls - 1]),
  );

  /**
   * The decisive test, and the one that checks the architecture rather than the
   * waveform.
   *
   * Each cue is rendered as intro + loop body + the first three seconds of the
   * loop body again. So the material *after* `loopEnd` is by construction the
   * same material as the one *after* `loopStart` — that is the whole point of
   * the tail, and it is what makes a constant decoder offset land on identical
   * samples instead of on the intro.
   *
   * Comparing those two blocks therefore answers both questions at once: does
   * the tail exist, and is `loopEnd` stored at the right sample? A shifted
   * minimum is the loop point's error in samples, to the sample.
   */
  const blockDiff = (off) => {
    const n = 4096;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const a = left[ls + i];
      const b = left[le + i + off];
      const c = right[ls + i];
      const d = right[le + i + off];
      sum += (a - b) * (a - b) + (c - d) * (c - d);
    }
    return Math.sqrt(sum / (n * 2));
  };

  let best = Infinity;
  let bestOff = 0;
  let bestBlock = Infinity;
  let blockOff = 0;
  for (let off = -64; off <= 64; off++) {
    const s = stepAt(off);
    if (s < best) {
      best = s;
      bestOff = off;
    }
    const bd = blockDiff(off);
    if (bd < bestBlock) {
      bestBlock = bd;
      blockOff = off;
    }
  }
  const block0 = blockDiff(0);
  const at0 = stepAt(0);
  // Rounding can move the wrap by a couple of samples; a codec's own smear is
  // a few more. Anything that only joins outside that window is a real edit
  // fault, not an alignment one.
  // A crossfaded seam makes the two blocks the same material, so their RMS
  // difference collapses to the codec's own noise. If it only collapses at a
  // non-zero offset, the stored loop point is wrong by exactly that many
  // samples; if it never collapses, the loop body is not a loop at all.
  const joined = bestBlock < 0.01;
  const verdict = !joined
    ? Math.abs(bestOff) <= 4
      ? 'tail absent, wrap is a real edit'
      : 'NO JOIN ANYWHERE'
    : Math.abs(blockOff) <= 4
      ? 'rounding'
      : `loop point is ${blockOff} samples out`;
  console.log(
    `${name.padEnd(28)}${at0.toFixed(5).padStart(8)}  ${best.toFixed(5).padStart(8)}  ` +
      `${String(bestOff).padStart(6)}  ${block0.toFixed(5)} ${bestBlock.toFixed(5)}@${String(blockOff).padStart(3)}  ${verdict}`,
  );

  /**
   * The repair, and why it is a number rather than a re-render.
   *
   * The audio is right: the tail after `loopEnd` is the same material as the
   * head after `loopStart`, to the sample. What is wrong is the arithmetic —
   * four decimal places of a second is 4.4 samples, so the wrap lands beside
   * the sample the renderer matched and steps by whatever the waveform was
   * doing in between. Storing `loopEnd` as `loopStart` plus the measured body
   * length, at sample resolution, makes the wrap land exactly where the
   * crossfade put it. No audio is touched.
   */
  if (FIX) {
    const bodySamples = le + blockOff - ls;
    const loopEnd = Number(((ls + bodySamples) / SR).toFixed(6));
    const loopStart = Number((ls / SR).toFixed(6));
    if (loopEnd !== entry.loopEnd || loopStart !== entry.loopStart) {
      fixes.push({ name, from: { loopStart: entry.loopStart, loopEnd: entry.loopEnd }, to: { loopStart, loopEnd }, movedSamples: blockOff });
      entry.loopStart = loopStart;
      entry.loopEnd = loopEnd;
    }
  }
}

if (FIX) {
  if (fixes.length === 0) {
    console.log('\nevery loop point is already sample-exact.');
  } else {
    // Re-read immediately before writing: other agents render into this same
    // manifest, and a read-modify-write across a long analysis is exactly how
    // the title and chapter-select entries were lost earlier today.
    const live = JSON.parse(await readFile(path.join(AUDIO_DIR, 'manifest.json'), 'utf8'));
    for (const fix of fixes) {
      if (!live.music[fix.name]) continue;
      live.music[fix.name].loopStart = fix.to.loopStart;
      live.music[fix.name].loopEnd = fix.to.loopEnd;
    }
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path.join(AUDIO_DIR, 'manifest.json'), `${JSON.stringify(live, null, 2)}\n`);
    console.log(`\nmoved ${fixes.length} loop point(s) onto the sample the renderer matched:`);
    for (const f of fixes) {
      console.log(
        `  ${f.name.padEnd(28)} loopEnd ${f.from.loopEnd} -> ${f.to.loopEnd} ` +
          `(${f.movedSamples >= 0 ? '+' : ''}${f.movedSamples} samples)`,
      );
    }
  }
}
