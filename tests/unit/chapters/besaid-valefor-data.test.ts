/**
 * Valefor at Besaid (FFX-2 Chapter 3, "Protect Besaid Temple!"; the hidden chapter "Valefor at Besaid", number 24, typed word `valefor`): the data, pinned. **FFX-2 only** [AGENTS.md rule 14].
 *
 * What this pins, against the game's own row (`research/re-ffx2-yojimbo-valefor.md`, `monster.bin` **row 164** of the Steam build, the RE session, 2026-10-14) and the research
 * (`research/ffx2-fallen-aeons.md` §7.1, SinirothX + the FF Wiki), whose numbers are in `tests/fixtures/parity/ffx2/besaid_valefor_rows.json` (numbers only; the row as decoded fields,
 * each with its record offset in the note's column map; the row's 200 bytes are not kept):
 *
 * 1. **The row**: this file reads the decoded fields and checks the enemy data (level, HP, MP, the eight stats, rewards), the attached monster record (Accuracy, the resist bytes, the special
 *    word, the steal byte and gil, the plain Attack) and the status table the engine builds from it against them, field by field.
 * 2. **The research**: every number §7.1 shares with the row equals it; the one disagreement, **Gravity nulled**, is the row's. Row 363 (Lv 48, HP 38,000), which sits in no formation, is NOT used.
 * 3. **What is deliberately not wired**: the columns the note marks unmapped (group-1 resist slots 17 and 18, which the engine's slot table would read as Itchy and Auto-Life; the Bribe flag).
 * 4. **The four moves' rows** (the damage constants, the targets, the hit rule of hard rule 5), the group, the party (the Chapter 2 preset carried forward), the items, the chapter record and its
 *    registration (hidden: in neither `CHAPTERS` nor `CHAPTER_IDS`), the pause metadata, the story's lint and the guide.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../../../src/battle/ffx2/adapt/slots.ts';
import { affinityBytes, specialWord } from '../../../src/battle/ffx2/adapt/words.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { VALEFOR_ABILITY, VALEFOR_AC_PER_ACTION, VALEFOR_AC_PER_RESULT, VALEFOR_RAYS_PER_CYCLE, VALEFOR_RAY_MARKS, VALEFOR_SCENE, VALEFOR_SCRIPT, VALEFOR_SONIC_WINGS_ROLL, groundDistance, x2ValeforScript } from '../../../src/battle/ffx2/ai/valefor.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import { ffx2ValeforBesaidScripts } from '../../../src/story/scripts/ffx2-valefor-besaid.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { ALL_BOSS_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import { besaidBuild } from '../../../src/data/ffx2/builds/besaid.ts';
import { bevelleBuild } from '../../../src/data/ffx2/builds/bevelle.ts';
import {
  BESAID_VALEFOR,
  VALEFOR_ACTION_TIME_ON,
  VALEFOR_ACTION_TIME_SECONDS,
  VALEFOR_ID,
  VALEFOR_SCRIPT_ID,
  VALEFOR_SPRITE,
  besaidValeforGroup,
  x2Valefor,
} from '../../../src/data/ffx2/enemies/valefor.ts';
import {
  VALEFOR_ATTACK_ID,
  VALEFOR_DC,
  VALEFOR_ENERGY_BLAST_ID,
  VALEFOR_ENERGY_RAY_ID,
  VALEFOR_SONIC_WINGS_ID,
  x2ValeforAbilities,
} from '../../../src/data/ffx2/enemies/valefor-abilities.ts';
import { MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { heldItems } from '../../../src/data/ffx2/items/held.ts';
import { FFX2_VALEFOR_BESAID, VALEFOR_BESAID_ID } from '../../../src/data/chapter-ffx2-valefor-besaid.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { DJOSE_CHAMBER_PLATE } from '../../../src/data/ixion-plates.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { VALEFOR_BESAID_BOSS_IDS } from '../../../src/engine/tactics/ffx2-valefor-besaid.ts';
import { VALEFOR_BESAID_GUIDE_IDS } from '../../../src/data/guides/ffx2-valefor-besaid.ts';

interface Fixture {
  row: number;
  columns: { decoded: Record<string, string>; unmapped: Record<string, string> };
  decoded: Decoded;
  unmapped: { basakuWord: number; soundId: number; monsterTypeWord: number; specialBits7and8: number[]; group1ResistSlots17and18: number[]; elementBits6and7: number[] };
  research: Record<string, unknown> & { level: number; hp: number; str: number; mag: number; def: number; mdef: number; agi: number; eva: number; luck: number; exp: number; ap: number; gil: number; pilferGil: number; attackDC: number; sonicWingsDC: number; energyRayDC: number; energyBlastDC: number };
  disagreements: Array<{ field: string }>;
  commandRows: Record<string, unknown> & { cadence: { agi: number; seconds: Record<string, { charge: number; recovery: number }> } };
  scene: { boss: { x: number; z: number }; girls: Array<{ x: number; z: number }>; groundDistance: Record<string, number>; attackPercentAtTheStart: Record<string, number> };
  script: { gauge: { perAttackClassTurn: number; perResultAppliedToHer: number; rayMarks: number[]; raysPerCycle: number; overdriveAt: number }; withNobodyHittingHer: { rayTurns: number[]; blastTurn: number }; noHpPhases: boolean; noTimer: boolean };
  notUsed: { row363: { level: number; hp: number; acc: number } };
}
interface Decoded {
  hp: number; mp: number; level: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number;
  special: number; absorb: number; nullElements: number; half: number; weak: number;
  resist1: Record<string, number>; resist2: Record<string, number>; abilities: number[];
  exp: number; gil: number; pilferGil: number; ap: number; dropChanceByte: number; stealChanceByte: number;
  dropItems: number[]; stealItems: number[]; bribeItems: number[]; zantetsuByte: number;
}

const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx2/besaid_valefor_rows.json', import.meta.url)), 'utf8')) as Fixture;

/** The row's decoded fields (the note's column map, section 3), as the fixture holds them. */
const ROW = FIXTURE.decoded;
const RECORD = MONSTER_RECORDS[`${BESAID_VALEFOR}/${VALEFOR_ID}`]!;

