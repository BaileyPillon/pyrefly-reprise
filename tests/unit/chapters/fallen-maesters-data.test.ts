/**
 * The Fallen Maesters (the Via Infinito's floors 20, 40, 60 and 80; the hidden FFX-2 chapter): the data against the game's own rows. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `tests/fixtures/parity/ffx2/fallen_maesters_rows.json` holds the four monsters' rows (`monster.bin` rows 221, 69, 232 and 239) and the normal scripts' moves (`monmagic.bin` / `command.bin`) as the RE session decoded them
 * (`research/re-ffx2-fallen-maesters.md` §4, §8 and the appendix), numbers only. This file compares them to the enemy data, the monster records and the command records field by field; it also pins:
 *
 * 1. **The enemies**: level, HP, MP and the stat bytes; the element bytes (Chac absorbs Thunder and is weak to Ice, all four null Gravity); the permanent statuses (Reflect on the Black Elemental, Shell and Protect on Concherer).
 * 2. **The ailments** [RE §4.2]: the group-1 and group-2 resist bytes, Eject 100 / 100 / 255 / 90, every stat stage immune on Aranea, Concherer and Chac and on none of the Black Elemental's; the special words, with Chac the only one that can be slowed or delayed.
 * 3. **The moves**: every row of the appendix, the abilities' own fields consistent with them, and the hit rule (hard rule 5): only the three Attacks roll to hit.
 * 4. **The chain and the chapter**: four formations chained by `nextGroupId`, links 2 to 4 restore the party with no Save Sphere card, no Escape; the chapter record, its pause metadata, its door word and its place in the registry.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { EnemyDef, FFX2CommandRecord } from '../../../src/battle/common/types.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { MAESTERS_DOOR_CHAPTER, MAESTERS_DOOR_WORD } from '../../../src/app/screens/frontend/maestersDoor.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { FFX2_FALLEN_MAESTERS } from '../../../src/data/chapter-ffx2-fallen-maesters.ts';
import { FALLEN_MAESTERS_META } from '../../../src/data/chapter-meta-ffx2-fallen-maesters.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID, ALL_BOSS_ABILITIES } from '../../../src/data/ffx2/enemies/index.ts';
import {
  fallenMaestersGroups,
  floor20AraneaGroup,
  floor40BlackElementalGroup,
  floor60ConchererGroup,
  floor80ChacGroup,
  x2Aranea,
  x2BlackElemental,
  x2Chac,
  x2Concherer,
} from '../../../src/data/ffx2/enemies/fallen-maesters.ts';
import { x2FallenMaestersAbilities } from '../../../src/data/ffx2/enemies/fallen-maesters-abilities.ts';
import { fallenMaestersBuild } from '../../../src/data/ffx2/builds/fallen-maesters.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { COMMAND_RECORDS_FALLEN_MAESTERS } from '../../../src/data/ffx2/command-records/fallen-maesters.ts';
import { MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { MONSTER_RECORDS_FALLEN_MAESTERS } from '../../../src/data/ffx2/monster-records/records-fallen-maesters.ts';
import * as ids from '../../../src/data/fallen-maesters-ids.ts';

interface MonsterRow {
  row: number; id: number; offset: number; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number;
  special: number; absorb: number; null: number; half: number; weak: number; autoStatus1: number; autoStatus2: number;
  exp: number; gil: number; pilfer: number; ap: number; dropByte: number; stealByte: number; zantetsu: number;
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
const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx2/fallen_maesters_rows.json', import.meta.url)), 'utf8')) as Fixture;

const ENEMIES: Record<string, EnemyDef> = { 'x2-aranea': x2Aranea, 'x2-black-elemental': x2BlackElemental, 'x2-concherer': x2Concherer, 'x2-chac': x2Chac };
const GROUP_OF: Record<string, string> = {
  'x2-aranea': ids.FLOOR_20_GROUP_ID,
  'x2-black-elemental': ids.FLOOR_40_GROUP_ID,
  'x2-concherer': ids.FLOOR_60_GROUP_ID,
  'x2-chac': ids.FLOOR_80_GROUP_ID,
};
const numeric = (record: Record<string, number>): Record<number, number> => Object.fromEntries(Object.entries(record).map(([k, v]) => [Number(k), v]));

describe('the four monsters against the rows [RE §4.1]', () => {
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

    it(`${id}: the monster record is the row's (special word ${row.special.toString(16)}, Zantetsu ${row.zantetsu}, ACC 95) and is laid on the enemy`, () => {
      const record = MONSTER_RECORDS[`${GROUP_OF[id]}/${id}`]!;
      expect(record).toBe(MONSTER_RECORDS_FALLEN_MAESTERS[`${GROUP_OF[id]}/${id}`]);
      expect([record.row, record.table, record.acc, record.special, record.zantetsu, record.stealByte, record.stealGil]).toEqual([row.row, 1, row.acc, row.special, row.zantetsu, row.stealByte, row.pilfer]);
      expect(record.resist1).toEqual(numeric(row.resist1));
      expect(record.resist2).toEqual(numeric(row.resist2));
      expect(enemy.ffx2Record).toBe(record);
    });

    it(`${id}: the element bytes (absorb ${row.absorb}, null ${row.null}, half ${row.half}, weak ${row.weak}) are the enemy's affinities`, () => {
      expect(enemy.affinities.gravity).toBe('immune'); // null byte 0x10 on all four
      expect(row.null).toBe(0x10);
      expect(enemy.affinities.lightning).toBe(row.absorb === 0x04 ? 'absorb' : undefined);
      expect(enemy.affinities.ice).toBe(row.weak === 0x02 ? 'weak' : undefined);
      for (const element of ['fire', 'water', 'holy'] as const) expect(enemy.affinities[element], element).toBeUndefined();
    });
  }

  it('the permanent statuses are the rows\' automatic ones: Reflect (slot 2) on the Black Elemental, Shell and Protect (slots 0 and 1) on Concherer, none on Aranea or Chac', () => {
    expect(FIXTURE.monsters['x2-black-elemental']!.autoStatus2).toBe(0x4);
    expect(FIXTURE.monsters['x2-concherer']!.autoStatus2).toBe(0x3);
    expect(x2BlackElemental.autoStatuses).toEqual(['reflect']);
    expect(x2Concherer.autoStatuses).toEqual(['shell', 'protect']);
    expect(x2Aranea.autoStatuses).toBeUndefined();
    expect(x2Chac.autoStatuses).toBeUndefined();
    for (const row of Object.values(FIXTURE.monsters)) expect(row.autoStatus1).toBe(0);
  });

  it('the Oversoul versions are NOT used: every record is table 1 (monster.bin), none of monster2.bin (FM2 a)', () => {
    for (const record of Object.values(MONSTER_RECORDS_FALLEN_MAESTERS)) expect(record.table).toBe(1);
  });
});

describe('the ailments and the special words [RE §4.2, §7.8]', () => {
  const resisted = (enemy: EnemyDef, status: string): number => (enemy.immunities as Record<string, number | undefined>)[status] ?? 0;

  it('all four are immune to Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Slow, Stop and Doom', () => {
    for (const enemy of Object.values(ENEMIES)) {
      for (const status of ['ko', 'petrify', 'sleep', 'silence', 'darkness', 'poison', 'confuse', 'berserk', 'curse', 'slow', 'stop', 'doom']) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(255);
    }
  });

  it('Eject reads 100, 100, 255 and 90; Reflect, Shell, Protect, Regen and Haste are resisted by none', () => {
    expect([x2Aranea, x2BlackElemental, x2Concherer, x2Chac].map((e) => resisted(e, 'eject'))).toEqual([100, 100, 255, 90]);
    for (const enemy of Object.values(ENEMIES)) for (const status of ['reflect', 'shell', 'protect', 'regen', 'haste']) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(0);
  });

  it('every stat stage is immune on Aranea, Concherer and Chac and on none of the Black Elemental (Magic Up is its own, and a Break lands on it)', () => {
    const stages = ['str', 'mag', 'def', 'mdef', 'accu', 'eva', 'luck'].flatMap((s) => [`${s}-up`, `${s}-down`]);
    for (const enemy of [x2Aranea, x2Concherer, x2Chac]) for (const status of stages) expect(resisted(enemy, status), `${enemy.id} ${status}`).toBe(255);
    for (const status of stages) expect(resisted(x2BlackElemental, status), `black elemental ${status}`).toBe(0);
  });

  it('special words: Chac (0x99) has neither the no-ATB-damage bit nor the Interrupt bit, so she can be delayed; the other three (0x25b, 0x253, 0x2db) have both', () => {
    const SPECIAL_NO_ATB_DAMAGE = 1 << 6;
    const SPECIAL_NO_INTERRUPT = 1 << 9;
    const word = (e: EnemyDef): number => e.ffx2Record!.special;
    for (const enemy of [x2Aranea, x2BlackElemental, x2Concherer]) {
      expect(word(enemy) & SPECIAL_NO_ATB_DAMAGE, enemy.id).not.toBe(0);
      expect(word(enemy) & SPECIAL_NO_INTERRUPT, enemy.id).not.toBe(0);
      expect(enemy.immunityFlags, enemy.id).toContain('immune-to-delay');
      expect(resisted(enemy, 'action-cancel'), enemy.id).toBe(255);
      expect(resisted(enemy, 'delay-effect'), enemy.id).toBe(255);
    }
    expect(word(x2Chac) & (SPECIAL_NO_ATB_DAMAGE | SPECIAL_NO_INTERRUPT)).toBe(0);
    expect(x2Chac.immunityFlags).not.toContain('immune-to-delay');
    expect(resisted(x2Chac, 'action-cancel')).toBe(0);
    expect(resisted(x2Chac, 'delay-effect'), 'Chac carries no delay-effect entry: a dead field there would read as protection she does not have').toBe(0);
    for (const enemy of Object.values(ENEMIES)) expect(enemy.immunityFlags, enemy.id).toContain('immune-to-percentage-damage'); // bit 0
  });
});

describe('the moves against the appendix [RE §8]', () => {
  for (const [id, row] of Object.entries(FIXTURE.moves)) {
    it(`${id}: the command record is row 0x${row.id.toString(16)} (offset ${row.offset}) field for field`, () => {
      const record: FFX2CommandRecord = COMMAND_RECORDS_FALLEN_MAESTERS[id]!;
      expect(record, id).toBeDefined();
      expect(FFX2_COMMAND_RECORDS[id]).toBe(record);
      expect(
        [record.id, record.costAtb, record.costCast, record.flagsTarget, record.flagsMisc, record.flagsDamage, record.damageClass, record.formula, record.critByte, record.accuracy, record.power, record.hits, record.shatter, record.element],
      ).toEqual([row.id, row.costAtb, row.costCast, row.flagsTarget, row.flagsMisc, row.flagsDamage, row.damageClass, row.formula, row.crit, row.accuracy, row.power, row.hits, row.shatter, row.element]);
      const ability = x2FallenMaestersAbilities.find((a) => a.id === id)!;
      expect(ability, id).toBeDefined();
      expect(ability.mpCost).toBe(row.costMp);
      expect(ability.hits).toBe(row.hits);
    });
  }

  it('the status bytes: Gooey End Poison 254, Stop 254 for a counter of 25, STR and MAG -1; Berserk 75; Magic Up +2; Gunk Poison 254; Stony Glare Petrify 255; Cataract the five stages at -10', () => {
    for (const [id, status] of Object.entries(FIXTURE.statuses)) {
      const record = COMMAND_RECORDS_FALLEN_MAESTERS[id]!;
      expect(record.status1, id).toEqual(status.status1 === undefined ? undefined : numeric(status.status1));
      expect(record.status2, id).toEqual(status.status2 === undefined ? undefined : numeric(status.status2));
      expect(record.statusTime, id).toEqual(status.statusTime === undefined ? undefined : numeric(status.statusTime));
    }
  });

  it('Ultima is not reflectable (its misc word lacks 0x80) and Flare is; Megaton Press and Heaven\'s Cataract cap at 99,999 (damage flag 0x80); Attack, Press and Cataract shatter as the rows say', () => {
    const r = COMMAND_RECORDS_FALLEN_MAESTERS;
    expect(r['x2-black-elemental-ultima']!.flagsMisc & 0x80).toBe(0);
    expect(r['x2-black-elemental-flare']!.flagsMisc & 0x80).toBe(0x80);
    expect(r['x2-concherer-megaton-press']!.flagsDamage & 0x80).toBe(0x80);
    expect(r['x2-chac-heavens-cataract']!.flagsDamage & 0x80).toBe(0x80);
    expect([r['x2-concherer-attack']!.shatter, r['x2-chac-attack']!.shatter, r['x2-chac-heavens-cataract']!.shatter]).toEqual([100, 100, 100]);
    expect(r['x2-aranea-attack']!.shatter).toBe(10);
  });

  it('the ability definitions agree with their rows where the engine reads the definition and not the record: the damage type follows the row\'s damage flags (Spider Bite is "other"), Ultima is not reflectable and Flare is, Heaven\'s Cataract drops each of its five stages by ten', () => {
    const ability = (id: string) => x2FallenMaestersAbilities.find((a) => a.id === id)!;
    for (const [id, row] of Object.entries(FIXTURE.moves)) {
      // Rows with no damage at all (a status, a buff, the presentation rows) are "other" whatever their flags say; the others follow bit 1 (physical) and bit 2 (magical) of the row's damage flags.
      if (row.power === 0 && row.damageClass === 0) continue;
      const expected = row.flagsDamage & 1 ? 'physical' : row.flagsDamage & 2 ? 'magical' : 'other';
      expect(ability(id).damageType, `${id} (damage flags 0x${row.flagsDamage.toString(16)})`).toBe(expected);
    }
    expect(ability('x2-aranea-spider-bite').damageType).toBe('other');
    expect(ability('x2-black-elemental-ultima').flags ?? []).not.toContain('reflectable');
    expect(ability('x2-black-elemental-flare').flags ?? []).toContain('reflectable');
    expect((ability('x2-chac-heavens-cataract').statusEffects ?? []).map((e) => [e.status, e.stacks])).toEqual([['def-down', 10], ['mdef-down', 10], ['accu-down', 10], ['eva-down', 10], ['luck-down', 10]]);
  });

  it('the abilities are the data catalog\'s (ALL_BOSS_ABILITIES) and none is missing a command record', () => {
    for (const ability of x2FallenMaestersAbilities) {
      expect(ALL_BOSS_ABILITIES, ability.id).toContain(ability);
      expect(COMMAND_RECORDS_FALLEN_MAESTERS[ability.id], ability.id).toBeDefined();
    }
    expect(x2FallenMaestersAbilities.map((a) => a.id)).toHaveLength(15);
    expect(new Set(x2FallenMaestersAbilities.map((a) => a.id)).size).toBe(15);
    for (const id of Object.keys(COMMAND_RECORDS_FALLEN_MAESTERS)) expect(x2FallenMaestersAbilities.some((a) => a.id === id), id).toBe(true);
  });

  it('hit rule (rule 5): only the three Attacks can miss (accuracy formula 2); every other move carries canMiss false, set explicitly', () => {
    const rolls = x2FallenMaestersAbilities.filter((a) => a.canMiss === true).map((a) => a.id);
    expect(rolls.sort()).toEqual(['x2-aranea-attack', 'x2-chac-attack', 'x2-concherer-attack']);
    for (const ability of x2FallenMaestersAbilities.filter((a) => !rolls.includes(a.id))) expect(ability.canMiss, ability.id).toBe(false);
    for (const id of rolls) expect((COMMAND_RECORDS_FALLEN_MAESTERS[id]!.flagsMisc >> 3) & 7, id).toBe(2); // accuracy formula 2
  });

  it('every enemy lists exactly the abilities its script uses', () => {
    expect([...x2Aranea.abilityIds].sort()).toEqual(['x2-aranea-attack', 'x2-aranea-gooey-end', 'x2-aranea-spider-bite']);
    expect([...x2BlackElemental.abilityIds].sort()).toEqual(['x2-black-elemental-absorb', 'x2-black-elemental-berserk', 'x2-black-elemental-flare', 'x2-black-elemental-magic-up', 'x2-black-elemental-ultima']);
    expect([...x2Concherer.abilityIds].sort()).toEqual(['x2-concherer-attack', 'x2-concherer-broken-shell', 'x2-concherer-gunk', 'x2-concherer-megaton-press']);
    expect([...x2Chac.abilityIds].sort()).toEqual(['x2-chac-attack', 'x2-chac-heavens-cataract', 'x2-chac-stony-glare']);
  });
});

describe('the chain: four formations, each a fresh fight (FM1 b)', () => {
  it('floors 20, 40, 60 and 80 chain by nextGroupId and are registered by id', () => {
    expect(fallenMaestersGroups.map((g) => g.id)).toEqual([...ids.FALLEN_MAESTERS_GROUP_IDS]);
    expect(fallenMaestersGroups.map((g) => g.nextGroupId)).toEqual([ids.FLOOR_40_GROUP_ID, ids.FLOOR_60_GROUP_ID, ids.FLOOR_80_GROUP_ID, undefined]);
    for (const group of fallenMaestersGroups) expect(ENEMY_GROUPS_BY_ID[group.id], group.id).toBe(group);
    expect(fallenMaestersGroups.map((g) => g.enemies.map((e) => e.id))).toEqual([['x2-aranea'], ['x2-black-elemental'], ['x2-concherer'], ['x2-chac']]);
    for (const group of fallenMaestersGroups) {
      expect(group.game).toBe('ffx2');
      expect(group.parts).toBeUndefined(); // one fiend a floor, no adds [RE §5.1]
    }
  });

  it('links 2 to 4 restore the party (the glyph) with no Save Sphere card and are the retry checkpoints; link 1 does neither; nobody can escape', () => {
    expect([floor20AraneaGroup, floor40BlackElementalGroup, floor60ConchererGroup, floor80ChacGroup].map((g) => g.restoresPartyOnEntry === true)).toEqual([false, true, true, true]);
    expect([floor20AraneaGroup, floor40BlackElementalGroup, floor60ConchererGroup, floor80ChacGroup].map((g) => g.noSaveSphereCard === true)).toEqual([false, true, true, true]);
    for (const group of fallenMaestersGroups) {
      expect(group.canEscape, group.id).toBe(false);
      expect(group.carriesPartyState, group.id).toBeUndefined(); // each link is fresh: no statuses or worn dressphere carried
      expect(group.hopelessRetry, group.id).toBeUndefined();
    }
  });

  it('the scripts the enemies name are registered and the ids file agrees', () => {
    for (const enemy of Object.values(ENEMIES)) expect(aiScriptFor(enemy.aiScriptId).id, enemy.id).toBe(enemy.aiScriptId);
    expect(ids.FALLEN_MAESTERS_BODY_IDS).toEqual(['x2-aranea', 'x2-black-elemental', 'x2-concherer', 'x2-chac']);
    expect(ids.FALLEN_MAESTERS_FLOORS).toEqual([20, 40, 60, 80]);
  });
});

describe('the party (FM3 a)', () => {
  it('is Chapter XIII\'s Lv 99 three as it is, as a deep copy', () => {
    expect(fallenMaestersBuild).toEqual(viaInfinitoBuild);
    expect(fallenMaestersBuild).not.toBe(viaInfinitoBuild);
    expect(fallenMaestersBuild.members[0]).not.toBe(viaInfinitoBuild.members[0]);
    expect(fallenMaestersBuild.members.map((m) => m.level)).toEqual([99, 99, 99]);
  });
});

describe('the player-facing words tell the truth about the kit (review of ch-maesters, major 1)', () => {
  it('nobody starts with a gate crossed, so Paine\'s Break Damage Limit (The End\'s red and green gates) is not on at the start: the walk is pinned in fallen-maesters-walk.test.ts', () => {
    const paine = fallenMaestersBuild.members.find((m) => m.id === 'paine')!;
    expect(paine.garmentGrid).toMatchObject({ id: 'the-end', passedGates: [] });
    for (const m of fallenMaestersBuild.members) expect(m.garmentGrid.passedGates, m.id).toEqual([]);
  });

  it('the prep tip and the Concherer guide line say how a 20,000 hit is made (Paine\'s Break Damage Limit across The End\'s red and green gates), not only that one is needed', () => {
    expect(FALLEN_MAESTERS_META.tip).toMatch(/twenty thousand/);
    expect(FALLEN_MAESTERS_META.tip).toMatch(/Break Damage Limit/);
    expect(FALLEN_MAESTERS_META.tip).toMatch(/The End/);
    expect(FALLEN_MAESTERS_META.tip).toMatch(/red and green/);
    expect(x2Concherer.sensorText).toMatch(/twenty thousand/);
    expect(x2Concherer.sensorText).toMatch(/Paine/);
    expect(x2Concherer.sensorText).toMatch(/limit/);
  });

  it('Chac\'s guide line promises no slow-down: the Lv 99 three has learned no Delay move (Warrior\'s Delay Attack and Delay Buster, the Trainer\'s) and no girl has the Warrior learned, so a Change to it teaches nothing', () => {
    expect(x2Chac.sensorText).not.toMatch(/slow/i);
    const learned = fallenMaestersBuild.members.flatMap((m) => Object.values(m.abilitiesLearned ?? {}).flatMap((l) => l.learned));
    expect(learned.length).toBeGreaterThan(0);
    expect(learned.filter((id) => /delay/i.test(id))).toEqual([]);
    for (const m of fallenMaestersBuild.members) expect(Object.keys(m.abilitiesLearned ?? {}), m.id).not.toContain('warrior');
  });
});

describe('the chapter record and its place in the registry', () => {
  it('is hidden: found by getChapter, in EXPERIMENT_CHAPTERS, in neither CHAPTERS nor CHAPTER_IDS (the board stays at nineteen)', () => {
    expect(getChapter(ids.FALLEN_MAESTERS_ID)).toBe(FFX2_FALLEN_MAESTERS);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_FALLEN_MAESTERS);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(ids.FALLEN_MAESTERS_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(ids.FALLEN_MAESTERS_ID)).toBe(false);
    expect(CHAPTERS).toHaveLength(19);
  });

  it('is FFX-2, number 30, experimental, on the Via Infinito\'s own scene, with Aranea\'s floor as its first formation and the Lv 99 party', () => {
    expect(FFX2_FALLEN_MAESTERS).toMatchObject({ id: 'ffx2-fallen-maesters', game: 'ffx2', number: 30, experimental: true, sceneKey: 'via-infinito' });
    expect(FFX2_FALLEN_MAESTERS.enemyGroupRef).toBe(floor20AraneaGroup);
    expect(FFX2_FALLEN_MAESTERS.buildRef).toBe(fallenMaestersBuild);
    expect(Object.keys(FFX2_FALLEN_MAESTERS.sensorTexts).sort()).toEqual([...ids.FALLEN_MAESTERS_BODY_IDS].sort());
    for (const enemy of Object.values(ENEMIES)) expect(FFX2_FALLEN_MAESTERS.sensorTexts[enemy.id], enemy.id).toBe(enemy.sensorText);
  });

  it('plays existing cues only (FM10, a flagged stand-in): the FFX-2 field bed, the aeon cue and the FFX-2 fanfare; the formations ask for the same cue', () => {
    expect(FFX2_FALLEN_MAESTERS.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-ffx2-fallen-aeons', victory: 'victory-ffx2' });
    for (const group of fallenMaestersGroups) expect(group.musicCues, group.id).toEqual([{ at: 'start', track: 'boss-ffx2-fallen-aeons', fadeMs: 800 }]);
  });

  it('has pause metadata (EXP, three objectives, the Via Infinito\'s plate) registered with the unlisted chapters', () => {
    expect(UNLISTED_CHAPTER_META).toContain(FALLEN_MAESTERS_META);
    expect(FALLEN_MAESTERS_META).toMatchObject({ id: ids.FALLEN_MAESTERS_ID, gameLabel: 'FFX-2', numeral: 'EXP', title: FFX2_FALLEN_MAESTERS.title, location: FFX2_FALLEN_MAESTERS.location, blurb: FFX2_FALLEN_MAESTERS.blurb });
    expect(FALLEN_MAESTERS_META.objectives.map((o) => o.rule)).toEqual([{ kind: 'link-reached', link: 2 }, { kind: 'link-reached', link: 4 }, { kind: 'victory' }]);
    expect(FALLEN_MAESTERS_META.musicKeys).toEqual(['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2']);
  });

  it('opens by the typed word on chapter select: one row of the door table, FFX-2', () => {
    expect(MAESTERS_DOOR_WORD).toBe('infinito');
    expect(MAESTERS_DOOR_CHAPTER).toBe(ids.FALLEN_MAESTERS_ID);
    expect(CHAPTER_DOORS.find((d) => d.word === MAESTERS_DOOR_WORD)?.chapter).toBe(ids.FALLEN_MAESTERS_ID);
  });
});
