/**
 * PR-0188 (critic round 13, R12-UI-02, FFX Chapter IX): the intent card described Yojimbo's
 * Daigoro order as "non-elemental damage to itself - never misses.", a lower-case start and a
 * claim the row does not make: it is an order to the dog (`ordersActor: 'daigoro'`), no damage.
 * The dog's own bite is a separate record and still reads as damage.
 *
 * Game case: FFX only (Chapter IX; `src/battle/ffx/intent.ts`).
 */

import { describe, expect, it } from 'vitest';
import { describeAbility } from '../../src/battle/ffx/intent.ts';
import { YOJIMBO_ABILITIES, YOJIMBO_DAIGORO_ORDER, DAIGORO_ATTACK } from '../../src/data/ffx/enemies/yojimbo-abilities.ts';
import { describeAbility as describeFfx2 } from '../../src/battle/ffx2/intent.ts';
import * as FFX2 from '../../src/data/ffx2/index.ts';
import type { AbilityDef } from '../../src/battle/common/types.ts';

describe('PR-0188: the Daigoro order reads as an order', () => {
  const order = YOJIMBO_ABILITIES[YOJIMBO_DAIGORO_ORDER]!;
  const bite = YOJIMBO_ABILITIES[DAIGORO_ATTACK]!;

  it('never says "damage to itself", and starts with a capital', () => {
    const text = describeAbility(order);
    expect(text).not.toMatch(/damage to itself/i);
    expect(text).toMatch(/^[A-Z]/);
  });

  it('every Chapter IX sentence starts with a capital', () => {
    for (const def of Object.values(YOJIMBO_ABILITIES)) {
      expect(describeAbility(def), def.id).toMatch(/^[A-Z]/);
    }
  });

  it("the dog's own bite still reads as damage", () => {
    expect(describeAbility(bite)).toMatch(/damage/i);
  });

  it('no FFX-2 intent sentence starts in lower case either (the same sentence builder, CHK-020)', () => {
    const bad: string[] = [];
    for (const def of Object.values(FFX2.ABILITIES) as AbilityDef[]) {
      const text = describeFfx2(def);
      if (!/^[A-Z]/.test(text)) bad.push(`${def.id}: ${text}`);
    }
    expect(bad).toEqual([]);
  });
});
