/**
 * The performance model — plan §A3, the part no download can buy.
 *
 * Input is one score channel exactly as the arranger wrote it (same pitches,
 * same written durations, same written velocities). Output is a PERFORMANCE of
 * that channel: when each note really starts and stops, how hard it is really
 * played, which notes are slurred, and the CC1 / CC11 curves that move inside
 * held notes. Nothing here changes a pitch or a rhythm the score wrote; it
 * decides the things a player decides.
 *
 *  - Velocity from the PHRASE, not the grid (cause 1.7 / THEMES "Dynamics"):
 *    notes are grouped into phrases by the rests between them, and each phrase
 *    gets THEMES' default arch 0.62 -> 0.78 -> 0.58 as a multiplier on the
 *    written velocity. Multiplying keeps every written accent and every
 *    appoggiatura lean (the leaning note stays louder than its resolution).
 *  - Humanised onsets and durations by phrase (causes 1.6, 1.7): a seeded
 *    spread per note (the seed includes the channel, the lane, the note's index
 *    and its beat, so no two occurrences of a figure are the same take), a
 *    consistent lean behind the beat for low strings and brass, a lean into an
 *    appoggiatura, and a late release at a phrase end.
 *  - In-note expression (cause 1.3): for a held note, CC1 (which layer of the
 *    sampled dynamics is sounding) and CC11 (level) swell and recede inside the
 *    note — a messa di voce shaped by how long the note is.
 *  - Legato (cause 1.4): consecutive notes in one lane that touch are slurred —
 *    the first is held 40 ms into the second so sfizz fires the wrapper's
 *    `trigger=legato` region (see sfz.mjs) instead of a new attack.
 *
 * Determinism: every random number comes from a seeded hash, so the same score
 * gives the same performance on every render, and different occurrences of the
 * same notes give different performances. Round-robin choice inside sfizz
 * (`seq_position`) is deterministic too.
 */

import { hashSeed } from '../../../src/audio/dsp/oscillators.ts';
import { toMidi } from '../../../src/audio/score.ts';

/** Per-role behaviour. Numbers are THEMES.md's "Performance rules" where it gives one. */
export const ROLES = {
  // Section strings, choir: THEMES jitter 14-18 ms -> sigma ~7 ms (a spread of +/-2 sigma).
  sustain: { archDepth: 0.9, sigmaMs: 7, durJitter: 0.03, legato: true, cc: true, phraseEndSec: 0.07 },
  // Solo winds / a solo line: 8-12 ms.
  solo: { archDepth: 0.9, sigmaMs: 5, durJitter: 0.03, legato: true, cc: true, phraseEndSec: 0.06 },
  // Marcato / spiccato / stabs: the arch is lighter, attacks stay the articulation.
  short: { archDepth: 0.55, sigmaMs: 5, durJitter: 0.05, legato: false, cc: false, phraseEndSec: 0 },
  // Kit and concert percussion: 4-6 ms, accents protected ("no humaniser may level it").
  drum: { archDepth: 0.3, sigmaMs: 2.5, durJitter: 0, legato: false, cc: false, phraseEndSec: 0 },
  // Band voices kept on the SF2 sampler (bass, epiano, supersaw...): 4-6 ms.
  band: { archDepth: 0.5, sigmaMs: 2.5, durJitter: 0.03, legato: false, cc: false, phraseEndSec: 0 },
  // Solo piano: THEMES 6-9 ms, and the full phrase arch (a pianist shapes it).
  piano: { archDepth: 0.9, sigmaMs: 3.5, durJitter: 0.02, legato: false, cc: false, phraseEndSec: 0.05 },
};

/** mulberry32 from a string seed. */
export function rngFor(text) {
  let a = hashSeed(text) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Roughly normal, unit sigma (Irwin-Hall of three uniforms). */
function gauss(rnd) {
  return ((rnd() + rnd() + rnd()) - 1.5) * 2;
}

/** THEMES' default four-bar arch, 0.62 -> 0.78 (at 60 %) -> 0.58. */
export function archAt(p) {
  const x = Math.max(0, Math.min(1, p));
  if (x < 0.6) return 0.62 + 0.16 * Math.sin((x / 0.6) * (Math.PI / 2));
  return 0.78 - 0.2 * Math.pow((x - 0.6) / 0.4, 1.3);
}
const ARCH_MEAN = 0.7;

/**
 * Split a channel's notes into phrases: a rest of at least `gapSec` starts a
 * new one, and no phrase runs past `maxBeats` without a bar line to break on.
 */
export function phrases(notes, { gapSec, maxBeats, barBeats }) {
  const order = [...notes].sort((a, b) => a.on - b.on);
  const out = [];
  let cur = [];
  let reach = -Infinity;
  let startBeat = 0;
  for (const n of order) {
    const rest = n.on - reach;
    const long = cur.length > 0 && n.beat - startBeat >= maxBeats && Math.abs(n.beat / barBeats - Math.round(n.beat / barBeats)) < 1e-6;
    if (cur.length > 0 && (rest >= gapSec || long)) {
      out.push(cur);
      cur = [];
    }
    if (cur.length === 0) startBeat = n.beat;
    cur.push(n);
    reach = Math.max(reach, n.off);
  }
  if (cur.length) out.push(cur);
  return out;
}

/**
 * Assign notes to monophonic lanes: a chord's notes by pitch rank (top voice
 * = lane 0, so the melody keeps its own lane), a note that would overlap its
 * lane's previous note by more than a slur moves to a free lane.
 */
export function assignLanes(notes, slurSec = 0.12) {
  const order = [...notes].sort((a, b) => a.on - b.on || b.midi - a.midi);
  const lastOff = [];
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j < order.length && Math.abs(order[j].on - order[i].on) < 0.02) j++;
    const chord = order.slice(i, j).sort((a, b) => b.midi - a.midi);
    const taken = new Set();
    chord.forEach((n, rank) => {
      let lane = rank;
      const busy = (l) => taken.has(l) || (lastOff[l] ?? -Infinity) > n.on + slurSec;
      if (busy(lane)) {
        lane = 0;
        while (busy(lane)) lane++;
      }
      taken.add(lane);
      n.lane = lane;
      lastOff[lane] = n.off;
    });
    i = j;
  }
  return Math.max(0, ...order.map((n) => n.lane)) + 1;
}

