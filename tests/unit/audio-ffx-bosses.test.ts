import { describe, expect, it } from 'vitest';

import { INSTRUMENTS } from '../../src/audio/instruments.ts';
import { effectiveJitterMs, toMidi, type Channel, type Note, type Track } from '../../src/audio/score.ts';
import { tempoCurveOf } from '../../src/audio/tempo.ts';
import { getTrack } from '../../src/audio/tracks/index.ts';
import { FATHER } from '../../src/audio/tracks/themes.ts';
import { getPreset, hasPreset } from '../../src/audio/voices/presets/index.ts';

/**
 * The FFX boss group's rules from `docs/audio/THEMES.md`, as tests.
 *
 * These are not style opinions. Every assertion here is a line in the bible
 * that a plausible future edit would silently undo, and each one has a
 * specific audible consequence:
 *
 *   - a resemblance guard, which is the reason Bailey can ship the score;
 *   - the appoggiatura / off-beat accent rules, which are the loudest single
 *     tell of a synthetic performance when they get inverted;
 *   - "never render a phrase at constant velocity", with the two places the
 *     document names as exceptions and no others;
 *   - the transformations that make four cues part of one score rather than
 *     four demos.
 *
 * They run on the note data, not on audio, so they are fast and they fail in
 * CI rather than in Bailey's headphones.
 */

const CUES = ['boss-seymour', 'boss-yunalesca', 'boss-jecht', 'boss-yu-yevon'] as const;

function channel(track: Track, name: string): Channel {
  const found = track.channels.find((c) => c.name === name);
  if (!found) throw new Error(`${track.name} has no channel "${name}"`);
  return found;
}

function velocities(notes: Note[]): number[] {
  return notes.map((n) => Number((n[3] ?? 0.8).toFixed(4)));
}

/** Concert pitch class, after the channel's own transpose. */
function pitchClass(note: Note, ch: Channel): number {
  return (((toMidi(note[2]) + (ch.transpose ?? 0)) % 12) + 12) % 12;
}

/**
 * Every attack sounding at `beat`, in time order.
 *
 * A `beat` is matched with slack because two things legitimately move an
 * attack off the grid: `swell()` splits a held note into tied re-attacks, and
 * written rubato pulls an attack up to 4% of its own length early. Both are
 * the point; neither may be allowed to hide an inverted appoggiatura, so the
 * slack is small and the FIRST attack at or after the window opens is the
 * struck note.
 */
function attacksAt(notes: Note[], beat: number, slack = 0.3): Note[] {
  return [...notes]
    .filter((n) => n[0] >= beat - slack && n[0] < beat + slack)
    .sort((a, b) => a[0] - b[0]);
}

/**
 * THE APPOGGIATURA RULE, as an assertion: "the leaning note is LOUDER than its
 * resolution" (THEMES.md §Dynamics — "the single most important number in this
 * file"), and for Bailey, "if the aching note is the quiet one, we got it
 * backwards and it will sound mechanical."
 *
 * Every attack of the leaning note is checked, not just its first. A held
 * choir or string note is re-articulated to fake a hairpin, and a leaning note
 * that grows into its own resolution puts the accent on the wrong one of the
 * pair even though its first attack was louder.
 */
function expectLeans(ch: Channel, pairs: Array<[number, number, string]>): void {
  for (const [leanBeat, resolveBeat, what] of pairs) {
    const leaning = attacksAt(ch.notes, leanBeat);
    const resolution = attacksAt(ch.notes, resolveBeat);
    expect(leaning.length, `${ch.name}: nothing struck at beat ${leanBeat} (${what})`)
      .toBeGreaterThan(0);
    expect(resolution.length, `${ch.name}: nothing struck at beat ${resolveBeat} (${what})`)
      .toBeGreaterThan(0);
    const to = resolution[0]![3] ?? 0.8;
    for (const attack of leaning) {
      expect(
        attack[3] ?? 0.8,
        `${ch.name}: ${what} — the leaning note at beat ${attack[0]} is ` +
          `${attack[3]} against ${to} on the note it falls to`,
      ).toBeGreaterThan(to);
    }
  }
}

