/**
 * Garik Ronso and the Ronso Youths (the hidden FFX-2 chapter): the data against the game's own rows. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `tests/fixtures/parity/ffx2/garik_ronso_rows.json` holds the two monsters' rows (`monster.bin` rows 182 and 181) and the thirteen moves (`monmagic.bin` 0x41da, 0x4000, 0x411c, 0x411d, 0x406f, 0x4084 and 0x4232 to 0x4236,
 * `command.bin` 0x30bb and 0x30bc) as `gen-fixture.mjs` read them from the Steam HD files (numbers only; `research/re-ffx2-garik-ronso.md` sections 0 and 3), independently of the note's prose. This file compares them to the
 * enemy data, the monster records and the command records field by field; it also pins:
 *
 * 1. **The enemies**: level, HP, MP and the stat bytes; the element bytes (both null Gravity and are weak to nothing); no permanent status; the two formations' pools (15,000 and 10,940 HP; EXP 820 / 600).
 * 2. **The ailments** [RE §0]: Garik takes Darkness and Poison at 20 and Confusion at 0 (they land), the Youth also Poison, Confusion, Berserk, Eject, Slow and Stop; the special words (0x3c3, 0x181): Garik cannot be delayed, a Youth can.
 * 3. **The moves**: every row, the abilities' own fields consistent with them, the hit rule (hard rule 5: only the two Attacks, Bane Lance and MP Blowout roll).
 * 4. **The formations and the chapter**: two single-link formations, no chain, no Escape; the record, its metadata, its door and its place in the registry.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { EnemyDef, FFX2CommandRecord } from '../../../src/battle/common/types.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { BRAVEHEART_DOOR_CHAPTER, BRAVEHEART_DOOR_WORD } from '../../../src/app/screens/frontend/braveheartDoor.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { KILL_ITEM_ID } from '../../../src/battle/ffx2/adapt/kill-rewards.ts';
import { FFX2_GARIK_RONSO } from '../../../src/data/chapter-ffx2-garik-ronso.ts';
import { GARIK_RONSO_META } from '../../../src/data/chapter-meta-ffx2-garik-ronso.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ITEMS } from '../../../src/data/ffx2/index.ts';
import { ALL_BOSS_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import { garikFriendlyGroup, garikHostileGroup, garikRonsoGroups, x2GarikRonso, x2GarikRonsoBout, x2RonsoYouthA, x2RonsoYouthB, x2RonsoYouthBout } from '../../../src/data/ffx2/enemies/garik-ronso.ts';
import { RONSO_ANNOUNCEMENT_IDS, x2GarikRonsoAbilities } from '../../../src/data/ffx2/enemies/garik-ronso-abilities.ts';
import { COMMAND_RECORDS_GARIK_RONSO } from '../../../src/data/ffx2/command-records/garik-ronso.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { KILL_REWARD_ROWS } from '../../../src/data/ffx2/monster-records/kill-rewards.ts';
import { MONSTER_RECORDS_GARIK_RONSO } from '../../../src/data/ffx2/monster-records/records-garik-ronso.ts';
import { garikRonsoBuild } from '../../../src/data/ffx2/builds/garik-ronso.ts';
import { djoseBuild } from '../../../src/data/ffx2/builds/djose.ts';
import * as ids from '../../../src/data/garik-ronso-ids.ts';

interface MonsterRow {
  row: number; id: number; offset: number; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number; thinking: number;
  special: number; absorb: number; null: number; half: number; weak: number; autoStatus1: number; autoStatus2: number;
  exp: number; gil: number; pilfer: number; ap: number; dropByte: number; stealByte: number; zantetsu: number; dropItems: number[]; stealItems: number[]; waza: number[];
  resist1: Record<string, number>; resist2: Record<string, number>;
}
interface MoveRow {
  id: number; offset: number; costAtb: number; costCast: number; costMp: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number;
  crit: number; accuracy: number; power: number; hits: number; shatter: number; element: number; status1?: Record<string, number>; status2?: Record<string, number>; statusTime?: Record<string, number>;
}
interface Fixture {
  monsters: Record<string, MonsterRow>;
  moves: Record<string, MoveRow>;
  statuses: Record<string, { status1?: Record<string, number>; status2?: Record<string, number>; statusTime?: Record<string, number> }>;
}
const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx2/garik_ronso_rows.json', import.meta.url)), 'utf8')) as Fixture;

/** Row 182 wears every Garik; row 181 every Youth. */
const ROW_OF: Record<string, 'x2-garik-ronso' | 'x2-ronso-youth'> = {
  [ids.X2_GARIK_ID]: 'x2-garik-ronso', [ids.X2_GARIK_BOUT_ID]: 'x2-garik-ronso', [ids.X2_YOUTH_A_ID]: 'x2-ronso-youth', [ids.X2_YOUTH_B_ID]: 'x2-ronso-youth', [ids.X2_YOUTH_BOUT_ID]: 'x2-ronso-youth',
};
const ENEMIES: Record<string, EnemyDef> = {
  [ids.X2_GARIK_ID]: x2GarikRonso, [ids.X2_GARIK_BOUT_ID]: x2GarikRonsoBout, [ids.X2_YOUTH_A_ID]: x2RonsoYouthA, [ids.X2_YOUTH_B_ID]: x2RonsoYouthB, [ids.X2_YOUTH_BOUT_ID]: x2RonsoYouthBout,
};
const GROUP_OF: Record<string, string> = {
  [ids.X2_GARIK_ID]: ids.GARIK_HOSTILE_GROUP_ID, [ids.X2_YOUTH_A_ID]: ids.GARIK_HOSTILE_GROUP_ID, [ids.X2_YOUTH_B_ID]: ids.GARIK_HOSTILE_GROUP_ID,
  [ids.X2_GARIK_BOUT_ID]: ids.GARIK_FRIENDLY_GROUP_ID, [ids.X2_YOUTH_BOUT_ID]: ids.GARIK_FRIENDLY_GROUP_ID,
};
const numeric = (record: Record<string, number>): Record<number, number> => Object.fromEntries(Object.entries(record).map(([k, v]) => [Number(k), v]));
const resisted = (enemy: EnemyDef, status: string): number => (enemy.immunities as Record<string, number | undefined>)[status] ?? 0;

