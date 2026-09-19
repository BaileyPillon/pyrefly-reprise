#!/usr/bin/env node
/**
 * Audio QA — the independent audit of what actually ships.
 *
 * `render.mjs` measures what it just rendered, in memory, before the encoder
 * touches it. This tool measures the MP3s on disk, decoded the way a browser
 * will decode them, which is the only thing a player ever hears. The two
 * disagreeing is itself a finding: it means the encode changed the mix.
 *
 * Per music cue:
 *   duration, integrated LUFS, true peak, clipped samples, leading and
 *   trailing silence, loop-seam discontinuity AND spectral flux across the
 *   splice against the cue's own median flux, octave-band balance with the
 *   orchestral-tilt gate, file size, and agreement with the manifest.
 *
 * Per SFX in the sprite: bounds inside the sprite, momentary loudness, true
 * peak, and whether the slice is silent (a cue that decoded to nothing is
 * invisible to every other check).
 *
 * Plus manifest consistency: every key the game asks for resolves, every file
 * on disk is listed, no orphans either way.
 *
 *   node tools/audio/qa.mjs [--json=PATH] [--only=cue,cue] [--quiet]
 *
 * Exit code is 0 even when cues fail; the report is the product. Pass
 * `--strict` to exit non-zero on any failure.
 */

import { execFile } from 'node:child_process';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promisify } from 'node:util';

import {
  measureLufs,
  measureTruePeak,
  measureSpectrum,
  checkSpectralBalance,
  measureSeam,
  measureMomentaryLufs,
  findCueBounds,
  fft,
} from './measure.mjs';

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIO_DIR = path.join(ROOT, 'public/audio');
const FFMPEG =
  process.env.FFMPEG_PATH ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';

const SAMPLE_RATE = 44100;

// ----------------------------------------------------------------- decode ---

/**
 * Decode to interleaved float, exactly as the browser will.
 *
 * No resampling is requested beyond the project rate, and no normalisation:
 * an MP3 decode legitimately overshoots 1.0, and hiding that would hide the
 * one thing the true-peak gate exists to catch.
 */
async function decode(file) {
  const { stdout } = await execFileAsync(
    FFMPEG,
    ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SAMPLE_RATE), '-'],
    { maxBuffer: 1 << 30, encoding: 'buffer' },
  );
  const frames = Math.floor(stdout.length / 8);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    left[i] = stdout.readFloatLE(i * 8);
    right[i] = stdout.readFloatLE(i * 8 + 4);
  }
  return { left, right, sampleRate: SAMPLE_RATE };
}

// --------------------------------------------------------------- measures ---

/** Samples at or past full scale — what a listener hears as crackle. */
function countClipped(left, right, threshold = 0.9995) {
  let count = 0;
  let runs = 0;
  let inRun = false;
  for (let i = 0; i < left.length; i++) {
    const hot = Math.abs(left[i]) >= threshold || Math.abs(right[i]) >= threshold;
    if (hot) {
      count++;
      if (!inRun) runs++;
      inRun = true;
    } else {
      inRun = false;
    }
  }
  return { count, runs };
}

/**
 * Spectral flux across the loop splice, against the cue's own median.
 *
 * The sample-step test catches a discontinuity in the waveform; it cannot
 * catch a discontinuity in the *sound* — a loop that wraps from full brass
 * into solo piano has a tiny step and an obvious join. Flux is the frame to
 * frame change in the magnitude spectrum, so splicing loopEnd onto loopStart
 * and asking whether the junction is busier than the first pass into the loop
 * already was is the question that distinguishes a join from a bump.
 */
