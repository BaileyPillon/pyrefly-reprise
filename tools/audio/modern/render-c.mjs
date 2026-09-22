#!/usr/bin/env node
/**
 * SKETCH C of docs/plans/music-modern-sound.md — the hybrid (option C).
 *
 *   node tools/audio/modern/render-c.mjs                     (battle-ffx + boss-ffx2-aeon, sweep + render)
 *   node tools/audio/modern/render-c.mjs --only=battle-ffx
 *     --seed=101          ACE-Step seed for every texture (default 101)
 *     --denoise=0.45      skip the sweep and use this strength for every layer
 *     --compare-mix       also restyle A's FULL mix with the choir words, to measure the route the brief named
 *     --fresh             re-render textures even if a raw file for the same stem/denoise/seed exists
 *
 * Sketch A's sampled orchestra stays the master: A's float WAV (render-a.mjs must
 * have run) is the bed. Two texture layers go under it, each made by ACE-Step
 * (B's client, tools/audio/ace-step.mjs) from a STEM of A's own render: a choir
 * pad from A's sustained harmony, a low string bed from A's low parts. Each
 * layer is aligned to A by onset correlation, band-limited, loop-repaired and
 * mixed 10 dB (choir) and 12 dB (low bed) under A, then the sum is brought back
 * to -16 LUFS with A's limiter ceiling. See texture.mjs for the words and the
 * pre-registered denoise rule.
 *
 * Writes:
 *   public/audio/candidates/C-<cue>.ogg                 the whole cue, same layout as A (intro + loop + 3 s)
 *   public/audio/candidates/C-<cue>-<layer>-solo-x12.ogg each texture alone, 12 s, at -16 LUFS so it can be heard
 *   build/audio-candidates/C-<cue>.wav                  float WAV (gitignored)
 *   build/audio-candidates/c-work/                      stems, raw ACE-Step output (gitignored)
 *   docs/audio/sketch-c-report.json                     every measurement
 * Nothing in public/audio/manifest.json, public/audio/music/ or src/audio/ is touched.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const RATE = 44100;

const { renderCue } = await import('./render-a.mjs');
const { Hall } = await import('../../../src/audio/dsp/hall.ts');
const { synthHallIr, matchEnergy, hallEnergy } = await import('./hall-ir.mjs');
const { limit } = await import('../master.mjs');
const { measureAll, measureLufs, measureTruePeak } = await import('../measure.mjs');
const { measureDynamics, toOgg } = await import('./loudness.mjs');
const { decodeStereo, writeWavF32, writeWavS16, writeWavS16Mono } = await import('./pcm.mjs');
const T = await import('./texture.mjs');

const flags = new Map(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('=');
  return [k, v ?? 'true'];
}));
const CUES = (flags.get('only') ?? 'battle-ffx,boss-ffx2-aeon').split(',').map((s) => s.trim()).filter(Boolean);
const SEED = Number(flags.get('seed') ?? 101);
const FIXED = flags.has('denoise') ? Number(flags.get('denoise')) : null;
const OUT = join(ROOT, 'public/audio/candidates');
const WAVS = join(ROOT, 'build/audio-candidates');
const WORK = join(WAVS, 'c-work');
const REPORT = join(ROOT, 'docs/audio/sketch-c-report.json');
/** The same excerpt windows as sketch A (render-a.mjs EXCERPT_BEAT 48 / 96). */
export const EXCERPT_START = { 'battle-ffx': 19.2, 'boss-ffx2-aeon': 36 };
const SHIPPED_HALL = { rt60: 2.2, hfDamping: 2.8, preDelay: 0.019, width: 0.95, earlyLevel: 0.55, lowCutHz: 95 };
const r2 = (v) => (Number.isFinite(v) ? Number(v.toFixed(2)) : null);

function scaleTo(buf, lufsNow, lufsWanted) {
  const g = Math.pow(10, (lufsWanted - lufsNow) / 20);
  for (let i = 0; i < buf.left.length; i++) { buf.left[i] *= g; buf.right[i] *= g; }
  return 20 * Math.log10(g);
}