/**
 * Perform one channel. Returns notes {on, off, midi, vel, beat, index, lane,
 * legato, phraseEnd}. `lean` shifts the whole part in seconds (behind the beat
 * is positive). `seed` names the channel/desk so two desks of one part differ.
 */
export function performChannel(track, tempo, channel, { role = 'sustain', lean = 0, seed = channel.name ?? channel.instrument, sigmaScale = 1 } = {}) {
  const R = ROLES[role];
  if (!R) throw new Error(`Unknown performance role "${role}"`);
  const beatSec = 60 / track.bpm;
  const barBeats = (track.timeSig?.[0] ?? 4) * (4 / (track.timeSig?.[1] ?? 4));
  const transpose = channel.transpose ?? 0;
  const notes = channel.notes
    .map((n, index) => {
      if (!(n[1] > 0)) return null;
      const on = tempo.secondsAt(n[0]);
      return { index, beat: n[0], grid: on, on, off: on + tempo.spanSec(n[0], n[1]), midi: toMidi(n[2]) + transpose, written: n[3] ?? 0.8 };
    })
    .filter(Boolean);

  const ph = phrases(notes, { gapSec: Math.max(0.3, 0.9 * beatSec), maxBeats: 4 * barBeats, barBeats });
  for (const p of ph) {
    const t0 = p[0].on;
    const t1 = Math.max(...p.map((n) => n.off));
    const span = Math.max(1e-3, t1 - t0);
    for (const n of p) {
      const factor = archAt((n.on - t0) / span) / ARCH_MEAN;
      n.archVel = n.written * (1 + R.archDepth * (factor - 1));
    }
    // Last-sounding note of the phrase: release late (a breath, not a cut).
    const lastOn = Math.max(...p.map((n) => n.on));
    for (const n of p) if (n.on === lastOn) n.phraseEnd = true;
  }

  // Appoggiatura: a note louder than the note right after it, resolving by
  // step, leans in early and holds on (THEMES: "the leaning note is LOUDER").
  const byOn = [...notes].sort((a, b) => a.on - b.on);
  for (let k = 0; k + 1 < byOn.length; k++) {
    const a = byOn[k];
    const b = byOn[k + 1];
    if (a.written > b.written + 0.04 && Math.abs(a.midi - b.midi) <= 2 && b.on - a.off < 0.05 && b.on - a.on < 1.5 * beatSec) {
      a.leans = true;
    }
  }

  for (const n of notes) {
    const rnd = rngFor(`${seed}|${n.index}|${n.beat}|${n.midi}`);
    const vel = n.archVel + (rnd() - 0.5) * 0.05; // +/-0.025, inside THEMES' 0.04 ceiling
    n.vel = Math.max(0.04, Math.min(1, vel));
    let shift = lean + (gauss(rnd) * R.sigmaMs * sigmaScale) / 1000;
    if (n.leans && role !== 'drum') shift -= 0.008;
    const dur = n.off - n.on;
    let newDur = dur * (1 + (rnd() - 0.5) * 2 * R.durJitter);
    if (n.leans) newDur *= 1.04;
    if (n.phraseEnd && R.phraseEndSec) newDur += R.phraseEndSec + dur * 0.04;
    n.on = Math.max(0, n.on + shift);
    n.off = n.on + Math.max(0.02, newDur);
  }

  const lanes = assignLanes(notes);
  if (R.legato) {
    for (let l = 0; l < lanes; l++) {
      const lane = notes.filter((n) => n.lane === l).sort((a, b) => a.on - b.on);
      for (let k = 0; k + 1 < lane.length; k++) {
        const a = lane[k];
        const b = lane[k + 1];
        // Touching (a gap under 60 ms) or overlapping: slur it.
        if (b.on - a.off < 0.06 && b.on - a.on > 0.08 && !a.phraseEnd) {
          if (a.midi === b.midi) {
            // A repeated pitch cannot overlap itself in MIDI (the note-off
            // would release the new note too): re-bow it instead.
            a.off = Math.max(a.on + 0.02, b.on - 0.01);
          } else {
            a.off = b.on + 0.04;
            b.legato = true;
          }
        }
      }
    }
  }
  return { notes, lanes, phrases: ph.length };
}

