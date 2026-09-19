/**
 * Tempo maps, per-channel performance overrides, and the promise that a cue
 * without either is untouched.
 *
 * Nobody here can hear a ritardando, so the tests are arithmetic: a ramp has a
 * closed form (`t = (60/k) ln(bpm1/bpm0)`) and the renderer either lands on it
 * or it does not.
 */

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { renderTrack } from '../../src/audio/render.ts';
import {
  aTempo,
  accel,
  effectiveJitterMs,
  fermata,
  loopDurationSec,
  performanceKey,
  rit,
  tempoCurveOf,
  tempoMap,
  tempoWarnings,
  tracker,
  trackDurationSec,
  type Track,
} from '../../src/audio/score.ts';
import { getTrack, trackNames } from '../../src/audio/tracks/index.ts';

const SR = 8000;

/** Seconds a linear-in-beats tempo ramp takes, from first principles. */
function rampSeconds(beats: number, fromBpm: number, toBpm: number): number {
  const k = (toBpm - fromBpm) / beats;
  if (k === 0) return (beats * 60) / fromBpm;
  return (60 / k) * Math.log(toBpm / fromBpm);
}

describe('tempoCurveOf — no map', () => {
  const plain = { bpm: 138 };

  it('is the same multiplication the renderer always did', () => {
    const curve = tempoCurveOf(plain);
    expect(curve.hasMap).toBe(false);
    for (const beat of [0, 1, 7.5, 64, 511.25]) {
      // Bit-for-bit, not close-to: this is what keeps rendered cues identical.
      expect(curve.secondsAt(beat)).toBe(beat * (60 / 138));
      expect(curve.spanSec(beat, 2)).toBe(2 * (60 / 138));
    }
    expect(curve.bpmAt(999)).toBe(138);
  });

  it('inverts exactly', () => {
    const curve = tempoCurveOf(plain);
    expect(curve.beatAt(curve.secondsAt(32))).toBeCloseTo(32, 12);
  });

  it('rejects a nonsense tempo', () => {
    expect(() => tempoCurveOf({ bpm: 0 })).toThrow(/bpm/);
  });
});

describe('tempoCurveOf — with a map', () => {
  it('steps at a mark and holds until the next one', () => {
    const curve = tempoCurveOf({ bpm: 60, tempo: [[8, 120]] });
    expect(curve.secondsAt(8)).toBeCloseTo(8, 12); // 8 beats at 60 bpm
    expect(curve.secondsAt(12)).toBeCloseTo(8 + 2, 12); // 4 more at 120
    expect(curve.bpmAt(7.999)).toBe(60);
    expect(curve.bpmAt(8)).toBe(120);
  });

  it('lands a ritardando where the maths says', () => {
    // Hold 96 until beat 48, then slow evenly to 60 by beat 56.
    const curve = tempoCurveOf({ bpm: 96, tempo: tempoMap(rit(48, 56, 60)) });
    const before = (48 * 60) / 96;
    expect(curve.secondsAt(48)).toBeCloseTo(before, 12);
    expect(curve.secondsAt(56)).toBeCloseTo(before + rampSeconds(8, 96, 60), 12);
    // The ramp really is slower than either endpoint taken flat.
    expect(rampSeconds(8, 96, 60)).toBeGreaterThan((8 * 60) / 96);
    expect(rampSeconds(8, 96, 60)).toBeLessThan((8 * 60) / 60);
    // Half way through, the tempo is half way down.
    expect(curve.bpmAt(52)).toBeCloseTo(78, 12);
    // And past the ramp it stays where it ended.
    expect(curve.secondsAt(60)).toBeCloseTo(curve.secondsAt(56) + (4 * 60) / 60, 12);
  });

  it('accelerates as the exact mirror of a ritardando', () => {
    const slow = tempoCurveOf({ bpm: 96, tempo: tempoMap(rit(0, 8, 60)) });
    const fast = tempoCurveOf({ bpm: 60, tempo: tempoMap(accel(0, 8, 96)) });
    expect(slow.secondsAt(8)).toBeCloseTo(fast.secondsAt(8), 12);
  });

  it('holds time still for a fermata, after the beat it names', () => {
    const curve = tempoCurveOf({ bpm: 60, tempo: tempoMap(fermata(16, 1.5)) });
    expect(curve.secondsAt(16)).toBeCloseTo(16, 12);
    expect(curve.secondsAt(17)).toBeCloseTo(16 + 1.5 + 1, 12);
    // A note struck on the fermata is held through it.
    expect(curve.spanSec(16, 1)).toBeCloseTo(2.5, 12);
    // And one struck before it is not.
    expect(curve.spanSec(14, 1)).toBeCloseTo(1, 12);
  });

  it('returns to the written tempo with aTempo', () => {
    const curve = tempoCurveOf({ bpm: 100, tempo: tempoMap(rit(4, 8, 50), aTempo(8)) });
    expect(curve.bpmAt(8)).toBe(100);
    expect(curve.bpmAt(7.999)).toBeLessThan(51);
  });

  it('is monotonic everywhere, including across marks and fermatas', () => {
    const curve = tempoCurveOf({
      bpm: 88,
      tempo: tempoMap([16, 132], rit(24, 32, 66), fermata(32, 2), aTempo(32), accel(40, 48, 176)),
    });
    let previous = -1;
    for (let beat = 0; beat <= 64; beat += 0.125) {
      const sec = curve.secondsAt(beat);
      expect(Number.isFinite(sec)).toBe(true);
      expect(sec).toBeGreaterThanOrEqual(previous);
      previous = sec;
    }
  });

  it('inverts through ramps and fermatas', () => {
    const curve = tempoCurveOf({ bpm: 88, tempo: tempoMap(rit(8, 16, 44), fermata(16, 1)) });
    for (const beat of [0, 4, 8, 12, 15.5, 16, 20]) {
      expect(curve.beatAt(curve.secondsAt(beat))).toBeCloseTo(beat, 9);
    }
  });

  it('refuses a map that is out of order, or asks for a standing ramp', () => {
    expect(() => tempoCurveOf({ bpm: 90, tempo: [[8, 100], [4, 120]] })).toThrow(/beat order/);
    expect(() => tempoCurveOf({ bpm: 90, tempo: [{ beat: 0, bpm: 60, curve: 'ramp' }] })).toThrow(
      /nowhere to happen/,
    );
    expect(() => tempoCurveOf({ bpm: 90, tempo: [[8, 0]] })).toThrow(/bpm/);
    expect(() => tempoCurveOf({ bpm: 90, tempo: [{ beat: 8, holdSec: -1 }] })).toThrow(/holdSec/);
  });
});

