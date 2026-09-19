/**
 * Ability / item lookup for the FFX engine.
 *
 * The engine resolves everything through {@link AbilityDef}s, but it must not
 * import `src/data/ffx/**` — the data agents are filling those files
 * concurrently and the layering rule in `docs/ARCHITECTURE.md` points the
 * dependency the other way. So the engine owns a registry that the app wires
 * up once at boot:
 *
 * ```ts
 * import { registerFFXAbilities, registerFFXItems } from 'src/battle/ffx';
 * import { ffxAbilities, ffxItems } from 'src/data/ffx/abilities.ts';
 * registerFFXAbilities(ffxAbilities);
 * registerFFXItems(ffxItems);
 * ```
 *
 * A handful of actions are structural rather than content — the engine cannot
 * resolve a turn without them — so they ship here as {@link CORE_ABILITIES} and
 * are always present. A data file may override any of them by registering an
 * ability with the same id.
 */

import type { AbilityDef, AbilityId, ItemDef, ItemId } from '../common/types.ts';

/** Id of the basic Attack command's ability record. */
export const ATTACK_ABILITY_ID = 'attack';
/** Id of the Defend command's ability record. */
export const DEFEND_ABILITY_ID = 'defend';
/** Id of the aeon Shield stance. */
export const AEON_SHIELD_ABILITY_ID = 'aeon-shield';
/** Id of the aeon Boost stance. */
export const AEON_BOOST_ABILITY_ID = 'aeon-boost';

function def(partial: Partial<AbilityDef> & Pick<AbilityDef, 'id' | 'name' | 'category'>): AbilityDef {
  return {
    game: 'ffx',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    ...partial,
  };
}

/**
 * Actions the engine itself needs to be able to name.
 *
 * `attack` is CSV row 0: `Strength`, Physical, DmgCon 16, one hit,
 * crit-eligible, inherits weapon properties, affected by Darkness, rank 3
 * [ffx-combat-core §2.5, §1.3].
 */
export const CORE_ABILITIES: readonly AbilityDef[] = [
  def({
    id: ATTACK_ABILITY_ID,
    name: 'Attack',
    category: 'attack',
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    targeting: 'single-enemy',
    flags: ['crit-eligible', 'adds-equipment-crit', 'inherits-weapon-properties', 'affected-by-darkness'],
    messageTemplate: '{user} attacks',
  }),
  // Rank 2 [ffx-combat-core §1.3]. Halves physical damage until the user's next
  // turn; the status itself does the work.
  def({
    id: DEFEND_ABILITY_ID,
    name: 'Defend',
    category: 'special',
    rank: 2,
    targeting: 'self',
    statusEffects: [{ status: 'defend', chance: 255, duration: 1 }],
    messageTemplate: '{user} defends',
  }),
  // Aeon stances, rows 84/85, rank 3 [ffx-combat-core §6.2].
  def({
    id: AEON_SHIELD_ABILITY_ID,
    name: 'Shield',
    category: 'aeon',
    rank: 3,
    targeting: 'self',
    statusEffects: [{ status: 'shield', chance: 255, duration: 1 }],
    messageTemplate: '{user} raises a shield',
  }),
  def({
    id: AEON_BOOST_ABILITY_ID,
    name: 'Boost',
    category: 'aeon',
    rank: 3,
    targeting: 'self',
    statusEffects: [{ status: 'boost', chance: 255, duration: 1 }],
    messageTemplate: '{user} boosts',
  }),
];

/** `"itemA|itemB"`, the two ids sorted — order never matters to a Mix [§5.9]. */
export function mixKey(a: ItemId, b: ItemId): string {
  return [a, b].sort().join('|');
}

/** A resolvable set of abilities and items. */
export class FFXContentRegistry {
  private readonly abilities = new Map<AbilityId, AbilityDef>();
  private readonly items = new Map<ItemId, ItemDef>();
  private readonly mixes = new Map<string, AbilityId>();

  constructor() {
    for (const a of CORE_ABILITIES) this.abilities.set(a.id, a);
  }

