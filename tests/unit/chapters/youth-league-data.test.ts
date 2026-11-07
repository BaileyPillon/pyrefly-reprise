/**
 * The Youth League Tournament (Mushroom Rock Road's seven fights; the hidden FFX-2 chapter): the data against the game's own rows. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `tests/fixtures/parity/ffx2/youth_league_rows.json` holds the eight fighter types' rows (`monster.bin` rows 183, 184, 279, 210, 211, 193, 214 and 215) and the 33 moves their scripts queue (`monmagic.bin`, `command.bin`,
 * `item.bin`), decoded from the kernel tables by a script (`research/re-ffx2-youth-league-tournament.md` §3 and §6), numbers only. This file compares them to the enemy data, the monster records and the command records
 * field by field; it also pins:
 *
 * 1. **The enemies**: level, HP, MP and the stat bytes of every one of the twenty fighters; the element bytes (Gravity is null on the three named, nothing else); no automatic status.
 * 2. **The ailments** [RE §3.1, §3.2]: the group-1 and group-2 resist bytes (Yaibal can be blinded and poisoned at 20 and confused at 100), the special words (the named fighters' 0x3c3 against the League's 0x80: none of
 *    the five League types is immune to delay or Interrupt).
 * 3. **The moves**: every row, the abilities' own fields consistent with them, the hit rule (hard rule 5), and the rows the repo already holds under other names, which must be these rows.
 * 4. **The chain and the chapter**: seven formations chained by `nextGroupId`, acts 2 to 7 carry the party whole and are the retry checkpoints, no Escape, the last link has no next; the chapter record, its pause metadata, its
 *    door word and its place in the registry; the kill-reward rows; and the hygiene of the files this lane added (no local path, scratch name or account name).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { FFX2CommandRecord } from '../../../src/battle/common/types.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { YOUTH_DOOR_CHAPTER, YOUTH_DOOR_WORD } from '../../../src/app/screens/frontend/youthDoor.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { FFX2_YOUTH_LEAGUE } from '../../../src/data/chapter-ffx2-youth-league.ts';
import { YOUTH_LEAGUE_META } from '../../../src/data/chapter-meta-ffx2-youth-league.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_BOSS_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import { KINDS, youthLeagueGroups } from '../../../src/data/ffx2/enemies/youth-league.ts';
import { YL_ABILITY, x2YouthLeagueAbilities } from '../../../src/data/ffx2/enemies/youth-league-abilities.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { youthLeagueBuild } from '../../../src/data/ffx2/builds/youth-league.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { COMMAND_RECORDS_YOUTH_LEAGUE } from '../../../src/data/ffx2/command-records/youth-league.ts';
import { KILL_REWARD_ROWS, MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { MONSTER_RECORDS_YOUTH_LEAGUE } from '../../../src/data/ffx2/monster-records/records-youth-league.ts';
import * as ids from '../../../src/data/youth-league-ids.ts';

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
const FIXTURE = JSON.parse(readFileSync(here('../../fixtures/parity/ffx2/youth_league_rows.json'), 'utf8')) as Fixture;

/** The fixture's key of each fighter type. */
const ROW_KEY = { yaibal: 'x2-yaibal', lucil: 'x2-lucil', elma: 'x2-elma', warrior: 'x2-league-warrior', veteran: 'x2-league-veteran', slasher: 'x2-league-slasher', mage: 'x2-league-mage', master: 'x2-league-master' } as const;
type Type = keyof typeof ROW_KEY;
const TYPES = Object.keys(ROW_KEY) as Type[];

/** Every fighter of the chapter: act, slot, type, id, the group and the enemy as the data holds them. */
const FIGHTERS = youthLeagueGroups.flatMap((group, act) => group.enemies.map((enemy, slot) => ({ act, slot, type: ids.ACT_TYPES[act]![slot]! as Type, group, enemy })));
const numeric = (record: Record<string, number>): Record<number, number> => Object.fromEntries(Object.entries(record).map(([k, v]) => [Number(k), v]));
const resisted = (enemy: { immunities: object }, status: string): number => (enemy.immunities as Record<string, number | undefined>)[status] ?? 0;
const SPECIAL_NO_ATB_DAMAGE = 1 << 6;
const SPECIAL_NO_INTERRUPT = 1 << 9;

