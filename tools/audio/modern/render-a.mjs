#!/usr/bin/env node
/**
 * SKETCH A of docs/plans/music-modern-sound.md — the renderer upgrade.
 *
 *   node tools/audio/modern/render-a.mjs                      (battle-ffx + boss-ffx2-aeon)
 *   node tools/audio/modern/render-a.mjs --only=battle-ffx
 *
 * Same notes as the shipped cue (the score file is read, never changed).
 * What plays them: VSCO 2 CE / VCSL SFZ patches through sfizz (sfizz.mjs),
 * seated by seating-map.mjs, performed by perform.mjs, in a convolution hall
 * (hall-ir.mjs), mastered with wider dynamics (master stage below).
 *
 * Writes ONLY audition candidates:
 *   public/audio/candidates/A-<cue>.ogg            the whole cue (intro + loop + 3 s run-on)
 *   public/audio/candidates/A-<cue>-excerpt.ogg    12 s for the audition page
 *   public/audio/candidates/control-<cue>-excerpt.ogg  the same 12 s of the SHIPPED mp3
 *   build/audio-candidates/A-<cue>.wav             float WAV (public/audio/candidates is not gitignored)
 *   docs/audio/sketch-a-report.json                every measurement below
 * The shipped cue routing (public/audio/manifest.json, public/audio/music/) is
 * not touched.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');

const { getTrack } = await import('../../../src/audio/tracks/index.ts');
const { tempoCurveOf } = await import('../../../src/audio/tempo.ts');
const { Hall } = await import('../../../src/audio/dsp/hall.ts');
const { applyDelayStereo } = await import('../../../src/audio/dsp/delay.ts');
const { foldTail, crossfadeLoopSeam } = await import('../../../src/audio/dsp/buffer.ts');
const { panGains } = await import('../../../src/audio/dsp/shaper.ts');
const presets = await import('../../../src/audio/voices/presets/index.ts');
const { busCompress, limit, masterToTarget } = await import('../master.mjs');
const { measureAll, measureLufs, measureTruePeak } = await import('../measure.mjs');
const { renderChannel, loadPatch } = await import('./stems.mjs');
const { MODERN_MAP } = await import('./seating-map.mjs');
const { countLayers, defaultArticulation } = await import('./sfz.mjs');
const { synthHallIr, matchEnergy, hallEnergy, convolutionHall, estimateRt60 } = await import('./hall-ir.mjs');
const { measureDynamics, toOgg } = await import('./loudness.mjs');
const { findRepeatedBars, compareBars, oldDryChannel } = await import('./proof.mjs');
const { sfizzAvailable, SFIZZ } = await import('./sfizz.mjs');

const flags = new Map(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('=');
  return [k, v ?? 'true'];
}));
const RATE = Number(flags.get('rate') ?? 44100);
const CUES = (flags.get('only') ?? 'battle-ffx,boss-ffx2-aeon').split(',').map((s) => s.trim()).filter(Boolean);
/** Where each cue's 12 s audition excerpt starts, in beats (the passage that shows the most). */
const EXCERPT_BEAT = { 'battle-ffx': 48, 'boss-ffx2-aeon': 96 };
const EXCERPT_SEC = 12;
const OUT = join(ROOT, 'public/audio/candidates');
const WAVS = join(ROOT, 'build/audio-candidates');
const WORK = join(ROOT, 'build/audio-sfz');

/** The shipped FDN hall's settings (render.mjs hallFor), for the energy match. */
const SHIPPED_HALL = { rt60: 2.2, hfDamping: 2.8, preDelay: 0.019, width: 0.95, earlyLevel: 0.55, lowCutHz: 95 };

export function encodeWavF32(left, right, rate) {
  const frames = left.length;
  const b = Buffer.alloc(44 + frames * 8);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + frames * 8, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(3, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 8, 28);
  b.writeUInt16LE(8, 32);
  b.writeUInt16LE(32, 34);
  b.write('data', 36);
  b.writeUInt32LE(frames * 8, 40);
  for (let i = 0, at = 44; i < frames; i++, at += 8) {
    b.writeFloatLE(left[i], at);
    b.writeFloatLE(right[i], at + 4);
  }
  return b;
}