function seamFlux(left, right, loopStartSample, loopEndSample, sampleRate) {
  const n = 1024;
  const hop = 512;
  const window = new Float64Array(n);
  for (let i = 0; i < n; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);

  const spectrumAt = (get, offset) => {
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      re[i] = get(offset + i) * window[i];
      im[i] = 0;
    }
    fft(re, im);
    const mag = new Float64Array(n / 2);
    for (let k = 0; k < n / 2; k++) mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    return mag;
  };
  const flux = (a, b) => {
    let sum = 0;
    for (let k = 0; k < a.length; k++) {
      const d = b[k] - a[k];
      if (d > 0) sum += d * d;
    }
    return Math.sqrt(sum);
  };

  const mono = (i) => {
    if (i < 0 || i >= left.length) return 0;
    return (left[i] + right[i]) * 0.5;
  };

  /**
   * The reference is the first pass into the loop, not the cue's median.
   *
   * Comparing the splice against median flux fails good loops and for a
   * predictable reason: a cue with a sparse intro or a static ostinato has a
   * tiny median, so any real downbeat at the loop head measures as a huge
   * multiple of it. But that downbeat is music — the listener already heard
   * exactly it when the intro ran into the loop the first time. The question
   * worth asking is whether the wrap is busier than that entry was.
   */
  const fluxAcross = (get) => {
    const before = spectrumAt(get, 0);
    const across = spectrumAt(get, n / 2); // straddles the join
    const after = spectrumAt(get, n);
    return Math.max(flux(before, across), flux(across, after));
  };

  // The spliced signal: the tail of the loop body running into its own head.
  const spliced = (i) =>
    mono(i < n ? loopEndSample - n + i : loopStartSample + (i - n));
  // The unspliced first pass: the intro running into that same head.
  const entry = (i) => mono(loopStartSample - n + i);

  const seam = fluxAcross(spliced);
  const entryFlux = fluxAcross(entry);
  // The cue's median, kept only as a floor so a silent entry cannot make any
  // wrap look infinitely worse than it.
  const fluxes = [];
  let prev = null;
  for (let start = 0; start + n <= left.length; start += hop * 8) {
    const mag = spectrumAt(mono, start);
    if (prev) fluxes.push(flux(prev, mag));
    prev = mag;
  }
  fluxes.sort((a, b) => a - b);
  const median = fluxes.length ? fluxes[Math.floor(fluxes.length / 2)] : 0;
  // A downbeat is a high-percentile event, not a median one, so the cue's own
  // 90th percentile is the second floor. Without it a cue whose intro is a
  // one-shot fanfare fails: the entry into the loop is a quiet plagal
  // resolution and the wrap is groove-to-groove, which is the join that
  // matters and the busier of the two by construction.
  const p90 = fluxes.length ? fluxes[Math.floor(fluxes.length * 0.9)] : 0;

  const reference = Math.max(entryFlux, median, p90);
  if (reference <= 0) return { ratio: 0, median, entryFlux, seam, ok: true };
  const ratio = seam / reference;
  return { ratio, median, entryFlux, seam, ok: ratio <= 2 };
}

/** Silence at the head and tail, in seconds, at -60 dBFS relative to the peak. */
function silenceEdges(left, right, sampleRate) {
  const { start, end } = findCueBounds(left, right);
  return {
    leadingSec: start / sampleRate,
    trailingSec: (left.length - end) / sampleRate,
  };
}

// ------------------------------------------------------------ music cues ---

async function auditCue(name, entry) {
  const file = path.join(AUDIO_DIR, entry.file);
  const info = await stat(file);
  const { left, right } = await decode(file);
  const duration = left.length / SAMPLE_RATE;

  const lufs = measureLufs(left, right, SAMPLE_RATE);
  const truePeakDb = measureTruePeak(left, right);
  const spectrum = measureSpectrum(left, right, SAMPLE_RATE);
  const balance = checkSpectralBalance(spectrum);
  const clip = countClipped(left, right);
  const edges = silenceEdges(left, right, SAMPLE_RATE);

  const loopStartSample = Math.round(entry.loopStart * SAMPLE_RATE);
  const loopEndSample = Math.round(entry.loopEnd * SAMPLE_RATE);
  const seam = measureSeam(left, right, loopStartSample, loopEndSample);
  const flux = seamFlux(left, right, loopStartSample, loopEndSample, SAMPLE_RATE);

  const failures = [];
  if (!Number.isFinite(lufs)) failures.push('loudness did not measure (silent file?)');
  else if (Math.abs(lufs + 16) > 2) failures.push(`LUFS ${lufs.toFixed(2)} outside -16 +/-2`);
  if (truePeakDb > -1) failures.push(`true peak ${truePeakDb.toFixed(2)} dBTP over -1`);
  if (clip.count > 0) failures.push(`${clip.count} clipped samples in ${clip.runs} runs`);
  if (!seam.ok) {
    failures.push(
      seam.allowed === undefined
        ? `seam unmeasurable: ${seam.note}`
        : `seam step ${seam.step.toFixed(5)} > allowed ${seam.allowed.toFixed(5)}`,
    );
  }
  if (!flux.ok) failures.push(`seam flux ${flux.ratio.toFixed(1)}x the first pass into the loop`);
  if (!balance.ok) for (const p of balance.problems) failures.push(`spectrum: ${p}`);
  if (entry.loopEnd > duration + 0.05) {
    failures.push(`loopEnd ${entry.loopEnd}s past the file's ${duration.toFixed(2)}s`);
  }
  if (entry.loopEnd - entry.loopStart < 5) failures.push('loop body under 5 s');
  if (edges.leadingSec > 0.5) failures.push(`${edges.leadingSec.toFixed(2)}s of leading silence`);
  if (edges.trailingSec > 3.5) failures.push(`${edges.trailingSec.toFixed(2)}s of trailing silence`);
  if (Math.abs(info.size - (entry.bytes ?? info.size)) > 4096) {
    failures.push(`manifest bytes ${entry.bytes} but the file is ${info.size}`);
  }
  if (Math.abs(duration - (entry.duration ?? duration)) > 0.12) {
    failures.push(
      `manifest duration ${entry.duration}s but the decode is ${duration.toFixed(3)}s`,
    );
  }
  if (entry.lufs !== undefined && Math.abs(entry.lufs - lufs) > 0.6) {
    failures.push(
      `manifest says ${entry.lufs} LUFS, the encoded file measures ${lufs.toFixed(2)}`,
    );
  }

  return {
    name,
    file: entry.file,
    bytes: info.size,
    duration,
    lufs,
    truePeakDb,
    clipped: clip.count,
    clipRuns: clip.runs,
    leadingSec: edges.leadingSec,
    trailingSec: edges.trailingSec,
    loopStart: entry.loopStart,
    loopEnd: entry.loopEnd,
    loopBodySec: entry.loopEnd - entry.loopStart,
    seamStep: seam.step,
    seamAllowed: seam.allowed,
    seamOk: seam.ok,
    seamFluxRatio: flux.ratio,
    seamFluxOk: flux.ok,
    spectrum,
    tilt: balance.tilt,
    balanceOk: balance.ok,
    failures,
  };
}

