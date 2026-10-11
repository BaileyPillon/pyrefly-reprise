#!/usr/bin/env node
/**
 * Narrow a shipped music cue in mid/side until it passes the THEMES.md stereo gate (driver item 53e, 2026-10-11; PR-0425).
 *
 *   node tools/audio/stereo-narrow.mjs --out=DIR [--in=DIR] [--cue=a,b] [--side=-7.5] [--install]
 *   node tools/audio/stereo-narrow.mjs --out=DIR --measure [--in=DIR] [--cue=a,b]    (measure only: writes <cue>.measure.json, changes nothing)
 *
 * Why: the ElevenLabs takes are wide and partly decorrelated, so most fail the stereo gate (L/R correlation 0.60 to 0.85, side-to-mid
 * -10 to -6 dB, mono-sum loss no worse than -1 dB; `tools/audio/stereo-gate.mjs`). Mid/side is exact and instantaneous: M = (L+R)/2 stays,
 * S = (L-R)/2 is scaled by one broadband gain g < 1, and L = M+gS, R = M-gS. Nothing moves in time, so the length, the loop points and the
 * 3 s run-on are the input's, sample for sample. Correlation and side-to-mid follow from the side/mid power ratio r alone:
 * corr = (1-r)/(1+r), mono loss = -10 log10(1+r); the target `--side` is that ratio in dB (default -7.5 dB: corr 0.70, mono loss -0.70).
 *
 * Per cue (default: the nine cues of the finding):
 *   1. decode `<in>/<cue>.mp3` (default `public/audio/music`), once;
 *   2. scale the side channel, then one linear gain to -16 LUFS (the ship chain's rule);
 *   3. encode LAME V4 (`-q:a 4`, 44.1 kHz stereo, the Info header on, as the lane pipelines did), decode what was written and measure
 *      that, because the decoded MP3 is what a player hears: loudness (tools/audio/measure.mjs, and ffmpeg ebur128 as a second opinion),
 *      true peak, the stereo gate, the loop seam; repeat the gain (and the side gain, if the encode moved the ratio) until all hold.
 * It refuses a result whose length differs from the input's, whose true peak is over -1.2 dBTP or whose stereo gate fails, and never
 * touches `public/audio` unless `--install` is given. `--install` copies each file in and rewrites that cue's `bytes`, `lufs` and
 * `truePeakDb` in the manifest (under the manifest lock, as text, no other byte changes); `loopStart`, `loopEnd`, `duration` and `source`
 * are not touched, and the tool checks they still describe the new file.
 *
 * Game case: both (shared tooling). The cues it is run on are listed per game in the record (FFX-2: boss-bahamut, boss-leblanc,
 * boss-ffx2-fallen-aeons, boss-trema; FFX: boss-seymour-natus, boss-isaaru, boss-sin-assault, boss-sin-countdown; FF7: boss-ff7-guard).
 */

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkSpectralBalance, measureLufs, measureSeam, measureSpectrum, measureTruePeak } from './measure.mjs';
import { setMusicEntryText, withManifestLock } from './manifest-io.mjs';
import { FFMPEG, SAMPLE_RATE, STEREO_GATE, decodeStereo, judgeStereo, measureStereo } from './stereo-gate.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIO = join(ROOT, 'public/audio');
const MANIFEST = join(AUDIO, 'manifest.json');
export const NINE = [
  'boss-bahamut',
  'boss-leblanc',
  'boss-ffx2-fallen-aeons',
  'boss-trema',
  'boss-seymour-natus',
  'boss-isaaru',
  'boss-sin-assault',
  'boss-sin-countdown',
  'boss-ff7-guard',
];
const TARGET_LUFS = -16;
const LUFS_TOLERANCE = 0.04; // the lane pipelines' own tolerance on the encoded file (ebur128 prints one decimal, so: exactly -16.0)
const TP_CEILING = -1.2; // the gate is -1 dBTP; 0.2 dB of room for the browser's decoder
const SIDE_TOLERANCE_DB = 0.15;

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const round = (x, digits) => Number(x.toFixed(digits));
const db = (x) => 10 * Math.log10(x);

function flag(args, name) {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  return hit === undefined ? undefined : hit.includes('=') ? hit.slice(name.length + 3) : true;
}

