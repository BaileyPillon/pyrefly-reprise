/**
 * Lane FFX-K, slice K3 (re-parity RC8; **FFX only**; FFX-G08 row D6, `research/re-ffx-battle-entry.md` section 4): Yojimbo's command roll names the Wakizashi on
 * one target `0x30E0` and the Wakizashi on all targets `0x30E1` (emulated, 57,839 vectors of the roll). The player catalogue's `wakizashi-multi` carried
 * `0x30E0` by mistake (its own comment said "same fields as 0x30e1"). The two rows of the game's table carry the same fields, so the id is the only
 * thing that differs; no code branches on either id by value (`reach.ts`, `ai/command-formula.ts` and `target-build.ts` name neither), so no behaviour moves.
 *
 * The 979 records of `command_records.json` are the game's kernel table (numbers only); `data-ffx-command-records.test.ts` pins every attached record to its
 * row, which now finds `wakizashi-multi` under its own id.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { COMMAND_RECORDS } from '../../src/data/ffx/command-records/index.ts';
import { REACH_ZERO_COMMANDS } from '../../src/battle/ffx/reach.ts';

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

describe('the Wakizashi on one target and on all targets (FFX-G08 D6)', () => {
  it('pins both ids: the single is 0x30E0, the all-target is 0x30E1', () => {
    expect(COMMAND_RECORDS['wakizashi-single']!.id).toBe(0x30e0);
    expect(COMMAND_RECORDS['wakizashi-multi']!.id).toBe(0x30e1);
  });

  it("each equals its own row of the game's table, and the two rows carry the same fields", () => {
    const rows = [0x30e0, 0x30e1].map((id) => GAME.get(id));
    expect(rows[0], 'row 0x30E0').toBeDefined();
    expect(rows[1], 'row 0x30E1').toBeDefined();
    for (const name of ['type', 'flagsMisc', 'flagsDamage', 'damageClass', 'shatter', 'power', 'hits', 'element']) {
      expect(field(rows[1]!, name), name).toBe(field(rows[0]!, name));
    }
    for (const [abilityId, id] of [['wakizashi-single', 0x30e0], ['wakizashi-multi', 0x30e1]] as const) {
      const record = COMMAND_RECORDS[abilityId]!;
      const row = GAME.get(id)!;
      expect([record.type, record.flagsMisc, record.flagsDamage, record.damageClass, record.shatter], abilityId).toEqual(
        [field(row, 'type'), field(row, 'flagsMisc'), field(row, 'flagsDamage'), field(row, 'damageClass'), field(row, 'shatter')],
      );
    }
  });

  it('no behaviour keys on either id: neither is in the reach-0 set, so changing the id moves no reach', () => {
    expect(REACH_ZERO_COMMANDS.has(0x30e0)).toBe(false);
    expect(REACH_ZERO_COMMANDS.has(0x30e1)).toBe(false);
  });
});
