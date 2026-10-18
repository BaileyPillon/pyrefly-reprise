/**
 * The FFX-2 enemy-intent sentences of the advisor text pass, read from the game's own rows
 * (release candidate r48-rc; **FFX-2 only**: `src/battle/ffx2/intent.ts` and `intentLead.ts`; the FFX builder is its own).
 *
 * - A move that damages MP says "MP damage": every ability with `extra.mpOnly === true` or `extra.damagesPool === 'mp'`
 *   (Sonic Wings, Lacrimosa, Magical Attack Detected, Osmose, Waning Moon, Kozuka, and the party's Magicide and Target MP).
 * - Leblanc's Osmose (row 0x406d, damage flags 0) is neither physical nor magical, so its sentence names no kind. The
 *   party's Osmose (row 0x317b, flags 2) is magical and keeps the word. No other sentence changed its kind word.
 * - Delta Attack: HP only (row 0x40a9, class 1; see `ffx2-intent-inert-lead.test.ts`). Zanmato (row 0x40a4, class 3) names both pools.
 * - Looming Glacier: "Empties one girl's MP and inflicts Stop." (row 0x4102, class 2).
 *
 * The party's Osmose (`x2-shared-osmose`, which the Paragon Oversoul also casts) carries neither key, only the `drains-mp`
 * flag, which the HP-and-MP drains share. Release candidate r50-fixes reads it from its game row instead (row 0x317b, "MP,
 * formula 9, power 6", damage class 2 = MP only; `research/re-ffx2-ai-fallen-trema.md`), so its sentence says "MP damage"
 * too, in the move slab here and in the advisor's line (`ffx2-osmose-mp-damage.test.ts`). **FFX-2 only.**
 */

import { describe, expect, it } from 'vitest';
import { describeAbility } from '../../src/battle/ffx2/intent.ts';
import { defaultAbilities, FALLBACK_ABILITY_IDS } from '../../src/battle/ffx2/abilities.ts';
import * as FFX2 from '../../src/data/ffx2/index.ts';
import type { AbilityDef } from '../../src/battle/common/types.ts';

const all: Record<string, AbilityDef> = { ...(FFX2.ABILITIES as Record<string, AbilityDef>) };
for (const id of FALLBACK_ABILITY_IDS) if (!all[id]) all[id] = defaultAbilities.get(id)!;
const row = (id: string): AbilityDef => {
  const def = all[id];
  if (!def) throw new Error(`no ability row ${id}`);
  return def;
};

/** Restated from the extras, not from the builder's own helper. */
const damagesMp = (d: AbilityDef): boolean => d.extra?.['mpOnly'] === true || d.extra?.['damagesPool'] === 'mp';
/** The party's Osmose, the one row the extras do not name: the game's row is the MP class alone and the row deals damage. */
const MP_BY_GAME_ROW = ['x2-shared-osmose'];
const damagesMpByRow = (d: AbilityDef): boolean => d.game === 'ffx2' && d.ffx2Record?.damageClass === 2 && d.formula !== 'none' && !d.flags.includes('heals');