/**
 * The wider master (plan 1.10): the same -16 LUFS battle reference and -1 dBTP
 * ceiling as the shipped chain, but the bus compressor is moved up 8 dB and
 * eased from 2:1 to 1.5:1, so it touches only the loudest bars and a forte is
 * allowed to be louder than a mezzo inside the cue.
 */
export function masterWide(mix, rate) {
  busCompress(mix, rate, { thresholdDb: -10, ratio: 1.5, kneeDb: 6 });
  const before = measureLufs(mix.left, mix.right, rate);
  const gain = Math.pow(10, Math.min(18, -16 - before) / 20);
  for (let i = 0; i < mix.left.length; i++) {
    mix.left[i] *= gain;
    mix.right[i] *= gain;
  }
  limit(mix, rate, Math.pow(10, (-1 - 0.4) / 20));
  return { lufs: measureLufs(mix.left, mix.right, rate), truePeakDb: measureTruePeak(mix.left, mix.right) };
}

function place(seatName, channel) {
  const seat = presets.seatOf(seatName);
  const pan = Math.max(-1, Math.min(1, seat.pan * 0.78 + (channel.pan ?? 0) * 0.35));
  const g = panGains(pan);
  return { gl: g.left, gr: g.right, send: presets.sendOf(seat), pan };
}

export async function renderCue(name, ir, { channelFilter = null } = {}) {
  const started = Date.now();
  const track = getTrack(name);
  const tempo = tempoCurveOf(track);
  const irLen = ir[0].length;
  const total = Math.ceil((tempo.secondsAt(track.length) + (track.tailSec ?? 3)) * RATE) + irLen;
  const mk = () => ({ left: new Float32Array(total), right: new Float32Array(total) });
  const buses = { dry: mk(), verb: mk(), delay: mk() };
  const stats = { sfizzRenders: 0, bandNotes: 0 };
  const channels = [];
  // Proof channels: the first repeated-bar pair per channel, captured dry.
  const proofs = [];
  for (const [ci, channel] of track.channels.entries()) {
    // Sketch C renders texture-input stems from a subset of channels; the
    // channel index still seeds the performance, so a stem is the same
    // playing as that channel inside A's full mix.
    if (channelFilter && !channelFilter(channel)) continue;
    const pair = channelFilter ? null : findRepeatedBars(channel, track);
    const capture = pair && proofs.length < 4 ? mk() : null;
    const t0 = Date.now();
    const report = await renderChannel({ cue: name, track, tempo, ci, channel, buses, rate: RATE, workDir: join(WORK, name), place, stats, capture });
    report.renderSec = Number(((Date.now() - t0) / 1000).toFixed(1));
    channels.push(report);
    if (capture) {
      const oldDry = oldDryChannel(track, channel, RATE);
      proofs.push({
        channel: report.channel,
        instrument: channel.instrument,
        old: compareBars(oldDry, tempo, pair, RATE),
        new: compareBars(capture, tempo, pair, RATE),
      });
    }
    console.log(`    ${String(ci).padStart(2)} ${report.channel.padEnd(16)} ${report.role.padEnd(7)} ${report.desks.length} desk(s) ${report.calibrationDb !== undefined ? `cal ${report.calibrationDb} dB ` : ''}${report.renderSec}s`);
  }

  if (track.fx?.delay) {
    applyDelayStereo(buses.delay, RATE, {
      time: track.fx.delay.timeBeats * (60 / track.bpm),
      feedback: track.fx.delay.feedback ?? 0.34,
      damp: track.fx.delay.damp ?? 3200,
    });
  }
  const wet = convolutionHall(buses.verb, RATE, ir);
  const mix = buses.dry;
  for (let i = 0; i < total; i++) {
    mix.left[i] += wet.left[i] + buses.delay.left[i];
    mix.right[i] += wet.right[i] + buses.delay.right[i];
  }
  const loopStart = Math.round(tempo.secondsAt(track.loop.start) * RATE);
  const loopEnd = Math.min(total, Math.round(tempo.secondsAt(track.loop.end) * RATE));
  foldTail(mix, loopStart, loopEnd);
  if (track.gain && track.gain !== 1) for (let i = 0; i < total; i++) { mix.left[i] *= track.gain; mix.right[i] *= track.gain; }
  // The same pre-master mix through the SHIPPED master, so the report can say
  // how much of the dynamics change is the master and how much the playing.
  const shippedMaster = { left: Float32Array.from(mix.left.subarray(0, loopEnd)), right: Float32Array.from(mix.right.subarray(0, loopEnd)) };
  masterToTarget(shippedMaster, RATE, { targetLufs: -16, ceilingDbtp: -1 });
  const master = masterWide(mix, RATE);
  crossfadeLoopSeam(mix, loopStart, loopEnd, Math.round(0.018 * RATE));

  // Same layout as the shipped files: intro + loop body + 3 s of the loop head.
  const tail = Math.min(Math.round(3 * RATE), loopEnd - loopStart);
  const len = loopEnd + tail;
  const left = new Float32Array(len);
  const right = new Float32Array(len);
  left.set(mix.left.subarray(0, loopEnd));
  right.set(mix.right.subarray(0, loopEnd));
  left.set(mix.left.subarray(loopStart, loopStart + tail), loopEnd);
  right.set(mix.right.subarray(loopStart, loopStart + tail), loopEnd);
  const measured = measureAll(left, right, RATE, loopStart, loopEnd);
  return { name, track, tempo, left, right, loopStart, loopEnd, master, measured, channels, proofs, stats, shippedMaster, renderSec: (Date.now() - started) / 1000 };
}

