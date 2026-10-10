/**
 * **FFX-2 fiend stature (FFX-2 only, Chapters XI, XIII, XV and XVI; branch r3942-stage, wave 1).**
 *
 * `src/data/ffx2/fiend-stature.ts` is sourced data: the default-pose heights of the FFX-2 HD Remaster's models, raw mesh height times the engine scale `C`, over the girls'
 * mean in each chapter (`research/ffx2-fallen-aeons.md` §12, `research/ffx2-trema.md` §14, `research/ffx2-gippal-den-of-woe.md` §12, `research/ffx2-ixion-djose.md` §12). These
 * tests pin the arithmetic (`raw x C`), the ratios the build was asked for (Shiva 1.94, Ixion 1.78, Trema 1.02, the shades 1.09 / 1.09 / 1.18, the Sisters 1.29 / 0.83 / 0.71;
 * wave 2, the giants: Bahamut 5.03, Paragon 5.40, Anima 7.71), the giants' picks (Bailey, 2026-10-08: real size on a desktop for Bahamut and Paragon, 0.7 of it for Anima and on
 * the phone) and the heights they stand at, that Vegnagun's parts are not in the table, and that the module stays pure data.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FFX2_FIEND_STATURE, FFX2_GIANT_SHARE, FFX2_GIRLS_MEAN, ffx2FiendFigureHeights, ffx2GiantHeight, fiendOverGirls } from '../../src/data/ffx2/fiend-stature.ts';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string): string => readFileSync(join(here, '../..', rel), 'utf8');

describe('the table is raw mesh height times the engine scale', () => {
  it('every row: height = raw x C to a hundredth, C is 4 for an aeon or a summoned beast and 1 for a human-sized monster', () => {
    for (const [id, row] of Object.entries(FFX2_FIEND_STATURE)) {
      expect(row.height, id).toBeCloseTo(row.raw * row.scale, 2);
      expect([1, 4], id).toContain(row.scale);
    }
    for (const id of ['x2-shiva', 'x2-ixion', 'sandy', 'cindy', 'mindy', 'bahamut', 'paragon', 'x2-anima']) expect(FFX2_FIEND_STATURE[id]!.scale, id).toBe(4);
    for (const id of ['trema', 'shade-gippal', 'shade-baralai', 'shade-nooj']) expect(FFX2_FIEND_STATURE[id]!.scale, id).toBe(1);
  });

  it('names the models the game gives these fiends (the model number is the monster id)', () => {
    const models = Object.fromEntries(Object.entries(FFX2_FIEND_STATURE).map(([id, r]) => [id, r.model]));
    expect(models).toEqual({
      'x2-shiva': 'm167',
      sandy: 'm172',
      cindy: 'm171',
      mindy: 'm173',
      trema: 'm295',
      'shade-gippal': 'm177',
      'shade-baralai': 'm176',
      'shade-nooj': 'm258',
      'x2-ixion': 'm166',
      bahamut: 'm168',
      paragon: 'm152',
      'x2-anima': 'm169',
    });
  });

  it("holds Vegnagun's parts nowhere (one union mesh, low confidence: they keep the approved staging of `scenes/farplane-colossus.ts`), nor a painted id", () => {
    for (const id of ['vegnagun', 'vegnagun-tail', 'vegnagun-leg', 'vegnagun-body', 'vegnagun-head', 'ffx2-bahamut', 'oversoul']) {
      expect(FFX2_FIEND_STATURE[id], id).toBeUndefined();
    }
  });
});

describe("over the girls' mean in the chapter's own party, the ratios the build was asked for", () => {
  it('the means: 17.73 for Chapters XI, XV and XVI (White Mage, Dark Knight, Dark Knight), 17.47 for Chapter XIII (Dark Knight, Alchemist, Dark Knight)', () => {
    expect(FFX2_GIRLS_MEAN['ffx2-fallen-aeons']).toBeCloseTo((16.77 + 18.54 + 17.87) / 3, 3);
    expect(FFX2_GIRLS_MEAN['ffx2-den-of-woe']).toBe(FFX2_GIRLS_MEAN['ffx2-fallen-aeons']);
    expect(FFX2_GIRLS_MEAN['ffx2-ixion-djose']).toBe(FFX2_GIRLS_MEAN['ffx2-fallen-aeons']);
    expect(FFX2_GIRLS_MEAN['ffx2-trema']).toBeCloseTo((17.07 + 17.46 + 17.87) / 3, 3);
    expect(FFX2_GIRLS_MEAN['ffx2-bahamut']).toBeCloseTo((16.77 + 18.54 + 17.13) / 3, 2); // Chapter IV: White Mage Yuna, Dark Knight Rikku, Warrior Paine
  });

  it('Shiva 1.94, Sandy 1.29, Cindy 0.83 and Mindy 0.71 (Chapter XI); Ixion 1.78 (XVI); Trema 1.02 (XIII); the shades 1.09, 1.09 and 1.18 (XV)', () => {
    expect(fiendOverGirls('x2-shiva', 'ffx2-fallen-aeons')).toBeCloseTo(1.94, 2);
    expect(fiendOverGirls('sandy', 'ffx2-fallen-aeons')).toBeCloseTo(1.29, 2);
    expect(fiendOverGirls('cindy', 'ffx2-fallen-aeons')).toBeCloseTo(0.83, 2);
    expect(fiendOverGirls('mindy', 'ffx2-fallen-aeons')).toBeCloseTo(0.71, 2);
    expect(fiendOverGirls('x2-ixion', 'ffx2-ixion-djose')).toBeCloseTo(1.78, 2);
    expect(fiendOverGirls('trema', 'ffx2-trema')).toBeCloseTo(1.02, 2);
    // the lane's table reads 19.4 / 19.4 / 20.9 over 17.73 (1.09 / 1.09 / 1.18); the measured 19.414 / 19.349 / 20.913 land within 0.01 of those
    expect(Math.abs(fiendOverGirls('shade-gippal', 'ffx2-den-of-woe') - 1.09)).toBeLessThan(0.01);
    expect(Math.abs(fiendOverGirls('shade-baralai', 'ffx2-den-of-woe') - 1.09)).toBeLessThan(0.01);
    expect(Math.abs(fiendOverGirls('shade-nooj', 'ffx2-den-of-woe') - 1.18)).toBeLessThan(0.01);
    expect(fiendOverGirls('not-a-fiend', 'ffx2-trema')).toBe(1);
    expect(fiendOverGirls('trema', 'not-a-chapter')).toBe(1);
  });

  it("ffx2FiendFigureHeights is the girls' height times the ratio, to the millimetre, and skips an id it does not know", () => {
    expect(ffx2FiendFigureHeights(['x2-shiva', 'sandy', 'cindy', 'mindy', 'not-a-fiend'], 'ffx2-fallen-aeons', 1.78)).toEqual({ 'x2-shiva': 3.453, sandy: 2.297, cindy: 1.48, mindy: 1.26 });
  });
});

describe('the giants (wave 2): real height over the girls, and what Bailey picked', () => {
  it("Bahamut 5.03 over Chapter IV's girls, Paragon 5.40 over Chapter XIII's, Anima 7.71 over Chapter XI's", () => {
    expect(fiendOverGirls('bahamut', 'ffx2-bahamut')).toBeCloseTo(5.03, 2);
    expect(fiendOverGirls('paragon', 'ffx2-trema')).toBeCloseTo(5.4, 2);
    expect(fiendOverGirls('x2-anima', 'ffx2-fallen-aeons')).toBeCloseTo(7.71, 2);
  });

  it('the picks: Bahamut and Paragon real on a desktop and 0.7 on the phone, Anima 0.7 on both', () => {
    expect(FFX2_GIANT_SHARE).toEqual({ bahamut: { desktop: 1, phone: 0.7 }, paragon: { desktop: 1, phone: 0.7 }, 'x2-anima': { desktop: 0.7, phone: 0.7 } });
  });

  it('the heights they stand at, to the millimetre, over the girls of each room (1.82, 1.75, 1.78)', () => {
    expect(ffx2GiantHeight('bahamut', 'ffx2-bahamut', 1.82, false)).toBeCloseTo(9.147, 3);
    expect(ffx2GiantHeight('bahamut', 'ffx2-bahamut', 1.82, true)).toBeCloseTo(6.403, 3);
    expect(ffx2GiantHeight('paragon', 'ffx2-trema', 1.75, false)).toBeCloseTo(9.447, 3);
    expect(ffx2GiantHeight('paragon', 'ffx2-trema', 1.75, true)).toBeCloseTo(6.613, 3);
    expect(ffx2GiantHeight('x2-anima', 'ffx2-fallen-aeons', 1.78, false)).toBeCloseTo(9.6, 2);
    expect(ffx2GiantHeight('x2-anima', 'ffx2-fallen-aeons', 1.78, true)).toBeCloseTo(9.6, 2);
  });

  it("Bahamut's phone height is 0.7 of his real one, also his idle-bone height (58 of 87.8, 0.66) to within 6 percent", () => {
    expect(ffx2GiantHeight('bahamut', 'ffx2-bahamut', 1.82, true)! / ffx2GiantHeight('bahamut', 'ffx2-bahamut', 1.82, false)!).toBeCloseTo(0.7, 3);
    expect(Math.abs(0.7 - 58 / 87.8) / 0.7).toBeLessThan(0.06);
  });

  it('says nothing for a combatant that is no giant of the table', () => {
    expect(ffx2GiantHeight('trema', 'ffx2-trema', 1.75, false)).toBeNull();
    expect(ffx2GiantHeight('vegnagun-body', 'ffx2-fallen-aeons', 1.78, true)).toBeNull();
    expect(ffx2GiantHeight('bahamut', 'not-a-chapter', 1.82, false)).toBeNull();
  });
});

describe('the table is pure data, cites its research and says how sure it is', () => {
  const src = read('src/data/ffx2/fiend-stature.ts');

  it('imports nothing, and no DOM or three', () => {
    expect([...src.matchAll(/^import .* from '(.+)';$/gm)]).toHaveLength(0);
    expect(src).not.toMatch(/document\.|window\.|from 'three'/);
  });

  it('carries the single-source tag and points at the four research sections', () => {
    expect(src).toContain('[single source: own measurement]');
    for (const f of ['ffx2-bahamut', 'ffx2-fallen-aeons', 'ffx2-trema', 'ffx2-gippal-den-of-woe', 'ffx2-ixion-djose']) expect(src).toContain(f);
    expect(read('research/ffx2-fallen-aeons.md')).toMatch(/## 12\. Research addendum \(2026-10-08\): how tall Shiva and the Magus Sisters really stand/);
    expect(read('research/ffx2-fallen-aeons.md')).toContain('[single source: own measurement]');
    expect(read('research/ffx2-bahamut.md')).toMatch(/## 9\. Research addendum \(2026-10-08\): how tall Bahamut really stands/);
    expect(read('research/ffx2-fallen-aeons.md')).toMatch(/## 13\. Research addendum \(2026-10-08\): how tall Anima really stands/);
    expect(read('research/ffx2-trema.md')).toMatch(/## 15\. Research addendum \(2026-10-08\): how tall Paragon and Oversoul really stand/);
  });
});
