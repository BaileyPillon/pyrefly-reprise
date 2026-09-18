/**
 * The sound-design contract.
 *
 * An agent cannot hear whether the bank is beautiful, so these tests hold the
 * rules that beauty depends on and that a careless edit silently breaks:
 * every key the game can fire resolves to something playable, every design
 * obeys `docs/audio/THEMES.md` § "Sound-effect rules", and every instrument a
 * design names exists on BOTH render paths — the sampled one that ships and
 * the synthesised one that covers for it.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  SFX_ALIASES,
  SFX_DESIGNS,
  SFX_DESIGN_GROUPS,
  hasSfx,
  resolveSfx,
  sfxNames,
} from '../../src/audio/sfx/index.ts';
import { CATEGORY_RULES, RUNTIME_STAND_INS, designProblems } from '../../src/audio/sfx/design.ts';
import type { SfxDesign } from '../../src/audio/sfx/design.ts';
import { hasInstrument } from '../../src/audio/instruments.ts';
import { hasPreset } from '../../src/audio/voices/presets/index.ts';
import { parseManifest } from '../../src/audio/manifest.ts';
import { pitchToFreq } from '../../src/audio/score.ts';

const MANIFEST_PATH = resolve(import.meta.dirname, '../../public/audio/manifest.json');

/** Pitch classes the bible allows anything pitched to use: B minor's 1 2 b3 5 b6. */
const B_MINOR = new Set([11, 1, 2, 6, 7]);

function pitchClass(pitch: string | number): number {
  const midi = Math.round(69 + 12 * Math.log2(pitchToFreq(pitch) / 440));
  return ((midi % 12) + 12) % 12;
}

function noteLayers(design: SfxDesign) {
  return design.layers.filter((l) => l.kind === 'note');
}

describe('sfx designs', () => {
  it('obeys its own structural rules', () => {
    const problems: string[] = [];
    for (const [name, design] of Object.entries(SFX_DESIGNS)) problems.push(...designProblems(name, design));
    expect(problems).toEqual([]);
  });

  it('names every cue in exactly one group', () => {
    const owner = new Map<string, string>();
    const clashes: string[] = [];
    for (const [group, designs] of Object.entries(SFX_DESIGN_GROUPS)) {
      for (const name of Object.keys(designs)) {
        if (owner.has(name)) clashes.push(`${name} (${owner.get(name)} + ${group})`);
        owner.set(name, group);
      }
    }
    expect(clashes).toEqual([]);
    expect(sfxNames().length).toBe(Object.keys(SFX_DESIGNS).length);
  });

  it('only names instruments that both render paths can play', () => {
    const missing: string[] = [];
    for (const [name, design] of Object.entries(SFX_DESIGNS)) {
      for (const layer of noteLayers(design)) {
        // The sampled path is what ships: no stand-ins, no silent fallback.
        if (!hasPreset(layer.instrument)) missing.push(`${name}: no sampled preset for "${layer.instrument}"`);
        // The browser path may substitute, but the substitute has to exist.
        const runtime = hasInstrument(layer.instrument)
          ? layer.instrument
          : RUNTIME_STAND_INS[layer.instrument];
        if (runtime === undefined || !hasInstrument(runtime)) {
          missing.push(`${name}: no runtime voice or stand-in for "${layer.instrument}"`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps the interface inside B minor', () => {
    const strays: string[] = [];
    for (const [name, design] of Object.entries(SFX_DESIGNS)) {
      if (design.category !== 'ui') continue;
      for (const layer of noteLayers(design)) {
        const pitches = Array.isArray(layer.pitch) ? layer.pitch : [layer.pitch];
        for (const pitch of pitches) {
          if (!B_MINOR.has(pitchClass(pitch))) strays.push(`${name}: ${String(pitch)}`);
        }
      }
    }
    expect(strays).toEqual([]);
  });

  it('gives every impact weight and anticipation', () => {
    const thin: string[] = [];
    for (const [name, design] of Object.entries(SFX_DESIGNS)) {
      if (design.category !== 'impact') continue;
      const hasSub = design.layers.some((l) => l.kind === 'sub');
      const hasMovement = design.layers.some((l) => l.kind === 'air');
      if (!hasSub) thin.push(`${name}: no sub layer — rule 3 wants weight under 90 Hz`);
      if (!hasMovement) thin.push(`${name}: no air layer — a hit with no anticipation is a click`);
    }
    expect(thin).toEqual([]);
  });

  it('keeps the menu quiet and the big moments rare', () => {
    // UI cues are heard constantly, so they are short and normalised low; the
    // loud categories exist but must stay a minority of the bank.
    for (const [name, design] of Object.entries(SFX_DESIGNS)) {
      if (design.category === 'ui') expect(design.length, name).toBeLessThanOrEqual(2.5);
    }
    const flourishes = Object.values(SFX_DESIGNS).filter((d) => d.category === 'flourish').length;
    expect(flourishes).toBeLessThan(Object.keys(SFX_DESIGNS).length / 4);
    expect(CATEGORY_RULES.ui.lufs).toBeLessThan(CATEGORY_RULES.impact.lufs);
  });

  it('resolves every alias the battle data uses', () => {
    const broken = Object.entries(SFX_ALIASES)
      .filter(([, target]) => !hasSfx(target))
      .map(([key, target]) => `${key} -> ${target}`);
    expect(broken).toEqual([]);
    for (const key of Object.keys(SFX_ALIASES)) expect(resolveSfx(key), key).toBeDefined();
  });
});

describe('the shipped sprite', () => {
  const raw = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : null;
  const manifest = raw ? parseManifest(raw) : null;

  it.runIf(manifest?.sfx)('has a pre-rendered cue for every key in the bank', () => {
    const cues = manifest!.sfx!.cues;
    const missing = sfxNames().filter((name) => !Object.prototype.hasOwnProperty.call(cues, name));
    // A missing cue is not fatal at runtime — the design still renders in the
    // browser — but it means the sprite is stale, and stale is how a cue Bailey
    // asked for goes on sounding like the old one.
    expect(missing, 'stale sprite: re-run `npm run audio:render -- --sfx`').toEqual([]);
  });

  it.runIf(manifest?.sfx)('stays inside the sound-effect budget', () => {
    const sprite = manifest!.sfx!;
    expect(sprite.bytes ?? 0).toBeLessThan(3.5e6);
    for (const [name, cue] of Object.entries(sprite.cues)) {
      expect(cue.duration, name).toBeGreaterThanOrEqual(0.03);
      expect(cue.duration, name).toBeLessThan(4);
      expect(cue.offset, name).toBeLessThan(sprite.duration);
    }
  });

  it.runIf(manifest?.sfx)('levels each category where its rules say', () => {
    const cues = raw.sfx.cues as Record<string, { category?: string; lufs?: number; truePeakDb?: number }>;
    const off: string[] = [];
    for (const [name, cue] of Object.entries(cues)) {
      if (cue.category === undefined || cue.lufs === undefined) continue;
      const target = CATEGORY_RULES[cue.category as keyof typeof CATEGORY_RULES]?.lufs;
      if (target === undefined) {
        off.push(`${name}: unknown category "${cue.category}"`);
        continue;
      }
      if (Math.abs(cue.lufs - target) > 3) off.push(`${name}: ${cue.lufs} LUFS against ${target}`);
      if ((cue.truePeakDb ?? -99) > -1) off.push(`${name}: ${cue.truePeakDb} dBTP is over the ceiling`);
    }
    expect(off).toEqual([]);
  });
});
