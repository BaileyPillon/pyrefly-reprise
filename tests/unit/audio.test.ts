import { describe, expect, it } from 'vitest';

import { adsrAt, adsrLength, percEnv, renderAdsr } from '../../src/audio/dsp/envelope.ts';
import { peakOfStereo } from '../../src/audio/dsp/buffer.ts';
import { INSTRUMENTS, getInstrument, instrumentNames } from '../../src/audio/instruments.ts';
import { renderTrack } from '../../src/audio/render.ts';
import {
  chordMidis,
  drumLine,
  midiFromName,
  midiToFreq,
  nameFromMidi,
  notesEnd,
  repeatNotes,
  toMidi,
  tracker,
  transposeNotes,
  type Track,
} from '../../src/audio/score.ts';
import { TRACKS, trackNames } from '../../src/audio/tracks/index.ts';
import { SFX, renderMontage, renderSfx, sfxNames } from '../../src/audio/sfx/index.ts';

const SR = 8000;

function isFinitePair(left: Float32Array, right: Float32Array): boolean {
  for (let i = 0; i < left.length; i++) {
    if (!Number.isFinite(left[i]!) || !Number.isFinite(right[i]!)) return false;
  }
  return true;
}

describe('ADSR envelope', () => {
  const env = { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.4 };
  const hold = 1;

  it('starts at zero and reaches full level at the end of the attack', () => {
    expect(adsrAt(env, 0, hold)).toBe(0);
    expect(adsrAt(env, 0.05, hold)).toBeCloseTo(0.5, 5);
    expect(adsrAt(env, 0.1, hold)).toBeCloseTo(1, 5);
  });

  it('decays exactly onto the sustain level and holds it', () => {
    expect(adsrAt(env, 0.3, hold)).toBeCloseTo(env.sustain, 5);
    expect(adsrAt(env, 0.6, hold)).toBeCloseTo(env.sustain, 5);
    expect(adsrAt(env, 0.99, hold)).toBeCloseTo(env.sustain, 5);
  });

  it('is monotone through attack and decay', () => {
    let previous = -1;
    for (let t = 0; t <= 0.1; t += 0.005) {
      const v = adsrAt(env, t, hold);
      expect(v).toBeGreaterThanOrEqual(previous);
      previous = v;
    }
    previous = 2;
    for (let t = 0.1; t <= 0.3; t += 0.005) {
      const v = adsrAt(env, t, hold);
      expect(v).toBeLessThanOrEqual(previous + 1e-9);
      previous = v;
    }
  });

  it('releases from the held level down to silence', () => {
    expect(adsrAt(env, hold + 0.0001, hold)).toBeCloseTo(env.sustain, 2);
    expect(adsrAt(env, hold + 0.2, hold)).toBeLessThan(env.sustain);
    expect(adsrAt(env, hold + 0.4, hold)).toBeCloseTo(0, 12);
    expect(adsrAt(env, hold + 5, hold)).toBe(0);
  });

  it('releases from wherever it was when the note is cut short', () => {
    const short = adsrAt(env, 0.05, 0.05);
    expect(short).toBeCloseTo(0.5, 5);
    expect(adsrAt(env, 0.05 + 0.4, 0.05)).toBeCloseTo(0, 12);
  });

  it('reports and renders the right length', () => {
    expect(adsrLength(env, hold)).toBeCloseTo(1.4, 6);
    const buf = renderAdsr(env, 1000, hold);
    expect(buf.length).toBe(1400);
    expect(buf[0]).toBe(0);
    expect(buf[100]).toBeCloseTo(1, 4);
    expect(buf[buf.length - 1]).toBeLessThan(0.01);
  });

  it('percussive envelope falls monotonically from full to zero', () => {
    const buf = percEnv(1000, 0.25);
    expect(buf.length).toBe(250);
    expect(buf[0]).toBeCloseTo(1, 5);
    expect(buf[buf.length - 1]).toBeLessThan(0.02);
    for (let i = 1; i < buf.length; i++) expect(buf[i]!).toBeLessThanOrEqual(buf[i - 1]!);
  });
});

