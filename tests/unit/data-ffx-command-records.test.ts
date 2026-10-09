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
import { COMMAND_RECORDS, NO_COMMAND_RECORD, RANK_CHANGES } from '../../src/data/ffx/command-records/index.ts';
import { POSSESSED_PLAIN_ATTACK } from '../../src/data/ffx/command-records/enemies.ts';
import { possessedAeonGroups } from '../../src/data/ffx/enemies/braskas-final-aeon.ts';
import { CORE_ABILITIES } from '../../src/battle/ffx/registry.ts';
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
    expect(ALL_ABILITIES).toHaveLength(454);
    expect(Object.keys(COMMAND_RECORDS)).toHaveLength(451);
    expect(Object.keys(NO_COMMAND_RECORD)).toHaveLength(3);
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

// ---------------------------------------------------------------------------------------------- the status bytes (re-parity W2)

interface StatusFixture {
  columns: string[];
  rows: Array<[number, number, number, number, number, number, Array<[number, number]>, Array<[number, number]>]>;
}

const statusFixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx/command_status.json', import.meta.url)), 'utf8'),
) as StatusFixture;
const STATUS = new Map(statusFixture.rows.map((row) => [row[0], row]));

const PERM_IDS = ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'threaten'];
const TEMPORAL_IDS = ['sleep', 'silence', 'darkness', 'shell', 'protect', 'reflect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost', 'regen', 'haste', 'slow'];
const EXTRA_BITS: Readonly<Record<string, number>> = { scan: 0x1, shield: 0x40, boost: 0x80, eject: 0x100, 'auto-life': 0x200, curse: 0x400, defend: 0x800, guard: 0x1000, sentinel: 0x2000, doom: 0x4000 };
const STAGE_BITS: Readonly<Record<string, number>> = { cheer: 1, aim: 2, focus: 4, reflex: 8, luck: 0x10, jinx: 0x20 };
const BUFF_BITS: Readonly<Record<string, number>> = { 'max-hp-x2': 1, 'max-mp-x2': 2, 'mp-cost-zero': 4, 'damage-9999': 8, 'guaranteed-critical': 0x10, 'overdrive-x1_5': 0x20, 'overdrive-x2': 0x40 };
const statusNumber = (status: string): number | null =>
  PERM_IDS.includes(status) ? PERM_IDS.indexOf(status) : TEMPORAL_IDS.includes(status) ? 12 + TEMPORAL_IDS.indexOf(status) : null;
const hexWord = (n: number): string => `0x${n.toString(16)}`;

/**
 * Where the statuses an ability's own data inflicts or removes differ from the game's record (the bytes the status
 * kernels read for an ability that has a record). The wiring takes the RECORD's bytes: they are the exe's inputs. Each
 * line is a sourced difference for Bailey, not something the wiring retunes.
 */
function statusDifferences(): string[] {
  const found: string[] = [];
  for (const a of ALL_ABILITIES) {
    const r = a.record;
    if (!r) continue;
    const chance = new Map(r.chances ?? []);
    const duration = new Map(r.durations ?? []);
    const cleanses = (r.flagsDamage & 0x20) !== 0;
    const covered = new Set<number>();
    let extra = 0;
    let stage = 0;
    let buff = 0;
    for (const s of a.statusEffects) {
      const n = statusNumber(s.status);
      if (n !== null) {
        covered.add(n);
        const g = chance.get(n);
        if (g === undefined) found.push(`${a.id}: ${s.status} chance ${s.chance}, the record has no byte`);
        else if (g !== s.chance) found.push(`${a.id}: ${s.status} chance ${s.chance}, record ${g}`);
        if (n >= 12 && (duration.get(n - 12) ?? 0) !== s.duration) found.push(`${a.id}: ${s.status} duration ${s.duration}, record ${duration.get(n - 12) ?? 0}`);
      } else if (EXTRA_BITS[s.status] !== undefined) extra |= EXTRA_BITS[s.status] as number;
      else if (STAGE_BITS[s.status] !== undefined) stage |= STAGE_BITS[s.status] as number;
      else if (BUFF_BITS[s.status] !== undefined) buff |= BUFF_BITS[s.status] as number;
      else found.push(`${a.id}: ${s.status} has no place in the record`);
    }
    for (const s of a.removesStatuses) {
      const n = statusNumber(s);
      if (n !== null) {
        covered.add(n);
        if (!chance.has(n)) found.push(`${a.id}: removes ${s}, the record has no byte`);
      } else if (EXTRA_BITS[s] !== undefined) extra |= EXTRA_BITS[s] as number;
      else found.push(`${a.id}: removes ${s}, which has no place in the record`);
    }
    // Death is kept elsewhere in our data: a revival command (heals, can-target-dead) is the cleanse of the Death byte, and the
    // instant killers carry the same byte as extra.deathChance (the engine's scripted roll, which this batch replaces by the record).
    const revival = cleanses && chance.get(0) !== undefined && a.flags.includes('can-target-dead');
    if (chance.has(0) && !covered.has(0) && (revival || a.extra?.['deathChance'] === chance.get(0))) covered.add(0);
    for (const [n, byte] of chance) if (!covered.has(n)) found.push(`${a.id}: the record has a byte ${byte} for ${n < 12 ? PERM_IDS[n] : TEMPORAL_IDS[n - 12]}${cleanses ? ' (a cleanse)' : ''}, ours none`);
    if (extra !== (r.extra ?? 0)) found.push(`${a.id}: extra bits ${hexWord(extra)}, record ${hexWord(r.extra ?? 0)}`);
    if ((stage & 0x3f) !== (((r.stage?.[0] ?? 0)) & 0x3f)) found.push(`${a.id}: stage buffs ${hexWord(stage)}, record ${hexWord(r.stage?.[0] ?? 0)}`);
    if (buff !== (r.buff ?? 0)) found.push(`${a.id}: buff flags ${hexWord(buff)}, record ${hexWord(r.buff ?? 0)}`);
    if (cleanses !== (a.removesStatuses.length > 0) && !revival) found.push(`${a.id}: cleanse ${cleanses ? 'in the record' : 'not in the record'}, ours ${a.removesStatuses.length > 0 ? 'removes statuses' : 'none'}`);
  }
  return found;
}

