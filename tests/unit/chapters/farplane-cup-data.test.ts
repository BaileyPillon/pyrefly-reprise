/**
 * The Farplane Cup (the Fiend Arena's three duels: Auron, Tidus and Seymour; the hidden FFX-2 chapter): the data against the game's own rows. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `tests/fixtures/parity/ffx2/farplane_cup_rows.json` holds the three duelists' rows (`monster.bin` rows 311, 317 and 319) and the 33 moves their scripts queue (`monmagic.bin`, `command.bin`, `item.bin`), decoded from the
 * kernel tables by a script (`research/re-ffx2-farplane-cup.md` §4 and §7), numbers only. This file compares them to the enemy data, the monster records and the command records field by field; it also pins:
 *
 * 1. **The enemies**: level, HP, MP and the stat bytes; the element bytes (Seymour absorbs Fire, Ice, Thunder, Water and Gravity and is weak to Holy; Auron and Tidus have none); the permanent status (Spellspring on all three).
 * 2. **The ailments** [RE §4.1]: the group-1 and group-2 resist bytes (Silence 250 on Auron, Darkness 250 on Seymour, Reflect 255 on Tidus), the special words with the no-ATB-damage and Interrupt bits set on all three.
 * 3. **The moves**: every row, the abilities' own fields consistent with them, the hit rule (hard rule 5) and the rows the repo already holds under other names (Demi, Curaga, Dispel, Shell, Protect, Break, Confuse,
 *    Black Sky, Mega-Potion, X-Potion, Hero Drink), which must be these rows.
 * 4. **The chain and the chapter**: three formations chained by `nextGroupId`, links 2 and 3 restore the party with no Save Sphere card, no Escape; the chapter record, its pause metadata, its door word and its place in the
 *    registry; the kill-reward rows; and the hygiene of the files this lane added (no local path, scratch name or account name).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { EnemyDef, FFX2CommandRecord } from '../../../src/battle/common/types.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { DUELIST_DOOR_CHAPTER, DUELIST_DOOR_WORD } from '../../../src/app/screens/frontend/duelistDoor.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { FFX2_FARPLANE_CUP } from '../../../src/data/chapter-ffx2-farplane-cup.ts';
import { FARPLANE_CUP_META } from '../../../src/data/chapter-meta-ffx2-farplane-cup.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID, ALL_BOSS_ABILITIES } from '../../../src/data/ffx2/enemies/index.ts';
import { duel1AuronGroup, duel2TidusGroup, duel3SeymourGroup, farplaneCupGroups, x2CupAuron, x2CupSeymour, x2CupTidus } from '../../../src/data/ffx2/enemies/farplane-cup.ts';
import { CUP_ABILITY, x2FarplaneCupAbilities } from '../../../src/data/ffx2/enemies/farplane-cup-abilities.ts';
import { farplaneCupBuild } from '../../../src/data/ffx2/builds/farplane-cup.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { COMMAND_RECORDS_FARPLANE_CUP } from '../../../src/data/ffx2/command-records/farplane-cup.ts';
import { MONSTER_RECORDS, KILL_REWARD_ROWS } from '../../../src/data/ffx2/monster-records/index.ts';
import { MONSTER_RECORDS_FARPLANE_CUP } from '../../../src/data/ffx2/monster-records/records-farplane-cup.ts';
import * as ids from '../../../src/data/farplane-cup-ids.ts';

interface MonsterRow {
  row: number; id: number; offset: number; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number;
  special: number; absorb: number; null: number; half: number; weak: number; autoStatus1: number; autoStatus2: number;
  exp: number; gil: number; pilfer: number; ap: number; dropByte: number; stealByte: number; zantetsu: number;
  resist1: Record<string, number>; resist2: Record<string, number>;
  waza: number[]; dropItems: number[]; stealItems: number[]; bribeItems: number[];
}
interface MoveRow {
  id: number; offset: number; costAtb: number; costCast: number; costMp: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number;
  crit: number; accuracy: number; power: number; hits: number; shatter: number; element: number; category: number;
}
interface Fixture {
  monsters: Record<string, MonsterRow>;
  moves: Record<string, MoveRow>;
  statuses: Record<string, { status1?: Record<string, number>; status2?: Record<string, number>; statusTime?: Record<string, number> }>;
}
const here = (path: string): string => fileURLToPath(new URL(path, import.meta.url));
const FIXTURE = JSON.parse(readFileSync(here('../../fixtures/parity/ffx2/farplane_cup_rows.json'), 'utf8')) as Fixture;

const ENEMIES: Record<string, EnemyDef> = { 'x2-cup-auron': x2CupAuron, 'x2-cup-tidus': x2CupTidus, 'x2-cup-seymour': x2CupSeymour };
const GROUP_OF: Record<string, string> = { 'x2-cup-auron': ids.DUEL_1_GROUP_ID, 'x2-cup-tidus': ids.DUEL_2_GROUP_ID, 'x2-cup-seymour': ids.DUEL_3_GROUP_ID };
const numeric = (record: Record<string, number>): Record<number, number> => Object.fromEntries(Object.entries(record).map(([k, v]) => [Number(k), v]));
const SPECIAL_NO_ATB_DAMAGE = 1 << 6;
const SPECIAL_NO_INTERRUPT = 1 << 9;

describe('the three duelists against the rows [RE §4.1]', () => {
  for (const [id, row] of Object.entries(FIXTURE.monsters)) {
    const enemy = ENEMIES[id]!;
    it(`${id}: level, HP, MP and the stat bytes are monster.bin row ${row.row} (offset ${row.offset})`, () => {
      expect(enemy.level).toBe(row.level);
      expect([enemy.hp, enemy.stats.hp, enemy.stats.maxHp]).toEqual([row.hp, row.hp, row.hp]);
      expect([enemy.mp, enemy.stats.mp, enemy.stats.maxMp]).toEqual([row.mp, row.mp, row.mp]);
      expect([enemy.stats.str, enemy.stats.def, enemy.stats.mag, enemy.stats.mdef]).toEqual([row.str, row.def, row.mag, row.mdef]);
      expect([enemy.stats.agi, enemy.stats.acc, enemy.stats.eva, enemy.stats.luck]).toEqual([row.agi, row.acc, row.eva, row.luck]);
      expect(enemy.forms.map((f) => f.hp)).toEqual([row.hp]);
    });

    it(`${id}: the rewards are the row's EXP, Gil, AP and Pilfer Gil, the common drop and steal items are the row's, and the steal byte is ${row.stealByte}`, () => {
      expect([enemy.rewards.exp, enemy.rewards.gil, enemy.rewards.ap, enemy.rewards.stolenGil]).toEqual([row.exp, row.gil, row.ap, row.pilfer]);
      expect(enemy.rewards.steal?.stealRate).toBe(row.stealByte);
      expect(row.dropByte).toBe(255);
      // The catalog's ids for the numbered items (0x2001 Hi-Potion, 0x2002 X-Potion, 0x2005 Turbo Ether, 0x2007 Mega Phoenix, 0x2008 Elixir).
      const NAME: Record<number, string> = { 0x2001: 'x2-hi-potion', 0x2002: 'x2-x-potion', 0x2005: 'x2-turbo-ether', 0x2007: 'x2-mega-phoenix', 0x2008: 'x2-elixir' };
      expect(enemy.rewards.drops).toEqual([{ itemId: NAME[row.dropItems[0]!], count: row.dropItems[1] }]);
      expect(enemy.rewards.steal?.common).toEqual({ itemId: NAME[row.stealItems[0]!], count: row.stealItems[1] });
      expect(enemy.rewards.steal?.rare).toEqual({ itemId: NAME[row.stealItems[2]!], count: row.stealItems[3] });
    });

    it(`${id}: the monster record is the row's (special word 0x${row.special.toString(16)}, Zantetsu ${row.zantetsu}, ACC ${row.acc}) and is laid on the enemy`, () => {
      const record = MONSTER_RECORDS[`${GROUP_OF[id]}/${id}`]!;
      expect(record).toBe(MONSTER_RECORDS_FARPLANE_CUP[`${GROUP_OF[id]}/${id}`]);
      expect([record.row, record.table, record.acc, record.special, record.zantetsu, record.stealByte, record.stealGil]).toEqual([row.row, 1, row.acc, row.special, row.zantetsu, row.stealByte, row.pilfer]);
      expect(record.resist1).toEqual(numeric(row.resist1));
      expect(record.resist2).toEqual(numeric(row.resist2));
      expect(record.steal).toEqual(row.stealItems);
      expect(record.bribe).toEqual(row.bribeItems);
      expect(enemy.ffx2Record).toBe(record);
    });

    it(`${id}: Spellspring (the group-1 mask ${row.autoStatus1}) is its permanent status and nothing else is`, () => {
      expect(row.autoStatus1).toBe(0x2000); // slot 13: Use MP 0
      expect(row.autoStatus2).toBe(0);
      expect(enemy.autoStatuses).toEqual(['spellspring']);
    });
  }

  it('the element bytes: Seymour absorbs Fire, Ice, Thunder, Water and Gravity (0x1f) and is weak to Holy (0x20); Auron and Tidus have none', () => {
    const seymour = FIXTURE.monsters['x2-cup-seymour']!;
    expect([seymour.absorb, seymour.null, seymour.half, seymour.weak]).toEqual([0x1f, 0, 0, 0x20]);
    expect(x2CupSeymour.affinities).toEqual({ fire: 'absorb', ice: 'absorb', lightning: 'absorb', water: 'absorb', gravity: 'absorb', holy: 'weak' });
    for (const id of ['x2-cup-auron', 'x2-cup-tidus']) {
      const row = FIXTURE.monsters[id]!;
      expect([row.absorb, row.null, row.half, row.weak], id).toEqual([0, 0, 0, 0]);
      expect(ENEMIES[id]!.affinities, id).toEqual({});
    }
  });

  it('the Oversoul versions are NOT used: every record is table 1 (monster.bin), none of monster2.bin', () => {
    for (const record of Object.values(MONSTER_RECORDS_FARPLANE_CUP)) expect(record.table).toBe(1);
  });

  it('the identities: row 317 is the masked name (four identical unmapped bytes in the table), shown "????" in the fight (DU3); the other two are named', () => {
    expect([x2CupAuron.name, x2CupTidus.name, x2CupSeymour.name]).toEqual(['Auron', ids.CUP_TIDUS_MASK, 'Seymour']);
    expect(ids.CUP_TIDUS_MASK).toBe('????');
    expect(x2CupTidus.forms[0]!.name).toBe(ids.CUP_TIDUS_MASK);
    // The real name stays out of every string the player reads during the fight (the story names him after it).
    for (const text of [x2CupTidus.sensorText, x2CupTidus.scanText, FFX2_FARPLANE_CUP.sensorTexts[ids.X2_CUP_TIDUS_ID]]) expect(text, 'a masked name must not be spoiled').not.toMatch(/tidus/i);
  });
});

describe('the ailments and the special words [RE §4.1, §6.6]', () => {
  const resisted = (enemy: EnemyDef, status: string): number => (enemy.immunities as Record<string, number | undefined>)[status] ?? 0;

  it('all three are immune to Death, Petrify, Sleep, Poison, Confusion, Berserk, Curse, Eject, Slow, Stop and Doom', () => {
    for (const enemy of Object.values(ENEMIES)) {
      for (const status of ['ko', 'petrify', 'sleep', 'poison', 'confuse', 'berserk', 'curse', 'eject', 'slow', 'stop', 'doom']) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(255);
    }
  });

  it('Silence reads 250 on Auron, Darkness 250 on Seymour (a byte that lets a high-chance status land), 255 elsewhere; Reflect is immune on Tidus alone', () => {
    expect([x2CupAuron, x2CupTidus, x2CupSeymour].map((e) => resisted(e, 'silence'))).toEqual([250, 255, 255]);
    expect([x2CupAuron, x2CupTidus, x2CupSeymour].map((e) => resisted(e, 'darkness'))).toEqual([255, 255, 250]);
    expect([x2CupAuron, x2CupTidus, x2CupSeymour].map((e) => resisted(e, 'reflect'))).toEqual([0, 255, 0]);
    for (const enemy of Object.values(ENEMIES)) for (const status of ['shell', 'protect', 'regen', 'haste']) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(0);
  });

  it('no stat stage is resisted: the girls\' Full Break-style stat changes (Power Break and the like) land on all three', () => {
    const stages = ['str', 'mag', 'def', 'mdef', 'accu', 'eva', 'luck'].flatMap((s) => [`${s}-up`, `${s}-down`]);
    for (const enemy of Object.values(ENEMIES)) for (const status of stages) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(0);
  });

  it('special words 0x3db, 0x3db and 0x2db: the no-ATB-damage and Interrupt bits are set on all three (delay and Interrupt do nothing), and so is bit 0 (the percent formulas do nothing); Seymour lacks the Bribe bit', () => {
    const word = (e: EnemyDef): number => e.ffx2Record!.special;
    expect([word(x2CupAuron), word(x2CupTidus), word(x2CupSeymour)]).toEqual([0x3db, 0x3db, 0x2db]);
    for (const enemy of Object.values(ENEMIES)) {
      expect(word(enemy) & SPECIAL_NO_ATB_DAMAGE, enemy.id).not.toBe(0);
      expect(word(enemy) & SPECIAL_NO_INTERRUPT, enemy.id).not.toBe(0);
      expect(word(enemy) & 1, enemy.id).toBe(1);
      expect(enemy.immunityFlags, enemy.id).toEqual(['boss', 'immune-to-percentage-damage', 'immune-to-delay']);
      expect(resisted(enemy, 'action-cancel'), enemy.id).toBe(255);
      expect(resisted(enemy, 'delay-effect'), enemy.id).toBe(255);
    }
    expect(word(x2CupAuron) & (1 << 8)).not.toBe(0);
    expect(word(x2CupSeymour) & (1 << 8)).toBe(0);
  });
});

describe('the moves against the rows [RE §7]', () => {
  for (const [id, row] of Object.entries(FIXTURE.moves)) {
    it(`${id}: the command record is row 0x${row.id.toString(16)} (offset ${row.offset}) field for field`, () => {
      const record: FFX2CommandRecord = COMMAND_RECORDS_FARPLANE_CUP[id]!;
      expect(record, id).toBeDefined();
      expect(FFX2_COMMAND_RECORDS[id]).toBe(record);
      expect(
        [record.id, record.costAtb, record.costCast, record.category, record.flagsTarget, record.flagsMisc, record.flagsDamage, record.damageClass, record.formula, record.critByte, record.accuracy, record.power, record.hits, record.shatter, record.element, record.killer],
      ).toEqual([row.id, row.costAtb, row.costCast, row.category, row.flagsTarget, row.flagsMisc, row.flagsDamage, row.damageClass, row.formula, row.crit, row.accuracy, row.power, row.hits, row.shatter, row.element, 0]);
      const ability = x2FarplaneCupAbilities.find((a) => a.id === id)!;
      expect(ability, id).toBeDefined();
      expect(ability.mpCost).toBe(row.costMp);
      expect(ability.hits).toBe(row.hits);
      expect(ability.power, `${id}: the ability's power is the row's`).toBe(row.power);
    });
  }

  it('the status bytes of every row that carries one are the row\'s: Shooting Star Eject 254; Full Break the four stages at -2; Shin Zantetsu Death 80; Hastega Haste 254 for 40; Break Petrify 80; Slowga Slow 130 for 126', () => {
    for (const [id, status] of Object.entries(FIXTURE.statuses)) {
      const record = COMMAND_RECORDS_FARPLANE_CUP[id]!;
      expect(record.status1, id).toEqual(status.status1 === undefined ? undefined : numeric(status.status1));
      expect(record.status2, id).toEqual(status.status2 === undefined ? undefined : numeric(status.status2));
      expect(record.statusTime, id).toEqual(status.statusTime === undefined ? undefined : numeric(status.statusTime));
    }
    const r = COMMAND_RECORDS_FARPLANE_CUP;
    expect(r['x2-auron-shooting-star']!.status1).toEqual({ 10: 254 });
    expect(r['x2-auron-full-break']!.status2).toEqual({ 7: 100, 8: 100, 9: 100, 10: 100 });
    expect(r['x2-auron-full-break']!.statusTime).toEqual({ 7: -2, 8: -2, 9: -2, 10: -2 });
    expect(r['x2-auron-shin-zantetsu']!.status1).toEqual({ 0: 80 });
    expect(r['x2-tidus-hastega']!.status2).toEqual({ 4: 254 });
    expect(r['x2-tidus-hastega']!.statusTime).toEqual({ 4: 40 });
    expect(r['x2-seymour-break']!.status1).toEqual({ 1: 80 });
    expect(r['x2-seymour-slowga']!.status2).toEqual({ 5: 130 });
  });

  it('the accuracy formulas (misc word bits 3 to 5): 3 for Shooting Star; 2 (the race with ACC) for the three Attacks, Full Break, Shin Zantetsu, Delay Buster and Drain Attack; 0 for the rest', () => {
    const formula = (id: string): number => (COMMAND_RECORDS_FARPLANE_CUP[id]!.flagsMisc >> 3) & 7;
    expect(formula('x2-auron-shooting-star')).toBe(3);
    const race = ['x2-auron-attack', 'x2-tidus-attack', 'x2-seymour-attack', 'x2-auron-full-break', 'x2-auron-shin-zantetsu', 'x2-tidus-delay-buster', 'x2-seymour-drain-attack'];
    for (const id of race) expect(formula(id), id).toBe(2);
    for (const id of Object.keys(COMMAND_RECORDS_FARPLANE_CUP).filter((k) => !race.includes(k) && k !== 'x2-auron-shooting-star')) expect(formula(id), id).toBe(0);
  });

  it('the multi-hit rows: Blitz Ace nine hits of power 10; Black Sky ten of power 6 and Meteor twelve of power 8 (both with the random-target bit, spread over the girls)', () => {
    const r = COMMAND_RECORDS_FARPLANE_CUP;
    expect([r['x2-tidus-blitz-ace']!.hits, r['x2-tidus-blitz-ace']!.power]).toEqual([9, 10]);
    expect([r['x2-seymour-black-sky']!.hits, r['x2-seymour-black-sky']!.power]).toEqual([10, 6]);
    expect([r['x2-seymour-meteor']!.hits, r['x2-seymour-meteor']!.power]).toEqual([12, 8]);
    expect(r['x2-seymour-black-sky']!.flagsMisc & 0x4000).toBe(0x4000);
    expect(r['x2-seymour-meteor']!.flagsMisc & 0x4000).toBe(0x4000);
    expect(r['x2-seymour-meteor']!.flagsMisc & 0x80, 'Meteor is not reflectable').toBe(0);
    expect(r['x2-auron-shooting-star']!.flagsMisc & 0x80, 'Shooting Star is not reflectable').toBe(0);
  });

  it('the rows the repo already holds under other names are these rows (the party table\'s Demi, Curaga, Dispel, Shell, Protect, Break, Confuse and Black Sky; the item table\'s Mega-Potion, X-Potion and Hero Drink): a second witness', () => {
    const same: Array<[string, string]> = [
      ['x2-seymour-demi', 'x2-dark-knight-demi'],
      ['x2-seymour-curaga', 'x2-white-mage-curaga'],
      ['x2-seymour-dispel', 'x2-white-mage-dispel'],
      ['x2-seymour-dispel-self', 'x2-white-mage-dispel'],
      ['x2-seymour-shell', 'x2-white-mage-shell'],
      ['x2-seymour-protect', 'x2-white-mage-protect'],
      ['x2-seymour-break', 'x2-dark-knight-break'],
      ['x2-seymour-confuse', 'x2-dark-knight-confuse'],
      ['x2-seymour-black-sky', 'x2-dark-knight-black-sky'],
      ['x2-auron-mega-potion', 'x2-item-mega-potion'],
      ['x2-tidus-mega-potion', 'x2-item-mega-potion'],
      ['x2-auron-x-potion', 'x2-item-x-potion'],
      ['x2-tidus-hero-drink', 'x2-item-hero-drink'],
      ['x2-seymour-magic-up', 'x2-black-elemental-magic-up'],
    ];
    for (const [ours, theirs] of same) expect(FFX2_COMMAND_RECORDS[ours], `${ours} = ${theirs}`).toEqual(FFX2_COMMAND_RECORDS[theirs]);
  });

  it('the ability definitions agree with their rows where the engine reads the definition and not the record: the damage type follows the row\'s damage flags, reflectable follows the misc word\'s 0x80, heals follow 0x10', () => {
    const ability = (id: string) => x2FarplaneCupAbilities.find((a) => a.id === id)!;
    for (const [id, row] of Object.entries(FIXTURE.moves)) {
      const a = ability(id);
      // Rows with no damage at all (a status, a buff, an item) are "other" or follow their flags; a damage row follows bit 0 (physical) and bit 1 (magical) of the damage flags.
      if (row.power > 0 && row.damageClass === 1 && row.formula !== 5 && row.formula !== 7 && row.formula !== 6) {
        const expected = row.flagsDamage & 1 ? 'physical' : row.flagsDamage & 2 ? 'magical' : 'other';
        expect(a.damageType, `${id} (damage flags 0x${row.flagsDamage.toString(16)})`).toBe(expected);
      }
      expect((a.flags ?? []).includes('reflectable'), `${id}: reflectable`).toBe((row.flagsMisc & 0x80) !== 0);
      expect((a.flags ?? []).includes('heals'), `${id}: heals`).toBe((row.flagsDamage & 0x10) !== 0);
    }
  });

  it('hit rule (rule 5): a move can miss exactly where its accuracy formula is not 0, and every other move carries canMiss false, set explicitly', () => {
    const rolls = x2FarplaneCupAbilities.filter((a) => a.canMiss === true).map((a) => a.id);
    expect(rolls.sort()).toEqual(
      ['x2-auron-attack', 'x2-auron-full-break', 'x2-auron-shin-zantetsu', 'x2-auron-shooting-star', 'x2-seymour-attack', 'x2-seymour-drain-attack', 'x2-tidus-attack', 'x2-tidus-delay-buster'],
    );
    for (const ability of x2FarplaneCupAbilities) {
      const formula = (COMMAND_RECORDS_FARPLANE_CUP[ability.id]!.flagsMisc >> 3) & 7;
      expect(ability.canMiss, ability.id).toBe(formula !== 0);
    }
  });

  it('the abilities are the data catalog\'s (ALL_BOSS_ABILITIES), each has a command record, and the 33 ids are unique', () => {
    for (const ability of x2FarplaneCupAbilities) {
      expect(ALL_BOSS_ABILITIES, ability.id).toContain(ability);
      expect(COMMAND_RECORDS_FARPLANE_CUP[ability.id], ability.id).toBeDefined();
      expect(ability.game).toBe('ffx2');
    }
    expect(x2FarplaneCupAbilities).toHaveLength(33);
    expect(new Set(x2FarplaneCupAbilities.map((a) => a.id)).size).toBe(33);
    expect(Object.keys(COMMAND_RECORDS_FARPLANE_CUP).sort()).toEqual(x2FarplaneCupAbilities.map((a) => a.id).sort());
    expect([...new Set(Object.values(CUP_ABILITY))].sort()).toEqual(x2FarplaneCupAbilities.map((a) => a.id).sort());
  });

  it('every duelist lists exactly the abilities its script queues (Seymour\'s Death, Excalibur and Cry in the Night are on his list in the game and queued by no poll: not built)', () => {
    expect([...x2CupAuron.abilityIds].sort()).toEqual(['x2-auron-attack', 'x2-auron-dragon-fang', 'x2-auron-full-break', 'x2-auron-mega-potion', 'x2-auron-shin-zantetsu', 'x2-auron-shooting-star', 'x2-auron-x-potion']);
    expect([...x2CupTidus.abilityIds].sort()).toEqual([
      'x2-tidus-attack', 'x2-tidus-blitz-ace', 'x2-tidus-delay-buster', 'x2-tidus-dispel-tonic', 'x2-tidus-hastega', 'x2-tidus-hero-drink', 'x2-tidus-mega-potion', 'x2-tidus-spiral-cut',
    ]);
    expect(x2CupSeymour.abilityIds).toHaveLength(18);
    expect(new Set(x2CupSeymour.abilityIds).size).toBe(18);
    expect(x2CupSeymour.abilityIds.every((id) => id.startsWith('x2-seymour-'))).toBe(true);
  });
});

describe('the chain: three formations, each a fresh fight (DU1)', () => {
  it('duels 1 to 3 chain by nextGroupId and are registered by id, one duelist each and no adds', () => {
    expect(farplaneCupGroups.map((g) => g.id)).toEqual([...ids.FARPLANE_CUP_GROUP_IDS]);
    expect(farplaneCupGroups.map((g) => g.nextGroupId)).toEqual([ids.DUEL_2_GROUP_ID, ids.DUEL_3_GROUP_ID, undefined]);
    for (const group of farplaneCupGroups) expect(ENEMY_GROUPS_BY_ID[group.id], group.id).toBe(group);
    expect(farplaneCupGroups.map((g) => g.enemies.map((e) => e.id))).toEqual([['x2-cup-auron'], ['x2-cup-tidus'], ['x2-cup-seymour']]);
    for (const group of farplaneCupGroups) {
      expect(group.game).toBe('ffx2');
      expect(group.parts).toBeUndefined(); // the weapon props are visual only [RE §2.4]
    }
  });

  it('links 2 and 3 restore the party with no Save Sphere card and are the retry checkpoints; link 1 does neither; nobody can escape', () => {
    expect([duel1AuronGroup, duel2TidusGroup, duel3SeymourGroup].map((g) => g.restoresPartyOnEntry === true)).toEqual([false, true, true]);
    expect([duel1AuronGroup, duel2TidusGroup, duel3SeymourGroup].map((g) => g.noSaveSphereCard === true)).toEqual([false, true, true]);
    for (const group of farplaneCupGroups) {
      expect(group.canEscape, group.id).toBe(false);
      expect(group.carriesPartyState, group.id).toBeUndefined(); // each link is fresh: no statuses or worn dressphere carried
      expect(group.hopelessRetry, group.id).toBeUndefined();
    }
  });

  it('the scripts the enemies name are registered and the ids file agrees', () => {
    for (const enemy of Object.values(ENEMIES)) expect(aiScriptFor(enemy.aiScriptId).id, enemy.id).toBe(enemy.aiScriptId);
    expect([ids.CUP_AURON_SCRIPT_ID, ids.CUP_TIDUS_SCRIPT_ID, ids.CUP_SEYMOUR_SCRIPT_ID]).toEqual(['x2-cup-auron', 'x2-cup-tidus', 'x2-cup-seymour']);
    expect(ids.FARPLANE_CUP_BODY_IDS).toEqual(['x2-cup-auron', 'x2-cup-tidus', 'x2-cup-seymour']);
    expect(ids.FARPLANE_CUP_ROWS).toEqual([311, 317, 319]);
  });
});

describe('the kill-reward rows (re-parity RC9) and the party (DU4)', () => {
  it('each duelist is paid by the row of the game: EXP, AP, gil, the drop byte and the common slot (the rare slot, a Lore, has no item in the repo\'s tables and is 0)', () => {
    const rows = Object.fromEntries(Object.entries(KILL_REWARD_ROWS).filter(([k]) => k.startsWith('ffx2-farplane-cup-')));
    expect(Object.keys(rows).sort()).toEqual(farplaneCupGroups.map((g) => `${g.id}/${g.enemies[0]!.id}`).sort());
    expect(rows['ffx2-farplane-cup-1-auron/x2-cup-auron']).toMatchObject({ table: 1, row: 311, exp: 1600, ap: 1, gil: 900, dropByte: 255, drop: [0x2007, 2, 0, 0] });
    expect(rows['ffx2-farplane-cup-2-tidus/x2-cup-tidus']).toMatchObject({ table: 1, row: 317, exp: 1500, ap: 1, gil: 750, dropByte: 255, drop: [0x2002, 2, 0, 0] });
    expect(rows['ffx2-farplane-cup-3-seymour/x2-cup-seymour']).toMatchObject({ table: 1, row: 319, exp: 1300, ap: 1, gil: 1000, dropByte: 255, drop: [0x2005, 1, 0, 0] });
    // The raw rows say the rare drops exist (Bushido, Sword and Arcane Lore): the fixture keeps the game's own numbers.
    expect([FIXTURE.monsters['x2-cup-auron']!.dropItems[2], FIXTURE.monsters['x2-cup-tidus']!.dropItems[2], FIXTURE.monsters['x2-cup-seymour']!.dropItems[2]]).toEqual([0x9063, 0x9062, 0x9064]);
  });

  it('the party is Chapter XIII\'s Lv 99 three as it is, as a deep copy; nobody starts with a gate crossed, so the Break Damage Limit is not on at the start', () => {
    expect(farplaneCupBuild).toEqual(viaInfinitoBuild);
    expect(farplaneCupBuild).not.toBe(viaInfinitoBuild);
    expect(farplaneCupBuild.members[0]).not.toBe(viaInfinitoBuild.members[0]);
    expect(farplaneCupBuild.members.map((m) => m.level)).toEqual([99, 99, 99]);
    for (const m of farplaneCupBuild.members) expect(m.garmentGrid.passedGates, m.id).toEqual([]);
  });
});

describe('the chapter record and its place in the registry', () => {
  it('is hidden: found by getChapter, in EXPERIMENT_CHAPTERS, in neither CHAPTERS nor CHAPTER_IDS (the board stays at nineteen)', () => {
    expect(getChapter(ids.FARPLANE_CUP_ID)).toBe(FFX2_FARPLANE_CUP);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_FARPLANE_CUP);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(ids.FARPLANE_CUP_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(ids.FARPLANE_CUP_ID)).toBe(false);
    expect(CHAPTERS).toHaveLength(19);
  });

  it('is FFX-2, number 38, experimental, on the Den of Woe\'s own stage (DU5), with Auron\'s duel as its first formation and the Lv 99 party; the number is unique', () => {
    expect(FFX2_FARPLANE_CUP).toMatchObject({ id: 'ffx2-farplane-cup', game: 'ffx2', number: 38, experimental: true, sceneKey: 'den-of-woe' });
    expect(FFX2_FARPLANE_CUP.enemyGroupRef).toBe(duel1AuronGroup);
    expect(FFX2_FARPLANE_CUP.buildRef).toBe(farplaneCupBuild);
    expect(Object.keys(FFX2_FARPLANE_CUP.sensorTexts).sort()).toEqual([...ids.FARPLANE_CUP_BODY_IDS].sort());
    for (const enemy of Object.values(ENEMIES)) expect(FFX2_FARPLANE_CUP.sensorTexts[enemy.id], enemy.id).toBe(enemy.sensorText);
    expect(EXPERIMENT_CHAPTERS.filter((c) => c.number === 38)).toEqual([FFX2_FARPLANE_CUP]);
  });

  it('plays existing cues only (DU6, a flagged stand-in): the FFX-2 field bed, the superboss cue and the FFX-2 fanfare; the formations ask for the same cue', () => {
    expect(FFX2_FARPLANE_CUP.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-trema', victory: 'victory-ffx2' });
    for (const group of farplaneCupGroups) expect(group.musicCues, group.id).toEqual([{ at: 'start', track: 'boss-trema', fadeMs: 800 }]);
  });

  it('has pause metadata (EXP, three objectives, the Den of Woe\'s plate as the stand-in) registered with the unlisted chapters', () => {
    expect(UNLISTED_CHAPTER_META).toContain(FARPLANE_CUP_META);
    expect(FARPLANE_CUP_META).toMatchObject({ id: ids.FARPLANE_CUP_ID, gameLabel: 'FFX-2', numeral: 'EXP', title: FFX2_FARPLANE_CUP.title, location: FFX2_FARPLANE_CUP.location, blurb: FFX2_FARPLANE_CUP.blurb });
    expect(FARPLANE_CUP_META.objectives.map((o) => o.rule)).toEqual([{ kind: 'link-reached', link: 2 }, { kind: 'link-reached', link: 3 }, { kind: 'victory' }]);
    expect(FARPLANE_CUP_META.musicKeys).toEqual(['scene-bevelle-underground', 'boss-trema', 'victory-ffx2']);
    expect(FARPLANE_CUP_META.heroArtFallback).toBe('backdrops/den-of-woe.png');
    // The objectives keep the second duelist's name masked.
    for (const o of FARPLANE_CUP_META.objectives) expect(o.label).not.toMatch(/tidus/i);
  });

  it('opens by the typed word on chapter select: one row of the door table, FFX-2', () => {
    expect(DUELIST_DOOR_WORD).toBe('duelist');
    expect(DUELIST_DOOR_CHAPTER).toBe(ids.FARPLANE_CUP_ID);
    expect(CHAPTER_DOORS.find((d) => d.word === DUELIST_DOOR_WORD)?.chapter).toBe(ids.FARPLANE_CUP_ID);
  });
});

describe('hygiene: nothing local goes into a committed file or a shipped string (rule: no local path, scratch folder or account name)', () => {
  const FILES = [
    'src/data/farplane-cup-ids.ts',
    'src/data/chapter-ffx2-farplane-cup.ts',
    'src/data/chapter-meta-ffx2-farplane-cup.ts',
    'src/data/ffx2/enemies/farplane-cup.ts',
    'src/data/ffx2/enemies/farplane-cup-abilities.ts',
    'src/data/ffx2/enemies/farplane-cup-abilities-base.ts',
    'src/data/ffx2/enemies/farplane-cup-abilities-seymour.ts',
    'src/data/ffx2/command-records/farplane-cup.ts',
    'src/data/ffx2/monster-records/records-farplane-cup.ts',
    'src/data/ffx2/builds/farplane-cup.ts',
    'src/battle/ffx2/ai/farplane-cup.ts',
    'src/app/screens/frontend/duelistDoor.ts',
    'src/story/scripts/ffx2-farplane-cup.ts',
    'research/re-ffx2-farplane-cup.md',
    'docs/plans/ch-duelist-review.md',
    'docs/handoff/ch-farplane-cup.md',
    'tests/fixtures/parity/ffx2/farplane_cup_rows.json',
  ];
  it('none of the lane\'s files names a drive path, the scratch folders, or an account', () => {
    for (const file of FILES) {
      const text = readFileSync(here(`../../../${file}`), 'utf8');
      expect(text, file).not.toMatch(/(^|[^A-Za-z0-9])[A-Za-z]:[\\/]/);
      expect(text, file).not.toMatch(/pyrefly-scratch|\bw2\/3|\bw2b\b|Administrator|bpillon|baileypillon|jameve|\.claude[\\/]/i);
    }
  });
});
