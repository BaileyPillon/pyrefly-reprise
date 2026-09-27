#!/usr/bin/env node
/**
 * Originality check for the FF7 Guard Scorpion sketch (ff7-guard-scorpion.mjs).
 *
 *   node tools/audio/scores/2026-09-27/originality-check.mjs [--json=<file>]
 *
 * WHAT IT CAN CHECK. Every melodic line of the sketch (the tune, the climb, the
 * horn, trumpet and violin parts, the bass ostinato, the siren) against every
 * note array this project owns: the six themes and the motif cells
 * (`src/audio/tracks/themes.ts`, `motifs.ts`), every channel of every shipped
 * cue (`src/audio/tracks/index.ts`), and every earlier sketch score in
 * `tools/audio/scores/*`. For each pair it finds the longest run of identical
 * successive intervals (top voice, onsets merged), pitch only, and the longest
 * run where the rhythm (inter-onset ratios) matches too. An FF7 cue that reused
 * an FFX or FFX-2 theme would break hard rule 14 as well as the brief.
 *
 * WHAT IT CANNOT CHECK. No retail music is on this disk or was consulted, so
 * the sketch is not compared note for note with any Uematsu cue; that half of
 * the claim rests on how the sketch was written (from three cells defined in the
 * score, with no recording, score, MIDI or transcription of any retail track
 * opened, played or used as model input) and on the restyle's words naming no
 * game, composer or title (checked by the renderer, `render-ff7-sketch.mjs`).
 *
 * FLAG: a shared run of >= 6 intervals with matching rhythm, or >= 8 intervals
 * pitch-only, that is not a trivial figure (a pedal: at most two real moves
 * among repeated notes and octaves, as a chord stab's top voice; or one direction
 * of steps).
 *
 * Game case: FF7 only (the thing checked); the tool itself reads both games' data.
 */

import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const { toMidi, tracker } = await import('../../../../src/audio/score.ts');
const themes = await import('../../../../src/audio/tracks/themes.ts');
const motifs = await import('../../../../src/audio/tracks/motifs.ts');
const { TRACKS } = await import('../../../../src/audio/tracks/index.ts');
const sketch = await import('./ff7-guard-scorpion.mjs');

const PERCUSSION = new Set(['kick', 'snare', 'hat', 'taiko', 'tom', 'crash', 'cymbal-swell', 'metal-hit', 'timpani',
  'kick-808', 'snare-909', 'clap', 'shaker', 'triangle', 'tam-tam', 'bass-drum', 'drum-kit', 'orchestra-hit']);

/** Top voice: one pitch per onset (the highest), in time order. */
function topLine(notes) {
  const byOnset = new Map();
  for (const n of notes) {
    const at = Math.round(n[0] * 1000) / 1000;
    const midi = toMidi(n[2]);
    if (!byOnset.has(at) || byOnset.get(at) < midi) byOnset.set(at, midi);
  }
  return [...byOnset.entries()].sort((a, b) => a[0] - b[0]);
}

/** Intervals and inter-onset ratios of a top line. */
function features(notes) {
  const line = topLine(notes);
  const iv = [];
  const ioi = [];
  for (let i = 1; i < line.length; i++) {
    iv.push(line[i][1] - line[i - 1][1]);
    ioi.push(line[i][0] - line[i - 1][0]);
  }
  const ratio = ioi.map((d, i) => (i === 0 ? 1 : Math.round((d / Math.max(1e-6, ioi[i - 1])) * 100) / 100));
  return { iv, ratio };
}

/** A pedal (at most two real moves among repeats and octaves) or a one-way scale run. */
const trivial = (run) => run.filter((x) => x !== 0 && Math.abs(x) !== 12).length <= 2 ||
  run.every((x) => x > 0 && x <= 2) || run.every((x) => x < 0 && x >= -2);

/** Longest common contiguous run; `withRhythm` also requires equal ratios (after the first). */
function longest(a, b, withRhythm) {
  let best = { len: 0, at: 0 };
  let prev = new Int32Array(b.iv.length + 1);
  for (let i = 1; i <= a.iv.length; i++) {
    const cur = new Int32Array(b.iv.length + 1);
    for (let j = 1; j <= b.iv.length; j++) {
      if (a.iv[i - 1] !== b.iv[j - 1]) continue;
      const k = prev[j - 1];
      const rhythmOk = !withRhythm || k === 0 || a.ratio[i - 1] === b.ratio[j - 1];
      cur[j] = rhythmOk ? k + 1 : 1;
      if (cur[j] > best.len) best = { len: cur[j], at: i - cur[j] };
    }
    prev = cur;
  }
  return { len: best.len, run: a.iv.slice(best.at, best.at + best.len) };
}