/** Encode interleaved float32 stereo to LAME V4 at `path`. */
function encodeMp3(left, right, path) {
  const inter = new Float32Array(left.length * 2);
  for (let i = 0; i < left.length; i++) {
    inter[2 * i] = left[i];
    inter[2 * i + 1] = right[i];
  }
  const run = spawnSync(
    FFMPEG,
    ['-y', '-v', 'error', '-f', 'f32le', '-ar', String(SAMPLE_RATE), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-q:a', '4', '-ar', String(SAMPLE_RATE), '-ac', '2', path],
    { input: Buffer.from(inter.buffer), maxBuffer: 1 << 28 },
  );
  if (run.status !== 0) throw new Error(`ffmpeg encode failed: ${run.stderr?.toString()}`);
}

/**
 * A look-ahead brick-wall limiter (the lane pipelines' own, ported): the gain dips over +-441 samples (10 ms) around every sample that would pass
 * the ceiling, then is smoothed with a 441-sample Hann window, so a lone transient loses a fraction of a dB for a few milliseconds. In place on
 * both channels together. Returns the number of samples over the ceiling and the largest gain reduction in dB.
 */
function limit(left, right, ceilDb, look = 441) {
  const n = left.length;
  const ceil = 10 ** (ceilDb / 20);
  const dip = new Float64Array(n).fill(1);
  let over = 0;
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(left[i]), Math.abs(right[i]));
    if (p <= ceil) continue;
    over++;
    const g = ceil / p;
    for (let j = Math.max(0, i - look); j < Math.min(n, i + look + 1); j++) if (g < dip[j]) dip[j] = g;
  }
  if (!over) return { over, reductionDb: 0 };
  const w = new Float64Array(look);
  let sum = 0;
  for (let k = 0; k < look; k++) {
    w[k] = 0.5 - 0.5 * Math.cos((2 * Math.PI * k) / (look - 1));
    sum += w[k];
  }
  const half = look >> 1;
  // Only samples within half a window of a dipped sample can differ from 1: find them with a forward and a backward sweep.
  const near = new Uint8Array(n);
  for (let i = 0, reach = -1; i < n; i++) {
    if (dip[i] < 1) reach = i + half;
    if (i <= reach) near[i] = 1;
  }
  for (let i = n - 1, reach = n; i >= 0; i--) {
    if (dip[i] < 1) reach = i - half;
    if (i >= reach) near[i] = 1;
  }
  let min = 1;
  const gain = new Float64Array(n).fill(1);
  for (let i = 0; i < n; i++) {
    if (!near[i]) continue;
    let acc = 0;
    for (let k = 0; k < look; k++) {
      const j = i + k - half;
      acc += w[k] * (j < 0 || j >= n ? 1 : dip[j]);
    }
    gain[i] = Math.min(1, acc / sum);
    if (gain[i] < min) min = gain[i];
  }
  for (let i = 0; i < n; i++) {
    left[i] *= gain[i];
    right[i] *= gain[i];
  }
  return { over, reductionDb: -20 * Math.log10(min) };
}

/** ffmpeg's ebur128 on a file: integrated loudness, true peak and loudness range, as the lane pipelines recorded them. */
function ebur(path) {
  const run = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const tail = run.stderr.slice(run.stderr.lastIndexOf('Summary:'));
  const grab = (re) => Number(re.exec(tail)?.[1]);
  return { lufs: grab(/I:\s+(-?[\d.]+) LUFS/), truePeakDb: grab(/Peak:\s+(-?[\d.]+) dBFS/), lra: grab(/LRA:\s+(-?[\d.]+) LU/) };
}

/**
 * The lane pipelines' click ratio (batchloop.py `seam_metrics`, the Leblanc lane's before it): the step across the wrap, the larger of the two
 * channels' |d[le] - d[le-1]|, over the 99th percentile of the same per-sample step within 50 ms either side. Under 1.0 = no click the music
 * does not already have.
 */
function clickRatio(left, right, le) {
  const w = Math.round(0.05 * SAMPLE_RATE);
  const step = Math.max(Math.abs(left[le] - left[le - 1]), Math.abs(right[le] - right[le - 1]));
  const local = [];
  for (let i = le - w + 1; i < le + w; i++) local.push(Math.max(Math.abs(left[i] - left[i - 1]), Math.abs(right[i] - right[i - 1])));
  local.sort((a, b) => a - b);
  const pos = 0.99 * (local.length - 1); // numpy.percentile, linear interpolation
  const lo = Math.floor(pos);
  const p99 = local[lo] + (local[Math.min(lo + 1, local.length - 1)] - local[lo]) * (pos - lo);
  return step / (p99 + 1e-12);
}

