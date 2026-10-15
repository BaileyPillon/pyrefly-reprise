/**
 * Angra Mainyu, Zarich and Tawrich (FFX-2 Chapter 5, the mission "Showdown in the Sands"; the hidden chapter "Angra Mainyu", number 26, typed word `angra`): the data, pinned. **FFX-2 only** [AGENTS.md rule 14].
 *
 * What this pins, against the game's own rows (`research/re-ffx2-angra-mainyu.md`, `monster.bin` **rows 268, 269 and 270** of the Steam build and the appendix of fifteen move rows, the RE session, 2026-10-14)
 * and the first-source research (`research/ffx2-angra-mainyu.md`: the FF Wiki revisions 4041096, 3573851 and 3573852, and Jegged), whose numbers are in
 * `tests/fixtures/parity/ffx2/angra_mainyu_rows.json` (numbers only; the three rows' 200 raw bytes, decoded here by the note's column map, so the fixture cannot drift from its own bytes):
 *
 * 1. **The rows**: this file decodes the raw bytes itself and checks the enemy data (level, HP, MP, the eight stats, rewards), the attached monster records (Accuracy, the resist bytes, the special word,
 *    the steal byte and gil) and the status table the engine builds from them, row by row.
 * 2. **The research**: every number the wiki shares with the rows equals it; the disagreements (Gravity nulled, Reflect landing on the body, Accuracy and Evasion, the arms' missing defences) are the rows'.
 * 3. **The fifteen move rows**: every field of every record is the appendix's, every ability carries its record, the hit rule of hard rule 5 (Punch alone rolls), the costs, the cadence in seconds.
 * 4. **What is `[inferred]`, in ONE constant**: the arms' permanent immunities (`COMPANION_IMMUNITY`); and the companions' search origin (`COMPANION_SEARCH_ORIGIN`).
 * 5. The group (three bodies, the arms as parts, the formation's slot order), the party (the Chapter V preset, the Experiment's, deep copy), the items, the chapter record and its registration (hidden), the
 *    pause metadata, the story's lint and the guide.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { GROUP1_STATUS, GROUP2_STATUS } from '../../../src/battle/ffx2/adapt/slots.ts';
import { affinityBytes, specialWord } from '../../../src/battle/ffx2/adapt/words.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import {
  ANGRA_ABILITY,
  ANGRA_MAINYU_SCRIPT,
  ANGRA_SCENE,
  ANGRA_UNIT,
  COMPANION_SEARCH_ORIGIN,
  FIRST_POLL_HP_TENTHS,
  FLAME_AT_COUNTER,
  FLAME_OPENING_COUNTER,
  OSMOSE_BELOW_MP,
  ROLL_MODULUS,
  TAWRICH_BREATH_AT_CYCLE,
  TAWRICH_SCENE,
  TAWRICH_SCRIPT,
  ZARICH_GLIMMER_AT_CYCLE,
  ZARICH_GLIMMER_BELOW_MP,
  ZARICH_SCRIPT,
  ZARICH_START_CYCLE,
  ZARICH_START_SPELL_MODULUS,
  x2AngraMainyuScript,
  x2TawrichScript,
  x2ZarichScript,
} from '../../../src/battle/ffx2/ai/angra-mainyu.ts';
import { SCENES, sceneWeights } from '../../../src/battle/ffx2/ai/script-rolls.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import { ffx2AngraMainyuScripts } from '../../../src/story/scripts/ffx2-angra-mainyu.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { ALL_BOSS_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import { ANGRA_MAINYU_LEVEL_BONUS, angraMainyuBuild } from '../../../src/data/ffx2/builds/angra-mainyu.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import {
  ANGRA_MAINYU_ACTION_TIME_ON,
  ANGRA_MAINYU_ACTION_TIME_SECONDS,
  ANGRA_MAINYU_SCRIPT_ID,
  COMPANION_IMMUNITY,
  TAWRICH_SCRIPT_ID,
  ZARICH_SCRIPT_ID,
  angraMainyuGroup,
  x2AngraMainyu,
  x2Tawrich,
  x2Zarich,
} from '../../../src/data/ffx2/enemies/angra-mainyu.ts';
import {
  ANGRA_BIO_ID,
  ANGRA_CURAGA_ID,
  ANGRA_DEMI_ID,
  ANGRA_DISPEL_ID,
  ANGRA_FLARE_ID,
  ANGRA_FULL_LIFE_ID,
  ANGRA_OSMOSE_ID,
  ANGRA_PERDITIONS_FLAME_ID,
  TAWRICH_BLOODY_BREATH_ID,
  TAWRICH_PUNCH_ID,
  ZARICH_GLIMMER_ID,
  ZARICH_SPELL_IDS,
  x2AngraMainyuAbilities,
} from '../../../src/data/ffx2/enemies/angra-mainyu-abilities.ts';
import { MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { heldItems } from '../../../src/data/ffx2/items/held.ts';
import { FFX2_ANGRA_MAINYU, ANGRA_MAINYU_ID } from '../../../src/data/chapter-ffx2-angra-mainyu.ts';
import { ANGRA_MAINYU_BODY_IDS, ANGRA_MAINYU_GROUP_ID, ANGRA_MAINYU_PLATE, ANGRA_MAINYU_SCENE, X2_ANGRA_MAINYU_ID, X2_TAWRICH_ID, X2_ZARICH_ID } from '../../../src/data/angra-mainyu-ids.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { ANGRA_MAINYU_BOSS_IDS } from '../../../src/engine/tactics/ffx2-angra-mainyu.ts';
import { ANGRA_MAINYU_GUIDE_IDS } from '../../../src/data/guides/ffx2-angra-mainyu.ts';

interface Decoded {
  hp: number; mp: number; level: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number;
  special: number; absorb: number; nullElements: number; half: number; weak: number;
  resist1: Record<string, number>; resist2: Record<string, number>; abilities: number[];
  exp: number; gil: number; pilferGil: number; ap: number; dropChanceByte: number; stealChanceByte: number;
  dropItems: number[]; stealItems: number[]; bribeItems: number[]; zantetsuByte: number;
  group2AutoMask: number; group2AutoAmounts: Record<string, number>;
}
interface FixtureRow { name: string; raw: string; decoded: Decoded; unmapped: { basakuWord: number; soundId: number; monsterTypeWord: number; specialBits7to10: number[]; elementBits6and7: number[] } }
interface Fixture {
  rows: Record<string, FixtureRow>;
  notUsed: { monster2: Record<string, { level: number; hp: number; agi: number; oversoulType: number }> };
  research: { angraMainyu: Record<string, unknown>; tawrich: Record<string, unknown>; zarich: Record<string, unknown> };
  disagreements: Array<{ field: string; winner: string }>;
  commandRows: Record<string, { owner: string; move: string; costAtb: number; costCast: number; costMp: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number; critByte: number; accuracy: number; power: number; hits: number; shatter: number; element: number; killer: number }>;
  commandStatuses: Record<string, unknown>;
  script: {
    boss: { flameCounterGainsOnEveryPoll: number; firstPollFlameIfHpAtLeastPercent: number; firstPollFlameSetsCounterTo: number; osmoseBelowMp: number; flameAtCounter: number; rollModulus: number; curagaTargetModulus: number; untouchedFlamePolls: number[] };
    zarich: { startSpellModulus: number; startCycleCounter: number; glimmerAtCycle: number; glimmerBelowMp: number; spellOrder: string[] };
    tawrich: { bloodyBreathAtCycle: number; punchesPerCycle: number };
  };
  scene: { boss: { x: number; z: number }; girls: Array<{ x: number; z: number }>; groundDistance: Record<string, number> };
}

const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx2/angra_mainyu_rows.json', import.meta.url)), 'utf8')) as Fixture;

/** The note's column map (section 3), applied to the 200 raw bytes. */
function decode(raw: Buffer): Decoded {
  const sparse = (o: number): Record<string, number> => Object.fromEntries(Array.from({ length: 24 }, (_, i) => [String(i), raw[o + i]!] as [string, number]).filter(([, v]) => v !== 0));
  const items = (o: number): number[] => [0, 2, 4, 6].map((i) => raw.readUInt16LE(o + i));
  return {
    hp: raw.readUInt32LE(8), mp: raw.readUInt32LE(0xc), level: raw[0x10]!,
    str: raw[0x11]!, def: raw[0x12]!, mag: raw[0x13]!, mdef: raw[0x14]!, agi: raw[0x15]!, acc: raw[0x16]!, eva: raw[0x17]!, luck: raw[0x18]!,
    special: raw.readUInt16LE(0x1a), absorb: raw[0x1c]!, nullElements: raw[0x1d]!, half: raw[0x1e]!, weak: raw[0x1f]!,
    resist1: sparse(0x20), resist2: sparse(0x38),
    abilities: Array.from({ length: 16 }, (_, i) => raw.readUInt16LE(0x70 + i * 2)).filter((v) => v !== 0),
    exp: raw.readUInt32LE(0x9c), gil: raw.readUInt32LE(0xa0), pilferGil: raw.readUInt32LE(0xa4), ap: raw.readUInt16LE(0xa8),
    dropChanceByte: raw[0xaa]!, stealChanceByte: raw[0xab]!,
    dropItems: items(0xac), stealItems: items(0xb4), bribeItems: items(0xbc), zantetsuByte: raw[0xc4]!,
    group2AutoMask: raw.readUInt32LE(0x54), group2AutoAmounts: sparse(0x58),
  };
}