/**
 * The same rule, asserted BY POSITION in the line rather than by beat.
 *
 * A line with real rubato in it has no fixed beats to assert against: the solo
 * cello in `boss-yunalesca` is pulled by `agogic()` at two phrase ends and by
 * an 18% ritardando across its last two notes, so every beat after the first
 * breath has moved and will move again the next time anybody touches the
 * phrasing. Its appoggiaturas are applied by index for exactly that reason,
 * and this asserts them the same way. Negative indices count from the end, so
 * `[-2, -1]` is "the last two notes of the line", which is what AMEN_PHRYGIAN
 * is and what it will still be after the next rubato change.
 */
function expectLeansByIndex(
  ch: Channel,
  notes: Note[],
  pairs: Array<[number, number, string]>,
): void {
  for (const [from, to, what] of pairs) {
    const at = (i: number): Note | undefined => notes[i < 0 ? notes.length + i : i];
    const leaning = at(from);
    const resolution = at(to);
    expect(leaning, `${ch.name}: no note at position ${from} (${what})`).toBeDefined();
    expect(resolution, `${ch.name}: no note at position ${to} (${what})`).toBeDefined();
    expect(
      leaning![3] ?? 0.8,
      `${ch.name}: ${what} — the leaning note at beat ${leaning![0].toFixed(3)} is ` +
        `${leaning![3]} against ${resolution![3]} on the note it falls to at ` +
        `beat ${resolution![0].toFixed(3)}`,
    ).toBeGreaterThan(resolution![3] ?? 0.8);
  }
}

/** What this channel's notes are actually played with, preset plus `perform`. */
function jitterOf(ch: Channel): number {
  const preset = hasPreset(ch.instrument) ? getPreset(ch.instrument) : undefined;
  return effectiveJitterMs(preset?.timingJitterMs ?? 0, ch.perform);
}

describe('the FFX boss cues', () => {
  it.each(CUES)('%s loops inside itself and lasts a sensible time', (name) => {
    const t = getTrack(name);
    expect(t.loop.start).toBeGreaterThanOrEqual(0);
    expect(t.loop.end).toBeLessThanOrEqual(t.length);
    expect(t.loop.end - t.loop.start).toBeGreaterThan(t.length * 0.5);
    const seconds = (t.length * 60) / t.bpm;
    expect(seconds).toBeGreaterThan(60);
    expect(seconds).toBeLessThan(240);
  });

  /**
   * THEMES.md §Dynamics: "Never render a phrase at constant velocity except
   * the two places this document names." Of those two, only Yunalesca's canon
   * is in this group, and it is locked at 0.62 deliberately.
   */
  /**
   * Every instrument a track names must have a SYNTHESISED voice, not just a
   * sampled preset.
   *
   * The two registries are not the same size: `src/audio/voices/presets/` has
   * about sixty instruments and `src/audio/instruments.ts` has forty, and the
   * handoff to this group listed the sampled names as if they were all
   * available. Naming a sampled-only instrument renders perfectly offline and
   * then throws `Unknown instrument` the moment the runtime falls back to
   * synthesis — which is the one path that exists so the game never goes
   * silent. This cue group named seven of them before this test existed.
   */
  it.each(CUES)('%s only names instruments that also have a synthesised voice', (name) => {
    for (const ch of getTrack(name).channels) {
      expect(
        Object.prototype.hasOwnProperty.call(INSTRUMENTS, ch.instrument),
        `${name} / ${ch.name} names "${ch.instrument}", which has no synthesised fallback`,
      ).toBe(true);
    }
  });

  it.each(CUES)('%s has no accidental constant-velocity channel', (name) => {
    const t = getTrack(name);
    const allowedFlat = new Set(
      name === 'boss-yunalesca'
        ? ['choir canon low', 'choir canon high', 'canon onsets']
        : [],
    );
    for (const ch of t.channels) {
      if (ch.notes.length < 16) continue; // a handful of cymbal crashes is not a phrase
      const distinct = new Set(velocities(ch.notes)).size;
      if (allowedFlat.has(ch.name ?? '')) {
        expect(distinct, `${name} / ${ch.name} is the named exception and must stay locked`).toBe(1);
      } else {
        expect(distinct, `${name} / ${ch.name} is rendered at ${distinct} velocity value(s)`)
          .toBeGreaterThanOrEqual(3);
      }
    }
  });

  /**
   * A tempo map that is not the same tempo at both ends of the loop lurches on
   * every wrap: the waveform is continuous and the pulse is not, which is the
   * loop-seam problem one level up and the one mistake a tempo map makes that
   * nobody can mix out. The renderer warns; this fails.
   *
   * And a fermata at or past `loop.end` is time nobody ever hears.
   */
  it.each(CUES)('%s comes round the loop at the tempo it left', (name) => {
    const t = getTrack(name);
    const curve = tempoCurveOf(t);
    if (!curve.hasMap) return;
    expect(curve.bpmAt(t.loop.end), `${name} wraps from a different tempo than it restarts at`)
      .toBeCloseTo(curve.bpmAt(t.loop.start), 3);
    for (const mark of curve.marks) {
      if (mark.holdSec <= 0) continue;
      expect(mark.beat, `${name}: the fermata at beat ${mark.beat} is past loop.end`)
        .toBeLessThan(t.loop.end);
      expect(mark.beat).toBeGreaterThanOrEqual(t.loop.start);
    }
  });
});

