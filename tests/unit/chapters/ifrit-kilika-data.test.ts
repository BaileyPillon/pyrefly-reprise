/**
 * Ifrit at Kilika Temple (FFX-2 Chapter 3, "Pest Control"; the hidden chapter, number 46, typed word `ifrit`): the data, pinned. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `tests/fixtures/parity/ffx2/ifrit_kilika_rows.json` holds the monster (`monster.bin` row 165), the nine moves (`monmagic.bin` 0x4094, 0x4095, 0x41da, 0x41f1 and 0x4232 to 0x4236), the scene's start positions and the
 * script's constants as `genfixture.mjs` read them from the Steam HD files (numbers only; `research/re-ffx2-ifrit-kilika.md`), independently of the note's prose. This file compares them to the enemy data, the monster
 * record and the command records field by field; it also pins:
 *
 * 1. **The enemy**: level, HP, MP and the eight stats; the element bytes (absorbs Fire, weak to Ice, nulls Gravity); the automatic status "uses no MP".
 * 2. **The ailments** [RE §0]: Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, Itchy, Auto-Life, Stop and Doom immune; **Slow and every Break land** (the bytes read 0); the special word 0x3c3.
 * 3. **The moves**: every row, the abilities' own fields consistent with them, the hit rule (hard rule 5: only the plain Attack rolls), the free Firaga, the four announcements' and Time Up Meteor's shapes.
 * 4. **The chapter**: one formation, no Escape; the record, its metadata, its registry place (hidden), the party, the reward items, the story and the guide.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { FFX2CommandRecord, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../../../src/battle/ffx2/adapt/slots.ts';
import { affinityBytes, specialWord } from '../../../src/battle/ffx2/adapt/words.ts';
import { KILL_ITEM_ID } from '../../../src/battle/ffx2/adapt/kill-rewards.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { IFRIT_ABILITY, IFRIT_ANNOUNCEMENTS, IFRIT_SCENE, IFRIT_SCRIPT, groundDistance, x2IfritScript } from '../../../src/battle/ffx2/ai/ifrit.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import { ffx2IfritKilikaScripts } from '../../../src/story/scripts/ffx2-ifrit-kilika.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { ALL_BOSS_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import { besaidBuild } from '../../../src/data/ffx2/builds/besaid.ts';
import { kilikaBuild } from '../../../src/data/ffx2/builds/kilika.ts';
import { IFRIT_ID, IFRIT_SCRIPT_ID, IFRIT_SPRITE, KILIKA_IFRIT, kilikaIfritGroup, x2Ifrit } from '../../../src/data/ffx2/enemies/ifrit.ts';
import {
  IFRIT_ABOUT_TO_BLOW_ID, IFRIT_ANGRY_ID, IFRIT_ANNOUNCEMENT_IDS, IFRIT_ATTACK_ID, IFRIT_DC, IFRIT_ENDS_NOW_ID, IFRIT_FIRAGA_ID, IFRIT_FIRAGA_MP, IFRIT_FURIOUS_ID, IFRIT_HELLFIRE_ID, IFRIT_METEOR_STRIKE_ID,
  IFRIT_TIME_UP_METEOR_ID, x2IfritAbilities,
} from '../../../src/data/ffx2/enemies/ifrit-abilities.ts';
import { MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { KILL_REWARD_ROWS } from '../../../src/data/ffx2/monster-records/kill-rewards.ts';
import { FFX2_COMMAND_RECORDS, NO_COMMAND_RECORD } from '../../../src/data/ffx2/command-records/index.ts';
import { heldItems } from '../../../src/data/ffx2/items/held.ts';
import { FFX2_IFRIT_KILIKA, IFRIT_KILIKA_ID } from '../../../src/data/chapter-ffx2-ifrit-kilika.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { DJOSE_CHAMBER_PLATE } from '../../../src/data/ixion-plates.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { IFRIT_KILIKA_BOSS_IDS } from '../../../src/engine/tactics/ffx2-ifrit-kilika.ts';
import { IFRIT_KILIKA_GUIDE_IDS } from '../../../src/data/guides/ffx2-ifrit-kilika.ts';

interface MonsterRow {
  row: number; id: number; offset: number; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number; thinking: number;
  special: number; absorb: number; null: number; half: number; weak: number; autoStatus1: number; autoStatus2: number;
  exp: number; gil: number; pilfer: number; ap: number; dropByte: number; stealByte: number; zantetsu: number; dropItems: number[]; stealItems: number[]; bribeItems: number[]; waza: number[];
  model: number; motion: number; sound: number; resist1: Record<string, number>; resist2: Record<string, number>;
}
interface MoveRow {
  id: number; offset: number; costAtb: number; costCast: number; costMp: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number;
  crit: number; accuracy: number; power: number; hits: number; shatter: number; element: number; status1: Record<string, number>; status2: Record<string, number>;
}
interface Fixture {
  monsters: Record<string, MonsterRow>;
  moves: Record<string, MoveRow>;
  scene: { boss: { x: number; z: number }; girls: Array<{ x: number; z: number }> };
  script: { gaugePerOrdinaryAction: number; gaugePerHitTaken: number; ordinaryModulus: number; firagaRoll: number; meteorMarks: number[]; hellfireAt: number; tooLongSceneConstant: number; tooLongPolls: Record<string, number> };
}
const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx2/ifrit_kilika_rows.json', import.meta.url)), 'utf8')) as Fixture;
const ROW = FIXTURE.monsters['x2-ifrit']!;
const RECORD = MONSTER_RECORDS[`${KILIKA_IFRIT}/${IFRIT_ID}`]!;
const byId = Object.fromEntries(x2IfritAbilities.map((a) => [a.id, a]));
const numeric = (record: Record<string, number>): Record<number, number> => Object.fromEntries(Object.entries(record).map(([k, v]) => [Number(k), v]));

describe('the fixture is the game\'s row 165, and the research agrees where it speaks', () => {
  it('is the Kilika Temple Ifrit: Lv 23, HP 8,820, MP 9,999, bestiary #179, model, motion and sound all 0x10a5', () => {
    expect(ROW.row).toBe(165);
    expect(ROW.id).toBe(0x10a5);
    expect([ROW.level, ROW.hp, ROW.mp]).toEqual([23, 8820, 9999]);
    expect([ROW.model, ROW.motion, ROW.sound]).toEqual([0x10a5, 0x10a5, 0x10a5]);
  });

  it('every field research/ffx2-fallen-aeons.md §7.1 gives equals the row: STR 82, MAG 22, DEF 98, MDEF 49, AGI 114, EVA 14, LCK 2, EXP 1,800, AP 15, Gil 1,300, Pilfer Gil 1,800 (the only fields the sources share)', () => {
    expect({ level: ROW.level, hp: ROW.hp, str: ROW.str, mag: ROW.mag, def: ROW.def, mdef: ROW.mdef, agi: ROW.agi, eva: ROW.eva, luck: ROW.luck, exp: ROW.exp, ap: ROW.ap, gil: ROW.gil, pilfer: ROW.pilfer })
      .toEqual({ level: 23, hp: 8820, str: 82, mag: 22, def: 98, mdef: 49, agi: 114, eva: 14, luck: 2, exp: 1800, ap: 15, gil: 1300, pilfer: 1800 });
  });

  it('its ability list is Attack (0x41da), Hellfire (0x4094), Meteor Strike (0x4095), Firaga (0x41f1) and Die (0x40ae): four moves, Die being no attack; the other five rows are the "battle too long" block\'s', () => {
    expect(ROW.waza).toEqual([0x41da, 0x4094, 0x4095, 0x41f1, 0x40ae]);
    expect(x2Ifrit.abilityIds.slice(0, 4)).toEqual([IFRIT_ATTACK_ID, IFRIT_FIRAGA_ID, IFRIT_METEOR_STRIKE_ID, IFRIT_HELLFIRE_ID]);
    expect(x2Ifrit.abilityIds.slice(4)).toEqual([...IFRIT_ANNOUNCEMENT_IDS, IFRIT_TIME_UP_METEOR_ID]);
    expect(FIXTURE.moves['x2-ifrit-angry']!.id).toBe(0x4232);
    expect(FIXTURE.moves['x2-ifrit-time-up-meteor']!.id).toBe(0x4236);
  });
});

describe('the enemy data is the row', () => {
  it('level, HP, MP and the stats are the row\'s (MP 9,999 and Accuracy 95 are the row\'s alone: the research gives neither)', () => {
    expect(x2Ifrit.level).toBe(ROW.level);
    expect([x2Ifrit.hp, x2Ifrit.stats.hp, x2Ifrit.stats.maxHp]).toEqual([ROW.hp, ROW.hp, ROW.hp]);
    expect([x2Ifrit.mp, x2Ifrit.stats.mp, x2Ifrit.stats.maxMp]).toEqual([ROW.mp, ROW.mp, ROW.mp]);
    expect(x2Ifrit.stats).toMatchObject({ str: ROW.str, def: ROW.def, mag: ROW.mag, mdef: ROW.mdef, agi: ROW.agi, acc: ROW.acc, eva: ROW.eva, luck: ROW.luck });
    expect(x2Ifrit.forms[0]).toMatchObject({ hp: ROW.hp });
  });

  it('the rewards are the row\'s: EXP 1,800, AP 15, Gil 1,300, Pilfer Gil 1,800, an Angel Earrings drop (accessory 0x9045), Fiery Gleam x1 (0x9020) in both steal slots at a steal byte of 128', () => {
    const rw = x2Ifrit.rewards;
    expect([rw.exp, rw.ap, rw.apOverkill, rw.gil, rw.stolenGil]).toEqual([ROW.exp, ROW.ap, ROW.ap, ROW.gil, ROW.pilfer]);
    expect(ROW.dropByte).toBe(255);
    expect(ROW.dropItems).toEqual([0x9045, 1, 0x9045, 1]);
    expect(ROW.stealItems).toEqual([0x9020, 1, 0x9020, 1]);
    expect(rw.drops).toEqual([{ itemId: 'angel-earrings', count: 1 }]);
    expect(rw.steal?.common).toEqual({ itemId: 'fiery-gleam', count: 1 });
    expect(rw.steal?.rare).toEqual({ itemId: 'fiery-gleam', count: 1 });
    expect(rw.steal?.stealRate).toBe(ROW.stealByte);
    expect(ROW.stealByte).toBe(128);
    expect(KILL_ITEM_ID[0x9045]).toBe('angel-earrings');
    expect(KILL_ITEM_ID[0x9020], 'a steal item, not a drop: it needs no row in the drop-id table').toBeUndefined();
  });

  it('the kill-reward table has the row (EXP, AP, gil, drop byte, drop), and the drop and steal items have rows (held-only, no price, the research names no more)', () => {
    expect(KILL_REWARD_ROWS[`${KILIKA_IFRIT}/${IFRIT_ID}`]).toMatchObject({ table: 1, row: 165, exp: ROW.exp, ap: ROW.ap, gil: ROW.gil, dropByte: ROW.dropByte, drop: [0x9045, 1, 0x9045, 1] });
    for (const id of ['angel-earrings', 'fiery-gleam']) {
      const item = heldItems.find((i) => i.id === id)!;
      expect(item, id).toBeDefined();
      expect(item.usableInBattle, id).toBe(false);
      expect(item.price, id).toBe(0);
      expect(data.ITEMS[id]?.name, id).toBe(id === 'angel-earrings' ? 'Angel Earrings' : 'Fiery Gleam');
    }
    expect(ROW.bribeItems).toEqual([0, 0, 0, 0]);
    expect(x2Ifrit.rewards.bribe).toBeUndefined();
    expect((ROW.special >> 7) & 7, 'special bits 7, 8 and 9 are all set: immune to Interrupt and Bribe whichever is which').toBe(7);
    expect(x2Ifrit.immunityFlags).toContain('immune-to-bribe');
  });
});

describe('Fire is absorbed, Ice is the weakness, Gravity is nulled (the row)', () => {
  it('the element bytes are absorb Fire (0x01), null Gravity (0x10), weak Ice (0x02), half nothing', () => {
    expect([ROW.absorb, ROW.null, ROW.half, ROW.weak]).toEqual([0x01, 0x10, 0, 0x02]);
    expect(x2Ifrit.affinities).toEqual({ fire: 'absorb', ice: 'weak', gravity: 'immune' });
  });

  it('the engine builds the same bytes from the data', () => {
    const unit = aiUnit(IFRIT_ID, 'enemy', ROW.hp, 0);
    unit.affinities = { ...x2Ifrit.affinities };
    expect(affinityBytes(unit)).toMatchObject({ absorb: ROW.absorb, nullify: ROW.null, half: ROW.half, weak: ROW.weak });
  });

  it('the automatic status word is "uses no MP" (group 1 bit 13) and nothing else; his 9,999 MP pays Firaga\'s 24 more than four hundred times, so the engine, which does not read the word, loses nothing', () => {
    expect([ROW.autoStatus1, ROW.autoStatus2]).toEqual([0x2000, 0]);
    expect(Math.floor(x2Ifrit.stats.maxMp / IFRIT_FIRAGA_MP)).toBe(416);
    expect(byId[IFRIT_FIRAGA_ID]!.mpCost).toBe(FIXTURE.moves['x2-ifrit-firaga']!.costMp);
    expect(IFRIT_FIRAGA_MP).toBe(24);
  });
});

describe('the monster record is the row, and the engine\'s status table is built from it', () => {
  it('carries Accuracy, the special word, Zantetsu, the steal byte and gil, the steal items, no Bribe slot, and the plain Attack 0x41da', () => {
    expect(RECORD).toBeDefined();
    expect(RECORD).toMatchObject({ row: 165, table: 1, acc: ROW.acc, special: ROW.special, species: 0, zantetsu: ROW.zantetsu, stealByte: ROW.stealByte, stealGil: ROW.pilfer, steal: ROW.stealItems, bribe: [0, 0, 0, 0] });
    expect(RECORD.plainAttack).toMatchObject({ id: ROW.waza[0], power: 16 });
    expect(x2Ifrit.ffx2Record).toBe(RECORD);
    expect(ROW.special).toBe(0x3c3);
    expect(ROW.zantetsu).toBe(80);
    expect(specialWord(Object.assign(aiUnit(IFRIT_ID, 'enemy', ROW.hp, 0), { enemy: { ...x2Ifrit, aiScriptId: IFRIT_SCRIPT_ID, formIndex: 0 } }) as never)).toBe(0x3c3);
  });

  it('the plain Attack row of the record is the fixture\'s Attack, field for field', () => {
    const want = FIXTURE.moves['x2-ifrit-attack']!;
    expect(RECORD.plainAttack).toMatchObject({
      id: want.id, costAtb: want.costAtb, costCast: want.costCast, flagsTarget: want.flagsTarget, flagsMisc: want.flagsMisc, flagsDamage: want.flagsDamage, damageClass: want.damageClass, formula: want.formula,
      critByte: want.crit, accuracy: want.accuracy, power: want.power, hits: want.hits, shatter: want.shatter, element: want.element,
    });
  });

  it('the resist bytes are the row\'s, slot by slot, Itchy and Auto-Life (17 and 18) included', () => {
    expect(RECORD.resist1).toEqual(numeric(ROW.resist1));
    expect(RECORD.resist2).toEqual(numeric(ROW.resist2));
    expect(Object.keys(ROW.resist1).map(Number).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 17, 18]);
    expect(Object.keys(ROW.resist2).map(Number)).toEqual([6, 14]); // Stop and Doom: Slow and every stat stage read 0, so Breaks and Slow land
  });

  it('after the attach, the enemy is immune to exactly the statuses the row nulls (Itchy and Auto-Life included), plus Delay (special bit 6) and Interrupt (bits 7, 8, 9); Slow and the Breaks land', () => {
    const expected = new Set<string>(['delay-effect', 'action-cancel']);
    for (const [slot, byte] of Object.entries(ROW.resist1)) {
      const status = GROUP1_STATUS[Number(slot)];
      if (status !== null && status !== undefined && byte === 255) expected.add(status);
    }
    for (const [slot, byte] of Object.entries(ROW.resist2)) for (const status of GROUP2_STATUS[Number(slot)] ?? []) if (byte === 255) expected.add(status);
    const immune = new Set(Object.entries(x2Ifrit.immunities).filter(([, v]) => v === 255).map(([k]) => k));
    expect([...immune].sort()).toEqual([...expected].sort());
    for (const status of ['itchy', 'auto-life', 'action-cancel', 'stop', 'doom']) expect(immune.has(status), status).toBe(true);
    for (const lands of ['slow', 'str-down', 'def-down', 'mag-down', 'mdef-down', 'shell', 'protect', 'reflect', 'haste', 'regen']) expect(immune.has(lands), `${lands} lands`).toBe(false);
    expect(x2Ifrit.immunityFlags).toEqual(['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe']);
  });
});

describe('the moves are the rows (damage constants, targets, the hit rule)', () => {
  const rec = (id: string): FFX2CommandRecord => FFX2_COMMAND_RECORDS[id]!;

  it('the ids are the data\'s and the AI\'s, in both layers, and the shipped table holds all nine', () => {
    expect(IFRIT_ABILITY).toEqual({ attack: IFRIT_ATTACK_ID, firaga: IFRIT_FIRAGA_ID, meteorStrike: IFRIT_METEOR_STRIKE_ID, hellfire: IFRIT_HELLFIRE_ID, timeUpMeteor: IFRIT_TIME_UP_METEOR_ID });
    expect([...IFRIT_ANNOUNCEMENTS]).toEqual([IFRIT_ANGRY_ID, IFRIT_FURIOUS_ID, IFRIT_ABOUT_TO_BLOW_ID, IFRIT_ENDS_NOW_ID]);
    expect([...IFRIT_ANNOUNCEMENT_IDS]).toEqual([...IFRIT_ANNOUNCEMENTS]);
    expect(IFRIT_SCRIPT).toBe(IFRIT_SCRIPT_ID);
    expect(x2Ifrit.aiScriptId).toBe(IFRIT_SCRIPT);
    expect(aiScriptFor(IFRIT_SCRIPT)).toBe(x2IfritScript);
    for (const id of [...Object.values(IFRIT_ABILITY), ...IFRIT_ANNOUNCEMENTS]) {
      expect(ALL_BOSS_ABILITIES.find((a) => a.id === id), id).toBeDefined();
      expect(data.ABILITIES[id], id).toBeDefined();
      expect(id.startsWith('x2-ifrit-'), id).toBe(true); // never the FFX Ifrit's ids
    }
    expect(ENEMY_GROUPS_BY_ID[KILIKA_IFRIT]).toBe(kilikaIfritGroup);
  });

  it('the damage constants are 16, 19, 25 and 24 (§7.1, [verified: 2 sources]) and Time Up Meteor\'s 200', () => {
    expect(IFRIT_DC).toEqual({ attack: 16, firaga: 19, meteorStrike: 25, hellfire: 24, timeUpMeteor: 200 });
    expect([byId[IFRIT_ATTACK_ID]!.power, byId[IFRIT_FIRAGA_ID]!.power, byId[IFRIT_METEOR_STRIKE_ID]!.power, byId[IFRIT_HELLFIRE_ID]!.power, byId[IFRIT_TIME_UP_METEOR_ID]!.power]).toEqual([
      FIXTURE.moves['x2-ifrit-attack']!.power, FIXTURE.moves['x2-ifrit-firaga']!.power, FIXTURE.moves['x2-ifrit-meteor-strike']!.power, FIXTURE.moves['x2-ifrit-hellfire']!.power, FIXTURE.moves['x2-ifrit-time-up-meteor']!.power,
    ]);
  });

  it('the Attack is a single-target physical hit; Firaga and Hellfire are Fire magic on every living girl; Meteor Strike is non-elemental magic on one; Time Up Meteor is neither physical nor magical on everyone', () => {
    expect(byId[IFRIT_ATTACK_ID]).toMatchObject({ formula: 'strength', damageType: 'physical', targeting: 'single-enemy', category: 'attack', element: ['none'] });
    expect(byId[IFRIT_FIRAGA_ID]).toMatchObject({ formula: 'magic', damageType: 'magical', targeting: 'all-enemies', element: ['fire'] });
    expect(byId[IFRIT_HELLFIRE_ID]).toMatchObject({ formula: 'magic', damageType: 'magical', targeting: 'all-enemies', element: ['fire'] });
    expect(byId[IFRIT_METEOR_STRIKE_ID]).toMatchObject({ formula: 'magic', damageType: 'magical', targeting: 'single-enemy', element: ['none'] });
    expect(byId[IFRIT_TIME_UP_METEOR_ID]).toMatchObject({ formula: 'fixed-no-variance', damageType: 'other', targeting: 'all-enemies', hits: 12 });
  });

  it('hard rule 5: Firaga, Meteor Strike, Hellfire (his Overdrive) and Time Up Meteor are `canMiss: false`; the plain Attack is the one move that rolls (accuracy formula 2 on the row\'s byte 95)', () => {
    for (const id of [IFRIT_FIRAGA_ID, IFRIT_METEOR_STRIKE_ID, IFRIT_HELLFIRE_ID, IFRIT_TIME_UP_METEOR_ID]) expect(byId[id]!.canMiss, id).toBe(false);
    expect(byId[IFRIT_ATTACK_ID]!.canMiss).not.toBe(false);
    for (const id of [IFRIT_FIRAGA_ID, IFRIT_METEOR_STRIKE_ID, IFRIT_HELLFIRE_ID, IFRIT_TIME_UP_METEOR_ID]) expect((rec(id).flagsMisc >> 3) & 7, `${id}: accuracy formula 0, it never rolls`).toBe(0);
    expect((FIXTURE.moves['x2-ifrit-attack']!.flagsMisc >> 3) & 7).toBe(2);
    expect(FIXTURE.moves['x2-ifrit-attack']!.accuracy).toBe(95);
  });

  it('the four rows with a record run on the game\'s own command rows: every field is the fixture\'s, the ability carries the very record the table serves, and the plain Attack has no row of its own', () => {
    for (const id of [IFRIT_FIRAGA_ID, IFRIT_METEOR_STRIKE_ID, IFRIT_HELLFIRE_ID, IFRIT_TIME_UP_METEOR_ID]) {
      const want = FIXTURE.moves[id]!;
      const record = rec(id);
      expect(record, id).toBeDefined();
      expect(record, id).toMatchObject({
        id: want.id, costAtb: want.costAtb, costCast: want.costCast, flagsTarget: want.flagsTarget, flagsMisc: want.flagsMisc, flagsDamage: want.flagsDamage, damageClass: want.damageClass, formula: want.formula,
        critByte: want.crit, accuracy: want.accuracy, power: want.power, hits: want.hits, shatter: want.shatter, element: want.element,
      });
      expect(byId[id]!.ffx2Record, id).toBe(record);
    }
    expect(byId[IFRIT_ATTACK_ID]!.ffx2Record, 'the plain Attack runs on the monster record\'s row 0x41da').toBeUndefined();
  });

  it('what the rows say: Meteor Strike is magical (flags 0x2) and aimed at one (0x13), Hellfire and Firaga are Fire (element bit 1), Hellfire has the longest cast (180 against Meteor Strike\'s 100 and Firaga\'s 70), the Meteor costs 80 ATB and Hellfire 100', () => {
    expect([rec(IFRIT_METEOR_STRIKE_ID).flagsDamage & 3, rec(IFRIT_HELLFIRE_ID).flagsDamage & 3, rec(IFRIT_FIRAGA_ID).flagsDamage & 3, rec(IFRIT_TIME_UP_METEOR_ID).flagsDamage & 3]).toEqual([2, 2, 2, 0]);
    expect(rec(IFRIT_METEOR_STRIKE_ID).flagsTarget).toBe(0x13);
    expect(rec(IFRIT_HELLFIRE_ID).flagsTarget).toBe(0x17);
    expect([rec(IFRIT_HELLFIRE_ID).element, rec(IFRIT_FIRAGA_ID).element, rec(IFRIT_METEOR_STRIKE_ID).element]).toEqual([1, 1, 0]);
    expect([rec(IFRIT_HELLFIRE_ID).costCast, rec(IFRIT_METEOR_STRIKE_ID).costCast, rec(IFRIT_FIRAGA_ID).costCast]).toEqual([180, 100, 70]);
    expect([rec(IFRIT_METEOR_STRIKE_ID).costAtb, rec(IFRIT_HELLFIRE_ID).costAtb, rec(IFRIT_FIRAGA_ID).costAtb]).toEqual([80, 100, 0]);
    expect(rec(IFRIT_TIME_UP_METEOR_ID)).toMatchObject({ formula: 5, power: 200, hits: 12, flagsTarget: 0x17 });
  });

  it('the four announcements have rows with damage formula 0, power 0 and no hits in the game (so the abilities do no damage), no command record of ours (each is listed with its reason), and they are scripted turns on himself', () => {
    for (const id of IFRIT_ANNOUNCEMENT_IDS) {
      const want = FIXTURE.moves[id]!;
      expect([want.formula, want.power, want.hits], id).toEqual([0, 0, 0]);
      expect(byId[id]).toMatchObject({ power: 0, formula: 'none', targeting: 'self', canMiss: false });
      expect(FFX2_COMMAND_RECORDS[id], id).toBeUndefined();
      expect(NO_COMMAND_RECORD[id], id).toBeTypeOf('string');
    }
    expect(FIXTURE.moves['x2-ifrit-angry']!.id).toBe(0x4232);
    expect(FIXTURE.moves['x2-ifrit-ends-now']!.id).toBe(0x4235);
  });

  it('every announcement is in our own words: none of the game\'s strings, and each passes the story lint', () => {
    const lines = IFRIT_ANNOUNCEMENT_IDS.map((id) => byId[id]!.messageTemplate!);
    for (const line of lines) {
      expect(line, 'the game\'s strings say "Battle too long"').not.toMatch(/battle too long/i);
      expect(line.length).toBeGreaterThan(8);
    }
    expect(new Set(lines).size).toBe(4);
  });
});

describe('the scene and the script constants are the fixture\'s (the worker\'s numbers; no script text is kept)', () => {
  it('the Kilika start positions are the fixture\'s, and the ground distances are Yuna 53.00, Rikku and Paine 52.39', () => {
    expect(IFRIT_SCENE.boss).toEqual(FIXTURE.scene.boss);
    expect(IFRIT_SCENE.girls).toEqual(FIXTURE.scene.girls);
    expect([groundDistance(0), groundDistance(1), groundDistance(2)].map((d) => Math.round(d * 100) / 100)).toEqual([53.0, 52.39, 52.39]);
  });
});

describe('the group, the party and the chapter', () => {
  it('is one link that cannot be fled, on our own aeon cue (never the retail "Aeons"), with no flat action time (the per-command span supersedes it)', () => {
    expect(kilikaIfritGroup).toMatchObject({ id: KILIKA_IFRIT, game: 'ffx2', canEscape: false });
    expect(kilikaIfritGroup.enemies).toEqual([x2Ifrit]);
    expect(kilikaIfritGroup.musicCues).toEqual([{ at: 'start', track: 'boss-ffx2-fallen-aeons', fadeMs: 800 }]);
    expect(kilikaIfritGroup.actionTimeSeconds).toBeUndefined();
    expect(x2Ifrit.spriteKey).toBe(IFRIT_SPRITE);
    expect(IFRIT_SPRITE).toBe('ifrit'); // the FFX aeon's approved painting, reused as provisional
    expect(x2Ifrit.flags).toMatchObject({ isBoss: true });
  });

  it('the party is the Chapter 2 preset carried forward (Yuna 23 White Mage, Rikku 24 Dark Knight, Paine 25 Warrior), a deep copy of the Besaid one, with the Samurai dressphere OWNED and not worn, and no Lady Luck', () => {
    const b: FFX2PartyBuild = kilikaBuild;
    expect(b.members.map((m) => [m.id, m.level, m.currentDressphere])).toEqual([['yuna', 23, 'white-mage'], ['rikku', 24, 'dark-knight'], ['paine', 25, 'warrior']]);
    expect(b).not.toBe(besaidBuild);
    expect(b.members[0]).not.toBe(besaidBuild.members[0]);
    for (const m of b.members) {
      expect(m.owned, `${m.id} owns Samurai`).toContain('samurai');
      for (const d of ['lady-luck', 'berserker', 'trainer']) expect(m.owned, `${m.id} owns ${d}`).not.toContain(d);
      expect(m.currentDressphere, `${m.id} wears the Chapter 2 sphere`).not.toBe('samurai');
      // Samurai sits after Alchemist, past the end of every ring: the rest of the list is the Besaid one's, in order.
      expect(m.owned.filter((d) => d !== 'samurai'), m.id).toEqual(besaidBuild.members.find((x) => x.id === m.id)!.owned);
    }
    for (const m of besaidBuild.members) expect(m.owned, `${m.id}: the twin chapter's preset is untouched`).not.toContain('samurai');
  });

  it('is hidden: in neither CHAPTERS nor CHAPTER_IDS, found by getChapter, number 46, experimental, FFX-2, on Bailey\'s approved Chamber plate as the provisional stand-in', () => {
    expect(IFRIT_KILIKA_ID).toBe('ffx2-ifrit-kilika');
    expect(getChapter(IFRIT_KILIKA_ID)).toBe(FFX2_IFRIT_KILIKA);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_IFRIT_KILIKA);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(IFRIT_KILIKA_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(IFRIT_KILIKA_ID)).toBe(false);
    expect(FFX2_IFRIT_KILIKA).toMatchObject({ game: 'ffx2', number: 46, experimental: true, sceneKey: DJOSE_CHAMBER_PLATE, title: 'Ifrit' });
    expect(FFX2_IFRIT_KILIKA.buildRef).toBe(kilikaBuild);
    expect(FFX2_IFRIT_KILIKA.enemyGroupRef).toBe(kilikaIfritGroup);
    expect(FFX2_IFRIT_KILIKA.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-ffx2-fallen-aeons', victory: 'victory-ffx2' });
    expect(FFX2_IFRIT_KILIKA.sensorTexts[IFRIT_ID]).toBe(x2Ifrit.sensorText);
  });

  it('the pause metadata exists, says EXP, and its objectives are the lesson, the half and the win', () => {
    const meta = getChapterMeta(IFRIT_KILIKA_ID);
    expect(meta).toBeDefined();
    expect(meta).toMatchObject({ gameLabel: 'FFX-2', numeral: 'EXP', title: 'Ifrit', focalCharacterId: 'yuna' });
    expect(meta!.objectives.map((o) => o.rule)).toEqual([{ kind: 'survived-ability', ability: 'hellfire' }, { kind: 'boss-hp-below', fraction: 0.5 }, { kind: 'victory' }]);
    expect(meta!.musicKeys).toEqual(['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2']);
    expect(meta!.tip!.length).toBeLessThan(260);
  });

  it('the story is lint-clean, pre ends in the battle and post holds the results; each callout names one of his real moves', () => {
    const s = ffx2IfritKilikaScripts;
    for (const script of [s.pre, s.post, ...Object.values(s.midScripts)]) expect(lintScript(script)).toEqual([]);
    expect(s.pre.at(-1)).toMatchObject({ type: 'battleStart' });
    expect(s.post.some((step) => step.type === 'results')).toBe(true);
    const abilities = new Set<string>(Object.values(IFRIT_ABILITY));
    for (const trigger of s.mid) {
      expect(trigger.when).toMatchObject({ type: 'ability-used', who: IFRIT_ID });
      expect(abilities.has((trigger.when as { ability: string }).ability), trigger.id).toBe(true);
      expect(s.midScripts[trigger.script], trigger.id).toBeDefined();
    }
  });

  it('the guide card and its page are registered under the chapter id, for his id, and the tactic names the same fighter', () => {
    const guide = guideForChapter(IFRIT_KILIKA_ID);
    expect(guide).toBeDefined();
    expect(guide!.bossIds).toEqual([IFRIT_ID]);
    expect([...IFRIT_KILIKA_GUIDE_IDS]).toEqual([IFRIT_ID]);
    expect([...IFRIT_KILIKA_BOSS_IDS]).toEqual([IFRIT_ID]);
    expect(docForChapter(IFRIT_KILIKA_ID)).toMatchObject({ game: 'ffx2', bossIds: [IFRIT_ID] });
    expect(GUIDES.filter((g) => g.id === IFRIT_KILIKA_ID)).toHaveLength(1);
  });
});
