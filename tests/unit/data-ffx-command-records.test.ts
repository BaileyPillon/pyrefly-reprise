/**
 * **The FFX command records, attached to the ability catalog** (re-parity W1; **FFX only**).
 *
 * `src/data/ffx/command-records/` gives each ability the five fields of the game's own command record that the
 * parity kernels read and the ability's other fields do not carry (`FFXCommandRecord`). This file pins:
 *
 *  - the records equal the game's table: `tests/fixtures/parity/ffx/command_records.json` holds all 979 records of
 *    the Steam HD build's kernel tables (numbers only; `research/re-ffx-commands.md` section 1), and every attached
 *    record is that row, word for word;
 *  - every ability has a record or is on the short list of ours that do not, and no id is on both;
 *  - the numbers an ability carries itself (formula, power, element, hits, accuracy and crit bytes) equal the game's,
 *    except the rows of {@link KNOWN_DIFFERENCES}: the sourced decisions that wait for Bailey, listed rather than
 *    retuned (his rule: never tune a boss number). A new or fixed difference must change this list;
 *  - the assumptions the adapter makes about data: a weapon command carries the plain weapon's Strength 16 (the
 *    kernel substitutes the weapon's formula and power for it), and no damaging ability loses a damage class the
 *    engine always gave it.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import { COMMAND_RECORDS, NO_COMMAND_RECORD } from '../../src/data/ffx/command-records/index.ts';
import { POSSESSED_PLAIN_ATTACK } from '../../src/data/ffx/command-records/enemies.ts';
import { possessedAeonGroups } from '../../src/data/ffx/enemies/braskas-final-aeon.ts';
import { FORMULA_NUMBER, engineDamageClass } from '../../src/battle/ffx/adapt/command.ts';
import { elementMask } from '../../src/battle/ffx/adapt/words.ts';

interface Fixture {
  columns: string[];
  rows: number[][];
}

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx/command_records.json', import.meta.url)), 'utf8'),
) as Fixture;
const COL = Object.fromEntries(fixture.columns.map((name, i) => [name, i])) as Record<string, number>;
const GAME = new Map(fixture.rows.map((row) => [row[0] as number, row]));
const field = (row: number[], name: string): number => row[COL[name] as number] as number;

/**
 * The numbers our ability data carries that differ from the game's record, with the game's value:
 * `[ability id, field, ours, game's]`. Each one is a sourced decision for Bailey (research/re-ffx-commands.md
 * section 4), not a bug the wiring may fix: the wiring does not retune a number.
 */
const KNOWN_DIFFERENCES: ReadonlyArray<readonly [string, string, number, number]> = [
  ['lancet', 'formula', 4, 3],
  ['blitz-ace', 'hits', 8, 9],
  ['tornado', 'power', 20, 15],
  ['attack-reels-hit', 'hits', 12, 1],
  ['lance-of-atrophy', 'accuracy', 255, 120],
  ['cross-cleave', 'accuracy', 100, 0],
  ['mortibsorption', 'accuracy', 255, 0],
  ['dispelling-slap', 'accuracy', 255, 0],
  ['hellbiter', 'accuracy', 255, 100],
  ['left-arm-strike', 'accuracy', 100, 0],
  ['left-arm-strike-2', 'accuracy', 100, 0],
  ['jecht-beam', 'accuracy', 255, 0],
  ['jecht-bomber', 'accuracy', 255, 0],
  ['jecht-bomber-2', 'accuracy', 255, 0],
  ['ultimate-jecht-shot', 'accuracy', 255, 0],
  ['possessed-valefor-sonic-wings', 'power', 28, 16],
  ['possessed-valefor-energy-blast', 'power', 75, 48],
  ['possessed-ifrit-meteor-strike', 'power', 29, 17],
  ['possessed-ifrit-hellfire', 'element', 0, 1],
  ['possessed-ixion-aerospark', 'power', 30, 16],
  ['possessed-ixion-thors-hammer', 'element', 0, 4],
  ['possessed-shiva-heavenly-strike', 'power', 30, 17],
  ['possessed-shiva-diamond-dust', 'element', 0, 2],
  ['possessed-bahamut-impulse', 'power', 36, 16],
  ['possessed-bahamut-mega-flare', 'power', 72, 65],
  ['possessed-anima-pain', 'power', 20, 28],
  ['possessed-anima-oblivion', 'formula', 15, 1],
  ['possessed-yojimbo-daigoro', 'power', 10, 20],
  ['possessed-yojimbo-daigoro', 'critBonus', 0, 20],
  ['possessed-cindy-camisade', 'power', 30, 21],
  ['possessed-cindy-delta-attack', 'power', 65, 10],
  ['possessed-cindy-delta-attack', 'hits', 1, 6],
  ['possessed-sandy-razzia', 'power', 28, 21],
  ['mac-multi-blizzara', 'hits', 2, 1],
  ['mac-multi-thundara', 'hits', 2, 1],
  ['mac-multi-watera', 'hits', 2, 1],
  ['mac-multi-fira', 'hits', 2, 1],
  ['guardian-blizzard', 'power', 12, 16],
  ['guardian-thunder', 'power', 12, 16],
  ['natus-multi-fira', 'hits', 2, 1],
  ['natus-multi-blizzara', 'hits', 2, 1],
  ['natus-multi-thundara', 'hits', 2, 1],
  ['natus-multi-watera', 'hits', 2, 1],
  ['natus-flare', 'power', 60, 80],
];