async function oneLayer({ cue, cfg, layerName, layer, ir, a, loop }) {
  const t0 = Date.now();
  const stem = await renderCue(cue, ir, { channelFilter: (ch) => layer.input.includes(ch.instrument) });
  const stemSec = (Date.now() - t0) / 1000;
  const n = Math.min(stem.left.length, a.left.length);
  const stemS16 = join(WORK, `C-${cue}-${layerName}-stem.wav`);
  const stemMono = join(WORK, `C-${cue}-${layerName}-stem.mono.wav`);
  writeWavS16(stemS16, stem.left.subarray(0, n), stem.right.subarray(0, n), RATE);
  writeWavS16Mono(stemMono, stem.left.subarray(0, n), stem.right.subarray(0, n), RATE);
  const uploaded = await T.upload(stemS16);

  let gpuSeconds = 0;
  async function attempt(denoise, variant = null) {
    const name = `C-${cue}-${layerName}${variant ? `-${variant}` : ''}-d${Math.round(denoise * 100)}-s${SEED}`;
    const cached = ['.flac', '.wav', '.mp3'].map((e) => join(WORK, `${name}${e}`)).find((f) => existsSync(f));
    let raw = cached;
    let gpu = null;
    if (!cached || flags.has('fresh')) {
      const lyrics = variant ? T.CHOIR_LYRICS[variant] : null;
      const r = await T.renderTexture({ cue, layerName, layer, uploaded, denoise, seed: SEED, workDir: WORK, variant, lyrics });
      raw = r.raw;
      gpu = r.gpuSeconds;
      gpuSeconds += gpu;
    }
    const d = await decodeStereo(raw, { rate: RATE });
    const mono = join(WORK, `${name}.mono.wav`);
    writeWavS16Mono(mono, d.left, d.right, RATE);
    const m = await T.measurePair(mono, stemMono, cfg.bpm);
    const onsetsPerSec = r2(m.onsets / m.durationS);
    process.stderr.write(`[C] ${name}: chromaGain ${r2(T.chromaGain(m))}, windows ${m.windowsCorrelated}, onsetF ${m.onsetF}, lag ${m.lagMedianAbsMs} ms, ${onsetsPerSec} onsets/s\n`);
    return { denoise, variant: variant ?? 'default', raw, gpuSeconds: gpu, chromaGain: r2(T.chromaGain(m)), qualifies: T.qualifies(m), onsetsPerSec, measure: m };
  }
  const tried = [];
  for (const denoise of FIXED !== null ? [FIXED] : T.SWEEP) tried.push(await attempt(denoise));
  const denoise = FIXED !== null ? FIXED : T.pickDenoise(tried);
  let chosen = tried.find((r) => r.denoise === denoise);
  // The choir's words, swept at the chosen strength (texture.mjs LYRICS_RULE).
  const lyricTries = [];
  if (layerName === 'choir' && !flags.has('no-lyrics-sweep')) {
    lyricTries.push({ ...chosen, variant: 'vowels' });
    for (const v of ['long', 'inst']) lyricTries.push(await attempt(denoise, v));
    const ok = lyricTries.filter((r) => r.qualifies).sort((a, b) => a.onsetsPerSec - b.onsetsPerSec);
    if (ok.length) chosen = ok[0];
  }
  const align = T.alignmentLagMs(chosen.measure);
  const prepared = await T.prepareLayer({ raw: chosen.raw, bandHz: layer.bandHz, lagMs: align.lagMs, length: a.left.length, rate: RATE, ...loop });
  const lufsRaw = measureLufs(prepared.left, prepared.right, RATE);
  const gainDb = scaleTo(prepared, lufsRaw, a.lufs + layer.relDb);
  const stemDyn = { onsetsPerSec: r2(chosen.measure.source?.onsets / chosen.measure.durationS), centroidHz: chosen.measure.source?.centroidHz };
  return {
    prepared,
    report: {
      layer: layerName,
      inputChannels: layer.input,
      tags: layer.tags,
      lyrics: chosen.variant === 'default' || chosen.variant === 'vowels' ? layer.lyrics : T.CHOIR_LYRICS[chosen.variant],
      lyricsVariant: chosen.variant,
      lyricsRule: layerName === 'choir' ? T.LYRICS_RULE : null,
      seed: SEED,
      bandHz: layer.bandHz,
      levelUnderA_dB: layer.relDb,
      gainAppliedDb: r2(gainDb),
      rule: FIXED !== null ? `fixed by --denoise=${FIXED}` : T.RULE,
      denoise,
      alignment: { lagMs: align.lagMs, windowsUsed: align.windows, note: 'positive = the model output was late against the stem; the layer is moved earlier by this much' },
      stem: { renderSec: r2(stemSec), ...stemDyn },
      output: { onsetsPerSec: r2(chosen.measure.onsets / chosen.measure.durationS), centroidHz: chosen.measure.centroidHz },
      gpuSecondsThisRun: r2(gpuSeconds),
      lyricsSweep: lyricTries.map(({ measure: m, raw, ...rest }) => ({ ...rest, onsetF: m.onsetF, windowsCorrelated: m.windowsCorrelated, tempoEst: m.tempoEst, centroidHz: m.centroidHz })),
      sweep: tried.map(({ measure: m, raw, ...rest }) => ({ ...rest, onsetF: m.onsetF, windowsCorrelated: m.windowsCorrelated, lagMedianAbsMs: m.lagMedianAbsMs, chromaSim: m.chromaSim, chromaBaseline: m.chromaBaselineTwoBarsApart, centroidHz: m.centroidHz, stemCentroidHz: m.source?.centroidHz, tempoEst: m.tempoEst })),
    },
  };
}