const ROWS = { angra: FIXTURE.rows['268']!, zarich: FIXTURE.rows['269']!, tawrich: FIXTURE.rows['270']! };
const ENEMIES = { angra: x2AngraMainyu, zarich: x2Zarich, tawrich: x2Tawrich };
const RECORD = {
  angra: MONSTER_RECORDS[`${ANGRA_MAINYU_GROUP_ID}/${X2_ANGRA_MAINYU_ID}`]!,
  zarich: MONSTER_RECORDS[`${ANGRA_MAINYU_GROUP_ID}/${X2_ZARICH_ID}`]!,
  tawrich: MONSTER_RECORDS[`${ANGRA_MAINYU_GROUP_ID}/${X2_TAWRICH_ID}`]!,
};
const KEYS = ['angra', 'zarich', 'tawrich'] as const;
const ABILITY = Object.fromEntries(x2AngraMainyuAbilities.map((a) => [a.id, a]));
const hex = (n: number): string => `0x${n.toString(16)}`;

describe('the fixture is the game\'s rows 268, 269 and 270, byte for byte', () => {
  it('is 200 bytes a row, and the decoded block is exactly what the column map reads from them', () => {
    for (const key of KEYS) {
      const raw = Buffer.from(ROWS[key].raw, 'hex');
      expect(raw.length, key).toBe(200);
      expect(decode(raw), key).toEqual(ROWS[key].decoded);
    }
    expect(Object.keys(FIXTURE.rows)).toEqual(['268', '269', '270']);
  });

  it('are Angra Mainyu Lv 47 HP 333,444, Zarich Lv 36 and Tawrich Lv 38 at 5,440 each, MP 9,999 all; the stronger second block of monster2.bin (boss Lv 56, HP 350,116) is on file only as the block NOT used', () => {
    expect(KEYS.map((k) => [ROWS[k].decoded.level, ROWS[k].decoded.hp, ROWS[k].decoded.mp])).toEqual([[47, 333444, 9999], [36, 5440, 9999], [38, 5440, 9999]]);
    expect(FIXTURE.notUsed.monster2['268']).toMatchObject({ level: 56, hp: 350116, agi: 88, oversoulType: 0 });
    for (const row of ['268', '269', '270']) expect(FIXTURE.notUsed.monster2[row]!.oversoulType, `row ${row} Oversoul type 0: nothing says the game reads the second block`).toBe(0);
    for (const key of KEYS) expect(ENEMIES[key].level).not.toBe(FIXTURE.notUsed.monster2[key === 'angra' ? '268' : key === 'zarich' ? '269' : '270']!.level);
    expect(x2AngraMainyu.stats.hp).not.toBe(350116);
  });
});

