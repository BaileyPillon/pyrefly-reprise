/** Elemental spell tiers and non-elemental magic (gravity, flare, ultima). */

import { makeNoise } from '../dsp/oscillators.ts';
import { addAt, blank, fmTone, noiseBurst, tone, trim, voiceNote } from './kit.ts';
import type { SfxDef } from './kit.ts';

export const spellSfx: Record<string, SfxDef> = {
  'fire-2': {
    about: 'Bigger fire: two rolling waves of roaring noise with heavier crackle.',
    render: (sr) => {
      const out = blank(sr, 1.5);
      addAt(out, noiseBurst(sr, { dur: 0.9, freq: 260, freqTo: 1500, q: 0.55, gain: 0.55, attack: 0.03, curve: 2.2, drive: 0.45 }), 0, sr, 0.9);
      addAt(out, noiseBurst(sr, { dur: 0.85, freq: 300, freqTo: 1700, q: 0.5, gain: 0.5, attack: 0.05, curve: 2, drive: 0.45, seed: 8181 }), 0.35, sr, 0.85, 0.15);
      addAt(out, tone(sr, { freq: 95, toFreq: 42, dur: 0.55, wave: 'sine', gain: 0.55, curve: 2.6 }), 0, sr, 0.85);
      const rand = makeNoise(31337);
      for (let i = 0; i < 18; i++) {
        const at = 0.04 + Math.abs(rand()) * 1.1;
        addAt(out, noiseBurst(sr, { dur: 0.045, freq: 2600 + Math.abs(rand()) * 3600, q: 2.6, gain: 0.24, curve: 7, seed: 500 + i }), at, sr, 0.75, rand() * 0.7);
      }
      return trim(out, 0.88);
    },
  },
  'fire-3': {
    about: 'Firestorm: a sub-bass whoomp, two waves of roaring flame, and a searing swell.',
    render: (sr) => {
      const out = blank(sr, 2.4);
      addAt(out, tone(sr, { freq: 55, toFreq: 30, dur: 0.5, wave: 'sine', gain: 0.9, curve: 2.5, drive: 1.6 }), 0, sr, 0.95);
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 260, freqTo: 1600, q: 0.5, gain: 0.55, attack: 0.02, curve: 2, drive: 0.5 }), 0.02, sr, 0.9, -0.3);
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 300, freqTo: 1800, q: 0.5, gain: 0.5, attack: 0.05, curve: 1.9, drive: 0.5, seed: 8181 }), 0.45, sr, 0.85, 0.35);
      addAt(out, tone(sr, { freq: 90, toFreq: 40, dur: 0.5, wave: 'sine', gain: 0.5, curve: 2.6 }), 0.02, sr, 0.75);
      const rand = makeNoise(31337);
      for (let i = 0; i < 26; i++) {
        const at = 0.05 + Math.abs(rand()) * 1.7;
        addAt(out, noiseBurst(sr, { dur: 0.045, freq: 2600 + Math.abs(rand()) * 3800, q: 2.6, gain: 0.24, curve: 7, seed: 500 + i }), at, sr, 0.7, rand() * 0.85);
      }
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 1800, freqTo: 5200, q: 0.8, gain: 0.3, attack: 0.5, curve: 1.6 }), 1.2, sr, 0.75);
      return trim(out, 0.92);
    },
  },
  'ice-2': {
    about: 'Bigger ice: a denser shard cluster and a longer freezing shimmer.',
    render: (sr) => {
      const out = blank(sr, 1.5);
      addAt(out, noiseBurst(sr, { dur: 0.6, freq: 7200, freqTo: 2400, q: 1.1, gain: 0.32, attack: 0.02, curve: 2.4 }), 0, sr, 0.85);
      addAt(out, noiseBurst(sr, { dur: 0.5, freq: 6400, freqTo: 2000, q: 1.2, gain: 0.26, attack: 0.02, curve: 2.6, seed: 909 }), 0.3, sr, 0.75, 0.3);
      const rand = makeNoise(515);
      const shards = ['C7', 'G6', 'D#7', 'A#6', 'F7', 'C8'];
      shards.forEach((pitch, i) => {
        addAt(out, voiceNote(sr, 'bell', pitch, 0.4, 0.45 + i * 0.04), 0.02 + i * 0.06, sr, 0.42, rand() * 0.8);
      });
      addAt(out, tone(sr, { freq: 1300, toFreq: 260, glide: 1.8, dur: 1.0, wave: 'tri', gain: 0.2, curve: 2.2 }), 0.12, sr, 0.7);
      return trim(out, 0.85);
    },
  },
  'ice-3': {
    about: 'Glacial burst: crystalline shard hail, a deep-frozen sub impact, and a wide shimmering swell.',
    render: (sr) => {
      const out = blank(sr, 2.4);
      addAt(out, tone(sr, { freq: 130, toFreq: 45, dur: 0.5, wave: 'sine', gain: 0.55, curve: 2.4 }), 0, sr, 0.85);
      addAt(out, noiseBurst(sr, { dur: 0.7, freq: 7500, freqTo: 2200, q: 1.1, gain: 0.34, attack: 0.02, curve: 2.2 }), 0.02, sr, 0.9, -0.4);
      addAt(out, noiseBurst(sr, { dur: 0.6, freq: 6600, freqTo: 1900, q: 1.2, gain: 0.28, attack: 0.02, curve: 2.4, seed: 909 }), 0.35, sr, 0.8, 0.45);
      const rand = makeNoise(515);
      const shards = ['C7', 'G6', 'D#7', 'A#6', 'F7', 'C8', 'G#6'];
      shards.forEach((pitch, i) => {
        addAt(out, voiceNote(sr, 'bell', pitch, 0.45, 0.45 + i * 0.03), 0.05 + i * 0.07, sr, 0.4, rand() * 0.9);
      });
      addAt(out, tone(sr, { freq: 1400, toFreq: 220, glide: 1.8, dur: 1.2, wave: 'tri', gain: 0.22, curve: 2 }), 0.2, sr, 0.68);
      addAt(out, noiseBurst(sr, { dur: 1.1, freq: 5000, freqTo: 10000, q: 0.9, gain: 0.16, attack: 0.6, curve: 1.8 }), 1.1, sr, 0.6);
      return trim(out, 0.9);
    },
  },
  lightning: {
    about: 'Lightning bolt: a sharp electric crack with a crackling arc and short rumble.',
    render: (sr) => {
      const out = blank(sr, 1.3);
      addAt(out, noiseBurst(sr, { dur: 0.05, freq: 7200, freqTo: 1800, q: 0.6, gain: 0.85, attack: 0.0004, curve: 9, seed: 2323 }), 0, sr, 1);
      addAt(out, fmTone(sr, { freq: 1400, ratio: 3.67, index: 6, indexTo: 0.6, dur: 0.28, gain: 0.32, curve: 6, crunchAmount: 0.5 }), 0.004, sr, 0.8, -0.15);
      addAt(out, noiseBurst(sr, { dur: 0.9, freq: 320, freqTo: 100, q: 0.45, gain: 0.32, attack: 0.015, curve: 2.4, seed: 424, drive: 0.25 }), 0.025, sr, 0.85, 0.1);
      addAt(out, tone(sr, { freq: 64, dur: 0.7, wave: 'sine', gain: 0.38, curve: 3.2 }), 0.02, sr, 0.75);
      return trim(out, 0.9);
    },
  },
  'lightning-2': {
    about: 'Bigger lightning: a double crack, a longer crackling arc, and a heavier rumble.',
    render: (sr) => {
      const out = blank(sr, 1.5);
      addAt(out, noiseBurst(sr, { dur: 0.06, freq: 7500, freqTo: 1600, q: 0.55, gain: 0.9, attack: 0.0004, curve: 9, seed: 2323 }), 0, sr, 1);
      addAt(out, noiseBurst(sr, { dur: 0.05, freq: 6800, freqTo: 1400, q: 0.6, gain: 0.6, attack: 0.0004, curve: 9, seed: 5757 }), 0.1, sr, 0.75, 0.3);
      addAt(out, fmTone(sr, { freq: 1450, ratio: 3.67, index: 7, indexTo: 0.5, dur: 0.4, gain: 0.36, curve: 5, crunchAmount: 0.55 }), 0.004, sr, 0.85, -0.2);
      addAt(out, fmTone(sr, { freq: 1900, ratio: 4.4, index: 5, indexTo: 0.4, dur: 0.3, gain: 0.22, curve: 6, crunchAmount: 0.4 }), 0.12, sr, 0.6, 0.3);
      addAt(out, noiseBurst(sr, { dur: 1.1, freq: 320, freqTo: 90, q: 0.42, gain: 0.38, attack: 0.02, curve: 2.2, seed: 424, drive: 0.3 }), 0.03, sr, 0.9, 0.05);
      addAt(out, tone(sr, { freq: 62, dur: 0.85, wave: 'sine', gain: 0.45, curve: 3 }), 0.02, sr, 0.8);
      return trim(out, 0.9);
    },
  },
  'lightning-3': {
    about: 'Thunderstorm strike: a triple crack, roaring arc, sub-bass impact, and a wide rolling swell.',
    render: (sr) => {
      const out = blank(sr, 2.5);
      addAt(out, noiseBurst(sr, { dur: 0.06, freq: 7800, freqTo: 1500, q: 0.5, gain: 0.95, attack: 0.0003, curve: 9, seed: 2323 }), 0, sr, 1, -0.5);
      addAt(out, noiseBurst(sr, { dur: 0.05, freq: 7000, freqTo: 1300, q: 0.55, gain: 0.65, attack: 0.0004, curve: 9, seed: 5757 }), 0.09, sr, 0.75, 0.55);
      addAt(out, noiseBurst(sr, { dur: 0.05, freq: 6200, freqTo: 1100, q: 0.6, gain: 0.5, attack: 0.0004, curve: 9, seed: 9191 }), 0.19, sr, 0.6, -0.2);
      addAt(out, fmTone(sr, { freq: 1500, ratio: 3.67, index: 7, indexTo: 0.4, dur: 0.5, gain: 0.4, curve: 4.5, crunchAmount: 0.55 }), 0.005, sr, 0.9, 0);
      addAt(out, tone(sr, { freq: 48, toFreq: 30, dur: 0.6, wave: 'sine', gain: 0.9, curve: 2.4, drive: 1.8 }), 0.02, sr, 1);
      addAt(out, noiseBurst(sr, { dur: 1.5, freq: 300, freqTo: 80, q: 0.4, gain: 0.4, attack: 0.02, curve: 2, seed: 424, drive: 0.35 }), 0.05, sr, 0.9, 0.1);
      addAt(out, noiseBurst(sr, { dur: 1.4, freq: 800, freqTo: 4200, q: 0.8, gain: 0.24, attack: 0.4, curve: 1.6 }), 1.0, sr, 0.7);
      return trim(out, 0.94);
    },
  },
  'water-2': {
    about: 'Bigger water: two swelling surges and a denser scatter of droplets.',
    render: (sr) => {
      const out = blank(sr, 1.5);
      addAt(out, noiseBurst(sr, { dur: 1.1, freq: 480, freqTo: 1900, q: 0.9, gain: 0.46, attack: 0.25, curve: 1.9 }), 0, sr, 0.9);
      addAt(out, noiseBurst(sr, { dur: 0.9, freq: 600, freqTo: 2000, q: 0.85, gain: 0.36, attack: 0.35, curve: 1.8, seed: 8080 }), 0.3, sr, 0.75, -0.25);
      addAt(out, noiseBurst(sr, { dur: 0.75, freq: 2200, freqTo: 700, q: 1.4, gain: 0.26, attack: 0.15, curve: 2.4, seed: 606 }), 0.25, sr, 0.8, 0.35);
      const rand = makeNoise(4646);
      for (let i = 0; i < 10; i++) {
        addAt(out, tone(sr, { freq: 900 + Math.abs(rand()) * 900, toFreq: 2400, dur: 0.07, wave: 'sine', gain: 0.25, curve: 5, attack: 0.002 }), 0.35 + i * 0.09, sr, 0.6, rand() * 0.8);
      }
      return trim(out, 0.85);
    },
  },
  'water-3': {
    about: 'Tidal water: a deep surge, twin swells, a wide spray of droplets, and a crashing swell.',
    render: (sr) => {
      const out = blank(sr, 2.4);
      addAt(out, tone(sr, { freq: 70, toFreq: 38, dur: 0.6, wave: 'sine', gain: 0.55, curve: 2.4 }), 0, sr, 0.85);
      addAt(out, noiseBurst(sr, { dur: 1.3, freq: 440, freqTo: 2000, q: 0.85, gain: 0.48, attack: 0.3, curve: 1.7 }), 0.02, sr, 0.92, -0.4);
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 620, freqTo: 2100, q: 0.8, gain: 0.36, attack: 0.4, curve: 1.7, seed: 8080 }), 0.4, sr, 0.78, 0.45);
      addAt(out, noiseBurst(sr, { dur: 0.8, freq: 2400, freqTo: 700, q: 1.4, gain: 0.28, attack: 0.15, curve: 2.2, seed: 606 }), 0.3, sr, 0.8, 0.2);
      const rand = makeNoise(4646);
      for (let i = 0; i < 16; i++) {
        addAt(out, tone(sr, { freq: 850 + Math.abs(rand()) * 1000, toFreq: 2500, dur: 0.07, wave: 'sine', gain: 0.24, curve: 5, attack: 0.002 }), 0.4 + i * 0.075, sr, 0.55, rand() * 0.9);
      }
      addAt(out, noiseBurst(sr, { dur: 1.1, freq: 1800, freqTo: 5000, q: 0.8, gain: 0.26, attack: 0.5, curve: 1.6 }), 1.2, sr, 0.7);
      return trim(out, 0.9);
    },
  },
  'holy-2': {
    about: 'Grand holy: a cathedral bell peal inside a wide choir chord with a radiant sweep.',
    render: (sr) => {
      const out = blank(sr, 3.0);
      addAt(out, voiceNote(sr, 'bell', 'C5', 1.8, 0.95), 0, sr, 0.85, -0.15);
      addAt(out, voiceNote(sr, 'bell', 'G5', 1.7, 0.7), 0.03, sr, 0.55, 0.3);
      for (const pitch of ['C4', 'E4', 'G4', 'C5']) {
        addAt(out, voiceNote(sr, 'choir', pitch, 1.8, 0.55), 0.05, sr, 0.45);
      }
      addAt(out, tone(sr, { freq: 90, toFreq: 40, dur: 0.6, wave: 'sine', gain: 0.4, curve: 2.6 }), 0, sr, 0.7);
      addAt(out, noiseBurst(sr, { dur: 1.8, freq: 4000, freqTo: 9500, q: 0.7, gain: 0.14, attack: 0.6, curve: 1.8 }), 0.1, sr, 0.75);
      return trim(out, 0.92);
    },
  },
  gravity: {
    about: 'Demi: space warping inward, a pitch-bending low whoomp.',
    render: (sr) => {
      const out = blank(sr, 1.2);
      addAt(out, tone(sr, { freq: 260, toFreq: 45, glide: 2.4, dur: 0.9, wave: 'sine', gain: 0.6, curve: 1.6 }), 0, sr, 0.9);
      addAt(out, noiseBurst(sr, { dur: 0.8, freq: 3000, freqTo: 200, q: 1.6, gain: 0.3, attack: 0.05, curve: 1.8, seed: 3131 }), 0, sr, 0.75, -0.3);
      addAt(out, noiseBurst(sr, { dur: 0.75, freq: 2600, freqTo: 180, q: 1.6, gain: 0.26, attack: 0.08, curve: 1.9, seed: 3939 }), 0.06, sr, 0.7, 0.3);
      addAt(out, tone(sr, { freq: 55, toFreq: 28, dur: 0.5, wave: 'sine', gain: 0.5, curve: 2.6 }), 0.55, sr, 0.85);
      return trim(out, 0.85);
    },
  },
  'gravity-2': {
    about: 'Gravity crush: a heavier inward implosion with a crushing sub impact.',
    render: (sr) => {
      const out = blank(sr, 1.7);
      addAt(out, tone(sr, { freq: 320, toFreq: 38, glide: 2.4, dur: 1.1, wave: 'sine', gain: 0.65, curve: 1.5 }), 0, sr, 0.92);
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 3400, freqTo: 160, q: 1.6, gain: 0.34, attack: 0.05, curve: 1.7, seed: 3131 }), 0, sr, 0.8, -0.4);
      addAt(out, noiseBurst(sr, { dur: 0.95, freq: 2900, freqTo: 140, q: 1.6, gain: 0.3, attack: 0.08, curve: 1.8, seed: 3939 }), 0.08, sr, 0.75, 0.4);
      addAt(out, tone(sr, { freq: 45, toFreq: 24, dur: 0.6, wave: 'sine', gain: 0.85, curve: 2.4, drive: 1.6 }), 0.75, sr, 1);
      addAt(out, noiseBurst(sr, { dur: 0.4, freq: 800, freqTo: 120, q: 0.7, gain: 0.3, curve: 3, seed: 6161 }), 0.78, sr, 0.75);
      return trim(out, 0.92);
    },
  },
  flare: {
    about: 'Flare: an intense implosion collapsing inward before a white-hot detonation.',
    render: (sr) => {
      const out = blank(sr, 1.8);
      addAt(out, noiseBurst(sr, { dur: 0.35, freq: 6000, freqTo: 500, q: 1.8, gain: 0.4, attack: 0.02, curve: 1.6, seed: 4321 }), 0, sr, 0.85, -0.3);
      addAt(out, tone(sr, { freq: 1400, toFreq: 120, glide: 2, dur: 0.4, wave: 'saw', gain: 0.32, curve: 1.4, cutoff: 4000, cutoffTo: 300, resonance: 2 }), 0.02, sr, 0.75, 0.3);
      addAt(out, tone(sr, { freq: 60, toFreq: 26, dur: 0.5, wave: 'sine', gain: 0.9, curve: 2.2, drive: 2.2 }), 0.4, sr, 1);
      addAt(out, noiseBurst(sr, { dur: 0.9, freq: 800, freqTo: 6000, q: 0.5, gain: 0.55, attack: 0.005, curve: 2.4, drive: 0.4, seed: 7654 }), 0.4, sr, 0.95);
      addAt(out, noiseBurst(sr, { dur: 1.1, freq: 5000, freqTo: 10500, q: 0.7, gain: 0.28, attack: 0.35, curve: 1.6 }), 0.5, sr, 0.75);
      return trim(out, 0.94);
    },
  },
  ultima: {
    about: 'Ultima: a long rising charge, a colossal detonation, and a shimmering aftermath.',
    render: (sr) => {
      const out = blank(sr, 3.5);
      addAt(out, noiseBurst(sr, { dur: 1.3, freq: 300, freqTo: 4000, q: 2, gain: 0.32, attack: 0.5, curve: 1.1 }), 0, sr, 0.85);
      addAt(out, tone(sr, { freq: 140, toFreq: 1100, glide: 1.8, dur: 1.3, wave: 'saw', cutoff: 500, cutoffTo: 6500, resonance: 2.6, gain: 0.3, curve: 0.9, attack: 0.3 }), 0, sr, 0.85, -0.2);
      addAt(out, tone(sr, { freq: 50, toFreq: 24, dur: 0.7, wave: 'sine', gain: 1, curve: 2, drive: 2.4 }), 1.25, sr, 1);
      addAt(out, noiseBurst(sr, { dur: 1.1, freq: 900, freqTo: 7000, q: 0.45, gain: 0.6, attack: 0.004, curve: 2, drive: 0.5, seed: 9911 }), 1.27, sr, 1, 0.15);
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 6000, freqTo: 1600, q: 0.6, gain: 0.4, attack: 0.001, curve: 5, seed: 2277 }), 1.25, sr, 0.85, -0.2);
      const rand = makeNoise(5533);
      const shimmerPitches = ['C6', 'E6', 'G6', 'B6', 'D7'];
      for (let i = 0; i < 10; i++) {
        addAt(out, voiceNote(sr, 'sfx-shimmer', shimmerPitches[i % shimmerPitches.length]!, 0.6, 0.4 + Math.abs(rand()) * 0.3), 1.9 + i * 0.16, sr, 0.45, rand() * 0.9);
      }
      return trim(out, 0.95);
    },
  },
  bio: {
    about: 'Bio: a bubbling toxic ooze hiss with sickly gurgles.',
    render: (sr) => {
      const out = blank(sr, 1.3);
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 900, freqTo: 500, q: 1.2, gain: 0.32, attack: 0.05, curve: 1.6, highpass: 300 }), 0, sr, 0.85);
      const rand = makeNoise(4213);
      for (let i = 0; i < 9; i++) {
        const at = 0.05 + Math.abs(rand()) * 0.95;
        addAt(out, tone(sr, { freq: 140 + Math.abs(rand()) * 220, toFreq: 80, dur: 0.09, wave: 'tri', gain: 0.3, curve: 5, attack: 0.005 }), at, sr, 0.6, rand() * 0.7);
      }
      addAt(out, tone(sr, { freq: 210, toFreq: 170, dur: 0.9, wave: 'square', width: 0.2, gain: 0.14, vibrato: 0.08, vibratoRate: 5, curve: 1.8, drive: 1.4 }), 0.05, sr, 0.6);
      return trim(out, 0.75);
    },
  },
  death: {
    about: 'Death: a hushed, cold descending choir breath and a single bell toll.',
    render: (sr) => {
      const out = blank(sr, 1.8);
      addAt(out, voiceNote(sr, 'choir', 'A3', 1.1, 0.45), 0, sr, 0.5, -0.15);
      addAt(out, voiceNote(sr, 'choir', 'E3', 1.2, 0.4), 0.3, sr, 0.45, 0.15);
      addAt(out, voiceNote(sr, 'bell', 'A2', 1.3, 0.7), 0.15, sr, 0.6);
      addAt(out, noiseBurst(sr, { dur: 1.3, freq: 500, freqTo: 150, q: 0.7, gain: 0.14, attack: 0.4, curve: 1.6 }), 0.1, sr, 0.5);
      return trim(out, 0.68);
    },
  },
  'doom-tick': {
    about: 'Doom: an ominous countdown tick.',
    render: (sr) => {
      const out = blank(sr, 0.34);
      addAt(out, tone(sr, { freq: 220, wave: 'square', dur: 0.08, gain: 0.4, curve: 5, drive: 1.2 }), 0, sr, 0.85);
      addAt(out, voiceNote(sr, 'timpani', 'A1', 0.3, 0.6), 0, sr, 0.55);
      return trim(out, 0.65);
    },
  },
  drain: {
    about: 'Drain: a reverse-swelling hiss that pulls life toward the caster.',
    render: (sr) => {
      const out = blank(sr, 1.1);
      addAt(out, noiseBurst(sr, { dur: 0.75, freq: 1400, freqTo: 500, q: 1.3, gain: 0.4, attack: 0.55, curve: 0.7 }), 0, sr, 0.85, 0.3);
      addAt(out, tone(sr, { freq: 700, toFreq: 180, glide: 1.4, dur: 0.7, wave: 'tri', gain: 0.24, attack: 0.45, curve: 0.8 }), 0.05, sr, 0.7, -0.2);
      addAt(out, tone(sr, { freq: 160, toFreq: 70, dur: 0.35, wave: 'sine', gain: 0.4, curve: 3 }), 0.68, sr, 0.75);
      return trim(out, 0.72);
    },
  },
  osmose: {
    about: 'Osmose: a glassy, high reverse-swell siphoning MP toward the caster.',
    render: (sr) => {
      const out = blank(sr, 1.0);
      addAt(out, noiseBurst(sr, { dur: 0.65, freq: 3200, freqTo: 1400, q: 1.5, gain: 0.32, attack: 0.5, curve: 0.7 }), 0, sr, 0.8, 0.3);
      addAt(out, tone(sr, { freq: 1600, toFreq: 500, glide: 1.4, dur: 0.6, wave: 'sine', gain: 0.24, attack: 0.4, curve: 0.8 }), 0.04, sr, 0.7, -0.2);
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'A6', 0.4, 0.5), 0.55, sr, 0.55);
      return trim(out, 0.68);
    },
  },
  meteor: {
    about: 'Meteor: incoming whistles plummeting down into multiple heavy impacts.',
    render: (sr) => {
      const out = blank(sr, 2.6);
      addAt(out, tone(sr, { freq: 2600, toFreq: 500, glide: 0.7, dur: 0.7, wave: 'sine', gain: 0.28, curve: 1.4, attack: 0.02 }), 0, sr, 0.75, -0.3);
      addAt(out, tone(sr, { freq: 2200, toFreq: 420, glide: 0.7, dur: 0.65, wave: 'sine', gain: 0.24, curve: 1.4, attack: 0.02 }), 0.15, sr, 0.7, 0.3);
      const rand = makeNoise(7711);
      const impacts = [0.72, 1.0, 1.35, 1.75];
      impacts.forEach((at, i) => {
        addAt(out, tone(sr, { freq: 90 - i * 8, toFreq: 30, dur: 0.4, wave: 'sine', gain: 0.7, curve: 2.4, drive: 1.8 }), at, sr, 0.85 - i * 0.08, rand() * 0.5);
        addAt(out, noiseBurst(sr, { dur: 0.3, freq: 1200, freqTo: 250, q: 0.7, gain: 0.4, curve: 3.2, seed: 300 + i }), at, sr, 0.7 - i * 0.06, rand() * 0.5);
      });
      addAt(out, noiseBurst(sr, { dur: 0.8, freq: 400, freqTo: 100, q: 0.5, gain: 0.3, attack: 0.02, curve: 2, seed: 8899 }), 1.75, sr, 0.7);
      return trim(out, 0.95);
    },
  },
};
