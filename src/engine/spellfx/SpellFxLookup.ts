/**
 * The ability tables behind {@link resolveSpellFx}: an ability id to the shape
 * the registry reads, per game, in the order the engines read them: the data
 * table first, then the engine's own fallback table (the generic Attack, and in
 * FFX-2 Bahamut, Vegnagun and Shuyin, whose engine ids have no `x2-` prefix).
 * Game case: both (each game reads only its own tables, so an FFX id never
 * resolves in an FFX-2 chapter).
 */

import type { AbilityDef } from '../../battle/common/types.ts';
import { ABILITIES as FFX_ABILITIES } from '../../data/ffx/index.ts';
import { ABILITIES as FFX2_ABILITIES } from '../../data/ffx2/index.ts';
import { CORE_ABILITIES as FFX_CORE } from '../../battle/ffx/registry.ts';
import { defaultAbilities as FFX2_FALLBACK } from '../../battle/ffx2/abilities.ts';
import { resolveSpellFx, type AbilityFxShape, type FxGame, type SpellFxId } from './SpellFxRegistry.ts';

const FFX_CORE_BY_ID = new Map(FFX_CORE.map((a) => [a.id, a]));

function abilityFor(id: string, game: FxGame): AbilityDef | undefined {
  const table: Record<string, AbilityDef> = game === 'ffx2' ? FFX2_ABILITIES : FFX_ABILITIES;
  if (Object.hasOwn(table, id)) return table[id];
  return game === 'ffx2' ? FFX2_FALLBACK.get(id) : FFX_CORE_BY_ID.get(id);
}

export function abilityShapeFor(id: string | undefined, game: FxGame): AbilityFxShape | undefined {
  if (!id) return undefined;
  const a = abilityFor(id, game);
  if (!a) return undefined;
  return {
    id: a.id,
    element: a.element,
    damageType: a.damageType,
    formula: a.formula,
    heals: a.flags.includes('heals'),
  };
}

/** The effect an action draws, from its ability id, its element and whether it healed. */
export function resolveAbilityFx(id: string | undefined, game: FxGame, element?: string, heal = false): SpellFxId {
  return resolveSpellFx(abilityShapeFor(id, game), element, heal);
}