describe('the fixture is the game\'s row 164, as decoded fields', () => {
  it('has the decoded fields the tests read, each at its own record offset inside the 200-byte row', () => {
    const spans = Object.entries(FIXTURE.columns.decoded).map(([name, text]) => {
      const m = /^0x([0-9a-f]+) \((\d+) bytes?/.exec(text);
      expect(m, name).not.toBeNull();
      const at = parseInt(m![1]!, 16);
      return { name, at, end: at + Number(m![2]) };
    }).sort((a, b) => a.at - b.at);
    spans.forEach((s, i) => {
      expect(s.end, s.name).toBeLessThanOrEqual(200);
      if (i > 0) expect(s.at, s.name).toBeGreaterThanOrEqual(spans[i - 1]!.end);
    });
    expect(Object.keys(ROW).sort()).toEqual(Object.keys(FIXTURE.columns.decoded).sort());
    expect(Object.keys(FIXTURE.unmapped).filter((k) => k !== 'note').sort()).toEqual(Object.keys(FIXTURE.columns.unmapped).sort());
    expect(FIXTURE.row).toBe(164);
  });

  it('is the Chapter 3 Valefor: Lv 22, HP 8,430, MP 9,999; the stronger second Valefor (row 363: Lv 48, HP 38,000) is on file only as the row NOT used', () => {
    expect([ROW.level, ROW.hp, ROW.mp]).toEqual([22, 8430, 9999]);
    expect(FIXTURE.notUsed.row363).toMatchObject({ level: 48, hp: 38000, acc: 108 });
    expect(x2Valefor.level).not.toBe(FIXTURE.notUsed.row363.level);
    expect(x2Valefor.stats.hp).not.toBe(FIXTURE.notUsed.row363.hp);
    expect(x2Valefor.stats.acc).not.toBe(FIXTURE.notUsed.row363.acc);
  });

  it('its ability list is Attack (0x41da), Energy Ray (0x4091), Sonic Wings (0x4092), Energy Blast (0x4093) and Die (0x40ad): the four moves of the chapter, Die being no attack', () => {
    expect(ROW.abilities).toEqual([0x41da, 0x4091, 0x4092, 0x4093, 0x40ad]);
    expect(x2Valefor.abilityIds).toEqual([VALEFOR_ATTACK_ID, VALEFOR_SONIC_WINGS_ID, VALEFOR_ENERGY_RAY_ID, VALEFOR_ENERGY_BLAST_ID]);
  });
});

describe('the enemy data is the row, and the row equals the research in every shared field', () => {
  it('level, HP, MP and the eight stats are the row\'s (MP 9,999 and Accuracy 95 are the row\'s alone: the research gives neither)', () => {
    expect(x2Valefor.level).toBe(ROW.level);
    expect([x2Valefor.hp, x2Valefor.stats.hp, x2Valefor.stats.maxHp]).toEqual([ROW.hp, ROW.hp, ROW.hp]);
    expect([x2Valefor.mp, x2Valefor.stats.mp, x2Valefor.stats.maxMp]).toEqual([ROW.mp, ROW.mp, ROW.mp]);
    expect(x2Valefor.stats).toMatchObject({ str: ROW.str, def: ROW.def, mag: ROW.mag, mdef: ROW.mdef, agi: ROW.agi, acc: ROW.acc, eva: ROW.eva, luck: ROW.luck });
    expect(x2Valefor.forms[0]).toMatchObject({ hp: ROW.hp });
  });

  it('every field the research (§7.1) and the row share is equal; the research gave no MP, Accuracy or status list', () => {
    const r = FIXTURE.research;
    expect({ level: ROW.level, hp: ROW.hp, str: ROW.str, mag: ROW.mag, def: ROW.def, mdef: ROW.mdef, agi: ROW.agi, eva: ROW.eva, luck: ROW.luck, exp: ROW.exp, ap: ROW.ap, gil: ROW.gil, pilferGil: ROW.pilferGil }).toEqual({
      level: r.level, hp: r.hp, str: r.str, mag: r.mag, def: r.def, mdef: r.mdef, agi: r.agi, eva: r.eva, luck: r.luck, exp: r.exp, ap: r.ap, gil: r.gil, pilferGil: r.pilferGil,
    });
    expect(FIXTURE.disagreements.map((d) => d.field)).toEqual(['elements']); // the one disagreement: Gravity
  });

  it('the rewards are the row\'s: EXP 1,500, AP 15, Gil 1,200, Pilfer Gil 1,500, a Moon Bracer drop, Healing Spring x4 (rare x6) at a steal byte of 128', () => {
    const rw = x2Valefor.rewards;
    expect([rw.exp, rw.ap, rw.apOverkill, rw.gil, rw.stolenGil]).toEqual([ROW.exp, ROW.ap, ROW.ap, ROW.gil, ROW.pilferGil]);
    expect(rw.drops).toEqual([{ itemId: 'moon-bracer', count: 1 }]);
    expect(ROW.dropItems).toEqual([0x905c, 1, 0x905c, 1]); // Moon Bracer, common and rare
    expect(ROW.dropChanceByte).toBe(255);
    expect(rw.steal?.common).toEqual({ itemId: 'x2-healing-spring', count: ROW.stealItems[1] });
    expect(rw.steal?.rare).toEqual({ itemId: 'x2-healing-spring', count: ROW.stealItems[3] });
    expect(ROW.stealItems).toEqual([0x2034, 4, 0x2034, 6]);
    expect(rw.steal?.stealRate).toBe(ROW.stealChanceByte);
    expect(ROW.stealChanceByte).toBe(128);
  });

  it('the drop and steal items have rows (held-only: Moon Bracer is Auto-Shell, Healing Spring a recovery item whose effect is not wired), and no Bribe slot exists', () => {
    for (const id of ['moon-bracer', 'x2-healing-spring']) {
      const item = heldItems.find((i) => i.id === id)!;
      expect(item, id).toBeDefined();
      expect(item.usableInBattle, id).toBe(false);
      expect(data.ITEMS[id]?.name, id).toBe(id === 'moon-bracer' ? 'Moon Bracer' : 'Healing Spring');
    }
    expect(ROW.bribeItems).toEqual([0, 0, 0, 0]);
    expect(x2Valefor.rewards.bribe).toBeUndefined();
    expect((ROW.special >> 7) & 7, 'special bits 7, 8 and 9 are all set: immune to Interrupt and Bribe whichever is which').toBe(7);
    expect(x2Valefor.immunityFlags).toContain('immune-to-bribe');
  });
});

describe('Gravity is nulled (the row), every other element is neutral (the row and the research)', () => {
  it('the null byte is 0x10 (bit 4, Gravity), and absorb, half and weak are empty', () => {
    expect([ROW.absorb, ROW.nullElements, ROW.half, ROW.weak]).toEqual([0, 0x10, 0, 0]);
    expect(x2Valefor.affinities).toEqual({ gravity: 'immune' });
  });

  it('the engine builds the same bytes from the data (the null byte 0x10, nothing else)', () => {
    const unit = aiUnit(VALEFOR_ID, 'enemy', ROW.hp, 0);
    unit.affinities = { ...x2Valefor.affinities };
    expect(affinityBytes(unit)).toMatchObject({ absorb: 0, nullify: 0x10, half: 0, weak: 0 });
  });
});

describe('the monster record is the row, and the engine\'s status table is built from it', () => {
  it('carries Accuracy, the special word, Zantetsu, the steal byte and gil, the steal items, no Bribe slot, and the plain Attack 0x41da', () => {
    expect(RECORD).toBeDefined();
    expect(RECORD).toMatchObject({
      row: 164,
      table: 1,
      acc: ROW.acc,
      special: ROW.special,
      species: 0, // the monster-type word reads 0 (unmapped, and 0 either way)
      zantetsu: ROW.zantetsuByte,
      stealByte: ROW.stealChanceByte,
      stealGil: ROW.pilferGil,
      steal: ROW.stealItems,
      bribe: [0, 0, 0, 0],
    });
    expect(RECORD.plainAttack).toMatchObject({ id: ROW.abilities[0], power: 16 });
    expect(x2Valefor.ffx2Record).toBe(RECORD);
    expect(ROW.special).toBe(0x3c3);
    expect(specialWord(Object.assign(aiUnit(VALEFOR_ID, 'enemy', ROW.hp, 0), { enemy: { ...x2Valefor, aiScriptId: VALEFOR_SCRIPT_ID, formIndex: 0 } }) as never)).toBe(0x3c3);
  });

  it('the resist bytes are the row\'s, slot by slot, slots 17 and 18 included (the RE review of 2026-10-14: the engine\'s table is right, 17 is Itchy and 18 is Auto-Life)', () => {
    expect(RECORD.resist1).toEqual(Object.fromEntries(Object.entries(ROW.resist1).map(([k, v]) => [Number(k), v])));
    expect(RECORD.resist2).toEqual(Object.fromEntries(Object.entries(ROW.resist2).map(([k, v]) => [Number(k), v])));
    expect(Object.keys(ROW.resist1).map(Number).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 17, 18]);
    expect(Object.keys(ROW.resist2).map(Number)).toEqual([6, 14]); // Stop and Doom: Slow and every stat stage read 0, so Breaks and Slow land
    expect(FIXTURE.unmapped.group1ResistSlots17and18).toEqual([255, 255]);
  });

  it('after the attach, the enemy is immune to exactly the statuses the row nulls at the slots the engine has (Itchy and Auto-Life at 17 and 18 included), plus Delay (the special word\'s bit 6) and Interrupt (bits 7, 8 and 9 are set: immune whichever bit is which, the RE review)', () => {
    const expected = new Set<string>(['delay-effect', 'action-cancel']);
    for (const [slot, byte] of Object.entries(ROW.resist1)) {
      const status = GROUP1_STATUS[Number(slot)];
      if (status !== null && status !== undefined && byte === 255) expected.add(status);
    }
    for (const [slot, byte] of Object.entries(ROW.resist2)) for (const status of GROUP2_STATUS[Number(slot)] ?? []) if (byte === 255) expected.add(status);
    const immune = new Set(Object.entries(x2Valefor.immunities).filter(([, v]) => v === 255).map(([k]) => k));
    expect([...immune].sort()).toEqual([...expected].sort());
    for (const status of ['itchy', 'auto-life', 'action-cancel']) expect(immune.has(status), status).toBe(true);
    for (const lands of ['slow', 'str-down', 'def-down', 'mag-down', 'mdef-down', 'shell', 'protect', 'reflect', 'haste', 'regen']) expect(immune.has(lands), `${lands} lands`).toBe(false);
    expect(x2Valefor.immunityFlags).toEqual(['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe']); // special bits 0 and 6, and 7 to 9
  });
});