async function compareMixRoute(cue, cfg, layer, denoise, aWav) {
  // The route the brief named literally: the choir words applied to A's whole
  // mix. Measured only, to show whether a pad comes out of a full mix.
  const s16 = join(WORK, `C-${cue}-A-mix.wav`);
  const mono = join(WORK, `C-${cue}-A-mix.mono.wav`);
  const a = await decodeStereo(aWav, { rate: RATE });
  writeWavS16(s16, a.left, a.right, RATE);
  writeWavS16Mono(mono, a.left, a.right, RATE);
  const uploaded = await T.upload(s16);
  const r = await T.renderTexture({ cue, layerName: 'choir-from-mix', layer, uploaded, denoise, seed: SEED, workDir: WORK });
  const d = await decodeStereo(r.raw, { rate: RATE });
  const outMono = join(WORK, `${r.stem}.mono.wav`);
  writeWavS16Mono(outMono, d.left, d.right, RATE);
  const m = await T.measurePair(outMono, mono, cfg.bpm);
  return { denoise, gpuSeconds: r.gpuSeconds, onsetsPerSec: r2(m.onsets / m.durationS), sourceOnsetsPerSec: r2(m.source.onsets / m.durationS), onsetF: m.onsetF, chromaGain: r2(T.chromaGain(m)), centroidHz: m.centroidHz };
}

