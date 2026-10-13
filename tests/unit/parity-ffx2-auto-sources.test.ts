/**
 * Where a girl's auto-ability rows come from, pinned to the game's own tables (re-parity X2-D; **FFX-2 only**).
 *
 * `adapt/auto-rows.ts` pairs the engine's ids (dresspheres, abilities, accessories) with the game's rows. The pairing is written from
 * note FFX2-G04 sections 3.4 and 3.5 and the research note `re-ffx2-dressphere.md`; this file checks it against the numbers the
 * kernels hold from the game's files (`job.bin`, `accessory.bin`, `a_ability.bin`), so a wrong id shows as a difference:
 *
 * - the dresspheres' ids and the Attack command each runs (the research table, 1.3);
 * - every row an engine ability is paired with is in the job pairs of the dressphere that owns the ability, and the engine's own
 *   prerequisite of that ability is the game's prerequisite of the pair;
 * - the accessory table is exactly the 16 accessory rows that carry a kept or SOS row, as a multiset of rows, and the two accessories
 *   whose stat lines are known (Adamantite, Bloodlust) are the rows they should be;
 * - the rows themselves are what the note says (kept or SOS, which statuses).
 */

import { describe, expect, it } from 'vitest';
import { AUTO_ROWS_OF_ACCESSORY, AUTO_ROW_OF_ABILITY, JOB_OF_DRESSPHERE } from '../../src/battle/ffx2/adapt/auto-rows.ts';
import { accessoryEffect } from '../../src/battle/ffx2/accessories.ts';
import { abilityEffects } from '../../src/battle/ffx2/kernel/ability-effects-data.ts';
import { FFX2_JOB_ABILITIES } from '../../src/battle/ffx2/kernel/dressphere-grids.ts';
import { jobGrowth } from '../../src/battle/ffx2/kernel/dressphere-growth.ts';
import { accessoryRow } from '../../src/battle/ffx2/kernel/dressphere-rows.ts';
import { effectiveStatuses } from '../../src/battle/ffx2/adapt/auto-layer.ts';
import { applyAbilityEffects, emptyChrTables } from '../../src/battle/ffx2/kernel/ability-effects.ts';
import { FFX2_COMMAND_RECORDS } from '../../src/data/ffx2/command-records/index.ts';
import { STANDARD_DRESSPHERES } from '../../src/data/ffx2/dresspheres/index.ts';

describe('the dresspheres (research/re-ffx2-dressphere.md 1.3)', () => {
  // The table's own Attack command column, written out again here.
  const ATTACK: Record<string, number> = {
    gunner: 0x302c, 'gun-mage': 0x302c, alchemist: 0x302c, warrior: 0x302d, samurai: 0x302d, 'dark-knight': 0x302d, berserker: 0x302d,
    songstress: 0x302d, 'black-mage': 0x302c, 'white-mage': 0x302c, thief: 0x302e, trainer: 0x302f, 'lady-luck': 0x302c, mascot: 0x302d,
  };

  it('each engine dressphere is the job whose Attack command the table prints', () => {
    expect(Object.keys(JOB_OF_DRESSPHERE).sort()).toEqual(Object.keys(ATTACK).sort());
    for (const [name, job] of Object.entries(JOB_OF_DRESSPHERE)) expect(jobGrowth(job)?.attackCommand, name).toBe(ATTACK[name]);
  });

  it('and the ids run in the table\'s order from 0x5001', () => {
    expect(JOB_OF_DRESSPHERE['gunner']).toBe(0x5001);
    expect(JOB_OF_DRESSPHERE['berserker']).toBe(0x5007);
    expect(JOB_OF_DRESSPHERE['mascot']).toBe(0x500e);
    expect(new Set(Object.values(JOB_OF_DRESSPHERE)).size).toBe(Object.keys(JOB_OF_DRESSPHERE).length);
  });
});

describe('the abilities (job.bin pairs)', () => {
  const dressphereOf = (abilityId: string): string => {
    for (const [name, def] of Object.entries(STANDARD_DRESSPHERES)) if (def?.abilities.some((a) => a.abilityId === abilityId)) return name;
    throw new Error(`no dressphere lists ${abilityId}`);
  };

  it('every paired row is in the pairs of the dressphere that owns the ability, with the same prerequisite', () => {
    for (const [abilityId, row] of Object.entries(AUTO_ROW_OF_ABILITY)) {
      const sphere = dressphereOf(abilityId);
      const pairs = FFX2_JOB_ABILITIES[(JOB_OF_DRESSPHERE[sphere] as number) & 0xfff] as readonly number[];
      let pre: number | undefined;
      for (let k = 0; k < 16; k++) if (pairs[2 * k + 1] === row) pre = pairs[2 * k];
      expect(pre, `${abilityId} -> 0x${row.toString(16)} in ${sphere}`).toBeDefined();
      const entry = STANDARD_DRESSPHERES[sphere as keyof typeof STANDARD_DRESSPHERES]!.abilities.find((a) => a.abilityId === abilityId)!;
      if (pre === 1) {
        expect(entry.prereq, `${abilityId} has no prerequisite in the game (a level 1 test)`).toBeUndefined();
      } else if ((pre as number) >> 12 === 8) {
        expect(entry.prereq, abilityId).toBeDefined();
        expect(AUTO_ROW_OF_ABILITY[entry.prereq as string], `${abilityId}: the engine's prerequisite is the game's row`).toBe(pre);
      } else {
        // a command: the engine's prerequisite is an ability of the same dressphere; where the engine has the command's row its id is the game's
        expect(entry.prereq, abilityId).toBeDefined();
        const record = FFX2_COMMAND_RECORDS[entry.prereq as string];
        if (record !== undefined) expect(record.id, `${abilityId}: prerequisite ${entry.prereq}`).toBe(pre);
      }
    }
  });

  it('the Warrior\'s Sentinel is the command 0x3064 the pair for SOS Protect needs', () => {
    expect(FFX2_COMMAND_RECORDS['x2-warrior-sentinel']?.id).toBe(0x3064);
  });
});