describe('pitch helpers', () => {
  it('maps names to MIDI and back', () => {
    expect(midiFromName('C4')).toBe(60);
    expect(midiFromName('A4')).toBe(69);
    expect(midiFromName('C-1')).toBe(0);
    expect(midiFromName('Bb3')).toBe(58);
    expect(midiFromName('F#3')).toBe(54);
    expect(nameFromMidi(60)).toBe('C4');
    expect(nameFromMidi(69)).toBe('A4');
  });

  it('tunes A4 to 440 Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
    expect(midiToFreq(57)).toBeCloseTo(220, 6);
  });

  it('rejects nonsense note names', () => {
    expect(() => midiFromName('H4')).toThrow();
    expect(() => midiFromName('C')).toThrow();
  });
});

describe('tracker parser', () => {
  it('parses a simple line with sticky durations', () => {
    const notes = tracker('C4:1 E4 G4:2');
    expect(notes).toHaveLength(3);
    expect(notes[0]).toEqual([0, 1, 60, 0.8]);
    expect(notes[1]).toEqual([1, 1, 64, 0.8]);
    expect(notes[2]).toEqual([2, 2, 67, 0.8]);
  });

  it('handles chords, rests, barlines and velocity', () => {
    const notes = tracker('C4+E4+G4:2 | -:1 A4:1@0.4');
    expect(notes).toHaveLength(4);
    expect(notes.slice(0, 3).map((n) => n[2])).toEqual([60, 64, 67]);
    expect(notes.slice(0, 3).every((n) => n[0] === 0)).toBe(true);
    expect(notes[3]).toEqual([3, 1, 69, 0.4]);
  });

  it('extends the previous step with a tie', () => {
    const notes = tracker('C4:1 ~:2 E4:1');
    expect(notes).toHaveLength(2);
    expect(notes[0]![1]).toBe(3);
    expect(notes[1]![0]).toBe(3);
  });

  it('applies start, transpose, gate and scale', () => {
    const notes = tracker('C4:1 C4:1', { start: 4, transpose: 12, gate: 0.5, scale: 0.5 });
    expect(notes[0]).toEqual([4, 0.25, 72, 0.8]);
    expect(notes[1]).toEqual([4.5, 0.25, 72, 0.8]);
  });

  it('accepts raw MIDI numbers', () => {
    expect(tracker('60:1')[0]![2]).toBe(60);
  });

  it('validates barlines when asked', () => {
    expect(() => tracker('C4:1 | C4:1', { checkBars: 4 })).toThrow(/barline/i);
    expect(() => tracker('C4:4 | C4:4 |', { checkBars: 4 })).not.toThrow();
  });

  it('rejects malformed tokens', () => {
    expect(() => tracker('C4:0')).toThrow();
    expect(() => tracker('C4:1@x')).toThrow();
  });
});

describe('note transforms and harmony', () => {
  it('transposes, repeats and measures', () => {
    const base = tracker('C4:1 E4:1');
    expect(transposeNotes(base, 2).map((n) => n[2])).toEqual([62, 66]);
    const looped = repeatNotes(base, 3, 2);
    expect(looped).toHaveLength(6);
    expect(looped[4]![0]).toBe(4);
    expect(notesEnd(looped)).toBe(6);
  });

  it('builds chords from symbols', () => {
    expect(chordMidis('Am', { octave: 3 })).toEqual([57, 60, 64]);
    expect(chordMidis('C', { octave: 3 })).toEqual([48, 52, 55]);
    expect(chordMidis('Dm7', { octave: 3 })).toEqual([50, 53, 57, 60]);
    expect(chordMidis('G/B', { octave: 3 })).toEqual([47, 55, 59, 62]);
  });

  it('centres a voicing near a target note', () => {
    for (const midi of chordMidis('F', { octave: 3, center: 64 })) {
      expect(Math.abs(midi - 64)).toBeLessThanOrEqual(6);
    }
  });

  it('reads drum step strings', () => {
    const notes = drumLine('x..X', { step: 0.25, pitch: 'C1', velocity: 0.5 });
    expect(notes).toHaveLength(2);
    expect(notes[0]![0]).toBe(0);
    expect(notes[1]![0]).toBe(0.75);
    expect(notes[1]![3]!).toBeGreaterThan(notes[0]![3]!);
    expect(() => drumLine('z')).toThrow();
  });
});

