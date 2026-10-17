/**
 * Re-parity RC10, lane FFX boss data (FFX only): the six switches of `src/battle/ffx/boss-data-corrections.ts`, each held to the game's own monster record.
 *
 * The record bytes are `tests/fixtures/ffx-boss-records.json` (numbers read from the owner's install for FFX-H02, 32 records; `helpers/ffxBossData.ts`). This file proves:
 *  1. with every switch off nothing is read and nothing moves;
 *  2. each switch's table says exactly what the record says (every listed byte is in the record; nothing the record disagrees with is added);
 *  3. closure: with every switch on, every engine row that stands for a record equals it on the floored stats, the 24 status bytes (Regen through its flag), the five extra
 *     bits, the seven flags and the Zanmato level, except the rows listed in EXPECTED_RESIDUE (each a script write, with the reason).
 * `parity-ffx-boss-data-engine.test.ts` holds the engine side: the words the steps read, real casts, and the three differences the note lists that were already the game's.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { EnemyDef, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { cloneData } from '../../src/battle/common/clone.ts';
import {
  applyBossDataCorrections,
  BOSS_DATA_SWITCH_IDS,
  BOSS_DATA_SWITCHES,
  D1_FLOORS,
  D3_ZANMATO_LEVEL,
  D7_IMMUNE,
  D8_DOOMABLE,
  D9_LIFE_IMMUNE,
  D10_ROWS,
  setBossDataSwitches,
} from '../../src/battle/ffx/boss-data-corrections.ts';
import {
  ALL_ON, ALL_OFF, EXPECTED_RESIDUE, EXTRA_BITS, FLAG_BITS, FLOORED, MAP, RECORDS, ST, corrected, loadWorld, only, rec, statusByte, world,
} from './helpers/ffxBossData.ts';

const { groups, rows } = world;

beforeAll(loadWorld);

/** The switches as the module shipped them, read when this file is loaded (before any test or hook). */
const SHIPPED = { ...BOSS_DATA_SWITCHES };

afterEach(() => {
  for (const id of BOSS_DATA_SWITCH_IDS) BOSS_DATA_SWITCHES[id] = false;
});

describe('the switches', () => {
  it('are all off', () => {
    expect(BOSS_DATA_SWITCH_IDS).toEqual(['D1', 'D3', 'D7', 'D8', 'D9', 'D10']);
    for (const id of BOSS_DATA_SWITCH_IDS) expect(SHIPPED[id], id).toBe(false);
  });

  it('setBossDataSwitches puts every switch back as it was', () => {
    const restore = setBossDataSwitches({ D1: true, D7: true });
    expect(BOSS_DATA_SWITCHES.D1).toBe(true);
    expect(BOSS_DATA_SWITCHES.D3).toBe(false);
    restore();
    for (const id of BOSS_DATA_SWITCH_IDS) expect(BOSS_DATA_SWITCHES[id], id).toBe(false);
  });

  it('with every switch off the group is not read (a getter that throws is never reached) and equals itself', () => {
    const trap = {
      get enemies(): never {
        throw new Error('read');
      },
    } as unknown as EnemyGroupDef;
    expect(() => applyBossDataCorrections(trap, ALL_OFF)).not.toThrow();
    expect(() => applyBossDataCorrections(trap)).not.toThrow(); // the module's own switches, all off
    for (const g of groups) {
      const copy = cloneData(g);
      applyBossDataCorrections(copy, ALL_OFF);
      expect(JSON.stringify(copy)).toBe(JSON.stringify(g));
    }
  });

  it('with a switch on it does change the battle copy and never the module row', () => {
    const before = JSON.stringify([...rows.values()]);
    for (const id of BOSS_DATA_SWITCH_IDS) {
      const g = cloneData(groups[0] as EnemyGroupDef);
      applyBossDataCorrections(g, only(id));
    }
    expect(JSON.stringify([...rows.values()])).toBe(before);
  });
});