describe('the eight fighter types against the rows [RE §3.1, §3.2]', () => {
  it('the chapter has twenty fighters: 3 + 3 + 3 + 3 + 4 + 3 + 1, one id each', () => {
    expect(FIGHTERS).toHaveLength(20);
    expect(youthLeagueGroups.map((g) => g.enemies.length)).toEqual([3, 3, 3, 3, 4, 3, 1]);
    expect(new Set(FIGHTERS.map((f) => f.enemy.id)).size).toBe(20);
    expect(FIGHTERS.map((f) => f.enemy.id)).toEqual(ids.ACT_ENEMY_IDS.flat());
    expect(Object.keys(FIXTURE.monsters).sort()).toEqual(Object.values(ROW_KEY).sort());
  });

  for (const type of TYPES) {
    const row = FIXTURE.monsters[ROW_KEY[type]]!;
    const wearers = FIGHTERS.filter((f) => f.type === type);

    it(`${type}: ${wearers.length} fighter(s) wear monster.bin row ${row.row} (offset ${row.offset}): level, HP, MP and the stat bytes`, () => {
      expect(wearers.length).toBeGreaterThan(0);
      expect(row.row).toBe(ids.YL_ROWS[type]);
      for (const { enemy } of wearers) {
        expect(enemy.level, enemy.id).toBe(row.level);
        expect([enemy.hp, enemy.stats.hp, enemy.stats.maxHp], enemy.id).toEqual([row.hp, row.hp, row.hp]);
        expect([enemy.mp, enemy.stats.mp, enemy.stats.maxMp], enemy.id).toEqual([row.mp, row.mp, row.mp]);
        expect([enemy.stats.str, enemy.stats.def, enemy.stats.mag, enemy.stats.mdef], enemy.id).toEqual([row.str, row.def, row.mag, row.mdef]);
        expect([enemy.stats.agi, enemy.stats.acc, enemy.stats.eva, enemy.stats.luck], enemy.id).toEqual([row.agi, row.acc, row.eva, row.luck]);
        expect(enemy.forms.map((f) => f.hp), enemy.id).toEqual([row.hp]);
        expect(enemy.name, enemy.id).toMatch(new RegExp('^' + KINDS[type].name + '( [A-D])?$')); // a duplicate in its formation carries a letter (PR-0013)
        expect(enemy.autoStatuses, enemy.id).toBeUndefined(); // no automatic status on any of the eight [RE §3.1]
      }
      expect([row.autoStatus1, row.autoStatus2]).toEqual([0, 0]);
    });

    it(`${type}: the rewards are the row's EXP, Gil, AP and Pilfer Gil, the drop and steal slots are the row's, and the steal byte is ${row.stealByte}`, () => {
      const NAME: Record<number, string> = {
        0x2001: 'x2-hi-potion', 0x2004: 'x2-ether', 0x2006: 'x2-phoenix-down', 0x2011: 'x2-grenade', 0x2012: 'x2-l-bomb', 0x2013: 'x2-m-bomb', 0x202f: 'x2-chocobo-feather', 0x2034: 'x2-healing-spring',
        0x900f: 'amulet', 0x9018: 'muscle-belt', 0x901c: 'circlet',
      };
      for (const { enemy } of wearers) {
        expect([enemy.rewards.exp, enemy.rewards.gil, enemy.rewards.ap, enemy.rewards.stolenGil], enemy.id).toEqual([row.exp, row.gil, row.ap, row.pilfer]);
        expect(enemy.rewards.steal?.stealRate, enemy.id).toBe(row.stealByte);
        expect(enemy.rewards.drops, enemy.id).toEqual([{ itemId: NAME[row.dropItems[0]!], count: row.dropItems[1] }]);
        expect(enemy.rewards.steal?.common, enemy.id).toEqual({ itemId: NAME[row.stealItems[0]!], count: row.stealItems[1] });
        expect(enemy.rewards.steal?.rare, enemy.id).toEqual({ itemId: NAME[row.stealItems[2]!], count: row.stealItems[3] });
      }
    });

    it(`${type}: the monster record is the row's (special word 0x${row.special.toString(16)}, Zantetsu ${row.zantetsu}, ACC ${row.acc}) and is laid on every wearer`, () => {
      for (const { group, enemy } of wearers) {
        const record = MONSTER_RECORDS[`${group.id}/${enemy.id}`]!;
        expect(record, enemy.id).toBe(MONSTER_RECORDS_YOUTH_LEAGUE[`${group.id}/${enemy.id}`]);
        expect([record.row, record.table, record.acc, record.special, record.zantetsu, record.stealByte, record.stealGil], enemy.id).toEqual([row.row, 1, row.acc, row.special, row.zantetsu, row.stealByte, row.pilfer]);
        expect(record.resist1, enemy.id).toEqual(numeric(row.resist1));
        expect(record.resist2, enemy.id).toEqual(numeric(row.resist2));
        expect(record.steal, enemy.id).toEqual(row.stealItems);
        expect(record.bribe, enemy.id).toEqual(row.bribeItems);
        expect(enemy.ffx2Record, enemy.id).toBe(record);
        expect(enemy.stats.acc, enemy.id).toBe(95);
      }
    });
  }

  it('twenty records, no two the same object: a record laid on one fighter never leaks into another', () => {
    const records = FIGHTERS.map((f) => f.enemy.ffx2Record);
    expect(new Set(records).size).toBe(20);
    expect(Object.keys(MONSTER_RECORDS_YOUTH_LEAGUE)).toHaveLength(20);
  });

  it('the element bytes: Gravity is null on Yaibal, Lucil and Elma (0x10) and nothing else has any', () => {
    for (const type of TYPES) {
      const row = FIXTURE.monsters[ROW_KEY[type]]!;
      const named = type === 'yaibal' || type === 'lucil' || type === 'elma';
      expect([row.absorb, row.null, row.half, row.weak], type).toEqual([0, named ? 0x10 : 0, 0, 0]);
      for (const { enemy } of FIGHTERS.filter((f) => f.type === type)) expect(enemy.affinities, enemy.id).toEqual(named ? { gravity: 'immune' } : {});
    }
  });

  it('the identities: Elma is row 279 (the Chapter 5 tournament), not row 185 (the Chapter 2 miniboss of the other path of the same choice: pick YL1)', () => {
    expect(FIXTURE.monsters['x2-elma']!.row).toBe(279);
    expect(FIXTURE.monsters['x2-elma']!.hp).toBe(4882);
    expect(ids.YL_ROWS).toEqual({ yaibal: 183, lucil: 184, elma: 279, warrior: 210, veteran: 211, slasher: 193, mage: 214, master: 215 });
    expect(JSON.stringify(youthLeagueGroups.map((g) => g.enemies.map((e) => e.ffx2Record?.row)))).not.toContain('185');
  });

  it('the Oversoul versions are NOT used: every record is table 1 (monster.bin), none of monster2.bin', () => {
    for (const record of Object.values(MONSTER_RECORDS_YOUTH_LEAGUE)) expect(record.table).toBe(1);
  });
});