describe('boss-seymour', () => {
  const t = getTrack('boss-seymour');

  /**
   * The resemblance guard, and the single biggest one in the score: rock organ
   * plus a CHANTED CHOIR over a fast chromatic bass ostinato is this
   * character's recognisable sound in the source. There is therefore no choir
   * in this cue at all.
   */
  it('has no choir of any kind', () => {
    const voices = t.channels.filter((c) => /choir|soprano|vox/i.test(c.instrument));
    expect(voices.map((c) => c.name)).toEqual([]);
  });

  /** One organ in the room, and it is his — so "he is never loud" is a fact
   *  about every organ channel rather than about most of them. */
  it('has exactly one organ voice, and every channel of it is his', () => {
    const organs = t.channels.filter((c) => c.instrument === 'organ');
    expect(organs.length).toBeGreaterThanOrEqual(4);
    for (const ch of organs) expect(ch.volume ?? 1).toBeLessThanOrEqual(0.55);
  });

  /** "He is never loud": every church-organ channel sits at 0.55 or under. */
  it('keeps every church-organ channel at or below 0.55', () => {
    const organs = t.channels.filter((c) => c.instrument === 'organ');
    expect(organs.length).toBeGreaterThan(0);
    for (const ch of organs) {
      expect(ch.volume ?? 1, `${ch.name}`).toBeLessThanOrEqual(0.55);
    }
  });

  /** The band has to be audibly the loud half, or the contrast is not there. */
  it('lets the band play louder than he does', () => {
    const organs = t.channels.filter((c) => c.instrument === 'organ');
    const band = t.channels.filter((c) => ['bass', 'kick', 'snare'].includes(c.instrument));
    const loudestOrgan = Math.max(...organs.map((c) => c.volume ?? 1));
    const loudestBand = Math.max(...band.map((c) => c.volume ?? 1));
    expect(loudestBand).toBeGreaterThan(loudestOrgan * 1.4);
  });

  /**
   * The registration is 16' + 8' + 2 2/3' and NO 4'. A 4' would be a channel
   * transposed +12, and adding one is exactly the well-meaning edit that would
   * turn a hollow organ into a bright one.
   */
  it('registers 16 + 8 + 2 2/3 with no 4-foot stop', () => {
    const organs = t.channels.filter((c) => c.instrument === 'organ' && c.name?.startsWith('organ '));
    const stops = organs.map((c) => c.transpose ?? 0);
    expect(stops).toContain(-12); // 16'
    expect(stops).toContain(0); // 8'
    expect(stops).toContain(19); // 2 2/3', a twelfth
    expect(stops).not.toContain(12); // 4' — deliberately absent
  });

  /**
   * "The snap up to the b6 is QUIETER than the note before it — thrown away,
   * like a remark. The whole character lives in that dropped note."
   */
  it('throws away the snap up to the b6', () => {
    const motifNotes = [...channel(t, "organ 8'").notes].sort((a, b) => a[0] - b[0]);
    const first = motifNotes[0]!;
    const snap = motifNotes[1]!;
    expect(toMidi(snap[2]) - toMidi(first[2])).toBe(8); // up a minor sixth
    expect(snap[3] ?? 0.8).toBeLessThan(first[3] ?? 0.8);
  });

  /**
   * The final form: the pedal drops on the first whole-tone note, so the
   * harmony loses its floor at the same instant his scale stops containing a
   * tonic. If the pedal keeps playing there, the moment does not happen.
   */
  it('drops the pedal through the whole-tone final form', () => {
    const pedal = channel(t, 'organ pedal').notes;
    const inside = pedal.filter((n) => n[0] >= 182 && n[0] < 190);
    expect(inside).toEqual([]);
  });

  /**
   * "The organ pedal holds C#1 under bar 1 and G1 under the #4 — the tritone
   * lives there, in the floor, not in the tune." The #4 is the only pitch in
   * the motif that belongs to no key and it is dotted rather than passing so
   * that it carries weight; the weight is this note. It went missing once.
   */
  it('puts the tritone in the floor under the #4', () => {
    const pedal = channel(t, 'organ pedal').notes;
    for (const head of [16, 24, 32, 40, 48, 135]) {
      const under = pedal.filter((n) => Math.abs(n[0] - (head + 4)) < 1e-6);
      expect(under.length, `nothing under the #4 of the statement at beat ${head}`).toBe(1);
      expect(toMidi(under[0]![2]) % 12, `the note under the #4 at beat ${head + 4}`)
        .toBe(toMidi('G1') % 12);
      // One note, not the octave doubling: that is bar 1's alone.
      expect(under[0]![3] ?? 0.8).toBeLessThan(
        Math.max(...pedal.filter((n) => Math.abs(n[0] - head) < 1e-6).map((n) => n[3] ?? 0.8)),
      );
    }
  });

  /** Even six cymbals are a phrase, and the cue's shape has to reach them. */
  it('does not crash at one velocity for the whole cue', () => {
    const crash = channel(t, 'crash').notes;
    expect(new Set(velocities(crash)).size).toBeGreaterThan(2);
  });

  /**
   * "He moves at his own pace, unbothered by the band." The pulse may only
   * bend where the band is not playing — the cold interlude, beats 119-135.
   * Bending it under the seven-beat turnarounds would turn 2+2+3 into a
   * mistake, and bending it under the riff sections would make him the one
   * following.
   */
  it('bends the pulse only where he is alone', () => {
    const curve = tempoCurveOf(t);
    expect(curve.hasMap).toBe(true);
    for (const beat of [0, 16, 48, 80, 87, 118, 135, 167, 174, 216]) {
      expect(curve.bpmAt(beat), `the pulse moved at beat ${beat}`).toBeCloseTo(132, 3);
    }
    expect(curve.bpmAt(131)).toBeLessThan(120);
  });
});