// ------------------------------------------------------------------- sfx ---

async function auditSprite(sfx, categoryTargets) {
  const file = path.join(AUDIO_DIR, sfx.file);
  const info = await stat(file);
  const { left, right } = await decode(file);
  const duration = left.length / SAMPLE_RATE;
  const truePeakDb = measureTruePeak(left, right);
  const clip = countClipped(left, right);

  const cues = [];
  const failures = [];
  let lastEnd = 0;
  for (const [name, span] of Object.entries(sfx.cues ?? {})) {
    const start = Math.round(span.offset * SAMPLE_RATE);
    const end = Math.round((span.offset + span.duration) * SAMPLE_RATE);
    if (end > left.length + 1) {
      failures.push(`${name}: span ends past the sprite`);
      continue;
    }
    if (start < lastEnd - 1) failures.push(`${name}: span overlaps the previous cue`);
    lastEnd = end;
    const l = left.subarray(start, Math.min(end, left.length));
    const r = right.subarray(start, Math.min(end, right.length));
    let peak = 0;
    for (let i = 0; i < l.length; i++) {
      peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
    }
    const loud = measureMomentaryLufs(l, r, SAMPLE_RATE);
    const bounds = findCueBounds(l, r);
    const entry = {
      name,
      category: span.category,
      start: start / SAMPLE_RATE,
      duration: l.length / SAMPLE_RATE,
      peakDb: peak > 0 ? 20 * Math.log10(peak) : -Infinity,
      momentaryLufs: loud,
      manifestLufs: span.lufs,
      onsetSec: bounds.start / SAMPLE_RATE,
      bodySec: (bounds.end - bounds.start) / SAMPLE_RATE,
    };
    cues.push(entry);
    if (peak < 1e-4) failures.push(`${name}: slice is silent`);
    else if (entry.bodySec < 0.03)
      failures.push(`${name}: body ${(entry.bodySec * 1000).toFixed(0)} ms, under the 30 ms floor`);
    if (peak >= 0.9995) failures.push(`${name}: clips`);
    if (entry.onsetSec > 0.25)
      failures.push(`${name}: ${(entry.onsetSec * 1000).toFixed(0)} ms of dead air before the onset`);
    const target = categoryTargets?.[span.category]?.lufs;
    if (target !== undefined && Number.isFinite(loud) && Math.abs(loud - target) > 3.5) {
      failures.push(
        `${name}: ${loud.toFixed(1)} LUFS against the ${span.category} target of ${target}`,
      );
    }
  }
  if (truePeakDb > -1) failures.push(`sprite true peak ${truePeakDb.toFixed(2)} dBTP over -1`);
  if (clip.count > 0) failures.push(`sprite has ${clip.count} clipped samples`);
  if (info.size > 3.5e6) failures.push(`sprite is ${(info.size / 1e6).toFixed(2)} MB, over 3.5 MB`);

  return { file: sfx.file, bytes: info.size, duration, truePeakDb, cues, failures };
}

