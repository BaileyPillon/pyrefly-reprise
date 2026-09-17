/**
 * Story ambiences: the cues the chapter scripts call with `sfx()` between
 * lines — wind on the Prominence, a Ronso's grief, the fayth humming, a voice
 * returning from the Farplane.
 *
 * These are longer and softer than combat cues (up to ~3.8 s) and are only ever
 * heard in cutscenes. `SfxWarmer` warms them right after the menu cues, because
 * a player reaches a chapter's opening cutscene before its battle.
 *
 * Everything is synthesised from the kit. `lenne-song` sings this project's own
 * `LENNE` leitmotif (`src/audio/tracks/motifs.ts`); nothing here transcribes or
 * imitates a retail melody. `tests/unit/audio-story-cues.test.ts` fails if a
 * script ever names a cue that is not in the bank — a missing cue used to throw
 * inside the cutscene runner and stop the scene dead.
 */

import type { Stereo } from '../dsp/buffer.ts';
import { pitchToFreq, toMidi, type Pitch } from '../score.ts';
import { LENNE } from '../tracks/motifs.ts';
import { addAt, blank, fmTone, noiseBurst, tone, trim } from './kit.ts';
import type { SfxDef } from './kit.ts';

/*
 * COST. These cues hold notes for two to three seconds, and the instrument
 * voices (`choir`, `pad`, `strings-low`) are priced for short musical notes:
 * built from them, four of these cues rendered at 3-4x the heaviest existing
 * cue in the bank. The two helpers below build the same shapes from the kit's
 * cheap primitives — a filtered, vibrato'd oscillator pair plus a breath band
 * reads as a wordless voice at roughly a tenth of the cost.
 */

/** A wordless sung vowel: a triangle and a formant-filtered saw, a hair apart, with breath. */
function sung(sr: number, pitch: Pitch, dur: number, gain: number, seed: number): Stereo {
  const f = pitchToFreq(pitch);
  const out = blank(sr, dur);
  const shape = { dur, attack: Math.min(0.25, dur * 0.2), hold: 0.55, curve: 2.4, vibrato: 0.009, vibratoRate: 5.2 };
  addAt(out, tone(sr, { ...shape, freq: f, wave: 'tri', gain: gain * 0.7 }), 0, sr, 1, -0.08);
  addAt(out, tone(sr, { ...shape, freq: f * 1.004, wave: 'saw', cutoff: 1150, cutoffTo: 850, resonance: 2.6, gain: gain * 0.35 }), 0, sr, 1, 0.08);
  addAt(out, noiseBurst(sr, { dur, freq: 1300, q: 2.2, gain: gain * 0.08, attack: shape.attack, hold: 0.5, curve: 2.4, seed }), 0, sr, 1);
  return out;
}

/** A soft sustained bed under the voices: two detuned, dark oscillators. */
function bed(sr: number, pitch: Pitch, dur: number, gain: number): Stereo {
  const f = pitchToFreq(pitch);
  const out = blank(sr, dur);
  const shape = { dur, attack: Math.min(0.6, dur * 0.25), hold: 0.5, curve: 2, cutoff: 700, cutoffTo: 500, resonance: 1.2 };
  addAt(out, tone(sr, { ...shape, freq: f * 0.997, wave: 'saw', gain }), 0, sr, 1, -0.3);
  addAt(out, tone(sr, { ...shape, freq: f * 1.003, wave: 'saw', gain }), 0, sr, 1, 0.3);
  return out;
}

/** A high glassy shimmer: two sines a few cents apart, slow swell. */
function shimmer(sr: number, pitch: Pitch, dur: number, gain: number): Stereo {
  const f = pitchToFreq(pitch);
  const out = blank(sr, dur);
  const shape = { dur, attack: dur * 0.3, hold: 0.3, curve: 2.5, wave: 'sine' as const, gain };
  addAt(out, tone(sr, { ...shape, freq: f, vibrato: 0.004, vibratoRate: 3 }), 0, sr, 1, -0.4);
  addAt(out, tone(sr, { ...shape, freq: f * 1.006, vibrato: 0.004, vibratoRate: 2.3 }), 0, sr, 1, 0.4);
  return out;
}