describe('the four moves are the research\'s (damage constants, targets, the hit rule)', () => {
  const byId = Object.fromEntries(x2ValeforAbilities.map((a) => [a.id, a]));

  it('the ids are the data\'s and the AI\'s, in both layers, and the shipped table holds all four', () => {
    expect(VALEFOR_ABILITY).toEqual({ attack: VALEFOR_ATTACK_ID, sonicWings: VALEFOR_SONIC_WINGS_ID, energyRay: VALEFOR_ENERGY_RAY_ID, energyBlast: VALEFOR_ENERGY_BLAST_ID });
    expect(VALEFOR_SCRIPT).toBe(VALEFOR_SCRIPT_ID);
    expect(x2Valefor.aiScriptId).toBe(VALEFOR_SCRIPT);
    expect(aiScriptFor(VALEFOR_SCRIPT)).toBe(x2ValeforScript);
    for (const id of Object.values(VALEFOR_ABILITY)) {
      expect(ALL_BOSS_ABILITIES.find((a) => a.id === id), id).toBeDefined();
      expect(data.ABILITIES[id], id).toBeDefined();
      expect(id.startsWith('x2-valefor-'), id).toBe(true); // never the FFX Valefor's ids
    }
    expect(ENEMY_GROUPS_BY_ID[BESAID_VALEFOR]).toBe(besaidValeforGroup);
  });

  it('the damage constants are 16, 2, 20 and 25 (§7.1, [verified: 2 sources])', () => {
    expect(VALEFOR_DC).toEqual({ attack: FIXTURE.research.attackDC, sonicWings: FIXTURE.research.sonicWingsDC, energyRay: FIXTURE.research.energyRayDC, energyBlast: FIXTURE.research.energyBlastDC });
    expect([byId[VALEFOR_ATTACK_ID]!.power, byId[VALEFOR_SONIC_WINGS_ID]!.power, byId[VALEFOR_ENERGY_RAY_ID]!.power, byId[VALEFOR_ENERGY_BLAST_ID]!.power]).toEqual([16, 2, 20, 25]);
  });

  it('the Attack and Sonic Wings are single-target physical hits; Energy Ray is magic on every living girl and **Energy Blast is not magic** (its row\'s damage flags are 0: neither Shell nor Protect reduces it)', () => {
    expect(byId[VALEFOR_ATTACK_ID]).toMatchObject({ formula: 'strength', damageType: 'physical', targeting: 'single-enemy', category: 'attack' });
    expect(byId[VALEFOR_SONIC_WINGS_ID]).toMatchObject({ formula: 'strength', damageType: 'physical', targeting: 'single-enemy' });
    expect(byId[VALEFOR_ENERGY_RAY_ID]).toMatchObject({ formula: 'magic', damageType: 'magical', targeting: 'all-enemies' });
    expect(byId[VALEFOR_ENERGY_BLAST_ID]).toMatchObject({ formula: 'magic', damageType: 'other', targeting: 'all-enemies' });
  });

  it('Sonic Wings takes MP, not HP (the key the command adapter reads); no move costs MP', () => {
    expect(byId[VALEFOR_SONIC_WINGS_ID]!.extra).toMatchObject({ mpOnly: true });
    for (const a of x2ValeforAbilities) expect(a.mpCost, a.id).toBe(0);
  });

  it('hard rule 5: the Ray, the Blast (her Overdrive) and Sonic Wings (accuracy formula 0, no Darkness bit: the RE review) are `canMiss: false`; the plain Attack is the one move that rolls', () => {
    expect(byId[VALEFOR_ENERGY_RAY_ID]!.canMiss).toBe(false);
    expect(byId[VALEFOR_ENERGY_BLAST_ID]!.canMiss).toBe(false);
    expect(byId[VALEFOR_SONIC_WINGS_ID]!.canMiss).toBe(false);
    expect(byId[VALEFOR_ATTACK_ID]!.canMiss).not.toBe(false);
  });

  it('the three special moves run on the game\'s own command rows (monmagic 0x4091 to 0x4093, the RE review): every field is the fixture\'s, and the ability carries the very record the table serves', () => {
    for (const id of [VALEFOR_ENERGY_RAY_ID, VALEFOR_SONIC_WINGS_ID, VALEFOR_ENERGY_BLAST_ID]) {
      const want = FIXTURE.commandRows[id] as Record<string, number>;
      const record = FFX2_COMMAND_RECORDS[id]!;
      expect(record, id).toBeDefined();
      expect(record, id).toMatchObject(want);
      expect(Object.keys(record).sort(), `${id}: no field beyond the row's`).toEqual(Object.keys(want).sort());
      expect(byId[id]!.ffx2Record, id).toBe(record);
    }
    expect(ROW.abilities.slice(1, 4)).toEqual([0x4091, 0x4092, 0x4093]);
    expect([FFX2_COMMAND_RECORDS[VALEFOR_ENERGY_RAY_ID]!.id, FFX2_COMMAND_RECORDS[VALEFOR_SONIC_WINGS_ID]!.id, FFX2_COMMAND_RECORDS[VALEFOR_ENERGY_BLAST_ID]!.id]).toEqual([0x4091, 0x4092, 0x4093]);
    expect(byId[VALEFOR_ATTACK_ID]!.ffx2Record, 'the plain Attack runs on the monster record\'s row 0x41da, not on a row of its own').toBeUndefined();
  });

  it('the rows say what the review reads from them: Ray magical and Blast neither physical nor magical (damage flags 0x2 and 0x0), Sonic Wings physical and MP-only, none rolls to hit, charge 120, 100 and 120, recovery 100, 80 and 100', () => {
    const rec = (id: string) => FFX2_COMMAND_RECORDS[id]!;
    expect([rec(VALEFOR_ENERGY_RAY_ID).flagsDamage & 3, rec(VALEFOR_ENERGY_BLAST_ID).flagsDamage & 3, rec(VALEFOR_SONIC_WINGS_ID).flagsDamage & 3]).toEqual([2, 0, 1]);
    expect(rec(VALEFOR_SONIC_WINGS_ID).damageClass, 'class 2 is the MP pool').toBe(2);
    for (const id of [VALEFOR_ENERGY_RAY_ID, VALEFOR_SONIC_WINGS_ID, VALEFOR_ENERGY_BLAST_ID]) expect((rec(id).flagsMisc >> 3) & 7, `${id}: accuracy formula 0, it never rolls`).toBe(0);
    expect([rec(VALEFOR_ENERGY_RAY_ID).costCast, rec(VALEFOR_SONIC_WINGS_ID).costCast, rec(VALEFOR_ENERGY_BLAST_ID).costCast]).toEqual([120, 100, 120]);
    expect([rec(VALEFOR_ENERGY_RAY_ID).costAtb, rec(VALEFOR_SONIC_WINGS_ID).costAtb, rec(VALEFOR_ENERGY_BLAST_ID).costAtb]).toEqual([100, 80, 100]);
    expect(rec(VALEFOR_ENERGY_RAY_ID).flagsTarget, 'Ray and Blast have identical target and misc flags: the same whole-party group, no arc').toBe(rec(VALEFOR_ENERGY_BLAST_ID).flagsTarget);
    expect(rec(VALEFOR_ENERGY_RAY_ID).flagsMisc).toBe(rec(VALEFOR_ENERGY_BLAST_ID).flagsMisc);
    expect([VALEFOR_DC.energyRay, VALEFOR_DC.sonicWings, VALEFOR_DC.energyBlast]).toEqual([rec(VALEFOR_ENERGY_RAY_ID).power, rec(VALEFOR_SONIC_WINGS_ID).power, rec(VALEFOR_ENERGY_BLAST_ID).power]);
  });

  it('the cadence is the review\'s, from the costs and her Agility 125: charge 3.37 s and recovery 2.80 s for Ray and Blast, charge 2.80 s and recovery 2.24 s for Sonic Wings', () => {
    const agi = FIXTURE.commandRows.cadence.agi;
    expect(agi).toBe(ROW.agi);
    const seconds = (cost: number): number => Math.round((Math.ceil((cost * 10000) / (agi + 1) / 95) / 29.97) * 100) / 100;
    for (const id of [VALEFOR_ENERGY_RAY_ID, VALEFOR_SONIC_WINGS_ID, VALEFOR_ENERGY_BLAST_ID]) {
      const rec = FFX2_COMMAND_RECORDS[id]!;
      expect({ charge: seconds(rec.costCast ?? 0), recovery: seconds(rec.costAtb ?? 0) }, id).toEqual(FIXTURE.commandRows.cadence.seconds[id]);
    }
  });
});

