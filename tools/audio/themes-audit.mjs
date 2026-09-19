#!/usr/bin/env node
/**
 * Does each cue actually play what the bible says it plays?
 *
 * `docs/audio/THEMES.md` fixes six themes, a cue map that says which of them
 * appears where, and a set of performance rules. Nothing in the pipeline
 * checks any of it: a cue can measure -16 LUFS with a perfect loop and an
 * orchestral spectrum while containing none of the score's material. This
 * tool reads the score data — not the audio — and asks the questions the
 * measurements cannot.
 *
 *   THEMES     is the named theme present, as an interval sequence, in any
 *              channel? Intervals rather than pitches, because every legal
 *              transformation in the bible (transposition, augmentation,
 *              re-barring into 3/4) preserves them and only the pitches move.
 *              `--loose` also accepts the theme's head alone.
 *   TEMPO      `bpm` against the cue map.
 *   METER      `timeSig` against the cue map.
 *   KEY        the tonic and mode that best fit the cue's own pitch-class
 *              distribution, against the declared key.
 *   PERFORMANCE
 *              constant-velocity channels (banned except where the bible names
 *              them), velocity spread, off-grid note starts — the written
 *              rubato that stands in for the tempo map the renderer lacks —
 *              and the appoggiatura rule wherever FAREWELL's falling cell
 *              appears.
 *
 *   node tools/audio/themes-audit.mjs [cue ...] [--json=PATH] [--verbose]
 */

import { writeFile } from 'node:fs/promises';

const { getTrack, trackNames } = await import('../../src/audio/tracks/index.ts');
const THEMES = await import('../../src/audio/tracks/themes.ts');
const { midiFromName, effectiveJitterMs } = await import('../../src/audio/score.ts');
const { getPreset } = await import('../../src/audio/voices/presets/index.ts');

// ------------------------------------------------------- the bible's map ---

/**
 * The cue map from THEMES.md, transcribed. `themes` are the cells that must be
 * findable; `alsoOk` are cells a legal transformation may substitute for them.
 */
const CUE_MAP = {
  title: { key: 'A minor', bpm: 58, meter: [4, 4], themes: ['FAREWELL_RISE', 'HYMN_HEAD'] },
  'chapter-select': { key: 'B minor', bpm: 84, meter: [3, 4], themes: ['HYMN_HEAD', 'FAREWELL_RISE'] },
  pause: { key: 'E minor', bpm: 46, meter: [4, 4], themes: ['HYMN_HEAD'], constantVelocityOk: false },
  'battle-ffx': { key: 'E minor', bpm: 150, meter: [4, 4], themes: ['BATTLE_HOOK'] },
  'boss-dread': { key: 'D minor', bpm: 90, meter: [4, 4], themes: ['HYMN_HEAD', 'SEYMOUR'] },
  'boss-seymour': { key: 'C# minor', bpm: 132, meter: [4, 4], themes: ['SEYMOUR', 'SEYMOUR_MIRROR'] },
  'boss-yunalesca': {
    key: 'F minor',
    bpm: 132,
    meter: [6, 8],
    themes: ['HYMN_HEAD'],
    // The bible locks this canon at 0.62 and calls it out as the one place
    // constant velocity is the point.
    constantVelocityOk: true,
    noLeadingTone: true,
    // §Humanisation: "Vegnagun, the Yunalesca canon — <= 3". Only the canon:
    // the cello solo, brass and timpani in this cue are human on purpose.
    machineChannels: { match: /canon/i, maxJitterMs: 3 },
  },
  'boss-jecht': { key: 'D minor', bpm: 144, meter: [4, 4], themes: ['FATHER', 'FAREWELL_CLIMB'] },
  'boss-yu-yevon': { key: 'E minor', bpm: 40, meter: [4, 4], themes: ['HYMN_HEAD'] },
  'scene-gagazet': { key: 'B minor', bpm: 72, meter: [4, 4], themes: ['HYMN_HEAD', 'FAREWELL_RISE'] },
  'scene-zanarkand-dome': { key: 'B minor', bpm: 48, meter: [4, 4], themes: ['FAREWELL_RISE', 'HYMN_HEAD'] },
  // "the title's rise, BENT" — the cue map asks for a deliberately altered
  // statement, so an exact interval match is not the test here.
  'scene-dreams-end': { key: null, bpm: 76, meter: [4, 4], themes: ['FAREWELL_RISE'], bent: true },
  'scene-bevelle-underground': { key: 'G minor', bpm: 100, meter: [4, 4], themes: ['HYMN_POISONED', 'SONGSTRESS_DARK'] },
  'scene-farplane': { key: 'E major', bpm: 92, meter: [4, 4], themes: ['FAREWELL_RISE', 'SONGSTRESS_RISE'] },
  'victory-ffx': { key: 'C major', bpm: 120, meter: [4, 4], themes: ['VICTORY_FANFARE'] },
  'ending-ffx': { key: 'B minor', bpm: 58, meter: [4, 4], themes: ['FAREWELL_RISE', 'FAREWELL_CLIMB', 'HYMN_HEAD'] },
  'boss-ffx2-aeon': { key: 'Bb minor', bpm: 160, meter: [4, 4], themes: ['SONGSTRESS_DARK'] },
  'boss-vegnagun': {
    key: 'F minor',
    bpm: 168,
    meter: [4, 4],
    themes: ['SONGSTRESS_DARK'],
    constantVelocityOk: true,
    maxJitterMs: 3,
  },
  // The bible's Shuyin is SONGSTRESS in the PARALLEL minor, which is
  // SONGSTRESS_DARK. The major hook is deliberately not here.
  'boss-shuyin': { key: 'C# minor', bpm: 154, meter: [4, 4], themes: ['SONGSTRESS_DARK'] },
  'victory-ffx2': { key: 'Eb major', bpm: 128, meter: [4, 4], themes: ['SONGSTRESS_HOOK'] },
  'ending-ffx2': { key: 'Bb major', bpm: 84, meter: [4, 4], themes: ['SONGSTRESS_HOOK', 'FAREWELL_RISE'] },
};

