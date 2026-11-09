/**
 * The hidden Shinryu's machinery is absent from every other battle (FFX only; the review of 2026-11-08, MINOR 7, the cheap form of the Keeper lane's `sanctuary-keeper-absence.test.ts`). Shinryu's script writes no state
 * and keeps no flag (`battle/ffx/ai/shinryu.ts`), so what could leak is shared: the script id, the combatant id, the three `shinryu-*` rows, the one formula-byte override (`0x40f6`, `FORMULA_BYTE_OVERRIDES`) and the
 * water rule (`inWater`, the Flooded Ways' and the Via Purifico's). For every other formation in the data layer: nothing names the script, the combatant or a row, nothing else carries the command id `0x40f6`, and
 * the water flag is set on the formations that had it before plus this one. The full unit suite is the proof that every other chapter's log is unchanged. FFX-2 and FF7 have no part in it.
 */

import { describe, expect, it } from 'vitest';
import '../../../src/battle/ffx/index.ts'; // registers the scripts (a side effect of the engine's index)
import { registeredAiScriptIds } from '../../../src/battle/ffx/ai/types.ts';
import { registeredHookScriptIds } from '../../../src/battle/ffx/ai/hooks.ts';
import { FORMULA_BYTE_OVERRIDES } from '../../../src/battle/ffx/ai/command-formula.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { COMMAND_RECORDS } from '../../../src/data/ffx/command-records/index.ts';
import { SHINRYU_GROUP_ID, SHINRYU_ID, SHINRYU_ROWS, SHINRYU_SCRIPT } from '../../../src/data/ffx/shinryu-ids.ts';

const others = Object.entries(ENEMY_GROUPS_BY_ID).filter(([id]) => id !== SHINRYU_GROUP_ID);
const ERASER_COMMAND = 0x40f6;
const ROW_IDS: readonly string[] = Object.values(SHINRYU_ROWS);

describe("no other formation gets Shinryu's script, combatant or rows", () => {
  it('there are other formations to look at', () => {
    expect(others.length).toBeGreaterThan(30);
  });

  it('the script id is registered once, with its hit hook, and only the dragon names it', () => {
    expect(registeredAiScriptIds().filter((id) => id === SHINRYU_SCRIPT)).toHaveLength(1);
    expect(registeredHookScriptIds()).toContain(SHINRYU_SCRIPT);
    for (const [id, group] of others) {
      for (const e of [...group.enemies, ...(group.parts ?? [])]) {
        expect(e.aiScriptId, `${id}: ${e.id}`).not.toBe(SHINRYU_SCRIPT);
        expect(e.id, `${id}: the combatant id`).not.toBe(SHINRYU_ID);
        for (const f of e.forms) expect(f.aiScriptId, `${id}: ${e.id} form`).not.toBe(SHINRYU_SCRIPT);
        for (const a of e.abilityIds) expect(ROW_IDS, `${id}: ${e.id} uses ${a}`).not.toContain(a);
      }
    }
  });

  it('the three rows exist once each in the ability list, and no other row is named shinryu-*', () => {
    for (const row of ROW_IDS) expect(ALL_ABILITIES.filter((a) => a.id === row), row).toHaveLength(1);
    expect(ALL_ABILITIES.filter((a) => a.id.startsWith('shinryu-')).map((a) => a.id).sort()).toEqual([...ROW_IDS].sort());
  });

  it('the formula-byte override for 0x40f6 has one FFX user: the Eraser row (the FFX-2 row of the same id lives in its own table)', () => {
    expect(FORMULA_BYTE_OVERRIDES[ERASER_COMMAND]).toBe(3);
    const users = Object.entries(COMMAND_RECORDS).filter(([, rec]) => rec.id === ERASER_COMMAND).map(([key]) => key);
    expect(users).toEqual([SHINRYU_ROWS.eraser]);
  });

  it('the water flag is on the four Flooded Ways formations and this one, and on no other', () => {
    const water = Object.entries(ENEMY_GROUPS_BY_ID).filter(([, g]) => g.inWater === true).map(([id]) => id).sort();
    expect(water).toEqual(['flooded-area-1', 'flooded-area-2', 'flooded-area-3', 'flooded-geosgaeno', SHINRYU_GROUP_ID].sort());
  });
});