describe('FFX-2 intent: a move that damages MP says "MP damage"', () => {
  const NAMED: ReadonlyArray<readonly [string, string]> = [
    ['x2-valefor-sonic-wings', 'Physical non-elemental MP damage to one girl.'],
    ['lacrimosa-l', 'Physical non-elemental MP damage to one girl.'],
    ['x2-redoubt-left-lacrimosa', 'Non-elemental MP damage to one girl.'],
    ['magical-attack-detected', 'Non-elemental MP damage to the whole party - strips Mag Up, Mdef Up.'],
    ['x2-bulwark-magical-attack-detected', 'Non-elemental MP damage to the whole party - strips Mag Up, Mdef Up.'],
    ['x2-leblanc-osmose', 'Non-elemental MP damage to one girl.'],
    ['x2-shared-osmose', 'Magical non-elemental MP damage to anyone.'],
    ['trema-waning-moon', 'Non-elemental MP damage to one girl - 3 hits.'],
    ['x2-yojimbo-kozuka', 'Non-elemental MP damage to one girl.'],
  ];

  it.each(NAMED)('%s reads "%s"', (id, sentence) => {
    expect(describeAbility(row(id))).toBe(sentence);
  });

  it('every row with extra.mpOnly, extra.damagesPool "mp" or an MP-only game row says MP damage, and no other row does', () => {
    const named = Object.values(all).filter((d) => damagesMp(d) || damagesMpByRow(d));
    expect(named.length, 'the rows the pass covers').toBeGreaterThanOrEqual(10);
    const missing = named.filter((d) => !/ MP damage to /.test(describeAbility(d))).map((d) => `${d.id}: ${describeAbility(d)}`);
    expect(missing).toEqual([]);
    const extra = Object.values(all)
      .filter((d) => !damagesMp(d) && !damagesMpByRow(d) && /\bMP damage\b/.test(describeAbility(d)))
      .map((d) => d.id);
    expect(extra).toEqual([]);
  });

  it('the game row names exactly one row the extras miss: the party\'s Osmose', () => {
    const byRowOnly = Object.values(all).filter((d) => damagesMpByRow(d) && !damagesMp(d)).map((d) => d.id);
    expect(byRowOnly).toEqual(MP_BY_GAME_ROW);
  });
});

describe('FFX-2 intent: Osmose is neither physical nor magical on Leblanc\'s row, and only there', () => {
  it('Leblanc\'s Osmose (row 0x406d, damage flags 0) names no kind', () => {
    const def = row('x2-leblanc-osmose');
    expect(def.ffx2Record?.id).toBe(0x406d);
    expect((def.ffx2Record?.flagsDamage ?? -1) & 3, 'neither damage-type bit').toBe(0);
    expect(describeAbility(def)).not.toMatch(/Magical|Physical/);
  });

  it('the party\'s Osmose (row 0x317b, flags 2) is magical and keeps the word', () => {
    const def = row('x2-shared-osmose');
    expect(def.ffx2Record?.id).toBe(0x317b);
    expect((def.ffx2Record?.flagsDamage ?? -1) & 3, 'the magical bit').toBe(2);
    expect(describeAbility(def)).toMatch(/^Magical /);
  });

  it('no other damage sentence lost its Physical or Magical word', () => {
    const lost: string[] = [];
    for (const d of Object.values(all)) {
      if (d.damageType !== 'physical' && d.damageType !== 'magical') continue;
      if (d.formula === 'none' || d.flags.includes('heals')) continue;
      const word = d.damageType === 'physical' ? 'Physical' : 'Magical';
      if (!describeAbility(d).startsWith(`${word} `)) lost.push(`${d.id}: ${describeAbility(d)}`);
    }
    expect(lost.map((l) => l.split(':')[0])).toEqual(['x2-leblanc-osmose']);
  });
});

describe('FFX-2 intent: the set-to and empty-MP lines follow the game\'s row', () => {
  it('Delta Attack (class 1) names HP only; Zanmato (class 3) names both pools', () => {
    expect(describeAbility(row('x2-magus-delta-attack'))).toBe('Leaves the whole party at 1 HP.');
    expect(row('x2-yojimbo-zanmato').ffx2Record?.damageClass).toBe(3);
    expect(describeAbility(row('x2-yojimbo-zanmato'))).toBe('Leaves the whole party at 1 HP and 1 MP.');
  });

  it('Looming Glacier (row 0x4102, class 2) empties one girl\'s MP and inflicts Stop', () => {
    const def = row('x2-den-baralai-looming-glacier');
    expect(def.ffx2Record?.damageClass).toBe(2);
    expect(describeAbility(def)).toBe('Empties one girl\'s MP and inflicts Stop.');
  });

  it('without a game row, the ability\'s own keys decide (the derived path is unchanged)', () => {
    const bare: AbilityDef = { ...row('x2-yojimbo-zanmato') };
    delete (bare as { ffx2Record?: unknown }).ffx2Record;
    expect(describeAbility(bare)).toBe('Leaves the whole party at 1 HP and 1 MP.');
  });
});
