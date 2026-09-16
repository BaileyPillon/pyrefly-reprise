/** Weapon and physical-contact SFX: cuts, pierces, blunt blows, guns, whiffs. */

import { makeNoise } from '../dsp/oscillators.ts';
import { addAt, blank, fmTone, noiseBurst, tone, trim } from './kit.ts';
import type { SfxDef } from './kit.ts';

export const weaponSfx: Record<string, SfxDef> = {
  'slash-light': {
    about: 'Quick single-hand sword swing, bright and fast (Tidus).',
    render: (sr) => {
      const out = blank(sr, 0.22);
      addAt(out, noiseBurst(sr, { dur: 0.13, freq: 1800, freqTo: 8200, q: 2.1, gain: 0.5, attack: 0.008, curve: 3.5 }), 0, sr, 0.9, -0.25);
      addAt(out, fmTone(sr, { freq: 2600, ratio: 2.4, index: 1.2, indexTo: 0.15, dur: 0.08, gain: 0.18, curve: 6 }), 0.05, sr, 0.5, 0.2);
      return trim(out, 0.68);
    },
  },
  'slash-heavy': {
    about: 'Weighty two-handed cleave with a low body and a metal edge (Auron, Paine greatsword).',
    render: (sr) => {
      const out = blank(sr, 0.42);
      addAt(out, noiseBurst(sr, { dur: 0.28, freq: 550, freqTo: 3400, q: 1.3, gain: 0.55, attack: 0.03, curve: 2, drive: 0.5 }), 0, sr, 0.95, 0.3);
      addAt(out, tone(sr, { freq: 140, toFreq: 70, glide: 0.6, dur: 0.22, wave: 'sine', gain: 0.4, curve: 3 }), 0.06, sr, 0.6);
      addAt(out, fmTone(sr, { freq: 1600, ratio: 3.1, index: 1.6, indexTo: 0.2, dur: 0.18, gain: 0.2, curve: 4.5 }), 0.16, sr, 0.55, -0.2);
      return trim(out, 0.85);
    },
  },
  pierce: {
    about: 'Spear thrust: a narrow whoosh with a sharp tip impact (Kimahri).',
    render: (sr) => {
      const out = blank(sr, 0.26);
      addAt(out, noiseBurst(sr, { dur: 0.14, freq: 2600, freqTo: 5200, q: 3, gain: 0.4, attack: 0.01, curve: 4, highpass: 800 }), 0, sr, 0.85);
      addAt(out, tone(sr, { freq: 900, toFreq: 200, glide: 0.5, dur: 0.09, wave: 'sine', gain: 0.5, curve: 5 }), 0.13, sr, 0.85);
      addAt(out, noiseBurst(sr, { dur: 0.07, freq: 3200, freqTo: 1400, q: 1.2, gain: 0.35, attack: 0.002, curve: 6, seed: 4021 }), 0.13, sr, 0.7);
      return trim(out, 0.82);
    },
  },
  'ball-hit': {
    about: 'Rubbery blitzball thwack with a trailing whoosh (Wakka).',
    render: (sr) => {
      const out = blank(sr, 0.36);
      addAt(out, noiseBurst(sr, { dur: 0.16, freq: 1100, freqTo: 6200, q: 1.8, gain: 0.4, attack: 0.01, curve: 3 }), 0, sr, 0.75, -0.2);
      addAt(out, tone(sr, { freq: 210, toFreq: 90, glide: 0.4, dur: 0.14, wave: 'tri', gain: 0.55, curve: 3.5, drive: 1.4 }), 0.07, sr, 0.9);
      addAt(out, tone(sr, { freq: 620, toFreq: 340, glide: 0.5, dur: 0.1, wave: 'sine', gain: 0.25, curve: 5 }), 0.08, sr, 0.5);
      return trim(out, 0.85);
    },
  },
  claw: {
    about: 'Three rapid claw scratches (Rikku).',
    render: (sr) => {
      const out = blank(sr, 0.34);
      const rand = makeNoise(9001);
      for (let i = 0; i < 3; i++) {
        addAt(out, noiseBurst(sr, { dur: 0.09, freq: 2400 + i * 500, freqTo: 6800 + i * 400, q: 2.6, gain: 0.4, attack: 0.004, curve: 4.5, seed: 700 + i }), i * 0.08, sr, 0.85, rand() * 0.5);
      }
      return trim(out, 0.75);
    },
  },
  'dagger-flurry': {
    about: 'Rapid double/triple dagger cut (Rikku, X-2).',
    render: (sr) => {
      const out = blank(sr, 0.3);
      addAt(out, noiseBurst(sr, { dur: 0.1, freq: 2000, freqTo: 7800, q: 2.2, gain: 0.42, attack: 0.006, curve: 4 }), 0, sr, 0.85, -0.3);
      addAt(out, noiseBurst(sr, { dur: 0.1, freq: 2200, freqTo: 8200, q: 2.2, gain: 0.42, attack: 0.006, curve: 4, seed: 5151 }), 0.07, sr, 0.9, 0.3);
      addAt(out, noiseBurst(sr, { dur: 0.09, freq: 2400, freqTo: 7400, q: 2.4, gain: 0.35, attack: 0.005, curve: 4.5, seed: 8282 }), 0.14, sr, 0.75, -0.1);
      return trim(out, 0.76);
    },
  },
  gunshot: {
    about: 'Single pistol shot: a sharp crack and a low thump, kept short (Yuna).',
    render: (sr) => {
      const out = blank(sr, 0.2);
      addAt(out, noiseBurst(sr, { dur: 0.05, freq: 2600, freqTo: 900, q: 0.7, gain: 0.9, attack: 0.0005, curve: 7 }), 0, sr, 1);
      addAt(out, tone(sr, { freq: 150, toFreq: 55, glide: 0.5, dur: 0.09, wave: 'sine', gain: 0.5, curve: 5, drive: 1.8 }), 0, sr, 0.85);
      addAt(out, noiseBurst(sr, { dur: 0.1, freq: 5200, freqTo: 1800, q: 0.6, gain: 0.25, attack: 0.001, curve: 6, seed: 6060, highpass: 2000 }), 0, sr, 0.6);
      return trim(out, 0.88);
    },
  },
  'gun-burst': {
    about: 'Five-round pistol burst (Yuna).',
    render: (sr) => {
      const out = blank(sr, 0.58);
      const rand = makeNoise(7171);
      for (let i = 0; i < 5; i++) {
        const at = i * 0.09 + Math.abs(rand()) * 0.01;
        addAt(out, noiseBurst(sr, { dur: 0.045, freq: 2500 + rand() * 400, freqTo: 900, q: 0.7, gain: 0.85, attack: 0.0005, curve: 7, seed: 900 + i }), at, sr, 0.9, rand() * 0.15);
        addAt(out, tone(sr, { freq: 145, toFreq: 55, glide: 0.5, dur: 0.07, wave: 'sine', gain: 0.4, curve: 5 }), at, sr, 0.75);
      }
      return trim(out, 0.88);
    },
  },
  whiff: {
    about: 'A swing that misses: air only, no impact.',
    render: (sr) => {
      const out = blank(sr, 0.26);
      addAt(out, noiseBurst(sr, { dur: 0.22, freq: 1200, freqTo: 3400, q: 1.4, gain: 0.35, attack: 0.02, curve: 2.6 }), 0, sr, 0.8, -0.15);
      return trim(out, 0.5);
    },
  },
  guard: {
    about: 'Metal block: a bright clank with a short ring.',
    render: (sr) => {
      const out = blank(sr, 0.4);
      addAt(out, fmTone(sr, { freq: 1800, ratio: 1.8, index: 4, indexTo: 0.3, dur: 0.32, gain: 0.35, curve: 3 }), 0, sr, 0.85);
      addAt(out, noiseBurst(sr, { dur: 0.06, freq: 3600, freqTo: 1600, q: 1.2, gain: 0.4, attack: 0.001, curve: 6, seed: 3033 }), 0, sr, 0.75);
      return trim(out, 0.72);
    },
  },
  counter: {
    about: 'Parry tick immediately followed by a counter-hit.',
    render: (sr) => {
      const out = blank(sr, 0.5);
      addAt(out, fmTone(sr, { freq: 2000, ratio: 1.7, index: 3, indexTo: 0.2, dur: 0.1, gain: 0.35, curve: 5 }), 0, sr, 0.8);
      addAt(out, tone(sr, { freq: 210, toFreq: 68, glide: 0.5, dur: 0.2, wave: 'sine', gain: 0.65, curve: 4, drive: 2 }), 0.09, sr, 0.9);
      addAt(out, noiseBurst(sr, { dur: 0.12, freq: 1700, freqTo: 500, q: 0.7, gain: 0.4, curve: 5, seed: 5252 }), 0.09, sr, 0.8);
      return trim(out, 0.85);
    },
  },
};