describe('the five bodies against the two rows [RE §0]', () => {
  for (const [id, enemy] of Object.entries(ENEMIES)) {
    const row = FIXTURE.monsters[ROW_OF[id]!]!;
    const key = `${GROUP_OF[id]}/${id}`;

    it(`${id}: level, HP, MP and the stat bytes are monster.bin row ${row.row} (offset ${row.offset})`, () => {
      expect(enemy.level).toBe(row.level);
      expect([enemy.hp, enemy.stats.hp, enemy.stats.maxHp]).toEqual([row.hp, row.hp, row.hp]);
      expect([enemy.mp, enemy.stats.mp, enemy.stats.maxMp]).toEqual([row.mp, row.mp, row.mp]);
      expect([enemy.stats.str, enemy.stats.def, enemy.stats.mag, enemy.stats.mdef]).toEqual([row.str, row.def, row.mag, row.mdef]);
      expect([enemy.stats.agi, enemy.stats.acc, enemy.stats.eva, enemy.stats.luck]).toEqual([row.agi, row.acc, row.eva, row.luck]);
    });

    it(`${id}: the rewards are the row's EXP ${row.exp}, Gil ${row.gil}, AP ${row.ap} and Pilfer Gil ${row.pilfer}; the steal byte ${row.stealByte}; the kill row is the same`, () => {
      expect([enemy.rewards.exp, enemy.rewards.gil, enemy.rewards.ap, enemy.rewards.stolenGil]).toEqual([row.exp, row.gil, row.ap, row.pilfer]);
      const record = MONSTER_RECORDS[key]!;
      expect(record.stealByte).toBe(row.stealByte);
      expect(enemy.rewards.steal?.stealRate).toBe(row.stealByte);
      const kill = KILL_REWARD_ROWS[key]!;
      expect([kill.table, kill.row, kill.exp, kill.ap, kill.gil, kill.dropByte, [...kill.drop]]).toEqual([1, row.row, row.exp, row.ap, row.gil, row.dropByte, row.dropItems]);
      expect(enemy.ffx2Record?.kill).toEqual(kill); // the record is shared by every body that wears the row, so its kill field is the last key attached: equal, not the same object
    });

    it(`${id}: the monster record is the row's (special word 0x${row.special.toString(16)}, Zantetsu ${row.zantetsu}, ACC ${row.acc}) and is laid on the enemy`, () => {
      const record = MONSTER_RECORDS[key]!;
      expect(record).toBe(MONSTER_RECORDS_GARIK_RONSO[key]);
      expect([record.row, record.table, record.acc, record.special, record.zantetsu, record.stealByte, record.stealGil]).toEqual([row.row, 1, row.acc, row.special, row.zantetsu, row.stealByte, row.pilfer]);
      expect(record.resist1).toEqual(numeric(row.resist1));
      expect(record.resist2).toEqual(numeric(row.resist2));
      expect([...record.steal]).toEqual(row.stealItems);
      expect([...record.bribe]).toEqual([0, 0, 0, 0]);
      expect(enemy.ffx2Record).toBe(record);
    });

    it(`${id}: the element bytes (absorb ${row.absorb}, null ${row.null}, half ${row.half}, weak ${row.weak}) are the enemy's affinities: Gravity only; no permanent status; table 1`, () => {
      expect([row.null, row.absorb, row.half, row.weak]).toEqual([0x10, 0, 0, 0]);
      expect(enemy.affinities).toEqual({ gravity: 'immune' });
      expect([row.autoStatus1, row.autoStatus2]).toEqual([0, 0]);
      expect(enemy.autoStatuses).toBeUndefined();
      expect(MONSTER_RECORDS[key]!.table).toBe(1);
    });
  }

  it('the drops and steals are the rows\' items: Shining Bracer 0x905d and Icy Gleam 0x9024 for Garik, Remedy 0x200f (x1, x2) and Mythril Bangle 0x9002 for the Youth, with a name each', () => {
    expect(FIXTURE.monsters['x2-garik-ronso']!.dropItems).toEqual([0x905d, 1, 0x905d, 1]);
    expect(FIXTURE.monsters['x2-garik-ronso']!.stealItems).toEqual([0x9024, 1, 0x9024, 1]);
    expect(FIXTURE.monsters['x2-ronso-youth']!.dropItems).toEqual([0x200f, 1, 0x200f, 2]);
    expect(FIXTURE.monsters['x2-ronso-youth']!.stealItems).toEqual([0x9002, 1, 0x9002, 1]);
    expect([FIXTURE.monsters['x2-garik-ronso']!.dropByte, FIXTURE.monsters['x2-ronso-youth']!.dropByte]).toEqual([128, 255]);
    expect([KILL_ITEM_ID[0x905d], KILL_ITEM_ID[0x200f]]).toEqual(['shining-bracer', 'x2-remedy']);
    expect(x2GarikRonso.rewards.drops).toEqual([{ itemId: 'shining-bracer', count: 1 }]);
    expect(x2RonsoYouthA.rewards.drops).toEqual([{ itemId: 'x2-remedy', count: 1 }]);
    expect(x2GarikRonso.rewards.steal?.common).toEqual({ itemId: 'icy-gleam', count: 1 });
    expect(x2RonsoYouthA.rewards.steal?.common).toEqual({ itemId: 'mythril-bangle', count: 1 });
    for (const id of ['shining-bracer', 'icy-gleam', 'mythril-bangle', 'x2-remedy']) expect(ITEMS[id]?.name, id).toBeDefined();
    expect(['Shining Bracer', 'Icy Gleam', 'Mythril Bangle']).toEqual(['shining-bracer', 'icy-gleam', 'mythril-bangle'].map((id) => ITEMS[id]!.name));
  });

  it('the thinking bytes (0 for Garik, 30 for the Youth) are recorded and not modelled: the engine\'s thinking base is 0 in play', () => {
    expect([FIXTURE.monsters['x2-garik-ronso']!.thinking, FIXTURE.monsters['x2-ronso-youth']!.thinking]).toEqual([0, 30]);
    for (const enemy of Object.values(ENEMIES)) expect(enemy.thinkingPeriod, enemy.id).toBeUndefined();
  });
});