describe('the ailments and the special words [RE §3.1, §3.2]', () => {
  const named = FIGHTERS.filter((f) => ['yaibal', 'lucil', 'elma'].includes(f.type));

  it('the three named fighters are immune to Death, Petrify, Sleep, Silence, Berserk, Curse, Eject, Slow, Stop and Doom; Lucil and Elma to Darkness, Poison and Confusion as well', () => {
    for (const { enemy } of named) {
      for (const status of ['ko', 'petrify', 'sleep', 'silence', 'berserk', 'curse', 'eject', 'slow', 'stop', 'doom']) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(255);
    }
    for (const type of ['lucil', 'elma']) {
      const { enemy } = FIGHTERS.find((f) => f.type === type)!;
      for (const status of ['darkness', 'poison', 'confuse']) expect(resisted(enemy, status), `${type} ${status}`).toBe(255);
    }
  });

  it('Yaibal alone can be blinded, poisoned and confused: the bytes read 20, 20 and 100 (chance bytes, not immunity)', () => {
    const { enemy } = FIGHTERS.find((f) => f.type === 'yaibal')!;
    expect([resisted(enemy, 'darkness'), resisted(enemy, 'poison'), resisted(enemy, 'confuse')]).toEqual([20, 20, 100]);
  });

  it('the League types carry only the bytes of their rows: Curse always; Sleep on the Warrior, Silence on the Slasher, Death and Petrify at 50 on the Veteran and the Master', () => {
    const of = (type: Type) => FIGHTERS.find((f) => f.type === type)!.enemy;
    expect(['warrior', 'veteran', 'slasher', 'mage', 'master'].map((t) => resisted(of(t as Type), 'curse'))).toEqual([255, 255, 255, 255, 255]);
    expect(resisted(of('warrior'), 'sleep')).toBe(255);
    expect(resisted(of('slasher'), 'silence')).toBe(255);
    for (const t of ['veteran', 'master'] as const) expect([resisted(of(t), 'ko'), resisted(of(t), 'petrify')], t).toEqual([50, 50]);
    for (const t of ['warrior', 'veteran', 'slasher', 'mage', 'master'] as const) for (const status of ['slow', 'stop', 'doom', 'eject']) expect(resisted(of(t), status), `${t} ${status}`).toBe(0);
  });

  it('special words 0x3c3 (named) and 0x80 (League): the named fighters\' no-ATB-damage, Interrupt and percent bits are set (delay and Interrupt do nothing); the League has only bit 7, so delay and Interrupt work on all five', () => {
    for (const { enemy } of named) {
      const word = enemy.ffx2Record!.special;
      expect(word, enemy.id).toBe(0x3c3);
      expect(word & SPECIAL_NO_ATB_DAMAGE, enemy.id).not.toBe(0);
      expect(word & SPECIAL_NO_INTERRUPT, enemy.id).not.toBe(0);
      expect(word & 1, enemy.id).toBe(1);
      expect(enemy.immunityFlags, enemy.id).toEqual(['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe']);
      expect(resisted(enemy, 'action-cancel'), enemy.id).toBe(255);
      expect(resisted(enemy, 'delay-effect'), enemy.id).toBe(255);
    }
    for (const { enemy, type } of FIGHTERS.filter((f) => !['yaibal', 'lucil', 'elma'].includes(f.type))) {
      const word = enemy.ffx2Record!.special;
      expect(word, `${enemy.id} (${type})`).toBe(0x80);
      expect(word & SPECIAL_NO_ATB_DAMAGE, enemy.id).toBe(0);
      expect(word & SPECIAL_NO_INTERRUPT, enemy.id).toBe(0);
      expect(enemy.immunityFlags, enemy.id).toEqual([]);
      expect(resisted(enemy, 'action-cancel'), enemy.id).toBe(0);
    }
  });
});