describe('the enemy data is the rows, and the rows equal the wiki in every shared field', () => {
  it('level, HP, MP and the eight stats are the rows\' (Accuracy 95, Evasion 0, Zarich\'s Defense 0 and Tawrich\'s Magic Defense 0 are the rows\' alone: the wiki gives none of the four)', () => {
    for (const key of KEYS) {
      const row = ROWS[key].decoded;
      const e = ENEMIES[key];
      expect(e.level, key).toBe(row.level);
      expect([e.hp, e.stats.hp, e.stats.maxHp], key).toEqual([row.hp, row.hp, row.hp]);
      expect([e.mp, e.stats.mp, e.stats.maxMp], key).toEqual([row.mp, row.mp, row.mp]);
      expect(e.stats, key).toMatchObject({ str: row.str, def: row.def, mag: row.mag, mdef: row.mdef, agi: row.agi, acc: row.acc, eva: row.eva, luck: row.luck });
      expect(e.forms[0], key).toMatchObject({ hp: row.hp });
    }
    expect(ROWS.zarich.decoded.def).toBe(0);
    expect(ROWS.tawrich.decoded.mdef).toBe(0);
    expect(KEYS.map((k) => [ROWS[k].decoded.acc, ROWS[k].decoded.eva])).toEqual([[95, 0], [95, 0], [95, 0]]);
  });

  it('every field the wiki lists equals the row; the disagreements are the six the fixture names, and the row wins each', () => {
    const w = FIXTURE.research;
    const a = ROWS.angra.decoded;
    expect({ level: a.level, hp: a.hp, mp: a.mp, str: a.str, mag: a.mag, def: a.def, mdef: a.mdef, agi: a.agi, luck: a.luck, exp: a.exp, ap: a.ap, gil: a.gil, pilferGil: a.pilferGil, zantetsu: a.zantetsuByte }).toEqual({
      level: w.angraMainyu['level'], hp: w.angraMainyu['hp'], mp: w.angraMainyu['mp'], str: w.angraMainyu['str'], mag: w.angraMainyu['mag'], def: w.angraMainyu['def'], mdef: w.angraMainyu['mdef'], agi: w.angraMainyu['agi'], luck: w.angraMainyu['luck'], exp: w.angraMainyu['exp'], ap: w.angraMainyu['ap'], gil: w.angraMainyu['gil'], pilferGil: w.angraMainyu['pilferGil'], zantetsu: w.angraMainyu['zantetsu'],
    });
    const t = ROWS.tawrich.decoded;
    expect({ level: t.level, hp: t.hp, str: t.str, mag: t.mag, def: t.def, agi: t.agi, luck: t.luck }).toEqual({ level: w.tawrich['level'], hp: w.tawrich['hp'], str: w.tawrich['str'], mag: w.tawrich['mag'], def: w.tawrich['def'], agi: w.tawrich['agi'], luck: w.tawrich['luck'] });
    const z = ROWS.zarich.decoded;
    expect({ level: z.level, hp: z.hp, str: z.str, mag: z.mag, mdef: z.mdef, agi: z.agi, luck: z.luck }).toEqual({ level: w.zarich['level'], hp: w.zarich['hp'], str: w.zarich['str'], mag: w.zarich['mag'], mdef: w.zarich['mdef'], agi: w.zarich['agi'], luck: w.zarich['luck'] });
    expect(FIXTURE.disagreements.map((d) => d.field)).toEqual([
      'gravity (Angra Mainyu)', 'gravity (Tawrich)', 'reflect (Angra Mainyu)', 'accuracy and evasion (all three)', "Zarich's defense", "Tawrich's magic defense", "the arms' rewards",
    ]);
    expect(FIXTURE.disagreements.filter((d) => d.winner === 'row')).toHaveLength(6);
  });

  it('only the body pays: EXP 5,000, AP 30, Gil 5,000, Pilfer Gil 2,000, Ribbon x1 (both slots, chance 255), Megalixir x1 (both slots, steal byte 255); the arms\' bytes are all 0', () => {
    const rw = x2AngraMainyu.rewards;
    const row = ROWS.angra.decoded;
    expect([rw.exp, rw.ap, rw.apOverkill, rw.gil, rw.stolenGil]).toEqual([row.exp, row.ap, row.ap, row.gil, row.pilferGil]);
    expect([row.exp, row.ap, row.gil, row.pilferGil]).toEqual([5000, 30, 5000, 2000]);
    expect(rw.drops).toEqual([{ itemId: 'ribbon', count: 1 }]);
    expect(row.dropItems).toEqual([0x9056, 1, 0x9056, 1]); // Ribbon, common and rare
    expect(row.dropChanceByte).toBe(255);
    expect(rw.steal?.common).toEqual({ itemId: 'x2-megalixir', count: 1 });
    expect(rw.steal?.rare).toEqual({ itemId: 'x2-megalixir', count: 1 });
    expect(row.stealItems).toEqual([0x2009, 1, 0x2009, 1]); // Megalixir, common and rare
    expect(rw.steal?.stealRate).toBe(row.stealChanceByte);
    expect(row.stealChanceByte).toBe(255);
    for (const key of ['zarich', 'tawrich'] as const) {
      const d = ROWS[key].decoded;
      expect([d.exp, d.ap, d.gil, d.pilferGil, d.dropChanceByte, d.stealChanceByte, ...d.dropItems, ...d.stealItems], key).toEqual(new Array(14).fill(0));
      expect(ENEMIES[key].rewards, key).toEqual({ ap: 0, apOverkill: 0, gil: 0, exp: 0, overkillThreshold: 0, drops: [] });
    }
  });

  it('the drop and steal items have rows (Ribbon held-only, Megalixir a recovery item), and no Bribe slot exists', () => {
    const ribbon = heldItems.find((i) => i.id === 'ribbon')!;
    expect(ribbon).toBeDefined();
    expect(ribbon.usableInBattle).toBe(false);
    expect(data.ITEMS['ribbon']?.name).toBe('Ribbon');
    expect(data.ITEMS['x2-megalixir']?.name).toBe('Megalixir');
    for (const key of KEYS) expect(ROWS[key].decoded.bribeItems, key).toEqual([0, 0, 0, 0]);
    expect(x2AngraMainyu.rewards.bribe).toBeUndefined();
  });
});

describe('the elements: Gravity is nulled on all three (the rows), Zarich halves Fire, Ice, Thunder, Water and Holy', () => {
  it('the bytes are 0x10 null on all three, and 0x2f half on Zarich alone', () => {
    expect(KEYS.map((k) => [ROWS[k].decoded.absorb, ROWS[k].decoded.nullElements, ROWS[k].decoded.half, ROWS[k].decoded.weak])).toEqual([[0, 0x10, 0, 0], [0, 0x10, 0x2f, 0], [0, 0x10, 0, 0]]);
    expect(x2AngraMainyu.affinities).toEqual({ gravity: 'immune' });
    expect(x2Tawrich.affinities).toEqual({ gravity: 'immune' });
    expect(x2Zarich.affinities).toEqual({ gravity: 'immune', fire: 'resist', ice: 'resist', lightning: 'resist', water: 'resist', holy: 'resist' });
  });

  it('the engine builds the same bytes from the data', () => {
    for (const key of KEYS) {
      const unit = aiUnit(ENEMIES[key].id, 'enemy', ROWS[key].decoded.hp, 0);
      unit.affinities = { ...ENEMIES[key].affinities };
      expect(affinityBytes(unit), key).toMatchObject({ absorb: 0, nullify: 0x10, half: ROWS[key].decoded.half, weak: 0 });
    }
  });
});