describe('boss-yunalesca', () => {
  const t = getTrack('boss-yunalesca');
  const CANONS = ['choir canon low', 'choir canon high', 'canon onsets'];
  /** Beat her third form starts on: 8 intro bars + two 20-bar sections, in 6/8. */
  const FORM3 = (8 + 20 + 20) * 3;

  /** "Velocity locked at 0.62 — deliberately unhumanised here and nowhere else." */
  it('locks the canon at 0.62', () => {
    for (const name of CANONS.slice(0, 2)) {
      const vs = new Set(velocities(channel(t, name).notes));
      expect([...vs], name).toEqual([0.62]);
    }
  });

  /**
   * The entries are at the octave and the fourth, never the tritone: a tritone
   * canon on a modal tune reads as noise rather than as rite.
   */
  it('enters at the octave and the fourth', () => {
    const notes = [...channel(t, 'canon onsets').notes].sort((a, b) => a[0] - b[0] || toMidi(a[2]) - toMidi(b[2]));
    const firstStatement = notes.filter((n) => n[0] >= 84 && n[0] < 84 + 4);
    const entryPitches = [...new Set(firstStatement.map((n) => toMidi(n[2])))].sort((a, b) => a - b);
    // F3, Bb3, F4, Bb4 — fourths and octaves, and nothing six semitones apart.
    for (let i = 1; i < entryPitches.length; i++) {
      expect((entryPitches[i]! - entryPitches[0]!) % 12).not.toBe(6);
    }
  });

  /**
   * F PHRYGIAN. The 2 is replaced by Seymour's b2 everywhere — so no G natural
   * survives in the hymn material — and the 7th is NEVER sharpened, in any
   * transformation, for any reason, so no E natural either.
   */
  it('is Phrygian: no natural 2, and no leading tone anywhere', () => {
    const G = 7;
    const E = 4; // the leading tone of F, banned in every HYMN transformation
    for (const ch of t.channels) {
      if (/taiko|timpani/.test(ch.instrument)) continue; // fixed-pitch, unpitched in effect
      for (const n of ch.notes) {
        const pc = pitchClass(n, ch);
        expect(pc, `${ch.name} sounds a natural 2 (G) at beat ${n[0]}`).not.toBe(G);
        expect(pc, `${ch.name} sounds a leading tone (E) at beat ${n[0]}`).not.toBe(E);
      }
    }
  });

  /**
   * THEMES.md §Humanisation: "Vegnagun, the Yunalesca canon — `<= 3 ms`. The
   * only places machine timing is the point." The `choir` preset is 34 ms,
   * which is a congregation; the canon is not a congregation. `perform` takes
   * it down for these three channels and for nothing else in the game.
   */
  it('runs the canon at machine timing and lets the rest of the cue breathe', () => {
    for (const name of CANONS) {
      expect(jitterOf(channel(t, name)), `${name} is not tight enough to be a machine`)
        .toBeLessThanOrEqual(3);
    }
    // The two lines that are not the machine. The cello is a SOLOIST (8-12 ms
    // per the same table), not a section, and not a machine either.
    expect(jitterOf(channel(t, 'harp ostinato'))).toBeGreaterThan(3);
    const cello = jitterOf(channel(t, 'cello solo'));
    expect(cello).toBeGreaterThanOrEqual(8);
    expect(cello).toBeLessThanOrEqual(12);
  });

  /**
   * The two appoggiaturas in the solo cello: bar 6's sigh, and then the
   * Phrygian amen — the Gb that leans is LOUDER than the F it falls to. They
   * are the only ones in the cue, because it is the only line allowed to mean
   * anything; everything else here is a machine on purpose.
   *
   * Asserted by position. This test used to name beats 192 and 195, and those
   * beats stopped existing the moment the line got the ritardando its own
   * comment had been promising: `agogic()` and an 18% pull across the last two
   * notes move every attack in the phrase. The amen is the last two notes of
   * the line, and that is true whatever the rubato does to where they land.
   */
  it('leans the sigh and the Phrygian amen in the cello', () => {
    const cello = channel(t, 'cello solo');
    // The overrun phrase — HYMN bars 5-8, over the top of the third form.
    const overrun = cello.notes.filter((n) => n[0] >= FORM3 + 24 - 1e-6);
    expect(overrun.length, 'the cello sings bars 5-8 over the third form').toBe(11);
    expectLeansByIndex(cello, overrun, [
      [4, 5, "bar 6's sigh, 4 -> b3"],
      [-2, -1, 'AMEN_PHRYGIAN, bar 8: the b2 leaning on the iv, and home'],
    ]);
  });

  /** The cello is the one thing in the cue that is allowed to be a person. */
  it('gives the solo cello a shaped line and nothing else rubato', () => {
    const cello = channel(t, 'cello solo').notes;
    expect(new Set(velocities(cello)).size).toBeGreaterThanOrEqual(6);
    // and it is not on the grid the canon is locked to
    const offGrid = cello.filter((n) => Math.abs(n[0] - Math.round(n[0])) > 1e-6);
    expect(offGrid.length).toBeGreaterThan(0);
  });
});