/**
 * Slow cues that are right to have no tempo map, with the bible's own reason.
 *
 * This list is the point of the check: "no tempo map" is only a finding when
 * nobody decided it. §Rubato ends "HYMN, and the Yunalesca canon — zero", and
 * a machine does not breathe, so three of these are the bible speaking. Any
 * other lyrical cue that turns up without a map is an omission.
 */
const TEMPO_MAP_EXEMPT = {
  pause: 'HYMN is the one lyrical theme with no rubato — a congregation does not rubato',
  'boss-yunalesca': 'the rite does not breathe (§Rubato), and the cue says so in its own header',
  'boss-vegnagun': 'the machine has no rubato by definition (cue map #18)',
  // These two are QA's reading rather than a line of the bible, and an
  // arranger may overturn either. Both are cues whose own Form column is a
  // pulse: "A · A′ · canon · A" over a pedal, and "pulse · fragment ·
  // poisoned prayer · pulse". A canon that bends its pulse stops being a
  // canon, and the machine under the cathedral is a machine.
  'boss-dread': "a patient canon over a pedal — QA's reading, not the bible's; an arranger may overturn it",
  'scene-bevelle-underground':
    "the cue's own form is pulse-to-pulse and its emotion is a machine — QA's reading, not the bible's",
};

/** Theme cells, as interval sequences. Tracker strings are parsed first. */
function cellIntervals(name) {
  const raw = THEMES[name];
  if (!raw) return null;
  let pitches;
  if (typeof raw === 'string') {
    // A tracker string: take the first pitch of each struck step, in order.
    pitches = [];
    for (const token of raw.trim().split(/\s+/)) {
      if (token === '|' || token.startsWith('-') || token.startsWith('~') || token.startsWith('.')) continue;
      const head = token.split(/[:@+]/)[0];
      if (!head || !/^[A-Ga-g]/.test(head)) continue;
      try {
        pitches.push(midiFromName(head));
      } catch {
        /* not a pitch token */
      }
    }
  } else if (Array.isArray(raw)) {
    pitches = raw
      .map((n) => (typeof n[2] === 'number' ? n[2] : safeMidi(n[2])))
      .filter((p) => p !== null);
  } else {
    return null;
  }
  if (pitches.length < 2) return null;
  const intervals = [];
  for (let i = 1; i < pitches.length; i++) intervals.push(pitches[i] - pitches[i - 1]);
  return { pitches, intervals };
}

function safeMidi(p) {
  if (typeof p === 'number') return p;
  try {
    return midiFromName(p);
  } catch {
    return null;
  }
}