describe('every table is the record', () => {
  it('maps to records that exist and (where our row carries HP from the record) names the right monster', () => {
    for (const [id, m] of Object.entries(MAP)) {
      expect(RECORDS[String(m)], id).toBeDefined();
      expect(rows.has(id), id).toBe(true);
    }
    // the ids our files name: HP equality is the identity check for the rows that take HP from the record
    for (const id of ['seymour-flux', 'mortiorchis', 'seymour-natus', 'evrae', 'seymour-macalania', 'overdrive-sin', 'left-fin', 'right-fin', 'sinspawn-genais', 'sin-core', 'seymour-omnis', 'yu-yevon']) {
      const e = rows.get(id) as EnemyDef;
      expect(e.hp, id).toBe(rec(MAP[id] as number).hp);
    }
  });

  it('D1: every listed stat is 0 in the record and 0 in our row; with D1 it reads 1; nothing else moves', () => {
    for (const [id, keys] of Object.entries(D1_FLOORS)) {
      const row = rows.get(id) as EnemyDef;
      const m = rec(MAP[id] as number);
      const after = corrected(id, only('D1'));
      for (const k of keys) {
        expect(m[k], `${id} record ${k}`).toBe(0);
        expect(row.stats[k], `${id} ${k}`).toBe(0);
        expect(after.stats[k], `${id} ${k} after`).toBe(1);
      }
      for (const k of ['str', 'def', 'mag', 'mdef', 'agi', 'luck', 'acc', 'eva', 'maxHp', 'maxMp', 'hp', 'mp'] as const) {
        if (!(keys as readonly string[]).includes(k)) expect(after.stats[k], `${id} ${k} untouched`).toBe(row.stats[k]);
      }
      expect(after.immunities).toEqual(row.immunities);
      expect(after.zanmatoLevel).toBe(row.zanmatoLevel);
    }
  });

  it('D1: complete: every record-0 floored stat of a mapped row reads 1 once D1 is on (the residue rows aside)', () => {
    for (const [id, m] of Object.entries(MAP)) {
      const after = corrected(id, only('D1'));
      for (const k of FLOORED) {
        if ((EXPECTED_RESIDUE[id] ?? []).includes(`stat:${k}`)) continue;
        if (rec(m)[k] === 0) expect(after.stats[k], `${id} ${k}`).toBe(1);
      }
    }
  });

  it('D3: the level is the record byte plus 1 (Evrae 3 -> 4); a row with no level reads as byte 0', () => {
    for (const [id, level] of Object.entries(D3_ZANMATO_LEVEL)) {
      const row = rows.get(id) as EnemyDef;
      expect(rec(MAP[id] as number).zanmato + 1, id).toBe(level);
      expect(row.zanmatoLevel === undefined ? 1 : row.zanmatoLevel, `${id} before`).not.toBe(level);
      expect(corrected(id, only('D3')).zanmatoLevel, id).toBe(level);
    }
    expect(rows.get('evrae')?.zanmatoLevel).toBe(3);
    expect(rec(119).zanmato).toBe(3);
  });

  it('D7: Seymour Flux cannot be Slowed (byte 255); Haste stays landable (byte 0)', () => {
    expect(Object.keys(D7_IMMUNE)).toEqual(['seymour-flux']);
    expect(D7_IMMUNE['seymour-flux']).toEqual(['slow']);
    const flux = rec(142);
    expect(flux.status[ST.indexOf('slow')]).toBe(255);
    expect(flux.status[ST.indexOf('haste')]).toBe(0);
    expect(rows.get('seymour-flux')?.immunities.slow).toBeUndefined();
    const after = corrected('seymour-flux', only('D7'));
    expect(after.immunities.slow).toBe(255);
    expect(after.immunities.haste).toBeUndefined();
  });

  it('D8: Evrae has no Doom bit in the record (extra bit 14) and a Doom start of 30; D8 removes the immunity, nothing else', () => {
    for (const id of D8_DOOMABLE) {
      const m = rec(MAP[id] as number);
      expect((m.extraImm >> EXTRA_BITS.doom) & 1, id).toBe(0);
      expect(m.doomStart, id).toBe(30);
      const row = rows.get(id) as EnemyDef;
      expect(row.immunities.doom, `${id} before`).toBe(255);
      expect(row.doomTurns, id).toBe(30);
      const after = corrected(id, only('D8'));
      expect(after.immunities.doom).toBeUndefined();
      expect({ ...after.immunities, doom: 255 }).toEqual(row.immunities);
    }
  });

  it('D9: every listed row has the record\'s Life bit (f28 bit 2); D9 adds the flag and the table is complete', () => {
    for (const id of D9_LIFE_IMMUNE) {
      expect((rec(MAP[id] as number).f28 >> 2) & 1, id).toBe(1);
      expect((rows.get(id) as EnemyDef).immunityFlags, id).not.toContain('immune-to-life');
      expect(corrected(id, only('D9')).immunityFlags, id).toContain('immune-to-life');
    }
    for (const [id, m] of Object.entries(MAP)) {
      const has = corrected(id, only('D9')).immunityFlags.includes('immune-to-life');
      expect(has, id).toBe(((rec(m).f28 >> 2) & 1) === 1);
    }
  });

  it('D10: every immunity it adds is in the record, every one it removes is not, flags and EVA agree', () => {
    for (const [id, row] of Object.entries(D10_ROWS)) {
      const m = rec(MAP[id] as number);
      const before = rows.get(id) as EnemyDef;
      const after = corrected(id, only('D10'));
      for (const s of row.immune ?? []) {
        if (s in EXTRA_BITS) expect((m.extraImm >> EXTRA_BITS[s as keyof typeof EXTRA_BITS]) & 1, `${id} ${s}`).toBe(1);
        else expect(m.status[ST.indexOf(({ nulblaze: 'nul-blaze', nulfrost: 'nul-frost', nulshock: 'nul-shock', nultide: 'nul-tide' } as Record<string, (typeof ST)[number]>)[s] ?? (s as (typeof ST)[number]))], `${id} ${s}`).toBe(255);
        expect(after.immunities[s], `${id} ${s} after`).toBe(255);
      }
      for (const s of row.notImmune ?? []) {
        expect((m.extraImm >> EXTRA_BITS[s as keyof typeof EXTRA_BITS]) & 1, `${id} ${s}`).toBe(0);
        expect(before.immunities[s], `${id} ${s} before`).toBe(255);
        expect(after.immunities[s], `${id} ${s} after`).toBeUndefined();
      }
      for (const [flag, byte, bit] of FLAG_BITS) {
        if (row.flagsOn?.includes(flag)) expect((m[byte] >> bit) & 1, `${id} ${flag}`).toBe(1);
        if (row.flagsOff?.includes(flag)) expect((m[byte] >> bit) & 1, `${id} ${flag}`).toBe(0);
      }
      if (row.stats?.eva !== undefined) expect(m.eva).toBe(row.stats.eva);
    }
  });
});