describe('boss-jecht', () => {
  const t = getTrack('boss-jecht');

  /**
   * THE APPOGGIATURA RULE IN THE BRASS, which audio QA found flat.
   *
   * The brass carries FAREWELL from the theme's own climax onward, in the
   * bridge and again in the climax, and `FAREWELL_DYNAMICS` is written one
   * value per BAR — so every fall inside a bar arrived at the same weight as
   * the note it fell to until the lament started leaning. Bar 11's descent is
   * three notes deep, `5 - 4 - b3`, where the middle note is a resolution and
   * a leaning note at once; that is why it is shaped as a falling run rather
   * than as `lean()` pairs, and why it is asserted as a chain here.
   */
  it('leans every fall in the lament, in the bridge and in the climax', () => {
    const brass = channel(t, 'brass');
    // The bridge's statement. Beats are on the grid: nothing is arguing yet.
    expectLeans(brass, [
      [128, 129, 'bridge, bar 11: the octave dips to the b7'],
      [132, 136, 'bridge, bar 11: THE ACHE, the b6 over the tonic, into bar 12'],
      [136, 140, 'bridge, bar 12: 5 -> 4'],
      [140, 142, 'bridge, bar 12: 4 -> b3'],
    ]);
    // The climax's statement, which is also the one that breathes — so these
    // beats are approximate and `attacksAt` is deliberately slack.
    expectLeans(brass, [
      [160, 161, 'climax, bar 11: the octave dips to the b7'],
      [164, 168, 'climax, bar 11: THE ACHE, into bar 12'],
      [168, 172, 'climax, bar 12: 5 -> 4'],
      [172, 174, 'climax, bar 12: 4 -> b3'],
    ]);
  });

  /**
   * "Two people talking over each other, and both of them are right." The
   * lament bends in the climax and FATHER does not follow it: the riff under
   * it stays on the sixteenth grid while the tune is pulled off the beat.
   */
  it('lets FAREWELL breathe where it collides with FATHER', () => {
    const CLIMAX = 144;
    const inClimax = (n: Note): boolean => n[0] >= CLIMAX && n[0] < CLIMAX + 32;
    const lament = channel(t, 'strings').notes.filter(inClimax);
    const offGrid = lament.filter((n) => Math.abs(n[0] * 2 - Math.round(n[0] * 2)) > 1e-6);
    expect(offGrid.length, 'the lament is still on the grid in the climax')
      .toBeGreaterThan(0);
    const riff = channel(t, 'guitar L').notes.filter(inClimax);
    const riffOff = riff.filter((n) => Math.abs(n[0] * 4 - Math.round(n[0] * 4)) > 1e-6);
    expect(riff.length).toBeGreaterThan(0);
    expect(riffOff.map((n) => n[0]), 'FATHER followed the lament off the grid')
      .toEqual([]);
  });

  /**
   * Resemblance guard: "No repeated-note chug — the riff never restrikes the
   * same pitch on consecutive subdivisions." An earlier draft of this cue was
   * built entirely on the banned figure.
   */
  it('never restrikes a pitch on consecutive subdivisions', () => {
    for (const name of ['guitar L', 'guitar R', 'bass']) {
      const notes = [...channel(t, name).notes].sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < notes.length; i++) {
        const gap = notes[i]![0] - notes[i - 1]![0];
        if (gap > 0.5 || gap <= 1e-6) continue; // not consecutive subdivisions, or a chord
        expect(
          toMidi(notes[i]![2]),
          `${name} restrikes the same pitch at beats ${notes[i - 1]![0]} and ${notes[i]![0]}`,
        ).not.toBe(toMidi(notes[i - 1]![2]));
      }
    }
  });

  /** No shouted or chanted male vocal; the only voices are the climax's choir. */
  it('uses voices only for the lament in the climax', () => {
    const choir = channel(t, 'choir');
    expect(choir.notes.length).toBeGreaterThan(0);
    for (const n of choir.notes) {
      expect(n[0]).toBeGreaterThanOrEqual(144);
      expect(n[0]).toBeLessThan(176);
    }
  });

  /**
   * THE ONE RENDERER CONSTRAINT: the and-of-beat is LOUDER than the downbeat.
   * Machines invert this, and inverting it is the loudest tell there is.
   */
  it('plays the and-of-beat louder than the downbeat', () => {
    const notes = channel(t, 'guitar L').notes.filter((n) => n[0] >= 16 && n[0] < 48 && n[1] > 0.26);
    const onBeat = notes.filter((n) => Math.abs(n[0] - Math.round(n[0])) < 1e-6);
    const offBeat = notes.filter((n) => Math.abs(n[0] - Math.round(n[0])) > 1e-6);
    expect(onBeat.length).toBeGreaterThan(0);
    expect(offBeat.length).toBeGreaterThan(0);
    const mean = (ns: Note[]): number => ns.reduce((a, n) => a + (n[3] ?? 0.8), 0) / ns.length;
    expect(mean(offBeat)).toBeGreaterThan(mean(onBeat));
  });

  /**
   * The climax superimposes the two themes with FATHER entering two beats
   * late, so its syncopations land against the lament's downbeats rather than
   * with them. Do not smooth this out.
   */
  it('enters the riff two beats late under the lament in the climax', () => {
    const CLIMAX = 144;
    const lament = channel(t, 'strings').notes.filter((n) => n[0] >= CLIMAX && n[0] < CLIMAX + 32);
    const riff = channel(t, 'guitar L').notes.filter((n) => n[0] >= CLIMAX && n[0] < CLIMAX + 32);
    expect(Math.min(...lament.map((n) => n[0]))).toBe(CLIMAX);
    expect(Math.min(...riff.map((n) => n[0]))).toBe(CLIMAX + 2 + FATHER[0]![0]);
  });

  /** The blue b5 stays rationed: exactly two grace notes per statement. */
  it('rations the blue note to two grace notes per statement', () => {
    const graces = FATHER.filter((n) => n[1] <= 0.26);
    expect(graces).toHaveLength(2);
    const offsets = graces.map((n) => n[2]);
    expect(offsets).toEqual([6, 6]); // the b5, climbing once and falling once
  });
});