describe('instruments', () => {
  it('every registered instrument renders finite, non-silent audio', () => {
    for (const name of instrumentNames()) {
      const voice = getInstrument(name);
      const out = voice({ sampleRate: SR, freq: 220, dur: 0.25, velocity: 0.8, seed: 7 });
      expect(out.left.length, name).toBeGreaterThan(SR * 0.05);
      expect(out.left.length, name).toBe(out.right.length);
      expect(isFinitePair(out.left, out.right), name).toBe(true);
      expect(peakOfStereo(out), name).toBeGreaterThan(0.001);
      expect(peakOfStereo(out), name).toBeLessThan(4);
    }
  });

  it('is deterministic for identical input', () => {
    const args = { sampleRate: SR, freq: 330, dur: 0.2, velocity: 0.7, seed: 11 };
    const a = INSTRUMENTS.piano!(args);
    const b = INSTRUMENTS.piano!(args);
    expect(Array.from(a.left.slice(0, 200))).toEqual(Array.from(b.left.slice(0, 200)));
  });

  it('rejects unknown instrument names', () => {
    expect(() => getInstrument('theremin')).toThrow(/Unknown instrument/);
  });
});

describe('renderTrack', () => {
  const demo: Track = {
    name: 'test',
    bpm: 120,
    timeSig: [4, 4],
    loop: { start: 4, end: 12 },
    length: 12,
    tailSec: 1,
    channels: [
      {
        instrument: 'piano',
        volume: 0.8,
        pan: -0.3,
        notes: tracker('C4:1 E4:1 G4:1 C5:1', { start: 0 }),
        fx: { reverb: 0.3 },
      },
      { instrument: 'kick', notes: drumLine('x...x...', { step: 0.5, times: 3 }) },
    ],
  };

  it('produces finite, non-silent stereo output of the expected length', () => {
    const out = renderTrack(demo, SR);
    const expected = Math.ceil((12 * 0.5 + 1) * SR);
    expect(out.left.length).toBe(expected);
    expect(out.right.length).toBe(expected);
    expect(isFinitePair(out.left, out.right)).toBe(true);
    expect(out.peak).toBeGreaterThan(0.5);
    expect(out.peak).toBeLessThan(0.95);
    expect(out.noteCount).toBe(10);
  });

  it('reports loop points in samples that match the beat positions', () => {
    const out = renderTrack(demo, SR);
    expect(out.loopStartSample).toBe(Math.round(4 * 0.5 * SR));
    expect(out.loopEndSample).toBe(Math.round(12 * 0.5 * SR));
    expect(out.loopDurationSec).toBeCloseTo(4, 6);
    expect(out.loopEndSample).toBeLessThanOrEqual(out.left.length);
  });

  it('is deterministic, with or without the note cache', () => {
    const a = renderTrack(demo, SR);
    const b = renderTrack(demo, SR);
    const c = renderTrack(demo, SR, { cache: false });
    expect(Array.from(a.left.slice(0, 500))).toEqual(Array.from(b.left.slice(0, 500)));
    expect(Array.from(a.left.slice(0, 500))).toEqual(Array.from(c.left.slice(0, 500)));
  });

  it('honours channel pan', () => {
    const left = renderTrack(
      { ...demo, channels: [{ instrument: 'piano', pan: -1, notes: tracker('C4:1') }] },
      SR,
    );
    let leftEnergy = 0;
    let rightEnergy = 0;
    for (let i = 0; i < left.left.length; i++) {
      leftEnergy += Math.abs(left.left[i]!);
      rightEnergy += Math.abs(left.right[i]!);
    }
    expect(leftEnergy).toBeGreaterThan(rightEnergy * 50);
  });
});

