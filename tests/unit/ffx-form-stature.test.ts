// @vitest-environment jsdom
/**
 * **Lady Yunalesca's first form at Bailey's pick (FFX only, Chapter II; branch r3943-int).**
 *
 * `src/data/ffx/form-stature.ts` `FFX_FORM_STATURE` holds what the live PS2 game draws of Yunalesca's first form (the silhouette read in PCSX2 by the sizes lane, `research/ffx-yunalesca.md`
 * section 18) and Bailey's pick of 2026-10-09 14:10 EDT ("go with 3 for Yunalesca", picture 3 of the giants options study, WING TIPS). Her painting swaps with the form, so the height is **per form**,
 * keyed by the art id the stage draws; these tests pin the row and its arithmetic, that the scene names it for the first painting only, that her spot is the one she stood on, and that no other
 * scene names a per-form height.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Yunalesca is Chapter II of the FFX list; FFX-2 has no such fiend and nothing here is read by an FFX-2 chapter.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FFX_GIANT_STATURE } from '../../src/data/ffx/fiend-stature.ts';
import { FFX_FORM_STATURE, formFigureHeights, formHeight } from '../../src/data/ffx/form-stature.ts';
import { FFX_PARTY_STATURE, TIDUS_TOP } from '../../src/data/ffx/party-stature.ts';
import { formPlanScale, sceneOwnHeight } from '../../src/engine/PartyStature.ts';
import { ZANARKAND_DOME_SLOTS } from '../../src/scenes/zanarkand-dome.ts';
import { ZANARKAND_FORM_HEIGHTS, ZANARKAND_PARTY_HEIGHT } from '../../src/scenes/zanarkand-dome-giants.ts';
import { stagingOf } from '../../src/scenes/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string): string => readFileSync(join(here, '../..', rel), 'utf8');

describe('the row: what the live game draws of her first form, and the pick', () => {
  const row = FFX_FORM_STATURE['yunalesca-1']!;

  it('is the sizes lane\'s read: m130, wing tips to sole 25.7 (crest 20.6, the woman alone 17.9), static law 116 (the union of all three forms), E 18, medium-high', () => {
    expect(row.model).toBe('m130');
    expect(row.height).toBe(25.7);
    expect(row.reads).toEqual({ woman: 17.9, crest: 20.6, wingTips: 25.7 });
    expect(row.staticLaw).toBe(116);
    expect(row.engine).toBe(18);
    expect(row.confidence).toBe('medium-high');
  });

  it("Bailey's pick is the wing tips: the height is the largest of the three readings and the share is 1", () => {
    expect(row.height).toBe(row.reads.wingTips);
    expect(row.reads.woman).toBeLessThan(row.reads.crest);
    expect(row.reads.crest).toBeLessThan(row.reads.wingTips);
    expect(row.share).toBe(1);
  });

  it('is her first form alone: the second and the third have no row (the third waits for a measurement), and the giants table does not hold her', () => {
    expect(Object.keys(FFX_FORM_STATURE)).toEqual(['yunalesca-1']);
    expect(FFX_FORM_STATURE['yunalesca-2']).toBeUndefined();
    expect(FFX_FORM_STATURE['yunalesca-3']).toBeUndefined();
    expect(FFX_GIANT_STATURE['yunalesca']).toBeUndefined();
    expect(Object.keys(FFX_GIANT_STATURE).some((k) => k.startsWith('yunalesca'))).toBe(false);
  });
});

describe('the arithmetic: partyHeight x height x share / Tidus 18.15, to the millimetre', () => {
  it('stands her at 2.577 units on the stage whose Tidus is 1.82 (from 4.1), the 2.58 of the options study', () => {
    expect(formHeight('yunalesca-1', 1.82)).toBe(2.577);
    expect(formHeight('yunalesca-1', 1.82)).toBe(Math.round(((1.82 * 25.7) / TIDUS_TOP) * 1000) / 1000);
  });

  it('is the model\'s own ratio over this chapter\'s party at one distance: 1.43 over the mean of Tidus, Yuna and Auron (the study\'s 25.7 over 17.99)', () => {
    const party = ['tidus', 'yuna', 'auron'].map((id) => 1.82 * FFX_PARTY_STATURE[id as 'tidus' | 'yuna' | 'auron'].ratio);
    const mean = party.reduce((s, h) => s + h, 0) / party.length;
    expect(formHeight('yunalesca-1', 1.82)! / mean).toBeCloseTo(1.43, 2);
  });

  it('scales with the party height it is read against, and knows nothing about any other painting', () => {
    expect(formHeight('yunalesca-1', 1.78)).toBeCloseTo(2.52, 2);
    for (const id of ['yunalesca-2', 'yunalesca-3', 'yunalesca', 'braskas-final-aeon-1', 'seymour-flux', '']) expect(formHeight(id, 1.82), id).toBeUndefined();
  });

  it('builds a SceneStaging.formHeights table for the forms named, leaving out any it does not know', () => {
    expect(formFigureHeights(['yunalesca-1', 'yunalesca-2', 'yunalesca-3'], 1.82)).toEqual({ 'yunalesca-1': 2.577 });
    expect(formFigureHeights([], 1.82)).toEqual({});
  });
});

describe('the scene: Chapter II names the first painting and nothing else', () => {
  it("reads the party height the stage stands Tidus at (1.82: this scene's SceneBuild publishes none) and names 2.577 for 'yunalesca-1' alone", () => {
    expect(ZANARKAND_PARTY_HEIGHT).toBe(1.82);
    expect(ZANARKAND_FORM_HEIGHTS).toEqual({ 'yunalesca-1': 2.577 });
  });

  it('puts it in the scene staging, and `stagingOf` carries it to the stage', () => {
    expect(ZANARKAND_DOME_SLOTS.formHeights).toBe(ZANARKAND_FORM_HEIGHTS);
    expect(stagingOf(ZANARKAND_DOME_SLOTS).formHeights).toEqual({ 'yunalesca-1': 2.577 });
    expect(stagingOf({}).formHeights).toBeUndefined();
  });

  it('leaves her spot as it was: the pin (2.8, 0, -4.0) and the held party, no per-combatant height', () => {
    expect(ZANARKAND_DOME_SLOTS.enemySpots).toEqual({ yunalesca: [2.8, 0, -4.0] });
    expect(ZANARKAND_DOME_SLOTS.holdParty).toBe(true);
    expect(ZANARKAND_DOME_SLOTS.figureHeights).toBeUndefined();
  });

  it('is the only scene that names a per-form height: no other file under src/scenes mentions `formHeights` but the contract and the scene (its data file names it `ZANARKAND_FORM_HEIGHTS`)', () => {
    const named = readdirSync(join(here, '../../src/scenes'))
      .filter((f) => f.endsWith('.ts'))
      .filter((f) => /formHeights/.test(read(`src/scenes/${f}`)))
      .sort();
    expect(named).toEqual(['types.ts', 'zanarkand-dome.ts']);
  });
});

describe('the stage rule: a per-combatant height wins, then the form, then the stage\'s own', () => {
  const slots = { figureHeights: { daigoro: 0.8 }, formHeights: { 'yunalesca-1': 2.577 } };

  it('hands back the form\'s height for her first painting and nothing for her others', () => {
    expect(sceneOwnHeight(slots, 'yunalesca', 'yunalesca-1')).toBe(2.577);
    expect(sceneOwnHeight(slots, 'yunalesca', 'yunalesca-2')).toBeUndefined();
    expect(sceneOwnHeight(slots, 'yunalesca', 'yunalesca-3')).toBeUndefined();
  });

  it('a per-combatant height is the figure\'s own and wins where both name one; a scene that names neither leaves the stage\'s rule', () => {
    expect(sceneOwnHeight({ ...slots, figureHeights: { yunalesca: 3.3 } }, 'yunalesca', 'yunalesca-1')).toBe(3.3);
    expect(sceneOwnHeight(slots, 'daigoro', 'daigoro')).toBe(0.8);
    expect(sceneOwnHeight({}, 'yunalesca', 'yunalesca-1')).toBeUndefined();
  });
});

describe('the framing keeps planning her at the shared height: the factor the stage records on her actor', () => {
  const slots = { figureHeights: { daigoro: 0.8 }, formHeights: { 'yunalesca-1': 2.577 } };

  it('is her form height over the shared one for her first painting, so the camera is planned as if she stood at 4.1 (today camera)', () => {
    expect(formPlanScale(slots, 'yunalesca', 'yunalesca-1', 4.1)).toBeCloseTo(2.577 / 4.1, 12);
  });

  it('is 1 for every other painting, for a height named by id or handed by a director, and for a scene that names no form', () => {
    expect(formPlanScale(slots, 'yunalesca', 'yunalesca-2', 4.1)).toBe(1);
    expect(formPlanScale(slots, 'yunalesca', 'yunalesca-3', 4.1)).toBe(1);
    expect(formPlanScale({ ...slots, figureHeights: { yunalesca: 3.3 } }, 'yunalesca', 'yunalesca-1', 4.1)).toBe(1);
    expect(formPlanScale(slots, 'yunalesca', 'yunalesca-1', 4.1, 2.5)).toBe(1);
    expect(formPlanScale({}, 'yunalesca', 'yunalesca-1', 4.1)).toBe(1);
  });
});