describe('boss-yu-yevon', () => {
  const t = getTrack('boss-yu-yevon');

  /**
   * THE APPOGGIATURA RULE IN THE TUNE, which audio QA found flat and, at the
   * climax, backwards. Every held stepwise fall in HYMN's soprano, at this
   * cue's double augmentation, with the hymn bar each one belongs to.
   *
   * Two of these are not `lean()` pairs and that is the point of asserting
   * them here: bar 6's b3 falls across the barline into bar 7 while itself
   * being the resolution of bar 6's sigh, and bar 10's neighbour sat at one
   * velocity for all three of its notes. Both are written levels now.
   *
   * The climax is asserted twice because it is a six-beat note re-struck by
   * `swell()`: BOTH of its attacks have to stay above the note it falls to,
   * which is exactly what it used to get wrong.
   */
  it('leans every stepwise fall in the prayer', () => {
    expectLeans(channel(t, 'choir soprano'), [
      [44, 48, 'bar 6: the first sigh, 4 -> b3'],
      [48, 52, 'bar 6 into bar 7, across the barline: b3 -> 2'],
      [60, 64, 'bar 8: THE AMEN, 2 -> 1'],
      [76, 80, 'bar 10: the neighbour inside the climb, 5 -> 4'],
      [84, 90, 'bar 11: THE CLIMAX, 8 -> b7'],
      [87, 90, 'bar 11: the climax re-struck by swell(), still above its fall'],
      [92, 96, 'bar 12: the descent out of the climax, 5 -> 4'],
      [108, 112, 'bar 14: the sigh again, on the way home, 4 -> b3'],
    ]);
  });

  /** "Choir only over a single low drone. No attack, no percussion." */
  it('has no percussion at all', () => {
    const drums = t.channels.filter((c) =>
      /kick|snare|hat|taiko|timpani|crash|tom|drum|cymbal|tam/.test(c.instrument),
    );
    expect(drums.map((c) => c.name)).toEqual([]);
  });

  /** One drone, one pitch class, and it never changes chord under the voices. */
  it('drones on a single pitch', () => {
    for (const name of ['drone strings', 'drone organ']) {
      const pcs = new Set(channel(t, name).notes.map((n) => toMidi(n[2]) % 12));
      expect([...pcs], name).toHaveLength(1);
    }
  });

  /**
   * Bars 12-16 are stripped of their harmony: from the climax on, the voices
   * sing unaccompanied. Bar 12 begins at beat 92.
   */
  it('strips the harmony from bar 12 onward', () => {
    const STRIP = 92;
    for (const name of ['drone strings', 'drone organ', 'music box']) {
      const late = channel(t, name).notes.filter((n) => n[0] >= STRIP);
      expect(late, `${name} still sounds after the harmony is stripped`).toEqual([]);
    }
    const voicesLate = channel(t, 'choir soprano').notes.filter((n) => n[0] >= STRIP);
    expect(voicesLate.length).toBeGreaterThan(0);
  });

  /**
   * THE REFUSAL. The closing amen is replaced by an `Am` held and never
   * resolved: the soprano's F#4 leans on the iv and never falls to the tonic.
   * If a later edit "fixes" this into a cadence, the cue stops meaning what it
   * means, so the last sung pitch is asserted directly.
   */
  it('never resolves the last chord', () => {
    const soprano = [...channel(t, 'choir soprano').notes].sort((a, b) => a[0] - b[0]);
    const last = soprano[soprano.length - 1]!;
    expect(toMidi(last[2]) % 12).toBe(toMidi('F#4') % 12);
    // Am, not Em: root, third and fifth held underneath, and no tonic bass.
    for (const [name, pitch] of [['choir alto', 'C4'], ['choir tenor', 'A3'], ['choir bass', 'A2']] as const) {
      const notes = [...channel(t, name).notes].sort((a, b) => a[0] - b[0]);
      expect(toMidi(notes[notes.length - 1]![2]) % 12, name).toBe(toMidi(pitch) % 12);
    }
  });

  /** No leading tone, ever, in any transformation of HYMN. In E, that is D#. */
  it('has no leading tone anywhere', () => {
    const DSHARP = toMidi('D#4') % 12;
    for (const ch of t.channels) {
      for (const n of ch.notes) {
        expect(pitchClass(n, ch), `${ch.name} at beat ${n[0]}`).not.toBe(DSHARP);
      }
    }
  });

  /**
   * The organum enters a fifth above and EIGHT BEATS LATE, and is left singing
   * alone at the end — the hymn finishes as bare organum, on the fifth.
   */
  it('leaves the organum singing alone at the end', () => {
    const organum = [...channel(t, 'choir organum').notes].sort((a, b) => a[0] - b[0]);
    expect(organum[0]![0]).toBe(108); // bar 13 (beat 100) plus eight
    const end = (n: Note): number => n[0] + n[1];
    const organumEnd = Math.max(...organum.map(end));
    const choirEnd = Math.max(...channel(t, 'choir soprano').notes.map(end));
    expect(organumEnd).toBeGreaterThan(choirEnd);
    // and it closes on the fifth of the key, not the tonic
    expect(toMidi(organum[organum.length - 1]![2]) % 12).toBe(toMidi('B4') % 12);
  });
});
