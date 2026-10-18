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
import { grandSummonChoices, summonLabel } from './aeon-duel.ts';
import { GRAND_SUMMON_KO_REFUSED, aeonKnockedOut } from './grand-summon-ko.ts';
import { aeonScriptOff } from './formation-commands.ts';

/**
 * Whether the Mix picker's preview names the result of **every** pair in the bag (the game's chart, `mixablePairs`), or only the registered recipes
 * (`src/data/ffx/mixes/recipes.ts`, `FFXContentRegistry.mixPairs`) and shows "? ? ?" for any other pair, as every build before re-parity RC7 did.
 *
 * **Off, because it is a screen choice that is Bailey's, not an engine one** (RC7 handoff, section 11 decision 4: "whether the picker shows every pair's
 * result or only discovered ones (a screen: a mockup first)", AGENTS.md rule 9). It only gates what the *preview* says. What a pair makes never depends on
 * it: the engine resolves a fired pair through the game's complete chart (`overdriveShape.ts` -> `mix.ts#resolveMixAction`), and the automatic draw of a
 * headless or AI Mix (`rollDefaultMinigame`) is still made among every pair in the bag. The player-visible difference is the preview line and, for a pair
 * the preview did not name, that the Mix now fires its real result where an earlier build said "Mix failed!". **FFX only.**
 */
export const MIX_PREVIEW_ALL_PAIRS = false;

/** One row of the Grand Summon list. `storedGauge` is the aeon's own gauge, not the temporary 100. */
export interface GrandSummonEntry {
  id: string;
  name: string;
  storedGauge: number;
  /** `false` for an aeon a possessed copy's script took away (`SCRIPT_COMMAND_DISABLES`, off): the picker draws it greyed and refuses it, as the game's list does. Absent otherwise. */
  enabled?: false;
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
  return grandSummonChoices(ctx, true).map((id) => {
    const aeon = ctx.rt.aeonRoster.get(id);
    const entry: GrandSummonEntry = { id, name: summonLabel(ctx, id, aeon?.name ?? id), storedGauge: aeon?.overdrive?.gauge ?? 0 };
    if (aeonScriptOff(ctx, id)) entry.enabled = false;
    else if (GRAND_SUMMON_KO_REFUSED.on && aeonKnockedOut(ctx, id)) entry.enabled = false; // a knocked-out or recovering aeon is a greyed entry, as the game's list draws it (`./grand-summon-ko.ts`, off)
    return entry;
  });
}

/**
 * Mix's picker params: the bag as named ingredients, and the pairs the preview
 * is to name (`mixPreviewPairs`: the registered recipes, or every pair of the
 * bag when {@link MIX_PREVIEW_ALL_PAIRS} is on), keyed the way the overlay looks
 * them up. The engine still resolves the pair itself, through the game's whole
 * chart (`overdriveShape.ts`), so a pair missing here is shown as "? ? ?" and
 * still makes the game's result, never a guess.
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
