/**
 * A minimal Standard MIDI File writer — just enough to hand one performed
 * channel to `sfizz_render`.
 *
 * Sketch A of docs/plans/music-modern-sound.md drives sfizz through its CLI
 * (plan §A4 route ii), so every performance decision the Node side makes —
 * humanised onsets, phrase velocities, the CC1/CC11 expression curves, the
 * legato overlaps — has to survive the trip as MIDI. That is why this file
 * writes times in *seconds*: the performance model already resolved the tempo
 * map, rubato and humanisation, and the MIDI clock here is a fixed 0.5 ms tick
 * (PPQ 960 at 480 000 us per quarter) that carries those decisions verbatim.
 *
 * Events: { t (seconds), type: 'on'|'off'|'cc'|'bend', key, vel, cc, value }.
 */

import { writeFileSync } from 'node:fs';

export const PPQ = 960;
/** Microseconds per quarter note: 480 000 -> 1 tick = 0.5 ms. */
export const USEC_PER_QN = 480000;
export const TICKS_PER_SEC = (PPQ * 1e6) / USEC_PER_QN;

function varLen(n) {
  const bytes = [n & 0x7f];
  n >>>= 7;
  while (n > 0) {
    bytes.unshift((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  return bytes;
}

/** Sort order at one tick: CCs first (so a note starts on its curve), then offs, then ons. */
const ORDER = { cc: 0, bend: 0, off: 1, on: 2 };

/**
 * Build the bytes of a type-0 SMF. `channel` is the MIDI channel (0-15);
 * sfizz is single-timbral, so one file per rendered stem.
 */
export function smfBytes(events, channel = 0) {
  const sorted = events
    .map((e, i) => ({ ...e, tick: Math.max(0, Math.round(e.t * TICKS_PER_SEC)), i }))
    .sort((a, b) => a.tick - b.tick || ORDER[a.type] - ORDER[b.type] || a.i - b.i);
  const track = [];
  // Tempo meta, so the tick means what TICKS_PER_SEC says.
  track.push(0, 0xff, 0x51, 0x03, (USEC_PER_QN >> 16) & 0xff, (USEC_PER_QN >> 8) & 0xff, USEC_PER_QN & 0xff);
  let last = 0;
  const ch = channel & 0x0f;
  for (const e of sorted) {
    track.push(...varLen(e.tick - last));
    last = e.tick;
    if (e.type === 'on') track.push(0x90 | ch, e.key & 0x7f, Math.max(1, Math.min(127, Math.round(e.vel))));
    else if (e.type === 'off') track.push(0x80 | ch, e.key & 0x7f, 64);
    else if (e.type === 'cc') track.push(0xb0 | ch, e.cc & 0x7f, Math.max(0, Math.min(127, Math.round(e.value))));
    else if (e.type === 'bend') {
      const v = Math.max(0, Math.min(16383, Math.round(8192 + e.value * 8191)));
      track.push(0xe0 | ch, v & 0x7f, (v >> 7) & 0x7f);
    } else throw new Error(`Unknown MIDI event type ${e.type}`);
  }
  // A second of air after the last event, then end of track: sfizz renders
  // until the release tails die, but --use-eot is not used, so this is only
  // for tidy files.
  track.push(...varLen(Math.round(TICKS_PER_SEC)), 0xff, 0x2f, 0x00);

  const header = Buffer.from([
    0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (PPQ >> 8) & 0xff, PPQ & 0xff,
  ]);
  const len = track.length;
  const trackHeader = Buffer.from([0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff]);
  return Buffer.concat([header, trackHeader, Buffer.from(track)]);
}

export function writeSmf(path, events, channel = 0) {
  writeFileSync(path, smfBytes(events, channel));
}
