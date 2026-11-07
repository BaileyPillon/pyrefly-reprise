/**
 * Yuna's Ballad (the possessed Rikku, then the possessed Paine; the hidden FFX-2 chapter): the data against the game's own rows. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `tests/fixtures/parity/ffx2/yunas_ballad_rows.json` holds the two monsters' rows (`monster.bin` rows 254 and 256) and the seven moves (`monmagic.bin` 0x40c7 and 0x41da, `item.bin` 0x2011, 0x201a, 0x201d, 0x2020, 0x2023)
 * as `genfixture.mjs` read them from the Steam HD files (numbers only; `research/re-ffx2-yunas-ballad.md` §4 and §7), independently of the note's prose. This file compares them to the enemy data, the monster records and the
 * command records field by field; it also pins:
 *
 * 1. **The enemies**: level, HP, MP and the stat bytes; the element bytes (both null Gravity and are weak to nothing); no permanent status.
 * 2. **The ailments** [RE §4.2]: Death, Petrify, Silence, Poison, Curse and Eject immune, Stop and Doom immune, **Sleep, Darkness, Confusion, Berserk and Slow land** (the bytes read 0: that is what lets one girl answer the duels),
 *    every stat stage lands, the special word 0x3c3 on both.
 * 3. **The moves**: every row, the abilities' own fields consistent with them, the hit rule (hard rule 5: only the two Attacks roll), and the weak items of Rikku's record list left unbuilt on purpose (pick YB9).
 * 4. **The chain and the chapter**: two formations chained by `nextGroupId`, the second carries the whole party state and is the retry checkpoint (YB2), no Escape; the record, its metadata and its place in the registry.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { EnemyDef, FFX2CommandRecord } from '../../../src/battle/common/types.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { WRAITH_DOOR_CHAPTER, WRAITH_DOOR_WORD } from '../../../src/app/screens/frontend/wraithDoor.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { KILL_ITEM_ID } from '../../../src/battle/ffx2/adapt/kill-rewards.ts';
import { FFX2_YUNAS_BALLAD } from '../../../src/data/chapter-ffx2-yunas-ballad.ts';
import { YUNAS_BALLAD_META } from '../../../src/data/chapter-meta-ffx2-yunas-ballad.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_BOSS_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import { paineDuelGroup, rikkuDuelGroup, x2PossessedPaine, x2PossessedRikku, yunasBalladGroups } from '../../../src/data/ffx2/enemies/yunas-ballad.ts';
import { x2YunasBalladAbilities } from '../../../src/data/ffx2/enemies/yunas-ballad-abilities.ts';
import { COMMAND_RECORDS_YUNAS_BALLAD } from '../../../src/data/ffx2/command-records/yunas-ballad.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { KILL_REWARD_ROWS } from '../../../src/data/ffx2/monster-records/kill-rewards.ts';
import { MONSTER_RECORDS_YUNAS_BALLAD } from '../../../src/data/ffx2/monster-records/records-yunas-ballad.ts';
import * as ids from '../../../src/data/yunas-ballad-ids.ts';

interface MonsterRow {
  row: number; id: number; offset: number; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number;
  special: number; absorb: number; null: number; half: number; weak: number; autoStatus1: number; autoStatus2: number;
  exp: number; gil: number; pilfer: number; ap: number; dropByte: number; stealByte: number; zantetsu: number; dropItems: number[]; stealItems: number[]; waza: number[];
  resist1: Record<string, number>; resist2: Record<string, number>;
}
interface MoveRow {
  id: number; offset: number; costAtb: number; costCast: number; costMp: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number;
  crit: number; accuracy: number; power: number; hits: number; shatter: number; element: number; status1: Record<string, number>; status2: Record<string, number>;
}
interface Fixture {
  monsters: Record<string, MonsterRow>;
  moves: Record<string, MoveRow>;
  weakItems: Record<string, { id: number; formula: number; power: number; element: number; flagsTarget: number; flagsDamage: number }>;
}
const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx2/yunas_ballad_rows.json', import.meta.url)), 'utf8')) as Fixture;

const ENEMIES: Record<string, EnemyDef> = { 'x2-possessed-rikku': x2PossessedRikku, 'x2-possessed-paine': x2PossessedPaine };
const GROUP_OF: Record<string, string> = { 'x2-possessed-rikku': ids.RIKKU_DUEL_GROUP_ID, 'x2-possessed-paine': ids.PAINE_DUEL_GROUP_ID };
const numeric = (record: Record<string, number>): Record<number, number> => Object.fromEntries(Object.entries(record).map(([k, v]) => [Number(k), v]));
const resisted = (enemy: EnemyDef, status: string): number => (enemy.immunities as Record<string, number | undefined>)[status] ?? 0;

describe('the two monsters against the rows [RE §4.1]', () => {
  for (const [id, row] of Object.entries(FIXTURE.monsters)) {
    const enemy = ENEMIES[id]!;
    it(`${id}: level, HP, MP and the stat bytes are monster.bin row ${row.row} (offset ${row.offset})`, () => {
      expect(enemy.level).toBe(row.level);
      expect([enemy.hp, enemy.stats.hp, enemy.stats.maxHp]).toEqual([row.hp, row.hp, row.hp]);
      expect([enemy.mp, enemy.stats.mp, enemy.stats.maxMp]).toEqual([row.mp, row.mp, row.mp]);
      expect([enemy.stats.str, enemy.stats.def, enemy.stats.mag, enemy.stats.mdef]).toEqual([row.str, row.def, row.mag, row.mdef]);
      expect([enemy.stats.agi, enemy.stats.acc, enemy.stats.eva, enemy.stats.luck]).toEqual([row.agi, row.acc, row.eva, row.luck]);
    });

    it(`${id}: the rewards are the row's EXP, Gil, AP and Pilfer Gil; the drop byte is 255 and the steal byte ${row.stealByte}`, () => {
      expect([enemy.rewards.exp, enemy.rewards.gil, enemy.rewards.ap, enemy.rewards.stolenGil]).toEqual([row.exp, row.gil, row.ap, row.pilfer]);
      expect(row.dropByte).toBe(255);
      const record = MONSTER_RECORDS[`${GROUP_OF[id]}/${id}`]!;
      expect(record.stealByte).toBe(row.stealByte);
    });

    it(`${id}: the monster record is the row's (special word 0x${row.special.toString(16)}, Zantetsu ${row.zantetsu}, ACC ${row.acc}) and is laid on the enemy`, () => {
      const record = MONSTER_RECORDS[`${GROUP_OF[id]}/${id}`]!;
      expect(record).toBe(MONSTER_RECORDS_YUNAS_BALLAD[`${GROUP_OF[id]}/${id}`]);
      expect([record.row, record.table, record.acc, record.special, record.zantetsu, record.stealByte, record.stealGil]).toEqual([row.row, 1, row.acc, row.special, row.zantetsu, row.stealByte, row.pilfer]);
      expect(record.resist1).toEqual(numeric(row.resist1));
      expect(record.resist2).toEqual(numeric(row.resist2));
      expect(enemy.ffx2Record).toBe(record);
    });

    it(`${id}: the element bytes (absorb ${row.absorb}, null ${row.null}, half ${row.half}, weak ${row.weak}) are the enemy's affinities: Gravity only`, () => {
      expect(row.null).toBe(0x10);
      expect([row.absorb, row.half, row.weak]).toEqual([0, 0, 0]);
      expect(enemy.affinities).toEqual({ gravity: 'immune' });
    });

    it(`${id}: no permanent status, no Oversoul block (table 1 only)`, () => {
      expect([row.autoStatus1, row.autoStatus2]).toEqual([0, 0]);
      expect(enemy.autoStatuses).toBeUndefined();
      expect(MONSTER_RECORDS[`${GROUP_OF[id]}/${id}`]!.table).toBe(1);
    });
  }

  it('Rikku\'s record list holds the WEAK versions of the items and Paine\'s only Attack; the script throws the strong ones (the list is read for Confusion alone)', () => {
    expect(FIXTURE.monsters['x2-possessed-rikku']!.waza).toEqual([0x40c7, 0x2019, 0x201f, 0x2022, 0x201c, 0x2010]);
    expect(FIXTURE.monsters['x2-possessed-paine']!.waza).toEqual([0x41da]);
    // the five throws the script queues are NOT in the record list but for Spider Attack: 0x201a, 0x201d, 0x2020, 0x2023, 0x2011
    for (const id of [0x201a, 0x201d, 0x2020, 0x2023, 0x2011]) expect(FIXTURE.monsters['x2-possessed-rikku']!.waza, `0x${id.toString(16)}`).not.toContain(id);
  });

  it('the kill rewards are the rows\' own: EXP 800, AP 3, gil 200, drop byte 255; Paine drops a Champion Belt (0x901a), Rikku\'s Black Lore (0x9066) has no item in this repo and is 0', () => {
    const rikku = KILL_REWARD_ROWS[`${ids.RIKKU_DUEL_GROUP_ID}/${ids.X2_POSSESSED_RIKKU_ID}`]!;
    const paine = KILL_REWARD_ROWS[`${ids.PAINE_DUEL_GROUP_ID}/${ids.X2_POSSESSED_PAINE_ID}`]!;
    expect([rikku.row, rikku.exp, rikku.ap, rikku.gil, rikku.dropByte, [...rikku.drop]]).toEqual([254, 800, 3, 200, 255, [0, 0, 0, 0]]);
    expect([paine.row, paine.exp, paine.ap, paine.gil, paine.dropByte, [...paine.drop]]).toEqual([256, 800, 3, 200, 255, [0x901a, 1, 0x901a, 1]]);
    expect(FIXTURE.monsters['x2-possessed-rikku']!.dropItems).toEqual([0x9066, 1, 0x9066, 1]);
    expect(FIXTURE.monsters['x2-possessed-paine']!.dropItems).toEqual([0x901a, 1, 0x901a, 1]);
    expect(KILL_ITEM_ID[0x901a]).toBe('champion-belt');
    expect(x2PossessedPaine.rewards.drops).toEqual([{ itemId: 'champion-belt', count: 1 }]);
    expect(x2PossessedRikku.rewards.drops).toEqual([]);
  });
});

describe('the ailments and the special word [RE §4.2]', () => {
  it('both are immune to Death, Petrify, Silence, Poison, Curse, Eject, Stop and Doom', () => {
    for (const enemy of Object.values(ENEMIES)) {
      for (const status of ['ko', 'petrify', 'silence', 'poison', 'curse', 'eject', 'stop', 'doom']) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(255);
    }
  });

  it('Sleep, Darkness, Confusion, Berserk and Slow LAND on both (the bytes read 0), and so do Reflect, Shell, Protect, Regen, Haste and all seven stat stages: this is what makes the duels answerable by one girl', () => {
    const stages = ['str', 'mag', 'def', 'mdef', 'accu', 'eva', 'luck'].flatMap((s) => [`${s}-up`, `${s}-down`]);
    for (const enemy of Object.values(ENEMIES)) {
      for (const status of ['sleep', 'darkness', 'confuse', 'berserk', 'slow', 'reflect', 'shell', 'protect', 'regen', 'haste', ...stages]) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(0);
    }
    for (const row of Object.values(FIXTURE.monsters)) {
      for (const slot of ['2', '4', '6', '7']) expect(row.resist1[slot], `group 1 slot ${slot}`).toBeUndefined(); // Sleep, Darkness, Confusion, Berserk
      expect(row.resist2['5']).toBeUndefined(); // Slow
    }
  });

  it('special word 0x3c3 on both (bits 0, 1, 6, 7, 8, 9): the percent formulas do nothing, no ATB damage, no Interrupt, so the delay-lock does not work on them', () => {
    const SPECIAL_NO_ATB_DAMAGE = 1 << 6;
    const SPECIAL_NO_INTERRUPT = 1 << 9;
    for (const enemy of Object.values(ENEMIES)) {
      const word = enemy.ffx2Record!.special;
      expect(word, enemy.id).toBe(0x3c3);
      expect(word & SPECIAL_NO_ATB_DAMAGE, enemy.id).not.toBe(0);
      expect(word & SPECIAL_NO_INTERRUPT, enemy.id).not.toBe(0);
      expect(enemy.immunityFlags, enemy.id).toEqual(expect.arrayContaining(['boss', 'immune-to-percentage-damage', 'immune-to-delay']));
      expect(resisted(enemy, 'action-cancel'), enemy.id).toBe(255);
      expect(resisted(enemy, 'delay-effect'), enemy.id).toBe(255);
    }
  });
});

describe('the moves against the rows [RE §7]', () => {
  for (const [id, row] of Object.entries(FIXTURE.moves)) {
    it(`${id}: the command record is row 0x${row.id.toString(16)} (offset ${row.offset}) field for field`, () => {
      const record: FFX2CommandRecord = COMMAND_RECORDS_YUNAS_BALLAD[id]!;
      expect(record, id).toBeDefined();
      expect(FFX2_COMMAND_RECORDS[id]).toBe(record);
      expect(
        [record.id, record.costAtb, record.costCast, record.flagsTarget, record.flagsMisc, record.flagsDamage, record.damageClass, record.formula, record.critByte, record.accuracy, record.power, record.hits, record.shatter, record.element],
      ).toEqual([row.id, row.costAtb, row.costCast, row.flagsTarget, row.flagsMisc, row.flagsDamage, row.damageClass, row.formula, row.crit, row.accuracy, row.power, row.hits, row.shatter, row.element]);
      expect(record.status1, id).toBeUndefined(); // none of the seven carries a status
      expect(row.status1, id).toEqual({});
      expect(row.status2, id).toEqual({});
      const ability = x2YunasBalladAbilities.find((a) => a.id === id)!;
      expect(ability, id).toBeDefined();
      expect(ability.mpCost).toBe(row.costMp);
      expect(ability.hits).toBe(row.hits);
      expect(ability.power).toBe(row.power);
    });
  }

  it('what the rows say: Spider Attack is two hits of power 16, the four throws are formula 8 power 6 on one girl with no type bit, Grenade is formula 8 power 4 on the party and physical, Paine\'s Attack is one hit of power 16', () => {
    const r = COMMAND_RECORDS_YUNAS_BALLAD;
    expect([r['x2-possessed-rikku-spider-attack']!.hits, r['x2-possessed-rikku-spider-attack']!.power, r['x2-possessed-rikku-spider-attack']!.formula]).toEqual([2, 16, 0]);
    for (const id of ['bomb-core', 'arctic-wind', 'lightning-marble', 'dragon-scale']) {
      const row = r[`x2-possessed-rikku-${id}`]!;
      expect([row.formula, row.power, row.flagsDamage & 3, row.flagsTarget & 0x4, row.costAtb, row.costCast], id).toEqual([8, 6, 0, 0, 40, 40]); // no Shell/Protect bit, one target
    }
    expect([r['x2-possessed-rikku-bomb-core']!.element, r['x2-possessed-rikku-arctic-wind']!.element, r['x2-possessed-rikku-lightning-marble']!.element, r['x2-possessed-rikku-dragon-scale']!.element]).toEqual([1, 2, 4, 8]);
    const grenade = r['x2-possessed-rikku-grenade']!;
    expect([grenade.formula, grenade.power, grenade.flagsDamage & 3, (grenade.flagsTarget & 0x4) !== 0]).toEqual([8, 4, 1, true]);
    const attack = r['x2-possessed-paine-attack']!;
    expect([attack.formula, attack.power, attack.hits, attack.critByte, attack.shatter, attack.costAtb, attack.costCast]).toEqual([0, 16, 1, 5, 10, 100, 0]);
  });

  it('the ability definitions agree with their rows where the engine reads the definition: the damage type follows the row\'s damage flags, the elements are Fire, Ice, Thunder and Water, Grenade hits the whole party', () => {
    const ability = (id: string) => x2YunasBalladAbilities.find((a) => a.id === id)!;
    for (const [id, row] of Object.entries(FIXTURE.moves)) {
      const expected = row.flagsDamage & 1 ? 'physical' : row.flagsDamage & 2 ? 'magical' : 'other';
      expect(ability(id).damageType, `${id} (damage flags 0x${row.flagsDamage.toString(16)})`).toBe(expected);
    }
    expect(['bomb-core', 'arctic-wind', 'lightning-marble', 'dragon-scale'].map((n) => ability(`x2-possessed-rikku-${n}`).element)).toEqual([['fire'], ['ice'], ['lightning'], ['water']]);
    expect(ability('x2-possessed-rikku-grenade').targeting).toBe('all-enemies');
    for (const id of Object.keys(FIXTURE.moves).filter((n) => n !== 'x2-possessed-rikku-grenade')) expect(ability(id).targeting, id).toBe('single-enemy');
  });

  it('the abilities are the data catalog\'s (ALL_BOSS_ABILITIES), none is missing a command record, and the ids are unique', () => {
    for (const ability of x2YunasBalladAbilities) {
      expect(ALL_BOSS_ABILITIES, ability.id).toContain(ability);
      expect(COMMAND_RECORDS_YUNAS_BALLAD[ability.id], ability.id).toBeDefined();
    }
    expect(x2YunasBalladAbilities).toHaveLength(7);
    expect(new Set(x2YunasBalladAbilities.map((a) => a.id)).size).toBe(7);
    for (const id of Object.keys(COMMAND_RECORDS_YUNAS_BALLAD)) expect(x2YunasBalladAbilities.some((a) => a.id === id), id).toBe(true);
    expect(Object.keys(COMMAND_RECORDS_YUNAS_BALLAD).sort()).toEqual(Object.keys(FIXTURE.moves).sort());
  });

  it('hit rule (rule 5): only the two Attacks roll to hit (accuracy formula 1 on Spider Attack with base 95, formula 2 on Paine with her own ACC 95); the five thrown items carry canMiss false, set explicitly (accuracy formula 0)', () => {
    const rolls = x2YunasBalladAbilities.filter((a) => a.canMiss === true).map((a) => a.id);
    expect(rolls.sort()).toEqual(['x2-possessed-paine-attack', 'x2-possessed-rikku-spider-attack']);
    for (const ability of x2YunasBalladAbilities.filter((a) => !rolls.includes(a.id))) expect(ability.canMiss, ability.id).toBe(false);
    expect([COMMAND_RECORDS_YUNAS_BALLAD['x2-possessed-rikku-spider-attack']!, COMMAND_RECORDS_YUNAS_BALLAD['x2-possessed-paine-attack']!].map((r) => [(r.flagsMisc >> 3) & 7, r.accuracy])).toEqual([[1, 95], [2, 95]]);
    for (const ability of x2YunasBalladAbilities.filter((a) => !rolls.includes(a.id))) expect((COMMAND_RECORDS_YUNAS_BALLAD[ability.id]!.flagsMisc >> 3) & 7, ability.id).toBe(0);
  });

  it('every enemy lists exactly the abilities its script uses', () => {
    expect([...x2PossessedRikku.abilityIds].sort()).toEqual([
      'x2-possessed-rikku-arctic-wind', 'x2-possessed-rikku-bomb-core', 'x2-possessed-rikku-dragon-scale', 'x2-possessed-rikku-grenade', 'x2-possessed-rikku-lightning-marble', 'x2-possessed-rikku-spider-attack',
    ]);
    expect([...x2PossessedPaine.abilityIds]).toEqual(['x2-possessed-paine-attack']);
  });

  it('YB9: the weak items of Rikku\'s record list are on record in the fixture (formula 16: power 80, and 20 for the Budget Grenade) and are NOT authored, because the engine leaves a Confused monster to its script', () => {
    expect(Object.values(FIXTURE.weakItems).map((w) => [w.formula, w.power])).toEqual([[16, 80], [16, 80], [16, 80], [16, 80], [16, 20]]);
    for (const w of Object.values(FIXTURE.weakItems)) expect(Object.values(COMMAND_RECORDS_YUNAS_BALLAD).some((r) => r.id === w.id), `0x${w.id.toString(16)}`).toBe(false);
  });
});

describe('the chain: two formations, HP and MP carried (YB1, YB2)', () => {
  it('the duels chain by nextGroupId (Rikku, then Paine) and are registered by id', () => {
    expect(yunasBalladGroups.map((g) => g.id)).toEqual([...ids.YUNAS_BALLAD_GROUP_IDS]);
    expect(yunasBalladGroups.map((g) => g.nextGroupId)).toEqual([ids.PAINE_DUEL_GROUP_ID, undefined]);
    for (const group of yunasBalladGroups) expect(ENEMY_GROUPS_BY_ID[group.id], group.id).toBe(group);
    expect(yunasBalladGroups.map((g) => g.enemies.map((e) => e.id))).toEqual([['x2-possessed-rikku'], ['x2-possessed-paine']]);
    for (const group of yunasBalladGroups) {
      expect(group.game).toBe('ffx2');
      expect(group.parts).toBeUndefined();
      expect(group.canEscape).toBe(false);
      expect(group.musicCues).toEqual([{ at: 'start', track: 'boss-den-of-woe', fadeMs: 800 }]);
    }
  });

  it('duel 2 carries the whole party state (HP, MP and statuses) and is the retry checkpoint; duel 1 does neither, and neither restores the party or shows a Save Sphere card', () => {
    expect([rikkuDuelGroup.carriesFullPartyState, paineDuelGroup.carriesFullPartyState]).toEqual([undefined, true]);
    expect([rikkuDuelGroup.checkpointOnEntry, paineDuelGroup.checkpointOnEntry]).toEqual([undefined, true]);
    for (const group of yunasBalladGroups) {
      expect(group.restoresPartyOnEntry, group.id).toBeUndefined();
      expect(group.noSaveSphereCard, group.id).toBeUndefined();
      expect(group.hopelessRetry, group.id).toBeUndefined();
    }
  });

  it('the scripts the enemies name are registered and the ids file agrees', () => {
    for (const enemy of Object.values(ENEMIES)) expect(aiScriptFor(enemy.aiScriptId).id, enemy.id).toBe(enemy.aiScriptId);
    expect(ids.YUNAS_BALLAD_BODY_IDS).toEqual(['x2-possessed-rikku', 'x2-possessed-paine']);
    expect(ids.POSSESSED_RIKKU_SCRIPT_ID).toBe(x2PossessedRikku.aiScriptId);
    expect(ids.POSSESSED_PAINE_SCRIPT_ID).toBe(x2PossessedPaine.aiScriptId);
  });

  it('the paintings are the possessed sets (r76b art install): `x2-possessed-rikku` and `x2-possessed-paine`, mirrored and cold-tinted copies of the party\'s own sets that already face left (no longer the party\'s `rikku` and `paine-warrior`, which the presenter mirrored)', () => {
    expect([x2PossessedRikku.spriteKey, x2PossessedPaine.spriteKey]).toEqual(['x2-possessed-rikku', 'x2-possessed-paine']);
    expect([x2PossessedRikku.forms[0]!.spriteKey, x2PossessedPaine.forms[0]!.spriteKey]).toEqual(['x2-possessed-rikku', 'x2-possessed-paine']);
  });
});

describe('the chapter record and its place in the registry', () => {
  it('is hidden: number 40, experimental, FFX-2, the Den of Woe\'s stage, Yuna alone, the Den\'s cue and the shared words', () => {
    expect(FFX2_YUNAS_BALLAD).toMatchObject({ id: 'ffx2-yunas-ballad', game: 'ffx2', number: 40, experimental: true, sceneKey: 'den-of-woe' });
    expect(FFX2_YUNAS_BALLAD.enemyGroupRef).toBe(rikkuDuelGroup);
    expect(FFX2_YUNAS_BALLAD.buildRef.game).toBe('ffx2');
    expect(FFX2_YUNAS_BALLAD.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-den-of-woe', victory: 'victory-ffx2' });
    expect(Object.keys(FFX2_YUNAS_BALLAD.sensorTexts).sort()).toEqual(['x2-possessed-paine', 'x2-possessed-rikku']);
    expect(FFX2_YUNAS_BALLAD.sensorTexts['x2-possessed-rikku']).toBe(x2PossessedRikku.sensorText);
    expect(FFX2_YUNAS_BALLAD.sensorTexts['x2-possessed-paine']).toBe(x2PossessedPaine.sensorText);
  });

  it('getChapter finds it; it is in EXPERIMENT_CHAPTERS and in neither CHAPTERS nor CHAPTER_IDS (the board and every chapter-generic suite stay at nineteen)', () => {
    expect(getChapter(ids.YUNAS_BALLAD_ID)).toBe(FFX2_YUNAS_BALLAD);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_YUNAS_BALLAD);
    expect(CHAPTERS.map((c) => c.id)).not.toContain(ids.YUNAS_BALLAD_ID);
    expect(CHAPTER_IDS as readonly string[]).not.toContain(ids.YUNAS_BALLAD_ID);
  });

  it('its pause metadata is registered, hidden numeral EXP, three objectives and three snapshots, and the card\'s words are the record\'s', () => {
    expect(UNLISTED_CHAPTER_META).toContain(YUNAS_BALLAD_META);
    expect(YUNAS_BALLAD_META).toMatchObject({ id: ids.YUNAS_BALLAD_ID, gameLabel: 'FFX-2', numeral: 'EXP', title: FFX2_YUNAS_BALLAD.title, location: FFX2_YUNAS_BALLAD.location, blurb: FFX2_YUNAS_BALLAD.blurb });
    expect(YUNAS_BALLAD_META.objectives.map((o) => o.id)).toEqual(['survive-the-grenade', 'free-rikku', 'free-paine']);
    expect(YUNAS_BALLAD_META.snapshots).toHaveLength(3);
    expect(YUNAS_BALLAD_META.musicKeys).toEqual(['scene-bevelle-underground', 'boss-den-of-woe', 'victory-ffx2']);
  });

  it('its door is the word wraith, a row of the table (the last one when it was added), and leads to it', () => {
    expect(WRAITH_DOOR_WORD).toBe('wraith');
    expect(WRAITH_DOOR_CHAPTER).toBe(ids.YUNAS_BALLAD_ID);
    expect(CHAPTER_DOORS).toContainEqual({ word: 'wraith', chapter: 'ffx2-yunas-ballad' });
  });
});