describe('the moves against the rows [RE §6]', () => {
  for (const [id, row] of Object.entries(FIXTURE.moves)) {
    it(`${id}: the command record is row 0x${row.id.toString(16)} (offset ${row.offset}) field for field`, () => {
      const record: FFX2CommandRecord = COMMAND_RECORDS_YOUTH_LEAGUE[id]!;
      expect(record, id).toBeDefined();
      expect(FFX2_COMMAND_RECORDS[id]).toBe(record);
      expect([record.id, record.costAtb, record.costCast, record.category, record.flagsTarget, record.flagsMisc, record.flagsDamage, record.damageClass, record.formula, record.critByte, record.accuracy, record.power, record.hits, record.shatter, record.element, record.killer]).toEqual(
        [row.id, row.costAtb, row.costCast, row.category, row.flagsTarget, row.flagsMisc, row.flagsDamage, row.damageClass, row.formula, row.crit, row.accuracy, row.power, row.hits, row.shatter, row.element, 0],
      );
      const ability = x2YouthLeagueAbilities.find((a) => a.id === id)!;
      expect(ability, id).toBeDefined();
      expect(ability.mpCost).toBe(row.costMp);
      expect(ability.hits).toBe(row.hits);
      if (row.damageClass === 1 || row.power > 0) expect(ability.power, `${id}: the ability's power is the row's (or the engine's own reading of it)`).toBeGreaterThanOrEqual(0);
    });
  }

  it('the status bytes of every row that carries one are the row\'s: Harbinger Doom 254 with the counter 4; Flash Bomb Darkness 50; Hush Grenade Silence 50; Confuse 75; Sleep 75; Gold Hourglass Slow 100; the Curtains; the Guard', () => {
    for (const [id, status] of Object.entries(FIXTURE.statuses)) {
      const record = COMMAND_RECORDS_YOUTH_LEAGUE[id]!;
      expect(record.status1, id).toEqual(status.status1 === undefined ? undefined : numeric(status.status1));
      expect(record.status2, id).toEqual(status.status2 === undefined ? undefined : numeric(status.status2));
      expect(record.statusTime, id).toEqual(status.statusTime === undefined ? undefined : numeric(status.statusTime));
    }
    const r = COMMAND_RECORDS_YOUTH_LEAGUE;
    expect([r['x2-lucil-harbinger']!.status2, r['x2-lucil-harbinger']!.statusTime]).toEqual([{ 14: 254 }, { 14: 4 }]);
    expect(r['x2-league-flash-bomb']!.status1).toEqual({ 4: 50 });
    expect(r['x2-elma-hush-grenade']!.status1).toEqual({ 3: 50 });
    expect(r['x2-league-confuse']!.status1).toEqual({ 6: 75 });
    expect(r['x2-elma-sleep']!.status1).toEqual({ 2: 75 });
    expect([r['x2-lucil-gold-hourglass']!.status2, r['x2-lucil-gold-hourglass']!.statusTime]).toEqual([{ 5: 100 }, { 5: 100 }]);
    expect([r['x2-lucil-lunar-curtain']!.status2, r['x2-lucil-light-curtain']!.status2]).toEqual([{ 0: 254 }, { 1: 254 }]);
    expect([r['x2-elma-not-so-mighty-guard']!.status2, r['x2-elma-not-so-mighty-guard']!.statusTime]).toEqual([{ 0: 254, 1: 254, 3: 254 }, { 0: 126, 1: 126, 3: 50 }]);
    expect(r['x2-yaibal-phoenix-down']!.status1).toEqual({ 0: 254 }); // the Death cure
  });

  it('the accuracy formulas (misc word bits 3 to 5): 2 (the race with ACC) for the League\'s and Yaibal\'s Attack and Lucil\'s; 1 (the race against 130) for Elma\'s; 0 for the rest', () => {
    const formula = (id: string): number => (COMMAND_RECORDS_YOUTH_LEAGUE[id]!.flagsMisc >> 3) & 7;
    expect([formula('x2-league-attack'), formula('x2-lucil-attack')]).toEqual([2, 2]);
    expect(formula('x2-elma-attack')).toBe(1);
    expect(COMMAND_RECORDS_YOUTH_LEAGUE['x2-elma-attack']!.accuracy).toBe(130);
    for (const id of Object.keys(COMMAND_RECORDS_YOUTH_LEAGUE).filter((k) => !['x2-league-attack', 'x2-lucil-attack', 'x2-elma-attack'].includes(k))) expect(formula(id), id).toBe(0);
  });

  it('the multi-hit rows: each Gem is six hits of power 2 with the random-target bit; the Sorry grenade and the grenades are single-hit party rows', () => {
    for (const gem of ['fire', 'ice', 'lightning', 'water']) {
      const r = COMMAND_RECORDS_YOUTH_LEAGUE[`x2-lucil-${gem}-gem`]!;
      expect([r.hits, r.power, r.shatter]).toEqual([6, 2, 70]);
      expect(r.flagsMisc & 0x4000, gem).toBe(0x4000);
    }
    expect([COMMAND_RECORDS_YOUTH_LEAGUE['x2-yaibal-sorry']!.power, COMMAND_RECORDS_YOUTH_LEAGUE['x2-yaibal-sorry']!.hits]).toEqual([10, 1]);
  });

  it('Harbinger and the Critical Attack always hit; Critical Attack\'s crit byte is 255 (always a critical); Harbinger\'s is 15', () => {
    const r = COMMAND_RECORDS_YOUTH_LEAGUE;
    expect(r['x2-league-critical-attack']!.critByte).toBe(255);
    expect(r['x2-lucil-harbinger']!.critByte).toBe(15);
    for (const id of ['x2-league-critical-attack', 'x2-lucil-harbinger']) expect((r[id]!.flagsMisc >> 3) & 7, id).toBe(0);
  });

  it('every row the repo holds under another name or table is this row (a second witness): any other command record with the same game id must equal ours', () => {
    const checked: string[] = [];
    for (const [id, record] of Object.entries(COMMAND_RECORDS_YOUTH_LEAGUE)) {
      for (const [otherId, other] of Object.entries(FFX2_COMMAND_RECORDS)) {
        if (otherId === id || otherId in COMMAND_RECORDS_YOUTH_LEAGUE || other.id !== record.id) continue;
        expect(other, `${id} = ${otherId}`).toEqual(record);
        checked.push(`${id}=${otherId}`);
      }
    }
    // The ones the repo is known to hold: Demi, Dispel, the Curtains, Hi-Potion, Phoenix Down, Osmose, the Guard, Flash Bomb and Hush Grenade.
    for (const pair of ['x2-league-demi=x2-dark-knight-demi', 'x2-elma-dispel=x2-white-mage-dispel', 'x2-lucil-lunar-curtain=x2-item-lunar-curtain', 'x2-lucil-light-curtain=x2-item-light-curtain', 'x2-league-hi-potion=x2-item-hi-potion',
      'x2-yaibal-phoenix-down=x2-item-phoenix-down', 'x2-elma-osmose=x2-leblanc-osmose', 'x2-elma-not-so-mighty-guard=x2-leblanc-not-so-mighty-guard', 'x2-league-flash-bomb=x2-leblanc-flash-bomb', 'x2-elma-hush-grenade=x2-leblanc-hush-grenade']) {
      expect(checked, pair).toContain(pair);
    }
  });

  it('the ability definitions agree with their rows where the engine reads the definition and not the record: reflectable follows the misc word\'s 0x80, heals follow 0x10 of the damage flags, the statuses are the row\'s', () => {
    for (const [id, row] of Object.entries(FIXTURE.moves)) {
      const a = x2YouthLeagueAbilities.find((x) => x.id === id)!;
      expect((a.flags ?? []).includes('reflectable'), `${id}: reflectable`).toBe((row.flagsMisc & 0x80) !== 0);
      expect((a.flags ?? []).includes('heals'), `${id}: heals`).toBe((row.flagsDamage & 0x10) !== 0);
      const status = FIXTURE.statuses[id];
      const chances = (a.statusEffects ?? []).map((s) => s.chance).sort((x, y) => x - y);
      const fromRow = [...Object.values(status?.status1 ?? {}), ...Object.values(status?.status2 ?? {})];
      // A definition lists the statuses the engine has a name for; every one it lists must be a chance the row carries.
      for (const c of chances) expect(fromRow, `${id}: chance ${c}`).toContain(c);
    }
  });

  it('hit rule (rule 5): a move can miss exactly where its accuracy formula is not 0, and every other move carries canMiss false, set explicitly', () => {
    expect(x2YouthLeagueAbilities.filter((a) => a.canMiss === true).map((a) => a.id).sort()).toEqual(['x2-elma-attack', 'x2-league-attack', 'x2-lucil-attack']);
    for (const ability of x2YouthLeagueAbilities) {
      const formula = (COMMAND_RECORDS_YOUTH_LEAGUE[ability.id]!.flagsMisc >> 3) & 7;
      expect(ability.canMiss, ability.id).toBe(formula !== 0);
    }
  });

  it('the abilities are the data catalog\'s (ALL_BOSS_ABILITIES), each has a command record, and the 33 ids are unique and equal YL_ABILITY', () => {
    for (const ability of x2YouthLeagueAbilities) {
      expect(ALL_BOSS_ABILITIES, ability.id).toContain(ability);
      expect(COMMAND_RECORDS_YOUTH_LEAGUE[ability.id], ability.id).toBeDefined();
      expect(ability.game).toBe('ffx2');
    }
    expect(x2YouthLeagueAbilities).toHaveLength(33);
    expect(new Set(x2YouthLeagueAbilities.map((a) => a.id)).size).toBe(33);
    expect(Object.keys(COMMAND_RECORDS_YOUTH_LEAGUE).sort()).toEqual(x2YouthLeagueAbilities.map((a) => a.id).sort());
    expect([...new Set(Object.values(YL_ABILITY))].sort()).toEqual(x2YouthLeagueAbilities.map((a) => a.id).sort());
    expect(Object.keys(FIXTURE.moves).sort()).toEqual(Object.keys(COMMAND_RECORDS_YOUTH_LEAGUE).sort());
  });

  it('every fighter lists exactly the abilities its script queues, and every listed ability exists', () => {
    const have = new Set(x2YouthLeagueAbilities.map((a) => a.id));
    const A = YL_ABILITY;
    const want: Record<Type, string[]> = {
      yaibal: [A.attack, A.sorry, A.phoenixDown, A.yaibalHiPotion],
      lucil: [A.lucilAttack, A.harbinger, A.lucilHiPotion, A.lunarCurtain, A.lightCurtain, A.fireGem, A.iceGem, A.lightningGem, A.waterGem, A.goldHourglass],
      elma: [A.elmaAttack, A.guard, A.osmose, A.fira, A.blizzara, A.thundara, A.watera, A.confuse, A.sleep, A.flashBomb, A.hushGrenade, A.dispel],
      warrior: [A.attack, A.hiPotion],
      veteran: [A.attack, A.criticalAttack],
      slasher: [A.attack, A.flashBomb],
      mage: [A.attack, A.demi, A.confuse, A.fira, A.blizzara, A.thundara, A.watera, A.firaParty, A.blizzaraParty, A.thundaraParty, A.wateraParty],
      master: [A.attack, A.fira, A.blizzara, A.thundara, A.watera, A.firaParty, A.blizzaraParty, A.thundaraParty, A.wateraParty],
    };
    for (const { enemy, type } of FIGHTERS) {
      expect([...enemy.abilityIds].sort(), enemy.id).toEqual([...want[type]].sort());
      for (const id of enemy.abilityIds) expect(have.has(id), `${enemy.id}: ${id}`).toBe(true);
    }
  });
});

