#!/usr/bin/env node
/**
 * The whole score through remaster R1 "focus", in the game's own format (D-283, 2026-09-29).
 *
 * Bailey, 2026-09-29: "all your recommendations, full speed ahead." Recommendation 1 was the
 * whole soundtrack in R1: the Direction B cues (docs/audio/direction-b-2026-09-27.md) through
 * tools/audio/remaster.py's "focus" preset (docs/audio/remaster-2026-09-29/README.md), shipped
 * exactly as the Chapter VII cue already is (tools/audio/remaster-ship.py: intro, loop body,
 * 3 s run-on rebuilt from the loop head, -16 LUFS, true peak under -1 dBTP, libmp3lame -q:a 5).
 *
 * Game case (AGENTS.md rule 14): BOTH. One chain, every FFX cue, every FFX-2 cue, the shared
 * menu cues. No agent can hear (rule 13): every gate below is a measurement.
 *
 *   node tools/audio/remaster-score.mjs render   [--only=a,b]   R1 into the stage directory
 *   node tools/audio/remaster-score.mjs measure  [--only=a,b]   stereo image + qa.mjs gates
 *   node tools/audio/remaster-score.mjs ship                    passing cues -> public/audio
 *
 * Sources: the lossless Direction B masters, MASTER_DIR/<cue>.wav (float WAV, outside the repo).
 * Loop points: public/audio/manifest.json (the Direction B candidate manifest carries the same
 * ones; a mismatch stops the run). Seam crossfade: one beat, 60 / bpm clamped to 0.3..1.0 s, as
 * the Direction B render did (tools/audio/modern/render-b-score.mjs), bpm from b-score-cues.mjs.
 *
 * Gates (a cue that fails any of them is not shipped; today's file stays):
 *   LUFS -16 +/- 0.5, true peak <= -1 dBTP, L/R correlation 0.6..0.85, side 6..10 dB under the
 *   mid, mono-sum loss under 1 dB, and every tools/audio/qa.mjs gate for the cue (seam step, seam
 *   flux <= 2x the first entry into the loop, clipping, spectrum tilt, silence, manifest agreement).
 */

import { execFile } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { B_CUES } from './modern/b-score-cues.mjs';

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const MASTER_DIR = process.env.PYREFLY_B_MASTERS ?? 'D:/Tools/pyrefly-scratch/direction-b-0927-work/master';
const STAGE = process.env.PYREFLY_R1_STAGE ?? 'D:/Tools/pyrefly-scratch/r31-soundtrack/stage';
const CANDIDATES = join(ROOT, 'public/audio/candidates/direction-b-2026-09-27');
const AUDIO = join(ROOT, 'public/audio');
const REPORT = join(ROOT, 'docs/audio/soundtrack-r1-2026-09-29.json');
const PY = process.env.PYREFLY_PYTHON ?? 'python'; // not PYTHON: some shells set it to a quoted path
const RATE = 44100;

export const GATES = {
  lufs: [-16.5, -15.5],
  truePeakMax: -1.0,
  corr: [0.6, 0.85],
  sideMid: [-10, -6],
  monoLossMin: -1.0,
};

/**
 * Per-cue true-peak ceiling for the encoder loop (remaster-ship.py --tp-max), where the default
 * -1 dBTP by ffmpeg's ebur128 left qa.mjs's own true-peak meter a hair over -1 (2026-09-29 run:
 * scene-zanarkand-dome read -0.99 dBTP in qa.mjs). Level only; nothing else in the chain moves.
 */
const TP_MAX = { 'scene-zanarkand-dome': -1.3 };

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

/** The cues this run owns: every Direction B candidate that the shipped manifest also lists. */
async function cueList(only) {
  const cand = await readJson(join(CANDIDATES, 'manifest.json'));
  const live = await readJson(join(AUDIO, 'manifest.json'));
  const cues = [];
  for (const [name, c] of Object.entries(cand.music)) {
    if (only && !only.includes(name)) continue;
    const e = live.music[name];
    if (!e) throw new Error(`${name}: in the candidate set but not in the shipped manifest`);
    if (Math.abs(e.loopStart - c.loopStart) > 1e-6 || Math.abs(e.loopEnd - c.loopEnd) > 1e-6) {
      throw new Error(`${name}: candidate loop ${c.loopStart}-${c.loopEnd} is not the shipped ${e.loopStart}-${e.loopEnd}`);
    }
    const bpm = B_CUES[name]?.bpm;
    if (!bpm) throw new Error(`${name}: no bpm in b-score-cues.mjs`);
    const xfade = Math.min(1.0, Math.max(0.3, 60 / bpm));
    const src = join(MASTER_DIR, `${name}.wav`);
    if (!existsSync(src)) throw new Error(`${name}: lossless master missing at ${src}`);
    cues.push({ name, src, loopStart: e.loopStart, loopEnd: e.loopEnd, bpm, xfade: Number(xfade.toFixed(4)), live: e });
  }
  return cues;
}