describe('the scene and the script are the RE review\'s (m164, pos_bsyt05_229; the fixture carries the numbers)', () => {
  it('the Besaid start positions are the fixture\'s, and the ground distances are Yuna 53.00, Rikku and Paine 52.39', () => {
    expect(VALEFOR_SCENE.boss).toEqual(FIXTURE.scene.boss);
    expect(VALEFOR_SCENE.girls).toEqual(FIXTURE.scene.girls);
    expect([groundDistance(0), groundDistance(1), groundDistance(2)].map((d) => Math.round(d * 100) / 100)).toEqual([FIXTURE.scene.groundDistance['yuna'], FIXTURE.scene.groundDistance['rikku'], FIXTURE.scene.groundDistance['paine']]);
  });

  it('the gauge constants are the fixture\'s: +5 an attack-class turn and per result, Rays at 30 and 60 (two a cycle), the Blast at 100, Sonic Wings on roll 0 of 3; no HP phase and no timer', () => {
    const g = FIXTURE.script.gauge;
    expect([VALEFOR_AC_PER_ACTION, VALEFOR_AC_PER_RESULT, [...VALEFOR_RAY_MARKS], VALEFOR_RAYS_PER_CYCLE]).toEqual([g.perAttackClassTurn, g.perResultAppliedToHer, g.rayMarks, g.raysPerCycle]);
    expect(VALEFOR_SONIC_WINGS_ROLL).toBe(0);
    expect(FIXTURE.script.noHpPhases && FIXTURE.script.noTimer).toBe(true);
    expect(x2ValeforScript.onTurnResolved, 'no clock hook: nothing scripted ends the fight').toBeUndefined();
    expect(x2ValeforScript.onDamaged, 'no HP hook').toBeUndefined();
  });
});