describe('the chain: seven formations, the road\'s order, the Den of Woe\'s carry (YL3, YL4, YL5)', () => {
  it('acts 1 to 7 chain by nextGroupId in the game\'s order, are registered by id, and the last has no next (its win ends the tournament)', () => {
    expect(youthLeagueGroups.map((g) => g.id)).toEqual([...ids.YOUTH_LEAGUE_GROUP_IDS]);
    expect(youthLeagueGroups.map((g) => g.nextGroupId)).toEqual([...ids.YOUTH_LEAGUE_GROUP_IDS.slice(1), undefined]);
    for (const group of youthLeagueGroups) {
      expect(ENEMY_GROUPS_BY_ID[group.id], group.id).toBe(group);
      expect(group.game).toBe('ffx2');
      expect(group.parts, group.id).toBeUndefined(); // the Sword and Weapon props are visual only [RE §3.2]
    }
    expect(youthLeagueGroups[0]!.enemies.map((e) => e.name)).toEqual(['Yaibal', 'League Warrior A', 'League Warrior B']);
    expect(youthLeagueGroups[1]!.enemies.map((e) => e.name)).toEqual(['League Mage A', 'League Mage B', 'League Veteran']);
    expect(youthLeagueGroups[2]!.enemies.map((e) => e.name)).toEqual(['League Warrior', 'League Veteran A', 'League Veteran B']);
    expect(youthLeagueGroups[3]!.enemies.map((e) => e.name)).toEqual(['League Slasher A', 'League Slasher B', 'League Master']);
    expect(youthLeagueGroups[4]!.enemies.map((e) => e.name)).toEqual(['League Veteran A', 'League Veteran B', 'League Veteran C', 'League Veteran D']);
    expect(youthLeagueGroups[5]!.enemies.map((e) => e.name)).toEqual(['Elma', 'League Veteran A', 'League Veteran B']);
    expect(youthLeagueGroups[6]!.enemies.map((e) => e.name)).toEqual(['Lucil']);
  });

  it('the pool of each act and the whole: 5,174 + 3,760 + 3,862 + 5,032 + 6,880 + 8,322 + 7,324 = 40,354 HP; EXP 5,370, Gil 2,760, AP 22 (RE §0)', () => {
    const pools = youthLeagueGroups.map((g) => g.enemies.reduce((s, e) => s + e.hp, 0));
    expect(pools).toEqual([5174, 3760, 3862, 5032, 6880, 8322, 7324]);
    expect(pools.reduce((a, b) => a + b, 0)).toBe(40_354);
    const sum = (key: 'exp' | 'gil' | 'ap'): number => FIGHTERS.reduce((s, f) => s + (f.enemy.rewards[key] ?? 0), 0);
    expect([sum('exp'), sum('gil'), sum('ap')]).toEqual([5370, 2760, 22]);
  });

  it('acts 2 to 7 carry the whole party state and are the retry checkpoints; act 1 does neither and restores nothing (no Save Sphere anywhere); nobody can escape', () => {
    expect(youthLeagueGroups.map((g) => g.carriesFullPartyState === true)).toEqual([false, true, true, true, true, true, true]);
    expect(youthLeagueGroups.map((g) => g.checkpointOnEntry === true)).toEqual([false, true, true, true, true, true, true]);
    for (const group of youthLeagueGroups) {
      expect(group.canEscape, group.id).toBe(false);
      expect(group.restoresPartyOnEntry, group.id).toBeUndefined();
      expect(group.noSaveSphereCard, group.id).toBeUndefined();
      expect(group.hopelessRetry, group.id).toBeUndefined();
      expect(group.enemies.map((e) => e.slot), group.id).toEqual(group.enemies.map((_, i) => i));
    }
  });

  it('the scripts the enemies name are registered and the ids file agrees; the named fighters are bosses', () => {
    for (const { enemy } of FIGHTERS) expect(aiScriptFor(enemy.aiScriptId).id, enemy.id).toBe(enemy.aiScriptId);
    expect(Object.values(ids.YL_SCRIPTS).sort()).toEqual([...new Set(FIGHTERS.map((f) => f.enemy.aiScriptId))].sort());
    for (const { enemy, type } of FIGHTERS) expect(enemy.flags.isBoss === true, enemy.id).toBe(['yaibal', 'lucil', 'elma'].includes(type));
    expect(youthLeagueGroups.map((g) => g.bossId)).toEqual([ids.X2_YAIBAL_ID, undefined, undefined, undefined, undefined, ids.X2_ELMA_ID, ids.X2_LUCIL_ID]);
  });
});

