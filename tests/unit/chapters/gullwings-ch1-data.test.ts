/**
 * Gullwings, Chapter 1 (FFX-2's four hotspot missions: Boris, the Flame Dragon, the Guardian Beast and YSLS-Zero; the hidden chapter, number 51, typed word `dragon`): the data, pinned. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `tests/fixtures/parity/ffx2/gullwings_ch1_rows.json` holds the four monsters (`monster.bin` rows 132, 122, 162 and 47), the seventeen moves (`monmagic.bin`), Boris's start positions and the scripts' constants as the fixture
 * reader read them from the Steam HD files (numbers only; `research/re-ffx2-gullwings-chapter1.md`), independently of the note's prose. This file compares them to the enemy data, the monster records and the command records
 * field by field; it also pins:
 *
 * 1. **The enemies**: level, HP, MP and the eight stats; the element bytes; the special word; the walls and the ailments that land.
 * 2. **The moves**: every row, the abilities' own fields consistent with them, the hit rule (hard rule 5), the one-shot Stop of Sticky End, the two fractions of maximum HP (Damocles Photon, Blast Punch).
 * 3. **The rewards**: EXP, Gil, AP, Pilfer Gil, the drops and the steals, and the items' rows (held-only, with the effect and price where the research gives them).
 * 4. **The chapter**: four linked formations, no Escape, the record, its metadata, its registry place (hidden), the party and the stat table below Lv 20 (T0 finding), the scripts' ids, the guide and the tactic.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { EnemyDef, FFX2CommandRecord } from '../../../src/battle/common/types.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../../../src/battle/ffx2/adapt/slots.ts';
import { KILL_ITEM_ID } from '../../../src/battle/ffx2/adapt/kill-rewards.ts';
import { affinityBytes } from '../../../src/battle/ffx2/adapt/words.ts';
import { dressphereStats } from '../../../src/battle/ffx2/dressphere-stats.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import {
  BORIS_SCENE, BORIS_TOO_LONG, FLAME_DRAGON_TOO_LONG, GUARDIAN_BEAST_TOO_LONG, GULLWINGS_ABILITY, GULLWINGS_ANNOUNCEMENTS, YSLS_ZERO_TOO_LONG, x2BorisScript, x2FlameDragonScript, x2GuardianBeastScript, x2YslsZeroScript,
} from '../../../src/battle/ffx2/ai/gullwings-ch1.ts';
import { SCENES } from '../../../src/battle/ffx2/ai/script-rolls.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { ALL_BOSS_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import { gullwingsCh1Build } from '../../../src/data/ffx2/builds/gullwings-ch1.ts';
import { borisGroup, flameDragonGroup, guardianBeastGroup, gullwingsCh1Groups, x2Boris, x2FlameDragon, x2GuardianBeast, x2YslsZero, yslsZeroGroup } from '../../../src/data/ffx2/enemies/gullwings-ch1.ts';
import * as ab from '../../../src/data/ffx2/enemies/gullwings-ch1-abilities.ts';
import * as ids from '../../../src/data/gullwings-ch1-ids.ts';
import { MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { KILL_REWARD_ROWS } from '../../../src/data/ffx2/monster-records/kill-rewards.ts';
import { FFX2_COMMAND_RECORDS, NO_COMMAND_RECORD } from '../../../src/data/ffx2/command-records/index.ts';
import { heldItems } from '../../../src/data/ffx2/items/held.ts';
import { FFX2_GULLWINGS_CH1, GULLWINGS_CH1_ID } from '../../../src/data/chapter-ffx2-gullwings-ch1.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { GULLWINGS_CH1_GUIDE_IDS } from '../../../src/data/guides/ffx2-gullwings-ch1.ts';
import { GULLWINGS_CH1_BOSS_IDS } from '../../../src/engine/tactics/ffx2-gullwings-ch1.ts';

interface MonsterRow {
  row: number; id: number; offset: number; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number; thinking: number;
  special: number; absorb: number; null: number; half: number; weak: number; autoStatus1: number; autoStatus2: number;
  exp: number; gil: number; pilfer: number; ap: number; dropByte: number; stealByte: number; zantetsu: number; dropItems: number[]; stealItems: number[]; bribeItems: number[]; waza: number[];
  model: number; motion: number; sound: number; type: number; resist1: Record<string, number>; resist2: Record<string, number>;
}
interface MoveRow {
  id: number; offset: number; costAtb: number; costCast: number; costMp: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number;
  crit: number; accuracy: number; power: number; hits: number; shatter: number; element: number; category: number; killer: number;
}
interface StatusRow {
  status1: Record<string, number>; status2: Record<string, number>; statusTime: Record<string, number>;
}
interface Fixture {
  monsters: Record<string, MonsterRow>;
  moves: Record<string, MoveRow>;
  statuses: Record<string, StatusRow>;
  scenes: { boris: { boss: { x: number; z: number }; girls: Array<{ x: number; z: number }> }; emptyPositionFiles: Record<string, number> };
  script: {
    boris: { spiderAttacksFirst: number; drawModulus: number; biteRoll: number; tooLongPolls: Record<string, number> };
    flameDragon: { secondBreathBelowHp: number; tooLongPolls: Record<string, number> };
    guardianBeast: { beat: number; photonBelowMaxHpDiv: number; tooLongPolls: Record<string, number> };
    yslsZero: { drawModulus: number; secondModulus: number; thirdModulus: number; tooLongPolls: Record<string, number> };
  };
}
const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx2/gullwings_ch1_rows.json', import.meta.url)), 'utf8')) as Fixture;
const byId = Object.fromEntries(ab.x2GullwingsCh1Abilities.map((a) => [a.id, a]));
const numeric = (record: Record<string, number>): Record<number, number> => Object.fromEntries(Object.entries(record).map(([k, v]) => [Number(k), v]));
const rec = (id: string): FFX2CommandRecord => FFX2_COMMAND_RECORDS[id]!;

const BOSSES: ReadonlyArray<{ id: string; enemy: EnemyDef; group: (typeof gullwingsCh1Groups)[number]; row: number; script: string }> = [
  { id: ids.X2_BORIS_ID, enemy: x2Boris, group: borisGroup, row: 132, script: ids.BORIS_SCRIPT_ID },
  { id: ids.X2_FLAME_DRAGON_ID, enemy: x2FlameDragon, group: flameDragonGroup, row: 122, script: ids.FLAME_DRAGON_SCRIPT_ID },
  { id: ids.X2_GUARDIAN_BEAST_ID, enemy: x2GuardianBeast, group: guardianBeastGroup, row: 162, script: ids.GUARDIAN_BEAST_SCRIPT_ID },
  { id: ids.X2_YSLS_ZERO_ID, enemy: x2YslsZero, group: yslsZeroGroup, row: 47, script: ids.YSLS_ZERO_SCRIPT_ID },
];

describe('the fixture is the game\'s four rows', () => {
  it('is Boris (132, Lv 8, 480 HP), the Flame Dragon (122, Lv 16, 980), the Guardian Beast (162, Lv 18, 2,886) and YSLS-Zero (47, Lv 11, 1,935), in the game\'s own ids', () => {
    const got = BOSSES.map((b) => [FIXTURE.monsters[b.id]!.row, FIXTURE.monsters[b.id]!.id, FIXTURE.monsters[b.id]!.level, FIXTURE.monsters[b.id]!.hp]);
    expect(got).toEqual([[132, 0x1084, 8, 480], [122, 0x107a, 16, 980], [162, 0x10a2, 18, 2886], [47, 0x102f, 11, 1935]]);
    expect([...ids.GULLWINGS_CH1_ROWS]).toEqual([132, 122, 162, 47]);
  });

  it('their ability lists are the note\'s: Boris Spider Attack, Sticky End and Spider Bite; the Dragon Attack and Flame Breath; the Beast Attack, Damocles Photon, Curse and Die; YSLS-Zero Attack, Blast Punch and Haymaker', () => {
    expect(FIXTURE.monsters['x2-boris']!.waza).toEqual([0x40c7, 0x40c8, 0x40ca]);
    expect(FIXTURE.monsters['x2-flame-dragon']!.waza).toEqual([0x41da, 0x40d8]);
    expect(FIXTURE.monsters['x2-guardian-beast']!.waza).toEqual([0x41da, 0x40da, 0x4046, 0x40dc]);
    expect(FIXTURE.monsters['x2-ysls-zero']!.waza).toEqual([0x41da, 0x4056, 0x4057]);
  });
});

describe.each(BOSSES)('$id: the enemy data is the row', ({ id, enemy, group, row, script }) => {
  const ROW = FIXTURE.monsters[id]!;
  const RECORD = MONSTER_RECORDS[`${group.id}/${id}`]!;

  it('level, HP, MP and the eight stats are the row\'s', () => {
    expect(ROW.row).toBe(row);
    expect(enemy.level).toBe(ROW.level);
    expect([enemy.hp, enemy.stats.hp, enemy.stats.maxHp]).toEqual([ROW.hp, ROW.hp, ROW.hp]);
    expect([enemy.mp, enemy.stats.mp, enemy.stats.maxMp]).toEqual([ROW.mp, ROW.mp, ROW.mp]);
    expect(enemy.stats).toMatchObject({ str: ROW.str, def: ROW.def, mag: ROW.mag, mdef: ROW.mdef, agi: ROW.agi, acc: ROW.acc, eva: ROW.eva, luck: ROW.luck });
    expect(enemy.forms[0]).toMatchObject({ hp: ROW.hp });
    expect(enemy.flags).toMatchObject({ isBoss: true });
    expect([ROW.model, ROW.motion].length).toBe(2);
  });

  it('the element bytes are the row\'s (the engine builds the same absorb, null, half and weak bytes from the data)', () => {
    const unit = aiUnit(id, 'enemy', ROW.hp, 0);
    unit.affinities = { ...enemy.affinities };
    expect(affinityBytes(unit)).toEqual({ absorb: ROW.absorb, nullify: ROW.null, half: ROW.half, weak: ROW.weak });
    expect(ROW.autoStatus1).toBe(0);
    expect(ROW.autoStatus2).toBe(0);
  });

  it('the rewards are the row\'s: EXP, AP, Gil, Pilfer Gil, the drop in both slots at a byte of 255, the steal and its byte', () => {
    const rw = enemy.rewards;
    expect([rw.exp, rw.ap, rw.apOverkill, rw.gil, rw.stolenGil]).toEqual([ROW.exp, ROW.ap, ROW.ap, ROW.gil, ROW.pilfer]);
    expect(ROW.dropByte).toBe(255);
    expect(ROW.dropItems[0]).toBe(ROW.dropItems[2]);
    expect(ROW.dropItems[1]).toBe(1);
    expect(rw.drops).toEqual([{ itemId: KILL_ITEM_ID[ROW.dropItems[0]!], count: 1 }]);
    expect(rw.steal?.stealRate).toBe(ROW.stealByte);
    expect(KILL_REWARD_ROWS[`${group.id}/${id}`]).toMatchObject({ table: 1, row, exp: ROW.exp, ap: ROW.ap, gil: ROW.gil, dropByte: ROW.dropByte, drop: ROW.dropItems });
    expect(enemy.ffx2Record?.kill).toBe(KILL_REWARD_ROWS[`${group.id}/${id}`]);
  });

  it('the monster record carries Accuracy, the special word, Zantetsu, the steal byte and gil, the steal items and the Bribe slots, field for field', () => {
    expect(RECORD).toBeDefined();
    expect(RECORD).toMatchObject({ row, table: 1, acc: ROW.acc, special: ROW.special, species: ROW.type, zantetsu: ROW.zantetsu, stealByte: ROW.stealByte, stealGil: ROW.pilfer, steal: ROW.stealItems, bribe: ROW.bribeItems });
    expect(enemy.ffx2Record).toBe(RECORD);
    expect(RECORD.resist1).toEqual(numeric(ROW.resist1));
    expect(RECORD.resist2).toEqual(numeric(ROW.resist2));
  });

  it('after the attach, the enemy is immune to exactly the statuses the row nulls at 255, plus Delay (special bit 6) and Interrupt (bit 9) where the word has them; a byte under 255 is the chance left; what reads 0 lands', () => {
    const expected = new Set<string>();
    if ((ROW.special >> 6) & 1) expected.add('delay-effect');
    if ((ROW.special >> 9) & 1) expected.add('action-cancel');
    for (const [slot, byte] of Object.entries(ROW.resist1)) {
      const status = GROUP1_STATUS[Number(slot)];
      if (status !== null && status !== undefined && byte === 255) expected.add(status);
    }
    for (const [slot, byte] of Object.entries(ROW.resist2)) for (const status of GROUP2_STATUS[Number(slot)] ?? []) if (byte === 255) expected.add(status);
    const immune = new Set(Object.entries(enemy.immunities).filter(([, v]) => v === 255).map(([k]) => k));
    expect([...immune].sort()).toEqual([...expected].sort());
    for (const [slot, byte] of Object.entries(ROW.resist1)) {
      const status = GROUP1_STATUS[Number(slot)];
      if (status !== null && status !== undefined && byte < 255) expect((enemy.immunities as Record<string, number | undefined>)[status], `${status}: the chance left`).toBe(byte);
    }
  });

  it('is the script id the AI registers, laid on a formation that cannot be fled, with the rewards and the sprite key the ids file names', () => {
    expect(enemy.aiScriptId).toBe(script);
    expect(aiScriptFor(script).id).toBe(script);
    expect(group.enemies).toEqual([enemy]);
    expect(group.canEscape).toBe(false);
    expect(group.game).toBe('ffx2');
    expect(group.musicCues).toEqual([{ at: 'start', track: 'boss-ffx2-fallen-aeons', fadeMs: 800 }]);
    expect(ENEMY_GROUPS_BY_ID[group.id]).toBe(group);
    expect(enemy.spriteKey).toBe(id);
    expect(group.actionTimeSeconds).toBeUndefined();
  });
});

describe('the special words and what they mean', () => {
  it('Boris is the only one of the four the percent formulas can touch (bit 0 clear); Boris and YSLS-Zero can be delayed (bit 6 clear); YSLS-Zero\'s word has the no-Bribe bit (8) and no bribe items', () => {
    const w = (id: string): number => FIXTURE.monsters[id]!.special;
    expect([w('x2-boris'), w('x2-flame-dragon'), w('x2-guardian-beast'), w('x2-ysls-zero')]).toEqual([0x18, 0x25b, 0x2db, 0x31b]);
    expect([w('x2-boris'), w('x2-flame-dragon'), w('x2-guardian-beast'), w('x2-ysls-zero')].map((v) => v & 1)).toEqual([0, 1, 1, 1]);
    expect([w('x2-boris'), w('x2-flame-dragon'), w('x2-guardian-beast'), w('x2-ysls-zero')].map((v) => (v >> 6) & 1)).toEqual([0, 1, 1, 0]);
    expect((w('x2-ysls-zero') >> 8) & 1).toBe(1);
    expect(FIXTURE.monsters['x2-ysls-zero']!.bribeItems).toEqual([0, 0, 0, 0]);
    expect(x2Boris.immunityFlags).toEqual(['boss']);
    expect(x2YslsZero.immunityFlags).not.toContain('immune-to-delay');
  });

  it('the element table: Boris weak to Fire and Ice; the Dragon weak to Ice, half Fire, Gravity nulled; the Beast weak to Fire, Ice, Thunder, Water and Holy, Gravity nulled; YSLS-Zero only Gravity nulled', () => {
    expect(x2Boris.affinities).toEqual({ fire: 'weak', ice: 'weak' });
    expect(x2FlameDragon.affinities).toEqual({ fire: 'resist', ice: 'weak', gravity: 'immune' });
    expect(x2GuardianBeast.affinities).toEqual({ fire: 'weak', ice: 'weak', lightning: 'weak', water: 'weak', holy: 'weak', gravity: 'immune' });
    expect(x2YslsZero.affinities).toEqual({ gravity: 'immune' });
  });

  it('what lands: Boris takes Petrify, Silence and Darkness; the Dragon takes Poison and Berserk; the Beast takes Berserk at 60 and Darkness at 50 only; YSLS-Zero takes Darkness; Stop is walled on all four', () => {
    const resisted = (e: EnemyDef, s: string): number => (e.immunities as Record<string, number | undefined>)[s] ?? 0;
    for (const s of ['petrify', 'silence', 'darkness']) expect(resisted(x2Boris, s), `Boris ${s}`).toBe(0);
    for (const s of ['poison', 'berserk']) expect(resisted(x2FlameDragon, s), `Dragon ${s}`).toBe(0);
    expect([resisted(x2GuardianBeast, 'berserk'), resisted(x2GuardianBeast, 'darkness')]).toEqual([60, 50]);
    expect(resisted(x2YslsZero, 'darkness')).toBe(0);
    for (const e of [x2Boris, x2FlameDragon, x2GuardianBeast, x2YslsZero]) expect(resisted(e, 'stop'), e.id).toBe(255);
  });

  it('the Eject bytes are the row\'s: 100, 40, 200 and 32', () => {
    expect([x2Boris, x2FlameDragon, x2GuardianBeast, x2YslsZero].map((e) => (e.immunities as Record<string, number>)['eject'])).toEqual([100, 40, 200, 32]);
  });
});

describe('the moves are the rows (damage constants, targets, the hit rule, the fractions)', () => {
  it('the ids are the data\'s and the AI\'s, in both layers, and the shipped table holds all sixteen', () => {
    expect(GULLWINGS_ABILITY).toEqual({
      spiderAttack: ab.BORIS_SPIDER_ATTACK_ID, stickyEnd: ab.BORIS_STICKY_END_ID, spiderBite: ab.BORIS_SPIDER_BITE_ID, flameDragonAttack: ab.FLAME_DRAGON_ATTACK_ID, flameBreath: ab.FLAME_DRAGON_FLAME_BREATH_ID,
      guardianBeastAttack: ab.GUARDIAN_BEAST_ATTACK_ID, damoclesPhoton: ab.GUARDIAN_BEAST_DAMOCLES_PHOTON_ID, curse: ab.GUARDIAN_BEAST_CURSE_ID, yslsAttack: ab.YSLS_ZERO_ATTACK_ID,
      yslsAttackNoCancel: ab.YSLS_ZERO_ATTACK_NO_CANCEL_ID, blastPunch: ab.YSLS_ZERO_BLAST_PUNCH_ID, haymaker: ab.YSLS_ZERO_HAYMAKER_ID, timeUpMeteor: ab.GULLWINGS_TIME_UP_METEOR_ID,
    });
    expect([...GULLWINGS_ANNOUNCEMENTS]).toEqual([...ab.GULLWINGS_ANNOUNCEMENT_IDS]);
    expect(ab.x2GullwingsCh1Abilities).toHaveLength(17);
    expect(aiScriptFor(ids.BORIS_SCRIPT_ID)).toBe(x2BorisScript);
    expect(aiScriptFor(ids.FLAME_DRAGON_SCRIPT_ID)).toBe(x2FlameDragonScript);
    expect(aiScriptFor(ids.GUARDIAN_BEAST_SCRIPT_ID)).toBe(x2GuardianBeastScript);
    expect(aiScriptFor(ids.YSLS_ZERO_SCRIPT_ID)).toBe(x2YslsZeroScript);
    for (const a of ab.x2GullwingsCh1Abilities) {
      expect(ALL_BOSS_ABILITIES.find((x) => x.id === a.id), a.id).toBeDefined();
      expect(data.ABILITIES[a.id], a.id).toBeDefined();
      expect(a.id.startsWith('x2-'), a.id).toBe(true); // never an FFX id
    }
    for (const b of BOSSES) for (const abilityId of b.enemy.abilityIds) expect(byId[abilityId], `${b.id} / ${abilityId}`).toBeDefined();
  });

  it('every move\'s record is the fixture\'s row, field for field (the two generic Attacks run on the monster record\'s plain Attack and are checked there)', () => {
    for (const [name, want] of Object.entries(FIXTURE.moves)) {
      if (name === 'x2-flame-dragon-attack' || name === 'x2-guardian-beast-attack') {
        expect(MONSTER_RECORDS[`${name === 'x2-flame-dragon-attack' ? ids.FLAME_DRAGON_GROUP_ID : ids.GUARDIAN_BEAST_GROUP_ID}/${name === 'x2-flame-dragon-attack' ? ids.X2_FLAME_DRAGON_ID : ids.X2_GUARDIAN_BEAST_ID}`]!.plainAttack, name).toMatchObject({
          id: want.id, costAtb: want.costAtb, costCast: want.costCast, flagsTarget: want.flagsTarget, flagsMisc: want.flagsMisc, flagsDamage: want.flagsDamage, damageClass: want.damageClass, formula: want.formula,
          critByte: want.crit, accuracy: want.accuracy, power: want.power, hits: want.hits, shatter: want.shatter, element: want.element,
        });
        continue;
      }
      if (name.startsWith('x2-gullwings-') && name !== 'x2-gullwings-time-up-meteor') {
        expect(FFX2_COMMAND_RECORDS[name], `${name}: a scripted announcement has no record`).toBeUndefined();
        expect(NO_COMMAND_RECORD[name], name).toBeTypeOf('string');
        expect([want.formula, want.power, want.hits], name).toEqual([0, 0, 0]);
        continue;
      }
      const record = rec(name);
      expect(record, name).toBeDefined();
      expect(record, name).toMatchObject({
        id: want.id, costAtb: want.costAtb, costCast: want.costCast, category: want.category, flagsTarget: want.flagsTarget, flagsMisc: want.flagsMisc, flagsDamage: want.flagsDamage, damageClass: want.damageClass, formula: want.formula,
        critByte: want.crit, accuracy: want.accuracy, power: want.power, hits: want.hits, shatter: want.shatter, element: want.element, killer: want.killer,
      });
      const st = FIXTURE.statuses[name];
      expect(record.status1 ?? {}, `${name} status1`).toEqual(numeric(st?.status1 ?? {}));
      expect(record.status2 ?? {}, `${name} status2`).toEqual(numeric(st?.status2 ?? {}));
      expect(record.statusTime ?? {}, `${name} statusTime`).toEqual(numeric(st?.statusTime ?? {}));
      if (name !== 'x2-flame-dragon-attack') expect(byId[name]!.ffx2Record, name).toBe(record);
    }
  });

  it('the damage constants: Spider Attack 16 (two hits), Sticky End 1, Spider Bite 32, Attack 16, Flame Breath 32, Damocles Photon 8, Haymaker 15 (two hits), Blast Punch 8, Time Up Meteor 200 (12 hits)', () => {
    expect(ab.GULLWINGS_DC).toEqual({ spiderAttack: 16, stickyEnd: 1, spiderBite: 32, attack: 16, flameBreath: 32, damoclesPhoton: 8, haymaker: 15, blastPunch: 8, timeUpMeteor: 200 });
    expect([byId[ab.BORIS_SPIDER_ATTACK_ID]!.hits, byId[ab.YSLS_ZERO_HAYMAKER_ID]!.hits, byId[ab.GULLWINGS_TIME_UP_METEOR_ID]!.hits]).toEqual([2, 2, 12]);
    for (const [name, a] of Object.entries(FIXTURE.moves)) {
      if (byId[name] === undefined) continue;
      expect(byId[name]!.power, name).toBe(a.power);
      expect(byId[name]!.hits, name).toBe(a.hits === 0 ? 1 : a.hits);
    }
  });

  it('the two fractions of maximum HP are formula 7: Damocles Photon 8/16 magical on all three (Shell applies), Blast Punch 8/16 with damage flags 0 (neither Protect nor Shell reduces it) on one, the delay bits set', () => {
    expect(rec(ab.GUARDIAN_BEAST_DAMOCLES_PHOTON_ID)).toMatchObject({ formula: 7, power: 8, flagsTarget: 0x17, flagsDamage: 0x2 });
    expect(rec(ab.YSLS_ZERO_BLAST_PUNCH_ID)).toMatchObject({ formula: 7, power: 8, flagsTarget: 0x13, flagsDamage: 0x0 });
    expect(rec(ab.YSLS_ZERO_BLAST_PUNCH_ID).flagsMisc & 0x2000, 'the strong-delay bit').toBe(0x2000);
    expect(byId[ab.GUARDIAN_BEAST_DAMOCLES_PHOTON_ID]).toMatchObject({ formula: 'percent-total', damageType: 'magical', targeting: 'all-enemies' });
    expect(byId[ab.YSLS_ZERO_BLAST_PUNCH_ID]).toMatchObject({ formula: 'percent-total', damageType: 'other', targeting: 'single-enemy' });
  });

  it('Sticky End is formula 8 on all three, damage flags 0, Stop at 40 with a counter of 20; Curse is Curse at 254 on one; Flame Breath is Fire, formula 9, 30 MP, cast 140; Haymaker never rolls', () => {
    expect(rec(ab.BORIS_STICKY_END_ID)).toMatchObject({ formula: 8, power: 1, flagsTarget: 0x17, flagsDamage: 0, costCast: 10, status2: { 6: 40 }, statusTime: { 6: 20 } });
    expect(ab.STICKY_END_STOP_CHANCE).toBe(40);
    expect(ab.STICKY_END_STOP_COUNTER).toBe(20);
    expect(byId[ab.BORIS_STICKY_END_ID]!.statusEffects).toEqual([{ status: 'stop', chance: 40, duration: 0 }]);
    expect(rec(ab.GUARDIAN_BEAST_CURSE_ID)).toMatchObject({ status1: { 8: 254 }, damageClass: 0, costCast: 120 });
    expect(byId[ab.GUARDIAN_BEAST_CURSE_ID]!.statusEffects).toEqual([{ status: 'curse', chance: 254, duration: 0 }]);
    expect(rec(ab.FLAME_DRAGON_FLAME_BREATH_ID)).toMatchObject({ formula: 9, element: 1, costCast: 140, power: 32 });
    expect(byId[ab.FLAME_DRAGON_FLAME_BREATH_ID]).toMatchObject({ mpCost: ab.FLAME_BREATH_MP, formula: 'special-magic', element: ['fire'], damageType: 'magical' });
    expect(ab.FLAME_BREATH_MP).toBe(30);
    expect(ab.DAMOCLES_PHOTON_MP).toBe(28);
    expect((rec(ab.YSLS_ZERO_HAYMAKER_ID).flagsMisc >> 3) & 7, 'accuracy formula 0').toBe(0);
  });

  it('hard rule 5: the moves with accuracy formula 1 or 2 (Spider Attack and the three plain Attacks) are `canMiss: true`; every other move is `canMiss: false`', () => {
    const rolls = new Set([ab.BORIS_SPIDER_ATTACK_ID, ab.FLAME_DRAGON_ATTACK_ID, ab.GUARDIAN_BEAST_ATTACK_ID, ab.YSLS_ZERO_ATTACK_ID, ab.YSLS_ZERO_ATTACK_NO_CANCEL_ID]);
    for (const a of ab.x2GullwingsCh1Abilities) expect(a.canMiss === true, a.id).toBe(rolls.has(a.id));
    expect((FIXTURE.moves['x2-boris-spider-attack']!.flagsMisc >> 3) & 7).toBe(1);
    for (const id of ['x2-flame-dragon-attack', 'x2-guardian-beast-attack', 'x2-ysls-zero-attack', 'x2-ysls-zero-attack-no-cancel']) expect((FIXTURE.moves[id]!.flagsMisc >> 3) & 7, id).toBe(2);
  });

  it('the "battle too long" block: four announcements in our own words (none of the game\'s strings) and Time Up Meteor, everyone, 12 hits of 10,000', () => {
    const lines = ab.GULLWINGS_ANNOUNCEMENT_IDS.map((id) => byId[id]!.messageTemplate!);
    for (const line of lines) expect(line).not.toMatch(/battle too long/i);
    expect(new Set(lines).size).toBe(4);
    for (const id of ab.GULLWINGS_ANNOUNCEMENT_IDS) expect(byId[id]).toMatchObject({ power: 0, formula: 'none', targeting: 'self', canMiss: false });
    expect(byId[ab.GULLWINGS_TIME_UP_METEOR_ID]).toMatchObject({ formula: 'fixed-no-variance', damageType: 'other', targeting: 'all-enemies', hits: 12, power: 200 });
  });
});

describe('the scenes and the script constants are the fixture\'s', () => {
  it('Boris\'s start positions are the fixture\'s (the scene table has the row); the other three scenes ship empty position files, so their picks are uniform', () => {
    expect(BORIS_SCENE).toBe(SCENES.boris);
    expect(BORIS_SCENE.boss).toEqual(FIXTURE.scenes.boris.boss);
    expect(BORIS_SCENE.girls).toEqual(FIXTURE.scenes.boris.girls);
    expect(Object.values(FIXTURE.scenes.emptyPositionFiles)).toEqual([0, 0, 0]);
  });

  it('the polls past which each stage of a block shows are the fixture\'s, in the AI and in the ids file', () => {
    const polls = (p: Record<string, number>): number[] => [p['angry']!, p['furious']!, p['aboutToBlow']!, p['endsNow']!];
    expect([...BORIS_TOO_LONG]).toEqual(polls(FIXTURE.script.boris.tooLongPolls));
    expect([...FLAME_DRAGON_TOO_LONG]).toEqual(polls(FIXTURE.script.flameDragon.tooLongPolls));
    expect([...GUARDIAN_BEAST_TOO_LONG]).toEqual(polls(FIXTURE.script.guardianBeast.tooLongPolls));
    expect([...YSLS_ZERO_TOO_LONG]).toEqual(polls(FIXTURE.script.yslsZero.tooLongPolls));
    expect([...ids.BORIS_TOO_LONG_POLLS]).toEqual([...BORIS_TOO_LONG]);
    expect([...ids.FLAME_DRAGON_TOO_LONG_POLLS]).toEqual([...FLAME_DRAGON_TOO_LONG]);
    expect([...ids.GUARDIAN_BEAST_TOO_LONG_POLLS]).toEqual([...GUARDIAN_BEAST_TOO_LONG]);
    expect([...ids.YSLS_ZERO_TOO_LONG_POLLS]).toEqual([...YSLS_ZERO_TOO_LONG]);
  });
});

describe('the items', () => {
  it('the four drops and the four steals have rows: the effect and price where the research gives them (Star Pendant 4,000; Wristband, Defense Veil and Mythril Gloves 1,000), none for the Red Ring', () => {
    const item = (id: string) => heldItems.find((i) => i.id === id)!;
    for (const id of ['star-pendant', 'red-ring', 'wristband', 'defense-veil', 'mythril-gloves']) {
      expect(item(id), id).toBeDefined();
      expect(item(id).usableInBattle, id).toBe(false);
    }
    expect([item('star-pendant').price, item('wristband').price, item('defense-veil').price, item('mythril-gloves').price, item('red-ring').price]).toEqual([4000, 1000, 1000, 1000, 0]);
    expect(data.ITEMS['x2-remedy']?.name).toBe('Remedy');
    expect(data.ITEMS['x2-hi-potion']?.name).toBe('Hi-Potion');
    expect(data.ITEMS['amulet']?.name).toBe('Amulet');
    expect([KILL_ITEM_ID[0x904a], KILL_ITEM_ID[0x9021], KILL_ITEM_ID[0x900f], KILL_ITEM_ID[0x9007]]).toEqual(['star-pendant', 'red-ring', 'amulet', 'wristband']);
  });

  it('the steals are the rows\': Remedy x1 or x2, Hi-Potion x1 or x2, Defense Veil, Mythril Gloves', () => {
    expect(x2Boris.rewards.steal).toMatchObject({ common: { itemId: 'x2-remedy', count: 1 }, rare: { itemId: 'x2-remedy', count: 2 } });
    expect(x2FlameDragon.rewards.steal).toMatchObject({ common: { itemId: 'x2-hi-potion', count: 1 }, rare: { itemId: 'x2-hi-potion', count: 2 } });
    expect(x2GuardianBeast.rewards.steal).toMatchObject({ common: { itemId: 'defense-veil', count: 1 }, rare: { itemId: 'defense-veil', count: 1 } });
    expect(x2YslsZero.rewards.steal).toMatchObject({ common: { itemId: 'mythril-gloves', count: 1 }, rare: { itemId: 'mythril-gloves', count: 1 } });
    expect([x2Boris, x2FlameDragon, x2GuardianBeast, x2YslsZero].map((e) => e.rewards.steal?.stealRate)).toEqual([255, 255, 128, 128]);
  });
});

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
    for (const b of BOSSES) expect(FFX2_GULLWINGS_CH1.sensorTexts[b.id]).toBe(b.enemy.sensorText);
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