  addAbilities(defs: readonly AbilityDef[]): void {
    for (const a of defs) this.abilities.set(a.id, a);
  }

  addItems(defs: readonly ItemDef[]): void {
    for (const i of defs) this.items.set(i.id, i);
  }

  /**
   * Rikku's Mix table: `"itemA|itemB" -> mix ability id` [ffx-combat-core §5.9].
   *
   * `src/data/ffx/mixes/recipes.ts` has shipped this table since the data pass
   * and **nothing in the whole project read it** — not the engine, not the
   * overlay — so `MixResult.resultAbilityId` was `null` on every path and Mix,
   * Rikku's Overdrive in all three FFX builds, spent a full gauge and produced
   * no event at all. The layering rule keeps `src/battle/**` out of
   * `src/data/**` [ARCHITECTURE], so the table arrives the same way abilities
   * and items do: the app hands it over at boot.
   *
   * Accepts either the already-keyed record from `recipes.ts` or raw pairs.
   */
  addMixRecipes(recipes: Readonly<Record<string, AbilityId>>): void {
    for (const [key, abilityId] of Object.entries(recipes)) {
      const [a, b] = key.split('|');
      this.mixes.set(a !== undefined && b !== undefined ? mixKey(a, b) : key, abilityId);
    }
  }

  /** The mix two ingredients make, or `undefined` for a pair with no recipe. */
  mixResult(a: ItemId, b: ItemId): AbilityId | undefined {
    return this.mixes.get(mixKey(a, b));
  }

  /** Every ingredient pair this registry can resolve, as `[a, b, resultId]`. */
  mixPairs(): Array<[ItemId, ItemId, AbilityId]> {
    const out: Array<[ItemId, ItemId, AbilityId]> = [];
    for (const [key, abilityId] of this.mixes) {
      const [a, b] = key.split('|');
      if (a !== undefined && b !== undefined) out.push([a, b, abilityId]);
    }
    return out;
  }

  ability(id: AbilityId): AbilityDef | undefined {
    return this.abilities.get(id);
  }

  item(id: ItemId): ItemDef | undefined {
    return this.items.get(id);
  }

  /**
   * The {@link AbilityDef} an item resolves to. `ItemDef.effect` is either an
   * ability id or an inline definition (CONTRACT-CHANGES, orchestrator
   * decision 7: items register their effect as an ability with
   * `category: 'item'`).
   */
  itemEffect(id: ItemId): AbilityDef | undefined {
    const item = this.items.get(id);
    if (!item) return undefined;
    if (typeof item.effect === 'string') return this.abilities.get(item.effect);
    return item.effect;
  }

  /** A copy carrying the same content, so one engine cannot mutate another's. */
  clone(): FFXContentRegistry {
    const next = new FFXContentRegistry();
    next.addAbilities([...this.abilities.values()]);
    next.addItems([...this.items.values()]);
    next.addMixRecipes(Object.fromEntries(this.mixes));
    return next;
  }
}

/** The process-wide registry the app populates at boot. */
let defaultRegistry = new FFXContentRegistry();

/** Add ability records to the process-wide registry. */
export function registerFFXAbilities(defs: readonly AbilityDef[]): void {
  defaultRegistry.addAbilities(defs);
}

/** Add item records to the process-wide registry. */
export function registerFFXItems(defs: readonly ItemDef[]): void {
  defaultRegistry.addItems(defs);
}

/** Add Rikku's Mix table to the process-wide registry [ffx-combat-core §5.9]. */
export function registerFFXMixRecipes(recipes: Readonly<Record<string, AbilityId>>): void {
  defaultRegistry.addMixRecipes(recipes);
}

/** The process-wide registry. Engines clone it at `init()`. */
export function getFFXRegistry(): FFXContentRegistry {
  return defaultRegistry;
}

/** Drop every registered record. Tests call this between fixtures. */
export function resetFFXRegistry(): void {
  defaultRegistry = new FFXContentRegistry();
}
