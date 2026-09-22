/**
 * The repeat-hash proof for plan cause 1.6 ("repeated notes are
 * bit-identical").
 *
 * Find two bars of one channel whose written notes are identical — and whose
 * two preceding bars are identical too, so no earlier tail can make them
 * differ — then hash the channel's dry audio over each bar:
 *
 *   OLD  the shipped renderTrack path (note cache on, seed = cache key),
 *        this channel alone, no reverb or delay, no master;
 *   NEW  Sketch A's dry stem for the same channel (all its desks summed).
 *
 * The old path should give two equal hashes (the diagnosis), the new one two
 * different hashes, and the difference energy says how different: dB of
 * (bar1 - bar2) against bar1. -Infinity means bit-identical.
 */

import { createHash } from 'node:crypto';

import { renderTrack } from '../../../src/audio/render.ts';
import * as presets from '../../../src/audio/voices/presets/index.ts';
import { voiceForPreset } from '../libs.mjs';

function sig(notes, from, to) {
  return notes
    .filter((n) => n[0] >= from - 1e-9 && n[0] < to - 1e-9)
    .map((n) => `${(n[0] - from).toFixed(4)},${n[1]},${n[2]},${n[3] ?? 0.8}`)
    .sort()
    .join(';');
}

/** First pair of bars (b1 < b2) with identical notes and identical two bars before. */
export function findRepeatedBars(channel, track, { minBar = 3 } = {}) {
  const barBeats = (track.timeSig?.[0] ?? 4) * (4 / (track.timeSig?.[1] ?? 4));
  const bars = Math.floor(track.length / barBeats);
  const s = [];
  for (let b = 0; b < bars; b++) s.push(sig(channel.notes, b * barBeats, (b + 1) * barBeats));
  // Stay clear of the bars the shipped path rewrites after the fact: the loop
  // start (foldTail adds the end's tail there) and the last bar (the seam
  // crossfade), so an old-path difference could only come from the notes.
  const loopBar = Math.floor(track.loop.start / barBeats);
  const clear = (b) => b >= minBar && (b < loopBar || b > loopBar + 2) && b < bars - 1;
  for (let b1 = minBar; b1 < bars; b1++) {
    if (!s[b1] || !clear(b1)) continue;
    for (let b2 = b1 + 1; b2 < bars; b2++) {
      if (!clear(b2)) continue;
      if (s[b1] === s[b2] && s[b1 - 1] === s[b2 - 1] && s[b1 - 2] === s[b2 - 2]) return { b1, b2, barBeats };
    }
  }
  return null;
}

function hashWindow(buf, from, len) {
  const h = createHash('sha256');
  h.update(Buffer.from(buf.left.buffer, buf.left.byteOffset + from * 4, len * 4));
  h.update(Buffer.from(buf.right.buffer, buf.right.byteOffset + from * 4, len * 4));
  return h.digest('hex').slice(0, 16);
}

function diffDb(buf, a, b, len) {
  let e = 0;
  let d = 0;
  for (let i = 0; i < len; i++) {
    const l1 = buf.left[a + i];
    const r1 = buf.right[a + i];
    e += l1 * l1 + r1 * r1;
    d += (l1 - buf.left[b + i]) ** 2 + (r1 - buf.right[b + i]) ** 2;
  }
  if (d === 0) return -Infinity;
  return Number((10 * Math.log10(d / Math.max(1e-30, e))).toFixed(2));
}

/** Compare two bar windows of a buffer. */
export function compareBars(buf, tempo, pair, rate) {
  const a = Math.round(tempo.secondsAt(pair.b1 * pair.barBeats) * rate);
  const b = Math.round(tempo.secondsAt(pair.b2 * pair.barBeats) * rate);
  const len = Math.round(tempo.spanSec(pair.b1 * pair.barBeats, pair.barBeats) * rate);
  const h1 = hashWindow(buf, a, len);
  const h2 = hashWindow(buf, b, len);
  const d = diffDb(buf, a, b, len);
  return { bar1: pair.b1 + 1, bar2: pair.b2 + 1, hash1: h1, hash2: h2, identical: h1 === h2, diffDb: Number.isFinite(d) ? d : '-inf (bit-identical)' };
}

/** The shipped path's dry render of one channel (see file header). */
export function oldDryChannel(track, channel, rate) {
  const solo = {
    ...track,
    fx: undefined,
    channels: [{ ...channel, fx: undefined, pan: 0, volume: channel.volume ?? 1 }],
  };
  let dry = null;
  renderTrack(solo, rate, {
    voiceFor: (name) => voiceForPreset(presets.getPreset(name)),
    spatialise: () => ({ reverb: 0, pan: 0 }),
    master: (mix) => {
      dry = mix;
    },
  });
  return dry;
}
