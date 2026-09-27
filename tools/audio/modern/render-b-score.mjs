#!/usr/bin/env node
/**
 * Direction B for the whole score (Bailey, 2026-09-27: "7 is the only one that
 * sounds good"). Every music cue in public/audio/manifest.json goes through the
 * exact graph that made the clip he picked (tools/audio/ace-step.mjs
 * buildGraph: ace_step_v1_3.5b, euler / simple, 50 steps, cfg 5, shift 5,
 * Reinhard tonemap 1.0, lyrics "[inst]", restyle of the shipped render by
 * denoise), at full length, with the per-cue words in b-score-cues.mjs.
 *
 *   node tools/audio/modern/render-b-score.mjs [--only=cue,cue] [--macalania] [--no-gpu]
 *     --seeds=101,202,303   takes per cue (default; 101 made Bailey's clip)
 *     --denoise=0.40        the strength of Bailey's clip; --fallback=0.35 if no take keeps the tempo
 *
 * PICK RULE (written before any full-score take was measured): among the takes
 * at 0.40 whose autocorrelation tempo, octave-folded, is within 3 % of the
 * source's, the one with the highest structureFidelity (ace-measure.py: onset
 * F, 4-bar window correlation, chroma gain; the metric sketch B ranked by).
 * If no take keeps the tempo, the same seeds at 0.35 under the same rule; if
 * still none, the best 0.35 take is used and the cue is FLAGGED in the report.
 * No take is ever chosen by a listening claim (hard rule 13).
 *
 * THEN, per cue: the pick is shifted by the median lag of its correlated 4-bar
 * windows (so the manifest's loop points still land on the same music), fit
 * to the shipped file's length, and the loop is repaired: the last beat
 * (0.3 to 1.0 s) before loopEnd crossfades, equal power, into the take's own
 * audio just before loopStart, and the 3 s run-on after loopEnd is rebuilt
 * from the loop head (the shipped file layout, tools/audio/render.mjs). The
 * intro before loopStart (the victory fanfares, every cue's stinger) is the
 * take itself, untouched. Loudness: gain to -16 LUFS integrated, the project's
 * look-ahead limiter at -1.4 dBTP (tools/audio/master.mjs), no second bus
 * compressor; MP3 through libmp3lame -q:a 5 like render.mjs, re-limited 0.3 dB
 * lower if the decode overshoots -1 dBTP.
 *
 * OUT: public/audio/candidates/direction-b-2026-09-27/<cue>.mp3 + manifest.json
 * (same loop points as the shipped manifest; audited by tools/audio/qa.mjs with
 * PYREFLY_QA_AUDIO_DIR). Nothing in public/audio/music/ or the game's manifest
 * is touched. Raw takes, WAV masters and measurements live in WORK (on D:).
 * GPU: waits for ComfyUI's queue (ACE_MAX_AHEAD, default 2 here); an
 * out-of-memory error stops the run instead of retrying.
 *
 * Game case: BOTH (one pipeline; the words per cue are per game, see b-score-cues.mjs).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.ACE_MAX_AHEAD ??= '2';
const { buildGraph, generate, upload, loudness } = await import('../ace-step.mjs');
const { decodeStereo, writeWavS16, writeWavS16Mono, writeWavF32, shiftEarlier, fitLength } = await import('./pcm.mjs');
const { measurePair, alignmentLagMs } = await import('./texture.mjs');
const { FFMPEG } = await import('./loudness.mjs');
const { limit } = await import('../master.mjs');
const { measureLufs, measureTruePeak } = await import('../measure.mjs');
const { B_CUES, MACALANIA } = await import('./b-score-cues.mjs');

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, 'public/audio/candidates/direction-b-2026-09-27');
const OUT_SKETCH = path.join(ROOT, 'public/audio/candidates/direction-b-sketches-2026-09-27');
const WORK = process.env.B_WORK || 'D:/Tools/pyrefly-scratch/direction-b-0927-work';
const REPORT = path.join(ROOT, 'docs/audio/direction-b-2026-09-27.json');
const RATE = 44100;
const TARGET_LUFS = -16;

const arg = (n, d) => process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? d;
const flag = (n) => process.argv.includes(`--${n}`);
const SEEDS = arg('seeds', '101,202,303').split(',').map(Number);
const DENOISE = Number(arg('denoise', '0.40'));
const FALLBACK = Number(arg('fallback', '0.35'));
const EXTRA_SEEDS = [404, 505, 606];
const LOW_FIDELITY = 0.35;
const rel = (f) => path.relative(ROOT, f).replaceAll('\\', '/');

class OutOfMemory extends Error {}

async function ff(args) {
  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { maxBuffer: 64 << 20, windowsHide: true });
}

const fold = (est, bpm) => (est > 0 ? est * 2 ** Math.round(Math.log2(bpm / est)) : 0);
/**
 * AMENDED after the first full pass (2026-09-27, written in the report): the
 * source's own autocorrelation tempo misses its written bpm on slow or
 * unpulsed cues (boss-yojimbo reads 88.25 for 132, boss-dread 130.5 for 90),
 * so a take is also counted as keeping the tempo when it lands within 3 % of
 * the WRITTEN bpm (octave-folded). The first-pass verdicts stay in the report.
 */