describe('the monster records are the rows, and the engine\'s status table is built from them', () => {
  it('carry Accuracy, the special word 0x7c3, Zantetsu 255, the steal byte and gil, the steal items and no Bribe slot, and none a plain Attack (no list has 0x41da)', () => {
    for (const key of KEYS) {
      const row = ROWS[key].decoded;
      expect(RECORD[key], key).toBeDefined();
      expect(RECORD[key], key).toMatchObject({ table: 1, acc: row.acc, special: row.special, species: 0, zantetsu: row.zantetsuByte, stealByte: row.stealChanceByte, stealGil: row.pilferGil, steal: row.stealItems, bribe: [0, 0, 0, 0] });
      expect(RECORD[key]!.plainAttack, key).toBeUndefined();
      expect(row.abilities, key).not.toContain(0x41da);
      expect(ENEMIES[key].ffx2Record, key).toBe(RECORD[key]);
      expect(specialWord(Object.assign(aiUnit(ENEMIES[key].id, 'enemy', row.hp, 0), { enemy: { ...ENEMIES[key], formIndex: 0 } }) as never), key).toBe(0x7c3);
    }
    expect([RECORD.angra.row, RECORD.zarich.row, RECORD.tawrich.row]).toEqual([268, 269, 270]);
    expect(ROWS.angra.decoded.special).toBe(0x7c3);
  });

  it('the resist bytes are the rows\', slot by slot, slots 17 and 18 (Itchy, Auto-Life) included; Reflect (group 2, slot 2) is 255 on the two arms and reads 0 on the body', () => {
    for (const key of KEYS) {
      const row = ROWS[key].decoded;
      expect(RECORD[key]!.resist1, key).toEqual(Object.fromEntries(Object.entries(row.resist1).map(([k, v]) => [Number(k), v])));
      expect(RECORD[key]!.resist2, key).toEqual(Object.fromEntries(Object.entries(row.resist2).map(([k, v]) => [Number(k), v])));
      expect(Object.keys(row.resist1).map(Number).sort((a, b) => a - b), key).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 17, 18]);
    }
    expect(Object.keys(ROWS.angra.decoded.resist2).map(Number)).toEqual([5, 6, 9, 10, 14]); // Slow, Stop, the Defense and Magic Defense stages, Doom
    expect(Object.keys(ROWS.zarich.decoded.resist2).map(Number)).toEqual([2, 5, 6, 9, 10, 14]); // and Reflect
    expect(Object.keys(ROWS.tawrich.decoded.resist2).map(Number)).toEqual([2, 5, 6, 9, 10, 14]);
  });

  it('after the attach, each enemy is immune to exactly the statuses the row nulls at the slots the engine has, plus Delay (special bit 6) and Interrupt (bits 7 to 10); Reflect lands on the body; Shell, Protect, Regen and Haste land everywhere', () => {
    for (const key of KEYS) {
      const expected = new Set<string>(['delay-effect', 'action-cancel']);
      for (const [slot, byte] of Object.entries(ROWS[key].decoded.resist1)) {
        const status = GROUP1_STATUS[Number(slot)];
        if (status !== null && status !== undefined && byte === 255) expected.add(status);
      }
      for (const [slot, byte] of Object.entries(ROWS[key].decoded.resist2)) for (const status of GROUP2_STATUS[Number(slot)] ?? []) if (byte === 255) expected.add(status);
      const immune = new Set(Object.entries(ENEMIES[key].immunities).filter(([, v]) => v === 255).map(([k]) => k));
      expect([...immune].sort(), key).toEqual([...expected].sort());
      for (const status of ['itchy', 'auto-life', 'action-cancel', 'slow', 'stop', 'doom', 'def-down', 'mdef-down']) expect(immune.has(status), `${key} ${status}`).toBe(true);
      for (const lands of ['shell', 'protect', 'haste', 'regen', 'str-down', 'mag-down']) expect(immune.has(lands), `${key} ${lands} lands`).toBe(false);
      expect(immune.has('reflect'), `${key} reflect`).toBe(key !== 'angra');
      expect(ENEMIES[key].immunityFlags.includes('immune-to-percentage-damage'), key).toBe(true);
      expect(ENEMIES[key].immunityFlags.includes('immune-to-delay'), key).toBe(true);
      expect(ENEMIES[key].immunityFlags.includes('immune-to-bribe'), key).toBe(true);
    }
  });
});

describe('the arms\' permanent immunities: ONE inferred constant, from the rows\' automatic statuses (group 2, slots 15 and 16, amount 127)', () => {
  it('the rows give Zarich slot 15 and Tawrich slot 16 with the amount 127, and the body none', () => {
    expect([ROWS.angra.decoded.group2AutoMask, ROWS.zarich.decoded.group2AutoMask, ROWS.tawrich.decoded.group2AutoMask]).toEqual([0, 0x8000, 0x10000]);
    expect(ROWS.zarich.decoded.group2AutoAmounts).toEqual({ '15': 127 });
    expect(ROWS.tawrich.decoded.group2AutoAmounts).toEqual({ '16': 127 });
    expect([...GROUP2_STATUS[15]!]).toEqual(['null-physical']);
    expect([...GROUP2_STATUS[16]!]).toEqual(['null-magic']);
  });

  it('`COMPANION_IMMUNITY` is the one place: Zarich is Null Physical (slot 15) and Tawrich Null Magic (slot 16); the enemies take their `autoStatuses` from it; the body has none', () => {
    expect(COMPANION_IMMUNITY).toEqual({ zarich: 'null-physical', tawrich: 'null-magic' });
    expect(x2Zarich.autoStatuses).toEqual([COMPANION_IMMUNITY.zarich]);
    expect(x2Tawrich.autoStatuses).toEqual([COMPANION_IMMUNITY.tawrich]);
    expect(x2AngraMainyu.autoStatuses).toBeUndefined();
    // The slot readings agree with the statuses: group 2 slot 15 is where Null Physical lives, 16 where Null Magic does.
    expect(GROUP2_STATUS[15]).toContain(COMPANION_IMMUNITY.zarich);
    expect(GROUP2_STATUS[16]).toContain(COMPANION_IMMUNITY.tawrich);
  });
});