describe('music tracks', () => {
  it('registers three tracks with sane loops and at least a minute of music', () => {
    expect(trackNames()).toEqual(['title', 'battle-ffx', 'boss-dread']);
    for (const name of trackNames()) {
      const track = TRACKS[name]!;
      const seconds = (track.length * 60) / track.bpm;
      expect(seconds, name).toBeGreaterThanOrEqual(60);
      expect(track.loop.start, name).toBeGreaterThanOrEqual(0);
      expect(track.loop.end, name).toBeGreaterThan(track.loop.start);
      expect(track.loop.end, name).toBeLessThanOrEqual(track.length);
      expect(track.channels.length, name).toBeGreaterThan(2);
      for (const channel of track.channels) {
        expect(INSTRUMENTS[channel.instrument], `${name}:${channel.instrument}`).toBeTypeOf('function');
        expect(channel.notes.length, `${name}:${channel.instrument}`).toBeGreaterThan(0);
        for (const note of channel.notes) {
          expect(note[0], name).toBeGreaterThanOrEqual(0);
          expect(note[1], name).toBeGreaterThan(0);
          const midi = toMidi(note[2]);
          expect(midi, name).toBeGreaterThan(11);
          expect(midi, name).toBeLessThan(120);
        }
      }
    }
  });

  it('renders a real track without clipping or silence', () => {
    const out = renderTrack(TRACKS['boss-dread']!, SR);
    expect(isFinitePair(out.left, out.right)).toBe(true);
    expect(out.peak).toBeLessThan(0.95);
    expect(out.peak).toBeGreaterThan(0.5);
    const loopMiddle = Math.round((out.loopStartSample + out.loopEndSample) / 2);
    let energy = 0;
    for (let i = loopMiddle; i < loopMiddle + SR; i++) energy += Math.abs(out.left[i]!);
    expect(energy / SR).toBeGreaterThan(0.01);
  });
});

describe('sfx bank', () => {
  it('has every documented cue', () => {
    for (const name of [
      'cursor-move',
      'confirm',
      'cancel',
      'error',
      'sword-slash-1',
      'sword-slash-2',
      'hit-1',
      'hit-2',
      'critical',
      'magic-charge',
      'fire',
      'ice',
      'thunder',
      'water',
      'holy',
      'cure',
      'status-applied',
      'ko-fall',
      'overdrive-full',
      'summon',
      'menu-open',
      'menu-close',
      'footstep',
      'coin-tick',
      'victory-fanfare',
      'boss-roar',
      'machina-whir',
      'pyrefly',
    ]) {
      expect(SFX[name], name).toBeDefined();
    }
  });

  it('renders every cue finite, audible and inside full scale', () => {
    for (const name of sfxNames()) {
      const out = renderSfx(name, SR);
      expect(isFinitePair(out.left, out.right), name).toBe(true);
      const peak = peakOfStereo(out);
      expect(peak, name).toBeGreaterThan(0.05);
      expect(peak, name).toBeLessThanOrEqual(1);
      expect(out.left.length, name).toBeGreaterThan(SR * 0.02);
      expect(out.left.length, name).toBeLessThan(SR * 4);
    }
  });

  it('renders a three second montage', () => {
    const out = renderMontage(SR, 3);
    expect(out.left.length).toBe(SR * 3);
    expect(isFinitePair(out.left, out.right)).toBe(true);
    expect(peakOfStereo(out)).toBeGreaterThan(0.2);
    expect(Math.abs(out.left[out.left.length - 1]!)).toBe(0);
  });
});