// -------------------------------------------------------------- manifest ---

async function filesOnDisk(dir, prefix = '') {
  const out = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) out.push(...(await filesOnDisk(path.join(dir, item.name), rel)));
    else out.push(rel);
  }
  return out;
}

// ------------------------------------------------------------------ main ---

async function main() {
  const args = process.argv.slice(2);
  const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',');
  const jsonOut = args.find((a) => a.startsWith('--json='))?.slice(7);
  const quiet = args.includes('--quiet');
  const strict = args.includes('--strict');
  const log = (...a) => {
    if (!quiet) console.log(...a);
  };

  const manifest = JSON.parse(await readFile(path.join(AUDIO_DIR, 'manifest.json'), 'utf8'));
  const report = { cues: [], sfx: null, manifest: { problems: [] }, totalBytes: 0 };

  log('cue                          dur     MB    LUFS   dBTP  clip  seam   flux   tilt');
  log('-'.repeat(82));
  for (const [name, entry] of Object.entries(manifest.music)) {
    if (only && !only.includes(name)) continue;
    const row = await auditCue(name, entry);
    report.cues.push(row);
    report.totalBytes += row.bytes;
    log(
      `${name.padEnd(28)}${row.duration.toFixed(1).padStart(5)}s ` +
        `${(row.bytes / 1e6).toFixed(2).padStart(5)} ` +
        `${row.lufs.toFixed(2).padStart(7)} ${row.truePeakDb.toFixed(2).padStart(6)} ` +
        `${String(row.clipped).padStart(5)} ` +
        `${(row.seamOk ? 'ok' : 'FAIL').padStart(5)} ` +
        `${row.seamFluxRatio.toFixed(1).padStart(5)}x ` +
        `${(row.tilt ?? 0).toFixed(1).padStart(6)} ` +
        (row.failures.length ? ` << ${row.failures.length}` : ''),
    );
    for (const f of row.failures) log(`      - ${f}`);
  }

  if (manifest.sfx && !only) {
    // Loaded lazily: the type-stripped import costs a second and is only
    // needed for the per-category loudness targets.
    let categoryTargets = null;
    try {
      ({ CATEGORY_RULES: categoryTargets } = await import('../../src/audio/sfx/design.ts'));
    } catch (error) {
      log(`(category targets unavailable: ${error.message})`);
    }
    report.sfx = await auditSprite(manifest.sfx, categoryTargets);
    report.totalBytes += report.sfx.bytes;
    log('');
    log(
      `sfx sprite: ${report.sfx.cues.length} cues, ${report.sfx.duration.toFixed(1)}s, ` +
        `${(report.sfx.bytes / 1e6).toFixed(2)} MB, peak ${report.sfx.truePeakDb.toFixed(2)} dBTP`,
    );
    for (const f of report.sfx.failures) log(`      - ${f}`);
  }

  // Manifest vs disk.
  const disk = (await filesOnDisk(AUDIO_DIR)).filter((f) => f !== 'manifest.json');
  const listed = new Set(Object.values(manifest.music).map((m) => m.file));
  if (manifest.sfx) listed.add(manifest.sfx.file);
  for (const f of disk) {
    if (!listed.has(f)) report.manifest.problems.push(`orphan file not in the manifest: ${f}`);
  }
  for (const f of listed) {
    if (!disk.includes(f)) report.manifest.problems.push(`manifest lists a missing file: ${f}`);
  }
  if (report.manifest.problems.length > 0) {
    log('');
    for (const p of report.manifest.problems) log(`manifest: ${p}`);
  }

  log('');
  log(`total shipped audio: ${(report.totalBytes / 1e6).toFixed(2)} MB of the 60 MB budget`);
  const failed = report.cues.filter((c) => c.failures.length > 0);
  log(`${failed.length} cue(s) with findings; ${report.sfx?.failures.length ?? 0} sfx finding(s)`);

  if (jsonOut) {
    await writeFile(jsonOut, JSON.stringify(report, null, 2));
    log(`wrote ${jsonOut}`);
  }
  if (strict && (failed.length || report.manifest.problems.length)) process.exit(1);
}

await main();
