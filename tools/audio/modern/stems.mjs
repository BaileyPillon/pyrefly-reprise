/**
 * One score channel -> its performed, sampled stems.
 *
 * For every desk (layer) in the seating map this performs the channel
 * (perform.mjs), splits it the way the patch needs — by key range, by
 * articulation (note length), into monophonic lanes when the desk carries CC
 * curves — writes each piece as MIDI, renders it through sfizz and sums the
 * pieces into one stereo stem per desk. Band channels (no CC0 SFZ) are played
 * by the shipped SF2 voices through the same performance model instead.
 *
 * LEVELS. The composer balanced the cue against the shipped voices, so every
 * channel is CALIBRATED: one reference note (the channel's median pitch and
 * length, velocity 0.75) is rendered through the old voice and through the new
 * desks, and the new stems are scaled by the energy ratio. A new library is
 * then a new sound at the composer's balance, not a new balance.
 */

import { join } from 'node:path';

import { midiToFreq } from '../../../src/audio/score.ts';
import { hashSeed } from '../../../src/audio/dsp/oscillators.ts';
import * as presets from '../../../src/audio/voices/presets/index.ts';
import { LIB_ROOT, voiceForPreset } from '../libs.mjs';
import { expressionEvents, noteEvents, performChannel, performanceStats } from './perform.mjs';
import { modernEntry } from './seating-map.mjs';
import { parseSfz } from './sfz.mjs';
import { renderStem } from './sfizz.mjs';
import { vcslHiHat, vcslToms } from './vcsl-kit.mjs';

export const VSCO_SFZ = join(LIB_ROOT, 'vsco2-ce-sfz').replace(/\\/g, '/');

const sfzCache = new Map();
export function loadPatch(name) {
  if (sfzCache.has(name)) return sfzCache.get(name);
  let sfz;
  if (name === 'vcsl:hihat') sfz = vcslHiHat();
  else if (name === 'vcsl:toms') sfz = vcslToms();
  else sfz = parseSfz(`${VSCO_SFZ}/${name}`);
  sfzCache.set(name, sfz);
  return sfz;
}

/** Which patch a note of this desk plays (articulation by length). */
function patchFor(layer, n) {
  if (!layer.artic) return layer.sfz;
  const len = n.off - n.on;
  return layer.artic.find((a) => len <= a.maxSec).sfz;
}

function drumKey(layer, n) {
  const d = layer.drum;
  if (!d) return n.midi;
  if (d.longKey !== undefined && n.off - n.on >= d.longSec) return d.longKey;
  return d.key;
}

function mixAt(dst, src, offset, gl, gr) {
  const n = Math.min(src.left.length, dst.left.length - offset);
  for (let i = 0; i < n; i++) {
    dst.left[offset + i] += src.left[i] * gl;
    dst.right[offset + i] += src.right[i] * gr;
  }
}

/**
 * Render one desk's notes. Returns a stereo buffer of `length` samples.
 * `notes` are performed notes (seconds). Pieces: patch x lane.
 */
async function renderDesk({ layer, role, notes, length, rate, workDir, tag, stats }) {
  const out = { left: new Float32Array(length), right: new Float32Array(length) };
  const useCc = role === 'sustain' || role === 'solo';
  const pieces = new Map();
  for (const n of notes) {
    const patch = patchFor(layer, n);
    const lane = useCc ? n.lane : 0;
    const key = `${patch}|${lane}`;
    if (!pieces.has(key)) pieces.set(key, { patch, lane, notes: [] });
    pieces.get(key).notes.push(n);
  }
  for (const [key, piece] of pieces) {
    const sfz = loadPatch(piece.patch);
    const events = noteEvents(piece.notes, (n) => drumKey(layer, n));
    if (useCc) events.push(...expressionEvents(piece.notes));
    const isSus = /Sus/.test(piece.patch);
    const stem = await renderStem({
      workDir,
      tag: `${tag}-${key.replace(/[^A-Za-z0-9]+/g, '_')}`,
      sfz,
      sampleRate: rate,
      events,
      wrapOpts: {
        gainDb: 12,
        xfadeCc1: !!layer.xfade && useCc,
        legato: layer.legato && useCc && isSus ? {} : undefined,
        tuneCents: layer.tune,
        extend: layer.extend,
        ampVeltrack: useCc ? 70 : undefined,
      },
    });
    stats.sfizzRenders++;
    stats.sfizzPasses = (stats.sfizzPasses ?? 0) + stem.passes;
    stats.clippedSamplesLeft = (stats.clippedSamplesLeft ?? 0) + stem.clipped;
    mixAt(out, stem, 0, 1, 1);
  }
  return out;
}