// --- the references ---------------------------------------------------------------

const refs = [];
const asNotes = (v) => {
  if (Array.isArray(v) && v.length > 1 && Array.isArray(v[0]) && typeof v[0][0] === 'number') return v;
  if (typeof v === 'string') {
    try { const n = tracker(v); return n.length > 1 ? n : null; } catch { return null; }
  }
  return null;
};
for (const [file, mod] of [['themes.ts', themes], ['motifs.ts', motifs]]) {
  for (const [name, v] of Object.entries(mod)) {
    const notes = asNotes(v);
    if (notes) refs.push({ ref: `${file} ${name}`, f: features(notes) });
  }
}
for (const [cue, track] of Object.entries(TRACKS)) {
  for (const ch of track.channels) {
    if (PERCUSSION.has(ch.instrument) || ch.notes.length < 3) continue;
    refs.push({ ref: `track ${cue} / ${ch.name ?? ch.instrument}`, f: features(ch.notes) });
  }
}
const scoresDir = path.resolve(HERE, '..');
for (const date of readdirSync(scoresDir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const file of readdirSync(path.join(scoresDir, date.name)).filter((f) => f.endsWith('.mjs'))) {
    if (date.name === '2026-09-27' || file === 'sketch-kit.mjs') continue;
    const mod = await import(pathToFileURL(path.join(scoresDir, date.name, file)).href);
    const track = mod.default ?? mod.track;
    if (!track?.channels) continue;
    for (const ch of track.channels) {
      if (PERCUSSION.has(ch.instrument) || ch.notes.length < 3) continue;
      refs.push({ ref: `sketch ${date.name}/${file} / ${ch.name ?? ch.instrument}`, f: features(ch.notes) });
    }
  }
}

// --- the FF7 lines ----------------------------------------------------------------

const lines = [
  ['ALARM (the tune, as written)', tracker(sketch.ALARM)],
  ['RISE (the climb, as written)', tracker(sketch.RISE)],
  ...sketch.default.channels.filter((c) => !PERCUSSION.has(c.instrument)).map((c) => [`channel ${c.name}`, c.notes]),
];

const results = [];
let flagged = 0;
for (const [name, notes] of lines) {
  const f = features(notes);
  const hits = refs.map((r) => {
    const pitch = longest(f, r.f, false);
    const rhythm = longest(f, r.f, true);
    return { ref: r.ref, pitchOnly: pitch.len, pitchRun: pitch.run, withRhythm: rhythm.len, rhythmRun: rhythm.run };
  }).sort((a, b) => b.withRhythm - a.withRhythm || b.pitchOnly - a.pitchOnly);
  const flags = hits.filter((h) => (h.withRhythm >= 6 && !trivial(h.rhythmRun)) || (h.pitchOnly >= 8 && !trivial(h.pitchRun)));
  flagged += flags.length;
  results.push({ line: name, intervals: f.iv.length, top: hits.slice(0, 3), flags: flags.map((h) => h.ref) });
  const t = hits[0];
  console.log(`${name.padEnd(34)} ${String(f.iv.length).padStart(4)} intervals  longest shared: ` +
    `${t.withRhythm} with rhythm / ${hits.reduce((m, h) => Math.max(m, h.pitchOnly), 0)} pitch-only  ` +
    `(${t.ref})  ${flags.length ? `FLAG x${flags.length}` : 'ok'}`);
}

const out = {
  generatedBy: 'tools/audio/scores/2026-09-27/originality-check.mjs',
  references: refs.length,
  rule: 'flag = >= 6 shared intervals with matching rhythm, or >= 8 pitch-only, not a trivial figure (a pedal with <= 2 real moves among repeats/octaves, or one-direction steps)',
  retail: 'not compared: no retail recording, score, MIDI or transcription exists on this disk or was consulted',
  flagged,
  results,
};
const json = process.argv.slice(2).find((a) => a.startsWith('--json='))?.slice(7);
if (json) writeFileSync(path.resolve(ROOT, json), `${JSON.stringify(out, null, 2)}\n`);
console.log(`\n${refs.length} reference lines; ${flagged} flag(s)`);
process.exit(flagged ? 1 : 0);
