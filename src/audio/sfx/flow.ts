/** Battle-flow SFX: CTB ticks, turn cues, Overdrive minigames, chain hits, spherechange. */

import { makeNoise } from '../dsp/oscillators.ts';
import { addAt, blank, noiseBurst, tone, trim, voiceNote } from './kit.ts';
import type { SfxDef } from './kit.ts';

export const flowSfx: Record<string, SfxDef> = {
  'ctb-tick': {
    about: 'Very quiet tick as the turn-order list advances.',
    render: (sr) => trim(tone(sr, { freq: 1500, toFreq: 1700, wave: 'sine', dur: 0.035, gain: 0.4, curve: 7, attack: 0.001 }), 0.32),
  },
  'ctb-shift': {
    about: 'Soft two-step shuffle when the turn order changes.',
    render: (sr) => {
      const out = blank(sr, 0.22);
      addAt(out, tone(sr, { freq: 900, toFreq: 1100, wave: 'sine', dur: 0.05, gain: 0.35, curve: 6 }), 0, sr, 0.7, -0.15);
      addAt(out, tone(sr, { freq: 1000, toFreq: 1250, wave: 'sine', dur: 0.06, gain: 0.35, curve: 6 }), 0.09, sr, 0.75, 0.15);
      return trim(out, 0.45);
    },
  },
  'turn-ready': {
    about: 'Gentle chime: a party member can act.',
    render: (sr) => {
      const out = blank(sr, 0.6);
      addAt(out, voiceNote(sr, 'bell', 'E6', 0.5, 0.55), 0, sr, 0.8);
      addAt(out, voiceNote(sr, 'celesta', 'B6', 0.4, 0.4), 0.04, sr, 0.5, 0.2);
      return trim(out, 0.6);
    },
  },
  'menu-page': {
    about: 'Tab or page switch inside a menu.',
    render: (sr) => trim(tone(sr, { freq: 700, toFreq: 1400, wave: 'pulse', width: 0.35, dur: 0.08, gain: 0.4, curve: 5 }), 0.55),
  },
  'battle-start': {
    about: 'Encounter transition: glassy shatter and swirl, about a second.',
    render: (sr) => {
      const out = blank(sr, 1.05);
      addAt(out, noiseBurst(sr, { dur: 0.12, freq: 4500, freqTo: 1200, q: 0.7, gain: 0.5, attack: 0.001, curve: 5, seed: 7373 }), 0, sr, 0.85);
      addAt(out, tone(sr, { freq: 300, toFreq: 1800, glide: 1.6, dur: 0.7, wave: 'saw', cutoff: 700, cutoffTo: 5200, resonance: 2.4, gain: 0.3, curve: 1.1, attack: 0.05 }), 0.05, sr, 0.75);
      const shards = ['C7', 'E7', 'G7'];
      shards.forEach((pitch, i) => addAt(out, voiceNote(sr, 'bell', pitch, 0.5, 0.5), 0.1 + i * 0.06, sr, 0.4, -0.3 + i * 0.3));
      return trim(out, 0.82);
    },
  },
  escape: {
    about: 'Running away: a quick downward whoosh.',
    render: (sr) => {
      const out = blank(sr, 0.35);
      addAt(out, noiseBurst(sr, { dur: 0.3, freq: 4000, freqTo: 300, q: 1.1, gain: 0.45, attack: 0.01, curve: 2.2 }), 0, sr, 0.85);
      addAt(out, tone(sr, { freq: 1400, toFreq: 200, glide: 0.6, dur: 0.28, wave: 'tri', gain: 0.2, curve: 2 }), 0, sr, 0.6);
      return trim(out, 0.68);
    },
  },
  'od-cursor-tick': {
    about: 'Swordplay cursor tick, built to sound good repeated fast.',
    render: (sr) => trim(tone(sr, { freq: 2000, wave: 'sine', dur: 0.03, gain: 0.4, curve: 8, attack: 0.001 }), 0.45),
  },
  'od-timer-tick': {
    about: 'Slightly tense Overdrive countdown tick.',
    render: (sr) => trim(tone(sr, { freq: 1200, toFreq: 900, wave: 'square', dur: 0.05, gain: 0.45, curve: 6, drive: 1.5 }), 0.5),
  },
  'od-hit-zone': {
    about: 'Bright success hit of a timing bar.',
    render: (sr) => {
      const out = blank(sr, 0.24);
      addAt(out, tone(sr, { freq: 1100, toFreq: 2200, wave: 'pulse', width: 0.3, dur: 0.14, gain: 0.45, curve: 4 }), 0, sr, 0.85);
      addAt(out, voiceNote(sr, 'sfx-blip', 'C7', 0.1, 0.6), 0, sr, 0.5);
      return trim(out, 0.68);
    },
  },
  'od-miss': {
    about: 'Dull timing-bar failure.',
    render: (sr) => trim(tone(sr, { freq: 220, toFreq: 130, wave: 'square', dur: 0.16, gain: 0.4, curve: 4, drive: 2 }), 0.55),
  },
  'od-input': {
    about: 'Bushido button-sequence press.',
    render: (sr) => trim(tone(sr, { freq: 1400, wave: 'pulse', width: 0.25, dur: 0.06, gain: 0.4, curve: 6 }), 0.55),
  },
  'od-sequence-complete': {
    about: 'Bushido sequence cleared: a bright flourish.',
    render: (sr) => {
      const out = blank(sr, 0.55);
      const notes: Array<[string, number]> = [
        ['C6', 0],
        ['E6', 0.06],
        ['G6', 0.12],
        ['C7', 0.2],
      ];
      for (const [pitch, at] of notes) addAt(out, voiceNote(sr, 'mallet', pitch, 0.3, 0.7), at, sr, 0.75);
      return trim(out, 0.75);
    },
  },
  'od-reel-spin': {
    about: 'Short spinning-reel clatter, about 0.3s, designed to be retriggered rapidly.',
    render: (sr) => {
      const out = blank(sr, 0.3);
      const rand = makeNoise(3141);
      for (let i = 0; i < 5; i++) {
        addAt(out, noiseBurst(sr, { dur: 0.04, freq: 1800 + i * 200, q: 3, gain: 0.3, curve: 7, seed: 200 + i }), i * 0.05, sr, 0.6, rand() * 0.3);
      }
      return trim(out, 0.55);
    },
  },
  'od-reel-stop': {
    about: 'Reel lands with a clunk.',
    render: (sr) => {
      const out = blank(sr, 0.24);
      addAt(out, tone(sr, { freq: 180, toFreq: 90, glide: 0.5, dur: 0.14, wave: 'sine', gain: 0.5, curve: 4 }), 0, sr, 0.85);
      addAt(out, noiseBurst(sr, { dur: 0.06, freq: 1400, freqTo: 500, q: 0.9, gain: 0.35, curve: 5, seed: 909 }), 0, sr, 0.7);
      return trim(out, 0.7);
    },
  },
  'od-fury-rotation': {
    about: "Lulu's Fury stick-rotation counter tick, with a rising feel.",
    render: (sr) => trim(tone(sr, { freq: 700, toFreq: 1000, wave: 'tri', dur: 0.05, gain: 0.4, curve: 6 }), 0.5),
  },
  'od-mix-select': {
    about: 'Rikku Mix ingredient pick.',
    render: (sr) => {
      const out = blank(sr, 0.18);
      addAt(out, voiceNote(sr, 'sfx-blip', 'G6', 0.09, 0.55), 0, sr, 0.7);
      addAt(out, tone(sr, { freq: 1900, dur: 0.04, wave: 'sine', gain: 0.3, curve: 6 }), 0.02, sr, 0.4);
      return trim(out, 0.55);
    },
  },
  'od-success': {
    about: 'Overdrive minigame result: good.',
    render: (sr) => {
      const out = blank(sr, 0.5);
      addAt(out, voiceNote(sr, 'mallet', 'C6', 0.16, 0.7), 0, sr, 0.75);
      addAt(out, voiceNote(sr, 'mallet', 'G6', 0.28, 0.8), 0.1, sr, 0.8);
      return trim(out, 0.75);
    },
  },
  'od-fail': {
    about: 'Overdrive minigame result: poor.',
    render: (sr) => trim(tone(sr, { freq: 380, toFreq: 160, wave: 'square', dur: 0.3, gain: 0.4, curve: 3, drive: 2 }), 0.62),
  },
  'chain-hit': {
    about: 'FFX-2 chain-combo hit: a bright short ping, meant to be pitch-stepped upward per hit by the caller.',
    render: (sr) => {
      const out = blank(sr, 0.2);
      addAt(out, tone(sr, { freq: 1600, wave: 'sine', dur: 0.12, gain: 0.5, curve: 5 }), 0, sr, 0.85);
      addAt(out, voiceNote(sr, 'sfx-blip', 'A6', 0.08, 0.6), 0, sr, 0.5);
      return trim(out, 0.75);
    },
  },
  'chain-break': {
    about: 'Chain combo ends.',
    render: (sr) => trim(tone(sr, { freq: 900, toFreq: 300, wave: 'tri', dur: 0.2, gain: 0.4, curve: 3.5 }), 0.6),
  },
  spherechange: {
    about: 'Dressphere change: whoosh, sparkle and a bright pop-chord bloom, about 1.2s.',
    render: (sr) => {
      const out = blank(sr, 1.25);
      addAt(out, noiseBurst(sr, { dur: 0.5, freq: 600, freqTo: 6000, q: 1.4, gain: 0.35, attack: 0.05, curve: 1.8 }), 0, sr, 0.8);
      addAt(out, tone(sr, { freq: 200, toFreq: 1600, glide: 1.4, dur: 0.45, wave: 'saw', cutoff: 700, cutoffTo: 5200, resonance: 2, gain: 0.28, curve: 1, attack: 0.03 }), 0, sr, 0.75);
      for (const pitch of ['C5', 'E5', 'G5', 'C6']) addAt(out, voiceNote(sr, 'bell', pitch, 0.7, 0.6), 0.45, sr, 0.5, -0.2);
      addAt(out, voiceNote(sr, 'sfx-shimmer', 'E7', 0.6, 0.5), 0.5, sr, 0.45, 0.3);
      return trim(out, 0.85);
    },
  },
  'garment-grid-gate': {
    about: 'Garment Grid gate bonus chime.',
    render: (sr) => {
      const out = blank(sr, 0.5);
      addAt(out, voiceNote(sr, 'celesta', 'G6', 0.35, 0.6), 0, sr, 0.75);
      addAt(out, voiceNote(sr, 'celesta', 'C7', 0.3, 0.55), 0.05, sr, 0.6, 0.2);
      return trim(out, 0.68);
    },
  },
};
