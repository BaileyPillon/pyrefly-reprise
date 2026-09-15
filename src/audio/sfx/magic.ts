/** Spell, summon and pyrefly SFX. */

import { makeNoise } from '../dsp/oscillators.ts';
import { addAt, blank, fmTone, noiseBurst, tone, trim, voiceNote } from './kit.ts';
import type { SfxDef } from './kit.ts';

export const magicSfx: Record<string, SfxDef> = {
  'magic-charge': {
    about: 'Casting wind-up: rising filtered noise and a climbing tone.',
    render: (sr) => {
      const out = blank(sr, 1.1);
      addAt(out, noiseBurst(sr, { dur: 0.9, freq: 400, freqTo: 5200, q: 2.2, gain: 0.3, attack: 0.3, curve: 1.1 }), 0, sr, 0.85);
      addAt(out, tone(sr, { freq: 220, toFreq: 880, glide: 1.6, dur: 0.9, wave: 'tri', gain: 0.28, curve: 1.2, attack: 0.25, vibrato: 0.01, vibratoRate: 7 }), 0, sr, 0.8, -0.2);
      addAt(out, tone(sr, { freq: 330, toFreq: 1320, glide: 1.6, dur: 0.9, wave: 'sine', gain: 0.18, curve: 1.2, attack: 0.35 }), 0.04, sr, 0.7, 0.25);
      return trim(out, 0.7);
    },
  },
  fire: {
    about: 'Fire spell: roaring band-swept noise with crackle.',
    render: (sr) => {
      const out = blank(sr, 1.1);
      addAt(out, noiseBurst(sr, { dur: 0.85, freq: 280, freqTo: 1500, q: 0.55, gain: 0.55, attack: 0.03, curve: 2.4, drive: 0.4 }), 0, sr, 0.9);
      addAt(out, tone(sr, { freq: 90, toFreq: 48, dur: 0.4, wave: 'sine', gain: 0.5, curve: 3 }), 0, sr, 0.8);
      const rand = makeNoise(31337);
      for (let i = 0; i < 12; i++) {
        const at = 0.04 + Math.abs(rand()) * 0.7;
        addAt(out, noiseBurst(sr, { dur: 0.04, freq: 2600 + Math.abs(rand()) * 3400, q: 2.6, gain: 0.22, curve: 7, seed: 500 + i }), at, sr, 0.7, rand() * 0.6);
      }
      return trim(out, 0.85);
    },
  },
  ice: {
    about: 'Ice spell: glassy shards and a freezing shimmer.',
    render: (sr) => {
      const out = blank(sr, 1.2);
      addAt(out, noiseBurst(sr, { dur: 0.5, freq: 7000, freqTo: 2600, q: 1.1, gain: 0.3, attack: 0.02, curve: 2.6 }), 0, sr, 0.8);
      const rand = makeNoise(515);
      const shards = ['C7', 'G6', 'D#7', 'A#6', 'F7'];
      shards.forEach((pitch, i) => {
        addAt(out, voiceNote(sr, 'bell', pitch, 0.35, 0.45 + i * 0.05), 0.02 + i * 0.055, sr, 0.42, rand() * 0.7);
      });
      addAt(out, tone(sr, { freq: 1200, toFreq: 300, glide: 1.8, dur: 0.7, wave: 'tri', gain: 0.18, curve: 2.6 }), 0.1, sr, 0.7);
      return trim(out, 0.78);
    },
  },
  thunder: {
    about: 'Thunder spell: crack, arc, and a rolling low rumble.',
    render: (sr) => {
      const out = blank(sr, 1.6);
      addAt(out, noiseBurst(sr, { dur: 0.07, freq: 6000, freqTo: 1400, q: 0.5, gain: 0.9, attack: 0.0005, curve: 8, seed: 1212 }), 0, sr, 1);
      addAt(out, fmTone(sr, { freq: 900, ratio: 5.11, index: 7, indexTo: 1, dur: 0.35, gain: 0.35, curve: 5, crunchAmount: 0.6 }), 0.005, sr, 0.85, 0.15);
      addAt(out, noiseBurst(sr, { dur: 1.2, freq: 260, freqTo: 90, q: 0.4, gain: 0.4, attack: 0.02, curve: 2.2, seed: 777, drive: 0.3 }), 0.03, sr, 0.9, -0.1);
      addAt(out, tone(sr, { freq: 58, dur: 0.9, wave: 'sine', gain: 0.45, curve: 3 }), 0.02, sr, 0.8);
      return trim(out, 0.92);
    },
  },
  water: {
    about: 'Water spell: a swelling surge with droplets.',
    render: (sr) => {
      const out = blank(sr, 1.3);
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 500, freqTo: 1800, q: 0.9, gain: 0.45, attack: 0.28, curve: 2 }), 0, sr, 0.9);
      addAt(out, noiseBurst(sr, { dur: 0.7, freq: 2200, freqTo: 700, q: 1.4, gain: 0.25, attack: 0.15, curve: 2.4, seed: 606 }), 0.2, sr, 0.8, 0.3);
      const rand = makeNoise(4646);
      for (let i = 0; i < 6; i++) {
        addAt(out, tone(sr, { freq: 900 + Math.abs(rand()) * 900, toFreq: 2400, dur: 0.07, wave: 'sine', gain: 0.25, curve: 5, attack: 0.002 }), 0.35 + i * 0.09, sr, 0.6, rand() * 0.7);
      }
      return trim(out, 0.8);
    },
  },
  holy: {
    about: 'Holy: a bell struck inside a choir chord.',
    render: (sr) => {
      const out = blank(sr, 2.4);
      addAt(out, voiceNote(sr, 'bell', 'C5', 1.4, 0.9), 0, sr, 0.8, -0.1);
      addAt(out, voiceNote(sr, 'bell', 'G5', 1.4, 0.6), 0.03, sr, 0.5, 0.25);
      for (const pitch of ['C4', 'E4', 'G4', 'C5']) {
        addAt(out, voiceNote(sr, 'choir', pitch, 1.3, 0.55), 0.05, sr, 0.5);
      }
      addAt(out, noiseBurst(sr, { dur: 1.4, freq: 4000, freqTo: 9000, q: 0.7, gain: 0.12, attack: 0.5, curve: 2 }), 0.1, sr, 0.7);
      return trim(out, 0.85);
    },
  },
  cure: {
    about: 'Healing sparkle: a celesta figure rising through motes of light.',
    render: (sr) => {
      const out = blank(sr, 1.6);
      const figure = ['G5', 'C6', 'E6', 'G6'];
      figure.forEach((pitch, i) => {
        addAt(out, voiceNote(sr, 'celesta', pitch, 0.5, 0.6 + i * 0.08), i * 0.075, sr, 0.75, -0.2 + i * 0.13);
      });
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'C6', 0.7, 0.5), 0.1, sr, 0.5);
      addAt(out, noiseBurst(sr, { dur: 0.8, freq: 5200, freqTo: 9500, q: 1.1, gain: 0.12, attack: 0.25, curve: 2.4 }), 0.05, sr, 0.6);
      return trim(out, 0.72);
    },
  },
  summon: {
    about: 'Aeon arrival: rising sweep, impact boom, bell and choir bloom.',
    render: (sr) => {
      const out = blank(sr, 3.2);
      addAt(out, tone(sr, { freq: 110, toFreq: 1760, glide: 2.2, dur: 1.4, wave: 'saw', cutoff: 400, cutoffTo: 6000, resonance: 2.8, gain: 0.32, curve: 0.9, attack: 0.2 }), 0, sr, 0.9);
      addAt(out, noiseBurst(sr, { dur: 1.3, freq: 300, freqTo: 6000, q: 1.2, gain: 0.25, attack: 0.6, curve: 1.2 }), 0.05, sr, 0.85);
      addAt(out, tone(sr, { freq: 150, toFreq: 40, glide: 0.4, dur: 1.2, wave: 'sine', gain: 0.9, curve: 2.6, drive: 2 }), 1.35, sr, 1);
      addAt(out, voiceNote(sr, 'timpani', 'D2', 1.4, 1), 1.35, sr, 0.8);
      addAt(out, voiceNote(sr, 'bell', 'D5', 1.6, 0.8), 1.4, sr, 0.6, 0.2);
      for (const pitch of ['D4', 'A4', 'D5', 'F5']) {
        addAt(out, voiceNote(sr, 'choir', pitch, 1.5, 0.6), 1.42, sr, 0.42);
      }
      return trim(out, 0.9);
    },
  },
  pyrefly: {
    about: 'Pyreflies drifting up: airy, weightless tinkle.',
    render: (sr) => {
      const out = blank(sr, 1.8);
      const rand = makeNoise(1717);
      const motes = ['E6', 'A6', 'B6', 'E7', 'G6'];
      motes.forEach((pitch, i) => {
        addAt(out, voiceNote(sr, 'sfx-shimmer', pitch, 0.5, 0.35 + i * 0.05), 0.05 + i * 0.16, sr, 0.5, rand() * 0.8);
      });
      addAt(out, noiseBurst(sr, { dur: 1.4, freq: 6000, freqTo: 11000, q: 1.4, gain: 0.1, attack: 0.5, curve: 1.8 }), 0, sr, 0.6);
      addAt(out, tone(sr, { freq: 1320, toFreq: 2640, glide: 1.4, dur: 1.2, wave: 'sine', gain: 0.1, attack: 0.4, curve: 2 }), 0.1, sr, 0.5, -0.3);
      return trim(out, 0.6);
    },
  },
};
