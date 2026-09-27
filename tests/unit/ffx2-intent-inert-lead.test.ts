/**
 * iter2-b6 CHECK blockers B6CHK-01 and B6CHK-02: PR-0188's "inert" branch in the FFX-2 sentence
 * builder made two enemy intent sentences false.
 *
 * - Delta Attack (Chapter XI, Magus Sisters) sets the party to 1 HP and 0 MP through
 *   `extra.setHpTo` / `extra.setMpTo`, but read "Deals no damage.".
 * - The enemy Dispels (Vegnagun's Bulwark Left, the Redoubt Left, Paragon Oversoul, Chapter V)
 *   read "Cures Auto Life, Shell, ..." where they strip the girls' buffs.
 *
 * Game case: FFX-2 only (`src/battle/ffx2/intent.ts`; the FFX builder is its own).
 */

import { describe, expect, it } from 'vitest';
import { describeAbility } from '../../src/battle/ffx2/intent.ts';
import { defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import * as FFX2 from '../../src/data/ffx2/index.ts';
import type { AbilityDef } from '../../src/battle/common/types.ts';

const all = FFX2.ABILITIES as Record<string, AbilityDef>;
const row = (id: string): AbilityDef => {
  const def = all[id] ?? defaultAbilities.get(id);
  if (!def) throw new Error(`no ability row ${id}`);
  return def;
};

describe('FFX-2 intent: a formula-none row is only inert when nothing in it does harm', () => {
  it('Delta Attack says it leaves the whole party at 1 HP and 0 MP, never "no damage"', () => {
    const text = describeAbility(row('x2-magus-delta-attack'));
    expect(text).not.toMatch(/no damage/i);
    expect(text).toBe('Leaves the whole party at 1 HP and 0 MP.');
  });

  it('every enemy Dispel says it removes the buffs, never "Cures"', () => {
    for (const id of ['x2-bulwark-left-dispel', 'x2-redoubt-left-dispel', 'paragon-os-dispel', 'dispel']) {
      const text = describeAbility(row(id));
      expect(text, id).not.toMatch(/cures/i);
      expect(text, id).toMatch(/^Removes Auto Life, Shell, Protect, Reflect, Regen, Haste, Spellspring from /);
    }
  });

  it('Mirror of Equity (formulaOverride) still reads as physical damage, as on main', () => {
    expect(describeAbility(row('x2-samurai-mirror-of-equity'))).toBe('Physical non-elemental damage to anyone.');
  });

  it('a row with no effect at all still says it deals no damage (PR-0188 kept)', () => {
    expect(describeAbility(row('x2-bahamut-countdown'))).toBe('Deals no damage.');
  });

  it('no FFX-2 sentence says "Cures" of a removal, and none calls an extra-damage row harmless', () => {
    const bad: string[] = [];
    for (const def of Object.values(all)) {
      const text = describeAbility(def);
      if (/^Cures /.test(text)) bad.push(`${def.id}: ${text}`);
      const extra = def.extra ?? {};
      const harmful = ['setHpTo', 'setMpTo', 'formulaOverride', 'mpFractionOfCurrent', 'mpFractionOfMax'].some(
        (k) => extra[k] !== undefined,
      );
      if (harmful && /no damage/i.test(text)) bad.push(`${def.id}: ${text}`);
    }
    expect(bad).toEqual([]);
  });
});