describe("the attached records are the game's table", () => {
  it('the fixture holds all 979 records', () => {
    expect(fixture.rows).toHaveLength(979);
  });

  it('every record equals its row of the fixture', () => {
    const wrong: string[] = [];
    for (const [abilityId, record] of Object.entries(COMMAND_RECORDS)) {
      const row = GAME.get(record.id);
      if (!row) {
        wrong.push(`${abilityId}: no record 0x${record.id.toString(16)} in the game's table`);
        continue;
      }
      const same =
        record.type === field(row, 'type') &&
        record.flagsMisc === field(row, 'flagsMisc') &&
        record.flagsDamage === field(row, 'flagsDamage') &&
        record.damageClass === field(row, 'damageClass');
      if (!same) wrong.push(`${abilityId}: 0x${record.id.toString(16)} differs from the table`);
    }
    expect(wrong).toEqual([]);
  });

  it('every ability has a record or is one of ours with none, never both', () => {
    const missing = ALL_ABILITIES.filter((a) => a.record === undefined && NO_COMMAND_RECORD[a.id] === undefined).map((a) => a.id);
    expect(missing, 'abilities with no record and no reason').toEqual([]);
    const both = ALL_ABILITIES.filter((a) => a.record !== undefined && NO_COMMAND_RECORD[a.id] !== undefined).map((a) => a.id);
    expect(both).toEqual([]);
    const stray = Object.keys(COMMAND_RECORDS).filter((id) => !ALL_ABILITIES.some((a) => a.id === id));
    expect(stray, 'records for abilities that do not exist').toEqual([]);
    expect(Object.keys(NO_COMMAND_RECORD).filter((id) => !ALL_ABILITIES.some((a) => a.id === id))).toEqual([]);
  });

  it("an item's effect carries the record of its catalog entry (the same object)", () => {
    for (const item of Object.values(ITEMS)) {
      if (typeof item.effect === 'string') continue;
      expect(item.effect.record, item.id).toBeDefined();
      expect(item.effect.record!.id, item.id).toBeGreaterThanOrEqual(0x2000);
      expect(item.effect.record!.id, item.id).toBeLessThan(0x2070);
    }
  });

  it('the ability counts the record table was built for', () => {
    // 453 and 2 since the Seymour re-parity: the zero-hit "Wait" that Seymour spent in Anima's act is gone (the game
    // takes his turns away instead), and it was one of the rows without a record.
    expect(ALL_ABILITIES).toHaveLength(453);
    expect(Object.keys(COMMAND_RECORDS)).toHaveLength(451);
    expect(Object.keys(NO_COMMAND_RECORD)).toHaveLength(2);
  });
});

