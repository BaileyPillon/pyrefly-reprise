/**
 * **The Last Summoning's record fixes** (the hidden chapter 28; **FFX only**): the possessed Yojimbo's and Magus Sisters' records against the game's own rows.
 *
 * `research/re-ffx-last-summoning.md` section 1.4 and 4 (the RE session's read of the game's files, `[bytes]`) lists what the first build had wrong; `tests/fixtures/parity/ffx/command_records.json` holds the
 * game's 979 command records, so every number here is compared with a ROW, not with a literal that could be edited to match a regression:
 *
 *  - Kozuka 0x60E0 and Wakizashi 0x60E1: formula 1, power 14, one hit, shatter 0, rank 3, accuracy formula 0; no Daigoro, no plain Attack;
 *  - Zanmato 0x60E2: formula 6 (a fixed `power x 50`), power 200: 9,999 on each front-line actor, not Death;
 *  - Camisade 0x30E5 and Razzia 0x30E7 (the command-table rows the scripts call): power 21, rank 5, shatter 30, one target;
 *  - Delta Attack 0x60E6: formula 15, power 10, six hits; Passado 0x60E5: 2 x 15;
 *  - Cindy's Drain (0x3050) and Mindy's Flare (0x3052) are the player's own rows;
 *  - the Zanmato bytes (the data's `zanmatoLevel` is the byte plus 1): possessed Valefor to Yojimbo 2, the Sisters 3.
 *
 * Chapter III never builds any of these (its chain is the five mandatory aeons): `last-summoning-iii-pin.test.ts` is the proof that its twelve seeds did not move.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';
import { COMMAND_RECORDS } from '../../../src/data/ffx/command-records/index.ts';
import { FORMULA_NUMBER } from '../../../src/battle/ffx/adapt/command.ts';
import { buildPossessedAeonChain } from '../../../src/data/ffx/enemies/braskas-final-aeon.ts';
import { possessionGroup } from '../../../src/data/ffx/enemies/last-summoning-chain.ts';

interface Fixture {
  columns: string[];
  rows: number[][];
}
const fixture = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx/command_records.json', import.meta.url)), 'utf8')) as Fixture;
const COL = Object.fromEntries(fixture.columns.map((name, i) => [name, i])) as Record<string, number>;
const GAME = new Map(fixture.rows.map((row) => [row[0] as number, row]));
const field = (row: number[], name: string): number => row[COL[name] as number] as number;
const ABILITIES_BY_ID: Readonly<Record<string, (typeof ALL_ABILITIES)[number]>> = Object.fromEntries(ALL_ABILITIES.map((a) => [a.id, a]));

/** The note's table, one row a move: ability id, the game's record id, formula number, power, hits, rank, shatter, accuracy formula 0 (always hits). */
const ROWS: ReadonlyArray<readonly [string, number, number, number, number, number, number]> = [
  ['possessed-yojimbo-kozuka', 0x60e0, 1, 14, 1, 3, 0],
  ['possessed-yojimbo-wakizashi', 0x60e1, 1, 14, 1, 3, 0],
  ['possessed-yojimbo-zanmato', 0x60e2, 6, 200, 1, 3, 0],
  ['possessed-cindy-camisade', 0x30e5, 1, 21, 1, 5, 30],
  ['possessed-sandy-razzia', 0x30e7, 1, 21, 1, 5, 30],
  ['possessed-mindy-passado', 0x60e5, 1, 2, 15, 3, 0],
  ['possessed-cindy-delta-attack', 0x60e6, 15, 10, 6, 3, 0],
];