export const storySfx: Record<string, SfxDef> = {
  'wind-high-altitude': {
    about: 'Thin, cold summit wind: a low bed, a narrow keening whistle, slowly drifting across the stereo field.',
    render: (sr) => {
      const out = blank(sr, 3.2);
      // Body of the wind, left then right, slow swell and fade.
      addAt(out, noiseBurst(sr, { dur: 3.1, freq: 320, freqTo: 230, q: 0.6, gain: 0.5, attack: 0.9, hold: 0.35, curve: 1.6, seed: 4101 }), 0, sr, 0.8, -0.35);
      addAt(out, noiseBurst(sr, { dur: 2.9, freq: 700, freqTo: 1050, q: 0.9, gain: 0.35, attack: 1.1, hold: 0.25, curve: 1.8, seed: 4102 }), 0.25, sr, 0.6, 0.35);
      // The narrow band is what reads as "high and cold".
      addAt(out, noiseBurst(sr, { dur: 2.6, freq: 2400, freqTo: 3100, q: 7, gain: 0.3, attack: 1.0, hold: 0.2, curve: 2, seed: 4103 }), 0.4, sr, 0.45, 0.1);
      addAt(out, tone(sr, { freq: 1180, toFreq: 1320, glide: 0.8, wave: 'sine', dur: 2.4, gain: 0.06, attack: 0.9, hold: 0.2, curve: 2.2, vibrato: 0.012, vibratoRate: 0.7 }), 0.5, sr, 0.5, -0.1);
      return trim(out, 0.5);
    },
  },

  'wind-gust': {
    about: 'A single gust: swells in, whistles past left to right, and drops away.',
    render: (sr) => {
      const out = blank(sr, 1.7);
      addAt(out, noiseBurst(sr, { dur: 1.5, freq: 480, freqTo: 1500, q: 0.9, gain: 0.55, attack: 0.38, hold: 0.15, curve: 2.6, seed: 4201 }), 0, sr, 0.85, -0.45);
      addAt(out, noiseBurst(sr, { dur: 1.3, freq: 620, freqTo: 1700, q: 1.0, gain: 0.45, attack: 0.3, hold: 0.1, curve: 2.8, seed: 4202 }), 0.12, sr, 0.7, 0.45);
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 2900, freqTo: 2200, q: 8, gain: 0.3, attack: 0.25, curve: 3, seed: 4203 }), 0.2, sr, 0.35, 0.2);
      return trim(out, 0.62);
    },
  },

  'kimahri-roar': {
    about: 'A Ronso roar of grief rather than threat: a torn, falling cry over breath.',
    render: (sr) => {
      const out = blank(sr, 1.6);
      // Distinct from the enemy `boss-roar`: it falls, and it breaks.
      addAt(out, fmTone(sr, { freq: 118, toFreq: 84, ratio: 1.5, index: 6, indexTo: 1.8, dur: 1.4, attack: 0.07, curve: 1.9, gain: 0.55, crunchAmount: 0.25 }), 0, sr, 0.8);
      addAt(out, tone(sr, { freq: 236, toFreq: 168, glide: 1.3, wave: 'saw', dur: 1.3, cutoff: 1100, cutoffTo: 480, resonance: 3, drive: 2.2, gain: 0.35, attack: 0.06, curve: 2, vibrato: 0.03, vibratoRate: 6.5 }), 0.02, sr, 0.6);
      addAt(out, noiseBurst(sr, { dur: 1.2, freq: 950, freqTo: 600, q: 0.8, gain: 0.35, attack: 0.05, curve: 2.4, seed: 4301 }), 0, sr, 0.45);
      return trim(out, 0.78);
    },
  },

  'fayth-hum': {
    about: 'The fayth humming: a soft wordless choir chord that blooms and hangs, with a high shimmer.',
    render: (sr) => {
      const out = blank(sr, 3.1);
      addAt(out, bed(sr, 'D3', 2.9, 0.3), 0, sr, 0.5);
      addAt(out, sung(sr, 'D4', 2.7, 0.5, 4501), 0.1, sr, 0.55, -0.25);
      addAt(out, sung(sr, 'A4', 2.5, 0.45, 4502), 0.35, sr, 0.5, 0.25);
      addAt(out, sung(sr, 'F5', 2.2, 0.36, 4503), 0.65, sr, 0.42, 0);
      addAt(out, shimmer(sr, 'A6', 2.0, 0.2), 0.9, sr, 0.18, 0.3);
      return trim(out, 0.55);
    },
  },

  'dome-echo': {
    about: 'One sound in a vast stone hall, answered by echoes that darken as they fade.',
    render: (sr) => {
      const out = blank(sr, 2.5);
      // Each return is quieter, lower (air eats the highs) and on the other side.
      for (let i = 0; i < 5; i += 1) {
        const at = i * 0.34;
        const g = 0.9 * 0.55 ** i;
        const pan = i === 0 ? 0 : i % 2 === 1 ? -0.5 : 0.5;
        addAt(out, noiseBurst(sr, { dur: 0.12, freq: 1900 - i * 300, q: 1.2, gain: 0.6, attack: 0.002, curve: 6, seed: 4400 + i }), at, sr, g, pan);
        addAt(out, tone(sr, { freq: 150, toFreq: 110, wave: 'sine', dur: 0.3, gain: 0.5, attack: 0.003, curve: 5 }), at, sr, g * 0.8, pan);
      }
      return trim(out, 0.6);
    },
  },

  'yu-yevon-chant': {
    about: 'A low, wrong chant: two choir voices a half-step apart over a sub drone.',
    render: (sr) => {
      const out = blank(sr, 3.2);
      // The clash is deliberate — this is the thing the whole pilgrimage fed.
      addAt(out, fmTone(sr, { freq: 55, ratio: 1, index: 1.2, indexTo: 2.4, dur: 3.1, attack: 0.8, curve: 1.5, gain: 0.45 }), 0, sr, 0.7);
      addAt(out, bed(sr, 'C2', 3.0, 0.45), 0.05, sr, 0.5);
      addAt(out, sung(sr, 'C3', 2.8, 0.6, 4701), 0.2, sr, 0.55, -0.2);
      addAt(out, sung(sr, 'C#3', 2.6, 0.55, 4702), 0.45, sr, 0.5, 0.2);
      return trim(out, 0.62);
    },
  },

  'machina-groan': {
    about: 'Old machina under strain: an inharmonic metal groan with creaks.',
    render: (sr) => {
      const out = blank(sr, 2.3);
      addAt(out, fmTone(sr, { freq: 72, toFreq: 47, ratio: 2.41, index: 9, indexTo: 3, dur: 2.1, attack: 0.15, curve: 1.8, gain: 0.55, crunchAmount: 0.35 }), 0, sr, 0.8);
      for (let i = 0; i < 3; i += 1) {
        addAt(out, noiseBurst(sr, { dur: 0.35, freq: 320 - i * 50, freqTo: 180, q: 5, gain: 0.45, attack: 0.02, curve: 3.5, drive: 2, seed: 4600 + i }), 0.3 + i * 0.55, sr, 0.5, i === 1 ? 0.4 : -0.3);
      }
      return trim(out, 0.72);
    },
  },

  'farplane-voices': {
    about: 'Many distant voices rising out of the Farplane, each from a different place.',
    render: (sr) => {
      const out = blank(sr, 3.5);
      addAt(out, bed(sr, 'E3', 3.3, 0.28), 0, sr, 0.4);
      const voices: Array<[string, number, number]> = [
        ['E4', 0.0, -0.6],
        ['G4', 0.35, 0.5],
        ['B4', 0.7, -0.2],
        ['D5', 1.05, 0.65],
        ['F#5', 1.4, -0.45],
      ];
      voices.forEach(([pitch, at, pan], i) => {
        addAt(out, sung(sr, pitch, 2.0, 0.35, 4800 + i), at, sr, 0.35, pan);
      });
      addAt(out, shimmer(sr, 'B6', 2.4, 0.16), 0.6, sr, 0.14);
      return trim(out, 0.5);
    },
  },

  'lenne-song': {
    about: "A wordless sung phrase: the project's own LENNE leitmotif on a soft choir voice.",
    render: (sr) => {
      // 0.4 s a beat keeps the whole phrase and its tail inside the bank's
      // 4 s ceiling for a single cue.
      const beat = 0.4;
      const tonic = toMidi('A4');
      const out = blank(sr, 8 * beat + 0.55);
      addAt(out, bed(sr, tonic - 24, 8 * beat + 0.4, 0.22), 0, sr, 0.35);
      LENNE.forEach(([start, dur, offset], i) => {
        // Motif notes are semitone offsets from the tonic.
        addAt(out, sung(sr, tonic + toMidi(offset), dur * beat + 0.25, 0.55, 4900 + i), start * beat, sr, 0.55);
      });
      return trim(out, 0.55);
    },
  },

  'whistle-answer': {
    about: 'A two-finger whistle, then — after a pause — a fainter one answering from far off.',
    render: (sr) => {
      const out = blank(sr, 2.7);
      const whistle = (at: number, gain: number, pan: number): void => {
        addAt(out, tone(sr, { freq: 1900, toFreq: 2650, glide: 0.7, wave: 'sine', dur: 0.3, gain: 0.5, attack: 0.02, hold: 0.5, curve: 3, vibrato: 0.01, vibratoRate: 7 }), at, sr, gain, pan);
        addAt(out, tone(sr, { freq: 2650, toFreq: 2100, glide: 1.2, wave: 'sine', dur: 0.38, gain: 0.5, attack: 0.01, hold: 0.3, curve: 3.2, vibrato: 0.012, vibratoRate: 7 }), at + 0.28, sr, gain, pan);
        addAt(out, noiseBurst(sr, { dur: 0.55, freq: 2400, q: 3, gain: 0.2, attack: 0.02, curve: 3, seed: 4900 + Math.round(at * 10) }), at, sr, gain * 0.35, pan);
      };
      whistle(0, 0.85, -0.3);
      // The answer: quieter, farther, from the other side, with one echo.
      whistle(1.2, 0.4, 0.55);
      whistle(1.45, 0.14, 0.7);
      return trim(out, 0.6);
    },
  },
};