describe('the group, the party and the chapter', () => {
  it('is one link that cannot be fled, on our own aeon cue (never the retail "Aeons"), action time on at 3 s, kept by precedent (D-151, D-187/D-197, D-269), awaiting Bailey\'s pick', () => {
    expect(besaidValeforGroup).toMatchObject({ id: BESAID_VALEFOR, game: 'ffx2', canEscape: false });
    expect(besaidValeforGroup.enemies).toEqual([x2Valefor]);
    expect(besaidValeforGroup.musicCues).toEqual([{ at: 'start', track: 'boss-ffx2-fallen-aeons', fadeMs: 800 }]);
    expect(VALEFOR_ACTION_TIME_ON).toBe(true);
    expect(besaidValeforGroup.actionTimeSeconds).toBe(VALEFOR_ACTION_TIME_SECONDS);
    expect(VALEFOR_ACTION_TIME_SECONDS).toBe(3);
    expect(x2Valefor.spriteKey).toBe(VALEFOR_SPRITE);
    expect(VALEFOR_SPRITE).toBe('valefor'); // the FFX aeon's approved painting, reused as provisional
    expect(x2Valefor.flags).toMatchObject({ isBoss: true });
  });

  it('the party is the Chapter 2 preset carried forward (Yuna 23 White Mage, Rikku 24 Dark Knight, Paine 25 Warrior), a deep copy, with no Samurai and no Lady Luck', () => {
    const b: FFX2PartyBuild = besaidBuild;
    expect(b.members.map((m) => [m.id, m.level, m.currentDressphere])).toEqual([['yuna', 23, 'white-mage'], ['rikku', 24, 'dark-knight'], ['paine', 25, 'warrior']]);
    expect(b).toEqual(bevelleBuild);
    expect(b).not.toBe(bevelleBuild);
    expect(b.members[0]).not.toBe(bevelleBuild.members[0]);
    for (const m of b.members) for (const d of ['samurai', 'lady-luck', 'berserker', 'trainer']) expect(m.owned, `${m.id} owns ${d}`).not.toContain(d);
  });

  it('is hidden: in neither CHAPTERS nor CHAPTER_IDS, found by getChapter, number 24, experimental, FFX-2, on Bailey\'s approved Chamber plate as the provisional stand-in', () => {
    expect(VALEFOR_BESAID_ID).toBe('ffx2-valefor-besaid');
    expect(getChapter(VALEFOR_BESAID_ID)).toBe(FFX2_VALEFOR_BESAID);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_VALEFOR_BESAID);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(VALEFOR_BESAID_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(VALEFOR_BESAID_ID)).toBe(false);
    expect(CHAPTERS).toHaveLength(19);
    expect(FFX2_VALEFOR_BESAID).toMatchObject({ game: 'ffx2', number: 24, experimental: true, sceneKey: DJOSE_CHAMBER_PLATE, title: 'Valefor' });
    expect(FFX2_VALEFOR_BESAID.buildRef).toBe(besaidBuild);
    expect(FFX2_VALEFOR_BESAID.enemyGroupRef).toBe(besaidValeforGroup);
    expect(FFX2_VALEFOR_BESAID.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-ffx2-fallen-aeons', victory: 'victory-ffx2' });
    expect(FFX2_VALEFOR_BESAID.sensorTexts[VALEFOR_ID]).toBe(x2Valefor.sensorText);
  });

  it('the pause metadata exists, says EXP, and its objectives are the lesson, the half and the win', () => {
    const meta = getChapterMeta(VALEFOR_BESAID_ID);
    expect(meta).toBeDefined();
    expect(meta).toMatchObject({ gameLabel: 'FFX-2', numeral: 'EXP', title: 'Valefor', focalCharacterId: 'yuna' });
    expect(meta!.objectives.map((o) => o.rule)).toEqual([{ kind: 'survived-ability', ability: 'energy-blast' }, { kind: 'boss-hp-below', fraction: 0.5 }, { kind: 'victory' }]);
    expect(meta!.musicKeys).toEqual(['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2']);
  });

  it('the story is lint-clean, pre ends in the battle and post holds the results; each callout names one of her real moves', () => {
    const s = ffx2ValeforBesaidScripts;
    for (const script of [s.pre, s.post, ...Object.values(s.midScripts)]) expect(lintScript(script)).toEqual([]);
    expect(s.pre.at(-1)).toMatchObject({ type: 'battleStart' });
    expect(s.post.some((step) => step.type === 'results')).toBe(true);
    const abilities = new Set<string>(Object.values(VALEFOR_ABILITY));
    for (const trigger of s.mid) {
      expect(trigger.when).toMatchObject({ type: 'ability-used', who: VALEFOR_ID });
      expect(abilities.has((trigger.when as { ability: string }).ability), trigger.id).toBe(true);
      expect(s.midScripts[trigger.script], trigger.id).toBeDefined();
    }
  });

  it('the guide card and its page are registered under the chapter id, for her id, and the tactic names the same fighter', () => {
    const guide = guideForChapter(VALEFOR_BESAID_ID);
    expect(guide).toBeDefined();
    expect(guide!.bossIds).toEqual([VALEFOR_ID]);
    expect([...VALEFOR_BESAID_GUIDE_IDS]).toEqual([VALEFOR_ID]);
    expect([...VALEFOR_BESAID_BOSS_IDS]).toEqual([VALEFOR_ID]);
    expect(docForChapter(VALEFOR_BESAID_ID)).toMatchObject({ game: 'ffx2', bossIds: [VALEFOR_ID] });
    expect(GUIDES.filter((g) => g.id === VALEFOR_BESAID_ID)).toHaveLength(1);
  });
});