describe('the accessories (note FFX2-G04 3.4)', () => {
  it('are exactly the 16 accessory rows that carry a kept or SOS row, as a multiset of rows', () => {
    const fromGame: number[] = [];
    const index: Record<number, number[]> = {};
    for (let i = 0; i < 128; i++) {
      for (const [, id] of accessoryRow(0x9000 + i).abilities) {
        const e = id === 0 ? undefined : abilityEffects(id);
        if (e !== undefined && (e.auto1 !== 0 || e.auto2 !== 0)) {
          fromGame.push(id);
          (index[i] ??= []).push(id);
        }
      }
    }
    expect(Object.keys(index)).toHaveLength(16);
    const ours = Object.values(AUTO_ROWS_OF_ACCESSORY).flat();
    expect(Object.keys(AUTO_ROWS_OF_ACCESSORY)).toHaveLength(16);
    expect([...ours].sort((a, b) => a - b)).toEqual([...fromGame].sort((a, b) => a - b));
  });

  it('Adamantite (HP +100%, Defense +120, Magic Defense +120, Agility -30) is the Auto-Wall row, and Bloodlust (HP -40%, Strength +60) Kijo\'s Soul', () => {
    const find = (up: readonly number[]): number[] => {
      const hits: number[] = [];
      for (let i = 0; i < 128; i++) if (accessoryRow(0x9000 + i).up.every((v, k) => v === up[k])) hits.push(i);
      return hits;
    };
    const adamantite = find([100, 0, 0, 120, 0, 120, -30, 0, 0, 0]);
    expect(adamantite).toHaveLength(1);
    expect(accessoryRow(0x9000 + (adamantite[0] as number)).abilities.map(([, id]) => id)).toContain(AUTO_ROWS_OF_ACCESSORY['adamantite']![0]);
    // the engine's stat half of Adamantite is the same row (accessories.ts)
    expect(accessoryEffect('adamantite')).toMatchObject({ hpPercent: 1, stats: { def: 120, mdef: 120, agi: -30 } });
    const bloodlust = find([-40, -40, 60, 0, -50, -50, 0, 0, 0, 0]);
    expect(bloodlust).toHaveLength(1);
    expect(accessoryRow(0x9000 + (bloodlust[0] as number)).abilities.map(([, id]) => id)).toContain(AUTO_ROWS_OF_ACCESSORY['bloodlust']![0]);
  });
});

describe('the rows (a_ability.bin through the kernel tables), as the note\'s 3.4 lists them', () => {
  const held = (...rows: number[]): { kept: string[]; sos: string[] } => {
    const t = applyAbilityEffects(rows, emptyChrTables());
    return { kept: effectiveStatuses(t.autoMask1 >>> 0, t.autoTimes), sos: effectiveStatuses(t.sosMask1 >>> 0, t.sosTimes) };
  };

  it('the Auto rows keep their status for good (count 126) and are not SOS rows', () => {
    expect(held(0x806a)).toEqual({ kept: ['shell'], sos: [] });
    expect(held(0x806b)).toEqual({ kept: ['protect'], sos: [] });
    expect(held(0x806c)).toEqual({ kept: ['shell', 'protect'], sos: [] });
    expect(held(0x806d)).toEqual({ kept: ['reflect'], sos: [] });
    expect(held(0x806e)).toEqual({ kept: ['regen'], sos: [] });
    expect(held(0x806f)).toEqual({ kept: ['haste'], sos: [] });
    expect(held(0x8069)).toEqual({ kept: ['slow'], sos: [] });
    expect(held(0x8070)).toEqual({ kept: ['guaranteed-critical'], sos: [] });
    expect(held(0x8071)).toEqual({ kept: ['spellspring'], sos: [] });
  });

  it('Kijo\'s Soul keeps Poison and Berserk, Majo\'s Soul Poison and Haste, row 0x809c group 1 bit 16', () => {
    expect(held(0x8095)).toEqual({ kept: ['poison', 'berserk'], sos: [] });
    expect(held(0x8096).kept.sort()).toEqual(['haste', 'poison']);
    expect(held(0x809c)).toEqual({ kept: ['pointless'], sos: [] });
  });

  it('the SOS rows fill the SOS set and nothing else', () => {
    expect(held(0x8075)).toEqual({ kept: [], sos: ['protect'] });
    expect(held(0x8077)).toEqual({ kept: [], sos: ['regen'] });
    expect(held(0x8078)).toEqual({ kept: [], sos: ['haste'] });
    expect(held(0x807b)).toEqual({ kept: [], sos: ['guaranteed-critical'] });
    expect(held(0x809b)).toEqual({ kept: [], sos: ['shell', 'protect'] });
  });

  it('Cat Nip\'s SOS row is Berserk, Damage 9999 and Slow together (the wiki\'s "Auto-Slow and Auto-Berserk" does not hold: nothing is kept)', () => {
    const cat = held(0x807a);
    expect(cat.kept).toEqual([]);
    expect(cat.sos.sort()).toEqual(['berserk', 'damage-9999', 'slow']);
  });

  it('the counters are ability-word bits only: no status is kept', () => {
    for (const row of [0x8002, 0x8003, 0x8004]) expect(held(row)).toEqual({ kept: [], sos: [] });
  });
});