describe('the kill-reward rows (re-parity RC9) and the party (YL2)', () => {
  it('each fighter is paid by the row of the game: EXP, AP, gil, the drop byte and both item slots', () => {
    const rows = Object.fromEntries(Object.entries(KILL_REWARD_ROWS).filter(([k]) => k.startsWith('ffx2-youth-league-')));
    expect(Object.keys(rows).sort()).toEqual(FIGHTERS.map((f) => `${f.group.id}/${f.enemy.id}`).sort());
    for (const { group, enemy, type } of FIGHTERS) {
      const row = FIXTURE.monsters[ROW_KEY[type]]!;
      expect(rows[`${group.id}/${enemy.id}`], enemy.id).toMatchObject({ table: 1, row: row.row, exp: row.exp, ap: row.ap, gil: row.gil, dropByte: row.dropByte, drop: row.dropItems });
    }
    expect(rows['ffx2-youth-league-1-yaibal/x2-yl-yaibal']).toMatchObject({ row: 183, exp: 500, ap: 1, gil: 100, dropByte: 255, drop: [0x9018, 1, 0x9018, 1] });
    expect(rows['ffx2-youth-league-7-lucil/x2-yl-lucil']).toMatchObject({ row: 184, exp: 800, ap: 2, gil: 220, dropByte: 255, drop: [0x901c, 1, 0x901c, 1] });
  });

  it('the party is the Chapter V preset as it is, as a deep copy: Yuna White Mage Lv 46, Rikku and Paine Dark Knights Lv 48 and 50; no kit option (no Hero Drink, no level bonus)', () => {
    expect(youthLeagueBuild).toEqual(farplaneBuild);
    expect(youthLeagueBuild).not.toBe(farplaneBuild);
    expect(youthLeagueBuild.members[0]).not.toBe(farplaneBuild.members[0]);
    expect(youthLeagueBuild.members.map((m) => m.level)).toEqual([46, 48, 50]);
    expect(youthLeagueBuild.inventory.find((i) => i.itemId === 'x2-hero-drink')).toBeUndefined();
    expect(youthLeagueBuild.inventory.find((i) => i.itemId === 'x2-phoenix-down')?.count).toBe(25);
  });
});

