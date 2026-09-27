/**
 * What the two FFX picker Overdrives hand their overlays: Yuna's Grand Summon
 * and Rikku's Mix [ffx-combat-core §5.4, §5.9].
 *
 * Hotfix 24 (`docs/plans/valefor-overdrive-bug-2026-09-27.md` S1). Grand
 * Summon's `aeons` were bare ids while `ui/ffx/minigames/YunaGrandSummon.ts`
 * reads `{ id, name, storedGauge }`; it threw on its first render, the
 * presenter re-submitted bare and the engine's default roll put Valefor on the
 * field every time. Mix sent `inventory` while `RikkuMix.ts` reads
 * `ingredients` and `recipes`, so its list opened empty. The engine is the one
 * place that knows the names, the gauges and the recipe table, so it sends the
 * shapes the overlays read. `inventory` stays, unchanged, for anything that
 * already reads it.
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only**. FFX-2 has neither Overdrive.
 */
import type { AbilityId, ItemId } from '../common/types.ts';
import type { Ctx } from './state.ts';
import { grandSummonChoices } from './aeon-duel.ts';

/** One row of the Grand Summon list. `storedGauge` is the aeon's own gauge, not the temporary 100. */
export interface GrandSummonEntry {
  id: string;
  name: string;
  storedGauge: number;
}

/** One row of the Mix list: an item in the bag, by name, with its count. */
export interface MixIngredient {
  itemId: ItemId;
  name: string;
  count: number;
}

/** Mix's picker params. */
export interface MixPickerParams {
  inventory: Array<{ itemId: ItemId; count: number }>;
  ingredients: MixIngredient[];
  /** Result ability id per pair, keyed by the two item ids sorted and joined with `|`. */
  recipes: Record<string, AbilityId>;
  /** The same keys, the result's display name, for the overlay's preview. */
  recipeNames: Record<string, string>;
}

/** The aeons Grand Summon may call, in the menu's (roster) order, as the picker reads them. */
export function grandSummonEntries(ctx: Ctx): GrandSummonEntry[] {
  return grandSummonChoices(ctx).map((id) => {
    const aeon = ctx.rt.aeonRoster.get(id);
    return { id, name: aeon?.name ?? id, storedGauge: aeon?.overdrive?.gauge ?? 0 };
  });
}

/**
 * Mix's picker params: the bag as named ingredients, and the pairs the recipe
 * table can resolve right now (`mixablePairs`), keyed the way the overlay looks
 * them up. The engine still resolves the pair itself (`overdriveShape.ts`), so
 * a pair missing here is "Mix failed!", never a guess.
 */
export function mixPickerParams(ctx: Ctx, pairs: ReadonlyArray<readonly [ItemId, ItemId, AbilityId]>): MixPickerParams {
  const recipes: Record<string, AbilityId> = {};
  const recipeNames: Record<string, string> = {};
  for (const [a, b, result] of pairs) {
    const key = [a, b].sort().join('|');
    recipes[key] = result;
    recipeNames[key] = ctx.content.ability(result)?.name ?? result;
  }
  const bag = [...ctx.rt.inventory.entries()];
  return {
    inventory: bag.map(([itemId, count]) => ({ itemId, count })),
    ingredients: bag
      .filter(([, count]) => count > 0)
      .map(([itemId, count]) => ({ itemId, name: ctx.content.item(itemId)?.name ?? itemId, count })),
    recipes,
    recipeNames,
  };
}
