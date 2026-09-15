/** Menu, cursor and results SFX. */

import { addAt, blank, fmTone, noiseBurst, tone, trim, voiceNote } from './kit.ts';
import type { SfxDef } from './kit.ts';

export const uiSfx: Record<string, SfxDef> = {
  'cursor-move': {
    about: 'Dry tick as the finger cursor steps down a list.',
    render: (sr) => trim(tone(sr, { freq: 1180, toFreq: 1320, wave: 'pulse', width: 0.3, dur: 0.045, gain: 0.5, curve: 6 }), 0.55),
  },
  confirm: {
    about: 'Two-note rising confirm.',
    render: (sr) => {
      const out = blank(sr, 0.22);
      addAt(out, tone(sr, { freq: 880, wave: 'pulse', width: 0.35, dur: 0.06, gain: 0.5, curve: 5 }), 0, sr, 0.8);
      addAt(out, tone(sr, { freq: 1320, wave: 'pulse', width: 0.28, dur: 0.14, gain: 0.5, curve: 4 }), 0.05, sr, 0.9);
      return trim(out, 0.7);
    },
  },
  cancel: {
    about: 'Two-note falling cancel.',
    render: (sr) => {
      const out = blank(sr, 0.22);
      addAt(out, tone(sr, { freq: 660, wave: 'pulse', width: 0.4, dur: 0.06, gain: 0.45, curve: 5 }), 0, sr, 0.8);
      addAt(out, tone(sr, { freq: 440, wave: 'pulse', width: 0.45, dur: 0.14, gain: 0.45, curve: 4 }), 0.05, sr, 0.85);
      return trim(out, 0.62);
    },
  },
  error: {
    about: 'Flat buzz for an illegal action.',
    render: (sr) => {
      const out = blank(sr, 0.3);
      for (let i = 0; i < 2; i++) {
        addAt(
          out,
          tone(sr, { freq: 155, wave: 'square', dur: 0.1, gain: 0.5, drive: 3, curve: 2, attack: 0.001 }),
          i * 0.12,
          sr,
          0.9,
        );
      }
      return trim(out, 0.6);
    },
  },
  'menu-open': {
    about: 'Window sliding open: rising airy sweep plus a soft tick.',
    render: (sr) => {
      const out = blank(sr, 0.3);
      addAt(out, noiseBurst(sr, { dur: 0.22, freq: 900, freqTo: 5200, q: 1.6, gain: 0.35, attack: 0.02, curve: 2.5 }), 0, sr, 0.8);
      addAt(out, tone(sr, { freq: 520, toFreq: 1040, dur: 0.12, wave: 'tri', gain: 0.35, curve: 4 }), 0.01, sr, 0.7);
      return trim(out, 0.6);
    },
  },
  'menu-close': {
    about: 'Window sliding shut: the open cue reversed in pitch.',
    render: (sr) => {
      const out = blank(sr, 0.3);
      addAt(out, noiseBurst(sr, { dur: 0.2, freq: 4600, freqTo: 700, q: 1.6, gain: 0.32, attack: 0.005, curve: 3.5 }), 0, sr, 0.8);
      addAt(out, tone(sr, { freq: 880, toFreq: 380, dur: 0.12, wave: 'tri', gain: 0.32, curve: 5 }), 0.01, sr, 0.7);
      return trim(out, 0.58);
    },
  },
  'coin-tick': {
    about: 'Per-point tick for the results screen counter.',
    render: (sr) => {
      const out = blank(sr, 0.12);
      addAt(out, voiceNote(sr, 'mallet', 'C7', 0.04, 0.7), 0, sr, 0.9);
      addAt(out, tone(sr, { freq: 2640, dur: 0.035, wave: 'tri', gain: 0.25, curve: 6 }), 0, sr, 0.6);
      return trim(out, 0.55);
    },
  },
  'status-applied': {
    about: 'Wobbling chime when a status lands.',
    render: (sr) => {
      const out = blank(sr, 0.5);
      addAt(out, fmTone(sr, { freq: 740, ratio: 1.41, index: 3, indexTo: 0.5, dur: 0.4, gain: 0.4, curve: 3.5 }), 0, sr, 0.85, -0.2);
      addAt(out, tone(sr, { freq: 494, dur: 0.35, wave: 'tri', gain: 0.25, vibrato: 0.03, vibratoRate: 11, curve: 3 }), 0.02, sr, 0.7, 0.25);
      return trim(out, 0.62);
    },
  },
  'overdrive-full': {
    about: 'Gauge fills: rising shimmer into a bright chime.',
    render: (sr) => {
      const out = blank(sr, 1.3);
      addAt(out, tone(sr, { freq: 330, toFreq: 1320, dur: 0.5, wave: 'saw', cutoff: 800, cutoffTo: 5200, resonance: 2.4, gain: 0.3, curve: 1.2, attack: 0.05 }), 0, sr, 0.8);
      addAt(out, voiceNote(sr, 'bell', 'C6', 0.6, 0.85), 0.42, sr, 0.75, 0.1);
      addAt(out, voiceNote(sr, 'bell', 'G6', 0.6, 0.6), 0.5, sr, 0.5, -0.2);
      addAt(out, noiseBurst(sr, { dur: 0.6, freq: 6000, freqTo: 11000, q: 0.8, gain: 0.16, attack: 0.15, curve: 3 }), 0.35, sr, 0.7);
      return trim(out, 0.78);
    },
  },
};