async function renderOne(cue, ir, report) {
  const started = Date.now();
  const cfg = T.TEXTURES[cue];
  if (!cfg) throw new Error(`no texture config for ${cue}`);
  const aWav = join(WAVS, `A-${cue}.wav`);
  if (!existsSync(aWav)) throw new Error(`${aWav} missing: run node tools/audio/modern/render-a.mjs --only=${cue} first`);
  const a = await decodeStereo(aWav, { rate: RATE });
  a.lufs = measureLufs(a.left, a.right, RATE);
  const manifest = JSON.parse(readFileSync(join(ROOT, 'public/audio/manifest.json'), 'utf8')).music[cue];
  const loop = { loopStart: Math.round(manifest.loopStart * RATE), loopEnd: Math.round(manifest.loopEnd * RATE) };

  const layers = [];
  for (const [layerName, layer] of Object.entries(cfg.layers)) {
    console.log(`  ${cue}: ${layerName}`);
    layers.push(await oneLayer({ cue, cfg, layerName, layer, ir, a, loop }));
  }
  // Mix under A, then back to A's loudness and ceiling (the limiter is A's; A
  // already carries its bus compression, so the sum is not compressed again).
  const mix = { left: Float32Array.from(a.left), right: Float32Array.from(a.right) };
  for (const { prepared } of layers) {
    for (let i = 0; i < mix.left.length; i++) { mix.left[i] += prepared.left[i]; mix.right[i] += prepared.right[i]; }
  }
  const sumLufs = measureLufs(mix.left, mix.right, RATE);
  const trimDb = scaleTo(mix, sumLufs, -16);
  limit(mix, RATE, Math.pow(10, (-1 - 0.4) / 20));
  const gates = measureAll(mix.left, mix.right, RATE, loop.loopStart, loop.loopEnd);
  const wav = join(WAVS, `C-${cue}.wav`);
  writeWavF32(wav, mix.left, mix.right, RATE);
  const ogg = join(OUT, `C-${cue}.ogg`);
  await toOgg(wav, ogg);
  // Each texture alone, 12 s, raised to -16 LUFS so Bailey can hear what was added.
  const soloFiles = [];
  for (const { prepared, report: lr } of layers) {
    const solo = { left: Float32Array.from(prepared.left), right: Float32Array.from(prepared.right) };
    const s0 = Math.round(EXCERPT_START[cue] * RATE);
    const seg = { left: solo.left.subarray(s0, s0 + 12 * RATE), right: solo.right.subarray(s0, s0 + 12 * RATE) };
    const soloGain = scaleTo(seg, measureLufs(seg.left, seg.right, RATE), -16);
    limit(seg, RATE, Math.pow(10, (-1 - 0.4) / 20));
    const tmp = join(WORK, `C-${cue}-${lr.layer}-solo.wav`);
    writeWavF32(tmp, seg.left, seg.right, RATE);
    const f = `C-${cue}-${lr.layer}-solo-x12.ogg`;
    await toOgg(tmp, join(OUT, f), { start: 0, duration: 12 });
    lr.soloExcerpt = { file: `public/audio/candidates/${f}`, gainToMinus16Db: r2(soloGain) };
    soloFiles.push(f);
  }
  const dyn = await measureDynamics(ogg);
  const aDyn = await measureDynamics(join(OUT, `A-${cue}.ogg`));
  let mixRoute = null;
  if (flags.has('compare-mix')) mixRoute = await compareMixRoute(cue, cfg, cfg.layers.choir, layers[0].report.denoise, aWav);
  const entry = {
    name: cue,
    game: cfg.game,
    renderSec: r2((Date.now() - started) / 1000),
    durationSec: r2(mix.left.length / RATE),
    loop: { startSec: manifest.loopStart, endSec: manifest.loopEnd },
    aLufs: r2(a.lufs),
    sumLufsBeforeTrim: r2(sumLufs),
    trimDb: r2(trimDb),
    master: { lufs: r2(gates.lufs), truePeakDb: r2(gates.truePeakDb), seamOk: gates.seam.ok, seam: gates.seam, spectrumOk: gates.balance.ok, spectrumProblems: gates.balance.problems },
    dynamics: { sketchC: dyn, sketchA: aDyn },
    files: { ogg: `public/audio/candidates/C-${cue}.ogg`, wav: `build/audio-candidates/C-${cue}.wav`, solos: soloFiles.map((f) => `public/audio/candidates/${f}`) },
    layers: layers.map((l) => l.report),
    mixRoute,
  };
  report.cues = (report.cues ?? []).filter((c) => c.name !== cue).concat(entry);
  console.log(`  ${cue}: ${entry.renderSec} s, LRA ${aDyn.lra} (A) -> ${dyn.lra} (C), trim ${entry.trimDb} dB, seam ${gates.seam.ok ? 'ok' : 'FAIL'}`);
}

async function main() {
  for (const d of [OUT, WAVS, WORK]) mkdirSync(d, { recursive: true });
  const ir = synthHallIr(RATE);
  matchEnergy(ir, hallEnergy(Hall, RATE, SHIPPED_HALL));
  const report = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : {};
  Object.assign(report, { sketch: 'C', rendered: new Date().toISOString(), rate: RATE, seed: SEED, rule: T.RULE, sweep: T.SWEEP });
  for (const cue of CUES) {
    await renderOne(cue, ir, report);
    writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(`  report: ${REPORT}`);
}

await main();