function keepsTempo(m, bpm) {
  const src = fold(m?.source?.tempoEst ?? 0, bpm);
  const cand = fold(m?.tempoEst ?? 0, bpm);
  if (cand <= 0) return false;
  return (src > 0 && Math.abs(cand - src) / src <= 0.03) || Math.abs(cand - bpm) / bpm <= 0.03;
}

/** One take, cached in WORK/raw by cue, denoise and seed. */
async function take(key, spec, uploaded, srcMono, denoise, seed, noGpu) {
  const stem = `B-${key}-d${Math.round(denoise * 100)}-s${seed}`;
  const raw = path.join(WORK, 'raw', `${stem}.flac`);
  let gpuSeconds = null;
  if (!existsSync(raw)) {
    if (noGpu) return null;
    const graph = buildGraph({ tags: spec.tags, seed, denoise, latentFrom: { audio: uploaded }, prefix: `pyrefly-ace/b-score/${stem}` });
    process.stderr.write(`[B] ${stem}: queueing\n`);
    try {
      const r = await generate(graph);
      writeFileSync(raw, r.buf);
      gpuSeconds = Number(r.seconds.toFixed(1));
    } catch (e) {
      if (/out of memory|OutOfMemory|CUDA error/i.test(String(e.message))) throw new OutOfMemory(`${stem}: ${e.message}`);
      throw e;
    }
  }
  const mono = path.join(WORK, 'mono', `${stem}.wav`);
  if (!existsSync(mono)) await ff(['-i', raw, '-ac', '1', '-ar', String(RATE), '-c:a', 'pcm_s16le', mono]);
  const cache = path.join(WORK, 'measure', `${stem}.json`);
  let m;
  if (existsSync(cache)) m = JSON.parse(readFileSync(cache, 'utf8'));
  else {
    m = await measurePair(mono, srcMono, spec.bpm);
    writeFileSync(cache, JSON.stringify(m));
  }
  const tempoOk = keepsTempo(m, spec.bpm);
  process.stderr.write(`[B] ${stem}: fidelity ${m.structureFidelity} tempo ${m.tempoEstFolded} (src ${m.source?.tempoEst}) ${tempoOk ? 'kept' : 'MOVED'}\n`);
  return { stem, raw, seed, denoise, gpuSeconds, tempoOk, measure: m };
}

function pick(takes) {
  const ok = takes.filter((t) => t && t.tempoOk).sort((a, b) => (b.measure.structureFidelity ?? 0) - (a.measure.structureFidelity ?? 0));
  return ok[0] ?? null;
}