/** Every channel's notes as a time-ordered pitch sequence. */
function channelPitches(channel) {
  return [...(channel.notes ?? [])]
    .filter((n) => safeMidi(n[2]) !== null)
    .sort((a, b) => a[0] - b[0] || safeMidi(a[2]) - safeMidi(b[2]))
    .map((n) => ({ start: n[0], dur: n[1], pitch: safeMidi(n[2]), vel: n[3] ?? 0.7 }));
}

/**
 * Find an interval sequence inside a channel.
 *
 * Contiguity is required, but a chord's extra members are not: the search runs
 * over the channel's monophonic top line at each attack time, which is what a
 * listener follows and what "the theme is in this channel" means.
 */
function findIntervals(notes, intervals, { allowAugment = true } = {}) {
  if (notes.length <= intervals.length) return null;
  // Collapse simultaneous attacks to their highest note — the line you hear.
  const line = [];
  for (const n of notes) {
    const last = line[line.length - 1];
    if (last && Math.abs(last.start - n.start) < 1e-6) {
      if (n.pitch > last.pitch) line[line.length - 1] = n;
    } else line.push(n);
  }
  for (let i = 0; i + intervals.length < line.length; i++) {
    let ok = true;
    for (let k = 0; k < intervals.length; k++) {
      if (line[i + k + 1].pitch - line[i + k].pitch !== intervals[k]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return {
        atBeat: line[i].start,
        transposeSemitones: line[i].pitch,
        notes: line.slice(i, i + intervals.length + 1),
      };
    }
  }
  if (!allowAugment) return null;
  return null;
}

// ------------------------------------------------------------------- key ---

const PC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
// Krumhansl-Schmuckler profiles, plus a natural-minor variant: this score
// forbids the leading tone almost everywhere, so scoring against harmonic
// minor would mis-read every cue that obeys the rule.
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function keyEstimate(track) {
  const weight = new Array(12).fill(0);
  for (const channel of track.channels) {
    if ((channel.volume ?? 1) <= 0.05) continue;
    for (const note of channel.notes ?? []) {
      const midi = safeMidi(note[2]);
      if (midi === null) continue;
      // Drums and unpitched hits carry no key information; the seat says so.
      weight[midi % 12] += Math.max(0.05, note[1] ?? 0.5) * (note[3] ?? 0.7);
    }
  }
  const total = weight.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const score = (profile, tonic) => {
    let num = 0;
    let dp = 0;
    let dw = 0;
    const mp = profile.reduce((a, b) => a + b, 0) / 12;
    const mw = total / 12;
    for (let i = 0; i < 12; i++) {
      const p = profile[(i - tonic + 12) % 12] - mp;
      const w = weight[i] - mw;
      num += p * w;
      dp += p * p;
      dw += w * w;
    }
    return num / Math.sqrt(dp * dw || 1);
  };
  const candidates = [];
  for (let t = 0; t < 12; t++) {
    candidates.push({ key: `${PC[t]} major`, r: score(MAJOR, t), tonic: t, mode: 'major' });
    candidates.push({ key: `${PC[t]} minor`, r: score(MINOR, t), tonic: t, mode: 'minor' });
  }
  candidates.sort((a, b) => b.r - a.r);
  return { best: candidates[0], runnerUp: candidates[1], weight };
}

/** "Bb minor" and "A# minor" are the same key; the bible spells for reading. */
function sameKey(declared, found) {
  if (!declared || !found) return true;
  const norm = (k) => {
    const [name, mode] = k.split(' ');
    const sharp = Object.entries(FLAT).find(([, f]) => f === name)?.[0] ?? name;
    return `${sharp} ${mode}`.toLowerCase();
  };
  return norm(declared) === norm(found);
}

// ----------------------------------------------------------- performance ---

function performance(track, rules) {
  const notes = track.channels.flatMap((c) => (c.notes ?? []).map((n) => ({ ...n, ch: c })));
  const findings = [];
  const channels = [];
  let offGrid = 0;
  let total = 0;

  for (const channel of track.channels) {
    const list = channel.notes ?? [];
    if (list.length < 4) continue;
    const vels = list.map((n) => n[3] ?? 0.7);
    const mean = vels.reduce((a, b) => a + b, 0) / vels.length;
    const sd = Math.sqrt(vels.reduce((a, v) => a + (v - mean) ** 2, 0) / vels.length);
    const preset = channel.instrument ? getPreset(channel.instrument) : null;
    channels.push({
      name: channel.name ?? channel.instrument ?? '?',
      instrument: channel.instrument,
      notes: list.length,
      velMean: mean,
      velSd: sd,
      // What this channel will actually be rendered with, not what its preset
      // asks for. A `perform` block replaces the preset's figure and
      // `humanise` scales whatever survives that, so reading the preset alone
      // both invents failures (Vegnagun's desks are pulled to 1-3 ms by
      // `perform` out of presets that want 14-34) and, worse, hides real ones
      // (a preset at 2 ms that a channel pushes back up to 20). This is the
      // same call `render.mjs` makes when it builds the voice.
      jitterMs: preset ? effectiveJitterMs(preset.timingJitterMs ?? 0, channel.perform) : null,
      presetJitterMs: preset?.timingJitterMs ?? null,
    });
    // "Never render a phrase at constant velocity" is about phrases. A kick
    // pattern or a crash at one level is an arrangement choice, not a
    // synthetic performance, so percussion and very short channels are out.
    if (sd < 0.005 && !rules.constantVelocityOk && !isPercussion(channel) && list.length >= 12) {
      findings.push(
        `channel "${channel.name ?? channel.instrument}" is at constant velocity ` +
          `(${mean.toFixed(2)}) across ${list.length} notes — the bible bans this outside ` +
          'the Yunalesca canon and Vegnagun',
      );
    }
    for (const n of list) {
      total++;
      // Written rubato: a start that is not on a sixteenth of the beat grid.
      const grid = n[0] * 4;
      if (Math.abs(grid - Math.round(grid)) > 0.012) offGrid++;
    }
  }

  const jitters = channels.map((c) => c.jitterMs).filter((j) => j !== null);
  if (rules.maxJitterMs !== undefined) {
    const over = channels.filter((c) => (c.jitterMs ?? 0) > rules.maxJitterMs);
    if (over.length) {
      findings.push(
        `${over.length} channel(s) exceed this cue's ${rules.maxJitterMs} ms jitter ceiling: ` +
          over.map((c) => `${c.name} ${c.jitterMs}ms`).join(', '),
      );
    }
  } else if (jitters.length && jitters.every((j) => j === 0)) {
    findings.push('every voice has timingJitterMs 0 — nothing is humanised');
  }

  // The bible names TWO machine passages, not one. Vegnagun is a whole cue and
  // gets `maxJitterMs` above; the Yunalesca canon is a handful of channels
  // inside a cue whose brass, timpani and solo cello are meant to breathe, so
  // the ceiling has to be aimed at the canon alone. Nothing checked it before,
  // which meant half of §Humanisation's last row was unenforced.
  if (rules.machineChannels) {
    const { match, maxJitterMs } = rules.machineChannels;
    const machine = channels.filter((c) => match.test(c.name));
    if (!machine.length) {
      findings.push(
        `no channel matches ${match} — the cue's machine passage has been renamed ` +
          'or removed, and its jitter ceiling is now checking nothing',
      );
    }
    const over = machine.filter((c) => (c.jitterMs ?? 0) > maxJitterMs);
    if (over.length) {
      findings.push(
        `${over.length} machine channel(s) exceed the ${maxJitterMs} ms ceiling: ` +
          over.map((c) => `${c.name} ${c.jitterMs}ms`).join(', '),
      );
    }
  }

  if (rules.noLeadingTone) {
    // Degree 7 raised against the declared tonic, anywhere.
    const tonic = rules.key ? PC.indexOf(rules.key.split(' ')[0].replace(/^([A-G])b$/, (m, p) => {
      const idx = PC.indexOf(p);
      return PC[(idx + 11) % 12];
    })) : -1;
    if (tonic >= 0) {
      const lead = (tonic + 11) % 12;
      let hits = 0;
      for (const n of notes) {
        const midi = safeMidi(n[2]);
        if (midi !== null && midi % 12 === lead) hits++;
      }
      if (hits > 0) {
        findings.push(
          `${hits} raised-7th note(s) against ${rules.key}; the bible forbids a leading tone ` +
            'in this transformation, in any voice, for any reason',
        );
      }
    }
  }

  return { findings, channels, offGridFraction: total ? offGrid / total : 0 };
}

/**
 * The appoggiatura rule — and the reason it has to be looked for by shape.
 *
 * `FAREWELL_FALL` is two notes and its interval sequence is a single step
 * down, which matches every descending whole tone in the score. Searching for
 * it directly reports a hundred appoggiaturas that are not appoggiaturas.
 *
 * What the bible actually describes is a shape: a note held two or three beats
 * resolving immediately onto a much shorter note one step below. That pair is
 * unambiguous, and the rule is that the held note is the louder of the two.
 * Only channels that state FAREWELL are asked, because that is where the
 * bible makes the demand.
 */
function leaningNotes(track, statedChannels) {
  const results = [];
  for (const channel of track.channels) {
    const label = channel.name ?? channel.instrument;
    if (!statedChannels.has(label)) continue;
    if (isPercussion(channel)) continue;
    const notes = channelPitches(channel);
    for (let i = 0; i + 1 < notes.length; i++) {
      const a = notes[i];
      const b = notes[i + 1];
      const step = b.pitch - a.pitch;
      const adjacent = Math.abs(b.start - (a.start + a.dur)) < 0.26;
      const held = a.dur >= 1.5 && a.dur >= b.dur * 2;
      if (!adjacent || !held || (step !== -1 && step !== -2)) continue;
      results.push({
        channel: label,
        atBeat: a.start,
        leanVel: Number(a.vel.toFixed(3)),
        resolveVel: Number(b.vel.toFixed(3)),
        ok: a.vel > b.vel,
      });
    }
  }
  return results;
}

/** Kit and orchestral percussion sit outside the velocity-shape rules. */
function isPercussion(channel) {
  const preset = channel.instrument ? getPreset(channel.instrument) : null;
  const seat = preset?.seat ?? '';
  if (/kit|percussion|drum/i.test(seat)) return true;
  return /kick|snare|hat|crash|ride|tom|clap|taiko|timpani|drum|cymbal|shaker|perc/i.test(
    `${channel.name ?? ''} ${channel.instrument ?? ''}`,
  );
}

// ------------------------------------------------------------------ main ---

const args = process.argv.slice(2);
const jsonOut = args.find((a) => a.startsWith('--json='))?.slice(7);
const verbose = args.includes('--verbose');
const wanted = args.filter((a) => !a.startsWith('--'));
const names = wanted.length ? wanted : trackNames();

const report = [];
for (const name of names) {
  const rules = CUE_MAP[name];
  const track = getTrack(name);
  const row = { cue: name, failures: [], notes: [] };

  if (!rules) {
    row.failures.push('cue is not in the bible’s cue map');
    report.push(row);
    continue;
  }
  rules.key = rules.key ?? null;

  // Tempo and meter.
  row.bpm = track.bpm;
  row.expectedBpm = rules.bpm;
  if (track.bpm !== rules.bpm) {
    // Half and double time are the same pulse written differently; the bible
    // names a cue's tempo, not its notation.
    const ratio = track.bpm / rules.bpm;
    const related = [0.5, 2, 1 / 3, 3, 2 / 3, 1.5].some((r) => Math.abs(ratio - r) < 0.02);
    row[related ? 'notes' : 'failures'].push(
      `bpm ${track.bpm} against the cue map's ${rules.bpm}` + (related ? ' (a related pulse)' : ''),
    );
  }
  row.meter = track.timeSig;
  if (track.timeSig[0] !== rules.meter[0] || track.timeSig[1] !== rules.meter[1]) {
    row.failures.push(
      `meter ${track.timeSig.join('/')} against the cue map's ${rules.meter.join('/')}`,
    );
  }

  // Key.
  const key = keyEstimate(track);
  row.keyFound = key?.best.key ?? null;
  row.keyDeclared = rules.key;
  row.keyConfidence = key ? Number(key.best.r.toFixed(3)) : null;
  if (rules.key && key && !sameKey(rules.key, key.best.key)) {
    const second = sameKey(rules.key, key.runnerUp.key);
    row[second ? 'notes' : 'failures'].push(
      `pitch content fits ${key.best.key} (r=${key.best.r.toFixed(2)}), the cue map says ` +
        `${rules.key}` + (second ? ' — which is the runner-up, so this is a colour call' : ''),
    );
  }

  // Themes.
  row.themes = {};
  const statedChannels = new Set();
  // Only the two lyrical themes take the appoggiatura rule. FATHER and the
  // SONGSTRESS hooks are syncopated riffs, where the bible demands the
  // OPPOSITE — "the and-of-beat is LOUDER than the downbeat" — so testing a
  // guitar riff for a leaning note reports the rule being obeyed as a breach.
  const lyricalChannels = new Set();
  for (const themeName of rules.themes) {
    const cell = cellIntervals(themeName);
    if (!cell) {
      row.notes.push(`${themeName} is not an exported cell — cannot check`);
      continue;
    }
    let found = null;
    for (const channel of track.channels) {
      const hit = findIntervals(channelPitches(channel), cell.intervals);
      if (hit) {
        found = { channel: channel.name ?? channel.instrument, ...hit, notes: undefined };
        break;
      }
    }
    // A shortened head still names the theme; the bible's own transformations
    // use four notes of it in several cues.
    if (!found && cell.intervals.length > 3) {
      const head = { intervals: cell.intervals.slice(0, 3) };
      for (const channel of track.channels) {
        const hit = findIntervals(channelPitches(channel), head.intervals);
        if (hit) {
          found = { channel: channel.name ?? channel.instrument, ...hit, notes: undefined, partial: true };
          break;
        }
      }
    }
    row.themes[themeName] = found
      ? `${found.partial ? 'head only' : 'present'} in "${found.channel}" at beat ${found.atBeat}`
      : 'ABSENT';
    if (found) {
      statedChannels.add(found.channel);
      if (/^(FAREWELL|HYMN)/.test(themeName)) lyricalChannels.add(found.channel);
    }
    if (!found) {
      (rules.bent ? row.notes : row.failures).push(
        `${themeName} does not appear in any channel at written intervals` +
          (rules.bent
            ? ' — this cue states it bent on purpose, so that is expected'
            : ' — the cue map requires it here'),
      );
    }
  }

  // Performance.
  const perf = performance(track, rules);
  row.failures.push(...perf.findings);
  row.channels = perf.channels;
  row.offGridFraction = Number(perf.offGridFraction.toFixed(3));
  if (perf.offGridFraction < 0.01 && rules.bpm <= 100 && !rules.constantVelocityOk) {
    row.notes.push(
      `only ${(perf.offGridFraction * 100).toFixed(1)}% of notes sit off the sixteenth grid — ` +
        'a slow lyrical cue with no written rubato will read as typed rather than played',
    );
  }
  // Tempo map. THEMES.md §Renderer requests called this "the single biggest
  // quality item left" and the renderer has it now, so a lyrical cue without
  // one is performing its rubato inside a fixed grid: the tune can lean, the
  // accompaniment under it cannot. Nothing checked for it, so the ten cues
  // that gained a map and the ones that did not looked identical from here.
  row.tempoMarks = track.tempo?.length ?? 0;
  if (!row.tempoMarks) {
    const why = TEMPO_MAP_EXEMPT[name];
    if (why) row.notes.push(`no tempo map, deliberately: ${why}`);
    else if (rules.bpm <= 100) {
      row.failures.push(
        'no tempo map on a lyrical cue — rubato written into note values can move a note ' +
          'but cannot bend the pulse, so the accompaniment stays on the grid under a melody ' +
          'trying to breathe (THEMES.md §Renderer requests #1)',
      );
    }
  }

  const lean = leaningNotes(track, lyricalChannels);
  if (lean?.length) {
    row.appoggiatura = lean;
    for (const l of lean.filter((x) => !x.ok)) {
      row.failures.push(
        `appoggiatura backwards in "${l.channel}": the leaning note is ${l.leanVel.toFixed(2)} ` +
          `against its resolution's ${l.resolveVel.toFixed(2)} — the bible calls this the single ` +
          'loudest tell of a synthetic performance',
      );
    }
  }

  report.push(row);
}

// ---------------------------------------------------------------- output ---

let failed = 0;
for (const row of report) {
  const mark = row.failures.length ? 'FAIL' : 'ok  ';
  if (row.failures.length) failed++;
  console.log(
    `${mark} ${row.cue.padEnd(28)} ${String(row.bpm ?? '?').padStart(3)} bpm  ` +
      `${(row.meter ?? []).join('/').padEnd(4)} ${(row.keyFound ?? '?').padEnd(9)} ` +
      `(map: ${row.keyDeclared ?? 'none'})  off-grid ${((row.offGridFraction ?? 0) * 100).toFixed(0)}%`,
  );
  for (const [theme, state] of Object.entries(row.themes ?? {})) {
    if (verbose || state === 'ABSENT') console.log(`       ${theme}: ${state}`);
  }
  for (const f of row.failures) console.log(`   !!  ${f}`);
  if (verbose) for (const n of row.notes) console.log(`   --  ${n}`);
}
console.log(`\n${failed} of ${report.length} cue(s) depart from the bible`);

if (jsonOut) {
  await writeFile(jsonOut, JSON.stringify(report, null, 2));
  console.log(`wrote ${jsonOut}`);
}