describe('the abilities: ids, lists, the fifteen rows, the hit rule', () => {
  const recordOf = (id: string) => FFX2_COMMAND_RECORDS[id]!;

  it('the ids are the data\'s and the AI\'s in both layers, the shipped table holds every one, and none is an FFX id', () => {
    expect(ANGRA_ABILITY).toEqual({
      flame: ANGRA_PERDITIONS_FLAME_ID, osmose: ANGRA_OSMOSE_ID, fullLife: ANGRA_FULL_LIFE_ID, curaga: ANGRA_CURAGA_ID, bio: ANGRA_BIO_ID, demi: ANGRA_DEMI_ID, dispel: ANGRA_DISPEL_ID, flare: ANGRA_FLARE_ID,
      glimmer: ZARICH_GLIMMER_ID, firaga: ZARICH_SPELL_IDS[0], waterga: ZARICH_SPELL_IDS[1], thundaga: ZARICH_SPELL_IDS[2], blizzaga: ZARICH_SPELL_IDS[3], punch: TAWRICH_PUNCH_ID, bloodyBreath: TAWRICH_BLOODY_BREATH_ID,
    });
    expect(ANGRA_UNIT).toEqual({ angra: X2_ANGRA_MAINYU_ID, zarich: X2_ZARICH_ID, tawrich: X2_TAWRICH_ID });
    expect([ANGRA_MAINYU_SCRIPT, ZARICH_SCRIPT, TAWRICH_SCRIPT]).toEqual([ANGRA_MAINYU_SCRIPT_ID, ZARICH_SCRIPT_ID, TAWRICH_SCRIPT_ID]);
    expect([x2AngraMainyu.aiScriptId, x2Zarich.aiScriptId, x2Tawrich.aiScriptId]).toEqual([ANGRA_MAINYU_SCRIPT, ZARICH_SCRIPT, TAWRICH_SCRIPT]);
    expect([aiScriptFor(ANGRA_MAINYU_SCRIPT), aiScriptFor(ZARICH_SCRIPT), aiScriptFor(TAWRICH_SCRIPT)]).toEqual([x2AngraMainyuScript, x2ZarichScript, x2TawrichScript]);
    expect(x2AngraMainyuAbilities).toHaveLength(15);
    for (const a of x2AngraMainyuAbilities) {
      expect(ALL_BOSS_ABILITIES.find((x) => x.id === a.id), a.id).toBe(a);
      expect(data.ABILITIES[a.id], a.id).toBeDefined();
      expect(/^x2-(angra|zarich|tawrich)-/.test(a.id), a.id).toBe(true);
    }
    expect(ENEMY_GROUPS_BY_ID[ANGRA_MAINYU_GROUP_ID]).toBe(angraMainyuGroup);
  });

  it('each enemy\'s list is the row\'s list less what is no part of the full fight: the boss\'s Unnatural Selection (0x412c) and Die (0x412e), Zarich\'s four -ra spells (level 3 only)', () => {
    const idsOf = (abilityIds: readonly string[]): number[] => abilityIds.map((id) => recordOf(id).id).sort((a, b) => a - b);
    const rowList = (key: (typeof KEYS)[number]): number[] => [...ROWS[key].decoded.abilities].sort((a, b) => a - b);
    expect(idsOf(x2AngraMainyu.abilityIds)).toEqual(rowList('angra').filter((id) => id !== 0x412c && id !== 0x412e));
    expect(idsOf(x2Zarich.abilityIds)).toEqual(rowList('zarich').filter((id) => ![0x41ed, 0x41ee, 0x41ef, 0x41f0].includes(id)));
    expect(idsOf(x2Tawrich.abilityIds)).toEqual(rowList('tawrich'));
    expect(ROWS.angra.decoded.abilities).toEqual([0x412c, 0x412d, 0x412e, 0x406d, 0x30ba, 0x3082, 0x3085, 0x30b5, 0x30b8, 0x3170]);
    expect(ROWS.zarich.decoded.abilities).toEqual([0x412a, 0x41ed, 0x41f0, 0x41ef, 0x41ee, 0x41f1, 0x41f4, 0x41f3, 0x41f2]);
    expect(ROWS.tawrich.decoded.abilities).toEqual([0x4129, 0x412b]);
    expect(x2Zarich.abilityIds).toEqual([ZARICH_GLIMMER_ID, ...ZARICH_SPELL_IDS]);
  });

  it('every ability runs on its game row: the record is the appendix\'s, field by field, and the ability carries the very record the table serves; the cost in MP is the row\'s', () => {
    for (const a of x2AngraMainyuAbilities) {
      const record = recordOf(a.id);
      expect(record, a.id).toBeDefined();
      const want = FIXTURE.commandRows[hex(record.id)]!;
      expect(want, `${a.id} ${hex(record.id)} is in the appendix`).toBeDefined();
      expect(record, a.id).toMatchObject({
        id: record.id, costAtb: want.costAtb, costCast: want.costCast, flagsTarget: want.flagsTarget, flagsMisc: want.flagsMisc, flagsDamage: want.flagsDamage, damageClass: want.damageClass, formula: want.formula,
        critByte: want.critByte, accuracy: want.accuracy, power: want.power, hits: want.hits, shatter: want.shatter, element: want.element, killer: want.killer,
      });
      expect(a.ffx2Record, a.id).toBe(record);
      expect(a.mpCost, a.id).toBe(want.costMp);
    }
    expect(Object.keys(FIXTURE.commandRows)).toHaveLength(21); // the appendix: the two rows not built (0x412c, 0x412e) and the four -ra spells are in it, and tested only as numbers
    expect(FIXTURE.commandRows['0x412c']!.move).toBe('Unnatural Selection');
  });

  it('the statuses each row carries are the note\'s: Bio Poison 100, Full-Life clears Death at 254, Glimmer of Despair STR, MAG, DEF and MDEF at 255 with steps -1, -1, -2, -2, Bloody Breath Silence, Darkness, Poison 254 and Confusion 128', () => {
    expect(recordOf(ANGRA_BIO_ID).status1).toEqual({ 5: 100 });
    expect(recordOf(ANGRA_FULL_LIFE_ID).status1).toEqual({ 0: 254 });
    expect(recordOf(ZARICH_GLIMMER_ID).status2).toEqual({ 7: 255, 8: 255, 9: 255, 10: 255 });
    expect(recordOf(ZARICH_GLIMMER_ID).statusTime).toEqual({ 7: -1, 8: -1, 9: -2, 10: -2 });
    expect(recordOf(TAWRICH_BLOODY_BREATH_ID).status1).toEqual({ 3: 254, 4: 254, 5: 254, 6: 128 });
    expect(Object.keys(recordOf(ANGRA_DISPEL_ID).status2 ?? {}).map(Number)).toEqual([0, 1, 2, 3, 4]); // Shell, Protect, Reflect, Regen, Haste
    // The abilities say the same in their own words.
    expect(ABILITY[ANGRA_BIO_ID]!.statusEffects).toEqual([{ status: 'poison', chance: 100, duration: 0 }]);
    expect(ABILITY[TAWRICH_BLOODY_BREATH_ID]!.statusEffects.map((s) => [s.status, s.chance])).toEqual([['silence', 254], ['darkness', 254], ['poison', 254], ['confuse', 128]]);
    expect(ABILITY[ZARICH_GLIMMER_ID]!.statusEffects.map((s) => [s.status, s.stacks])).toEqual([['str-down', 1], ['mag-down', 1], ['def-down', 2], ['mdef-down', 2]]);
  });

  it('Perdition\'s Flame is ten hits on random girls at 3/16 of maximum HP, physical (Protect halves it, Shell does not), and rolls to hit never; Osmose is the MP class, formula 4, power 3, absorbed, on the whole party', () => {
    const flame = ABILITY[ANGRA_PERDITIONS_FLAME_ID]!;
    expect(flame).toMatchObject({ power: 3, hits: 10, formula: 'percent-total', damageType: 'physical', targeting: 'random-enemy' });
    const fr = recordOf(ANGRA_PERDITIONS_FLAME_ID);
    expect([fr.hits, fr.formula, fr.power, fr.flagsDamage & 3, fr.damageClass, (fr.flagsMisc & 0x4000) !== 0]).toEqual([10, 7, 3, 1, 1, true]); // the random-target bit
    const osmose = ABILITY[ANGRA_OSMOSE_ID]!;
    expect(osmose).toMatchObject({ targeting: 'all-enemies', flags: ['drains-mp'] });
    expect(osmose.extra).toMatchObject({ mpOnly: true });
    const or = recordOf(ANGRA_OSMOSE_ID);
    expect([or.damageClass, or.formula, or.power, (or.flagsMisc & 0x100) !== 0]).toEqual([2, 4, 3, true]); // the absorb bit
    expect(or.id, 'the same row the Leblanc Syndicate\'s Osmose runs on').toBe(recordOf('x2-leblanc-osmose').id);
  });

  it('the types the rows say: Demi (Gravity, formula 4, power 4), Flare (formula 2, power 55) and the Ga spells are magical; **Bloody Breath and Glimmer of Despair are neither physical nor magical** (damage flags 0: Shell and Protect do not reduce them)', () => {
    expect(recordOf(ANGRA_DEMI_ID)).toMatchObject({ element: 0x10, formula: 4, power: 4 });
    expect(recordOf(ANGRA_FLARE_ID)).toMatchObject({ formula: 2, power: 55, shatter: 100 });
    for (const id of [ANGRA_DEMI_ID, ANGRA_FLARE_ID, ...ZARICH_SPELL_IDS]) expect(recordOf(id).flagsDamage & 3, id).toBe(2);
    for (const id of [TAWRICH_BLOODY_BREATH_ID, ZARICH_GLIMMER_ID]) expect(recordOf(id).flagsDamage & 3, id).toBe(0);
    expect(ABILITY[TAWRICH_BLOODY_BREATH_ID]!.damageType).toBe('other');
    expect(ABILITY[ZARICH_GLIMMER_ID]!.damageType).toBe('other');
    expect(recordOf(ZARICH_GLIMMER_ID).damageClass, 'class 2 is the MP pool').toBe(2);
    expect(ZARICH_SPELL_IDS.map((id) => recordOf(id).element)).toEqual([0x1, 0x8, 0x4, 0x2]); // Fire, Water, Thunder, Ice
  });

  it('hard rule 5: Punch is the ONLY move that rolls to hit (accuracy formula 1, byte 125); every other ability is `canMiss: false`, set explicitly, and its row\'s accuracy formula is 0', () => {
    const punch = recordOf(TAWRICH_PUNCH_ID);
    expect([(punch.flagsMisc >> 3) & 7, punch.accuracy]).toEqual([1, 125]);
    expect(ABILITY[TAWRICH_PUNCH_ID]!.canMiss).toBe(true);
    for (const a of x2AngraMainyuAbilities) {
      if (a.id === TAWRICH_PUNCH_ID) continue;
      expect(a.canMiss, `${a.id}: set explicitly, never left unset`).toBe(false);
      expect((recordOf(a.id).flagsMisc >> 3) & 7, `${a.id}: accuracy formula 0, it never rolls`).toBe(0);
    }
    expect(x2AngraMainyuAbilities.filter((a) => a.canMiss !== false).map((a) => a.id)).toEqual([TAWRICH_PUNCH_ID]);
  });

  it('the cadence is the note\'s §9.11, from the costs and each body\'s Agility: the body (AGI 68) Flare and Full-Life charge 5.11 s, Demi and Bio 4.10, Osmose 4.60, Dispel and Curaga 3.07, the Flame 6.14 with a rest of 5.11; Zarich (82) Glimmer 5.11 and 3.40, a Ga spell 2.97; Tawrich (113) Punch 0.63 and 2.47, Bloody Breath 3.70 and 2.47', () => {
    const seconds = (cost: number, agi: number): number => Math.round((Math.ceil((cost * 10000) / (agi + 1) / 95) / 29.97) * 100) / 100;
    const at = (id: string, agi: number): { charge: number; rest: number } => ({ charge: seconds(recordOf(id).costCast ?? 0, agi), rest: seconds(recordOf(id).costAtb ?? 0, agi) });
    expect(at(ANGRA_FLARE_ID, 68)).toEqual({ charge: 5.11, rest: 0 });
    expect(at(ANGRA_FULL_LIFE_ID, 68)).toEqual({ charge: 5.11, rest: 0 });
    expect(at(ANGRA_DEMI_ID, 68)).toEqual({ charge: 4.1, rest: 0 });
    expect(at(ANGRA_BIO_ID, 68)).toEqual({ charge: 4.1, rest: 0 });
    expect(at(ANGRA_OSMOSE_ID, 68)).toEqual({ charge: 4.6, rest: 0 });
    expect(at(ANGRA_DISPEL_ID, 68)).toEqual({ charge: 3.07, rest: 0 });
    expect(at(ANGRA_CURAGA_ID, 68)).toEqual({ charge: 3.07, rest: 0 });
    expect(at(ANGRA_PERDITIONS_FLAME_ID, 68)).toEqual({ charge: 6.14, rest: 5.11 });
    expect(at(ZARICH_GLIMMER_ID, 82)).toEqual({ charge: 5.11, rest: 3.4 });
    for (const id of ZARICH_SPELL_IDS) expect(at(id, 82), id).toEqual({ charge: 2.97, rest: 0 });
    expect(at(TAWRICH_PUNCH_ID, 113)).toEqual({ charge: 0.63, rest: 2.47 });
    expect(at(TAWRICH_BLOODY_BREATH_ID, 113)).toEqual({ charge: 3.7, rest: 2.47 });
  });

  it('the MP the moves cost are the rows\' and the bodies pay them from their own 9,999: Full-Life 60, Curaga 20, Bio 16, Demi 10, Dispel 12, Flare 54, a Ga spell 24; Flame, Osmose, Glimmer, Punch and Breath cost none', () => {
    expect([ANGRA_FULL_LIFE_ID, ANGRA_CURAGA_ID, ANGRA_BIO_ID, ANGRA_DEMI_ID, ANGRA_DISPEL_ID, ANGRA_FLARE_ID].map((id) => ABILITY[id]!.mpCost)).toEqual([60, 20, 16, 10, 12, 54]);
    for (const id of ZARICH_SPELL_IDS) expect(ABILITY[id]!.mpCost, id).toBe(24);
    for (const id of [ANGRA_PERDITIONS_FLAME_ID, ANGRA_OSMOSE_ID, ZARICH_GLIMMER_ID, TAWRICH_PUNCH_ID, TAWRICH_BLOODY_BREATH_ID]) expect(ABILITY[id]!.mpCost, id).toBe(0);
  });
});

