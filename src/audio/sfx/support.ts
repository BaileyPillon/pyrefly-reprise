/** Healing, buffs, debuffs, revival, items and aeon departure. */

import { makeNoise } from '../dsp/oscillators.ts';
import { addAt, blank, fmTone, noiseBurst, tone, trim, voiceNote } from './kit.ts';
import type { SfxDef } from './kit.ts';

export const supportSfx: Record<string, SfxDef> = {
  'cure-2': {
    about: 'Bigger cure: a fuller rising celesta figure through more motes of light.',
    render: (sr) => {
      const out = blank(sr, 1.5);
      const figure = ['C5', 'G5', 'C6', 'E6', 'G6'];
      figure.forEach((pitch, i) => {
        addAt(out, voiceNote(sr, 'celesta', pitch, 0.55, 0.55 + i * 0.06), i * 0.07, sr, 0.72, -0.25 + i * 0.1);
      });
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'C6', 0.9, 0.55), 0.15, sr, 0.55);
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 5000, freqTo: 9800, q: 1.1, gain: 0.14, attack: 0.3, curve: 2.2 }), 0.1, sr, 0.65);
      return trim(out, 0.78);
    },
  },
  'cure-3': {
    about: 'Full-scale cure: a radiant rising figure, a warm swelling foundation, and a wide shimmer bloom.',
    render: (sr) => {
      const out = blank(sr, 1.9);
      const figure = ['G4', 'C5', 'G5', 'C6', 'E6', 'G6'];
      figure.forEach((pitch, i) => {
        addAt(out, voiceNote(sr, 'celesta', pitch, 0.6, 0.5 + i * 0.05), i * 0.065, sr, 0.68, -0.35 + i * 0.11);
      });
      addAt(out, tone(sr, { freq: 220, toFreq: 440, dur: 1.0, wave: 'tri', gain: 0.16, curve: 1.4, attack: 0.3 }), 0, sr, 0.55);
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'C6', 1.0, 0.55), 0.2, sr, 0.55, -0.3);
      addAt(out, noiseBurst(sr, { dur: 1.3, freq: 5000, freqTo: 10500, q: 1.1, gain: 0.16, attack: 0.5, curve: 1.8 }), 0.15, sr, 0.7);
      return trim(out, 0.85);
    },
  },
  regen: {
    about: 'Regen: a gentle recurring shimmer of restorative motes.',
    render: (sr) => {
      const out = blank(sr, 0.6);
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'E6', 0.4, 0.4), 0, sr, 0.55, -0.15);
      addAt(out, voiceNote(sr, 'celesta', 'A6', 0.3, 0.45), 0.08, sr, 0.45, 0.2);
      return trim(out, 0.62);
    },
  },
  life: {
    about: 'Life: a warm rising choir swell and a bright bell as the fallen stand again.',
    render: (sr) => {
      const out = blank(sr, 1.6);
      addAt(out, voiceNote(sr, 'choir', 'C4', 0.9, 0.5), 0, sr, 0.5, -0.15);
      addAt(out, voiceNote(sr, 'choir', 'G4', 0.9, 0.45), 0.1, sr, 0.45, 0.15);
      addAt(out, voiceNote(sr, 'bell', 'C6', 1.0, 0.85), 0.55, sr, 0.75, 0.1);
      addAt(out, tone(sr, { freq: 130, toFreq: 260, dur: 0.8, wave: 'tri', gain: 0.2, curve: 1.6, attack: 0.2 }), 0.05, sr, 0.55);
      return trim(out, 0.82);
    },
  },
  'full-life': {
    about: 'Full-Life: a radiant full choir swell with a peal of bells.',
    render: (sr) => {
      const out = blank(sr, 2.0);
      addAt(out, voiceNote(sr, 'choir', 'C4', 1.2, 0.55), 0, sr, 0.55, -0.2);
      addAt(out, voiceNote(sr, 'choir', 'G4', 1.2, 0.5), 0.08, sr, 0.5, 0.2);
      addAt(out, voiceNote(sr, 'choir', 'C5', 1.1, 0.45), 0.12, sr, 0.45);
      addAt(out, voiceNote(sr, 'bell', 'C6', 1.0, 0.9), 0.6, sr, 0.75, -0.15);
      addAt(out, voiceNote(sr, 'bell', 'G6', 0.9, 0.6), 0.68, sr, 0.5, 0.25);
      addAt(out, tone(sr, { freq: 120, toFreq: 280, dur: 1.0, wave: 'tri', gain: 0.24, curve: 1.4, attack: 0.25 }), 0.05, sr, 0.6);
      return trim(out, 0.9);
    },
  },
  esuna: {
    about: 'Esuna: a sparkling sweep upward as the ailment lifts.',
    render: (sr) => {
      const out = blank(sr, 0.55);
      addAt(out, noiseBurst(sr, { dur: 0.4, freq: 1200, freqTo: 8000, q: 1.4, gain: 0.32, attack: 0.03, curve: 2 }), 0, sr, 0.8);
      addAt(out, tone(sr, { freq: 500, toFreq: 2400, glide: 1.3, dur: 0.35, wave: 'tri', gain: 0.28, curve: 2.4 }), 0.02, sr, 0.7);
      return trim(out, 0.68);
    },
  },
  dispel: {
    about: 'Dispel: a glassy pop as buffs strip away.',
    render: (sr) => {
      const out = blank(sr, 0.4);
      addAt(out, tone(sr, { freq: 1800, toFreq: 300, glide: 1.4, dur: 0.18, wave: 'sine', gain: 0.4, curve: 3 }), 0, sr, 0.8);
      addAt(out, noiseBurst(sr, { dur: 0.15, freq: 3000, freqTo: 900, q: 1.6, gain: 0.3, attack: 0.005, curve: 4 }), 0, sr, 0.7);
      return trim(out, 0.65);
    },
  },
  protect: {
    about: 'Protect: a solid low chime with a resonant shielding hum.',
    render: (sr) => {
      const out = blank(sr, 0.7);
      addAt(out, voiceNote(sr, 'bell', 'C4', 0.55, 0.7), 0, sr, 0.7);
      addAt(out, tone(sr, { freq: 180, dur: 0.5, wave: 'saw', cutoff: 500, resonance: 3, gain: 0.3, curve: 2.2 }), 0, sr, 0.6);
      return trim(out, 0.68);
    },
  },
  shell: {
    about: 'Shell: an airy, glassy chime that domes overhead.',
    render: (sr) => {
      const out = blank(sr, 0.7);
      addAt(out, voiceNote(sr, 'bell', 'G5', 0.55, 0.6), 0, sr, 0.65);
      addAt(out, noiseBurst(sr, { dur: 0.5, freq: 4000, freqTo: 7000, q: 1.2, gain: 0.2, attack: 0.1, curve: 2 }), 0, sr, 0.55);
      return trim(out, 0.68);
    },
  },
  reflect: {
    about: 'Reflect: a mirrored shimmer standing the spell back up.',
    render: (sr) => {
      const out = blank(sr, 0.6);
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'C6', 0.45, 0.55), 0, sr, 0.6, -0.2);
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'C6', 0.45, 0.5), 0.02, sr, 0.55, 0.2);
      addAt(out, tone(sr, { freq: 2600, toFreq: 1800, dur: 0.3, wave: 'sine', gain: 0.2, curve: 2.6 }), 0, sr, 0.5);
      return trim(out, 0.66);
    },
  },
  'reflect-bounce': {
    about: 'Reflect bounce: a spell ricocheting back off the mirrored wall.',
    render: (sr) => {
      const out = blank(sr, 0.5);
      addAt(out, tone(sr, { freq: 1400, toFreq: 2600, dur: 0.1, wave: 'sine', gain: 0.35, curve: 3.5 }), 0, sr, 0.75, -0.4);
      addAt(out, tone(sr, { freq: 2600, toFreq: 1200, dur: 0.14, wave: 'sine', gain: 0.3, curve: 3 }), 0.09, sr, 0.7, 0.4);
      addAt(out, noiseBurst(sr, { dur: 0.1, freq: 4000, q: 1.8, gain: 0.2, curve: 4 }), 0.09, sr, 0.55);
      return trim(out, 0.65);
    },
  },
  haste: {
    about: 'Haste: a run of accelerating ticks rising in pitch.',
    render: (sr) => {
      const out = blank(sr, 0.55);
      const n = 7;
      for (let i = 0; i < n; i++) {
        const at = 0.02 + 0.4 * (1 - Math.pow(1 - i / n, 2));
        addAt(out, tone(sr, { freq: 500 + i * 130, wave: 'pulse', width: 0.3, dur: 0.035, gain: 0.35, curve: 6 }), at, sr, 0.7);
      }
      return trim(out, 0.65);
    },
  },
  slow: {
    about: 'Slow: decelerating ticks with a sagging pitch.',
    render: (sr) => {
      const out = blank(sr, 0.7);
      const n = 6;
      for (let i = 0; i < n; i++) {
        const at = 0.02 + 0.6 * Math.pow(i / n, 2);
        addAt(out, tone(sr, { freq: 700 - i * 70, toFreq: 500 - i * 70, wave: 'pulse', width: 0.4, dur: 0.06, gain: 0.35, curve: 4 }), at, sr, 0.65);
      }
      return trim(out, 0.62);
    },
  },
  stop: {
    about: 'Stop: a tick that halts mid-swing into a frozen shimmer.',
    render: (sr) => {
      const out = blank(sr, 0.9);
      addAt(out, tone(sr, { freq: 900, wave: 'pulse', width: 0.3, dur: 0.09, gain: 0.4, curve: 5 }), 0, sr, 0.75);
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'C7', 0.7, 0.45), 0.1, sr, 0.55);
      addAt(out, tone(sr, { freq: 3200, dur: 0.6, wave: 'sine', gain: 0.1, attack: 0.3, curve: 1.4 }), 0.1, sr, 0.4);
      return trim(out, 0.68);
    },
  },
  sleep: {
    about: 'Sleep: drowsy descending lullaby notes.',
    render: (sr) => {
      const out = blank(sr, 0.9);
      const notes: Array<[string, number]> = [
        ['A5', 0],
        ['F5', 0.22],
        ['D5', 0.44],
        ['A4', 0.66],
      ];
      for (const [pitch, at] of notes) addAt(out, voiceNote(sr, 'celesta', pitch, 0.3, 0.4), at, sr, 0.55);
      return trim(out, 0.6);
    },
  },
  silence: {
    about: 'Silence: sound sucked inward until nothing remains.',
    render: (sr) => {
      const out = blank(sr, 0.4);
      addAt(out, noiseBurst(sr, { dur: 0.3, freq: 3000, freqTo: 200, q: 1.4, gain: 0.35, attack: 0.02, curve: 1.4 }), 0, sr, 0.7);
      addAt(out, tone(sr, { freq: 800, toFreq: 60, glide: 2, dur: 0.28, wave: 'sine', gain: 0.25, curve: 1.2 }), 0.02, sr, 0.6);
      return trim(out, 0.6);
    },
  },
  blind: {
    about: 'Blind: a dark smoky whoosh across the eyes.',
    render: (sr) => {
      const out = blank(sr, 0.5);
      addAt(out, noiseBurst(sr, { dur: 0.4, freq: 700, freqTo: 200, q: 0.8, gain: 0.4, attack: 0.05, curve: 1.8, highpass: 80 }), 0, sr, 0.75);
      addAt(out, tone(sr, { freq: 150, toFreq: 70, dur: 0.3, wave: 'tri', gain: 0.2, curve: 2.4 }), 0.02, sr, 0.55);
      return trim(out, 0.62);
    },
  },
  poison: {
    about: 'Poison: a sickly wobbling drone.',
    render: (sr) => {
      const out = blank(sr, 0.55);
      addAt(out, tone(sr, { freq: 180, dur: 0.45, wave: 'square', width: 0.3, gain: 0.25, vibrato: 0.12, vibratoRate: 7, curve: 2.2, drive: 1.2 }), 0, sr, 0.7);
      addAt(out, noiseBurst(sr, { dur: 0.3, freq: 600, q: 1.2, gain: 0.16, attack: 0.05, curve: 2.6 }), 0.05, sr, 0.5);
      return trim(out, 0.62);
    },
  },
  berserk: {
    about: 'Berserk: an angry distorted growl surging up.',
    render: (sr) => {
      const out = blank(sr, 0.6);
      addAt(out, fmTone(sr, { freq: 90, toFreq: 160, ratio: 1.5, index: 5, indexTo: 2, dur: 0.5, gain: 0.5, curve: 1.8, crunchAmount: 0.7 }), 0, sr, 0.85);
      addAt(out, noiseBurst(sr, { dur: 0.4, freq: 500, freqTo: 1400, q: 0.8, gain: 0.25, attack: 0.03, curve: 2, drive: 0.4 }), 0, sr, 0.7);
      return trim(out, 0.7);
    },
  },
  confuse: {
    about: 'Confuse: a dizzy wobbling spiral of pitch.',
    render: (sr) => {
      const out = blank(sr, 0.65);
      addAt(out, tone(sr, { freq: 500, dur: 0.6, wave: 'tri', gain: 0.3, vibrato: 0.35, vibratoRate: 9, curve: 1.6 }), 0, sr, 0.7);
      addAt(out, tone(sr, { freq: 750, dur: 0.55, wave: 'sine', gain: 0.2, vibrato: 0.3, vibratoRate: 6.5, curve: 1.6 }), 0.03, sr, 0.5, 0.3);
      return trim(out, 0.62);
    },
  },
  curse: {
    about: 'Curse: a dissonant sting as abilities are sealed away.',
    render: (sr) => {
      const out = blank(sr, 0.5);
      addAt(out, tone(sr, { freq: 220, dur: 0.35, wave: 'square', gain: 0.3, curve: 3, drive: 1.6 }), 0, sr, 0.7, -0.15);
      addAt(out, tone(sr, { freq: 233, dur: 0.35, wave: 'square', gain: 0.3, curve: 3, drive: 1.6 }), 0.01, sr, 0.7, 0.15);
      addAt(out, noiseBurst(sr, { dur: 0.2, freq: 1400, freqTo: 400, q: 1.2, gain: 0.2, curve: 3.5 }), 0, sr, 0.55);
      return trim(out, 0.64);
    },
  },
  scan: {
    about: 'Scan: a sci-fi analysis sweep dotted with blips.',
    render: (sr) => {
      const out = blank(sr, 0.6);
      addAt(out, tone(sr, { freq: 600, toFreq: 2400, glide: 1.2, dur: 0.4, wave: 'pulse', width: 0.25, gain: 0.28, curve: 1.6 }), 0, sr, 0.7);
      const rand = makeNoise(9090);
      for (let i = 0; i < 4; i++) {
        addAt(out, voiceNote(sr, 'sfx-blip', 'C7', 0.05, 0.4 + i * 0.1), 0.1 + i * 0.1, sr, 0.4, rand() * 0.6);
      }
      return trim(out, 0.6);
    },
  },
  'steal-success': {
    about: 'Steal (success): a quick grab and a bright pickup jingle.',
    render: (sr) => {
      const out = blank(sr, 0.4);
      addAt(out, noiseBurst(sr, { dur: 0.08, freq: 1800, freqTo: 600, q: 1.2, gain: 0.3, curve: 4 }), 0, sr, 0.7);
      addAt(out, voiceNote(sr, 'celesta', 'C6', 0.1, 0.6), 0.08, sr, 0.65);
      addAt(out, voiceNote(sr, 'celesta', 'E6', 0.15, 0.7), 0.14, sr, 0.65);
      return trim(out, 0.68);
    },
  },
  'steal-fail': {
    about: 'Steal (fail): a quick grab and an empty-handed thud.',
    render: (sr) => {
      const out = blank(sr, 0.35);
      addAt(out, noiseBurst(sr, { dur: 0.08, freq: 1800, freqTo: 600, q: 1.2, gain: 0.3, curve: 4 }), 0, sr, 0.7);
      addAt(out, tone(sr, { freq: 140, toFreq: 70, dur: 0.12, wave: 'sine', gain: 0.35, curve: 4 }), 0.1, sr, 0.65);
      return trim(out, 0.6);
    },
  },
  'item-use': {
    about: 'Item use: a bottle uncorks with a small sparkle.',
    render: (sr) => {
      const out = blank(sr, 0.35);
      addAt(out, tone(sr, { freq: 260, toFreq: 900, glide: 0.6, dur: 0.05, wave: 'sine', gain: 0.4, curve: 6 }), 0, sr, 0.75);
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'A6', 0.25, 0.4), 0.05, sr, 0.5);
      return trim(out, 0.62);
    },
  },
  'phoenix-down': {
    about: 'Phoenix Down: a soft feather whoosh into a warm restorative burst.',
    render: (sr) => {
      const out = blank(sr, 1.0);
      addAt(out, noiseBurst(sr, { dur: 0.5, freq: 1200, freqTo: 3000, q: 1.1, gain: 0.28, attack: 0.1, curve: 2 }), 0, sr, 0.7, -0.2);
      addAt(out, voiceNote(sr, 'bell', 'E5', 0.6, 0.75), 0.35, sr, 0.65, 0.15);
      addAt(out, voiceNote(sr, 'choir', 'C4', 0.6, 0.4), 0.4, sr, 0.4);
      return trim(out, 0.75);
    },
  },
  elixir: {
    about: 'Elixir: a luxurious, fuller restorative shimmer.',
    render: (sr) => {
      const out = blank(sr, 1.3);
      const figure = ['C5', 'E5', 'G5', 'C6', 'E6'];
      figure.forEach((pitch, i) => {
        addAt(out, voiceNote(sr, 'celesta', pitch, 0.5, 0.55 + i * 0.06), i * 0.06, sr, 0.7, -0.2 + i * 0.1);
      });
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'G6', 0.8, 0.5), 0.2, sr, 0.55);
      addAt(out, noiseBurst(sr, { dur: 0.9, freq: 5000, freqTo: 10000, q: 1.1, gain: 0.15, attack: 0.3, curve: 2 }), 0.1, sr, 0.65);
      return trim(out, 0.8);
    },
  },
  'mp-restore': {
    about: 'MP restore: a cool blue shimmer refilling the well.',
    render: (sr) => {
      const out = blank(sr, 0.6);
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'A6', 0.45, 0.5), 0, sr, 0.6, -0.15);
      addAt(out, tone(sr, { freq: 1200, toFreq: 2200, glide: 1.3, dur: 0.35, wave: 'sine', gain: 0.2, curve: 2 }), 0.03, sr, 0.5, 0.2);
      return trim(out, 0.65);
    },
  },
  'buff-generic': {
    about: 'A generic positive status landing.',
    render: (sr) => {
      const out = blank(sr, 0.4);
      addAt(out, tone(sr, { freq: 500, toFreq: 900, dur: 0.22, wave: 'tri', gain: 0.35, curve: 3 }), 0, sr, 0.75);
      addAt(out, voiceNote(sr, 'celesta', 'A6', 0.2, 0.5), 0.08, sr, 0.5);
      return trim(out, 0.65);
    },
  },
  'debuff-generic': {
    about: 'A generic negative status landing.',
    render: (sr) => {
      const out = blank(sr, 0.4);
      addAt(out, tone(sr, { freq: 500, toFreq: 260, dur: 0.24, wave: 'square', gain: 0.3, curve: 3, drive: 1.2 }), 0, sr, 0.7);
      addAt(out, noiseBurst(sr, { dur: 0.15, freq: 900, freqTo: 300, q: 1, gain: 0.2, curve: 4 }), 0.05, sr, 0.55);
      return trim(out, 0.62);
    },
  },
  'summon-depart': {
    about: 'Aeon departure: the reverse of arrival, rising up and away into the air.',
    render: (sr) => {
      const out = blank(sr, 2.0);
      for (const pitch of ['D4', 'A4', 'D5']) addAt(out, voiceNote(sr, 'choir', pitch, 0.7, 0.5), 0, sr, 0.4);
      addAt(out, voiceNote(sr, 'bell', 'D5', 1.0, 0.7), 0.02, sr, 0.5, 0.2);
      addAt(out, noiseBurst(sr, { dur: 1.0, freq: 3000, freqTo: 300, q: 1.1, gain: 0.22, attack: 0.2, curve: 1.6 }), 0.3, sr, 0.7);
      addAt(out, tone(sr, { freq: 200, toFreq: 1600, glide: 1.8, dur: 1.1, wave: 'saw', cutoff: 3000, cutoffTo: 8000, resonance: 2, gain: 0.24, curve: 1.1, attack: 0.15 }), 0.5, sr, 0.7);
      return trim(out, 0.85);
    },
  },
  'aeon-overdrive': {
    about: 'Aeon overdrive: a charging roar building into a colossal choir swell.',
    render: (sr) => {
      const out = blank(sr, 3.0);
      addAt(out, fmTone(sr, { freq: 60, toFreq: 100, ratio: 1.5, index: 5, indexTo: 3, dur: 1.6, gain: 0.55, curve: 1.2, crunchAmount: 0.5, attack: 0.1 }), 0, sr, 0.85);
      addAt(out, noiseBurst(sr, { dur: 1.5, freq: 400, freqTo: 2600, q: 1, gain: 0.28, attack: 0.4, curve: 1.4 }), 0, sr, 0.75, -0.25);
      for (const pitch of ['D4', 'A4', 'D5']) addAt(out, voiceNote(sr, 'choir', pitch, 1.3, 0.6), 1.3, sr, 0.48);
      addAt(out, voiceNote(sr, 'timpani', 'D2', 1.4, 1), 1.35, sr, 0.7);
      addAt(out, voiceNote(sr, 'crash', 'C5', 1.6, 0.7), 1.35, sr, 0.45, 0.2);
      return trim(out, 0.95);
    },
  },
};
