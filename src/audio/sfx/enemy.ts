/** Enemy and boss SFX: breath, lasers, explosions, dissolves, phase shifts. */

import { makeNoise } from '../dsp/oscillators.ts';
import { addAt, blank, fmTone, noiseBurst, tone, trim, voiceNote } from './kit.ts';
import type { SfxDef } from './kit.ts';

export const enemySfx: Record<string, SfxDef> = {
  'breath-attack': {
    about: 'Roaring elemental breath blast (Braska\'s Final Aeon, dark Bahamut).',
    render: (sr) => {
      const out = blank(sr, 1.3);
      addAt(out, noiseBurst(sr, { dur: 1.1, freq: 500, freqTo: 3000, q: 0.9, gain: 0.55, attack: 0.05, curve: 1.6, drive: 0.5 }), 0, sr, 0.95);
      addAt(out, fmTone(sr, { freq: 95, toFreq: 130, ratio: 1.8, index: 3.5, indexTo: 1, dur: 1.0, gain: 0.35, curve: 1.8, crunchAmount: 0.4, attack: 0.06 }), 0.02, sr, 0.75, -0.15);
      addAt(out, tone(sr, { freq: 60, dur: 0.9, wave: 'sine', gain: 0.4, curve: 2 }), 0.02, sr, 0.6);
      return trim(out, 0.9);
    },
  },
  'laser-charge': {
    about: 'Rising laser charge-up whine, about a second (Vegnagun).',
    render: (sr) => {
      const out = blank(sr, 1.0);
      addAt(out, tone(sr, { freq: 300, toFreq: 2600, glide: 1.4, dur: 0.9, wave: 'saw', cutoff: 900, cutoffTo: 6000, resonance: 3, gain: 0.32, curve: 0.8, attack: 0.05 }), 0, sr, 0.85);
      addAt(out, noiseBurst(sr, { dur: 0.85, freq: 2000, freqTo: 8000, q: 2, gain: 0.16, attack: 0.3, curve: 1.4 }), 0.05, sr, 0.6);
      return trim(out, 0.75);
    },
  },
  'laser-fire': {
    about: 'Sustained laser beam discharge (Vegnagun).',
    render: (sr) => {
      const out = blank(sr, 0.75);
      addAt(out, fmTone(sr, { freq: 2200, ratio: 2.3, index: 5, indexTo: 2, dur: 0.6, gain: 0.4, curve: 1.4, crunchAmount: 0.3 }), 0, sr, 0.9);
      addAt(out, noiseBurst(sr, { dur: 0.6, freq: 5000, freqTo: 8000, q: 1.6, gain: 0.2, attack: 0.005, curve: 1.8 }), 0, sr, 0.7);
      addAt(out, tone(sr, { freq: 1800, dur: 0.55, wave: 'square', gain: 0.15, curve: 1.6 }), 0.01, sr, 0.5, 0.2);
      return trim(out, 0.88);
    },
  },
  explosion: {
    about: 'Big explosion: crack, boom and settling debris.',
    render: (sr) => {
      const out = blank(sr, 1.4);
      addAt(out, noiseBurst(sr, { dur: 0.5, freq: 900, freqTo: 150, q: 0.5, gain: 0.7, attack: 0.001, curve: 2.2, drive: 0.6 }), 0, sr, 1);
      addAt(out, tone(sr, { freq: 90, toFreq: 32, glide: 0.6, dur: 0.8, wave: 'sine', gain: 0.6, curve: 1.8, drive: 2 }), 0, sr, 0.95);
      addAt(out, noiseBurst(sr, { dur: 0.9, freq: 400, freqTo: 100, q: 0.5, gain: 0.35, attack: 0.05, curve: 1.6, seed: 4141 }), 0.08, sr, 0.75);
      return trim(out, 0.92);
    },
  },
  quake: {
    about: 'Long low rumble with falling debris (Yu Yevon, Gagazet tremor).',
    render: (sr) => {
      const out = blank(sr, 2.0);
      addAt(out, tone(sr, { freq: 45, toFreq: 32, glide: 1, dur: 1.7, wave: 'sine', gain: 0.55, curve: 1.2, drive: 1.6 }), 0, sr, 0.95);
      addAt(out, noiseBurst(sr, { dur: 1.8, freq: 120, freqTo: 260, q: 0.6, gain: 0.4, attack: 0.2, curve: 1.2, drive: 0.4 }), 0, sr, 0.85);
      const rand = makeNoise(2718);
      for (let i = 0; i < 8; i++) {
        const at = 0.3 + Math.abs(rand()) * 1.5;
        addAt(out, noiseBurst(sr, { dur: 0.05, freq: 1400 + rand() * 900, q: 2, gain: 0.2, curve: 6, seed: 1000 + i }), at, sr, 0.55, rand());
      }
      return trim(out, 0.88);
    },
  },
  whip: {
    about: 'Tentacle whip lash with a sharp crack (Seymour\'s aeons).',
    render: (sr) => {
      const out = blank(sr, 0.4);
      addAt(out, noiseBurst(sr, { dur: 0.22, freq: 700, freqTo: 5200, q: 1.4, gain: 0.5, attack: 0.03, curve: 2, seed: 2525 }), 0, sr, 0.9, -0.2);
      addAt(out, noiseBurst(sr, { dur: 0.05, freq: 4200, freqTo: 1200, q: 0.6, gain: 0.5, attack: 0.0006, curve: 7, seed: 6363 }), 0.2, sr, 0.85);
      return trim(out, 0.83);
    },
  },
  'dissolve-pyreflies': {
    about: 'An FFX enemy dies and dissolves into drifting light motes: soft, beautiful, a little sad.',
    render: (sr) => {
      const out = blank(sr, 2.2);
      addAt(out, noiseBurst(sr, { dur: 0.4, freq: 1200, freqTo: 200, q: 0.6, gain: 0.25, attack: 0.02, curve: 3 }), 0, sr, 0.6);
      const motes = ['A6', 'E6', 'C6', 'G5', 'E5'];
      const rand = makeNoise(3535);
      motes.forEach((pitch, i) => {
        addAt(out, voiceNote(sr, 'sfx-shimmer', pitch, 0.7, 0.3 + i * 0.03), 0.15 + i * 0.22, sr, 0.42, rand() * 0.7);
      });
      addAt(out, voiceNote(sr, 'choir', 'C4', 1.6, 0.35), 0.2, sr, 0.3, -0.1);
      addAt(out, noiseBurst(sr, { dur: 1.6, freq: 6000, freqTo: 9500, q: 1.2, gain: 0.09, attack: 0.6, curve: 1.8 }), 0.3, sr, 0.55);
      return trim(out, 0.55);
    },
  },
  'machina-destroy': {
    about: 'Machina destroyed: sparking mechanical explosion (Vegnagun wreckage).',
    render: (sr) => {
      const out = blank(sr, 1.2);
      addAt(out, noiseBurst(sr, { dur: 0.35, freq: 700, freqTo: 120, q: 0.5, gain: 0.6, attack: 0.001, curve: 2.4, drive: 0.5 }), 0, sr, 0.95);
      addAt(out, tone(sr, { freq: 320, toFreq: 40, glide: 0.6, dur: 0.5, wave: 'square', gain: 0.35, curve: 2, drive: 2.5 }), 0, sr, 0.8);
      const rand = makeNoise(9898);
      for (let i = 0; i < 7; i++) {
        const at = 0.05 + Math.abs(rand()) * 0.8;
        addAt(out, noiseBurst(sr, { dur: 0.03, freq: 4000 + Math.abs(rand()) * 4000, q: 3, gain: 0.28, curve: 8, seed: 1300 + i }), at, sr, 0.7, rand());
      }
      return trim(out, 0.88);
    },
  },
  'boss-phase-shift': {
    about: 'Boss changes form: an ominous low swell into an impact (Seymour, Yunalesca).',
    render: (sr) => {
      const out = blank(sr, 1.7);
      addAt(out, tone(sr, { freq: 45, toFreq: 70, glide: 1.2, dur: 1.1, wave: 'sine', gain: 0.4, curve: 0.9, attack: 0.3, drive: 1.4 }), 0, sr, 0.85);
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 200, freqTo: 900, q: 1.3, gain: 0.25, attack: 0.4, curve: 1.4 }), 0, sr, 0.7, -0.15);
      addAt(out, tone(sr, { freq: 120, toFreq: 38, glide: 0.5, dur: 0.4, wave: 'sine', gain: 0.75, curve: 2.6, drive: 2 }), 1.05, sr, 1);
      addAt(out, voiceNote(sr, 'brass-stab', 'D3', 0.5, 0.9), 1.05, sr, 0.5);
      return trim(out, 0.9);
    },
  },
  'boss-overdrive-warning': {
    about: 'Tense charging build before a boss ultimate, about two seconds.',
    render: (sr) => {
      const out = blank(sr, 2.0);
      addAt(out, tone(sr, { freq: 220, toFreq: 880, glide: 2, dur: 1.8, wave: 'saw', cutoff: 500, cutoffTo: 4200, resonance: 2.2, gain: 0.28, curve: 0.7, attack: 0.1 }), 0, sr, 0.85);
      const rand = makeNoise(4747);
      for (let i = 0; i < 10; i++) {
        addAt(out, tone(sr, { freq: 900 + i * 40, dur: 0.05, wave: 'square', gain: 0.14 + i * 0.01, curve: 6 }), i * 0.17, sr, 0.5 + i * 0.03, rand() * 0.3);
      }
      addAt(out, noiseBurst(sr, { dur: 1.7, freq: 300, freqTo: 3000, q: 1, gain: 0.2, attack: 0.5, curve: 1.2 }), 0.1, sr, 0.7);
      return trim(out, 0.85);
    },
  },
  'petrify-shatter': {
    about: 'Stone crackle building into a shatter.',
    render: (sr) => {
      const out = blank(sr, 0.9);
      const rand = makeNoise(1919);
      for (let i = 0; i < 6; i++) {
        addAt(out, noiseBurst(sr, { dur: 0.05, freq: 2000 + i * 300, q: 3, gain: 0.25, curve: 6, seed: 1500 + i }), i * 0.06, sr, 0.5, rand() * 0.5);
      }
      addAt(out, noiseBurst(sr, { dur: 0.3, freq: 3500, freqTo: 1200, q: 0.8, gain: 0.55, attack: 0.001, curve: 5, seed: 2626 }), 0.4, sr, 0.9);
      addAt(out, fmTone(sr, { freq: 2600, ratio: 2.9, index: 3, indexTo: 0.2, dur: 0.35, gain: 0.3, curve: 4 }), 0.4, sr, 0.6);
      return trim(out, 0.85);
    },
  },
};