describe('the scene and the scripts are the RE note\'s (m268, m269, m270; pos_bika*_229; the fixture carries the numbers)', () => {
  it('the start positions are the fixture\'s: the body at (-45, -13), Yuna (23, 29), Rikku (33, 11), Paine (32, -9); the ground distances are 79.93, 81.61 and 77.10', () => {
    expect(SCENES.angra.boss).toEqual(FIXTURE.scene.boss);
    expect(SCENES.angra.girls).toEqual(FIXTURE.scene.girls);
    expect(ANGRA_SCENE).toBe(SCENES.angra);
    const distance = (g: { x: number; z: number }): number => Math.round(Math.hypot(g.x - SCENES.angra.boss.x, g.z - SCENES.angra.boss.z) * 100) / 100;
    // The note prints Yuna's 79.93; the arithmetic is 79.925 (sqrt of 6,388), so the check is to the note's own precision.
    const want = [FIXTURE.scene.groundDistance['yuna']!, FIXTURE.scene.groundDistance['rikku']!, FIXTURE.scene.groundDistance['paine']!];
    SCENES.angra.girls.map(distance).forEach((d, i) => expect(Math.abs(d - want[i]!), `girl ${i}`).toBeLessThanOrEqual(0.011));
  });

  it('the near-weighted weights at the start (the body facing the middle of the party) are the note\'s §8.3: 269, 391 and 278 (Yuna 28.8, Rikku 41.7, Paine 29.5 percent)', () => {
    const weights = sceneWeights(ANGRA_SCENE, [0, 1, 2]);
    expect(weights).toEqual([269, 391, 278]);
    const total = weights.reduce((s, w) => s + w, 0);
    // The weights are the note's exactly; its printed shares (28.8, 41.7, 29.5) are within 0.15 of the weights over their total (28.7, 41.7, 29.6).
    const share = weights.map((w) => (w / total) * 100);
    [28.8, 41.7, 29.5].forEach((want, i) => expect(Math.abs(share[i]! - want), `share ${i}`).toBeLessThanOrEqual(0.15));
  });

  it('**`[inferred]`** Tawrich\'s Punch is searched from the BODY\'s spot, one constant (the rows give both arms (0, 0) and the body\'s script links them to its model): the same weights', () => {
    expect(COMPANION_SEARCH_ORIGIN).toBe(SCENES.angra.boss);
    expect(TAWRICH_SCENE.boss).toEqual(FIXTURE.scene.boss);
    expect(TAWRICH_SCENE.girls).toBe(SCENES.angra.girls);
    expect(sceneWeights(TAWRICH_SCENE, [0, 1, 2])).toEqual(sceneWeights(ANGRA_SCENE, [0, 1, 2]));
  });

  it('the constants are the fixture\'s: the body\'s Flame counter 15 and opening 8 (HP at least 80 percent), Osmose below 200 MP, one roll of five, Curaga by a second draw of two; Zarich\'s draw of four, cycle 10 and 7, Glimmer below 100 MP; Tawrich\'s eight-poll cycle', () => {
    const b = FIXTURE.script.boss;
    expect([FLAME_AT_COUNTER, FLAME_OPENING_COUNTER, FIRST_POLL_HP_TENTHS * 10, OSMOSE_BELOW_MP, ROLL_MODULUS]).toEqual([b.flameAtCounter, b.firstPollFlameSetsCounterTo, b.firstPollFlameIfHpAtLeastPercent, b.osmoseBelowMp, b.rollModulus]);
    expect(b.curagaTargetModulus).toBe(2);
    expect(b.untouchedFlamePolls).toEqual([1, 8, 23, 38, 53]);
    const z = FIXTURE.script.zarich;
    expect([ZARICH_START_SPELL_MODULUS, ZARICH_START_CYCLE, ZARICH_GLIMMER_AT_CYCLE, ZARICH_GLIMMER_BELOW_MP]).toEqual([z.startSpellModulus, z.startCycleCounter, z.glimmerAtCycle, z.glimmerBelowMp]);
    expect(z.spellOrder).toEqual(['firaga', 'waterga', 'thundaga', 'blizzaga']);
    expect(TAWRICH_BREATH_AT_CYCLE).toBe(FIXTURE.script.tawrich.bloodyBreathAtCycle);
    expect(FIXTURE.script.tawrich.punchesPerCycle).toBe(TAWRICH_BREATH_AT_CYCLE - 1);
    for (const script of [x2AngraMainyuScript, x2ZarichScript, x2TawrichScript]) {
      expect(script.onDamaged, `${script.id}: nothing reacts to a hit`).toBeUndefined();
      expect(script.onResult, script.id).toBeUndefined();
      expect(script.onTargeted, script.id).toBeUndefined();
      expect(script.onTurnResolved, `${script.id}: no clock hook`).toBeUndefined();
    }
  });
});

