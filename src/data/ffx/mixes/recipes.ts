/**
 * Rikku's Mix — ingredient-pair -> result-ability-id lookup table.
 * Source: `research/ffx-combat-core.md` §5.9 `[verified: 2 sources]`.
 *
 * Keys are the two chosen item ids, alphabetically sorted and joined with
 * `|` (order never matters to the player, so the lookup must not care about
 * argument order either). Values are the `mix-` prefixed result ability id
 * from `mixes/abilities.ts`.
 *
 * Only ONE confirmed recipe per result is listed, per the brief — this is
 * reference/flavour data, not an exhaustive recipe table (the real game has
 * many more valid pairs per result, generally grouped by item "family" and
 * quantity-in-inventory tiers, which are out of scope here).
 *
 * Some ingredient item ids below (`hypello-potion`, `door-to-tomorrow`,
 * `designer-wallet`, `map`, `mana-spring`) may not exist in the items
 * catalog another parallel agent is building. That is fine: `ItemId` is a
 * bare `string` in the shared contract, so this table is never type-checked
 * against a closed union. Every id is spelled kebab-case for consistency.
 */

/** Builds the normalized `"itemA|itemB"` key: the two ids sorted alphabetically. */
export function mixRecipeKey(itemA: string, itemB: string): string {
  return [itemA, itemB].sort().join('|');
}

export const MIX_RECIPES: Record<string, string> = {
  [mixRecipeKey('potion', 'potion')]: 'mix-ultra-potion',
  [mixRecipeKey('remedy', 'remedy')]: 'mix-panacea',
  [mixRecipeKey('power-distiller', 'sleeping-powder')]: 'mix-ultra-cure',
  [mixRecipeKey('phoenix-down', 'phoenix-down')]: 'mix-mega-phoenix',
  [mixRecipeKey('mega-phoenix', 'mega-phoenix')]: 'mix-final-phoenix',
  [mixRecipeKey('antidote', 'power-sphere')]: 'mix-elixir',
  [mixRecipeKey('potion', 'elixir')]: 'mix-megalixir',
  [mixRecipeKey('potion', 'megalixir')]: 'mix-super-elixir',
  [mixRecipeKey('potion', 'dark-matter')]: 'mix-final-elixir',
  [mixRecipeKey('potion', 'fire-gem')]: 'mix-nul-all',
  [mixRecipeKey('hi-potion', 'fire-gem')]: 'mix-mega-nul-all',
  [mixRecipeKey('lunar-curtain', 'mana-spring')]: 'mix-hyper-nul-all',
  [mixRecipeKey('healing-spring', 'hypello-potion')]: 'mix-ultra-nul-all',
  [mixRecipeKey('antidote', 'lunar-curtain')]: 'mix-mighty-wall',
  [mixRecipeKey('remedy', 'lunar-curtain')]: 'mix-mighty-g',
  [mixRecipeKey('fire-gem', 'lunar-curtain')]: 'mix-super-mighty-g',
  [mixRecipeKey('chocobo-wing', 'door-to-tomorrow')]: 'mix-hyper-mighty-g',
  [mixRecipeKey('hi-potion', 'hi-potion')]: 'mix-vitality',
  [mixRecipeKey('potion', 'stamina-tablet')]: 'mix-mega-vitality',
  [mixRecipeKey('potion', 'stamina-tonic')]: 'mix-hyper-vitality',
  [mixRecipeKey('potion', 'ether')]: 'mix-mana',
  [mixRecipeKey('potion', 'turbo-ether')]: 'mix-mega-mana',
  [mixRecipeKey('potion', 'mana-tablet')]: 'mix-hyper-mana',
  [mixRecipeKey('ether', 'mega-phoenix')]: 'mix-freedom',
  [mixRecipeKey('potion', 'twin-stars')]: 'mix-freedom-x',
  [mixRecipeKey('fire-gem', 'door-to-tomorrow')]: 'mix-quartet-of-9',
  [mixRecipeKey('door-to-tomorrow', 'door-to-tomorrow')]: 'mix-trio-of-9999',
  [mixRecipeKey('potion', 'designer-wallet')]: 'mix-hero-drink',
  [mixRecipeKey('ether', 'designer-wallet')]: 'mix-miracle-drink',
  [mixRecipeKey('megalixir', 'megalixir')]: 'mix-hot-spurs',
  [mixRecipeKey('elixir', 'door-to-tomorrow')]: 'mix-eccentrick',
  [mixRecipeKey('fire-gem', 'ice-gem')]: 'mix-grenade',
  [mixRecipeKey('power-sphere', 'power-sphere')]: 'mix-frag-grenade',
  [mixRecipeKey('map', 'map')]: 'mix-potato-masher',
  [mixRecipeKey('fire-gem', 'shining-gem')]: 'mix-cluster-bomb',
  [mixRecipeKey('grenade', 'door-to-tomorrow')]: 'mix-tallboy',
  [mixRecipeKey('grenade', 'teleport-sphere')]: 'mix-chaos-grenade',
  [mixRecipeKey('antidote', 'fire-gem')]: 'mix-firestorm',
  [mixRecipeKey('fire-gem', 'hypello-potion')]: 'mix-abaddon-flame',
  [mixRecipeKey('fire-gem', 'lv-1-key-sphere')]: 'mix-burning-soul',
  [mixRecipeKey('power-distiller', 'shadow-gem')]: 'mix-nega-burst',
  [mixRecipeKey('shadow-gem', 'door-to-tomorrow')]: 'mix-black-hole',
  [mixRecipeKey('fire-gem', 'dark-matter')]: 'mix-sunburst',
};
