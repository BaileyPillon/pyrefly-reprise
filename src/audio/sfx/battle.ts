/** Weapon, impact and creature SFX. */

import { makeNoise } from '../dsp/oscillators.ts';
import { addAt, blank, fmTone, noiseBurst, tone, trim, voiceNote } from './kit.ts';
import type { SfxDef } from './kit.ts';

export const battleSfx: Record<string, SfxDef> = {
  'sword-slash-1': {
    about: 'Fast blade whoosh, left to right.',
    render: (sr) => {
      const out = blank(sr, 0.3);
      addAt(out, noiseBurst(sr, { dur: 0.16, freq: 1400, freqTo: 7200, q: 1.9, gain: 0.5, attack: 0.012, curve: 3 }), 0, sr, 0.9, -0.35);
      addAt(out, noiseBurst(sr, { dur: 0.12, freq: 5200, freqTo: 2200, q: 2.4, gain: 0.3, attack: 0.004, curve: 4 }), 0.08, sr, 0.8, 0.4);
      return trim(out, 0.72);
    },
  },
  'sword-slash-2': {
    about: 'Heavier blade whoosh with a metallic edge, right to left.',
    render: (sr) => {
      const out = blank(sr, 0.34);
      addAt(out, noiseBurst(sr, { dur: 0.2, freq: 900, freqTo: 5200, q: 1.5, gain: 0.5, attack: 0.02, curve: 2.6, seed: 991 }), 0, sr, 0.9, 0.35);
      addAt(out, fmTone(sr, { freq: 2100, ratio: 3.4, index: 1.6, indexTo: 0.2, dur: 0.12, gain: 0.22, curve: 5 }), 0.12, sr, 0.7, -0.3);
      return trim(out, 0.74);
    },
  },
  'hit-1': {
    about: 'Solid physical impact.',
    render: (sr) => {
      const out = blank(sr, 0.4);
      addAt(out, tone(sr, { freq: 190, toFreq: 62, glide: 0.5, dur: 0.22, wave: 'sine', gain: 0.8, curve: 4, drive: 2 }), 0, sr, 0.95);
      addAt(out, noiseBurst(sr, { dur: 0.13, freq: 1600, freqTo: 500, q: 0.7, gain: 0.45, curve: 5, seed: 77 }), 0, sr, 0.8);
      return trim(out, 0.85);
    },
  },
  'hit-2': {
    about: 'Lighter, snappier impact for glancing blows.',
    render: (sr) => {
      const out = blank(sr, 0.32);
      addAt(out, tone(sr, { freq: 260, toFreq: 96, glide: 0.5, dur: 0.15, wave: 'sine', gain: 0.6, curve: 5, drive: 1.6 }), 0, sr, 0.9);
      addAt(out, noiseBurst(sr, { dur: 0.1, freq: 2600, freqTo: 900, q: 0.8, gain: 0.4, curve: 6, seed: 313 }), 0, sr, 0.85);
      return trim(out, 0.8);
    },
  },
  critical: {
    about: 'Critical hit: impact plus a ringing metallic flash.',
    render: (sr) => {
      const out = blank(sr, 0.9);
      addAt(out, tone(sr, { freq: 240, toFreq: 55, glide: 0.45, dur: 0.3, wave: 'sine', gain: 0.9, curve: 3.5, drive: 2.5 }), 0, sr, 1);
      addAt(out, noiseBurst(sr, { dur: 0.18, freq: 3200, freqTo: 800, q: 0.6, gain: 0.5, curve: 4, seed: 4242 }), 0, sr, 0.9);
      addAt(out, fmTone(sr, { freq: 1480, ratio: 2.76, index: 5, indexTo: 0.4, dur: 0.55, gain: 0.3, curve: 3 }), 0.01, sr, 0.8, 0.2);
      addAt(out, voiceNote(sr, 'bell', 'E6', 0.5, 0.5), 0.02, sr, 0.35, -0.25);
      return trim(out, 0.9);
    },
  },
  'ko-fall': {
    about: 'A fighter goes down: descending groan and a body thud.',
    render: (sr) => {
      const out = blank(sr, 1.1);
      addAt(out, tone(sr, { freq: 420, toFreq: 90, glide: 1.4, dur: 0.6, wave: 'saw', cutoff: 1400, cutoffTo: 320, resonance: 1.6, gain: 0.35, curve: 2.2 }), 0, sr, 0.85);
      addAt(out, tone(sr, { freq: 130, toFreq: 48, glide: 0.4, dur: 0.35, wave: 'sine', gain: 0.7, curve: 4 }), 0.5, sr, 0.9);
      addAt(out, noiseBurst(sr, { dur: 0.3, freq: 700, freqTo: 180, q: 0.6, gain: 0.3, curve: 4, seed: 8181 }), 0.5, sr, 0.8);
      return trim(out, 0.82);
    },
  },
  footstep: {
    about: 'Single boot on stone.',
    render: (sr) => {
      const out = blank(sr, 0.18);
      addAt(out, noiseBurst(sr, { dur: 0.1, freq: 900, freqTo: 320, q: 0.8, gain: 0.35, curve: 6, seed: 5150 }), 0, sr, 0.8);
      addAt(out, tone(sr, { freq: 110, toFreq: 70, dur: 0.08, wave: 'sine', gain: 0.4, curve: 6 }), 0, sr, 0.7);
      return trim(out, 0.5);
    },
  },
  'victory-fanfare': {
    about: 'Short original victory sting: rising brass triad over timpani.',
    render: (sr) => {
      const out = blank(sr, 2.6);
      const brass: Array<[string, number, number, number]> = [
        ['C5', 0.0, 0.16, 0.85],
        ['E5', 0.16, 0.16, 0.85],
        ['G5', 0.32, 0.16, 0.9],
        ['C6', 0.48, 1.5, 1.0],
      ];
      for (const [pitch, at, dur, vel] of brass) {
        addAt(out, voiceNote(sr, 'brass', pitch, dur, vel), at, sr, 0.8, -0.1);
      }
      // Lower section holds the triad under the last note.
      for (const pitch of ['C4', 'E4', 'G4']) {
        addAt(out, voiceNote(sr, 'brass', pitch, 1.5, 0.6), 0.48, sr, 0.42, 0.18);
      }
      addAt(out, voiceNote(sr, 'timpani', 'C2', 0.4, 0.9), 0, sr, 0.7);
      addAt(out, voiceNote(sr, 'timpani', 'G2', 0.4, 0.7), 0.24, sr, 0.5);
      addAt(out, voiceNote(sr, 'timpani', 'C2', 1.2, 1), 0.48, sr, 0.8);
      addAt(out, voiceNote(sr, 'crash', 'C5', 1.6, 0.7), 0.48, sr, 0.5, 0.2);
      return trim(out, 0.88);
    },
  },
  'boss-roar': {
    about: 'Low, guttural roar with a rising snarl.',
    render: (sr) => {
      const out = blank(sr, 1.8);
      addAt(out, fmTone(sr, { freq: 70, toFreq: 105, ratio: 1.51, index: 6, indexTo: 2.5, dur: 1.4, gain: 0.7, curve: 1.6, crunchAmount: 0.6, attack: 0.08 }), 0, sr, 1);
      addAt(out, fmTone(sr, { freq: 141, toFreq: 190, ratio: 2.02, index: 4, indexTo: 1, dur: 1.2, gain: 0.3, curve: 2, crunchAmount: 0.5, attack: 0.12 }), 0.05, sr, 0.7, 0.2);
      addAt(out, noiseBurst(sr, { dur: 1.3, freq: 600, freqTo: 2400, q: 0.9, gain: 0.22, attack: 0.25, curve: 2, seed: 60606 }), 0.05, sr, 0.8, -0.2);
      return trim(out, 0.9);
    },
  },
  'machina-whir': {
    about: 'Machina spin-up: motor whine, mechanical ticks, steam release.',
    render: (sr) => {
      const out = blank(sr, 1.6);
      addAt(out, tone(sr, { freq: 180, toFreq: 640, glide: 0.7, dur: 1.1, wave: 'pulse', width: 0.24, cutoff: 900, cutoffTo: 3200, resonance: 2.6, gain: 0.3, curve: 1.4, attack: 0.1 }), 0, sr, 0.85, -0.15);
      const tick = makeNoise(24680);
      for (let i = 0; i < 9; i++) {
        const at = 0.08 + i * 0.1 - i * i * 0.0035;
        addAt(out, noiseBurst(sr, { dur: 0.05, freq: 2400 + tick() * 600, q: 2.2, gain: 0.3, curve: 7, seed: 100 + i }), at, sr, 0.7, tick() * 0.5);
      }
      addAt(out, noiseBurst(sr, { dur: 0.5, freq: 5200, freqTo: 1800, q: 0.7, gain: 0.25, attack: 0.02, curve: 2.4, seed: 999 }), 1.0, sr, 0.8, 0.25);
      return trim(out, 0.8);
    },
  },
};