describe("the numbers an ability carries against the game's record", () => {
  it('differ only where this list says so', () => {
    const found: Array<[string, string, number, number]> = [];
    for (const a of ALL_ABILITIES) {
      const record = a.record;
      if (!record) continue;
      const row = GAME.get(record.id)!;
      const damaging = a.formula !== 'none' && (a.power > 0 || field(row, 'power') > 0);
      const note = (name: string, ours: number, game: number): void => {
        if (ours !== game) found.push([a.id, name, ours, game]);
      };
      if (damaging) {
        note('formula', FORMULA_NUMBER[a.formula], field(row, 'formula'));
        note('power', a.power, field(row, 'power'));
        note('element', elementMask(a.element), field(row, 'element'));
        note('hits', a.hits, field(row, 'hits'));
        if (a.accuracy !== undefined) note('accuracy', a.accuracy, field(row, 'accuracy'));
        note('critBonus', a.bonusCrit ?? 0, field(row, 'critBonus'));
      } else if (a.hits !== 0 && field(row, 'hits') !== 0) {
        note('hits', a.hits, field(row, 'hits'));
      }
    }
    expect(found).toEqual(KNOWN_DIFFERENCES.map((row) => [...row]));
  });
});

describe('what the adapter assumes of the data', () => {
  it('every weapon command (record bit 18) is the plain Strength 16 the kernel substitutes for the weapon', () => {
    const weapon = ALL_ABILITIES.filter((a) => a.record !== undefined && (a.record.flagsMisc & 0x40000) !== 0);
    expect(weapon.length).toBeGreaterThan(20);
    for (const a of weapon) {
      expect(a.formula, a.id).toBe('strength');
      expect(a.power, a.id).toBe(16);
      expect(field(GAME.get(a.record!.id)!, 'formula'), a.id).toBe(1);
      expect(field(GAME.get(a.record!.id)!, 'power'), a.id).toBe(16);
    }
  });

  it('no damaging ability loses a damage class the engine always applied', () => {
    const lost: string[] = [];
    for (const a of ALL_ABILITIES) {
      if (!a.record || a.formula === 'none' || a.power === 0) continue;
      const wanted = engineDamageClass(a);
      if ((a.record.damageClass & wanted) !== wanted) lost.push(`${a.id}: engine ${wanted}, game ${a.record.damageClass}`);
    }
    expect(lost).toEqual([]);
  });

  it('no ability uses a formula the adapter cannot supply an input for (0x16 reads a save counter)', () => {
    for (const a of ALL_ABILITIES) expect(FORMULA_NUMBER[a.formula], a.id).not.toBe(0x16);
  });

  it("the possessed aeons' plain Attack is the game's monster-side record 0x6000, word for word", () => {
    const row = GAME.get(0x6000)!;
    const p = POSSESSED_PLAIN_ATTACK;
    expect(p.record.id).toBe(0x6000);
    expect(p.record.type).toBe(field(row, 'type'));
    expect(p.record.flagsMisc).toBe(field(row, 'flagsMisc'));
    expect(p.record.flagsDamage).toBe(field(row, 'flagsDamage'));
    expect(p.record.damageClass).toBe(field(row, 'damageClass'));
    expect(p.accuracy).toBe(field(row, 'accuracy'));
    expect(p.critBonus).toBe(field(row, 'critBonus'));
    // The generic Attack the engine resolves on it deals the same formula and power the record does.
    expect(field(row, 'formula')).toBe(1);
    expect(field(row, 'power')).toBe(16);
    expect((p.record.flagsMisc >>> 3) & 7).toBe(2); // accuracy formula 2: the byte less the target's Evasion
    expect(p.record.flagsDamage & 4).toBe(0); // cannot crit
  });

  it('the five possessed aeons that end a turn on the plain Attack carry it, and no other enemy does', () => {
    const carried = possessedAeonGroups.flatMap((g) => g.enemies).filter((e) => e.plainAttack !== undefined).map((e) => e.id);
    expect([...new Set(carried)].sort()).toEqual(['possessed-bahamut', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-valefor']);
  });

  it("a record with accuracy formula 1 or 2 comes with the ability's accuracy byte", () => {
    for (const a of ALL_ABILITIES) {
      if (!a.record) continue;
      const formula = (a.record.flagsMisc >>> 3) & 7;
      if (formula === 1 || formula === 2) expect(a.accuracy, a.id).toBeDefined();
    }
  });
});