describe('the formations: pools and rewards [RE §0, formations 1622 and 1621]', () => {
  const totals = (g: { enemies: EnemyDef[] }): { hp: number; exp: number; gil: number; ap: number } =>
    g.enemies.reduce((t, e) => ({ hp: t.hp + e.hp, exp: t.exp + (e.rewards.exp ?? 0), gil: t.gil + e.rewards.gil, ap: t.ap + e.rewards.ap }), { hp: 0, exp: 0, gil: 0, ap: 0 });

  it('the hostile fight is two Youths and Garik: 15,000 HP, EXP 820, Gil 130, AP 7', () => {
    expect(garikHostileGroup.enemies.map((e) => e.id)).toEqual([ids.X2_YOUTH_A_ID, ids.X2_YOUTH_B_ID, ids.X2_GARIK_ID]);
    expect(totals(garikHostileGroup)).toEqual({ hp: 15_000, exp: 820, gil: 130, ap: 7 });
    expect(garikHostileGroup.enemies.map((e) => e.slot)).toEqual([0, 1, 2]);
  });

  it('the friendly bout is one Youth and Garik: 10,940 HP, EXP 600, Gil 110, AP 5', () => {
    expect(garikFriendlyGroup.enemies.map((e) => e.id)).toEqual([ids.X2_YOUTH_BOUT_ID, ids.X2_GARIK_BOUT_ID]);
    expect(totals(garikFriendlyGroup)).toEqual({ hp: 10_940, exp: 600, gil: 110, ap: 5 });
    expect(garikFriendlyGroup.enemies.map((e) => e.slot)).toEqual([0, 1]);
  });

  it('two single-link formations: registered by id, FFX-2, no chain, no Escape, no parts, the boss strip names Garik, and both play the duel cue', () => {
    expect(garikRonsoGroups.map((g) => g.id)).toEqual([...ids.GARIK_GROUP_IDS]);
    for (const group of garikRonsoGroups) {
      expect(ENEMY_GROUPS_BY_ID[group.id], group.id).toBe(group);
      expect(group.game).toBe('ffx2');
      expect(group.canEscape).toBe(false);
      expect(group.nextGroupId).toBeUndefined();
      expect(group.parts).toBeUndefined();
      expect(group.restoresPartyOnEntry).toBeUndefined();
      expect(group.musicCues).toEqual([{ at: 'start', track: 'boss-ffx2-fallen-aeons', fadeMs: 800 }]);
    }
    expect([garikHostileGroup.bossId, garikFriendlyGroup.bossId]).toEqual([ids.X2_GARIK_ID, ids.X2_GARIK_BOUT_ID]);
  });

  it('the scripts the enemies name are registered, and the ids file agrees; the paintings are the flagged stand-ins', () => {
    for (const enemy of Object.values(ENEMIES)) expect(aiScriptFor(enemy.aiScriptId).id, enemy.id).toBe(enemy.aiScriptId);
    expect([x2GarikRonso.aiScriptId, x2GarikRonsoBout.aiScriptId, x2RonsoYouthA.aiScriptId, x2RonsoYouthB.aiScriptId, x2RonsoYouthBout.aiScriptId]).toEqual([
      ids.GARIK_HOSTILE_SCRIPT_ID, ids.GARIK_FRIENDLY_SCRIPT_ID, ids.YOUTH_HOSTILE_SCRIPT_ID, ids.YOUTH_HOSTILE_SCRIPT_ID, ids.YOUTH_FRIENDLY_SCRIPT_ID,
    ]);
    expect([...ids.GARIK_BODY_IDS]).toEqual([ids.X2_YOUTH_A_ID, ids.X2_YOUTH_B_ID, ids.X2_GARIK_ID, ids.X2_YOUTH_BOUT_ID, ids.X2_GARIK_BOUT_ID]);
    expect([x2GarikRonso.spriteKey, x2RonsoYouthA.spriteKey, x2RonsoYouthB.spriteKey]).toEqual(['x2-garik-ronso', 'x2-ronso-youth-a', 'x2-ronso-youth-b']); // their own paintings (release 79), no longer Kimahri's and the FFX Ronso idles
    expect([x2RonsoYouthA.name, x2RonsoYouthB.name, x2RonsoYouthBout.name, x2GarikRonso.name]).toEqual(['Ronso Youth A', 'Ronso Youth B', 'Ronso Youth', 'Garik Ronso']);
  });
});

