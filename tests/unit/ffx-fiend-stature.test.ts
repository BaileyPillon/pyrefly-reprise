/**
 * **FFX fiend stature (FFX only, Chapters IX and XIV; branch r3942-stage, wave 1).**
 *
 * `src/data/ffx/fiend-stature.ts` is sourced data: the default-pose heights of the FFX HD Remaster's models, raw mesh height times the engine scale `C`
 * (`research/ffx-yojimbo.md` section 12, `research/ffx-isaaru-bevelle.md` section 14). These tests pin the arithmetic (`raw x C`), the ratios to Tidus the
 * build was asked for (Yojimbo 1.49, Daigoro 0.44, Lady Ginnem 0.95), that no giant is in the table, that the stage's heights come from it, and that the module
 * stays pure data.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FFX_FIEND_STATURE, fiendFigureHeights, fiendOverTidus } from '../../src/data/ffx/fiend-stature.ts';
import { TIDUS_TOP } from '../../src/data/ffx/party-stature.ts';
import { CAVERN_ACTOR_HEIGHTS, CAVERN_STOLEN_FAYTH_SLOTS } from '../../src/scenes/cavern-stolen-fayth.ts';
import { VIA_ACTOR_HEIGHTS, VIA_AEON_SPOT, VIA_ISAARU_SPOT, VIA_PURIFICO_SLOTS } from '../../src/scenes/via-purifico.ts';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string): string => readFileSync(join(here, '../..', rel), 'utf8');

describe('the table is raw mesh height times the engine scale', () => {
  it('every row: height = raw x C to a thousandth, and C is 1 for a human or a monster mesh and 4 for an aeon model', () => {
    for (const [id, row] of Object.entries(FFX_FIEND_STATURE)) {
      expect(row.height, id).toBeCloseTo(row.raw * row.scale, 2);
      expect(row.scale, id).toBe(row.model.startsWith('s') ? 4 : 1);
    }
  });

  it('names the models the game gives these fiends: Yojimbo s008, Daigoro s023, Lady Ginnem k014, Isaaru k004, the three aeons s002, s001 and s006', () => {
    const models = Object.fromEntries(Object.entries(FFX_FIEND_STATURE).map(([id, r]) => [id, r.model]));
    expect(models).toEqual({ yojimbo: 's008', daigoro: 's023', ginnem: 'k014', isaaru: 'k004', grothia: 's002', pterya: 's001', spathi: 's006' });
  });

  it('holds no giant: Bahamut, Anima, Evrae, Braska\'s Final Aeon, Natus, Flux, Omnis, Yunalesca and Sin keep their own framing', () => {
    for (const id of ['bahamut', 'anima', 'evrae', 'braskas-final-aeon', 'seymour-natus', 'seymour-flux', 'seymour-omnis', 'yunalesca', 'sin']) {
      expect(FFX_FIEND_STATURE[id], id).toBeUndefined();
    }
  });
});

describe('over Tidus (18.15), the ratios the build was asked for', () => {
  it('Yojimbo 1.49, Daigoro 0.44, Lady Ginnem 0.95; Isaaru 1.03', () => {
    expect(fiendOverTidus('yojimbo')).toBeCloseTo(1.493, 3);
    expect(fiendOverTidus('daigoro')).toBeCloseTo(0.439, 3);
    expect(fiendOverTidus('ginnem')).toBeCloseTo(0.954, 3);
    expect(fiendOverTidus('isaaru')).toBeCloseTo(1.029, 3);
    expect(fiendOverTidus('not-a-fiend')).toBe(1);
  });

  it("Yojimbo's head point read live in PCSX2 (26.9 to 27.0) and his height field (29.0): the table's 27.1 is the drawn silhouette, 0.4 percent from the live head", () => {
    expect(FFX_FIEND_STATURE['yojimbo']!.height).toBeCloseTo(27.1, 1);
    expect(Math.abs(FFX_FIEND_STATURE['yojimbo']!.height - 27.0) / 27.0).toBeLessThan(0.005);
    expect(FFX_FIEND_STATURE['daigoro']!.engine).toBe(8);
    expect(FFX_FIEND_STATURE['daigoro']!.height).toBeCloseTo(8, 0);
  });
});

describe('the stage heights come from the table', () => {
  it("fiendFigureHeights is the party's height times the model's ratio to the reference hero, to the millimetre, and skips an id it does not know", () => {
    expect(fiendFigureHeights(['yojimbo', 'daigoro', 'ginnem', 'nobody'], 1.75)).toEqual({ yojimbo: 2.613, daigoro: 0.769, ginnem: 1.67 });
    // Chapter XIV's scene gives Yuna her own height (16.53), so its aeons are read against her, not Tidus
    const yuna = fiendFigureHeights(['isaaru', 'grothia'], 1.68, 16.53);
    expect(yuna['isaaru']).toBeCloseTo(1.68 * (18.68 / 16.53), 3);
    expect(yuna['grothia']).toBeCloseTo(1.68 * (31.198 / 16.53), 3);
    expect(TIDUS_TOP).toBe(18.15);
  });

  it("Chapter IX stands Yojimbo, Daigoro and Lady Ginnem at their real heights over the party's 1.75 (Tidus's)", () => {
    expect(CAVERN_ACTOR_HEIGHTS.party).toBe(1.75);
    expect(CAVERN_ACTOR_HEIGHTS.yojimbo).toBe(2.613);
    expect(CAVERN_ACTOR_HEIGHTS.daigoro).toBe(0.769);
    expect(CAVERN_ACTOR_HEIGHTS.ginnem).toBe(1.67);
    expect(CAVERN_STOLEN_FAYTH_SLOTS.figureHeights).toEqual({ yojimbo: 2.613, daigoro: 0.769, ginnem: 1.67 });
    // Yojimbo 1.49 over Tidus; the old estimate was 1.457 (2.55 over 1.75)
    expect(CAVERN_ACTOR_HEIGHTS.yojimbo / CAVERN_ACTOR_HEIGHTS.party).toBeCloseTo(fiendOverTidus('yojimbo'), 2);
  });
});

describe("Chapter XIV stands Isaaru at his real height over Yuna's own, and keeps the aeons where they were", () => {
  it("Isaaru is 18.68 over Yuna's 16.53 (1.13) times her 1.68: 1.899; the aeons stay at 3.2 on both sides (Grothia's table height 3.17 agrees; Pterya's and Spathi's default-pose wings are not applied)", () => {
    expect(VIA_ACTOR_HEIGHTS.yuna).toBe(1.68);
    expect(VIA_ACTOR_HEIGHTS.isaaru).toBe(1.899);
    expect(VIA_ACTOR_HEIGHTS.isaaru / VIA_ACTOR_HEIGHTS.yuna).toBeCloseTo(18.68 / 16.53, 2);
    expect(VIA_ACTOR_HEIGHTS.aeon).toBe(3.2);
    expect(VIA_PURIFICO_SLOTS.figureHeights?.['isaaru']).toBe(1.899);
    for (const id of ['grothia', 'pterya', 'spathi']) expect(VIA_PURIFICO_SLOTS.figureHeights?.[id], id).toBeUndefined(); // the stage's boss rule: 3.2
    expect(VIA_PURIFICO_SLOTS.enemyHeight).toBe(3.2);
    expect(Math.abs(fiendFigureHeights(['grothia'], 1.68, 16.53)['grothia']! - 3.2) / 3.2).toBeLessThan(0.01);
  });

  it("he stands where release 39.4.1 stood him (3.7, -0.2; Bailey's \"Yes, original spacing\", r3942-stage keeps only the real height), right of his aeon and in front of it", () => {
    expect(VIA_ISAARU_SPOT).toEqual([3.7, 0, -0.2]);
    expect(VIA_PURIFICO_SLOTS.enemySpots?.['isaaru']).toEqual(VIA_ISAARU_SPOT);
    expect(VIA_ISAARU_SPOT[2] - VIA_AEON_SPOT[2]).toBeGreaterThanOrEqual(3);
  });
});

describe('the table is pure data, cites its research and says how sure it is', () => {
  const src = read('src/data/ffx/fiend-stature.ts');

  it('imports nothing but the party table, and no DOM or three', () => {
    const imports = [...src.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]);
    expect(imports).toEqual(['./party-stature.ts']);
    expect(src).not.toMatch(/document\.|window\.|from 'three'/);
  });

  it('carries the datamined tag and points at the two research sections', () => {
    expect(src).toContain('[datamined: FFX HD Remaster build 25501027');
    expect(src).toContain('research/ffx-yojimbo.md');
    expect(src).toContain('research/ffx-isaaru-bevelle.md');
    expect(read('research/ffx-yojimbo.md')).toMatch(/## 12\. Research addendum \(2026-10-08\): how tall Yojimbo, Daigoro and Lady Ginnem really stand/);
    expect(read('research/ffx-yojimbo.md')).toContain('[datamined: FFX HD Remaster build 25501027, bind pose, one reader]');
  });
});