describe('closure: with every switch on, the mapped rows are the records', () => {
  it('floored stats, 24 status bytes, five extra bits, seven flags and the Zanmato level', () => {
    const residue: string[] = [];
    for (const [id, mid] of Object.entries(MAP)) {
      const e = corrected(id, ALL_ON);
      const m = rec(mid);
      const diffs: string[] = [];
      for (const k of FLOORED) if (e.stats[k] !== Math.max(1, m[k])) diffs.push(`stat:${k}`);
      if (e.stats.eva !== m.eva) diffs.push('stat:eva');
      ST.forEach((s, i) => {
        if (s === 'threaten') return;
        if (statusByte(e, s) !== (m.status[i] as number)) diffs.push(`status:${s}`);
      });
      for (const [k, bit] of Object.entries(EXTRA_BITS)) if (((e.immunities[k as keyof EnemyDef['immunities']] ?? 0) >= 255 ? 1 : 0) !== ((m.extraImm >> bit) & 1)) diffs.push(`extra:${k}`);
      for (const [flag, byte, bit] of FLAG_BITS) if ((e.immunityFlags.includes(flag) ? 1 : 0) !== ((m[byte] >> bit) & 1)) diffs.push(`flag:${flag}`);
      if ((e.zanmatoLevel ?? 1) !== m.zanmato + 1) diffs.push('zanmato');
      const allowed = EXPECTED_RESIDUE[id] ?? [];
      const left = diffs.filter((d) => !allowed.includes(d));
      if (left.length > 0) residue.push(`${id}: ${left.join(', ')}`);
      for (const a of allowed) expect(diffs, `${id} residue ${a} must still be real`).toContain(a);
    }
    expect(residue).toEqual([]);
  });
});
