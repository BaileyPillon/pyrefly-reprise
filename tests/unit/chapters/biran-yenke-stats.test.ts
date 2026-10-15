/**
 * Biran and Yenke Ronso (the hidden FFX chapter): the brothers' stats are derived from Kimahri's at the battle's start by one pure function (`research/re-ffx-biran-yenke.md` section 3, "RE section 3").
 * Pinned here: the note's integer arithmetic and its four worked examples, the two tables, the index rule, the later "x5/4", the engine's one clamp, and the application at the battle's start on the real engine.
 * **FFX only.**
 */
import { describe, expect, it } from 'vitest';

import {
  BIRAN_STR_BY_K,
  BROTHER_MDEF,
  YENKE_MAG_BY_K,
  fiveQuarters,
  hpUnit,
  ronsoStatsFromKimahri,
  tableIndex,
} from '../../../src/battle/ffx/ai/biran-yenke-stats.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import { kimahriTrialBuild } from '../../../src/data/ffx/builds/kimahri-trial.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { BIRAN, YENKE, actor, flags, newEngine } from '../helpers/ronsoDrive.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

describe("the note's worked examples (RE section 3), from Kimahri's STR and MAG", () => {
  it.each([
    // [STR, MAG, U, Biran HP, Yenke HP]
    [30, 20, 492, 3_936, 2_952],
    [40, 20, 987, 7_896, 5_922], // the driver's example
    [50, 25, 1_904, 15_232, 11_424],
    [60, 30, 3_275, 26_200, 19_650],
  ])('Kimahri STR %i and MAG %i gives U %i, Biran %i HP and Yenke %i HP', (str, mag, u, biranHp, yenkeHp) => {
    expect(hpUnit(str, mag)).toBe(u);
    const out = ronsoStatsFromKimahri({ str, mag, agi: 20, hp: 3_000 });
    expect(out.u).toBe(u);
    expect(out.biran.hp).toBe(biranHp); // 8 units
    expect(out.yenke.hp).toBe(yenkeHp); // 6 units
  });

  it('is integer arithmetic, truncating at every division (STR 40 and MAG 20: A 64,000, B 8,000, C 38,400, C/32 1,200, 1,230 x 586 / 730 = 987.37)', () => {
    expect(hpUnit(40, 20)).toBe(987);
    expect(Number.isInteger(hpUnit(26, 22))).toBe(true);
    expect(hpUnit(26, 22)).toBe(401); // Chapter I's Kimahri: A 17,576, B 10,648, C 15,052, C/32 470, 500 x 586 / 730 = 401.37
  });
});

describe('the tables and the index rule (RE section 3, step 3)', () => {
  it("pins the two tables to the note's rows", () => {
    expect(BIRAN_STR_BY_K).toEqual([11, 12, 13, 15, 17, 19, 21, 22, 23, 24, 25, 27]);
    expect(YENKE_MAG_BY_K).toEqual([8, 8, 9, 10, 12, 14, 16, 17, 19, 20, 21, 22]);
    expect(BROTHER_MDEF).toBe(50);
  });

  it('k is (HP - 644) / 200 while HP is above 644, else 0, and 11 or more reads the last column', () => {
    expect([100, 644, 645, 843].map(tableIndex)).toEqual([0, 0, 0, 0]);
    expect([844, 1_043].map(tableIndex)).toEqual([1, 1]);
    expect(tableIndex(2_310)).toBe(8); // Chapter I's Kimahri: (2,310 - 644) / 200 = 8.33
    expect(tableIndex(2_643)).toBe(9);
    expect(tableIndex(2_644)).toBe(10);
    expect(tableIndex(2_844)).toBe(11);
    expect(tableIndex(99_999)).toBe(11);
  });

  it("sets Biran's STR and Yenke's MAG from the table, then Biran's MAG as half Yenke's and Yenke's STR as half Biran's, and both MDF to 50", () => {
    for (let k = 0; k < 12; k++) {
      const out = ronsoStatsFromKimahri({ str: 26, mag: 22, agi: 18, hp: 644 + 200 * k + (k === 0 ? 0 : 5) });
      expect(out.k).toBe(k);
      expect(out.biran.str).toBe(BIRAN_STR_BY_K[k]);
      expect(out.yenke.mag).toBe(YENKE_MAG_BY_K[k]);
      expect(out.biran.mag).toBe(Math.trunc(YENKE_MAG_BY_K[k]! / 2));
      expect(out.yenke.str).toBe(Math.trunc(BIRAN_STR_BY_K[k]! / 2));
      expect(out.biran.mdef).toBe(50);
      expect(out.yenke.mdef).toBe(50);
    }
  });

  it("makes Biran's AGI Kimahri's minus 4 and Yenke's minus 8, never below 1 (the engine's own clamp)", () => {
    const out = ronsoStatsFromKimahri({ str: 26, mag: 22, agi: 18, hp: 2_310 });
    expect([out.biran.agi, out.yenke.agi]).toEqual([14, 10]);
    const weak = ronsoStatsFromKimahri({ str: 10, mag: 10, agi: 5, hp: 500 });
    expect([weak.biran.agi, weak.yenke.agi]).toEqual([1, 1]);
  });
});

