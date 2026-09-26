/**
 * B1 option B (Bailey, 2026-09-26): every castable ability in both games
 * resolves to a spell effect: by ability id first, then by its element, then
 * today's bloom. Game case: both (shared lookup; the skins split elsewhere).
 */
import { describe, expect, it } from 'vitest';
import { ALL_ABILITIES as FFX_ABILITIES } from '../../src/data/ffx/index.ts';
import { ALL_ABILITIES as FFX2_ABILITIES } from '../../src/data/ffx2/index.ts';
import { ABILITY_FX, SPELL_FX_IDS, resolveSpellFx } from '../../src/engine/spellfx/SpellFxRegistry.ts';
import { abilityShapeFor, resolveAbilityFx } from '../../src/engine/spellfx/SpellFxLookup.ts';
import { CORE_ABILITIES as FFX_CORE } from '../../src/battle/ffx/registry.ts';
import { defaultAbilities, FALLBACK_ABILITY_IDS } from '../../src/battle/ffx2/abilities.ts';

// The data tables plus the engines' own fallback tables (Attack, Bahamut, Vegnagun, Shuyin).
const GAMES = [
  ['ffx', [...FFX_ABILITIES, ...FFX_CORE]],
  ['ffx2', [...FFX2_ABILITIES, ...FALLBACK_ABILITY_IDS.map((id) => defaultAbilities.get(id)!)]],
] as const;

describe('spell effect registry', () => {
  for (const [game, list] of GAMES) {
    it(`every ${game} ability resolves to a known effect`, () => {
      expect(list.length).toBeGreaterThan(300);
      for (const a of list) {
        const fx = resolveAbilityFx(a.id, game, undefined, false);
        expect(SPELL_FX_IDS, `${a.id} -> ${fx}`).toContain(fx);
      }
    });

    it(`every ${game} elemental spell, heal and physical blow gets a drawn effect, not the bloom`, () => {
      for (const a of list) {
        const heals = a.flags.includes('heals');
        const physical = a.damageType === 'physical' || a.formula === 'strength' || a.formula === 'piercing-strength';
        const el = a.element.find((e) => ['fire', 'ice', 'lightning', 'water', 'holy'].includes(e));
        if (!heals && !physical && !el) continue;
        expect(resolveAbilityFx(a.id, game, undefined, false), a.id).not.toBe('bloom');
      }
    });
  }

  it('the id table names only real abilities, and each one resolves to its entry', () => {
    const all = new Set([...FFX_ABILITIES, ...FFX2_ABILITIES].map((a) => a.id));
    for (const [id, fx] of Object.entries(ABILITY_FX)) {
      expect(all.has(id), id).toBe(true);
      const game = id.startsWith('x2-') ? 'ffx2' : 'ffx';
      expect(resolveAbilityFx(id, game, undefined, false), id).toBe(fx);
    }
  });

  it('the named spells land on their element (both games)', () => {
    expect(resolveAbilityFx('fire', 'ffx')).toBe('fire');
    expect(resolveAbilityFx('blizzaga', 'ffx')).toBe('ice');
    expect(resolveAbilityFx('thundara', 'ffx')).toBe('thunder');
    expect(resolveAbilityFx('water', 'ffx')).toBe('water');
    expect(resolveAbilityFx('holy', 'ffx')).toBe('holy');
    expect(resolveAbilityFx('cure', 'ffx')).toBe('cure');
    expect(resolveAbilityFx('x2-black-mage-fira', 'ffx2')).toBe('fire');
    expect(resolveAbilityFx('x2-shared-holy', 'ffx2')).toBe('holy');
    expect(resolveAbilityFx('x2-white-mage-cura', 'ffx2')).toBe('cure');
    expect(resolveAbilityFx('x2-warrior-attack', 'ffx2')).toBe('hit');
    // An enemy's elemental spell uses the element (Seymour Flux's -ara line).
    expect(resolveAbilityFx('mac-fira', 'ffx')).toBe('fire');
    // A physical blow with an element is still a blow (Flametongue is a sword).
    expect(resolveAbilityFx('x2-warrior-flametongue', 'ffx2')).toBe('hit');
  });

  it('falls back to the element, then to the bloom', () => {
    expect(resolveSpellFx(undefined, 'water')).toBe('water');
    expect(resolveSpellFx(undefined, 'lightning')).toBe('thunder');
    expect(resolveSpellFx(undefined, 'gravity')).toBe('bloom');
    expect(resolveSpellFx(undefined, 'none')).toBe('bloom');
    expect(resolveSpellFx(undefined, undefined, true)).toBe('cure');
    expect(resolveAbilityFx('no-such-ability', 'ffx', 'ice')).toBe('ice');
    expect(resolveAbilityFx(undefined, 'ffx2', undefined)).toBe('bloom');
    // Non-elemental magic keeps today's bloom (Flare, Mega Flare): the
    // specials are not part of the approved pick.
    expect(resolveAbilityFx('flare', 'ffx')).toBe('bloom');
    expect(resolveAbilityFx('x2-bahamut-mega-flare', 'ffx2')).toBe('bloom');
  });

  it("reads the engines' own fallback abilities (the ATB Attack, Bahamut's Curse)", () => {
    expect(resolveAbilityFx('attack', 'ffx2')).toBe('hit');
    expect(resolveAbilityFx('attack', 'ffx')).toBe('hit');
    expect(abilityShapeFor('bahamut-curse', 'ffx2')?.id).toBe('bahamut-curse');
  });

  it('reads an ability from the right game only', () => {
    expect(abilityShapeFor('fire', 'ffx')?.element).toContain('fire');
    expect(abilityShapeFor('fire', 'ffx2')).toBeUndefined();
  });
});