const KNOWN_STATUS_DIFFERENCES: readonly string[] = [
  // The wiring takes the record's byte; Provoke 254 and Threaten 255 were ours. The Threaten command byte is only "non-zero":
  // the roll reads the TARGET's Threaten byte (research/re-ffx-ctb-status.md section 6).
  'provoke: provoke chance 254, record 100',
  'threaten: threaten chance 255, record 100',
  // Distill: the engine has no Distill status; the bits land in the record and are dropped when it is written back.
  'extract-power: extra bits 0x0, record 0x2',
  'extract-mana: extra bits 0x0, record 0x4',
  'extract-speed: extra bits 0x0, record 0x8',
  'extract-ability: extra bits 0x0, record 0x20',
  'power-distiller: extra bits 0x0, record 0x2',
  'mana-distiller: extra bits 0x0, record 0x4',
  'speed-distiller: extra bits 0x0, record 0x8',
  'ability-distiller: extra bits 0x0, record 0x20',
  // Havoc Shot: the game's Sleep, Silence and Darkness bytes are 254 (lands unless immune), ours 100.
  'havoc-shot: sleep chance 100, record 254',
  'havoc-shot: silence chance 100, record 254',
  'havoc-shot: darkness chance 100, record 254',
  // Time Shot also slows, in the game.
  'time-shot: the record has a byte 100 for slow, ours none',
  // The record of Full Life (Seymour Flux's) revives and cleanses nothing else, and inflicts no Doom.
  'full-life: removes poison, the record has no byte',
  'full-life: removes darkness, the record has no byte',
  'full-life: removes silence, the record has no byte',
  'full-life: removes sleep, the record has no byte',
  'full-life: removes confuse, the record has no byte',
  'full-life: removes berserk, the record has no byte',
  'full-life: removes slow, the record has no byte',
  'full-life: extra bits 0x4000, record 0x0',
  // The possessed Yojimbo's Zanmato is a damage command in the game (fixed power 200); it has no Death byte.
  'possessed-yojimbo-zanmato: ko chance 255, the record has no byte',
  // Evrae's Stone Gaze: the Slow it inflicts lasts 100 in the record, 254 ("until removed") in ours.
  'evrae-stone-gaze: slow duration 254, record 100',
];