/** A short cue with a rit. into its loop point, for the render-level tests. */
function mapped(tempo: Track['tempo']): Track {
  return {
    name: 'tempo-demo',
    bpm: 120,
    tempo,
    timeSig: [4, 4],
    loop: { start: 4, end: 12 },
    length: 12,
    tailSec: 0.5,
    channels: [{ instrument: 'piano', notes: tracker('C4:1 E4:1 G4:1 C5:1', { start: 0 }) }],
  };
}

describe('renderTrack through a tempo map', () => {
  it('derives loop points through the map, not from the written bpm', () => {
    // Beats 4..12 at 120 bpm would be 4 s. With the second half at 60 bpm it
    // is 2 s + 4 s = 6 s, and the loop has to know that.
    const track = mapped([[8, 60]]);
    const out = renderTrack(track, SR);
    expect(out.loopStartSample).toBe(Math.round(2 * SR));
    expect(out.loopEndSample).toBe(Math.round(8 * SR));
    expect(out.loopDurationSec).toBeCloseTo(6, 6);
    expect(loopDurationSec(track)).toBeCloseTo(6, 9);
    expect(trackDurationSec(track)).toBeCloseTo(8, 9);
  });

  it('gives the loop the exact length the curve says, fermata included', () => {
    const track = mapped(tempoMap(fermata(6, 1.25)));
    const curve = tempoCurveOf(track);
    const out = renderTrack(track, SR);
    const expected = curve.secondsAt(12) - curve.secondsAt(4);
    expect(expected).toBeCloseTo(4 + 1.25, 9);
    expect(out.loopDurationSec).toBeCloseTo(expected, 3);
    expect((out.loopEndSample - out.loopStartSample) / SR).toBeCloseTo(expected, 3);
  });

  it('renders the whole map, tail included, without running off the buffer', () => {
    const track = mapped(tempoMap(rit(0, 12, 40)));
    const out = renderTrack(track, SR);
    const seconds = tempoCurveOf(track).secondsAt(12) + 0.5;
    expect(out.left.length).toBe(Math.ceil(seconds * SR));
    expect(out.loopEndSample).toBeLessThanOrEqual(out.left.length);
    expect(out.peak).toBeGreaterThan(0);
  });

  it('stretches a note the same way it stretches the bar it sits in', () => {
    // One whole note at 120 bpm is 2 s; under a map that halves the tempo
    // before it, the same written duration plays for twice as long.
    const base: Track = {
      name: 'one-note',
      bpm: 120,
      timeSig: [4, 4],
      loop: { start: 0, end: 4 },
      length: 4,
      tailSec: 0.2,
      channels: [{ instrument: 'strings', notes: [[0, 4, 'C4', 0.8]] }],
    };
    const fast = renderTrack(base, SR);
    const slow = renderTrack({ ...base, tempo: [[0, 60]] }, SR);
    expect(slow.left.length).toBeGreaterThan(fast.left.length * 1.8);
  });

  it('warns when the tempo at the end of the loop is not the tempo at its start', () => {
    const warnings = tempoWarnings(mapped(tempoMap(rit(8, 12, 50))));
    expect(warnings.join(' ')).toMatch(/lurch/);
    expect(tempoWarnings(mapped(tempoMap(rit(4, 8, 50), aTempo(8))))).toEqual([]);
  });
});

