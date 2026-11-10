/**
 * Gullwings, Chapter 1: the chapter record, pinned (the second half of `./gullwings-ch1-data.test.ts`, split out on review 2026-11-09 to keep each file under 400 lines, hard rule 7). **FFX-2 only** [AGENTS.md rule 14].
 *
 * 1. **The chain**: four links in the hotspot order, links 2 to 4 restoring the party with no Save Sphere card.
 * 2. **The party**: the new Chapter 1 build (an estimate: Lv 12 / 13 / 14) and the three starting dresspheres plus the Songstress, Black Mage and White Mage.
 * 3. **The stat table below Lv 20** (T0 finding): the fallback ran the wrong way below its first anchor.
 * 4. **The registry place**: hidden (neither CHAPTERS nor CHAPTER_IDS), number 51, the Sensor texts, the pause metadata, the guide pair and the tactic.
 */
import { describe, expect, it } from 'vitest';

import { dressphereStats } from '../../../src/battle/ffx2/dressphere-stats.ts';
import { gullwingsCh1Build } from '../../../src/data/ffx2/builds/gullwings-ch1.ts';
import { borisGroup, gullwingsCh1Groups, x2Boris, x2FlameDragon, x2GuardianBeast, x2YslsZero } from '../../../src/data/ffx2/enemies/gullwings-ch1.ts';
import * as ids from '../../../src/data/gullwings-ch1-ids.ts';
import { FFX2_GULLWINGS_CH1, GULLWINGS_CH1_ID } from '../../../src/data/chapter-ffx2-gullwings-ch1.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { GULLWINGS_CH1_GUIDE_IDS } from '../../../src/data/guides/ffx2-gullwings-ch1.ts';
import { GULLWINGS_CH1_BOSS_IDS } from '../../../src/engine/tactics/ffx2-gullwings-ch1.ts';