function layerTable() {
  const rows = [];
  const seen = new Set();
  for (const [instrument, entry] of Object.entries(MODERN_MAP)) {
    for (const layer of entry.layers ?? []) {
      const names = layer.artic ? layer.artic.map((a) => a.sfz) : [layer.sfz];
      for (const patch of names) {
        const sfz = loadPatch(patch);
        let regions = defaultArticulation(sfz);
        if (layer.drum) {
          const keys = [layer.drum.key, layer.drum.longKey].filter((k) => k !== undefined);
          regions = regions.filter((r) => keys.some((k) => r._lokey <= k && k <= r._hikey));
        }
        const id = `${patch}${layer.drum ? `@${layer.drum.key}` : ''}`;
        if (seen.has(id)) continue;
        seen.add(id);
        const c = countLayers(regions);
        rows.push({ instrument, patch: id, velocityLayers: `${c.layersMin}-${c.layersMax}`, layersMedian: c.layersMedian, roundRobins: c.rrMax, samples: c.samples, keys: c.keys });
      }
    }
  }
  return rows;
}

async function main() {
  if (!sfizzAvailable()) {
    console.error(`sfizz_render not found at ${SFIZZ}: unzip D:/Tools/audio-libs/_dl/sfizz-1.2.3-win64.zip to D:/Tools/sfizz`);
    process.exit(1);
  }
  for (const d of [OUT, WAVS, WORK]) mkdirSync(d, { recursive: true });
  const ir = synthHallIr(RATE);
  const irScale = matchEnergy(ir, hallEnergy(Hall, RATE, SHIPPED_HALL));
  const report = { sketch: 'A', rendered: new Date().toISOString(), rate: RATE, sfizz: SFIZZ, hall: { kind: 'synthesised IR', rt60Design: 2.2, rt60MeasuredBroadbandT20: estimateRt60(ir, RATE), preDelayMs: 20, lengthSec: ir[0].length / RATE, energyMatchedToShippedHall: true, irScale }, layers: layerTable(), cues: [] };

  for (const name of CUES) {
    console.log(`  rendering ${name}`);
    const cue = await renderCue(name, ir);
    const wav = join(WAVS, `A-${name}.wav`);
    writeFileSync(wav, encodeWavF32(cue.left, cue.right, RATE));
    const ogg = join(OUT, `A-${name}.ogg`);
    await toOgg(wav, ogg);
    const exStart = cue.tempo.secondsAt(EXCERPT_BEAT[name] ?? 16);
    await toOgg(wav, join(OUT, `A-${name}-excerpt.ogg`), { start: exStart, duration: EXCERPT_SEC });
    const shipped = join(ROOT, 'public/audio/music', `${name}.mp3`);
    const dynBefore = existsSync(shipped) ? await measureDynamics(shipped) : null;
    const dynAfter = await measureDynamics(ogg);
    const oldMasterWav = join(WAVS, `A-${name}.shipped-master.wav`);
    writeFileSync(oldMasterWav, encodeWavF32(cue.shippedMaster.left, cue.shippedMaster.right, RATE));
    const dynSameMixShippedMaster = await measureDynamics(oldMasterWav);
    // The control excerpt: the same 12 s of what ships today, loudness-matched
    // to the sketch's excerpt so the comparison is sound, not level.
    let control = null;
    if (existsSync(shipped)) {
      const cOgg = join(OUT, `control-${name}-excerpt.ogg`);
      await toOgg(shipped, cOgg, { start: exStart, duration: EXCERPT_SEC });
      const a = await measureDynamics(join(OUT, `A-${name}-excerpt.ogg`));
      const c = await measureDynamics(cOgg);
      const g = Number((a.lufs - c.lufs).toFixed(2));
      if (Math.abs(g) > 0.3) await toOgg(shipped, cOgg, { start: exStart, duration: EXCERPT_SEC, gainDb: g });
      control = { file: `control-${name}-excerpt.ogg`, gainDb: g, excerptLufsA: a.lufs };
    }
    const m = cue.measured;
    report.cues.push({
      name,
      renderSec: Number(cue.renderSec.toFixed(1)),
      durationSec: Number((cue.left.length / RATE).toFixed(2)),
      loop: { startSec: cue.loopStart / RATE, endSec: cue.loopEnd / RATE },
      excerpt: { startSec: Number(exStart.toFixed(3)), seconds: EXCERPT_SEC, beat: EXCERPT_BEAT[name] },
      control,
      files: { ogg: `public/audio/candidates/A-${name}.ogg`, excerpt: `public/audio/candidates/A-${name}-excerpt.ogg`, wav: `build/audio-candidates/A-${name}.wav` },
      master: { lufs: Number(cue.master.lufs.toFixed(2)), truePeakDb: Number(cue.master.truePeakDb.toFixed(2)) },
      gates: { lufs: m.lufs, truePeakDb: m.truePeakDb, seamOk: m.seam.ok, spectrumOk: m.balance.ok, spectrumProblems: m.balance.problems },
      dynamics: { shippedMp3: dynBefore, sketchA: dynAfter, sketchAMixThroughShippedMaster: dynSameMixShippedMaster, note: 'shippedMp3 is the whole shipped file; sketchA the whole candidate OGG; the third is the candidate mix up to loopEnd through the shipped 2:1 master' },
      repeatProof: cue.proofs,
      stats: cue.stats,
      channels: cue.channels,
    });
    console.log(`    ${name}: ${cue.renderSec.toFixed(1)} s render, LRA ${dynBefore?.lra} -> ${dynAfter.lra} LU, crest ${dynBefore?.crestDb} -> ${dynAfter.crestDb} dB`);
  }
  const reportPath = join(ROOT, 'docs/audio/sketch-a-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`  report: ${reportPath}`);
}

// Run only as a CLI: sketch C (render-c.mjs) imports renderCue and the master.
const invoked = process.argv[1] ? resolve(process.argv[1]).toLowerCase() : '';
if (invoked === fileURLToPath(import.meta.url).toLowerCase()) await main();