describe('a track with no tempo map is byte-identical', () => {
  function digest(name: string, rate: number): string {
    const out = renderTrack(getTrack(name), rate);
    const hash = createHash('sha256');
    hash.update(Buffer.from(out.left.buffer, out.left.byteOffset, out.left.byteLength));
    hash.update(Buffer.from(out.right.buffer, out.right.byteOffset, out.right.byteLength));
    hash.update(`${out.loopStartSample}|${out.loopEndSample}|${out.noteCount}`);
    return hash.digest('hex');
  }

  /**
   * Recorded from `git show HEAD:src/audio/render.ts` — the renderer as it was
   * before tempo maps existed — rendering the same cue at the same rate.
   * Tempo maps and per-channel performance are additive: a cue that asks for
   * neither must come out of the sequencer with the same bits, or all
   * twenty-one shipped MP3s would need re-rendering to stay in step with the
   * scores. If this fails, something in the note clock stopped being a plain
   * `beat * 60 / bpm`...
   *
   * ...OR SOMEBODY EDITED THE CUE, which is the one way this assertion can go
   * red without anything being wrong. It pins the bytes of a real score, so it
   * moves whenever that score does. It has moved once, on purpose:
   *
   *   7c132de48ddc96103e0cae56fafd46d966dc9c7971063cb13a7342d2444fd406
   *     the original baseline, still exactly what `git show
   *     3aa5440:src/audio/tracks/boss-dread.ts` renders to today — which is
   *     how the clock was proved untouched when the number below changed.
   *   6f9a20f9…  the hymn's three appoggiaturas now lean and the canon's
   *     four-note head has an arch, per THEMES.md. Velocities only: no note
   *     start, length or pitch in this cue was different.
   *   d74e2a03…  (current) the brass swells breathe instead of holding one
   *     level, and the choir and low strings ask to be played inside
   *     THEMES.md's humanisation band (`perform`, 34 and 24 ms down to ~16).
   *     Velocities and per-channel timing jitter only; still not one note
   *     start, length or pitch. A `perform` block also changes the note-cache
   *     key, which is why the samples move as well as the timing — see
   *     PIPELINE.md, "Per-channel performance overrides".
   *
   * If you have to move it again, do it the same way: render the previous
   * committed version of the cue and check it still hashes to the line above
   * before you touch this one. Same bits from the old score means the clock is
   * fine and only the music changed.
   */
  it('matches the pre-tempo-map renderer on boss-dread', () => {
    expect(digest('boss-dread', 8000)).toBe(
      'd74e2a03ce6d78f8525c3d7bd35ab676624c156254990471f2392a83b6b433e1',
    );
  });

  /**
   * Two more cues, checked the same way against the same baseline renderer but
   * not re-run here: `title` and `ending-ffx` take ~25 s each to render even at
   * 8 kHz, which is a minute of every full suite for a second opinion. Their
   * digests, for anyone who needs to repeat the comparison by hand:
   *
   *   title       41c9ec068f10c4da969f34101a8ca3483fcc2133dd82a66e43c424b08ce5eac9
   *   ending-ffx  72d4e15129957ca826edc5f7005517ee7407d7deec84b187215e0314a3904437
   *                 — recorded before `ending-ffx` gained a tempo map, so it
   *                   is now a note about a cue that no longer qualifies for
   *                   this comparison at all: the track HAS a map, and the
   *                   `secondsAt` path it takes is the mapped one by design.
   *   boss-dread at 44100: 5bfffd2effdf84dff5e22cf22219821dfd978f6f9222b8a8b9e8bfaf5b0acb41
   *                 (94d351a9… after the appoggiatura fix, and
   *                  97d05108b2d1a1cf4a5c7864b0816ac5b6d953236244fff0aaa963b8014ec59e
   *                  for the original baseline score — which is still what
   *                  `git show 3aa5440:src/audio/tracks/boss-dread.ts`
   *                  renders to, checked at both rates before this line moved)
   */

  it('measures every un-mapped cue exactly as beats over bpm', () => {
    // Cheap version of the hash test across the whole registry: for a track
    // with no map, the clock must still be one multiplication.
    for (const name of trackNames()) {
      const track = getTrack(name);
      if (track.tempo) continue;
      expect(trackDurationSec(track), name).toBe(track.length * (60 / track.bpm));
    }
  });
});