/** Everything the record keeps about one decoded file. */
function describeFile(file, entry) {
  const { left, right } = decodeStereo(file);
  const stereo = measureStereo(left, right);
  const verdict = judgeStereo(stereo);
  const ls = Math.round(entry.loopStart * SAMPLE_RATE);
  const le = Math.round(entry.loopEnd * SAMPLE_RATE);
  const seam = measureSeam(left, right, ls, le);
  const balance = checkSpectralBalance(measureSpectrum(left, right, SAMPLE_RATE));
  return {
    samples: left.length,
    stereo,
    verdict,
    lufs: measureLufs(left, right, SAMPLE_RATE),
    truePeakDb: measureTruePeak(left, right),
    seam: { step: seam.step, allowed: seam.allowed, ratio: seam.step / seam.allowed, ok: seam.ok, clickRatio: clickRatio(left, right, le) },
    tilt: balance.tilt,
    balanceOk: balance.ok,
    ebur: ebur(file),
    left,
    right,
  };
}

/** The fields the record keeps about one measured file. */
function summarise(d, file) {
  return {
    bytes: statSync(file).size,
    sha256: sha256(file),
    decodedSamples: d.samples,
    stereo: { corr: round(d.stereo.corr, 3), sideMid: round(d.stereo.sideMid, 2), monoLoss: round(d.stereo.monoLoss, 2), gate: d.verdict.ok },
    lufs: round(d.lufs, 2), // tools/audio/measure.mjs, the qa.mjs reading
    truePeakDb: round(d.truePeakDb, 2),
    ebur128: { lufs: d.ebur.lufs, truePeakDb: d.ebur.truePeakDb, lra: d.ebur.lra }, // ffmpeg, the reading the manifest carries
    seam: { step: round(d.seam.step, 5), allowed: round(d.seam.allowed, 5), ratio: round(d.seam.ratio, 3), clickRatio: round(d.seam.clickRatio, 3) },
  };
}

/** Narrow one cue; returns the report (the file is at `outFile`). */
function narrowCue(cue, inDir, outDir, sideDb, entry) {
  const inFile = join(inDir, `${cue}.mp3`);
  const outFile = join(outDir, `${cue}.mp3`);
  const before = describeFile(inFile, entry);
  const { left: L, right: R } = before;
  const n = L.length;
  let em = 0;
  let es = 0;
  for (let i = 0; i < n; i++) {
    const m = (L[i] + R[i]) / 2;
    const s = (L[i] - R[i]) / 2;
    em += m * m;
    es += s * s;
  }
  // The side gain that puts side/mid at the target; if the file is already narrower, leave the side alone.
  let sideGain = Math.min(1, Math.sqrt(10 ** (sideDb / 10) * em / es));
  let gainDb = 0;
  let ceilDb = null; // the limiter is switched on only if the true peak is over the ceiling once loudness and side have settled
  let limiter = null;
  let after;
  let iterations = 0;
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  for (; iterations < 12; iterations++) {
    const g = 10 ** (gainDb / 20);
    for (let i = 0; i < n; i++) {
      const m = (L[i] + R[i]) / 2;
      const s = ((L[i] - R[i]) / 2) * sideGain;
      left[i] = g * (m + s);
      right[i] = g * (m - s);
    }
    limiter = ceilDb === null ? null : { ceilingDbfs: round(ceilDb, 2), ...limit(left, right, ceilDb) };
    encodeMp3(left, right, outFile);
    after = describeFile(outFile, entry);
    const lufsErr = TARGET_LUFS - after.ebur.lufs; // ffmpeg ebur128, one decimal: the ship chain's own reading of -16 LUFS
    const sideErr = sideDb - after.stereo.sideMid;
    const tpOver = Math.max(after.truePeakDb, after.ebur.truePeakDb) - TP_CEILING;
    const settled = Math.abs(lufsErr) <= LUFS_TOLERANCE && Math.abs(sideErr) <= SIDE_TOLERANCE_DB;
    if (settled && tpOver <= 0) break;
    if (tpOver > 0 && (settled || ceilDb !== null)) ceilDb = ceilDb === null ? TP_CEILING - 0.5 : ceilDb - tpOver - 0.05;
    gainDb += lufsErr;
    if (Math.abs(sideErr) > SIDE_TOLERANCE_DB) sideGain *= 10 ** (sideErr / 20); // the encode moved the ratio: nudge
  }
  const failures = [];
  if (after.samples !== n) failures.push(`length ${after.samples} samples, input ${n}`);
  if (Math.abs(after.ebur.lufs - TARGET_LUFS) > LUFS_TOLERANCE) failures.push(`LUFS ${after.ebur.lufs}`);
  if (after.truePeakDb > TP_CEILING) failures.push(`true peak ${after.truePeakDb.toFixed(2)} dBTP over ${TP_CEILING}`);
  if (after.ebur.truePeakDb > TP_CEILING) failures.push(`ebur128 true peak ${after.ebur.truePeakDb} dBTP over ${TP_CEILING}`);
  if (!after.verdict.pass) failures.push(`stereo gate fails: ${JSON.stringify(after.stereo)}`);
  if (!after.seam.ok) failures.push(`seam step ${after.seam.step} over ${after.seam.allowed}`);
  return {
    cue,
    method: { sideGainLinear: round(sideGain, 4), sideGainDb: round(db(sideGain ** 2), 2), masterGainDb: round(gainDb, 2), targetSideMidDb: sideDb, limiter, iterations: iterations + 1, encoder: 'libmp3lame -q:a 4' },
    before: summarise(before, inFile),
    after: summarise(after, outFile),
    failures,
  };
}