/** Shift, fit, loop-repair, master to -16 LUFS / -1 dBTP, encode MP3, verify the decode. */
async function finish(best, { frames, loopStart, loopEnd, bpm, outMp3, masterWav }) {
  const d = await decodeStereo(best.raw, { rate: RATE });
  // Shift only on evidence: at least 3 correlated 4-bar windows and a lag
  // inside the model's known constant offset (sketch B measured 10-30 ms).
  // A median of one or two weak windows (boss-seymour read 230 ms, one eighth
  // at 132 bpm, from 2 of 13 windows) is correlator ambiguity, not an offset.
  const { lagMs: lagSeen, windows } = alignmentLagMs(best.measure);
  const lagMs = windows >= 3 && Math.abs(lagSeen) <= 60 ? lagSeen : 0;
  const lag = Math.round((lagMs / 1000) * RATE);
  const left = fitLength(shiftEarlier(d.left, lag), frames);
  const right = fitLength(shiftEarlier(d.right, lag), frames);
  const xfadeSec = Math.min(1.0, Math.max(0.3, 60 / bpm));
  if (loopEnd != null) {
    const ls = Math.round(loopStart * RATE);
    const le = Math.round(loopEnd * RATE);
    const F = Math.round(xfadeSec * RATE);
    for (let i = 0; i < F; i++) {
      const u = (i + 0.5) / F;
      const a = Math.cos((u * Math.PI) / 2);
      const b = Math.sin((u * Math.PI) / 2);
      left[le - F + i] = left[le - F + i] * a + left[ls - F + i] * b;
      right[le - F + i] = right[le - F + i] * a + right[ls - F + i] * b;
    }
    for (let k = 0; le + k < frames; k++) {
      left[le + k] = left[ls + k];
      right[le + k] = right[ls + k];
    }
  }
  const before = measureLufs(left, right, RATE);
  const gainDb = Math.min(18, TARGET_LUFS - before);
  const g = 10 ** (gainDb / 20);
  for (let i = 0; i < frames; i++) { left[i] *= g; right[i] *= g; }
  let ceilingDb = -1.4;
  let tp = 0;
  let lufs = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    limit({ left, right }, RATE, 10 ** (ceilingDb / 20));
    writeWavF32(masterWav, left, right, RATE);
    await ff(['-i', masterWav, '-codec:a', 'libmp3lame', '-q:a', '5', '-ar', String(RATE), '-ac', '2', outMp3]);
    const dec = await decodeStereo(outMp3, { rate: RATE });
    tp = measureTruePeak(dec.left, dec.right);
    lufs = measureLufs(dec.left, dec.right, RATE);
    if (tp <= -1.05) break;
    ceilingDb -= 0.3;
  }
  return { lagMs, lagSeenMs: lagSeen, lagWindows: windows, xfadeSec, gainDb: Number(gainDb.toFixed(2)), ceilingDb: Number(ceilingDb.toFixed(2)), lufs: Number(lufs.toFixed(2)), truePeakDb: Number(tp.toFixed(2)) };
}

async function renderOne(key, spec, srcFile, loop, noGpu) {
  const src = await decodeStereo(srcFile, { rate: RATE });
  const srcWav = path.join(WORK, 'src', `${key}.wav`);
  const srcMono = path.join(WORK, 'src', `${key}-mono.wav`);
  if (!existsSync(srcWav)) writeWavS16(srcWav, src.left, src.right, RATE);
  if (!existsSync(srcMono)) writeWavS16Mono(srcMono, src.left, src.right, RATE);
  const uploaded = noGpu ? null : await upload(srcWav);
  const tried = [];
  let best = null;
  for (const dn of [DENOISE, FALLBACK]) {
    for (const s of SEEDS) tried.push(await take(key, spec, uploaded, srcMono, dn, s, noGpu));
    best = pick(tried.filter((t) => t?.denoise === dn));
    // AMENDED (same day, before listening): a pick that kept less than 0.35
    // of the structure gets three more seeds at the same strength.
    if (best && (best.measure.structureFidelity ?? 0) < LOW_FIDELITY) {
      for (const s of EXTRA_SEEDS) tried.push(await take(key, spec, uploaded, srcMono, dn, s, noGpu));
      best = pick(tried.filter((t) => t?.denoise === dn));
    }
    if (best) break;
  }
  let flagged = null;
  if (!best) {
    const pool = tried.filter((t) => t && t.denoise === FALLBACK);
    if (!pool.length) return { key, failed: 'no takes rendered' };
    best = pool.sort((a, b) => (b.measure.structureFidelity ?? 0) - (a.measure.structureFidelity ?? 0))[0];
    flagged = `no take kept the tempo within 3 % at ${DENOISE} or ${FALLBACK}; best ${FALLBACK} take used`;
  }
  return { key, src, srcMono, best, tried, flagged };
}

function summary(t) {
  const { lagWindows, ...m } = t.measure;
  return { stem: t.stem, seed: t.seed, denoise: t.denoise, gpuSeconds: t.gpuSeconds, tempoKept: t.tempoOk, measure: m };
}