describe('per-channel performance overrides', () => {
  it('replaces, scales and floors the preset figure', () => {
    expect(effectiveJitterMs(16)).toBe(16);
    expect(effectiveJitterMs(16, {})).toBe(16);
    expect(effectiveJitterMs(16, { timingJitterMs: 2 })).toBe(2);
    expect(effectiveJitterMs(16, { humanise: 0.25 })).toBe(4);
    expect(effectiveJitterMs(16, { timingJitterMs: 8, humanise: 0.5 })).toBe(4);
    expect(effectiveJitterMs(16, { humanise: 0 })).toBe(0);
    expect(effectiveJitterMs(0, { humanise: 2 })).toBe(0);
  });

  it('keeps a channel with no overrides on exactly the old cache key', () => {
    expect(performanceKey(undefined)).toBe('');
    expect(performanceKey({})).toBe('');
    expect(performanceKey({ timingJitterMs: 3 })).toBe('|j3');
    expect(performanceKey({ timingJitterMs: 3, humanise: 0.5, velocityJitter: 0.02 })).toBe(
      '|j3,h0.5,v0.02',
    );
  });

  it('humanises velocity deterministically, and only where it is asked for', () => {
    const notes = tracker('C4:1 C4:1 C4:1 C4:1', { start: 0, velocity: 0.7 });
    const base: Track = {
      name: 'vel',
      bpm: 120,
      timeSig: [4, 4],
      loop: { start: 0, end: 4 },
      length: 4,
      tailSec: 0.2,
      channels: [{ instrument: 'piano', notes }],
    };
    const plain = renderTrack(base, SR);
    const again = renderTrack(base, SR);
    expect(Array.from(plain.left)).toEqual(Array.from(again.left));

    const jittered: Track = {
      ...base,
      channels: [{ instrument: 'piano', notes, perform: { velocityJitter: 0.04 } }],
    };
    const a = renderTrack(jittered, SR);
    const b = renderTrack(jittered, SR);
    // Deterministic...
    expect(Array.from(a.left)).toEqual(Array.from(b.left));
    // ...but not the same performance as the un-humanised one.
    expect(Array.from(a.left)).not.toEqual(Array.from(plain.left));
    // Four identical written notes are no longer four identical renders.
    const noteSamples = Math.round(0.5 * SR);
    const energy = (from: number) => {
      let sum = 0;
      for (let i = from; i < from + noteSamples; i++) sum += Math.abs(a.left[i]!);
      return sum;
    };
    expect(energy(0)).not.toBeCloseTo(energy(noteSamples), 4);
  });

  it('refuses a velocity spread past the bible ceiling', () => {
    const track: Track = {
      name: 'too-loose',
      bpm: 120,
      timeSig: [4, 4],
      loop: { start: 0, end: 4 },
      length: 4,
      channels: [{ instrument: 'piano', notes: tracker('C4:1'), perform: { velocityJitter: 0.2 } }],
    };
    expect(() => renderTrack(track, SR)).toThrow(/0\.04 ceiling/);
  });

  it('hands the channel its own voice so two channels on one instrument can differ', () => {
    const asked: Array<[string, number | undefined]> = [];
    const track: Track = {
      name: 'two-desks',
      bpm: 120,
      timeSig: [4, 4],
      loop: { start: 0, end: 4 },
      length: 4,
      tailSec: 0.2,
      channels: [
        { name: 'section', instrument: 'strings', notes: tracker('C4:1') },
        {
          name: 'machine',
          instrument: 'strings',
          notes: tracker('C4:1'),
          perform: { timingJitterMs: 2 },
        },
      ],
    };
    renderTrack(track, SR, {
      voiceFor: (instrument, perform) => {
        asked.push([instrument, effectiveJitterMs(16, perform)]);
        // Any voice will do; the point is what the sequencer asked for.
        return ({ sampleRate }) => {
          const n = Math.round(sampleRate / 10);
          const left = new Float32Array(n).fill(0.25);
          const right = new Float32Array(n).fill(0.25);
          return { left, right };
        };
      },
    });
    expect(asked).toEqual([
      ['strings', 16],
      ['strings', 2],
    ]);
  });
});