async function install(reports, outDir) {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  for (const r of reports) {
    const entry = manifest.music[r.cue];
    const file = join(outDir, `${r.cue}.mp3`);
    const bytes = statSync(file).size;
    const next = { ...entry, bytes, lufs: round(r.after.ebur128.lufs, 1), truePeakDb: round(r.after.ebur128.truePeakDb, 1) };
    // The loop points, duration and source are the input's; the new file must still carry them.
    if (Math.abs(r.after.decodedSamples / SAMPLE_RATE - entry.duration) > 0.0001) throw new Error(`${r.cue}: duration changed`);
    copyFileSync(file, join(AUDIO, 'music', `${r.cue}.mp3`));
    await withManifestLock(AUDIO, () => {
      const text = setMusicEntryText(readFileSync(MANIFEST, 'utf8'), r.cue, next);
      const temp = `${MANIFEST}.tmp-${process.pid}`;
      writeFileSync(temp, text);
      renameSync(temp, MANIFEST);
    });
    console.log(`installed ${r.cue}: ${bytes} bytes, lufs ${next.lufs}, truePeakDb ${next.truePeakDb}`);
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const outDir = flag(args, 'out');
  if (typeof outDir !== 'string') {
    console.log('usage: node tools/audio/stereo-narrow.mjs --out=DIR [--in=DIR] [--cue=a,b] [--side=-7.5] [--install | --measure]');
    process.exit(1);
  }
  const inDir = typeof flag(args, 'in') === 'string' ? flag(args, 'in') : join(AUDIO, 'music');
  const cues = typeof flag(args, 'cue') === 'string' ? flag(args, 'cue').split(',') : NINE;
  const sideDb = typeof flag(args, 'side') === 'string' ? Number(flag(args, 'side')) : -7.5;
  mkdirSync(outDir, { recursive: true });
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const reports = [];
  for (const cue of cues) {
    const entry = manifest.music[cue];
    if (!entry) throw new Error(`${cue} is not in the manifest`);
    if (flag(args, 'measure')) {
      const file = join(inDir, `${cue}.mp3`);
      const m = summarise(describeFile(file, entry), file);
      writeFileSync(join(outDir, `${cue}.measure.json`), `${JSON.stringify(m, null, 2)}
`);
      console.log(`${cue.padEnd(24)} corr ${m.stereo.corr} | side/mid ${m.stereo.sideMid} | mono ${m.stereo.monoLoss} | LUFS ${m.ebur128.lufs} (qa ${m.lufs}) TP ${m.truePeakDb} seam ${m.seam.ratio} click ${m.seam.clickRatio}`);
      continue;
    }
    const r = narrowCue(cue, inDir, outDir, sideDb, entry);
    reports.push(r);
    writeFileSync(join(outDir, `${cue}.report.json`), `${JSON.stringify(r, null, 2)}\n`);
    const b = r.before.stereo;
    const a = r.after.stereo;
    console.log(
      `${cue.padEnd(24)} corr ${b.corr} -> ${a.corr} | side/mid ${b.sideMid} -> ${a.sideMid} | mono ${b.monoLoss} -> ${a.monoLoss} | ` +
        `LUFS ${r.after.ebur128.lufs} (qa ${r.after.lufs}) TP ${r.after.truePeakDb} seam ${r.after.seam.ratio} | side ${r.method.sideGainLinear}x master ${r.method.masterGainDb} dB | ${r.failures.length ? `FAIL ${r.failures.join('; ')}` : 'ok'}`,
    );
  }
  if (reports.some((r) => r.failures.length)) process.exit(2);
  if (flag(args, 'install')) await install(reports, outDir);
}