describe('the ailments and the special words [RE §0]', () => {
  it('Garik: Death, Petrify, Sleep, Silence, Berserk, Curse, Eject, Itchy, Auto-Life, Slow, Stop and Doom at 255; Darkness and Poison at 20; Confusion is not listed (it lands)', () => {
    for (const enemy of [x2GarikRonso, x2GarikRonsoBout]) {
      for (const status of ['ko', 'petrify', 'sleep', 'silence', 'berserk', 'curse', 'eject', 'itchy', 'auto-life', 'slow', 'stop', 'doom']) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(255);
      expect([resisted(enemy, 'darkness'), resisted(enemy, 'poison'), resisted(enemy, 'confuse')], enemy.id).toEqual([20, 20, 0]);
    }
  });

  it('the Youth: Death, Petrify, Sleep, Silence, Curse, Itchy, Auto-Life and Doom at 255, Darkness at 20; Poison, Confusion, Berserk, Eject, Slow and Stop land', () => {
    for (const enemy of [x2RonsoYouthA, x2RonsoYouthB, x2RonsoYouthBout]) {
      for (const status of ['ko', 'petrify', 'sleep', 'silence', 'curse', 'itchy', 'auto-life', 'doom']) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(255);
      expect(resisted(enemy, 'darkness'), enemy.id).toBe(20);
      for (const status of ['poison', 'confuse', 'berserk', 'eject', 'slow', 'stop']) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(0);
    }
  });

  it('every stat stage lands on all of them, and so do Shell, Protect, Reflect, Regen and Haste', () => {
    const stages = ['str', 'mag', 'def', 'mdef', 'accu', 'eva', 'luck'].flatMap((s) => [`${s}-up`, `${s}-down`]);
    for (const enemy of Object.values(ENEMIES)) for (const status of ['reflect', 'shell', 'protect', 'regen', 'haste', ...stages]) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(0);
  });

  it('special word 0x3c3 on Garik (bits 0, 1, 6, 7, 8, 9): no percent formulas, no ATB damage, no Interrupt, so the delay-lock does nothing to him; 0x181 on a Youth (bits 0, 7, 8): it CAN be delayed', () => {
    const NO_ATB_DAMAGE = 1 << 6;
    const NO_INTERRUPT = 1 << 9;
    for (const enemy of [x2GarikRonso, x2GarikRonsoBout]) {
      const word = enemy.ffx2Record!.special;
      expect(word, enemy.id).toBe(0x3c3);
      expect([word & NO_ATB_DAMAGE, word & NO_INTERRUPT].every((bit) => bit !== 0), enemy.id).toBe(true);
      expect(enemy.immunityFlags, enemy.id).toEqual(expect.arrayContaining(['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe']));
      expect([resisted(enemy, 'action-cancel'), resisted(enemy, 'delay-effect')], enemy.id).toEqual([255, 255]);
    }
    for (const enemy of [x2RonsoYouthA, x2RonsoYouthB, x2RonsoYouthBout]) {
      const word = enemy.ffx2Record!.special;
      expect(word, enemy.id).toBe(0x181);
      expect(word & NO_ATB_DAMAGE, enemy.id).toBe(0);
      expect(word & NO_INTERRUPT, enemy.id).toBe(0);
      expect(enemy.immunityFlags, enemy.id).toEqual(['immune-to-percentage-damage', 'immune-to-bribe']);
      expect([resisted(enemy, 'action-cancel'), resisted(enemy, 'delay-effect')], enemy.id).toEqual([0, 0]);
    }
  });
});

