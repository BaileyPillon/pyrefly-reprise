/**
 * B6 (t1-b3a's finding): the FFX-2 intent printed "Hp" where the FFX one says "HP"
 * ("Max HP x2", not "Max Hp X2"; FFX fixed it for PR-0074 in `src/battle/ffx/intent.ts`).
 *
 * Game case: FFX-2 only (this is the ATB engine's intent text; FFX's is already right).
 */

import { describe, expect, it } from 'vitest';
import { describeAbility, statusWord } from '../../src/battle/ffx2/intent.ts';
import * as data from '../../src/data/ffx2/index.ts';
import type { AbilityDef } from '../../src/battle/common/types.ts';

describe('FFX-2 intent: status words keep HP and MP in capitals', () => {
  it('spells the words the way the FFX panel does', () => {
    expect(statusWord('max-hp-x2')).toBe('Max HP x2');
    expect(statusWord('mp-down')).toBe('MP Down');
    expect(statusWord('ko')).toBe('Death');
    expect(statusWord('mag-down')).toBe('Mag Down');
  });

  it('no FFX-2 ability sentence prints "Hp" or "Mp"', () => {
    const bad: string[] = [];
    for (const def of Object.values(data.ABILITIES) as AbilityDef[]) {
      const text = describeAbility(def);
      if (/\b(Hp|Mp)\b/.test(text)) bad.push(`${def.id}: ${text}`);
    }
    expect(bad).toEqual([]);
  });
});
