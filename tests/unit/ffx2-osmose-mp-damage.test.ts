/**
 * The party's Osmose reads as MP damage (release candidate r50-fixes; **FFX-2 only**: the game row is FFX-2's).
 *
 * The r48 text pass (`ffx2-intent-mp-damage.test.ts`) made every move that damages MP say "MP damage", keyed on
 * `extra.mpOnly` or `extra.damagesPool: 'mp'`. The party's Osmose (`x2-shared-osmose`, row 0x317b) carries neither key,
 * only the `drains-mp` flag that the HP-and-MP drains share, so its sentence still read "damage" with no "MP". The game's
 * own row settles it: "Osmose, MP, formula 9, power 6, one hit, never rolls" (`research/re-ffx2-ai-fallen-trema.md`, the
 * row table; `ffx2Record.damageClass` 2 = MP only, 1 = HP, 3 = both). The sentence now follows the row's class.
 *
 * Both places that word a move: the enemy-intent move slab (`battle/ffx2/intent.ts`, which the Paragon Oversoul's Osmose
 * reaches) and the advisor's line, which the party's command help and the advisor card share (`engine/tactics/advisor.ts`).
 * FFX is untouched: its Osmose is a different spell, and no FFX ability has `game: 'ffx2'`.
 */

import { describe, expect, it } from 'vitest';
import { describeAbility as moveSlab } from '../../src/battle/ffx2/intent.ts';
import { describeAbility as advisorLine } from '../../src/engine/tactics/advisor.ts';
import { commandEffectText } from '../../src/ui/ffx2/commandHelp.ts';
import { damagesMp, isMpClassRow } from '../../src/battle/ffx2/intentLead.ts';
import * as FFX2 from '../../src/data/ffx2/index.ts';
import * as FFX from '../../src/data/ffx/index.ts';
import type { AbilityDef, AvailableCommand } from '../../src/battle/common/types.ts';

const ffx2 = FFX2.ABILITIES as Record<string, AbilityDef>;
const osmose = ffx2['x2-shared-osmose']!;

describe('the party\'s Osmose says MP damage in both places that word a move', () => {
  it('its game row is the one in the notes: 0x317b, formula 9, power 6, MP class only', () => {
    expect(osmose.ffx2Record).toMatchObject({ id: 0x317b, formula: 9, power: 6, damageClass: 2 });
    expect(osmose.game).toBe('ffx2');
  });

  it('the move slab reads "Magical non-elemental MP damage to anyone."', () => {
    expect(moveSlab(osmose)).toBe('Magical non-elemental MP damage to anyone.');
  });

  it('the advisor line reads "Magic MP damage"', () => {
    expect(advisorLine(osmose)).toBe('Magic MP damage');
  });

  it('the party\'s command help for the Osmose row reads the same', () => {
    const row: AvailableCommand = {
      command: { kind: 'ability', id: 'x2-shared-osmose', targets: [] },
      label: 'Osmose',
      category: 'skill',
      mpCost: 0,
      enabled: true,
      validTargets: ['boss'],
    };
    expect(commandEffectText(row)).toBe('Magic MP damage');
  });
});

describe('the rule is the game row, and only the game row', () => {
  it('the helpers agree: the row is the MP class, so it damages MP', () => {
    expect(isMpClassRow(osmose)).toBe(true);
    expect(damagesMp(osmose)).toBe(true);
  });

  it('a copy of the row with the class set to HP (1) or both pools (3) does not say MP', () => {
    for (const damageClass of [1, 3]) {
      const other: AbilityDef = { ...osmose, ffx2Record: { ...osmose.ffx2Record!, damageClass } };
      expect(isMpClassRow(other), `class ${damageClass}`).toBe(false);
      expect(advisorLine(other), `class ${damageClass}`).toBe('Magic damage');
      expect(moveSlab(other), `class ${damageClass}`).not.toMatch(/MP damage/);
    }
  });

  it('a copy of the row that says it is FFX\'s says nothing about MP (the rule is FFX-2 only)', () => {
    const asFfx: AbilityDef = { ...osmose, game: 'ffx' };
    expect(isMpClassRow(asFfx)).toBe(false);
    expect(advisorLine(asFfx)).toBe('Magic damage');
  });

  it('the party rows that now say MP damage in the advisor are exactly the three MP-damage commands a girl can have', () => {
    const says = Object.values(ffx2)
      .filter((d) => d.category !== 'item' && d.game === 'ffx2')
      .filter((d) => {
        try {
          return /MP damage/.test(advisorLine(d));
        } catch {
          return false;
        }
      })
      .map((d) => d.id);
    // The party's: Target MP (Gunner), Magicide (Samurai), Osmose (the Covetous grid). The rest are monsters' rows, which no
    // girl's menu holds; they are named so a new row has to be a decision.
    const party = says.filter((id) => ['x2-gunner-target-mp', 'x2-samurai-magicide', 'x2-shared-osmose'].includes(id));
    expect(party.sort()).toEqual(['x2-gunner-target-mp', 'x2-samurai-magicide', 'x2-shared-osmose']);
  });
});

describe('FFX is untouched', () => {
  it('no FFX ability line says MP damage, and FFX\'s Osmose spell reads as it did', () => {
    const rows = FFX.ABILITIES as Record<string, AbilityDef>;
    const says = Object.values(rows).filter((d) => {
      try {
        return /MP damage/.test(advisorLine(d));
      } catch {
        return false;
      }
    });
    expect(says.map((d) => d.id)).toEqual([]);
    expect(advisorLine(rows['osmose-spell']!)).toBe('Magic damage');
  });
});