describe('the moves against the rows [RE §3]', () => {
  const NO_RECORD = new Set<string>(RONSO_ANNOUNCEMENT_IDS); // flavour turns on himself: the engine derives them from the ability (Bahamut's Countdown, the Ifrit chapter)

  for (const [id, row] of Object.entries(FIXTURE.moves)) {
    if (NO_RECORD.has(id)) continue;
    it(`${id}: the command record is row 0x${row.id.toString(16)} (offset ${row.offset}) field for field, statuses included`, () => {
      const record: FFX2CommandRecord = COMMAND_RECORDS_GARIK_RONSO[id]!;
      expect(record, id).toBeDefined();
      expect(FFX2_COMMAND_RECORDS[id]).toBe(record);
      expect([record.id, record.costAtb, record.costCast, record.flagsTarget, record.flagsMisc, record.flagsDamage, record.damageClass, record.formula, record.critByte, record.accuracy, record.power, record.hits, record.shatter, record.element]).toEqual(
        [row.id, row.costAtb, row.costCast, row.flagsTarget, row.flagsMisc, row.flagsDamage, row.damageClass, row.formula, row.crit, row.accuracy, row.power, row.hits, row.shatter, row.element],
      );
      const st = FIXTURE.statuses[id];
      expect(record.status1 ?? {}, id).toEqual(numeric(st?.status1 ?? {}));
      expect(record.status2 ?? {}, id).toEqual(numeric(st?.status2 ?? {}));
      expect(record.statusTime ?? {}, id).toEqual(numeric(st?.statusTime ?? {}));
      const ability = x2GarikRonsoAbilities.find((a) => a.id === id)!;
      expect(ability, id).toBeDefined();
      expect(ability.mpCost, id).toBe(row.costMp);
      expect(ability.power, id).toBe(row.power);
      expect(ability.hits, id).toBe(row.hits);
    });
  }

  it('the four announcement rows are formula 0, power 0, no hits, and have no record (the abilities carry power 0 on himself)', () => {
    for (const id of RONSO_ANNOUNCEMENT_IDS) {
      const row = FIXTURE.moves[id]!;
      expect([row.formula, row.power, row.hits], id).toEqual([0, 0, 0]);
      expect(COMMAND_RECORDS_GARIK_RONSO[id], id).toBeUndefined();
      const ability = x2GarikRonsoAbilities.find((a) => a.id === id)!;
      expect([ability.power, ability.formula, ability.targeting], id).toEqual([0, 'none', 'self']);
    }
  });

  it('what the rows say: Bane Lance is the Attack with Curse 254 and the race against accuracy 110; Blind is Darkness 75 and reflectable; Mighty Guard is every monster, Shell and Protect 126, Regen and Haste 90, Defense and Magic Defense +2, Evasion +1; MP Blowout is the MP class, formula 7, power 16; Time Up Meteor is formula 5, power 200, 12 hits', () => {
    const r = COMMAND_RECORDS_GARIK_RONSO;
    expect(r['x2-garik-bane-lance']!.status1).toEqual({ 8: 254 });
    expect([r['x2-garik-bane-lance']!.accuracy, (r['x2-garik-bane-lance']!.flagsMisc >> 3) & 7, r['x2-garik-bane-lance']!.power]).toEqual([110, 1, 16]);
    expect(r['x2-garik-blind']!.status1).toEqual({ 4: 75 });
    expect((r['x2-garik-blind']!.flagsMisc & 0x80) !== 0).toBe(true);
    const guard = r['x2-garik-mighty-guard']!;
    expect(guard.status2).toEqual({ 0: 254, 1: 254, 3: 254, 4: 254, 9: 254, 10: 254, 12: 254 });
    expect(guard.statusTime).toEqual({ 0: 126, 1: 126, 3: 90, 4: 90, 9: 2, 10: 2, 12: 1 });
    expect([guard.flagsTarget, guard.costAtb, guard.costCast]).toEqual([0x35, 80, 120]);
    expect(FIXTURE.moves['x2-garik-mighty-guard']!.costMp).toBe(18);
    const blowout = r['x2-ronso-youth-mp-blowout']!;
    expect([blowout.damageClass, blowout.formula, blowout.power, blowout.accuracy, (blowout.flagsMisc >> 3) & 7]).toEqual([2, 7, 16, 120, 1]);
    const meteor = r['x2-ronso-time-up-meteor']!;
    expect([meteor.formula, meteor.power, meteor.hits, meteor.flagsDamage & 3, meteor.flagsTarget]).toEqual([5, 200, 12, 0, 0x17]);
    expect([r['x2-garik-shell']!.statusTime, r['x2-garik-protect']!.statusTime]).toEqual([{ 0: 110 }, { 1: 110 }]);
  });

  it('the ability definitions agree with their rows where the engine reads the definition: the damage type follows the row\'s damage flags, targeting follows the target flags', () => {
    for (const [id, row] of Object.entries(FIXTURE.moves)) {
      if (id === 'x2-ronso-youth-mp-blowout') continue; // MP class on a physical-flagged row: the row wins, the definition says `physical`
      const ability = x2GarikRonsoAbilities.find((a) => a.id === id)!;
      const expected = row.flagsDamage & 1 ? 'physical' : row.flagsDamage & 2 ? 'magical' : 'other';
      if (!NO_RECORD.has(id)) expect(ability.damageType, `${id} (damage flags 0x${row.flagsDamage.toString(16)})`).toBe(expected);
    }
    const t = (id: string): string => x2GarikRonsoAbilities.find((a) => a.id === id)!.targeting;
    expect([t('x2-garik-mighty-guard'), t('x2-ronso-time-up-meteor'), t('x2-garik-shell'), t('x2-garik-protect'), t('x2-garik-attack'), t('x2-garik-blind')]).toEqual(['all-allies', 'all-enemies', 'self', 'self', 'single-enemy', 'single-enemy']);
  });

  it('the abilities are the data catalog\'s (ALL_BOSS_ABILITIES), the ids are unique, and every row of the fixture is an ability', () => {
    for (const ability of x2GarikRonsoAbilities) expect(ALL_BOSS_ABILITIES, ability.id).toContain(ability);
    expect(new Set(x2GarikRonsoAbilities.map((a) => a.id)).size).toBe(x2GarikRonsoAbilities.length);
    expect(x2GarikRonsoAbilities.map((a) => a.id).sort()).toEqual(Object.keys(FIXTURE.moves).sort());
    for (const id of Object.keys(COMMAND_RECORDS_GARIK_RONSO)) expect(x2GarikRonsoAbilities.some((a) => a.id === id), id).toBe(true);
  });

  it('hit rule (rule 5): exactly the two Attacks, Bane Lance and MP Blowout roll; everything else carries canMiss false, set explicitly (accuracy formula 0)', () => {
    const rolls = x2GarikRonsoAbilities.filter((a) => a.canMiss === true).map((a) => a.id);
    expect(rolls.sort()).toEqual(['x2-garik-attack', 'x2-garik-bane-lance', 'x2-ronso-youth-attack', 'x2-ronso-youth-mp-blowout']);
    for (const ability of x2GarikRonsoAbilities.filter((a) => !rolls.includes(a.id))) expect(ability.canMiss, ability.id).toBe(false);
    for (const id of rolls) expect((COMMAND_RECORDS_GARIK_RONSO[id]!.flagsMisc >> 3) & 7, id).not.toBe(0);
    for (const ability of x2GarikRonsoAbilities.filter((a) => !rolls.includes(a.id) && COMMAND_RECORDS_GARIK_RONSO[a.id] !== undefined)) expect((COMMAND_RECORDS_GARIK_RONSO[ability.id]!.flagsMisc >> 3) & 7, ability.id).toBe(0);
  });

  it('Garik lists the six moves of his record and the block; a Youth lists its two and the block (the record\'s waza list, plus the "battle too long" rows)', () => {
    expect(FIXTURE.monsters['x2-garik-ronso']!.waza).toEqual([0x41da, 0x411c, 0x4084, 0x406f, 0x30bb, 0x30bc]);
    expect(FIXTURE.monsters['x2-ronso-youth']!.waza).toEqual([0x4000, 0x411d]);
    const block = [...RONSO_ANNOUNCEMENT_IDS, 'x2-ronso-time-up-meteor'];
    expect([...x2GarikRonso.abilityIds].sort()).toEqual(['x2-garik-attack', 'x2-garik-bane-lance', 'x2-garik-blind', 'x2-garik-mighty-guard', 'x2-garik-protect', 'x2-garik-shell', ...block].sort());
    expect([...x2RonsoYouthA.abilityIds].sort()).toEqual(['x2-ronso-youth-attack', 'x2-ronso-youth-mp-blowout', ...block].sort());
  });
});

