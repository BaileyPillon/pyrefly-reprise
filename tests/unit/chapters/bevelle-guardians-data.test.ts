/**
 * The Bevelle Guardians (Georapella and the Precepts Guard on floor 3, the first Baralai on floor 7; the hidden FFX-2 chapter): the data against the game's own rows. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `tests/fixtures/parity/ffx2/bevelle_guardians_rows.json` holds the three monsters' rows (`monster.bin` rows 262, 263 and 175) and the normal scripts' moves (`monmagic.bin` / `command.bin`), read from the kernel tables
 * by the chapter lane (`research/re-ffx2-bevelle-underground.md` §4 and §7), numbers only. This file compares them to the enemy data, the monster records, the command records and the kill-reward rows field by
 * field; it also pins:
 *
 * 1. **The enemies**: level, HP, MP and the stat bytes; the element bytes (all three null Gravity, the first two are weak to Holy); no automatic status.
 * 2. **The ailments** [RE §4.2]: the group-1 and group-2 resist bytes (Slow lands on Georapella only; Baralai can be blinded AND poisoned: the row wins over the note's prose); the special words, with Georapella and the Precepts
 *    Guard the two that can be delayed and interrupted.
 * 3. **The moves**: every row of the fixture, the abilities' own fields consistent with them, and the hit rule (hard rule 5): only Baralai's Attack can miss.
 * 4. **The rewards**: EXP, Gil, AP, the drop byte and the item slots of each row, and the three drops' names.
 * 5. **The chain and the chapter**: three formations chained by `nextGroupId`, links 2 and 3 restore the party with no Save Sphere card, no Escape; the chapter record, its pause metadata, its door word and its place in the registry.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { EnemyDef, FFX2CommandRecord } from '../../../src/battle/common/types.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { DRILLSHOT_DOOR_CHAPTER, DRILLSHOT_DOOR_WORD } from '../../../src/app/screens/frontend/drillshotDoor.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { KILL_ITEM_ID } from '../../../src/battle/ffx2/adapt/kill-rewards.ts';
import { FFX2_BEVELLE_GUARDIANS } from '../../../src/data/chapter-ffx2-bevelle-guardians.ts';
import { BEVELLE_GUARDIANS_META } from '../../../src/data/chapter-meta-ffx2-bevelle-guardians.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_BOSS_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import { baralaiGroup, bevelleGuardiansGroups, georapellaGroup, preceptsGuardGroup, x2Baralai, x2Georapella, x2PreceptsGuard } from '../../../src/data/ffx2/enemies/bevelle-guardians.ts';
import { x2BevelleGuardiansAbilities } from '../../../src/data/ffx2/enemies/bevelle-guardians-abilities.ts';
import { shadeBaralai } from '../../../src/data/ffx2/enemies/den-of-woe.ts';
import { bevelleBuild } from '../../../src/data/ffx2/builds/bevelle.ts';
import { bevelleGuardiansBuild } from '../../../src/data/ffx2/builds/bevelle-guardians.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { COMMAND_RECORDS_BEVELLE_GUARDIANS } from '../../../src/data/ffx2/command-records/bevelle-guardians.ts';
import { KILL_REWARD_ROWS, MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { MONSTER_RECORDS_BEVELLE_GUARDIANS } from '../../../src/data/ffx2/monster-records/records-bevelle-guardians.ts';
import * as ids from '../../../src/data/bevelle-guardians-ids.ts';

interface MonsterRow {
  row: number; id: number; offset: number; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number;
  special: number; absorb: number; null: number; half: number; weak: number; autoStatus1: number; autoStatus2: number;
  exp: number; gil: number; pilfer: number; ap: number; dropByte: number; stealByte: number; zantetsu: number;
  dropItems: number[]; stealItems: number[]; bribeItems: number[];
  resist1: Record<string, number>; resist2: Record<string, number>;
}
interface MoveRow {
  id: number; offset: number; costAtb: number; costCast: number; costMp: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number;
  crit: number; accuracy: number; power: number; hits: number; shatter: number; element: number;
}
interface Fixture {
  monsters: Record<string, MonsterRow>;
  moves: Record<string, MoveRow>;
  statuses: Record<string, { status1?: Record<string, number>; status2?: Record<string, number>; statusTime?: Record<string, number> }>;
}
const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx2/bevelle_guardians_rows.json', import.meta.url)), 'utf8')) as Fixture;

const ENEMIES: Record<string, EnemyDef> = { 'x2-georapella': x2Georapella, 'x2-precepts-guard': x2PreceptsGuard, 'x2-baralai': x2Baralai };
const GROUP_OF: Record<string, string> = {
  'x2-georapella': ids.GEORAPELLA_GROUP_ID,
  'x2-precepts-guard': ids.PRECEPTS_GUARD_GROUP_ID,
  'x2-baralai': ids.BARALAI_GROUP_ID,
};
const numeric = (record: Record<string, number>): Record<number, number> => Object.fromEntries(Object.entries(record).map(([k, v]) => [Number(k), v]));
const resisted = (enemy: EnemyDef, status: string): number => (enemy.immunities as Record<string, number | undefined>)[status] ?? 0;

describe('the three monsters against the rows [RE §4.1]', () => {
  for (const [id, row] of Object.entries(FIXTURE.monsters)) {
    const enemy = ENEMIES[id]!;
    it(`${id}: level, HP, MP and the stat bytes are monster.bin row ${row.row} (offset ${row.offset})`, () => {
      expect(enemy.level).toBe(row.level);
      expect([enemy.hp, enemy.stats.hp, enemy.stats.maxHp]).toEqual([row.hp, row.hp, row.hp]);
      expect([enemy.mp, enemy.stats.mp, enemy.stats.maxMp]).toEqual([row.mp, row.mp, row.mp]);
      expect([enemy.stats.str, enemy.stats.def, enemy.stats.mag, enemy.stats.mdef]).toEqual([row.str, row.def, row.mag, row.mdef]);
      expect([enemy.stats.agi, enemy.stats.acc, enemy.stats.eva, enemy.stats.luck]).toEqual([row.agi, row.acc, row.eva, row.luck]);
    });

    it(`${id}: the rewards are the row's EXP, Gil, AP and Pilfer Gil, and the steal byte is ${row.stealByte}`, () => {
      expect([enemy.rewards.exp, enemy.rewards.gil, enemy.rewards.ap, enemy.rewards.stolenGil]).toEqual([row.exp, row.gil, row.ap, row.pilfer]);
      expect(enemy.rewards.steal?.stealRate).toBe(row.stealByte);
      expect(row.dropByte).toBe(255);
    });

    it(`${id}: the monster record is the row's (special word ${row.special.toString(16)}, Zantetsu ${row.zantetsu}, ACC 95, steal ${row.stealItems.map((n) => n.toString(16)).join(' ')}) and is laid on the enemy`, () => {
      const record = MONSTER_RECORDS[`${GROUP_OF[id]}/${id}`]!;
      expect(record).toBe(MONSTER_RECORDS_BEVELLE_GUARDIANS[`${GROUP_OF[id]}/${id}`]);
      expect([record.row, record.table, record.acc, record.special, record.zantetsu, record.stealByte, record.stealGil]).toEqual([row.row, 1, row.acc, row.special, row.zantetsu, row.stealByte, row.pilfer]);
      expect(record.resist1).toEqual(numeric(row.resist1));
      expect(record.resist2).toEqual(numeric(row.resist2));
      expect([...record.steal]).toEqual(row.stealItems);
      expect([...record.bribe]).toEqual(row.bribeItems);
      expect(enemy.ffx2Record).toBe(record);
    });

    it(`${id}: the element bytes (absorb ${row.absorb}, null ${row.null}, half ${row.half}, weak ${row.weak}) are the enemy's affinities, and nothing is permanent`, () => {
      expect(row.null).toBe(0x10);
      expect(enemy.affinities.gravity).toBe('immune');
      expect(enemy.affinities.holy).toBe(row.weak === 0x20 ? 'weak' : undefined);
      for (const element of ['fire', 'ice', 'lightning', 'water'] as const) expect(enemy.affinities[element], element).toBeUndefined();
      expect([row.absorb, row.half, row.autoStatus1, row.autoStatus2]).toEqual([0, 0, 0, 0]);
      expect(enemy.autoStatuses).toBeUndefined();
    });
  }

  it('Georapella has a Magic of 1 (its Ga spells are a modest tax: an attacker term of 197), Baralai is the fast and evasive one (AGI 135, EVA 33), and the first two are weak to Holy and Baralai to nothing', () => {
    expect(x2Georapella.stats.mag).toBe(1);
    expect(Math.floor(((x2Georapella.stats.mag + 2 * x2Georapella.level!) * 19 * 19) / 64)).toBe(197); // (MAG + 2L) x P x P / 64 [RE §7]
    expect([x2Baralai.stats.agi, x2Baralai.stats.eva]).toEqual([135, 33]);
    expect([x2Georapella, x2PreceptsGuard, x2Baralai].map((e) => e.affinities.holy)).toEqual(['weak', 'weak', undefined]);
  });

  it('the Oversoul versions are NOT used: every record is table 1 (monster.bin), none of monster2.bin (BG7: they cannot be reached in a normal run)', () => {
    for (const record of Object.values(MONSTER_RECORDS_BEVELLE_GUARDIANS)) expect(record.table).toBe(1);
  });
});

describe('the ailments and the special words [RE §4.2]', () => {
  it('all three are immune to Death, Petrify, Sleep, Silence, Confusion, Berserk, Curse, Stop, Doom and Eject', () => {
    for (const enemy of Object.values(ENEMIES)) {
      for (const status of ['ko', 'petrify', 'sleep', 'silence', 'confuse', 'berserk', 'curse', 'stop', 'doom', 'eject']) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(255);
    }
  });

  it('Darkness and Poison: the two floor-3 guardians are immune; Baralai is NOT (he can be blinded, unlike the shade, and the row says Poison lands: the note\'s prose names only Darkness, the row wins)', () => {
    for (const enemy of [x2Georapella, x2PreceptsGuard]) for (const status of ['darkness', 'poison']) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(255);
    for (const status of ['darkness', 'poison']) expect(resisted(x2Baralai, status), `baralai ${status}`).toBe(0);
    expect(resisted(shadeBaralai, 'darkness'), 'the Den of Woe shade is immune to Darkness').toBe(255);
  });

  it('Slow lands on Georapella and is resisted by the Precepts Guard and Baralai; Reflect, Shell, Protect, Regen, Haste and every stat stage are resisted by none', () => {
    expect([x2Georapella, x2PreceptsGuard, x2Baralai].map((e) => resisted(e, 'slow'))).toEqual([0, 255, 255]);
    const stages = ['str', 'mag', 'def', 'mdef', 'accu', 'eva', 'luck'].flatMap((s) => [`${s}-up`, `${s}-down`]);
    for (const enemy of Object.values(ENEMIES)) for (const status of ['reflect', 'shell', 'protect', 'regen', 'haste', ...stages]) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(0);
  });

  it('special words: Georapella and the Precepts Guard (0x183) have neither the no-ATB-damage bit (6) nor the Interrupt bit (9), so they can be delayed and interrupted; Baralai (0x3c3) has both set', () => {
    const SPECIAL_NO_ATB_DAMAGE = 1 << 6;
    const SPECIAL_NO_INTERRUPT = 1 << 9;
    const word = (e: EnemyDef): number => e.ffx2Record!.special;
    expect([word(x2Georapella), word(x2PreceptsGuard), word(x2Baralai)]).toEqual([0x183, 0x183, 0x3c3]);
    for (const enemy of [x2Georapella, x2PreceptsGuard]) {
      expect(word(enemy) & (SPECIAL_NO_ATB_DAMAGE | SPECIAL_NO_INTERRUPT), enemy.id).toBe(0);
      expect(enemy.immunityFlags, enemy.id).not.toContain('immune-to-delay');
      expect(resisted(enemy, 'delay-effect'), `${enemy.id}: a dead delay field would read as protection it does not have`).toBe(0);
      expect(resisted(enemy, 'action-cancel'), enemy.id).toBe(0);
    }
    expect(word(x2Baralai) & SPECIAL_NO_ATB_DAMAGE).not.toBe(0);
    expect(word(x2Baralai) & SPECIAL_NO_INTERRUPT).not.toBe(0);
    expect(x2Baralai.immunityFlags).toContain('immune-to-delay');
    expect([resisted(x2Baralai, 'delay-effect'), resisted(x2Baralai, 'action-cancel')]).toEqual([255, 255]);
    for (const enemy of Object.values(ENEMIES)) expect(enemy.immunityFlags, enemy.id).toContain('immune-to-percentage-damage'); // bit 0
  });
});

describe('the moves against the rows [RE §7]', () => {
  for (const [id, row] of Object.entries(FIXTURE.moves)) {
    it(`${id}: the command record is row 0x${row.id.toString(16)} (offset ${row.offset}) field for field`, () => {
      const record: FFX2CommandRecord = COMMAND_RECORDS_BEVELLE_GUARDIANS[id]!;
      expect(record, id).toBeDefined();
      expect(FFX2_COMMAND_RECORDS[id]).toBe(record);
      expect(
        [record.id, record.costAtb, record.costCast, record.flagsTarget, record.flagsMisc, record.flagsDamage, record.damageClass, record.formula, record.critByte, record.accuracy, record.power, record.hits, record.shatter, record.element],
      ).toEqual([row.id, row.costAtb, row.costCast, row.flagsTarget, row.flagsMisc, row.flagsDamage, row.damageClass, row.formula, row.crit, row.accuracy, row.power, row.hits, row.shatter, row.element]);
      const ability = x2BevelleGuardiansAbilities.find((a) => a.id === id)!;
      expect(ability, id).toBeDefined();
      expect(ability.mpCost).toBe(row.costMp);
      expect(ability.hits).toBe(row.hits);
    });
  }

  it('the Chain Attack\'s second and third strikes run the same row (0x4100)', () => {
    for (const id of ['x2-baralai-chain-attack-2', 'x2-baralai-chain-attack-3']) {
      expect(COMMAND_RECORDS_BEVELLE_GUARDIANS[id], id).toEqual(COMMAND_RECORDS_BEVELLE_GUARDIANS['x2-baralai-chain-attack']);
      expect(x2BevelleGuardiansAbilities.find((a) => a.id === id), id).toBeDefined();
    }
    expect(x2BevelleGuardiansAbilities.find((a) => a.id === 'x2-baralai-chain-attack')!.extra).toEqual({ sequence: ['x2-baralai-chain-attack-2', 'x2-baralai-chain-attack-3'], sequenceTargets: true });
  });

  it('the status bytes: Bio Poison 100; Slow 130 with a counter of 126; Death 254; Looming Glacier Stop 254 with a counter of 126; no other row carries one', () => {
    for (const [id, status] of Object.entries(FIXTURE.statuses)) {
      const record = COMMAND_RECORDS_BEVELLE_GUARDIANS[id]!;
      expect(record.status1, id).toEqual(status.status1 === undefined ? undefined : numeric(status.status1));
      expect(record.status2, id).toEqual(status.status2 === undefined ? undefined : numeric(status.status2));
      expect(record.statusTime, id).toEqual(status.statusTime === undefined ? undefined : numeric(status.statusTime));
    }
    expect(Object.keys(FIXTURE.statuses).sort()).toEqual(['x2-baralai-looming-glacier', 'x2-precepts-guard-bio', 'x2-precepts-guard-death', 'x2-precepts-guard-slow']);
    const ability = (id: string) => x2BevelleGuardiansAbilities.find((a) => a.id === id)!;
    expect(ability('x2-precepts-guard-bio').statusEffects).toEqual([{ status: 'poison', chance: 100, duration: 0 }]);
    expect(ability('x2-precepts-guard-slow').statusEffects).toEqual([{ status: 'slow', chance: 130, duration: 0 }]);
    expect(ability('x2-precepts-guard-death').statusEffects).toEqual([{ status: 'ko', chance: 254, duration: 0 }]);
    expect(ability('x2-baralai-looming-glacier').statusEffects).toEqual([{ status: 'stop', chance: 254, duration: 0 }]);
  });

  it('the Ga spells, Death, Bio, Slow and Drain are reflectable (the misc word has 0x80); Demi is not; Drill Shot is physical-only (Protect halves it, Shell does not) and Demi and the Ga spells magical-only', () => {
    const r = COMMAND_RECORDS_BEVELLE_GUARDIANS;
    for (const id of ['x2-georapella-firaga', 'x2-georapella-blizzaga', 'x2-georapella-thundaga', 'x2-georapella-waterga', 'x2-precepts-guard-death', 'x2-precepts-guard-bio', 'x2-precepts-guard-slow', 'x2-precepts-guard-drain']) {
      expect(r[id]!.flagsMisc & 0x80, id).toBe(0x80);
    }
    expect(r['x2-precepts-guard-demi']!.flagsMisc & 0x80).toBe(0);
    expect(r['x2-baralai-drill-shot']!.flagsDamage & 3).toBe(1);
    expect(r['x2-baralai-glint']!.flagsDamage & 3).toBe(1);
    expect(r['x2-precepts-guard-demi']!.flagsDamage & 3).toBe(2);
    expect(r['x2-georapella-firaga']!.flagsDamage & 3).toBe(2);
  });

  it('Drill Shot is formula 7, power 12: 12/16 = three quarters of the target\'s MAXIMUM HP; Looming Glacier is the MP class, formula 7, power 16: all of her maximum MP; Demi is formula 4, power 4: a quarter of her CURRENT HP', () => {
    const r = COMMAND_RECORDS_BEVELLE_GUARDIANS;
    expect([r['x2-baralai-drill-shot']!.formula, r['x2-baralai-drill-shot']!.power]).toEqual([7, 12]);
    expect([r['x2-baralai-looming-glacier']!.damageClass, r['x2-baralai-looming-glacier']!.formula, r['x2-baralai-looming-glacier']!.power]).toEqual([2, 7, 16]);
    expect([r['x2-precepts-guard-demi']!.formula, r['x2-precepts-guard-demi']!.power, r['x2-baralai-demi']!.formula, r['x2-baralai-demi']!.power]).toEqual([4, 4, 4, 4]);
  });

  it('the ability definitions agree with their rows where the engine reads the definition and not the record: the damage type follows the row\'s damage flags, the Ga spells carry their element', () => {
    const ability = (id: string) => x2BevelleGuardiansAbilities.find((a) => a.id === id)!;
    for (const [id, row] of Object.entries(FIXTURE.moves)) {
      // Rows that are not the HP class (a status, an MP, ATB or HP-and-MP drain) have no damage type to compare; the HP class follows bit 1 (physical) and bit 2 (magical) of the row's damage flags.
      if (row.damageClass !== 1) continue;
      const expected = row.flagsDamage & 1 ? 'physical' : row.flagsDamage & 2 ? 'magical' : 'other';
      expect(ability(id).damageType, `${id} (damage flags 0x${row.flagsDamage.toString(16)})`).toBe(expected);
    }
    expect([ability('x2-georapella-firaga').element, ability('x2-georapella-blizzaga').element, ability('x2-georapella-thundaga').element, ability('x2-georapella-waterga').element]).toEqual([['fire'], ['ice'], ['lightning'], ['water']]);
    expect(ability('x2-precepts-guard-demi').element).toEqual(['gravity']);
    expect(ability('x2-baralai-drill-shot').damageType).toBe('physical');
  });

  it('the abilities are the data catalog\'s (ALL_BOSS_ABILITIES) and none is missing a command record', () => {
    for (const ability of x2BevelleGuardiansAbilities) {
      expect(ALL_BOSS_ABILITIES, ability.id).toContain(ability);
      expect(COMMAND_RECORDS_BEVELLE_GUARDIANS[ability.id], ability.id).toBeDefined();
    }
    expect(x2BevelleGuardiansAbilities).toHaveLength(20);
    expect(new Set(x2BevelleGuardiansAbilities.map((a) => a.id)).size).toBe(20);
    for (const id of Object.keys(COMMAND_RECORDS_BEVELLE_GUARDIANS)) expect(x2BevelleGuardiansAbilities.some((a) => a.id === id), id).toBe(true);
  });

  it('hit rule (rule 5): only Baralai\'s Attack can miss (accuracy formula 2); every other move carries canMiss false, set explicitly', () => {
    const rolls = x2BevelleGuardiansAbilities.filter((a) => a.canMiss === true).map((a) => a.id);
    expect(rolls).toEqual(['x2-baralai-attack']);
    for (const ability of x2BevelleGuardiansAbilities.filter((a) => !rolls.includes(a.id))) expect(ability.canMiss, ability.id).toBe(false);
    expect((COMMAND_RECORDS_BEVELLE_GUARDIANS['x2-baralai-attack']!.flagsMisc >> 3) & 7).toBe(2);
    // every other row's accuracy formula is 0 (always hits) except Death's formula 4 (a status race the kernel decides)
    for (const [id, record] of Object.entries(COMMAND_RECORDS_BEVELLE_GUARDIANS)) {
      if (id === 'x2-baralai-attack') continue;
      expect((record.flagsMisc >> 3) & 7, id).toBe(id === 'x2-precepts-guard-death' ? 4 : 0);
    }
  });

  it('every enemy lists exactly the abilities its script uses', () => {
    expect([...x2Georapella.abilityIds].sort()).toEqual(['x2-georapella-blizzaga', 'x2-georapella-firaga', 'x2-georapella-osmose', 'x2-georapella-thundaga', 'x2-georapella-waterga']);
    expect([...x2PreceptsGuard.abilityIds].sort()).toEqual(['x2-precepts-guard-bio', 'x2-precepts-guard-death', 'x2-precepts-guard-demi', 'x2-precepts-guard-drain', 'x2-precepts-guard-osmose', 'x2-precepts-guard-slow']);
    expect([...x2Baralai.abilityIds].sort()).toEqual([
      'x2-baralai-absorb', 'x2-baralai-attack', 'x2-baralai-chain-attack', 'x2-baralai-chain-attack-2', 'x2-baralai-chain-attack-3', 'x2-baralai-demi', 'x2-baralai-drill-shot', 'x2-baralai-glint', 'x2-baralai-looming-glacier',
    ]);
  });
});

describe('the rewards [RE §4.1]', () => {
  it('the kill-reward rows are the monster rows\' EXP, AP, Gil, drop byte (255, always) and item slots; every drop slot is the same item twice', () => {
    for (const [id, row] of Object.entries(FIXTURE.monsters)) {
      const reward = KILL_REWARD_ROWS[`${GROUP_OF[id]}/${id}`]!;
      expect(reward, id).toBeDefined();
      expect({ table: reward.table, row: reward.row, exp: reward.exp, ap: reward.ap, gil: reward.gil, dropByte: reward.dropByte, drop: [...reward.drop] }, id).toEqual({
        table: 1, row: row.row, exp: row.exp, ap: row.ap, gil: row.gil, dropByte: 255, drop: row.dropItems,
      });
      expect(row.dropItems[0], id).toBe(row.dropItems[2]);
      expect(ENEMIES[id]!.ffx2Record!.kill, id).toBe(reward);
    }
  });

  it('the drops are NulTide Ring (0x902e), Regen Bangle (0x905a) and Pearl Necklace (0x904e), and the authored common drop is the row\'s common slot; the steals are Water Gem, Mana Tablet and Charm Bangle', () => {
    expect([0x902e, 0x905a, 0x904e].map((id) => KILL_ITEM_ID[id])).toEqual(['nultide-ring', 'regen-bangle', 'pearl-necklace']);
    expect([x2Georapella, x2PreceptsGuard, x2Baralai].map((e) => e.rewards.drops.map((d) => d.itemId))).toEqual([['nultide-ring'], ['regen-bangle'], ['pearl-necklace']]);
    expect([x2Georapella, x2PreceptsGuard, x2Baralai].map((e) => [e.rewards.steal!.common.itemId, e.rewards.steal!.common.count, e.rewards.steal!.rare.count])).toEqual([
      ['x2-water-gem', 1, 2],
      ['x2-mana-tablet', 1, 2],
      ['charm-bangle', 1, 1],
    ]);
    expect(KILL_ITEM_ID[0x9072]).toBe('charm-bangle');
  });
});

describe('the chain: three formations, each a fresh fight (BG1)', () => {
  it('Georapella, the Precepts Guard and Baralai chain by nextGroupId and are registered by id', () => {
    expect(bevelleGuardiansGroups.map((g) => g.id)).toEqual([...ids.BEVELLE_GUARDIANS_GROUP_IDS]);
    expect(bevelleGuardiansGroups.map((g) => g.nextGroupId)).toEqual([ids.PRECEPTS_GUARD_GROUP_ID, ids.BARALAI_GROUP_ID, undefined]);
    for (const group of bevelleGuardiansGroups) expect(ENEMY_GROUPS_BY_ID[group.id], group.id).toBe(group);
    expect(bevelleGuardiansGroups.map((g) => g.enemies.map((e) => e.id))).toEqual([['x2-georapella'], ['x2-precepts-guard'], ['x2-baralai']]);
    expect(bevelleGuardiansGroups.map((g) => g.enemies[0]!.level)).toEqual([17, 21, 24]); // ascending level: the order is the driver's pick BG1
    for (const group of bevelleGuardiansGroups) {
      expect(group.game).toBe('ffx2');
      expect(group.parts).toBeUndefined(); // one guardian an act, no adds [RE §5.1] (the weapon prop of row 298 is a visual only)
    }
  });

  it('links 2 and 3 restore the party with no Save Sphere card and are the retry checkpoints; link 1 does neither; nobody can escape', () => {
    expect([georapellaGroup, preceptsGuardGroup, baralaiGroup].map((g) => g.restoresPartyOnEntry === true)).toEqual([false, true, true]);
    expect([georapellaGroup, preceptsGuardGroup, baralaiGroup].map((g) => g.noSaveSphereCard === true)).toEqual([false, true, true]);
    for (const group of bevelleGuardiansGroups) {
      expect(group.canEscape, group.id).toBe(false);
      expect(group.carriesPartyState, group.id).toBeUndefined(); // each link is fresh: no statuses or worn dressphere carried
      expect(group.hopelessRetry, group.id).toBeUndefined();
    }
  });

  it('the scripts the enemies name are registered and the ids file agrees', () => {
    for (const enemy of Object.values(ENEMIES)) expect(aiScriptFor(enemy.aiScriptId).id, enemy.id).toBe(enemy.aiScriptId);
    expect(ids.BEVELLE_GUARDIANS_BODY_IDS).toEqual(['x2-georapella', 'x2-precepts-guard', 'x2-baralai']);
    expect(ids.BEVELLE_GUARDIANS_ROWS).toEqual([262, 263, 175]);
    expect(Object.values(FIXTURE.monsters).map((m) => m.row)).toEqual([262, 263, 175]);
  });

  it('plays existing cues only (BG5, flagged stand-ins): boss-bahamut on acts 1 and 2, boss-den-of-woe on act 3', () => {
    expect(georapellaGroup.musicCues).toEqual([{ at: 'start', track: 'boss-bahamut', fadeMs: 800 }]);
    expect(preceptsGuardGroup.musicCues).toEqual([{ at: 'start', track: 'boss-bahamut', fadeMs: 800 }]);
    expect(baralaiGroup.musicCues).toEqual([{ at: 'start', track: 'boss-den-of-woe', fadeMs: 800 }]);
  });

  it('art (r76b art install): each guardian draws a set of its own (`x2-georapella`, `x2-precepts-guard`, `x2-baralai`: the living man, no longer the Den of Woe shade\'s painting)', () => {
    expect([x2Georapella.spriteKey, x2PreceptsGuard.spriteKey, x2Baralai.spriteKey]).toEqual(['x2-georapella', 'x2-precepts-guard', 'x2-baralai']);
    expect(x2Baralai.spriteKey).not.toBe(shadeBaralai.spriteKey);
    expect(shadeBaralai.spriteKey).toBe('baralai-shade');
  });
});

describe('the party (BG2)', () => {
  it('is the Bahamut chapter\'s Chapter 2 party as it is (Yuna 23, Rikku 24, Paine 25), as a deep copy that leaves the Bahamut chapter\'s build untouched', () => {
    expect(bevelleGuardiansBuild).toEqual(bevelleBuild);
    expect(bevelleGuardiansBuild).not.toBe(bevelleBuild);
    expect(bevelleGuardiansBuild.members[0]).not.toBe(bevelleBuild.members[0]);
    expect(bevelleGuardiansBuild.members.map((m) => m.level)).toEqual([23, 24, 25]);
    // Holy is the first two guardians' weakness and nothing in the kit gives it (rule 6: nothing is added)
    const learned = bevelleGuardiansBuild.members.flatMap((m) => Object.values(m.abilitiesLearned ?? {}).flatMap((l) => l.learned));
    expect(learned.filter((id) => /holy|pray/i.test(id))).toEqual([]);
  });
});

describe('the chapter record and its place in the registry', () => {
  it('is hidden: found by getChapter, in EXPERIMENT_CHAPTERS, in neither CHAPTERS nor CHAPTER_IDS (the board stays at nineteen)', () => {
    expect(getChapter(ids.BEVELLE_GUARDIANS_ID)).toBe(FFX2_BEVELLE_GUARDIANS);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_BEVELLE_GUARDIANS);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(ids.BEVELLE_GUARDIANS_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(ids.BEVELLE_GUARDIANS_ID)).toBe(false);
    expect(CHAPTERS).toHaveLength(19);
  });

  it('is FFX-2, number 37, experimental, on the Bevelle Underground\'s own scene, with Georapella as its first formation and the Chapter 2 party', () => {
    expect(FFX2_BEVELLE_GUARDIANS).toMatchObject({ id: 'ffx2-bevelle-guardians', game: 'ffx2', number: 37, experimental: true, sceneKey: 'bevelle-underground' });
    expect(FFX2_BEVELLE_GUARDIANS.enemyGroupRef).toBe(georapellaGroup);
    expect(FFX2_BEVELLE_GUARDIANS.buildRef).toBe(bevelleGuardiansBuild);
    expect(Object.keys(FFX2_BEVELLE_GUARDIANS.sensorTexts).sort()).toEqual([...ids.BEVELLE_GUARDIANS_BODY_IDS].sort());
    for (const enemy of Object.values(ENEMIES)) expect(FFX2_BEVELLE_GUARDIANS.sensorTexts[enemy.id], enemy.id).toBe(enemy.sensorText);
  });

  it('plays the FFX-2 field bed, the Bahamut cue and the FFX-2 fanfare (BG5)', () => {
    expect(FFX2_BEVELLE_GUARDIANS.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-bahamut', victory: 'victory-ffx2' });
  });

  it('has pause metadata (EXP, three objectives, a stand-in plate) registered with the unlisted chapters', () => {
    expect(UNLISTED_CHAPTER_META).toContain(BEVELLE_GUARDIANS_META);
    expect(BEVELLE_GUARDIANS_META).toMatchObject({ id: ids.BEVELLE_GUARDIANS_ID, gameLabel: 'FFX-2', numeral: 'EXP', title: FFX2_BEVELLE_GUARDIANS.title, location: FFX2_BEVELLE_GUARDIANS.location, blurb: FFX2_BEVELLE_GUARDIANS.blurb });
    expect(BEVELLE_GUARDIANS_META.objectives.map((o) => o.rule)).toEqual([{ kind: 'link-reached', link: 2 }, { kind: 'link-reached', link: 3 }, { kind: 'victory' }]);
    expect(BEVELLE_GUARDIANS_META.musicKeys).toEqual(['scene-bevelle-underground', 'boss-bahamut', 'boss-den-of-woe', 'victory-ffx2']);
  });

  it('opens by the typed word on chapter select: one row of the door table, FFX-2, the last row', () => {
    expect(DRILLSHOT_DOOR_WORD).toBe('drillshot');
    expect(DRILLSHOT_DOOR_CHAPTER).toBe(ids.BEVELLE_GUARDIANS_ID);
    expect(CHAPTER_DOORS.find((d) => d.word === DRILLSHOT_DOOR_WORD)?.chapter).toBe(ids.BEVELLE_GUARDIANS_ID);
  });

  it('the player-facing words tell the truth: the tip names the counter and the raise after Death (nothing in the kit guards against it), and claims no Holy and no Slow for the Precepts Guard', () => {
    expect(BEVELLE_GUARDIANS_META.tip).toMatch(/Drill Shot/);
    expect(BEVELLE_GUARDIANS_META.tip).toMatch(/tenth/);
    expect(BEVELLE_GUARDIANS_META.tip).toMatch(/Death/);
    expect(BEVELLE_GUARDIANS_META.tip).toMatch(/Phoenix Down/);
    expect(BEVELLE_GUARDIANS_META.tip).not.toMatch(/guard against/i);
    expect(BEVELLE_GUARDIANS_META.tip, 'the lever the bench measured: a White Mage has no Attack row, a Gunner Yuna wins 98 in 100').toMatch(/Change Yuna to a Gunner/);
    expect(BEVELLE_GUARDIANS_META.tip, 'the shot is survivable: the tip says protect her, not that the count must be stopped').not.toMatch(/stop at nine/i);
    expect(x2Baralai.sensorText).toMatch(/Gunner/);
    expect(BEVELLE_GUARDIANS_META.tip).not.toMatch(/Holy|Slow/);
    expect(x2PreceptsGuard.sensorText).toMatch(/do not bother slowing/); // it is immune to Slow [RE §4.2]
    expect(x2PreceptsGuard.sensorText).toMatch(/Phoenix Downs/);
    expect(x2Georapella.sensorText).toMatch(/Slow it/); // it is not
  });
});
