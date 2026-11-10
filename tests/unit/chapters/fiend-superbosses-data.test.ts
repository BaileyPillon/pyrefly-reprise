/**
 * The Fiend Arena Superbosses (Almighty Shinra, then the Major Numerus's seven actors; the hidden FFX-2 chapter 53, the word `legion`): the data against the game's own rows. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `tests/fixtures/parity/ffx2/fiend_superbosses_rows.json` holds the eight monster rows (`monster.bin` rows 329 to 336) and the 36 move rows the five scripts queue (`monmagic.bin`, `command.bin`), decoded from the kernel
 * tables by a script (`research/re-ffx2-fiend-arena-superbosses.md` sections 0, 3 and 4), numbers only. This file compares them to the enemy data, the monster records, the command records and the kill-reward rows field by
 * field; it also pins:
 *
 * 1. **The enemies**: level, HP, MP and the stat bytes; the element bytes (Shinra nulls Gravity, each head nulls Fire, Ice, Thunder, Water and Gravity); the permanent statuses (Spellspring on all five, Regen on Shinra).
 * 2. **The ailments** [RE section 0]: every resist byte of both groups, the special words (the percent-immune, no-ATB-damage and Interrupt-immune bits), Reflect on Shinra alone.
 * 3. **The parts**: the body, pod and tail are Lv 1, 1 HP, no moves, no loot, and are hidden, untargetable parts that never gate victory.
 * 4. **The moves**: every row, the abilities' own fields consistent with them, the hit rule (hard rule 5), the four Commands' 99,999 limit bit and 220 charge, and the 22 rows reused from other chapters (each a second witness).
 * 5. **The chain and the hygiene** of the files this lane added (no local path, scratch name or account name).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { AbilityDef, EnemyDef, FFX2CommandRecord } from '../../../src/battle/common/types.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../../../src/battle/ffx2/adapt/slots.ts';
import { ALL_BOSS_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import {
  act1ShinraGroup,
  act2NumerusGroup,
  fiendSuperbossesGroups,
  x2AlmightyShinra,
  x2NumerusBody,
  x2NumerusDuo,
  x2NumerusPod,
  x2NumerusQuattour,
  x2NumerusTail,
  x2NumerusTria,
  x2NumerusUnum,
} from '../../../src/data/ffx2/enemies/fiend-superbosses.ts';
import { x2FiendSuperbossesAbilities } from '../../../src/data/ffx2/enemies/fiend-superbosses-abilities.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { COMMAND_RECORDS_FIEND_SUPERBOSSES } from '../../../src/data/ffx2/command-records/fiend-superbosses.ts';
import { KILL_REWARD_ROWS, MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { MONSTER_RECORDS_FIEND_SUPERBOSSES } from '../../../src/data/ffx2/monster-records/records-fiend-superbosses.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import * as ids from '../../../src/data/fiend-superbosses-ids.ts';

interface MonsterRow {
  row: number; id: number; offset: number; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number;
  special: number; absorb: number; null: number; half: number; weak: number; autoStatus1: number; autoStatus2: number;
  exp: number; gil: number; pilfer: number; ap: number; dropByte: number; stealByte: number; zantetsu: number;
  resist1: Record<string, number>; resist2: Record<string, number>;
  waza: number[]; dropItems: number[]; stealItems: number[]; bribeItems: number[]; thinking: number; basaku: number; species: number; name: string;
}
interface MoveRow {
  id: number; offset: number; costAtb: number; costCast: number; costMp: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number;
  crit: number; accuracy: number; power: number; hits: number; shatter: number; element: number; category: number; name: string;
}
interface Fixture {
  monsters: Record<string, MonsterRow>;
  moves: Record<string, MoveRow>;
  statuses: Record<string, { status1?: Record<string, number>; status2?: Record<string, number>; statusTime?: Record<string, number> }>;
}
const here = (path: string): string => fileURLToPath(new URL(path, import.meta.url));
const FIXTURE = JSON.parse(readFileSync(here('../../fixtures/parity/ffx2/fiend_superbosses_rows.json'), 'utf8')) as Fixture;

const ENEMIES: Record<string, EnemyDef> = {
  'x2-almighty-shinra': x2AlmightyShinra,
  'x2-numerus-unum': x2NumerusUnum,
  'x2-numerus-duo': x2NumerusDuo,
  'x2-numerus-tria': x2NumerusTria,
  'x2-numerus-quattour': x2NumerusQuattour,
  'x2-numerus-body': x2NumerusBody,
  'x2-numerus-pod': x2NumerusPod,
  'x2-numerus-tail': x2NumerusTail,
};
const HEADS = [x2NumerusUnum, x2NumerusDuo, x2NumerusTria, x2NumerusQuattour];
const PARTS = [x2NumerusBody, x2NumerusPod, x2NumerusTail];
const GROUP_OF = (id: string): string => (id === 'x2-almighty-shinra' ? ids.ACT_1_GROUP_ID : ids.ACT_2_GROUP_ID);
const numeric = (record: Record<string, number>): Record<number, number> => Object.fromEntries(Object.entries(record).map(([k, v]) => [Number(k), v]));
const SPECIAL_NO_ATB_DAMAGE = 1 << 6;
const SPECIAL_NO_INTERRUPT = 1 << 9;
const ELEMENT_BIT: Record<string, number> = { fire: 1, ice: 2, lightning: 4, water: 8, gravity: 16, holy: 32 };
const ALL_ABILITIES: ReadonlyMap<string, AbilityDef> = new Map(ALL_BOSS_ABILITIES.map((a) => [a.id, a]));

describe('the eight actors against the rows [RE section 0]', () => {
  for (const [id, row] of Object.entries(FIXTURE.monsters)) {
    const enemy = ENEMIES[id]!;
    it(`${id}: level, HP, MP and the stat bytes are monster.bin row ${row.row} (offset ${row.offset}, id 0x${row.id.toString(16)})`, () => {
      expect(enemy.level).toBe(row.level);
      expect([enemy.hp, enemy.stats.hp, enemy.stats.maxHp]).toEqual([row.hp, row.hp, row.hp]);
      expect([enemy.mp, enemy.stats.mp, enemy.stats.maxMp]).toEqual([row.mp, row.mp, row.mp]);
      expect([enemy.stats.str, enemy.stats.def, enemy.stats.mag, enemy.stats.mdef]).toEqual([row.str, row.def, row.mag, row.mdef]);
      expect([enemy.stats.agi, enemy.stats.acc, enemy.stats.eva, enemy.stats.luck]).toEqual([row.agi, row.acc, row.eva, row.luck]);
      expect(enemy.forms.map((f) => f.hp)).toEqual([row.hp]);
    });

    it(`${id}: the rewards are the row's EXP ${row.exp}, Gil ${row.gil}, AP ${row.ap} and Pilfer Gil ${row.pilfer}, and the steal byte is ${row.stealByte}`, () => {
      expect([enemy.rewards.exp, enemy.rewards.gil, enemy.rewards.ap, enemy.rewards.stolenGil ?? 0]).toEqual([row.exp, row.gil, row.ap, row.pilfer]);
      expect(enemy.rewards.steal?.stealRate).toBe(row.stealByte === 0 ? undefined : row.stealByte);
      const NAME: Record<number, string> = { 0x2003: 'x2-mega-potion', 0x2002: 'x2-x-potion', 0x2005: 'x2-turbo-ether', 0x2007: 'x2-mega-phoenix', 0x2008: 'x2-elixir', 0x2009: 'x2-megalixir', 0x202e: 'x2-dark-matter' };
      if (row.stealByte === 0) {
        expect(enemy.rewards.steal).toBeUndefined();
        return;
      }
      expect(enemy.rewards.steal?.common).toEqual({ itemId: NAME[row.stealItems[0]!], count: row.stealItems[1] });
      expect(enemy.rewards.steal?.rare).toEqual({ itemId: NAME[row.stealItems[2]!], count: row.stealItems[3] });
    });

    it(`${id}: the monster record is the row's (special word 0x${row.special.toString(16)}, Zantetsu ${row.zantetsu}, ACC ${row.acc}) and is laid on the enemy`, () => {
      const record = MONSTER_RECORDS[`${GROUP_OF(id)}/${id}`]!;
      expect(record).toBe(MONSTER_RECORDS_FIEND_SUPERBOSSES[`${GROUP_OF(id)}/${id}`]);
      expect([record.row, record.table, record.acc, record.special, record.species, record.zantetsu, record.stealByte, record.stealGil]).toEqual([row.row, 1, row.acc, row.special, row.species, row.zantetsu, row.stealByte, row.pilfer]);
      expect(record.resist1).toEqual(numeric(row.resist1));
      expect(record.resist2).toEqual(numeric(row.resist2));
      expect(record.steal).toEqual(row.stealItems);
      expect(record.bribe).toEqual(row.bribeItems);
      expect(enemy.ffx2Record).toBe(record);
    });

    it(`${id}: the resist bytes of both groups are laid on the enemy, slot by slot (255 immune), and nothing else is resisted but the two hidden bytes`, () => {
      const got = enemy.immunities as Record<string, number | undefined>;
      const expected: Record<string, number> = { 'delay-effect': 255, 'action-cancel': 255 };
      if (enemy.flags?.isPart === true) delete (expected as Record<string, number | undefined>)['delay-effect'];
      for (const [slot, byte] of Object.entries(row.resist1)) {
        const status = GROUP1_STATUS[Number(slot)];
        if (status !== null && status !== undefined) expected[status] = byte;
      }
      for (const [slot, byte] of Object.entries(row.resist2)) for (const status of GROUP2_STATUS[Number(slot)] ?? []) expected[status] = byte;
      for (const [status, byte] of Object.entries(expected)) {
        if (enemy.flags?.isPart === true && (status === 'action-cancel' || status === 'delay-effect')) continue;
        expect(got[status], `${id} ${status}`).toBe(byte);
      }
      const extra = Object.keys(got).filter((s) => got[s] !== undefined && got[s]! > 0 && expected[s] === undefined);
      expect(extra, `${id}: a resist byte the row does not give`).toEqual([]);
    });
  }

  it('the permanent statuses: Spellspring (group-1 mask 0x2000, slot 13) on Shinra and the four heads; Regen (group-2 mask 0x8, slot 3) on Shinra alone; the parts have none', () => {
    for (const [id, row] of Object.entries(FIXTURE.monsters)) {
      const enemy = ENEMIES[id]!;
      const expected = [row.autoStatus1 === 0x2000 ? 'spellspring' : null, row.autoStatus2 === 0x8 ? 'regen' : null].filter((s) => s !== null);
      expect([row.autoStatus1, row.autoStatus2].every((m) => m === 0 || m === 0x2000 || m === 0x8), `${id}: an unmapped auto-status mask`).toBe(true);
      expect(enemy.autoStatuses ?? [], id).toEqual(expected);
    }
    expect(FIXTURE.monsters['x2-almighty-shinra']!.autoStatus2).toBe(0x8);
    expect(GROUP2_STATUS[3]).toEqual(['regen']);
    expect(GROUP1_STATUS[13]).toBe('spellspring');
  });

  it('the element bytes: Shinra nulls Gravity (0x10); each head nulls Fire, Ice, Thunder, Water and Gravity (0x1f); nothing is absorbed, halved or weak; the parts have none', () => {
    for (const [id, row] of Object.entries(FIXTURE.monsters)) {
      const enemy = ENEMIES[id]!;
      expect([row.absorb, row.half, row.weak], id).toEqual([0, 0, 0]);
      const nulls = Object.entries(enemy.affinities).filter(([, a]) => a === 'immune').reduce((bits, [el]) => bits | (ELEMENT_BIT[el] ?? 0), 0);
      expect(nulls, id).toBe(row.null);
      expect(Object.values(enemy.affinities).every((a) => a === 'immune'), id).toBe(true);
    }
    expect([FIXTURE.monsters['x2-almighty-shinra']!.null, FIXTURE.monsters['x2-numerus-unum']!.null]).toEqual([0x10, 0x1f]);
  });

  it('the Oversoul versions are NOT used: every record is table 1 (monster.bin), none of monster2.bin; and the species word is 0 on all eight', () => {
    for (const record of Object.values(MONSTER_RECORDS_FIEND_SUPERBOSSES)) {
      expect(record.table).toBe(1);
      expect(record.species).toBe(0);
    }
    for (const row of Object.values(FIXTURE.monsters)) expect(row.species).toBe(0);
  });

  it('special words 0x3db (Shinra) and 0x7c3 (the heads): the percent-immune, no-ATB-damage and Interrupt bits are set (delay, Interrupt and the percent formulas do nothing); bit 10 of the heads is unmapped and claims nothing; the Reflect byte is 255 on Shinra alone', () => {
    const word = (e: EnemyDef): number => e.ffx2Record!.special;
    expect([word(x2AlmightyShinra), ...HEADS.map(word)]).toEqual([0x3db, 0x7c3, 0x7c3, 0x7c3, 0x7c3]);
    for (const enemy of [x2AlmightyShinra, ...HEADS]) {
      expect(word(enemy) & SPECIAL_NO_ATB_DAMAGE, enemy.id).not.toBe(0);
      expect(word(enemy) & SPECIAL_NO_INTERRUPT, enemy.id).not.toBe(0);
      expect(word(enemy) & 1, enemy.id).toBe(1);
      expect(enemy.immunityFlags, enemy.id).toEqual(['boss', 'immune-to-percentage-damage', 'immune-to-delay']);
      expect((enemy.immunities as Record<string, number>)['action-cancel'], enemy.id).toBe(255);
      expect((enemy.immunities as Record<string, number>)['delay-effect'], enemy.id).toBe(255);
    }
    const reflect = (e: EnemyDef): number => (e.immunities as Record<string, number | undefined>)['reflect'] ?? 0;
    expect([x2AlmightyShinra, ...HEADS].map(reflect)).toEqual([255, 0, 0, 0, 0]);
    // Shinra and the heads can be hasted, shelled, protected and regenerated by their own scripts: those four are not resisted.
    for (const enemy of [x2AlmightyShinra, ...HEADS]) for (const status of ['shell', 'protect', 'regen', 'haste']) expect((enemy.immunities as Record<string, number | undefined>)[status] ?? 0, `${enemy.id} ${status}`).toBe(0);
  });

  it('the totals the note quotes: the four heads hold 2,666,664 HP; with Shinra 2,941,664', () => {
    const total = HEADS.reduce((sum, h) => sum + h.hp, 0);
    expect(total).toBe(2_666_664);
    expect(total + x2AlmightyShinra.hp).toBe(2_941_664);
    expect(HEADS.map((h) => h.hp)).toEqual([555_555, 666_666, 666_666, 777_777]);
  });

  it('the identities: the five named actors read as the note names them; the parts are never shown', () => {
    expect([x2AlmightyShinra.name, ...HEADS.map((h) => h.name)]).toEqual(['Almighty Shinra', 'Unum', 'Duo', 'Tria', 'Quattour']);
    for (const [id, row] of Object.entries(FIXTURE.monsters)) {
      if (id.endsWith('-body') || id.endsWith('-pod') || id.endsWith('-tail')) expect(row.name, id).toMatch(/^Iutycyr Boss (Body|Pod|Tail)$/); // the game's developer label
      else expect(row.name, id).toBe(ENEMIES[id]!.name);
    }
  });
});

describe('the seven actors of the Major Numerus [RE section 2]', () => {
  it('the three parts are Lv 1 with 1 HP and 1 in every stat, no moves, no loot, no steal; the heads are the only things with real HP', () => {
    for (const part of PARTS) {
      expect([part.level, part.hp, part.mp]).toEqual([1, 1, 1]);
      expect(Object.values(part.stats)).toEqual(Array(12).fill(1));
      expect(part.abilityIds).toEqual([]);
      expect(part.rewards).toEqual({ ap: 0, apOverkill: 0, gil: 0, exp: 0, overkillThreshold: 0, drops: [] });
      expect(part.aiScriptId).toBe('idle'); // no script lines in the game: the registry's idle script
      expect(aiScriptFor(part.aiScriptId).id).toBe('idle');
    }
    for (const head of HEADS) expect(head.hp).toBeGreaterThan(500_000);
  });

  it('the parts are hidden, untargetable, bar-less parts of the formation: they never gate victory (battle/ffx2/results.ts), so the last head down ends the fight, as the heads\' own death rule does', () => {
    for (const part of PARTS) expect(part.flags).toEqual({ isPart: true, hidden: true, untargetable: true, hideHpBar: true });
    for (const head of HEADS) expect(head.flags).toEqual({ isBoss: true });
    expect(act2NumerusGroup.enemies).toEqual(HEADS);
    expect(act2NumerusGroup.parts).toEqual(PARTS);
  });

  it('seven actors: four enemies and three parts, slots 0 to 3 and 4 to 6 (the stage places a combatant by its slot), each id once', () => {
    const all = [...act2NumerusGroup.enemies, ...(act2NumerusGroup.parts ?? [])];
    expect(all).toHaveLength(7);
    expect(all.map((e) => e.slot)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(new Set(all.map((e) => e.id)).size).toBe(7);
    expect(all.map((e) => e.id)).toEqual([...ids.NUMERUS_HEAD_IDS, ...ids.NUMERUS_PART_IDS]);
  });
});

describe('the moves against the rows [RE sections 3 and 4]', () => {
  const FS_IDS = Object.values(ids.FS_ABILITY);

  it('the fixture holds exactly the moves of FS_ABILITY, plus the Die row of the death handler (a documentation row: not a move here, the parts are `isPart`)', () => {
    expect(Object.keys(FIXTURE.moves).sort()).toEqual([...FS_IDS, 'kernel-die-row'].sort());
    expect(FS_IDS).toHaveLength(35);
    expect(new Set(FS_IDS).size).toBe(35);
    const die = FIXTURE.moves['kernel-die-row']!;
    expect([die.id, die.flagsTarget, die.flagsMisc, die.hits, die.power, die.costCast]).toEqual([0x4211, 0x41, 0x2, 0, 0, 0]);
  });

  for (const id of FS_IDS) {
    const row = FIXTURE.moves[id]!;
    it(`${id}: the command record is row 0x${row.id.toString(16)} "${row.name}" (offset ${row.offset}) field for field`, () => {
      const record: FFX2CommandRecord | undefined = FFX2_COMMAND_RECORDS[id];
      expect(record, id).toBeDefined();
      if (id.startsWith('x2-fs-')) expect(record).toBe(COMMAND_RECORDS_FIEND_SUPERBOSSES[id]);
      expect(
        [record!.id, record!.costAtb, record!.costCast, record!.category, record!.flagsTarget, record!.flagsMisc, record!.flagsDamage, record!.damageClass, record!.formula, record!.critByte, record!.accuracy, record!.power, record!.hits, record!.shatter, record!.element],
      ).toEqual([row.id, row.costAtb, row.costCast, row.category, row.flagsTarget, row.flagsMisc, row.flagsDamage, row.damageClass, row.formula, row.crit, row.accuracy, row.power, row.hits, row.shatter, row.element]);
      const status = FIXTURE.statuses[id] ?? {};
      expect(record!.status1, `${id} status1`).toEqual(status.status1 === undefined ? undefined : numeric(status.status1));
      expect(record!.status2, `${id} status2`).toEqual(status.status2 === undefined ? undefined : numeric(status.status2));
      expect(record!.statusTime, `${id} statusTime`).toEqual(status.statusTime === undefined ? undefined : numeric(status.statusTime));
    });

    it(`${id}: the ability definition agrees with the row: power, hits, the damage type from the damage flags, the element, the hit rule from the accuracy formula`, () => {
      const a = ALL_ABILITIES.get(id)!;
      expect(a, `${id} is in the data catalog`).toBeDefined();
      expect(a.game).toBe('ffx2');
      expect(a.power, `${id}: the ability's power is the row's`).toBe(row.power);
      expect(a.hits, `${id}: hits`).toBe(row.hits);
      // A row follows bit 0 (physical) and bit 1 (magical) of the damage flags; a row with neither is "other" (status, healing, the Commands).
      expect(a.damageType, `${id} (damage flags 0x${row.flagsDamage.toString(16)})`).toBe(row.flagsDamage & 1 ? 'physical' : row.flagsDamage & 2 ? 'magical' : 'other');
      // The element byte is one bit of the six, or none.
      const bits = Object.entries(ELEMENT_BIT).filter(([, bit]) => (row.element & bit) !== 0).map(([el]) => el);
      expect(a.element, `${id}: element`).toEqual(bits.length === 0 ? ['none'] : bits);
      // Hit rule (hard rule 5): a move can miss exactly where its accuracy formula (misc bits 3 to 5) is not 0, set explicitly.
      expect(a.canMiss, `${id}: canMiss is set explicitly`).toBe(((row.flagsMisc >> 3) & 7) !== 0);
      expect((a.flags ?? []).includes('weak-delay'), `${id}: weak delay`).toBe((row.flagsMisc & 0x1000) !== 0);
      expect((a.flags ?? []).includes('strong-delay'), `${id}: strong delay`).toBe((row.flagsMisc & 0x2000) !== 0);
      if (id.startsWith('x2-fs-')) {
        expect(a.mpCost, `${id}: mp`).toBe(row.costMp);
        expect((a.flags ?? []).includes('reflectable'), `${id}: reflectable`).toBe((row.flagsMisc & 0x80) !== 0);
        expect((a.flags ?? []).includes('heals'), `${id}: heals`).toBe((row.flagsDamage & 0x10) !== 0);
      }
    });
  }

  it('the targets each script gives its moves (RE section 3): one girl, all three, spread over the three, the monster side, or himself', () => {
    const T: Record<string, AbilityDef['targeting']> = {
      [ids.FS_ABILITY.attack]: 'single-enemy', [ids.FS_ABILITY.clione]: 'random-enemy', [ids.FS_ABILITY.ultimaShinra]: 'all-enemies', [ids.FS_ABILITY.finalImpact]: 'random-enemy',
      [ids.FS_ABILITY.fullBreak]: 'single-enemy', [ids.FS_ABILITY.fireworks]: 'all-enemies', [ids.FS_ABILITY.haste]: 'self',
      [ids.FS_ABILITY.radisCommand]: 'single-enemy', [ids.FS_ABILITY.sparkler]: 'single-enemy', [ids.FS_ABILITY.dispel]: 'single-enemy', [ids.FS_ABILITY.shell]: 'all-allies',
      [ids.FS_ABILITY.whiteHighwind]: 'all-allies', [ids.FS_ABILITY.protect]: 'all-allies',
      [ids.FS_ABILITY.blackSky]: 'random-enemy', [ids.FS_ABILITY.bio]: 'all-enemies', [ids.FS_ABILITY.flare]: 'single-enemy', [ids.FS_ABILITY.break]: 'single-enemy', [ids.FS_ABILITY.ultima]: 'all-enemies',
      [ids.FS_ABILITY.confuse]: 'single-enemy', [ids.FS_ABILITY.sleep]: 'single-enemy', [ids.FS_ABILITY.demi]: 'all-enemies', [ids.FS_ABILITY.berserk]: 'single-enemy', [ids.FS_ABILITY.blind]: 'single-enemy',
      [ids.FS_ABILITY.silence]: 'single-enemy', [ids.FS_ABILITY.slowga]: 'all-enemies', [ids.FS_ABILITY.venamCommand]: 'all-enemies',
      [ids.FS_ABILITY.firaga]: 'all-enemies', [ids.FS_ABILITY.blizzaga]: 'all-enemies', [ids.FS_ABILITY.thundaga]: 'all-enemies', [ids.FS_ABILITY.waterga]: 'all-enemies', [ids.FS_ABILITY.holy]: 'single-enemy',
      [ids.FS_ABILITY.fulmenCommand]: 'all-enemies', [ids.FS_ABILITY.absorb]: 'single-enemy', [ids.FS_ABILITY.mortisCommand]: 'all-enemies', [ids.FS_ABILITY.meteor]: 'random-enemy',
    };
    expect(Object.keys(T).sort()).toEqual([...Object.values(ids.FS_ABILITY)].sort());
    for (const [id, targeting] of Object.entries(T)) expect(ALL_ABILITIES.get(id)!.targeting, id).toBe(targeting);
  });

  it('the four Commands (Radis 0x421a, Venam 0x421b, Fulmen 0x421c, Mortis 0x421d): a 220 charge, the 99,999 damage-limit bit (flagsDamage 0x80) and NEITHER the physical nor the magical bit, no accuracy roll, power 58 / 30 / 255 / 36; Fulmen is Thunder', () => {
    const commands = [ids.FS_ABILITY.radisCommand, ids.FS_ABILITY.venamCommand, ids.FS_ABILITY.fulmenCommand, ids.FS_ABILITY.mortisCommand];
    const rows = commands.map((id) => FFX2_COMMAND_RECORDS[id]!);
    expect(rows.map((r) => r.id)).toEqual([0x421a, 0x421b, 0x421c, 0x421d]);
    expect(rows.map((r) => r.costCast)).toEqual([220, 220, 220, 220]);
    expect(rows.map((r) => r.flagsDamage)).toEqual([0x80, 0x80, 0x80, 0x80]);
    expect(rows.map((r) => r.flagsDamage & 3)).toEqual([0, 0, 0, 0]);
    expect(rows.map((r) => r.power)).toEqual([58, 30, 255, 36]);
    expect(rows.map((r) => r.formula)).toEqual([1, 1, 0, 1]);
    expect(rows.map((r) => (r.flagsMisc >> 3) & 7)).toEqual([0, 0, 0, 0]);
    expect(rows.map((r) => r.element)).toEqual([0, 0, 4, 0]);
    expect(rows.map((r) => r.status1)).toEqual([undefined, { 5: 254 }, undefined, undefined]); // Venam: Poison 254
    for (const id of commands) {
      const a = ALL_ABILITIES.get(id)!;
      expect(a.flags, id).toContain('always-break-damage-limit');
      expect(a.damageType, id).toBe('other');
    }
    expect(ALL_ABILITIES.get(ids.FS_ABILITY.fulmenCommand)!.element).toEqual(['lightning']);
  });

  it('the multi-hit rows: Clione ten hits of power 24, Final Impact fourteen of an eighth of max HP and MP (formula 7, power 2), Black Sky ten of 6, Holy eight of 12, Meteor twelve of 8; the spread ones carry the random-target bit', () => {
    const r = FFX2_COMMAND_RECORDS;
    expect([r[ids.FS_ABILITY.clione]!.hits, r[ids.FS_ABILITY.clione]!.power]).toEqual([10, 24]);
    expect([r[ids.FS_ABILITY.finalImpact]!.hits, r[ids.FS_ABILITY.finalImpact]!.power, r[ids.FS_ABILITY.finalImpact]!.formula]).toEqual([14, 2, 7]);
    expect([r[ids.FS_ABILITY.blackSky]!.hits, r[ids.FS_ABILITY.blackSky]!.power]).toEqual([10, 6]);
    expect([r[ids.FS_ABILITY.holy]!.hits, r[ids.FS_ABILITY.holy]!.power]).toEqual([8, 12]);
    expect([r[ids.FS_ABILITY.meteor]!.hits, r[ids.FS_ABILITY.meteor]!.power]).toEqual([12, 8]);
    for (const id of [ids.FS_ABILITY.clione, ids.FS_ABILITY.blackSky, ids.FS_ABILITY.meteor]) expect(r[id]!.flagsMisc & 0x4000, id).toBe(0x4000);
  });

  it('the accuracy formulas (misc word bits 3 to 5): 2 (the race with ACC) for the Attack, Full Break, Fireworks and Sparkler; 0 for every other move: only those four can miss', () => {
    const race: string[] = [ids.FS_ABILITY.attack, ids.FS_ABILITY.fullBreak, ids.FS_ABILITY.fireworks, ids.FS_ABILITY.sparkler];
    for (const id of Object.values(ids.FS_ABILITY)) expect((FFX2_COMMAND_RECORDS[id]!.flagsMisc >> 3) & 7, id).toBe(race.includes(id) ? 2 : 0);
    const rolls = Object.values(ids.FS_ABILITY).filter((id) => ALL_ABILITIES.get(id)!.canMiss === true);
    expect(rolls.sort()).toEqual([...race].sort());
  });

  it('the moves of the thirteen new definitions are in the catalog once, each has a record, and the reused ones are other chapters\' abilities (22) that this chapter does not redefine', () => {
    expect(x2FiendSuperbossesAbilities).toHaveLength(13);
    expect(ids.FS_NEW_ABILITY_IDS).toHaveLength(13);
    expect(x2FiendSuperbossesAbilities.map((a) => a.id).sort()).toEqual([...ids.FS_NEW_ABILITY_IDS].sort());
    expect(Object.keys(COMMAND_RECORDS_FIEND_SUPERBOSSES).sort()).toEqual([...ids.FS_NEW_ABILITY_IDS].sort());
    for (const ability of x2FiendSuperbossesAbilities) expect(ALL_BOSS_ABILITIES.filter((a) => a.id === ability.id), ability.id).toEqual([ability]);
    const reused = Object.values(ids.FS_ABILITY).filter((id) => !id.startsWith('x2-fs-'));
    expect(reused).toHaveLength(22);
    for (const id of reused) expect(x2FiendSuperbossesAbilities.some((a) => a.id === id), id).toBe(false);
  });

  it('every actor lists exactly the moves its script queues (RE sections 3.1 to 3.5; the Die row and the commented-out Curaga and White Wind are queued by no live poll)', () => {
    const A = ids.FS_ABILITY;
    expect([...x2AlmightyShinra.abilityIds].sort()).toEqual([A.attack, A.clione, A.ultimaShinra, A.finalImpact, A.fullBreak, A.fireworks, A.haste].sort());
    expect([...x2NumerusUnum.abilityIds].sort()).toEqual([A.radisCommand, A.sparkler, A.dispel, A.shell, A.whiteHighwind, A.protect].sort());
    expect([...x2NumerusDuo.abilityIds].sort()).toEqual([A.blackSky, A.bio, A.flare, A.break, A.ultima, A.confuse, A.sleep, A.demi, A.berserk, A.blind, A.silence, A.slowga, A.venamCommand].sort());
    expect([...x2NumerusTria.abilityIds].sort()).toEqual([A.firaga, A.blizzaga, A.thundaga, A.waterga, A.holy, A.fulmenCommand, A.absorb].sort());
    expect([...x2NumerusQuattour.abilityIds].sort()).toEqual([A.fireworks, A.mortisCommand, A.absorb, A.meteor, A.ultima].sort());
    for (const enemy of Object.values(ENEMIES)) for (const id of enemy.abilityIds) expect(ALL_ABILITIES.has(id), `${enemy.id} ${id}`).toBe(true);
    // every move of FS_ABILITY is queued by someone
    const queued = new Set(Object.values(ENEMIES).flatMap((e) => e.abilityIds));
    expect([...queued].sort()).toEqual([...Object.values(ids.FS_ABILITY)].sort());
  });

  it('the rows other chapters hold under their own ids are these rows (a second witness): the party table\'s Break, Confuse, Demi, Black Sky, Dispel, Shell and Protect equal the ones this chapter uses', () => {
    const same: Array<[string, string]> = [
      [ids.FS_ABILITY.break, 'x2-dark-knight-break'],
      [ids.FS_ABILITY.confuse, 'x2-dark-knight-confuse'],
      [ids.FS_ABILITY.demi, 'x2-dark-knight-demi'],
      [ids.FS_ABILITY.blackSky, 'x2-dark-knight-black-sky'],
      [ids.FS_ABILITY.bio, 'x2-dark-knight-bio'],
      [ids.FS_ABILITY.dispel, 'x2-white-mage-dispel'],
      [ids.FS_ABILITY.shell, 'x2-white-mage-shell'],
      [ids.FS_ABILITY.protect, 'x2-white-mage-protect'],
    ];
    for (const [ours, theirs] of same) {
      const a = { ...FFX2_COMMAND_RECORDS[ours]! };
      const b = { ...FFX2_COMMAND_RECORDS[theirs]! };
      expect(a, `${ours} = ${theirs}`).toEqual(b);
    }
  });

  it('the status rows: Haste 254 for 50; Shell and Protect 254 for 110; Confuse 100; Silence 75; Venam Poison 254; Sleep 75; Berserk 75; Blind 75; Bio 100; Break 80; Slowga 130 for 126; Full Break four stages at -2', () => {
    const r = FFX2_COMMAND_RECORDS;
    const A = ids.FS_ABILITY;
    expect([r[A.haste]!.status2, r[A.haste]!.statusTime]).toEqual([{ 4: 254 }, { 4: 50 }]);
    expect([r[A.shell]!.status2, r[A.shell]!.statusTime]).toEqual([{ 0: 254 }, { 0: 110 }]);
    expect([r[A.protect]!.status2, r[A.protect]!.statusTime]).toEqual([{ 1: 254 }, { 1: 110 }]);
    expect(r[A.confuse]!.status1).toEqual({ 6: 100 });
    expect(r[A.silence]!.status1).toEqual({ 3: 75 });
    expect(r[A.venamCommand]!.status1).toEqual({ 5: 254 });
    expect(r[A.sleep]!.status1).toEqual({ 2: 75 });
    expect(r[A.berserk]!.status1).toEqual({ 7: 75 });
    expect(r[A.blind]!.status1).toEqual({ 4: 75 });
    expect(r[A.bio]!.status1).toEqual({ 5: 100 });
    expect(r[A.break]!.status1).toEqual({ 1: 80 });
    expect([r[A.slowga]!.status2, r[A.slowga]!.statusTime]).toEqual([{ 5: 130 }, { 5: 126 }]);
    expect([r[A.fullBreak]!.status2, r[A.fullBreak]!.statusTime]).toEqual([{ 7: 100, 8: 100, 9: 100, 10: 100 }, { 7: -2, 8: -2, 9: -2, 10: -2 }]);
    // the abilities' own status effects agree with the rows where the row inflicts one
    const effect = (id: string): Array<[string, number]> => (ALL_ABILITIES.get(id)!.statusEffects ?? []).map((s) => [s.status, s.chance]);
    expect(effect(A.haste)).toEqual([['haste', 254]]);
    expect(effect(A.shell)).toEqual([['shell', 254]]);
    expect(effect(A.protect)).toEqual([['protect', 254]]);
    expect(effect(A.confuse)).toEqual([['confuse', 100]]);
    expect(effect(A.silence)).toEqual([['silence', 75]]);
    expect(effect(A.venamCommand)).toEqual([['poison', 254]]);
  });
});

describe('the chain: two formations, one seam (LG1, LG8)', () => {
  it('act 1 (Shinra) chains to act 2 (the Numerus) and act 2 is the last link; both are registered by id and neither can be escaped', () => {
    expect(fiendSuperbossesGroups.map((g) => g.id)).toEqual([...ids.FIEND_SUPERBOSSES_GROUP_IDS]);
    expect(fiendSuperbossesGroups.map((g) => g.nextGroupId)).toEqual([ids.ACT_2_GROUP_ID, undefined]);
    for (const group of fiendSuperbossesGroups) {
      expect(ENEMY_GROUPS_BY_ID[group.id], group.id).toBe(group);
      expect(group.game).toBe('ffx2');
      expect(group.canEscape, group.id).toBe(false);
      expect(group.carriesFullPartyState, group.id).toBeUndefined();
      expect(group.carriesPartyState, group.id).toBeUndefined();
      expect(group.hopelessRetry, group.id).toBeUndefined();
    }
    expect(act1ShinraGroup.enemies.map((e) => e.id)).toEqual(['x2-almighty-shinra']);
    expect(act1ShinraGroup.parts).toBeUndefined();
  });

  it('act 2 opens at full HP and MP with a fallen girl standing and no Save Sphere card (the arena mends the girls at the seam); act 1 does neither; the formation is headed "Major Numerus"', () => {
    expect([act1ShinraGroup.restoresPartyOnEntry === true, act2NumerusGroup.restoresPartyOnEntry === true]).toEqual([false, true]);
    expect([act1ShinraGroup.noSaveSphereCard === true, act2NumerusGroup.noSaveSphereCard === true]).toEqual([false, true]);
    expect(act2NumerusGroup.headline).toBe('Major Numerus');
  });

  it('both acts play the stand-in superboss cue (LG9) and the scripts the enemies name are the ids file\'s; until stage 2 an unregistered script id falls back to the idle script', () => {
    for (const group of fiendSuperbossesGroups) expect(group.musicCues).toEqual([{ at: 'start', track: 'boss-trema', fadeMs: 800 }]);
    expect([ids.SHINRA_SCRIPT_ID, ids.UNUM_SCRIPT_ID, ids.DUO_SCRIPT_ID, ids.TRIA_SCRIPT_ID, ids.QUATTOUR_SCRIPT_ID]).toEqual(['x2-almighty-shinra', 'x2-numerus-unum', 'x2-numerus-duo', 'x2-numerus-tria', 'x2-numerus-quattour']);
    for (const [id, enemy] of Object.entries(ENEMIES)) {
      if (PARTS.includes(enemy)) continue;
      expect(enemy.aiScriptId, id).toBe(id);
    }
    expect(ids.FIEND_SUPERBOSSES_ROWS).toEqual([329, 330, 331, 332, 333, 334, 335, 336]);
    expect(Object.values(FIXTURE.monsters).map((m) => m.row)).toEqual([...ids.FIEND_SUPERBOSSES_ROWS]);
  });
});

describe('the kill-reward rows (re-parity RC9)', () => {
  const rows = Object.fromEntries(Object.entries(KILL_REWARD_ROWS).filter(([k]) => k.startsWith('ffx2-fiend-superbosses-')));

  it('each actor is paid by the row of the game: EXP, AP, gil and the drop byte; Shinra\'s common slot is Dark Matter x2; the heads\' slots (Enterprise, Invincible, Iron Duke) and Shinra\'s rare (Ragnarok) have no item in the repo\'s tables and are 0', () => {
    expect(Object.keys(rows).sort()).toEqual(Object.keys(ENEMIES).map((id) => `${GROUP_OF(id)}/${id}`).sort());
    expect(rows['ffx2-fiend-superbosses-1-shinra/x2-almighty-shinra']).toMatchObject({ table: 1, row: 329, exp: 3000, ap: 1, gil: 3000, dropByte: 255, drop: [0x202e, 2, 0, 0] });
    for (const [id, row] of [['x2-numerus-unum', 330], ['x2-numerus-duo', 331], ['x2-numerus-tria', 332], ['x2-numerus-quattour', 333]] as const) {
      expect(rows[`ffx2-fiend-superbosses-2-numerus/${id}`], id).toMatchObject({ table: 1, row, exp: 6000, ap: 1, gil: 5000, dropByte: 255, drop: [0, 0, 0, 0] });
    }
    for (const [id, row] of [['x2-numerus-body', 334], ['x2-numerus-pod', 335], ['x2-numerus-tail', 336]] as const) {
      expect(rows[`ffx2-fiend-superbosses-2-numerus/${id}`], id).toMatchObject({ table: 1, row, exp: 0, ap: 0, gil: 0, dropByte: 0, drop: [0, 0, 0, 0] });
    }
  });

  it('the raw rows say the other drops exist: Ragnarok 0x907d and, per head, Enterprise 0x907e or Invincible 0x907f (common) and Iron Duke 0x907c x5 (rare); the fixture keeps the game\'s own numbers', () => {
    expect(FIXTURE.monsters['x2-almighty-shinra']!.dropItems).toEqual([0x202e, 2, 0x907d, 1]);
    expect(HEADS.map((h) => FIXTURE.monsters[h.id]!.dropItems)).toEqual([[0x907e, 1, 0x907c, 5], [0x907f, 1, 0x907c, 5], [0x907e, 1, 0x907c, 5], [0x907f, 1, 0x907c, 5]]);
  });
});

describe('hygiene of the files this lane added', () => {
  const FILES = [
    '../../../src/data/fiend-superbosses-ids.ts',
    '../../../src/data/ffx2/enemies/fiend-superbosses.ts',
    '../../../src/data/ffx2/enemies/fiend-superbosses-abilities.ts',
    '../../../src/data/ffx2/command-records/fiend-superbosses.ts',
    '../../../src/data/ffx2/monster-records/records-fiend-superbosses.ts',
    '../../fixtures/parity/ffx2/fiend_superbosses_rows.json',
    '../../../research/re-ffx2-fiend-arena-superbosses.md',
    '../../../docs/plans/ch-fiend-superbosses-review.md',
  ];

  it('no local path, scratch name, account name or e-mail address appears in any of them, and every source file stays under 400 lines (house rule 7)', () => {
    for (const file of FILES) {
      const text = readFileSync(here(file), 'utf8');
      expect(text, file).not.toMatch(/[A-Za-z]:[\\/]|\\Users\\|\/Users\/|pyrefly-scratch|\.out\.txt|@[a-z0-9-]+\.(com|net|org)|bpillon|baileypillon|jameve|chaoticdreams/i);
      if (file.endsWith('.ts')) expect(text.split('\n').length, file).toBeLessThan(400);
    }
  });

  it('every new data file says where its numbers come from: the game file, the note and a confidence tag', () => {
    for (const file of FILES.filter((f) => f.includes('/src/data/ffx2/'))) {
      const text = readFileSync(here(file), 'utf8');
      for (const needle of ['re-ffx2-fiend-arena-superbosses', '[verified', 'FFX-2 only']) expect(text, `${file}: ${needle}`).toContain(needle);
    }
  });
});