describe('the party: the Djose preset, unmodified (GA3)', () => {
  it('is a deep copy of the Djose preset: Yuna 32, Rikku 33, Paine 34, Black Mage owned', () => {
    expect(garikRonsoBuild).toEqual(djoseBuild);
    expect(garikRonsoBuild).not.toBe(djoseBuild);
    expect(garikRonsoBuild.members.map((m) => [m.id, m.level])).toEqual([['yuna', 32], ['rikku', 33], ['paine', 34]]);
    for (const member of garikRonsoBuild.members) expect(member.owned).toContain('black-mage');
    expect(garikRonsoBuild.members.map((m) => m.currentDressphere)).toEqual(['white-mage', 'dark-knight', 'dark-knight']);
  });
});

describe('the chapter record and its place in the registry', () => {
  it('is hidden: number 47, experimental, FFX-2, the summit stage, the Djose preset, the duel cue and the shared words', () => {
    expect(FFX2_GARIK_RONSO).toMatchObject({ id: 'ffx2-garik-ronso', game: 'ffx2', number: 47, experimental: true, sceneKey: ids.GARIK_RONSO_SCENE });
    expect(FFX2_GARIK_RONSO.buildRef).toBe(garikRonsoBuild);
    expect(FFX2_GARIK_RONSO.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-ffx2-fallen-aeons', victory: 'victory-ffx2' });
    expect(Object.keys(FFX2_GARIK_RONSO.sensorTexts).sort()).toEqual([...ids.GARIK_BODY_IDS].sort());
    for (const [id, enemy] of Object.entries(ENEMIES)) expect(FFX2_GARIK_RONSO.sensorTexts[id], id).toBe(enemy.sensorText);
  });

  it('getChapter finds it; it is in EXPERIMENT_CHAPTERS and in neither CHAPTERS nor CHAPTER_IDS (the board and every chapter-generic suite stay at nineteen)', () => {
    expect(getChapter(ids.GARIK_RONSO_ID)).toBe(FFX2_GARIK_RONSO);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_GARIK_RONSO);
    expect(CHAPTERS.map((c) => c.id)).not.toContain(ids.GARIK_RONSO_ID);
    expect(CHAPTER_IDS as readonly string[]).not.toContain(ids.GARIK_RONSO_ID);
  });

  it('its pause metadata is registered, hidden numeral EXP, three objectives and three snapshots, and the card\'s words are the record\'s', () => {
    expect(UNLISTED_CHAPTER_META).toContain(GARIK_RONSO_META);
    expect(GARIK_RONSO_META).toMatchObject({ id: ids.GARIK_RONSO_ID, gameLabel: 'FFX-2', numeral: 'EXP', title: FFX2_GARIK_RONSO.title, location: FFX2_GARIK_RONSO.location, blurb: FFX2_GARIK_RONSO.blurb });
    expect(GARIK_RONSO_META.objectives.map((o) => o.id)).toEqual(['garik-below-half', 'three-hit-chain', 'defeat-garik']);
    expect(GARIK_RONSO_META.snapshots).toHaveLength(3);
    expect(GARIK_RONSO_META.musicKeys).toEqual(['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2']);
  });

  it('its door is the word braveheart (the plan\'s lionheart fails the table\'s limit rule), a row of the table, and leads to it', () => {
    expect(BRAVEHEART_DOOR_WORD).toBe('braveheart');
    expect(BRAVEHEART_DOOR_CHAPTER).toBe(ids.GARIK_RONSO_ID);
    expect(CHAPTER_DOORS).toContainEqual({ word: 'braveheart', chapter: 'ffx2-garik-ronso' });
    expect('lionheart'.startsWith('li') && 'limit'.startsWith('li')).toBe(true); // the shared prefix that fails chapter-doors.test.ts "claims a later letter"
  });
});