/** dB -> CC11 value under sfizz's default expression law (gain = (v/127)^2). */
export function cc11ForDb(db) {
  return Math.max(0, Math.min(127, 127 * Math.pow(10, db / 40)));
}

/**
 * CC1 / CC11 curves for one monophonic lane of held notes.
 *
 * CC1 follows the dynamic the note is at (so the sampled p and f layers
 * crossfade as it swells); CC11 carries a messa di voce in level. A note under
 * 0.7 s gets no swell of its own — it lives on the phrase's arch, which is
 * already in its velocity.
 */
export function expressionEvents(laneNotes, { stepSec = 0.02, smoothSec = 0.06 } = {}) {
  const ns = [...laneNotes].sort((a, b) => a.on - b.on);
  if (ns.length === 0) return [];
  const events = [];
  const t0 = Math.max(0, ns[0].on - 0.05);
  const t1 = ns[ns.length - 1].off + 0.6;
  const a = 1 - Math.exp(-stepSec / smoothSec);
  let k = 0;
  let dyn = ns[0].vel;
  let db = -4;
  let last1 = -1;
  let last11 = -1;
  for (let t = t0; t <= t1; t += stepSec) {
    while (k + 1 < ns.length && ns[k + 1].on <= t) k++;
    const n = ns[k];
    const len = n.off - n.on;
    let wantDyn = n.vel;
    let wantDb = -4;
    if (t >= n.on && t <= n.off && len >= 0.7) {
      const u = (t - n.on) / len;
      // Messa di voce: up to +0.12 of dynamic and +2.5 dB at 45 %, then a
      // taper to -0.05 / -2 dB as the bow runs out.
      const rise = Math.sin(Math.PI * Math.min(1, u / 0.9)) ** 1.2;
      const depth = Math.min(1, (len - 0.7) / 1.3 + 0.35);
      wantDyn += depth * (0.12 * rise - 0.05 * Math.max(0, (u - 0.6) / 0.4));
      wantDb += depth * (2.5 * rise - 2 * Math.max(0, (u - 0.6) / 0.4));
    }
    // Onsets jump (the bow is already moving), the rest glides.
    if (Math.abs(t - n.on) < stepSec) dyn = wantDyn;
    else dyn += a * (wantDyn - dyn);
    db += a * (wantDb - db);
    const cc1 = Math.round(127 * Math.pow(Math.max(0, Math.min(1, dyn)), 1.1));
    const cc11 = Math.round(cc11ForDb(db));
    if (cc1 !== last1) events.push({ t, type: 'cc', cc: 1, value: cc1 });
    if (cc11 !== last11) events.push({ t, type: 'cc', cc: 11, value: cc11 });
    last1 = cc1;
    last11 = cc11;
  }
  return events;
}

/** Note events (MIDI) for a lane or a whole part. Velocity 0..1 -> 1..127. */
export function noteEvents(notes, keyOf = (n) => n.midi) {
  const byKey = new Map();
  for (const n of notes) {
    const key = keyOf(n);
    if (key === null || key === undefined) continue;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push({ on: n.on, off: n.off, vel: n.vel });
  }
  const ev = [];
  for (const [key, list] of byKey) {
    list.sort((a, b) => a.on - b.on);
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      // One key cannot hold two notes: a note-off after the next note-on of
      // the same key would release the new one. Stop 2 ms short instead.
      const next = list[i + 1];
      const off = next && next.on < n.off + 0.002 ? Math.max(n.on + 0.005, next.on - 0.002) : n.off;
      ev.push({ t: n.on, type: 'on', key, vel: 1 + 126 * n.vel });
      ev.push({ t: off, type: 'off', key });
    }
  }
  return ev;
}

/**
 * What the performance did to the grid, for the report: onset deviation in ms
 * (mean = the lean, sd = the spread) and how many distinct velocities were
 * written versus played (a grid has few; a performance has many).
 */
export function performanceStats(notes) {
  if (notes.length === 0) return null;
  const dev = notes.map((n) => (n.on - n.grid) * 1000);
  const mean = dev.reduce((a, b) => a + b, 0) / dev.length;
  const sd = Math.sqrt(dev.reduce((a, b) => a + (b - mean) ** 2, 0) / dev.length);
  const q = (x) => Math.round(x * 127);
  return {
    onsetMs: { mean: Number(mean.toFixed(2)), sd: Number(sd.toFixed(2)), min: Number(Math.min(...dev).toFixed(1)), max: Number(Math.max(...dev).toFixed(1)) },
    velocities: { writtenDistinct: new Set(notes.map((n) => q(n.written))).size, playedDistinct: new Set(notes.map((n) => q(n.vel))).size },
    legato: notes.filter((n) => n.legato).length,
  };
}