/** Energy of a stereo buffer. */
function energy(b) {
  let e = 0;
  for (let i = 0; i < b.left.length; i++) e += b.left[i] ** 2 + b.right[i] ** 2;
  return e;
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

/**
 * The calibration gain for one channel: old SF2 voice energy / new desks'
 * energy on the same reference note.
 */
async function calibrate({ entry, channel, perfNotes, rate, workDir, tag, stats }) {
  // Same role as the real render, so the wrapper options (CC1 crossfade,
  // velocity tracking, the CC11 base level) are the ones being calibrated.
  const midi = Math.round(median(perfNotes.map((n) => n.midi)));
  const dur = Math.max(0.2, Math.min(1.5, median(perfNotes.map((n) => n.off - n.on))));
  const preset = presets.getPreset(channel.instrument);
  const oldVoice = voiceForPreset({ ...preset, timingJitterMs: 0 }, 'modern-cal');
  const oldBuf = oldVoice({ sampleRate: rate, freq: midiToFreq(midi), dur, velocity: 0.75, seed: 1 });
  const ref = [{ on: 0.05, off: 0.05 + dur, midi, vel: 0.75, lane: 0 }];
  const len = Math.round((dur + 4) * rate);
  let newE = 0;
  for (const [i, layer] of entry.layers.entries()) {
    if (layer.keys && (midi < layer.keys[0] || midi > layer.keys[1])) continue;
    const buf = await renderDesk({ layer, role: entry.role, notes: ref, length: len, rate, workDir, tag: `${tag}-cal${i}`, stats });
    newE += energy(buf) * layer.gain * layer.gain;
  }
  const oldE = energy(oldBuf);
  if (!(newE > 0) || !(oldE > 0)) return { gain: 1, midi, dur, note: 'no reference energy' };
  const g = Math.sqrt(oldE / newE);
  const clamped = Math.max(Math.pow(10, -24 / 20), Math.min(Math.pow(10, 24 / 20), g));
  return { gain: clamped, midi, dur, db: 20 * Math.log10(clamped) };
}

/**
 * Render one channel into the dry, reverb and delay buses.
 * `place(seatName)` returns { pan, send } for a seat and the channel.
 */
export async function renderChannel({ cue, track, tempo, ci, channel, buses, rate, workDir, place, stats, capture = null }) {
  const entry = modernEntry(channel.instrument);
  const volume = channel.volume ?? 1;
  const delaySend = track.fx?.delay ? channel.fx?.delay ?? 0 : 0;
  const tag = `${cue}-${ci}`;
  const report = { channel: channel.name ?? channel.instrument, instrument: channel.instrument, role: entry.role, desks: [] };

  if (entry.role === 'band') {
    const preset = presets.getPreset(channel.instrument);
    const voice = voiceForPreset({ ...preset, timingJitterMs: 0 }, 'modern');
    const { notes } = performChannel(track, tempo, channel, { role: 'band', seed: `${cue}|${ci}|band` });
    const seat = place(preset.seat, channel);
    for (const n of notes) {
      const buf = voice({
        sampleRate: rate,
        freq: midiToFreq(n.midi),
        dur: Math.max(0.01, n.off - n.on),
        velocity: n.vel,
        // Per OCCURRENCE: channel, note index and beat — never the cache key
        // (plan 1.6), so a repeated figure is a new take every time.
        seed: hashSeed(`A|${cue}|${ci}|${n.index}|${n.beat}`),
      });
      const at = Math.round(n.on * rate);
      mixAt(buses.dry, buf, at, volume * seat.gl, volume * seat.gr);
      mixAt(buses.verb, buf, at, volume * seat.send * seat.gl, volume * seat.send * seat.gr);
      if (delaySend > 0) mixAt(buses.delay, buf, at, volume * delaySend * seat.gl, volume * delaySend * seat.gr);
      if (capture) mixAt(capture, buf, at, volume, volume);
    }
    report.desks.push({ patch: 'SF2 (shipped voice)', seat: preset.seat, notes: notes.length, performance: performanceStats(notes) });
    stats.bandNotes += notes.length;
    return report;
  }

  // Calibrate once per channel on the first desk's performance.
  const first = performChannel(track, tempo, channel, { role: entry.role, seed: `${cue}|${ci}|cal` });
  const cal = await calibrate({ entry, channel, perfNotes: first.notes, rate, workDir, tag, stats });
  report.calibrationDb = Number((cal.db ?? 0).toFixed(2));

  for (const [di, layer] of entry.layers.entries()) {
    const perf = performChannel(track, tempo, channel, {
      role: entry.role,
      lean: (layer.lean ?? 0) / 1000,
      seed: `${cue}|${ci}|${layer.sfz}|desk${layer.desk ?? 1}`,
    });
    const notes = layer.keys ? perf.notes.filter((n) => n.midi >= layer.keys[0] && n.midi <= layer.keys[1]) : perf.notes;
    if (notes.length === 0) continue;
    const buf = await renderDesk({ layer, role: entry.role, notes, length: buses.dry.left.length, rate, workDir, tag: `${tag}-d${di}`, stats });
    const seat = place(layer.seat, channel);
    const g = volume * layer.gain * cal.gain;
    mixAt(buses.dry, buf, 0, g * seat.gl, g * seat.gr);
    mixAt(buses.verb, buf, 0, g * seat.send * seat.gl, g * seat.send * seat.gr);
    if (delaySend > 0) mixAt(buses.delay, buf, 0, g * delaySend * seat.gl, g * delaySend * seat.gr);
    if (capture) mixAt(capture, buf, 0, g, g);
    report.desks.push({
      patch: layer.artic ? layer.artic.map((a) => a.sfz).join(' / ') : layer.sfz,
      seat: layer.seat,
      notes: notes.length,
      lanes: perf.lanes,
      phrases: perf.phrases,
      legatoNotes: notes.filter((n) => n.legato).length,
      performance: performanceStats(notes),
    });
  }
  return report;
}
