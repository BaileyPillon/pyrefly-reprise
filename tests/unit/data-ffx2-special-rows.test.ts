/**
 * The Special dresspheres' data against the game's own tables (FFX-2 only). `tests/fixtures/parity/ffx2/special_rows.json` holds, for each of the 99 commands on the nine parts' ladders, the numbers read from
 * the Steam HD build's `kernel/command.bin` row, with the part, the AP and the prerequisite from `kernel/job.bin` (`research/re-ffx2-special-dresspheres.md` section 4). The data's records, ability
 * definitions, game ids and ladders must equal them.
 */

import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/parity/ffx2/special_rows.json';
import { COMMAND_RECORDS_SPECIAL } from '../../src/data/ffx2/command-records/special.ts';
import { ABILITIES, SPECIAL_DRESSPHERES } from '../../src/data/ffx2/index.ts';
import { ABILITY_GAME_ID } from '../../src/battle/ffx2/adapt/game-ids.ts';
import { specialPartStats, ribbonWards } from '../../src/battle/ffx2/special/stats.ts';
import { FORMS } from '../../src/battle/ffx2/special/forms.ts';

type Row = { ability: string; special: string; part: string; name: string; mp: number; ap: number; prereq: number; row: Record<string, number>; status1: Record<string, number>; status2: Record<string, number>; statusTime: Record<string, number>; magicCancel: number };
const rows = fixture as unknown as Row[];

describe('the Special dresspheres\' commands are the game\'s rows', () => {
  it('99 commands, each ability once', () => {
    expect(rows).toHaveLength(99);
    expect(new Set(rows.map((r) => r.ability)).size).toBe(99);
    expect(Object.keys(COMMAND_RECORDS_SPECIAL)).toHaveLength(99);
  });

  it('every record, definition and game id equals the fixture row', () => {
    for (const r of rows) {
      const rec = COMMAND_RECORDS_SPECIAL[r.ability];
      expect(rec, r.ability).toBeDefined();
      for (const [k, v] of Object.entries(r.row)) expect((rec as unknown as Record<string, number>)[k], `${r.ability}.${k}`).toBe(v);
      expect(rec?.status1 ?? {}, `${r.ability} status1`).toEqual(r.status1);
      expect(rec?.status2 ?? {}, `${r.ability} status2`).toEqual(r.status2);
      expect(rec?.statusTime ?? {}, `${r.ability} statusTime`).toEqual(r.statusTime);
      expect(rec?.magicCancel ?? 0, `${r.ability} magicCancel`).toBe(r.magicCancel);
      const def = ABILITIES[r.ability];
      expect(def, r.ability).toBeDefined();
      expect(def?.name).toBe(r.name);
      expect(def?.mpCost, `${r.ability} MP`).toBe(r.mp);
      expect(def?.ffx2Record, `${r.ability} attached`).toBe(rec);
      expect(def?.power).toBe(r.row.power);
      expect(def?.hits).toBe(r.row.hits);
      expect(ABILITY_GAME_ID[r.ability], `${r.ability} game id`).toBe(r.row.id);
    }
  });

  it('the ladders carry each command with its AP, its prerequisite and its free flag', () => {
    const byPart = new Map<string, Row[]>();
    for (const r of rows) byPart.set(`${r.special}:${r.part}`, [...(byPart.get(`${r.special}:${r.part}`) ?? []), r]);
    for (const [id, special] of Object.entries(SPECIAL_DRESSPHERES)) {
      const ladders = [
        { part: `${id}-main`, entries: special.abilities.main, key: 'main' },
        { part: special.partIds.podA, entries: special.abilities.podA, key: 'podA' },
        { part: special.partIds.podB, entries: special.abilities.podB, key: 'podB' },
      ];
      for (const l of ladders) {
        const expected = byPart.get(`${id}:${l.part === `${id}-main` ? 'main' : l.part}`) ?? [];
        expect(l.entries.map((e) => e.abilityId), l.part).toEqual(expected.map((r) => r.ability));
        for (const e of l.entries) {
          const r = expected.find((x) => x.ability === e.abilityId) as Row;
          expect(e.apCost, `${e.abilityId} AP`).toBe(r.ap);
          expect(e.free === true, `${e.abilityId} free`).toBe(r.prereq === 0);
          expect(e.prereq !== undefined, `${e.abilityId} has a prerequisite ability`).toBe(r.prereq >= 0x3000 && r.prereq < 0x4000);
        }
      }
    }
  });

  it('the three finishers keep the ids the portraits read, with the game\'s power and hits', () => {
    expect(COMMAND_RECORDS_SPECIAL['x2-floral-fallal-great-whirl']).toMatchObject({ id: 0x3118, power: 8, hits: 12, costCast: 120 });
    expect(COMMAND_RECORDS_SPECIAL['x2-machina-maw-vajra']).toMatchObject({ id: 0x3139, power: 80, hits: 1, costCast: 120 });
    expect(COMMAND_RECORDS_SPECIAL['x2-full-throttle-sword-dance']).toMatchObject({ id: 0x3159, power: 48, hits: 2, costCast: 120 });
  });
});

describe('the parts\' stats are the game\'s growth rows with the grid scale', () => {
  it('the research note\'s worked example: Floral Fallal at level 20 on a 6-node grid is HP 1,971 and MP 225 (1,590 x 31 / 25, 182 x 31 / 25)', () => {
    const s = specialPartStats(FORMS['floral-fallal'].main.job, 20, 6, []);
    expect(s.maxHp).toBe(1971);
    expect(s.maxMp).toBe(225);
  });

  it('the scale is 1.08 at two nodes and 1.24 at six, on HP, MP and the four named stats, and nothing else', () => {
    const two = specialPartStats(0x5015, 50, 2, []);
    const six = specialPartStats(0x5015, 50, 6, []);
    expect(two.maxHp).toBe(Math.trunc((3554 * 27) / 25)); // statTen@50 HP 3554 for Full Throttle (job.bin 0x5015 row)
    expect(six.maxHp).toBe(Math.trunc((3554 * 31) / 25));
    expect([two.agi, two.acc, two.eva, two.luck]).toEqual([six.agi, six.acc, six.eva, six.luck]);
  });

  it('Ribbon (row 0x8068) wards Eject at 255 by data, and Doom, and Slow and Stop', () => {
    const wards = ribbonWards();
    expect(wards.eject).toBe(255);
    expect(wards.doom).toBe(255);
    expect(wards.slow).toBe(255);
    expect(wards.stop).toBe(255);
    expect(wards.ko).toBeUndefined();
  });
});