describe('the survivor\'s "x5/4" (RE section 5.4): floor(x / 4) x 5', () => {
  it('lowers STR 11 to 10, leaves 15 unchanged, raises 17 to 20 and 27 to 30 (the note\'s own examples)', () => {
    expect([11, 15, 17, 27].map(fiveQuarters)).toEqual([10, 15, 20, 30]);
  });
});

describe("the opening on the real engine: Chapter I's Kimahri, and any other", () => {
  it("writes the derived numbers onto both brothers: Kimahri STR 26, MAG 22, AGI 18, HP 2,310 give Biran 3,208 HP and Yenke 2,406", () => {
    const k = gagazetBuild.members.find((m) => m.id === 'kimahri')!;
    expect([k.stats.str, k.stats.mag, k.stats.agi, k.hp]).toEqual([26, 22, 18, 2_310]); // the preset the chapter uses, said so in the data
    const e = newEngine(1);
    expect(actor(e, BIRAN)).toMatchObject({ hp: 3_208, stats: { hp: 3_208, maxHp: 3_208, str: 23, mag: 9, agi: 14, mdef: 50, def: 30, luck: 15, eva: 0, acc: 100, mp: 200 } });
    expect(actor(e, YENKE)).toMatchObject({ hp: 2_406, stats: { hp: 2_406, maxHp: 2_406, str: 11, mag: 19, agi: 10, mdef: 50, def: 30, luck: 15, eva: 0, acc: 100, mp: 200 } });
    expect(actor(e, BIRAN).enemy?.forms[0]?.hp).toBe(3_208);
  });

  it('reads Kimahri at the battle\'s start, so the note\'s example is the engine\'s: STR 40 and MAG 20 give Biran 7,896 and Yenke 5,922', () => {
    const strong = structuredClone(kimahriTrialBuild);
    const k = strong.members[0]!;
    k.stats.str = 40;
    k.stats.mag = 20;
    const e = newEngine(1, strong);
    expect(actor(e, BIRAN).hp).toBe(7_896);
    expect(actor(e, YENKE).hp).toBe(5_922);
    // Kimahri's current HP is the other input: hurt, he meets weaker brothers (k falls with his HP).
    const hurt = structuredClone(kimahriTrialBuild);
    hurt.members[0]!.hp = 700;
    const h = newEngine(1, hurt);
    expect([actor(h, BIRAN).stats.str, actor(h, YENKE).stats.mag]).toEqual([11, 8]); // k = 0
  });

  it("is inert in every other battle: it needs both brothers and Kimahri (Seymour Flux's numbers are exactly the data's)", () => {
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    const group = ENEMY_GROUPS_BY_ID['seymour-flux']!;
    engine.init({ game: 'ffx', party: gagazetBuild, enemies: group, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    const flux = actor(engine, 'seymour-flux');
    expect(flux.hp).toBe(group.enemies[0]!.hp);
    expect(flux.stats.str).toBe(group.enemies[0]!.stats.str);
    expect(flags(engine)['ronso.sameSide']).toBeUndefined(); // the brothers' flag is never published outside their fight
  });
});