async function render(cues) {
  await mkdir(STAGE, { recursive: true });
  for (const c of cues) {
    const t0 = Date.now();
    const args = [join(HERE, 'remaster-ship.py'), '--in', c.src, '--out', join(STAGE, `${c.name}.mp3`),
      '--preset', 'focus', '--loop', String(c.loopStart), String(c.loopEnd), '--xfade', String(c.xfade),
      '--json', join(STAGE, `${c.name}.ship.json`), ...(TP_MAX[c.name] ? ['--tp-max', String(TP_MAX[c.name])] : [])];
    await run(PY, args, { maxBuffer: 1 << 26 });
    console.log(`${c.name}: rendered in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
}

/** remaster-measure.py on one file: bands, corr, sideMid, monoLoss, LUFS, true peak. */
async function stereo(file) {
  const { stdout } = await run(PY, [join(HERE, 'remaster-measure.py'), file], { maxBuffer: 1 << 26 });
  return JSON.parse(stdout.trim().split('\n').pop());
}

/** Whole-file cross-correlation lag of the shipped file against its source (tools/audio/remaster-align.py). */
async function alignment(src, file) {
  const { stdout } = await run(PY, [join(HERE, 'remaster-align.py'), src, file], { maxBuffer: 1 << 26 });
  return JSON.parse(stdout.trim());
}

async function measure(cues) {
  // qa.mjs over the stage, with a manifest in the shipped layout (file relative to the dir).
  const stageManifest = { version: 1, sampleRate: RATE, music: {} };
  const ship = {};
  for (const c of cues) {
    ship[c.name] = await readJson(join(STAGE, `${c.name}.ship.json`));
    const m = ship[c.name].manifestEntry;
    stageManifest.music[c.name] = { ...m, file: `${c.name}.mp3`, ...(c.live.score ? { score: c.live.score } : {}) };
  }
  await writeFile(join(STAGE, 'manifest.json'), JSON.stringify(stageManifest, null, 2) + '\n');
  const qaJson = join(STAGE, 'qa.json');
  await run(process.execPath, [join(HERE, 'qa.mjs'), `--json=${qaJson}`, '--quiet'], {
    cwd: ROOT, env: { ...process.env, PYREFLY_QA_AUDIO_DIR: STAGE }, maxBuffer: 1 << 26,
  });
  const qa = await readJson(qaJson);
  const rows = [];
  for (const c of cues) {
    const file = join(STAGE, `${c.name}.mp3`);
    const [after, before] = [await stereo(file), await stereo(join(AUDIO, c.live.file))];
    const q = qa.cues.find((r) => r.name === c.name);
    const rep = ship[c.name].report;
    const failures = [];
    const inRange = (v, [lo, hi]) => v >= lo && v <= hi;
    if (!inRange(after.lufs, GATES.lufs)) failures.push(`LUFS ${after.lufs} outside -16 +/- 0.5`);
    if (after.tp > GATES.truePeakMax) failures.push(`true peak ${after.tp} dBTP over -1`);
    if (!inRange(after.corr, GATES.corr)) failures.push(`L/R correlation ${after.corr} outside 0.6-0.85`);
    if (!inRange(after.sideMid, GATES.sideMid)) failures.push(`side ${after.sideMid} dB against the mid, outside -10..-6`);
    if (after.monoLoss < GATES.monoLossMin) failures.push(`mono-sum loss ${after.monoLoss} dB, 1 dB or more`);
    if (!q) failures.push('qa.mjs did not report this cue');
    else for (const f of q.failures) failures.push(`qa: ${f}`);
    // Sample-exact: loopEnd plus the 3 s run-on (a source rendered one sample short keeps its
    // length), anything past that under one MP3 frame (the encoder's tail, never played: the loop
    // wraps at loopEnd), and the music aligned to its lossless source at lag 0 (whole file).
    const keep = Math.round(c.loopEnd * RATE) + 3 * RATE;
    if (rep.outSamples < keep - 1 || rep.outSamples - keep > 1152) {
      failures.push(`length ${rep.outSamples} samples, not loopEnd + 3 s (${keep})`);
    }
    const align = await alignment(c.src, file);
    if (align.lag !== 0) failures.push(`not aligned to the source: lag ${align.lag} samples (corr ${align.corr})`);
    rows.push({
      cue: c.name, game: B_CUES[c.name]?.game, source: c.src.replace(/\\/g, '/'),
      loop: { start: c.loopStart, end: c.loopEnd, startSample: rep.loop[0], endSample: rep.loop[1] },
      bpm: c.bpm, xfadeSec: c.xfade, samples: rep.outSamples, tpMax: rep.tpMax, alignment: align,
      chain: { repairedSideMidDb: rep.repairedSideMidDb, sideGain: rep.sideGain, eqDb: rep.eqDb, gainDb: rep.gainDb, ceilDb: rep.ceilDb, seam: rep.seam },
      after: pick(after), before: { file: c.live.file, ...pick(before) },
      qa: q && { lufs: round(q.lufs), truePeakDb: round(q.truePeakDb), clipped: q.clipped, seamStep: round(q.seamStep, 5),
        seamAllowed: round(q.seamAllowed, 5), seamOk: q.seamOk, seamFluxRatio: round(q.seamFluxRatio), seamFluxOk: q.seamFluxOk,
        balanceOk: q.balanceOk, failures: q.failures },
      manifestEntry: { ...ship[c.name].manifestEntry, ...(c.live.score ? { score: c.live.score } : {}) },
      pass: failures.length === 0, failures,
    });
    console.log(`${c.name}: ${failures.length ? 'FAIL ' + failures.join('; ') : 'pass'}`);
  }
  const prior = existsSync(REPORT) ? await readJson(REPORT) : null;
  const merged = new Map((prior?.cues ?? []).map((r) => [r.cue, r]));
  for (const r of rows) merged.set(r.cue, r);
  const all = [...merged.values()].sort((a, b) => a.cue.localeCompare(b.cue));
  await writeFile(REPORT, JSON.stringify({
    what: 'D-283: every Direction B cue through remaster R1 "focus" (tools/audio/remaster.py via remaster-ship.py), measured before shipping. Measurement only: no agent can hear (AGENTS.md rule 13).',
    game: 'both',
    command: 'node tools/audio/remaster-score.mjs render && node tools/audio/remaster-score.mjs measure && node tools/audio/remaster-score.mjs ship',
    gates: { ...GATES, qa: 'every tools/audio/qa.mjs per-cue gate (seam step, seam flux <= 2x the first entry into the loop, clipping, spectrum tilt, silence, manifest agreement)' },
    measuredWith: 'after/before: tools/audio/remaster-measure.py (corr = L/R Pearson, sideMid = side over mid dB, monoLoss = mono-sum power over mean channel power dB, bands = mid share per band 20-80/80-250/250-800/800-2.5k/2.5-6k/6-12k/12-16k/16k+ Hz); qa: tools/audio/qa.mjs',
    notShipped: all.filter((r) => !r.pass).map((r) => ({ cue: r.cue, reasons: r.failures })),
    cues: all,
  }, null, 1) + '\n');
}

const round = (v, d = 2) => (typeof v === 'number' ? Number(v.toFixed(d)) : v);
const pick = (m) => ({ lufs: m.lufs, truePeakDb: m.tp, corr: m.corr, sideMidDb: m.sideMid, monoLossDb: m.monoLoss, bands: m.bands, lra: m.lra });

async function ship() {
  const report = await readJson(REPORT);
  const manifestPath = join(AUDIO, 'manifest.json');
  const manifest = await readJson(manifestPath);
  const shipped = [];
  for (const r of report.cues) {
    if (!r.pass) continue;
    const entry = manifest.music[r.cue];
    await copyFile(join(STAGE, `${r.cue}.mp3`), join(AUDIO, entry.file));
    const m = r.manifestEntry;
    manifest.music[r.cue] = { ...entry, loopStart: m.loopStart, loopEnd: m.loopEnd, duration: m.duration, bytes: m.bytes, lufs: m.lufs, truePeakDb: m.truePeakDb };
    shipped.push(r.cue);
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`shipped ${shipped.length}: ${shipped.join(', ')}`);
  if (report.notShipped.length) console.log(`kept today's file: ${report.notShipped.map((n) => n.cue).join(', ')}`);
}

const [cmd, ...rest] = process.argv.slice(2);
const only = rest.find((a) => a.startsWith('--only='))?.slice(7).split(',');
if (cmd === 'render') await render(await cueList(only));
else if (cmd === 'measure') await measure(await cueList(only));
else if (cmd === 'ship') await ship();
else {
  console.error('usage: node tools/audio/remaster-score.mjs render|measure|ship [--only=a,b]');
  process.exit(2);
}