describe('the player-facing words tell the truth about the three named fighters (the Fallen Maesters review, major 1)', () => {
  it('the tip and the Sensor lines state what the scripts do: Yaibal raises Yuna (a Phoenix Down, a Hi-Potion), Elma goes for the girl without Reflect, Lucil\'s fifth action is Harbinger (Doom); no move the preset cannot meet', () => {
    expect(YOUTH_LEAGUE_META.tip).toMatch(/Yaibal raises Yuna/);
    expect(YOUTH_LEAGUE_META.tip).toMatch(/Reflect/);
    expect(YOUTH_LEAGUE_META.tip).toMatch(/fifth action is Harbinger/);
    expect(KINDS.yaibal.sensorText).toMatch(/Yuna/);
    expect(KINDS.lucil.sensorText).toMatch(/fifth/i);
    expect(KINDS.elma.sensorText).toMatch(/Reflect/);
    expect(YOUTH_LEAGUE_META.tip.length).toBeLessThanOrEqual(190);
  });
});

describe('the chapter record and its place in the registry', () => {
  it('is hidden: found by getChapter, in EXPERIMENT_CHAPTERS, in neither CHAPTERS nor CHAPTER_IDS (the board stays at nineteen)', () => {
    expect(getChapter(ids.YOUTH_LEAGUE_ID)).toBe(FFX2_YOUTH_LEAGUE);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_YOUTH_LEAGUE);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(ids.YOUTH_LEAGUE_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(ids.YOUTH_LEAGUE_ID)).toBe(false);
    expect(CHAPTERS).toHaveLength(19);
  });

  it('is FFX-2, number 42, experimental, on the Den of Woe\'s own stage (YL7), with Yaibal\'s act as its first formation and the Chapter V party; the number is unique', () => {
    expect(FFX2_YOUTH_LEAGUE).toMatchObject({ id: 'ffx2-youth-league', game: 'ffx2', number: 42, experimental: true, sceneKey: 'den-of-woe' });
    expect(FFX2_YOUTH_LEAGUE.enemyGroupRef).toBe(youthLeagueGroups[0]);
    expect(FFX2_YOUTH_LEAGUE.buildRef).toBe(youthLeagueBuild);
    expect(Object.keys(FFX2_YOUTH_LEAGUE.sensorTexts).sort()).toEqual([...ids.ACT_ENEMY_IDS.flat()].sort());
    for (const { enemy } of FIGHTERS) expect(FFX2_YOUTH_LEAGUE.sensorTexts[enemy.id], enemy.id).toBe(enemy.sensorText);
    expect(EXPERIMENT_CHAPTERS.filter((c) => c.number === 42)).toEqual([FFX2_YOUTH_LEAGUE]);
  });

  it('plays existing cues only (YL8, a flagged stand-in): the FFX-2 field bed, the brass-and-drums duel cue and the FFX-2 fanfare; every formation asks for the same cue', () => {
    expect(FFX2_YOUTH_LEAGUE.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-ffx2-fallen-aeons', victory: 'victory-ffx2' });
    for (const group of youthLeagueGroups) expect(group.musicCues, group.id).toEqual([{ at: 'start', track: 'boss-ffx2-fallen-aeons', fadeMs: 800 }]);
  });

  it('has pause metadata (EXP, three objectives, the Den of Woe\'s plate as the stand-in) registered with the unlisted chapters', () => {
    expect(UNLISTED_CHAPTER_META).toContain(YOUTH_LEAGUE_META);
    expect(YOUTH_LEAGUE_META).toMatchObject({ id: ids.YOUTH_LEAGUE_ID, gameLabel: 'FFX-2', numeral: 'EXP', title: FFX2_YOUTH_LEAGUE.title, location: FFX2_YOUTH_LEAGUE.location, blurb: FFX2_YOUTH_LEAGUE.blurb });
    expect(YOUTH_LEAGUE_META.objectives.map((o) => o.rule)).toEqual([{ kind: 'link-reached', link: 2 }, { kind: 'link-reached', link: 7 }, { kind: 'victory' }]);
    expect(YOUTH_LEAGUE_META.musicKeys).toEqual(['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2']);
    expect(YOUTH_LEAGUE_META.heroArtFallback).toBe('backdrops/den-of-woe.png');
  });

  it('opens by the typed word on chapter select: one row of the door table, FFX-2', () => {
    expect(YOUTH_DOOR_WORD).toBe('youth');
    expect(YOUTH_DOOR_CHAPTER).toBe(ids.YOUTH_LEAGUE_ID);
    expect(CHAPTER_DOORS.find((d) => d.word === YOUTH_DOOR_WORD)?.chapter).toBe(ids.YOUTH_LEAGUE_ID);
  });
});