describe('the group, the party and the chapter', () => {
  it('is one formation that cannot be fled: the body, with Tawrich and Zarich as its parts (slots 0, 1, 2, the game\'s order body, Tawrich, Zarich), on our own aeon cue, action time on at 3 s, kept by precedent, awaiting Bailey\'s pick', () => {
    expect(angraMainyuGroup).toMatchObject({ id: ANGRA_MAINYU_GROUP_ID, game: 'ffx2', canEscape: false });
    expect(angraMainyuGroup.enemies).toEqual([x2AngraMainyu]);
    expect(angraMainyuGroup.parts).toEqual([x2Tawrich, x2Zarich]);
    expect([x2AngraMainyu.slot, x2Tawrich.slot, x2Zarich.slot]).toEqual([0, 1, 2]);
    expect(x2Tawrich.flags).toEqual({ isPart: true, partOf: X2_ANGRA_MAINYU_ID });
    expect(x2Zarich.flags).toEqual({ isPart: true, partOf: X2_ANGRA_MAINYU_ID });
    expect(x2AngraMainyu.flags).toMatchObject({ isBoss: true });
    expect(angraMainyuGroup.musicCues).toEqual([{ at: 'start', track: 'boss-ffx2-fallen-aeons', fadeMs: 800 }]);
    expect(ANGRA_MAINYU_ACTION_TIME_ON).toBe(true);
    expect(angraMainyuGroup.actionTimeSeconds).toBe(ANGRA_MAINYU_ACTION_TIME_SECONDS);
    expect(ANGRA_MAINYU_ACTION_TIME_SECONDS).toBe(3);
    expect([...ANGRA_MAINYU_BODY_IDS]).toEqual([X2_ANGRA_MAINYU_ID, X2_ZARICH_ID, X2_TAWRICH_ID]);
  });

  it('the party is the Chapter V preset (the Experiment\'s, the nearest chapter in story order): Yuna 46 White Mage, Rikku 48 and Paine 50 Dark Knights, a deep copy; no level is raised (the option is OFF)', () => {
    expect(ANGRA_MAINYU_LEVEL_BONUS).toBe(0);
    expect(angraMainyuBuild.members.map((m) => [m.id, m.level, m.currentDressphere])).toEqual([['yuna', 46, 'white-mage'], ['rikku', 48, 'dark-knight'], ['paine', 50, 'dark-knight']]);
    expect(angraMainyuBuild).toEqual(farplaneBuild);
    expect(angraMainyuBuild).not.toBe(farplaneBuild);
    expect(angraMainyuBuild.members[0]).not.toBe(farplaneBuild.members[0]);
    expect(FFX2_ANGRA_MAINYU.buildRef).toBe(angraMainyuBuild);
  });

  it('is hidden: in neither CHAPTERS nor CHAPTER_IDS, found by getChapter, number 26, experimental, FFX-2, on the desert plate\'s scene', () => {
    expect(ANGRA_MAINYU_ID).toBe('ffx2-angra-mainyu');
    expect(getChapter(ANGRA_MAINYU_ID)).toBe(FFX2_ANGRA_MAINYU);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_ANGRA_MAINYU);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(ANGRA_MAINYU_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(ANGRA_MAINYU_ID)).toBe(false);
    expect(CHAPTERS).toHaveLength(18);
    expect(FFX2_ANGRA_MAINYU).toMatchObject({ game: 'ffx2', number: 26, experimental: true, sceneKey: ANGRA_MAINYU_SCENE, title: 'Angra Mainyu' });
    expect(ANGRA_MAINYU_PLATE).toBe('bikanel-desert-provisional');
    expect(FFX2_ANGRA_MAINYU.enemyGroupRef).toBe(angraMainyuGroup);
    expect(FFX2_ANGRA_MAINYU.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-ffx2-fallen-aeons', victory: 'victory-ffx2' });
    expect(FFX2_ANGRA_MAINYU.sensorTexts[X2_ANGRA_MAINYU_ID]).toBe(x2AngraMainyu.sensorText);
    expect(FFX2_ANGRA_MAINYU.sensorTexts[X2_ZARICH_ID]).toBe(x2Zarich.sensorText);
    expect(FFX2_ANGRA_MAINYU.sensorTexts[X2_TAWRICH_ID]).toBe(x2Tawrich.sensorText);
  });

  it('the pause metadata exists, says EXP, and its objectives are the lesson, the arms and the win', () => {
    const meta = getChapterMeta(ANGRA_MAINYU_ID);
    expect(meta).toBeDefined();
    expect(meta).toMatchObject({ gameLabel: 'FFX-2', numeral: 'EXP', title: 'Angra Mainyu', focalCharacterId: 'rikku' });
    expect(meta!.objectives.map((o) => o.rule)).toEqual([
      { kind: 'survived-ability', ability: ANGRA_PERDITIONS_FLAME_ID },
      { kind: 'parts-downed', targetIds: [X2_ZARICH_ID, X2_TAWRICH_ID] },
      { kind: 'victory' },
    ]);
    expect(meta!.musicKeys).toEqual(['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2']);
  });

  it('the story is lint-clean, pre ends in the battle and post holds the results; each callout names one of the bodies\' real moves', () => {
    const s = ffx2AngraMainyuScripts;
    for (const script of [s.pre, s.post, ...Object.values(s.midScripts)]) expect(lintScript(script)).toEqual([]);
    expect(s.pre.at(-1)).toMatchObject({ type: 'battleStart' });
    expect(s.post.some((step) => step.type === 'results')).toBe(true);
    const abilities = new Set<string>(Object.values(ANGRA_ABILITY));
    const units = new Set<string>(Object.values(ANGRA_UNIT));
    for (const trigger of s.mid) {
      expect(trigger.when).toMatchObject({ type: 'ability-used' });
      expect(units.has((trigger.when as { who: string }).who), trigger.id).toBe(true);
      expect(abilities.has((trigger.when as { ability: string }).ability), trigger.id).toBe(true);
      expect(s.midScripts[trigger.script], trigger.id).toBeDefined();
    }
    expect(s.mid).toHaveLength(3);
  });

  it('the guide card and its page are registered under the chapter id, for the three ids, and the tactic names the same fighters', () => {
    const guide = guideForChapter(ANGRA_MAINYU_ID);
    expect(guide).toBeDefined();
    expect(guide!.bossIds).toEqual([...ANGRA_MAINYU_BODY_IDS]);
    expect([...ANGRA_MAINYU_GUIDE_IDS]).toEqual([...ANGRA_MAINYU_BODY_IDS]);
    expect([...ANGRA_MAINYU_BOSS_IDS]).toEqual([...ANGRA_MAINYU_BODY_IDS]);
    expect(docForChapter(ANGRA_MAINYU_ID)).toMatchObject({ game: 'ffx2', bossIds: [...ANGRA_MAINYU_BODY_IDS] });
    expect(GUIDES.filter((g) => g.id === ANGRA_MAINYU_ID)).toHaveLength(1);
  });
});