describe("the possessed Yojimbo's and Sisters' abilities are the game's rows", () => {
  it.each(ROWS)('%s is its game record and carries the numbers of its row', (id, recordId, formula, power, hits, rank, shatter) => {
    const def = ABILITIES_BY_ID[id];
    expect(def, `${id} exists`).toBeDefined();
    const row = GAME.get(recordId)!;
    expect(row, `the game's table has 0x${recordId.toString(16)}`).toBeDefined();
    // the attached record is that row, word for word
    const record = COMMAND_RECORDS[id]!;
    expect([record.id, record.type, record.flagsMisc, record.flagsDamage, record.damageClass]).toEqual([recordId, field(row, 'type'), field(row, 'flagsMisc'), field(row, 'flagsDamage'), field(row, 'damageClass')]);
    // the row's own numbers, and ours against the note's table and the row
    expect([field(row, 'formula'), field(row, 'power'), field(row, 'hits'), field(row, 'shatter'), field(row, 'accuracy')]).toEqual([formula, power, hits, shatter, 0]);
    expect([FORMULA_NUMBER[def!.formula], def!.power, def!.hits, def!.rank, def!.shatterChance ?? 0]).toEqual([formula, power, hits, rank, shatter]);
    // accuracy formula 0 (bits 3 to 5 of the misc word): the row always hits, and our record says so too (hard rule 5)
    expect((field(row, 'flagsMisc') >>> 3) & 7).toBe(0);
    expect(def!.canMiss).toBe(false);
  });

  it('the Zanmato of the possessed Yojimbo is a fixed damage command on the front line, with no status and no Death', () => {
    const z = ABILITIES_BY_ID['possessed-yojimbo-zanmato']!;
    expect([z.formula, z.damageType, z.targeting, z.statusEffects]).toEqual(['fixed-no-variance', 'other', 'all-enemies', []]);
    // 200 x 50 = 10,000, cut to the 9,999 cap (the row has no Break Damage Limit flag)
    expect(z.power * 50).toBe(10_000);
    expect(z.flags).not.toContain('always-break-damage-limit');
  });

  it('Kozuka and Wakizashi pierce Armored and can crit; both are Strength against Defense on one target', () => {
    for (const id of ['possessed-yojimbo-kozuka', 'possessed-yojimbo-wakizashi']) {
      const def = ABILITIES_BY_ID[id]!;
      expect([def.formula, def.damageType, def.targeting]).toEqual(['strength', 'physical', 'single-enemy']);
      expect(def.flags).toEqual(expect.arrayContaining(['piercing', 'crit-eligible']));
      expect(COMMAND_RECORDS[id]!.flagsMisc & 0x4000000, `${id}: the record's pierce-Armored bit`).not.toBe(0);
    }
  });

  it('Razzia is one target (the first build aimed it at the whole party) and Camisade is power 21 at rank 5 (the first build: 30 at 3)', () => {
    expect(ABILITIES_BY_ID['possessed-sandy-razzia']!.targeting).toBe('single-enemy');
    expect([ABILITIES_BY_ID['possessed-cindy-camisade']!.power, ABILITIES_BY_ID['possessed-cindy-camisade']!.rank]).toEqual([21, 5]);
  });

  it("the joint-action token is ours: no game record, no damage, no status, aimed at an ally", () => {
    const token = ABILITIES_BY_ID['possessed-sisters-token']!;
    expect(COMMAND_RECORDS['possessed-sisters-token']).toBeUndefined();
    expect([token.formula, token.power, token.statusEffects, token.targeting]).toEqual(['none', 0, [], 'single-ally']);
  });
});

describe('what each possessed body can use', () => {
  const abilitiesOf = (id: string): string[] => buildPossessedAeonChain([id.replace('possessed-', '') as 'yojimbo']).flatMap((g) => g.enemies).find((e) => e.id === id)?.abilityIds ?? [];

  it('Yojimbo has Kozuka, Wakizashi and Zanmato: no Daigoro and no plain Attack', () => {
    expect(abilitiesOf('possessed-yojimbo')).toEqual(['possessed-yojimbo-kozuka', 'possessed-yojimbo-wakizashi', 'possessed-yojimbo-zanmato']);
    expect(ABILITIES_BY_ID['possessed-yojimbo-daigoro']).toBeUndefined();
    const yojimbo = buildPossessedAeonChain(['yojimbo']).flatMap((g) => g.enemies).find((e) => e.id === 'possessed-yojimbo')!;
    expect(yojimbo.plainAttack).toBeUndefined();
  });

  it('Cindy adds Drain, Mindy adds Flare, and Sandy and Mindy carry the token (the player\'s own Drain, Flare, Curaga, Haste and Reflect rows)', () => {
    const sisters = possessionGroup(['sisters']).enemies;
    const of = (id: string): string[] => sisters.find((e) => e.id === id)!.abilityIds;
    expect(of('possessed-cindy')).toEqual(['possessed-cindy-camisade', 'possessed-cindy-delta-attack', 'curaga', 'drain']);
    expect(of('possessed-sandy')).toEqual(['possessed-sandy-razzia', 'haste', 'reflect', 'possessed-sisters-token']);
    expect(of('possessed-mindy')).toEqual(['possessed-mindy-passado', 'flare', 'possessed-sisters-token']);
    for (const shared of ['drain', 'flare', 'curaga', 'haste', 'reflect']) {
      const def = ABILITIES_BY_ID[shared]!;
      expect(def.record, `${shared} carries the game's row`).toBeDefined();
    }
    // the shared rows are the ones the note lists (Drain 0x3050 power 20 rank 2, Flare 0x3052 power 60 rank 5, Curaga 0x302D power 80)
    expect([ABILITIES_BY_ID['drain']!.record!.id, ABILITIES_BY_ID['drain']!.power, ABILITIES_BY_ID['drain']!.rank]).toEqual([0x3050, 20, 2]);
    expect([ABILITIES_BY_ID['flare']!.record!.id, ABILITIES_BY_ID['flare']!.power, ABILITIES_BY_ID['flare']!.rank]).toEqual([0x3052, 60, 5]);
    expect([ABILITIES_BY_ID['curaga']!.record!.id, ABILITIES_BY_ID['curaga']!.power]).toEqual([0x302d, 80]);
  });

  it('the Zanmato bytes: possessed Valefor to Yojimbo hold byte 2 (level 3), the Sisters byte 3 (level 4)', () => {
    const levels = new Map(buildPossessedAeonChain(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'magus-sisters']).flatMap((g) => g.enemies).filter((e) => e.id.startsWith('possessed-')).map((e) => [e.id, e.zanmatoLevel]));
    for (const id of ['possessed-valefor', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-bahamut', 'possessed-anima', 'possessed-yojimbo']) expect(levels.get(id), id).toBe(3);
    for (const id of ['possessed-cindy', 'possessed-sandy', 'possessed-mindy']) expect(levels.get(id), id).toBe(4);
  });
});