async function main() {
  for (const d of ['raw', 'mono', 'measure', 'src', 'master']) mkdirSync(path.join(WORK, d), { recursive: true });
  mkdirSync(OUT, { recursive: true });
  const noGpu = flag('no-gpu');
  const only = arg('only', null)?.split(',');
  const shipped = JSON.parse(readFileSync(path.join(ROOT, 'public/audio/manifest.json'), 'utf8'));
  const report = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : {};
  Object.assign(report, {
    generatedBy: 'tools/audio/modern/render-b-score.mjs',
    method: { ckpt: 'ace_step_v1_3.5b.safetensors', seeds: SEEDS, denoise: DENOISE, fallback: FALLBACK, lyrics: '[inst]', sampler: 'euler/simple, 50 steps, cfg 5, shift 5, Reinhard 1.0' },
    cues: report.cues ?? {},
    sketches: report.sketches ?? {},
  });
  const candManifestFile = path.join(OUT, 'manifest.json');
  const cand = existsSync(candManifestFile) ? JSON.parse(readFileSync(candManifestFile, 'utf8')) : { version: 1, sampleRate: RATE, music: {} };
  const save = () => {
    writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(candManifestFile, `${JSON.stringify(cand, null, 2)}\n`);
  };

  try {
    const names = flag('macalania-only') ? [] : Object.keys(shipped.music).filter((n) => !only || only.includes(n));
    for (const name of names) {
      const entry = shipped.music[name];
      const spec = B_CUES[name];
      if (!spec) { report.cues[name] = { failed: 'no words in b-score-cues.mjs' }; continue; }
      const r = await renderOne(name, spec, path.join(ROOT, 'public/audio', entry.file), true, noGpu);
      if (r.failed) { report.cues[name] = { failed: r.failed }; save(); continue; }
      const outMp3 = path.join(OUT, `${name}.mp3`);
      const fin = await finish(r.best, {
        frames: r.src.left.length, loopStart: entry.loopStart, loopEnd: entry.loopEnd, bpm: spec.bpm,
        outMp3, masterWav: path.join(WORK, 'master', `${name}.wav`),
      });
      const dyn = await loudness(outMp3);
      cand.music[name] = {
        file: `${name}.mp3`, loopStart: entry.loopStart, loopEnd: entry.loopEnd, duration: entry.duration,
        bytes: statSync(outMp3).size, lufs: fin.lufs, truePeakDb: fin.truePeakDb, ...(entry.score ? { score: entry.score } : {}),
      };
      report.cues[name] = {
        game: spec.game, plays: spec.plays, key: spec.key, bpm: spec.bpm, meter: spec.meter, tags: spec.tags,
        duration: entry.duration, loopStart: entry.loopStart, loopEnd: entry.loopEnd,
        file: rel(outMp3), pick: r.best.stem, flagged: r.flagged, finish: fin, lra: dyn.lra,
        takes: r.tried.filter(Boolean).map(summary),
      };
      save();
      process.stderr.write(`[B] ${name}: ${r.best.stem} -> ${rel(outMp3)} ${fin.lufs} LUFS ${fin.truePeakDb} dBTP${r.flagged ? ' FLAGGED' : ''}\n`);
    }
    if (flag('macalania') || flag('macalania-only')) {
      mkdirSync(OUT_SKETCH, { recursive: true });
      for (const [letter, spec] of Object.entries(MACALANIA)) {
        const key = `macalania-${letter.toLowerCase()}`;
        const r = await renderOne(key, spec, path.join(ROOT, spec.file), false, noGpu);
        if (r.failed) { report.sketches[key] = { failed: r.failed }; save(); continue; }
        const outMp3 = path.join(OUT_SKETCH, `${path.basename(spec.file, '.mp3')}-B.mp3`);
        const fin = await finish(r.best, { frames: r.src.left.length, loopEnd: null, bpm: spec.bpm, outMp3, masterWav: path.join(WORK, 'master', `${key}.wav`) });
        report.sketches[key] = { source: spec.file, tags: spec.tags, file: rel(outMp3), pick: r.best.stem, flagged: r.flagged, finish: fin, takes: r.tried.filter(Boolean).map(summary) };
        save();
      }
    }
  } catch (e) {
    if (e instanceof OutOfMemory) {
      report.stoppedOn = `OUT OF MEMORY, run stopped (not retried): ${e.message}`;
      save();
      process.stderr.write(`[B] ${report.stoppedOn}\n`);
      process.exit(2);
    }
    throw e;
  }
  save();
}

main().catch((e) => {
  process.stderr.write(`${e.stack || e}\n`);
  process.exit(1);
});
