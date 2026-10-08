/**
 * **The Leblanc Syndicate's real statures (FFX-2 only, Chapter VI; branch r3941-stage).**
 *
 * The table in `src/data/ffx2/syndicate-stature.ts` is sourced data: the bind-pose heights of the FFX-2 HD Remaster's models, as ratios to the girls' mean
 * (`research/ffx2-leblanc-syndicate.md` §20). These tests pin the table, the ratios the build was asked for (Bailey, 2026-10-07: Ormi 1.15, Logos 1.26,
 * Leblanc 1.05, Dr. Goon 1.10, Fem-Goon 1.01), that every fiend of the three acts is named (and no one else), and that the module stays pure data.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  GIRL_MODEL_STATURES,
  SYNDICATE_COMBATANT_MODEL,
  SYNDICATE_MODEL_STATURES,
  girlsMeanModelHeight,
  statureOverGirls,
  syndicateFigureHeights,
  type SyndicateModelId,
} from '../../../src/data/ffx2/syndicate-stature.ts';
import { LEBLANC_ACT_I, LEBLANC_ACT_II, LEBLANC_ACT_III } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string): string => readFileSync(join(here, '../../..', rel), 'utf8');

describe('the girls: the unit every fiend is measured in', () => {
  it('thirteen usable FFX-2 girl models, c056 to c070, 16.3 to 17.7 units, mean 16.98', () => {
    expect(GIRL_MODEL_STATURES).toHaveLength(13);
    const heights = GIRL_MODEL_STATURES.map((g) => g.height);
    expect(Math.min(...heights)).toBeCloseTo(16.263, 3);
    expect(Math.max(...heights)).toBeCloseTo(17.697, 3);
    expect(girlsMeanModelHeight()).toBeCloseTo(16.9835, 3);
    // c060 (a 44-unit mesh that is not a body) and c067 (no mesh) are left out
    const ids = GIRL_MODEL_STATURES.map((g) => g.model);
    expect(ids).not.toContain('c060');
    expect(ids).not.toContain('c067');
    expect(new Set(ids).size).toBe(13);
    for (const id of ids) expect(id).toMatch(/^c0(5[6-9]|6[0-9]|70)$/);
  });
});

describe('the five Syndicate models, over the girls', () => {
  const want: Record<SyndicateModelId, { name: string; height: number; ratio: number }> = {
    m129: { name: 'Ormi', height: 19.557, ratio: 1.15 },
    m130: { name: 'Logos', height: 21.418, ratio: 1.26 },
    m131: { name: 'Leblanc', height: 17.822, ratio: 1.05 },
    m135: { name: 'Dr. Goon', height: 18.691, ratio: 1.1 },
    m138: { name: 'Fem-Goon', height: 17.081, ratio: 1.01 },
  };

  it('are the measured bind-pose heights, named by the monster records', () => {
    for (const [id, w] of Object.entries(want)) {
      const m = SYNDICATE_MODEL_STATURES[id as SyndicateModelId];
      expect(m.model).toBe(id);
      expect(m.name).toBe(w.name);
      expect(m.height).toBeCloseTo(w.height, 3);
    }
    expect(Object.keys(SYNDICATE_MODEL_STATURES).sort()).toEqual(['m129', 'm130', 'm131', 'm135', 'm138']);
  });

  it('stand at the ratios the pick asked for: Ormi 1.15, Logos 1.26, Leblanc 1.05, Dr. Goon 1.10, Fem-Goon 1.01 (to the second place)', () => {
    for (const [id, w] of Object.entries(want)) expect(statureOverGirls(id as SyndicateModelId), w.name).toBeCloseTo(w.ratio, 2);
  });

  it('are all at least the girls (the bosses were drawn at 0.7 to 1.0 of a boss slot; the models say 1.0 to 1.26)', () => {
    for (const id of Object.keys(want)) expect(statureOverGirls(id as SyndicateModelId)).toBeGreaterThanOrEqual(1);
    // Logos is the tallest and Fem-Goon the shortest, by the models
    const order = (Object.keys(want) as SyndicateModelId[]).sort((a, b) => statureOverGirls(b) - statureOverGirls(a));
    expect(order).toEqual(['m130', 'm129', 'm135', 'm131', 'm138']);
  });
});

describe('every fiend of Acts I, II and III is named, and nobody else', () => {
  const act = (id: string): string[] => ENEMY_GROUPS_BY_ID[id]!.enemies.map((e) => e.id);

  it('Act I: Ormi and the two goons; Act II: Logos and Ormi; Act III: Leblanc, Logos and Ormi (the encounter data)', () => {
    expect(act(LEBLANC_ACT_I).sort()).toEqual(['dr-goon', 'fem-goon', 'ormi-entrance']);
    expect(act(LEBLANC_ACT_II).sort()).toEqual(['logos-room', 'ormi-logos-room']);
    expect(act(LEBLANC_ACT_III).sort()).toEqual(['leblanc', 'logos', 'ormi']);
  });

  it('every one of them has a model, and the table names no combatant the three acts do not field', () => {
    const fielded = [LEBLANC_ACT_I, LEBLANC_ACT_II, LEBLANC_ACT_III].flatMap(act).sort();
    expect(Object.keys(SYNDICATE_COMBATANT_MODEL).sort()).toEqual(fielded);
    expect(Object.keys(syndicateFigureHeights(1.68)).sort()).toEqual(fielded);
  });

  it('the records of one fiend are one model: three Ormi and two Logos stand at one height each', () => {
    const h = syndicateFigureHeights(1.68);
    expect(h['ormi-entrance']).toBe(h['ormi-logos-room']);
    expect(h['ormi']).toBe(h['ormi-entrance']);
    expect(h['logos']).toBe(h['logos-room']);
  });
});

describe('the world heights a stage with 1.68-tall girls gives them', () => {
  it('Ormi 1.935, Logos 2.119, Leblanc 1.763, Dr. Goon 1.849, Fem-Goon 1.690 (the girls\' 1.68 times the ratio, to the millimetre)', () => {
    const h = syndicateFigureHeights(1.68);
    expect(h['ormi']).toBeCloseTo(1.935, 3);
    expect(h['logos']).toBeCloseTo(2.119, 3);
    expect(h['leblanc']).toBeCloseTo(1.763, 3);
    expect(h['dr-goon']).toBeCloseTo(1.849, 3);
    expect(h['fem-goon']).toBeCloseTo(1.69, 3);
  });

  it('scale with the girls: a stage whose girls stand 2.0 tall stands every fiend 2.0 / 1.68 as tall', () => {
    const a = syndicateFigureHeights(1.68);
    const b = syndicateFigureHeights(2);
    for (const id of Object.keys(a)) expect(b[id]! / a[id]!, id).toBeCloseTo(2 / 1.68, 2);
  });
});

describe('the source note and the layering', () => {
  const doc = read('research/ffx2-leblanc-syndicate.md');

  it('research §20 carries the method, the build, the five models and the five-percent caveat', () => {
    expect(doc).toContain('## 20. Research addendum (2026-10-07)');
    expect(doc).toContain('25501027');
    for (const id of ['m129', 'm130', 'm131', 'm135', 'm138']) expect(doc, id).toContain(id);
    expect(doc).toMatch(/about 5 percent/);
    expect(doc).toMatch(/not found/i); // the engine scale, the stand positions and the camera are named as not found
    expect(doc).toContain('16.984');
  });

  it('the table\'s own header points at that note, and the module reads nothing (pure data: no import)', () => {
    const src = read('src/data/ffx2/syndicate-stature.ts');
    expect(src).toContain('research/ffx2-leblanc-syndicate.md');
    expect(src).not.toMatch(/^import /m);
    expect(src).not.toMatch(/from ['"]/);
  });
});