describe('the group chain, the party and the chapter', () => {
  it('four links in the hotspot order, each by `nextGroupId`; links 2 to 4 restore the party and show no Save Sphere card; the last has no next', () => {
    expect(gullwingsCh1Groups.map((g) => g.id)).toEqual([...ids.GULLWINGS_CH1_GROUP_IDS]);
    expect(gullwingsCh1Groups.map((g) => g.nextGroupId)).toEqual([ids.FLAME_DRAGON_GROUP_ID, ids.GUARDIAN_BEAST_GROUP_ID, ids.YSLS_ZERO_GROUP_ID, undefined]);
    expect(gullwingsCh1Groups.map((g) => g.restoresPartyOnEntry === true)).toEqual([false, true, true, true]);
    expect(gullwingsCh1Groups.map((g) => g.noSaveSphereCard === true)).toEqual([false, true, true, true]);
  });

  it('the party is the new Chapter 1 build: Yuna a Gunner, Rikku a Thief, Paine a Warrior at Lv 12 / 13 / 14 (an estimate), the Songstress, Black Mage and White Mage owned, no Lady Luck, Samurai, Gun Mage, Alchemist, Berserker or Trainer, the First Steps grid, no accessory', () => {
    expect(gullwingsCh1Build.members.map((m) => [m.id, m.level, m.currentDressphere])).toEqual([['yuna', 12, 'gunner'], ['rikku', 13, 'thief'], ['paine', 14, 'warrior']]);
    for (const m of gullwingsCh1Build.members) {
      expect([...m.owned].sort(), m.id).toEqual(['black-mage', 'gunner', 'songstress', 'thief', 'warrior', 'white-mage']);
      expect(m.garmentGrid.id).toBe('first-steps');
      expect(m.accessories).toEqual([]);
    }
    // The Black Mage (or the White Mage) is one link from Rikku's and Paine's nodes and both are one link from Yuna's: the roles the tactic asks for are rows the menu offers.
    expect(gullwingsCh1Build.members[0]!.owned.slice(0, 2)).toEqual(['gunner', 'white-mage']);
    expect(gullwingsCh1Build.members[0]!.owned.at(-1)).toBe('black-mage');
    expect(gullwingsCh1Build.inventory.map((i) => i.itemId)).toEqual(expect.arrayContaining(['x2-phoenix-down', 'x2-remedy', 'x2-holy-water', 'x2-hi-potion', 'x2-potion']));
  });

  it('T0 finding: the fallback stat table runs DOWN the first segment below its first anchor, so a Lv 12 Gunner is smaller than a Lv 20 one (it was 1,035 HP against 862 before this chapter: the last segment was used)', () => {
    for (const sphere of ['gunner', 'thief', 'warrior', 'black-mage', 'white-mage', 'songstress', 'dark-knight']) {
      let last = dressphereStats(sphere, 20);
      for (const level of [19, 16, 12, 8, 4]) {
        const now = dressphereStats(sphere, level);
        expect(now.maxHp, `${sphere} Lv ${level} HP under Lv ${level + 1}'s`).toBeLessThan(last.maxHp);
        expect(now.str, `${sphere} Lv ${level} STR`).toBeLessThanOrEqual(last.str);
        last = now;
      }
    }
    expect(dressphereStats('gunner', 20).maxHp).toBe(862); // the anchor is untouched
    expect(dressphereStats('gunner', 12).maxHp).toBeGreaterThan(500);
    expect(dressphereStats('gunner', 12).maxHp).toBeLessThan(620);
  });

  it('is hidden: in neither CHAPTERS nor CHAPTER_IDS, found by getChapter, number 51, experimental, FFX-2, on the Zanarkand Dome\'s plate as the flagged stand-in, on the flagged stand-in cue', () => {
    expect(GULLWINGS_CH1_ID).toBe('ffx2-gullwings-ch1');
    expect(getChapter(GULLWINGS_CH1_ID)).toBe(FFX2_GULLWINGS_CH1);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_GULLWINGS_CH1);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(GULLWINGS_CH1_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(GULLWINGS_CH1_ID)).toBe(false);
    expect(FFX2_GULLWINGS_CH1).toMatchObject({ game: 'ffx2', number: 51, experimental: true, sceneKey: 'zanarkand-dome', title: 'Gullwings, Chapter 1' });
    expect(FFX2_GULLWINGS_CH1.buildRef).toBe(gullwingsCh1Build);
    expect(FFX2_GULLWINGS_CH1.enemyGroupRef).toBe(borisGroup);
    expect(FFX2_GULLWINGS_CH1.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-ffx2-fallen-aeons', victory: 'victory-ffx2' });
    for (const e of [x2Boris, x2FlameDragon, x2GuardianBeast, x2YslsZero]) expect(FFX2_GULLWINGS_CH1.sensorTexts[e.id]).toBe(e.sensorText);
  });

  it('the pause metadata exists, says EXP, has exactly three objectives (act 3 reached, act 4 reached, the win) and a tip that fits the prep card', () => {
    const meta = getChapterMeta(GULLWINGS_CH1_ID);
    expect(meta).toBeDefined();
    expect(meta).toMatchObject({ gameLabel: 'FFX-2', numeral: 'EXP', title: 'Gullwings, Chapter 1', focalCharacterId: 'paine' });
    expect(meta!.objectives.map((o) => o.rule)).toEqual([{ kind: 'link-reached', link: 3 }, { kind: 'link-reached', link: 4 }, { kind: 'victory' }]);
    expect(meta!.musicKeys).toEqual(['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2']);
    expect(meta!.tip!.length).toBeLessThanOrEqual(150);
  });

  it('the guide card and its page are registered under the chapter id for all four ids, and the tactic names the same four fighters', () => {
    const guide = guideForChapter(GULLWINGS_CH1_ID);
    expect(guide).toBeDefined();
    expect(guide!.bossIds).toEqual([...ids.GULLWINGS_CH1_BODY_IDS]);
    expect([...GULLWINGS_CH1_GUIDE_IDS]).toEqual([...ids.GULLWINGS_CH1_BODY_IDS]);
    expect([...GULLWINGS_CH1_BOSS_IDS]).toEqual([...ids.GULLWINGS_CH1_BODY_IDS]);
    expect(docForChapter(GULLWINGS_CH1_ID)).toMatchObject({ game: 'ffx2', bossIds: [...ids.GULLWINGS_CH1_BODY_IDS] });
    expect(GUIDES.filter((g) => g.id === GULLWINGS_CH1_ID)).toHaveLength(1);
  });
});