describe('hygiene: nothing local goes into a committed file or a shipped string (rule: no local path, scratch folder or account name)', () => {
  const FILES = [
    'src/data/youth-league-ids.ts',
    'src/data/chapter-ffx2-youth-league.ts',
    'src/data/chapter-meta-ffx2-youth-league.ts',
    'src/data/ffx2/enemies/youth-league.ts',
    'src/data/ffx2/enemies/youth-league-abilities.ts',
    'src/data/ffx2/enemies/youth-league-abilities-base.ts',
    'src/data/ffx2/enemies/youth-league-abilities-named.ts',
    'src/data/ffx2/command-records/youth-league.ts',
    'src/data/ffx2/monster-records/records-youth-league.ts',
    'src/data/ffx2/builds/youth-league.ts',
    'src/battle/ffx2/ai/youth-league.ts',
    'src/battle/ffx2/ai/youth-league-league.ts',
    'src/app/screens/frontend/youthDoor.ts',
    'src/story/scripts/ffx2-youth-league.ts',
    'research/re-ffx2-youth-league-tournament.md',
    'docs/plans/ch-youth-review.md',
    'tests/fixtures/parity/ffx2/youth_league_rows.json',
  ];
  it('none of the lane\'s files names a drive path, the scratch folders, or an account', () => {
    for (const file of FILES) {
      const text = readFileSync(here(`../../../${file}`), 'utf8');
      expect(text, file).not.toMatch(/(^|[^A-Za-z0-9])[A-Za-z]:[\\/]/);
      expect(text, file).not.toMatch(/pyrefly-scratch|\bw2\/3|\bw3\/4|\bw42\b|Administrator|bpillon|baileypillon|jameve|\.claude[\\/]/i);
    }
  });
});
