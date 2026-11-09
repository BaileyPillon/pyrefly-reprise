/**
 * The Luca Opener (the first fights of FFX-2's Chapter 1, the hidden chapter, number 52, typed word `debut`): the data, pinned. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `tests/fixtures/parity/ffx2/luca_opener_rows.json` holds the three monsters (`monster.bin` rows 129, 130 and 131), the seven moves (`monmagic.bin` 0x4000, 0x405f, 0x40e4, 0x40e7, 0x40f1, 0x41da and 0x41eb), the two scenes' start
 * positions and the scripts' constants as `genfixture.mjs` read them from the Steam HD files (numbers only; `research/re-ffx2-luca-opener.md`), independently of the note's prose. This file compares them to the enemy data, the
 * monster records and the command records field by field; it also pins:
 *
 * 1. **The enemies**: level, HP, MP and the eight stats; the element bytes (each nulls Gravity); the rewards (EXP, gil, AP, Pilfer Gil, drops and steals).
 * 2. **The ailments** [RE section 0]: Ormi and Logos wall Silence, Berserk, Curse, Eject, Itchy, Auto-Life, Stop and Doom and NOT Death; Leblanc walls Berserk, Curse, Eject, Itchy, Auto-Life, Stop and Doom and not Silence, Sleep,
 *    Darkness, Poison, Confusion, Petrify or Death; the special word 0x19b (percent formulas, hit reactions, no Zantetsu, no Bribe) leaves all three open to Delay and Interrupt.
 * 3. **The moves**: every row, the abilities' own fields consistent with them, the hit rule (hard rule 5), the Potion's formula 15 (the power itself), the pistol's two hits.
 * 4. **The chapter**: two links that cannot be fled, the second entered whole and with no card; the record, its metadata, its registry place (hidden), the parties (a Lv 2 / 2 / 3 estimate), the reward items, the story and the guide.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { FFX2CommandRecord } from '../../../src/battle/common/types.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../../../src/battle/ffx2/adapt/slots.ts';
import { affinityBytes } from '../../../src/battle/ffx2/adapt/words.ts';
import { KILL_ITEM_ID } from '../../../src/battle/ffx2/adapt/kill-rewards.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import { SCENES } from '../../../src/battle/ffx2/ai/script-rolls.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import { ffx2LucaOpenerScripts } from '../../../src/story/scripts/ffx2-luca-opener.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { ALL_BOSS_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import { lucaOpenerBuild, lucaOpenerSongstressBuild } from '../../../src/data/ffx2/builds/luca-opener.ts';
import { lucaLeblancGroup, lucaLogosOrmiGroup, x2LucaLeblanc, x2LucaLogos, x2LucaOrmi } from '../../../src/data/ffx2/enemies/luca-opener.ts';
import { LUCA_DC, LUCA_LEBLANC_ATTACK_ID, LUCA_LEBLANC_THUNDER_ID, LUCA_LOGOS_PISTOL_ID, LUCA_LOGOS_POTION_ID, LUCA_ORMI_ATTACK_ID, LUCA_ORMI_PITCH_ID, lucaOpenerAbilities } from '../../../src/data/ffx2/enemies/luca-opener-abilities.ts';
import { MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { KILL_REWARD_ROWS } from '../../../src/data/ffx2/monster-records/kill-rewards.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { heldItems } from '../../../src/data/ffx2/items/held.ts';
import { FFX2_LUCA_OPENER } from '../../../src/data/chapter-ffx2-luca-opener.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { LUCA_OPENER_BOSS_IDS } from '../../../src/engine/tactics/ffx2-luca-opener.ts';
import { LUCA_OPENER_GUIDE_IDS } from '../../../src/data/guides/ffx2-luca-opener.ts';
import {
  LUCA_ACT_1_IDS, LUCA_DOCK_LEBLANC_GROUP_ID, LUCA_DOCK_LOGOS_ORMI_GROUP_ID, LUCA_OPENER_BODY_IDS, LUCA_OPENER_ID, LUCA_OPENER_ROWS, LUCA_OPENER_SCENE, X2_LUCA_LEBLANC_ID, X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID,
} from '../../../src/data/luca-opener-ids.ts';

interface MonsterRow {
  row: number; id: number; offset: number; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number; thinking: number;
  special: number; absorb: number; null: number; half: number; weak: number; autoStatus1: number; autoStatus2: number;
  exp: number; gil: number; pilfer: number; ap: number; dropByte: number; stealByte: number; zantetsu: number; dropItems: number[]; stealItems: number[]; bribeItems: number[]; waza: number[];
  model: number; motion: number; sound: number; resist1: Record<string, number>; resist2: Record<string, number>;
}
interface MoveRow {
  id: number; offset: number; category: number; costAtb: number; costCast: number; costMp: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number;
  crit: number; accuracy: number; power: number; hits: number; shatter: number; element: number; status1: Record<string, number>; status2: Record<string, number>;
}
interface Fixture {
  monsters: Record<string, MonsterRow>;
  moves: Record<string, MoveRow>;
  scenes: Record<string, { formation: number; girls: Array<[number, number]>; enemies: Record<string, [number, number]> }>;
  script: { ormi: { cycleLength: number; shieldThrowAtCount: number; aloneHp: number }; logos: { potionBelowFractionDenominator: number }; leblanc: { attacksBeforeThunder: number; thunderBelowMp: number; thunderMp: number } };
}
const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx2/luca_opener_rows.json', import.meta.url)), 'utf8')) as Fixture;
const ORMI = FIXTURE.monsters[X2_LUCA_ORMI_ID]!;
const LOGOS = FIXTURE.monsters[X2_LUCA_LOGOS_ID]!;
const LEBLANC = FIXTURE.monsters[X2_LUCA_LEBLANC_ID]!;
const BY_ENEMY = [
  [x2LucaOrmi, ORMI, `${LUCA_DOCK_LOGOS_ORMI_GROUP_ID}/${X2_LUCA_ORMI_ID}`],
  [x2LucaLogos, LOGOS, `${LUCA_DOCK_LOGOS_ORMI_GROUP_ID}/${X2_LUCA_LOGOS_ID}`],
  [x2LucaLeblanc, LEBLANC, `${LUCA_DOCK_LEBLANC_GROUP_ID}/${X2_LUCA_LEBLANC_ID}`],
] as const;
const byId = Object.fromEntries(lucaOpenerAbilities.map((a) => [a.id, a]));
const numeric = (record: Record<string, number>): Record<number, number> => Object.fromEntries(Object.entries(record).map(([k, v]) => [Number(k), v]));

describe('the fixture is the game\'s rows 129, 130 and 131, and the research agrees where it speaks', () => {
  it('are the three opener rows (not the Chateau set): ids 0x1081, 0x1082, 0x1083, Lv 2, 2 and 5, models, motions and sounds equal to the ids', () => {
    expect([ORMI.row, LOGOS.row, LEBLANC.row]).toEqual([...LUCA_OPENER_ROWS]);
    expect([ORMI.id, LOGOS.id, LEBLANC.id]).toEqual([0x1081, 0x1082, 0x1083]);
    expect([ORMI.level, LOGOS.level, LEBLANC.level]).toEqual([2, 2, 5]);
    for (const r of [ORMI, LOGOS, LEBLANC]) expect([r.model, r.motion, r.sound], `row ${r.row}`).toEqual([r.id, r.id, r.id]);
  });

  it('the figures Jegged\'s page and the research note print are the rows\': Logos 86 HP, Ormi 97, Leblanc 130; MP 18, 0 and 101; the steals Silver Glasses, Iron Bangle and Silver Bracer; the drops Potion, Phoenix Down and Hi-Potion', () => {
    expect([LOGOS.hp, ORMI.hp, LEBLANC.hp]).toEqual([86, 97, 130]);
    expect([LOGOS.mp, ORMI.mp, LEBLANC.mp]).toEqual([18, 0, 101]);
    expect(LOGOS.stealItems).toEqual([0x9049, 1, 0x9049, 1]);
    expect(ORMI.stealItems).toEqual([0x9000, 1, 0x9000, 1]);
    expect(LEBLANC.stealItems).toEqual([0x9004, 1, 0x9004, 1]);
    expect(ORMI.dropItems).toEqual([0x2000, 1, 0x2006, 1]);
    expect(LOGOS.dropItems).toEqual([0x2000, 1, 0x2006, 1]);
    expect(LEBLANC.dropItems).toEqual([0x2001, 1, 0x2006, 1]);
  });

  it('their ability lists are what the scripts queue: Ormi Attack (0x41da), Pirouette Pitch (0x40e4), Die; Logos 1H Pistol (0x40e7), Potion (0x40f1), Die; Leblanc Attack (0x4000), Thunder (0x41eb)', () => {
    expect(ORMI.waza).toEqual([0x41da, 0x40e4, 0x405f]);
    expect(LOGOS.waza).toEqual([0x40e7, 0x40f1, 0x405f]);
    expect(LEBLANC.waza).toEqual([0x4000, 0x41eb]);
    expect(x2LucaOrmi.abilityIds).toEqual([LUCA_ORMI_ATTACK_ID, LUCA_ORMI_PITCH_ID]);
    expect(x2LucaLogos.abilityIds).toEqual([LUCA_LOGOS_PISTOL_ID, LUCA_LOGOS_POTION_ID]);
    expect(x2LucaLeblanc.abilityIds).toEqual([LUCA_LEBLANC_ATTACK_ID, LUCA_LEBLANC_THUNDER_ID]);
    expect(FIXTURE.moves['x2-luca-die']!.id).toBe(0x405f); // the "speak and fall" row is not built: the fall is the engine's KO
    expect(Object.values(byId).some((a) => a.id.includes('die'))).toBe(false);
  });
});

describe('the enemy data is the row', () => {
  for (const [enemy, row, key] of BY_ENEMY) {
    it(`${enemy.name}: level, HP, MP and the eight stats are the row's; the engine's unit holds the row's record`, () => {
      expect(enemy.level).toBe(row.level);
      expect([enemy.hp, enemy.stats.hp, enemy.stats.maxHp]).toEqual([row.hp, row.hp, row.hp]);
      expect([enemy.mp, enemy.stats.mp, enemy.stats.maxMp]).toEqual([row.mp, row.mp, row.mp]);
      expect(enemy.stats).toMatchObject({ str: row.str, def: row.def, mag: row.mag, mdef: row.mdef, agi: row.agi, acc: row.acc, eva: row.eva, luck: row.luck });
      expect(enemy.forms[0]).toMatchObject({ hp: row.hp });
      expect(enemy.ffx2Record).toBe(MONSTER_RECORDS[key]);
      expect(enemy.flags).toMatchObject({ isBoss: true });
    });

    it(`${enemy.name}: the rewards are the row's (EXP, AP, Gil, Pilfer Gil, the drop and the steal at a steal byte of 192)`, () => {
      const rw = enemy.rewards;
      expect([rw.exp, rw.ap, rw.apOverkill, rw.gil, rw.stolenGil]).toEqual([row.exp, row.ap, row.ap, row.gil, row.pilfer]);
      expect(row.dropByte).toBe(128);
      expect(rw.drops).toEqual([{ itemId: KILL_ITEM_ID[row.dropItems[0]!], count: 1 }]);
      expect(rw.steal?.stealRate).toBe(row.stealByte);
      expect(row.stealByte).toBe(192);
      expect(row.bribeItems).toEqual([0, 0, 0, 0]);
      expect(rw.bribe).toBeUndefined();
      expect(KILL_REWARD_ROWS[key]).toMatchObject({ table: 1, row: row.row, exp: row.exp, ap: row.ap, gil: row.gil, dropByte: row.dropByte, drop: row.dropItems });
    });
  }

  it('the steals and the drops resolve to named items: Iron Bangle, Silver Glasses and Silver Bracer are held-only rows with no price (unsourced), the drops are the shipped Potion, Hi-Potion and Phoenix Down', () => {
    expect(x2LucaOrmi.rewards.steal?.common).toEqual({ itemId: 'iron-bangle', count: 1 });
    expect(x2LucaLogos.rewards.steal?.common).toEqual({ itemId: 'silver-glasses', count: 1 });
    expect(x2LucaLeblanc.rewards.steal?.common).toEqual({ itemId: 'silver-bracer', count: 1 });
    for (const [id, name] of [['iron-bangle', 'Iron Bangle'], ['silver-glasses', 'Silver Glasses'], ['silver-bracer', 'Silver Bracer']] as const) {
      const item = heldItems.find((i) => i.id === id)!;
      expect(item, id).toBeDefined();
      expect([item.usableInBattle, item.price], id).toEqual([false, 0]);
      expect(data.ITEMS[id]?.name, id).toBe(name);
    }
    expect([KILL_ITEM_ID[0x2000], KILL_ITEM_ID[0x2001], KILL_ITEM_ID[0x2006]]).toEqual(['x2-potion', 'x2-hi-potion', 'x2-phoenix-down']);
  });
});

describe('Gravity is nulled, nothing else is absorbed, halved or weak (the rows)', () => {
  for (const [enemy, row] of BY_ENEMY) {
    it(`${enemy.name}: the element bytes are absorb 0, null 0x10 (Gravity), half 0, weak 0, and the engine builds the same bytes from the data`, () => {
      expect([row.absorb, row.null, row.half, row.weak]).toEqual([0, 0x10, 0, 0]);
      expect(enemy.affinities).toEqual({ gravity: 'immune' });
      const unit = aiUnit(enemy.id, 'enemy', row.hp, 0);
      unit.affinities = { ...enemy.affinities };
      expect(affinityBytes(unit)).toMatchObject({ absorb: row.absorb, nullify: row.null, half: row.half, weak: row.weak });
    });
  }

  it('no automatic status on any of the three', () => {
    for (const r of [ORMI, LOGOS, LEBLANC]) expect([r.autoStatus1, r.autoStatus2]).toEqual([0, 0]);
  });
});

describe('the monster records are the rows, and the engine\'s status table is built from them', () => {
  for (const [enemy, row, key] of BY_ENEMY) {
    const record = MONSTER_RECORDS[key]!;

    it(`${enemy.name}: carries Accuracy, the special word 0x19b, Zantetsu, the steal byte and gil and items, and no Bribe slot`, () => {
      expect(record).toMatchObject({ row: row.row, table: 1, acc: row.acc, special: row.special, species: 0, zantetsu: row.zantetsu, stealByte: row.stealByte, stealGil: row.pilfer, steal: row.stealItems, bribe: [0, 0, 0, 0] });
      expect(row.special).toBe(0x19b);
      expect([row.zantetsu]).toEqual([enemy.id === X2_LUCA_LEBLANC_ID ? 60 : 50]);
    });

    it(`${enemy.name}: the resist bytes are the row's, slot by slot, and after the attach the enemy is immune to exactly the statuses the row nulls; Death is ${enemy.id === X2_LUCA_LEBLANC_ID ? 'NOT walled, and neither are Sleep, Silence, Darkness, Poison, Confusion or Petrify' : 'NOT walled'}`, () => {
      expect(record.resist1).toEqual(numeric(row.resist1));
      expect(record.resist2).toEqual(numeric(row.resist2));
      const expected = new Set<string>();
      for (const [slot, byte] of Object.entries(row.resist1)) {
        const status = GROUP1_STATUS[Number(slot)];
        if (status !== null && status !== undefined && byte === 255) expected.add(status);
      }
      for (const [slot, byte] of Object.entries(row.resist2)) for (const status of GROUP2_STATUS[Number(slot)] ?? []) if (byte === 255) expected.add(status);
      const immune = new Set(Object.entries(enemy.immunities).filter(([, v]) => v === 255).map(([k]) => k));
      expect([...immune].sort()).toEqual([...expected].sort());
      for (const status of ['ko', 'sleep', 'darkness', 'poison', 'confuse', 'petrify']) expect(immune.has(status), `${status} lands`).toBe(false);
      for (const status of ['berserk', 'curse', 'eject', 'stop', 'doom', 'itchy', 'auto-life']) expect(immune.has(status), `${status} is walled`).toBe(true);
      expect(immune.has('silence'), 'Silence').toBe(enemy.id !== X2_LUCA_LEBLANC_ID);
    });

    it(`${enemy.name}: only the percent bit of the special word is a flag (bit 6 and bit 9 are clear, so Delay and Interrupt both work on all three)`, () => {
      expect(enemy.immunityFlags).toEqual(['boss', 'immune-to-percentage-damage']);
      expect((row.special >> 6) & 1).toBe(0);
      expect((row.special >> 9) & 1).toBe(0);
      expect(Object.keys(enemy.immunities)).not.toContain('delay-effect');
      expect(Object.keys(enemy.immunities)).not.toContain('action-cancel');
    });
  }

  it('Ormi\'s plain Attack is the row 0x41da and Leblanc\'s the row 0x4000, field for field; Logos has none (his pistol is his only blow)', () => {
    for (const [key, id] of [['x2-luca-ormi-attack', X2_LUCA_ORMI_ID], ['x2-luca-leblanc-attack', X2_LUCA_LEBLANC_ID]] as const) {
      const want = FIXTURE.moves[key]!;
      const group = id === X2_LUCA_ORMI_ID ? LUCA_DOCK_LOGOS_ORMI_GROUP_ID : LUCA_DOCK_LEBLANC_GROUP_ID;
      expect(MONSTER_RECORDS[`${group}/${id}`]!.plainAttack).toMatchObject({
        id: want.id, costAtb: want.costAtb, costCast: want.costCast, flagsTarget: want.flagsTarget, flagsMisc: want.flagsMisc, flagsDamage: want.flagsDamage, damageClass: want.damageClass, formula: want.formula,
        critByte: want.crit, accuracy: want.accuracy, power: want.power, hits: want.hits, shatter: want.shatter, element: want.element,
      });
    }
    expect(MONSTER_RECORDS[`${LUCA_DOCK_LOGOS_ORMI_GROUP_ID}/${X2_LUCA_LOGOS_ID}`]!.plainAttack).toBeUndefined();
  });

  it('Ormi\'s lone-45 rule is not ported (LO5): the data keeps the row\'s 97 and the fixture records the rule as the script\'s constant', () => {
    expect(x2LucaOrmi.hp).toBe(ORMI.hp);
    expect(FIXTURE.script.ormi.aloneHp).toBe(45);
    expect(x2LucaOrmi.hp).not.toBe(FIXTURE.script.ormi.aloneHp);
  });
});

describe('the moves are the rows (damage constants, targets, the hit rule)', () => {
  const rec = (id: string): FFX2CommandRecord => FFX2_COMMAND_RECORDS[id]!;
  const ROWED = [LUCA_ORMI_PITCH_ID, LUCA_LOGOS_PISTOL_ID, LUCA_LOGOS_POTION_ID, LUCA_LEBLANC_THUNDER_ID] as const;
  const FIXTURE_KEY: Readonly<Record<string, string>> = {
    [LUCA_ORMI_PITCH_ID]: 'x2-luca-ormi-pirouette-pitch', [LUCA_LOGOS_PISTOL_ID]: 'x2-luca-logos-pistol', [LUCA_LOGOS_POTION_ID]: 'x2-luca-logos-potion', [LUCA_LEBLANC_THUNDER_ID]: 'x2-luca-leblanc-thunder',
  };

  it('every id starts with `x2-luca-` (never the Chateau set\'s `x2-ormi-` and `x2-logos-`), is in the shipped tables, and the formations hold them', () => {
    for (const a of lucaOpenerAbilities) {
      expect(a.id.startsWith('x2-luca-'), a.id).toBe(true);
      expect(ALL_BOSS_ABILITIES.find((x) => x.id === a.id), a.id).toBe(a);
      expect(data.ABILITIES[a.id], a.id).toBeDefined();
    }
    expect(ENEMY_GROUPS_BY_ID[LUCA_DOCK_LOGOS_ORMI_GROUP_ID]).toBe(lucaLogosOrmiGroup);
    expect(ENEMY_GROUPS_BY_ID[LUCA_DOCK_LEBLANC_GROUP_ID]).toBe(lucaLeblancGroup);
  });

  it('the damage constants are the rows\': Attack 16, shield throw 26, pistol 8 a hit (two hits), Potion 20 (the power itself, a fixed 20 HP), Thunder 7', () => {
    expect(LUCA_DC).toEqual({ attack: 16, pitch: 26, pistol: 8, potion: 20, thunder: 7 });
    expect(FIXTURE.moves['x2-luca-ormi-attack']!.power).toBe(LUCA_DC.attack);
    expect(FIXTURE.moves['x2-luca-leblanc-attack']!.power).toBe(LUCA_DC.attack);
    expect([byId[LUCA_ORMI_PITCH_ID]!.power, byId[LUCA_LOGOS_PISTOL_ID]!.power, byId[LUCA_LOGOS_POTION_ID]!.power, byId[LUCA_LEBLANC_THUNDER_ID]!.power]).toEqual([26, 8, 20, 7]);
    expect(byId[LUCA_LOGOS_PISTOL_ID]!.hits).toBe(2);
    expect(FIXTURE.moves['x2-luca-logos-pistol']!.hits).toBe(2);
    expect(FIXTURE.moves['x2-luca-logos-potion']!.formula, 'damage formula 15: the power itself').toBe(15);
  });

  it('the four rows with a record run on the game\'s own command rows: every field is the fixture\'s, and the ability carries the very record the table serves', () => {
    for (const id of ROWED) {
      const want = FIXTURE.moves[FIXTURE_KEY[id]!]!;
      const record = rec(id);
      expect(record, id).toBeDefined();
      expect(record, id).toMatchObject({
        id: want.id, costAtb: want.costAtb, costCast: want.costCast, category: want.category, flagsTarget: want.flagsTarget, flagsMisc: want.flagsMisc, flagsDamage: want.flagsDamage, damageClass: want.damageClass,
        formula: want.formula, critByte: want.crit, accuracy: want.accuracy, power: want.power, hits: want.hits, shatter: want.shatter, element: want.element,
      });
      expect(byId[id]!.ffx2Record, id).toBe(record);
    }
    for (const id of [LUCA_ORMI_ATTACK_ID, LUCA_LEBLANC_ATTACK_ID]) expect(byId[id]!.ffx2Record, `${id} runs on its monster record's plain Attack`).toBeUndefined();
  });

  it('what the rows say: the pitch is physical (flags 0x1) with a 180 cast and no ATB cost; the pistol is fast (ATB 40, no cast) and two hits; the Potion costs ATB 100, heals (flags 0x10) and takes one friend (0x31); Thunder is magic (0x2), Thunder element (4), 4 MP, cast 70', () => {
    expect([rec(LUCA_ORMI_PITCH_ID).flagsDamage & 3, rec(LUCA_ORMI_PITCH_ID).costCast, rec(LUCA_ORMI_PITCH_ID).costAtb, rec(LUCA_ORMI_PITCH_ID).flagsTarget]).toEqual([1, 180, 0, 0x13]);
    expect([rec(LUCA_LOGOS_PISTOL_ID).costAtb, rec(LUCA_LOGOS_PISTOL_ID).costCast, rec(LUCA_LOGOS_PISTOL_ID).hits]).toEqual([40, 0, 2]);
    expect([rec(LUCA_LOGOS_POTION_ID).costAtb, rec(LUCA_LOGOS_POTION_ID).flagsDamage & 0x10, rec(LUCA_LOGOS_POTION_ID).flagsTarget]).toEqual([100, 0x10, 0x31]);
    expect([rec(LUCA_LEBLANC_THUNDER_ID).flagsDamage & 3, rec(LUCA_LEBLANC_THUNDER_ID).element, rec(LUCA_LEBLANC_THUNDER_ID).costCast, FIXTURE.moves['x2-luca-leblanc-thunder']!.costMp, byId[LUCA_LEBLANC_THUNDER_ID]!.mpCost]).toEqual([2, 4, 70, 4, 4]);
  });

  it('hard rule 5: the shield throw, the Potion and Thunder are `canMiss: false` with accuracy formula 0; the two Attacks and the pistol roll (accuracy formula 2 on byte 95, and formula 1 on 140)', () => {
    for (const id of [LUCA_ORMI_PITCH_ID, LUCA_LOGOS_POTION_ID, LUCA_LEBLANC_THUNDER_ID]) {
      expect(byId[id]!.canMiss, id).toBe(false);
      expect((rec(id).flagsMisc >> 3) & 7, `${id}: it never rolls`).toBe(0);
    }
    for (const id of [LUCA_ORMI_ATTACK_ID, LUCA_LEBLANC_ATTACK_ID, LUCA_LOGOS_PISTOL_ID]) expect(byId[id]!.canMiss, id).not.toBe(false);
    expect([(FIXTURE.moves['x2-luca-ormi-attack']!.flagsMisc >> 3) & 7, FIXTURE.moves['x2-luca-ormi-attack']!.accuracy]).toEqual([2, 95]);
    expect([(FIXTURE.moves['x2-luca-logos-pistol']!.flagsMisc >> 3) & 7, FIXTURE.moves['x2-luca-logos-pistol']!.accuracy]).toEqual([1, 140]);
  });

  it('the shapes of the abilities: Attacks and the pistol are single-target physical; the shield throw is single-target physical; the Potion heals one friend; Thunder is single-target Thunder magic, reflectable', () => {
    expect(byId[LUCA_ORMI_ATTACK_ID]).toMatchObject({ formula: 'strength', damageType: 'physical', targeting: 'single-enemy', category: 'attack' });
    expect(byId[LUCA_LEBLANC_ATTACK_ID]).toMatchObject({ formula: 'strength', damageType: 'physical', targeting: 'single-enemy', category: 'attack' });
    expect(byId[LUCA_ORMI_PITCH_ID]).toMatchObject({ formula: 'strength', damageType: 'physical', targeting: 'single-enemy' });
    expect(byId[LUCA_LOGOS_PISTOL_ID]).toMatchObject({ formula: 'strength', damageType: 'physical', targeting: 'single-enemy', hits: 2 });
    expect(byId[LUCA_LOGOS_POTION_ID]).toMatchObject({ targeting: 'single-ally', damageType: 'other' });
    expect(byId[LUCA_LOGOS_POTION_ID]!.flags).toContain('heals');
    expect(byId[LUCA_LEBLANC_THUNDER_ID]).toMatchObject({ formula: 'magic', damageType: 'magical', targeting: 'single-enemy', element: ['lightning'] });
  });
});

describe('the scenes and the script constants are the fixture\'s (the worker\'s numbers; no script text is kept)', () => {
  it('the docks\' start positions: the three girls at (21, 0), (24, 12), (24, -12) in both scenes; Logos at (-27, 9) and Ormi at (-27, -12) in the first, Leblanc at (-27, 0) in the second', () => {
    const one = FIXTURE.scenes['lchb03_229']!;
    const two = FIXTURE.scenes['lchb03_228']!;
    expect([one.formation, two.formation]).toEqual([487, 488]);
    expect(SCENES.lucaOrmi.girls.map((g) => [g.x, g.z])).toEqual(one.girls);
    expect(SCENES.lucaLeblanc.girls.map((g) => [g.x, g.z])).toEqual(two.girls);
    expect([SCENES.lucaOrmi.boss.x, SCENES.lucaOrmi.boss.z]).toEqual(one.enemies[X2_LUCA_ORMI_ID]);
    expect([SCENES.lucaLeblanc.boss.x, SCENES.lucaLeblanc.boss.z]).toEqual(two.enemies[X2_LUCA_LEBLANC_ID]);
    expect(one.enemies[X2_LUCA_LOGOS_ID]).toEqual([-27, 9]);
  });

  it('the scripts\' constants: Ormi throws at a counter of 2 (a cycle of 3), Logos at a fifth, Leblanc after 3 Attacks, under 8 MP, Thunder\'s 4', () => {
    expect(FIXTURE.script).toMatchObject({ ormi: { cycleLength: 3, shieldThrowAtCount: 2 }, logos: { potionBelowFractionDenominator: 5 }, leblanc: { attacksBeforeThunder: 3, thunderBelowMp: 8, thunderMp: 4 } });
  });
});

describe('the groups, the parties and the chapter', () => {
  it('are two links that cannot be fled, the second whole on entry with no Save Sphere card and a Songstress template, on the Syndicate\'s cue; no flat action time', () => {
    expect(lucaLogosOrmiGroup).toMatchObject({ id: LUCA_DOCK_LOGOS_ORMI_GROUP_ID, game: 'ffx2', canEscape: false, nextGroupId: LUCA_DOCK_LEBLANC_GROUP_ID, bossId: X2_LUCA_ORMI_ID });
    expect(lucaLogosOrmiGroup.enemies).toEqual([x2LucaLogos, x2LucaOrmi]);
    expect(lucaLeblancGroup).toMatchObject({ id: LUCA_DOCK_LEBLANC_GROUP_ID, game: 'ffx2', canEscape: false, restoresPartyOnEntry: true, noSaveSphereCard: true });
    expect(lucaLeblancGroup.nextGroupId).toBeUndefined();
    expect(lucaLeblancGroup.enemies).toEqual([x2LucaLeblanc]);
    expect(lucaLeblancGroup.partyBuildRef).toBe(lucaOpenerSongstressBuild);
    expect(lucaLogosOrmiGroup.partyBuildRef).toBeUndefined();
    for (const g of [lucaLogosOrmiGroup, lucaLeblancGroup]) {
      expect(g.musicCues).toEqual([{ at: 'start', track: 'boss-leblanc', fadeMs: 800 }]);
      expect(g.actionTimeSeconds).toBeUndefined();
    }
    expect([...LUCA_OPENER_BODY_IDS]).toEqual([X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID, X2_LUCA_LEBLANC_ID]);
    expect([...LUCA_ACT_1_IDS]).toEqual([X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID]);
  });

  it('the sprites are the Chateau trio\'s approved paintings (`ormi`, `logos`, `leblanc`), the slots Leblanc 0, Logos 1, Ormi 2', () => {
    expect([x2LucaOrmi.spriteKey, x2LucaLogos.spriteKey, x2LucaLeblanc.spriteKey]).toEqual(['ormi', 'logos', 'leblanc']);
    expect([x2LucaLeblanc.slot, x2LucaLogos.slot, x2LucaOrmi.slot]).toEqual([0, 1, 2]);
  });

  it('the parties: Yuna a Gunner, Rikku a Thief, Paine a Warrior at Lv 2 / 2 / 3 on the First Steps grid, owning only their own sphere; the second template is the same with Yuna the Songstress, owning only it, with Darkness Dance her only ability', () => {
    expect(lucaOpenerBuild.members.map((m) => [m.id, m.level, m.currentDressphere, m.owned, m.garmentGrid.id])).toEqual([
      ['yuna', 2, 'gunner', ['gunner'], 'first-steps'], ['rikku', 2, 'thief', ['thief'], 'first-steps'], ['paine', 3, 'warrior', ['warrior'], 'first-steps'],
    ]);
    expect(lucaOpenerSongstressBuild.members.map((m) => [m.id, m.level, m.currentDressphere, m.owned])).toEqual([
      ['yuna', 2, 'songstress', ['songstress']], ['rikku', 2, 'thief', ['thief']], ['paine', 3, 'warrior', ['warrior']],
    ]);
    expect(lucaOpenerSongstressBuild.members[0]!.abilitiesLearned).toEqual({ songstress: { learned: ['x2-songstress-darkness-dance'], ap: 0 } });
    expect(lucaOpenerSongstressBuild.members[0]!.spriteKey).toBe('yuna-songstress');
    expect(lucaOpenerSongstressBuild.inventory).toEqual(lucaOpenerBuild.inventory);
    expect(lucaOpenerSongstressBuild).not.toBe(lucaOpenerBuild);
    expect(lucaOpenerSongstressBuild.members[1]).not.toBe(lucaOpenerBuild.members[1]);
    expect(lucaOpenerBuild.inventory).toEqual([{ itemId: 'x2-potion', count: 10 }, { itemId: 'x2-phoenix-down', count: 3 }]); // [estimate]
  });

  it('is hidden: in neither CHAPTERS nor CHAPTER_IDS, found by getChapter, number 52, experimental, FFX-2, on the Leblanc stage as the flagged stand-in for the docks', () => {
    expect(LUCA_OPENER_ID).toBe('ffx2-luca-opener');
    expect(getChapter(LUCA_OPENER_ID)).toBe(FFX2_LUCA_OPENER);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_LUCA_OPENER);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(LUCA_OPENER_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(LUCA_OPENER_ID)).toBe(false);
    expect(FFX2_LUCA_OPENER).toMatchObject({ game: 'ffx2', number: 52, experimental: true, sceneKey: LUCA_OPENER_SCENE, title: 'The Luca Opener' });
    expect(LUCA_OPENER_SCENE).toBe('leblanc-last-room');
    expect(FFX2_LUCA_OPENER.buildRef).toBe(lucaOpenerBuild);
    expect(FFX2_LUCA_OPENER.enemyGroupRef).toBe(lucaLogosOrmiGroup);
    expect(FFX2_LUCA_OPENER.music).toEqual({ scene: 'scene-chateau-leblanc', battle: 'boss-leblanc', victory: 'victory-ffx2' });
    expect(FFX2_LUCA_OPENER.sensorTexts[X2_LUCA_ORMI_ID]).toBe(x2LucaOrmi.sensorText);
    expect(FFX2_LUCA_OPENER.sensorTexts[X2_LUCA_LOGOS_ID]).toBe(x2LucaLogos.sensorText);
    expect(FFX2_LUCA_OPENER.sensorTexts[X2_LUCA_LEBLANC_ID]).toBe(x2LucaLeblanc.sensorText);
  });

  it('the pause metadata exists, says EXP, and its objectives are the second link, the Thunder and the win', () => {
    const meta = getChapterMeta(LUCA_OPENER_ID);
    expect(meta).toBeDefined();
    expect(meta).toMatchObject({ gameLabel: 'FFX-2', numeral: 'EXP', title: 'The Luca Opener', focalCharacterId: 'paine' });
    expect(meta!.objectives.map((o) => o.rule)).toEqual([{ kind: 'link-reached', link: 2 }, { kind: 'survived-ability', ability: 'thunder' }, { kind: 'victory' }]);
    expect(meta!.musicKeys).toEqual(['scene-chateau-leblanc', 'boss-leblanc', 'victory-ffx2']);
    expect(meta!.tip!.length).toBeLessThan(260);
  });

  it('the story is lint-clean, pre ends in the battle and post holds the results; the seam is the fall of both of act 1\'s fighters, each callout names one of their real moves', () => {
    const s = ffx2LucaOpenerScripts;
    for (const script of [s.pre, s.post, ...Object.values(s.midScripts)]) expect(lintScript(script)).toEqual([]);
    expect(s.pre.at(-1)).toMatchObject({ type: 'battleStart' });
    expect(s.post.some((step) => step.type === 'results')).toBe(true);
    const abilities = new Set(lucaOpenerAbilities.map((a) => a.id));
    for (const trigger of s.mid) {
      expect(s.midScripts[trigger.script], trigger.id).toBeDefined();
      if (trigger.when.type === 'ability-used') expect(abilities.has(trigger.when.ability), trigger.id).toBe(true);
    }
    expect(s.mid.find((t) => t.id === 'luca-act-1-fallen')?.when).toEqual({ type: 'all-ko', ids: [X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID] });
  });

  it('the guide card and its page are registered under the chapter id, for the three ids, and the tactic names the same fighters', () => {
    const guide = guideForChapter(LUCA_OPENER_ID);
    expect(guide).toBeDefined();
    expect(guide!.bossIds).toEqual([...LUCA_OPENER_BODY_IDS]);
    expect([...LUCA_OPENER_GUIDE_IDS]).toEqual([...LUCA_OPENER_BODY_IDS]);
    expect([...LUCA_OPENER_BOSS_IDS]).toEqual([...LUCA_OPENER_BODY_IDS]);
    expect(docForChapter(LUCA_OPENER_ID)).toMatchObject({ game: 'ffx2', bossIds: [...LUCA_OPENER_BODY_IDS] });
    expect(GUIDES.filter((g) => g.id === LUCA_OPENER_ID)).toHaveLength(1);
  });
});