describe("the status bytes of the attached records are the game's table (re-parity W2)", () => {
  it('the fixture holds all 979 records', () => {
    expect(statusFixture.rows).toHaveLength(979);
  });

  it('every attached record carries its rank, chances, durations, extra word, stage buffs, buff flags and shatter chance word for word', () => {
    const wrong: string[] = [];
    const check = (name: string, record: NonNullable<(typeof ALL_ABILITIES)[number]['record']>): void => {
      const row = STATUS.get(record.id);
      if (!row) {
        wrong.push(`${name}: no status row for 0x${record.id.toString(16)}`);
        return;
      }
      const [, rank, extra, stageMask, stageAmount, buff, chances, durations] = row;
      if (record.rank !== rank) wrong.push(`${name}: rank ${record.rank}, table ${rank}`);
      if (JSON.stringify(record.chances ?? []) !== JSON.stringify(chances)) wrong.push(`${name}: chances`);
      if (JSON.stringify(record.durations ?? []) !== JSON.stringify(durations)) wrong.push(`${name}: durations`);
      if ((record.extra ?? 0) !== extra) wrong.push(`${name}: extra`);
      if ((record.stage?.[0] ?? 0) !== stageMask || (record.stage?.[1] ?? 0) !== (stageMask === 0 ? 0 : stageAmount)) wrong.push(`${name}: stage buffs`);
      if ((record.buff ?? 0) !== buff) wrong.push(`${name}: buff`);
      const game = GAME.get(record.id);
      if (game && (record.shatter ?? 0) !== field(game, 'shatter')) wrong.push(`${name}: shatter ${record.shatter ?? 0}, table ${field(game, 'shatter')}`);
    };
    for (const [abilityId, record] of Object.entries(COMMAND_RECORDS)) check(abilityId, record);
    check('possessed plain Attack', POSSESSED_PLAIN_ATTACK.record);
    expect(wrong).toEqual([]);
  });

  it("the engine's own core abilities (Attack, Defend, the aeons' Shield and Boost) carry the game's records, word for word", () => {
    const expected: Record<string, number> = { attack: 0x3000, defend: 0x3021, 'aeon-shield': 0x3054, 'aeon-boost': 0x3055 };
    for (const [id, recordId] of Object.entries(expected)) {
      const a = CORE_ABILITIES.find((x) => x.id === id);
      expect(a?.record?.id, id).toBe(recordId);
      const record = a!.record!;
      const row = GAME.get(recordId)!;
      expect([record.type, record.flagsMisc, record.flagsDamage, record.damageClass], id).toEqual([
        field(row, 'type'), field(row, 'flagsMisc'), field(row, 'flagsDamage'), field(row, 'damageClass'),
      ]);
      const [, rank, extra, stageMask, , buff, chances, durations] = STATUS.get(recordId)!;
      expect(record.rank, id).toBe(rank);
      expect(record.extra ?? 0, id).toBe(extra);
      expect([record.stage?.[0] ?? 0, record.buff ?? 0, record.chances ?? [], record.durations ?? []], id).toEqual([stageMask, buff, chances, durations]);
      expect(record.shatter ?? 0, id).toBe(field(row, 'shatter')); // the party's Attack shatters a Petrified target 30 times in 100
      expect(a!.rank, id).toBe(rank === 0 ? 3 : rank); // the ability's own rank is the record's
    }
  });

  /**
   * The shatter chance (record byte 0x2c) is read from the record for every recorded command, as the other status bytes are
   * (`adapt/status.ts#commandStatus`); `AbilityDef.shatterChance` is read only by an ability with no game record. Where the ability's own
   * number differs from the record's: 7 abilities of ours carry a chance the game's record does not (it is 0 there), and 148 more (and the
   * party's own Attack, 30, which lives in the registry) have a chance in the game's record that our data never authored. Only the first group can change a fight that ships: a Petrified party member
   * is hit by enemy commands, and the enemy rows of the second group are the possessed Yojimbo's Daigoro (10) and Grothia's attack (10).
   */
  it("the shatter chance an ability's own data carries differs from its record's on these rows, and the record's is the one the engine reads", () => {
    const overridden: string[] = [];
    let added = 0;
    for (const a of ALL_ABILITIES) {
      if (!a.record) continue;
      const ours = a.shatterChance ?? 0;
      const game = a.record.shatter ?? 0;
      if (ours === game) continue;
      if (ours !== 0) overridden.push(`${a.id}: ${ours} -> ${game}`);
      else added += 1;
    }
    expect(overridden.sort()).toEqual([
      'guardian-blizzard: 10 -> 0',
      'guardian-thunder: 10 -> 0',
      'mortibody-blizzard: 10 -> 0',
      'mortibody-fire: 10 -> 0',
      'mortibody-thunder: 10 -> 0',
      'mortibody-water: 10 -> 0',
      'natus-flare: 10 -> 0',
    ]);
    expect(added).toBe(148);
  });

  it('the stage-buff mask has no bits above the six stacks, and an amount whenever it is set', () => {
    for (const row of statusFixture.rows) {
      expect(row[3] & ~0x3f, `0x${row[0].toString(16)}`).toBe(0);
      if (row[3] !== 0) expect(row[4], `0x${row[0].toString(16)}`).toBeGreaterThan(0);
    }
  });

  it("the statuses an ability's own data inflicts or removes differ from its record only where this list says so", () => {
    expect(statusDifferences().sort()).toEqual([...KNOWN_STATUS_DIFFERENCES].sort());
  });

  /**
   * The CTB rank of an ability is its record's rank byte (`attachCommandRecords`): the number the exe charges the recovery of. These are
   * the abilities whose own rank differed (a raw 0 counts as 3, the game's rule); `research/re-ffx-commands.md` section 7.3. The six
   * aeon Attack rows and `fury` (the menu marker) are never charged: the generic Attack serves every aeon, and the marker resolves to
   * one of the spells.
   */
  it('the abilities whose rank the record replaced are these 17, with ours and the exe\'s', () => {
    expect(RANK_CHANGES.map((c) => `${c.abilityId}: ${c.ours} -> ${c.game}`).sort()).toEqual(
      [
        'element-reels: 3 -> 4', 'attack-reels: 3 -> 4', 'status-reels: 3 -> 4', 'aurochs-reels: 3 -> 4', 'fury: 5 -> 3',
        'valefor-attack: 1 -> 3', 'ifrit-attack: 1 -> 3', 'ixion-attack: 1 -> 3', 'shiva-attack: 1 -> 3', 'bahamut-attack: 1 -> 3',
        'anima-attack: 1 -> 3', 'cindy-attack: 5 -> 3', 'sandy-attack: 5 -> 3', 'mindy-attack: 5 -> 3',
        'passado: 3 -> 5', 'mix: 6 -> 5', 'natus-flare: 5 -> 3',
      ].sort(),
    );
  });
});
