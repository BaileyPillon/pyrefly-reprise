/**
 * Which spell effect an action draws (B1 option B, Bailey 2026-09-26): a
 * lookup by ability id, falling back to the ability's shape and element, and
 * then to today's bloom.
 *
 * Game case: both. The same table serves FFX and FFX-2 ids (FFX-2's all start
 * `x2-`); the look splits by game inside the effects (`SpellFxTimeline.ts`).
 *
 * Pure: no `three`, no DOM, no data imports (the data lookup is
 * `SpellFxLookup.ts`), so the rules can be tested on their own.
 */

export type SpellFxId = 'fire' | 'ice' | 'thunder' | 'water' | 'holy' | 'cure' | 'hit' | 'bloom';
export type FxGame = 'ffx' | 'ffx2';

/** Every effect id; `bloom` is today's tinted `ImpactFlash`. */
export const SPELL_FX_IDS: readonly SpellFxId[] = ['fire', 'ice', 'thunder', 'water', 'holy', 'cure', 'hit', 'bloom'];

/** The fields of an `AbilityDef` the lookup reads. */
export interface AbilityFxShape {
  id: string;
  element: readonly string[];
  damageType?: string;
  formula?: string;
  heals?: boolean;
}

/**
 * The spells named in the pick, by id. Each entry agrees with what the element
 * rule would give; the table is where a future exception goes (an Overdrive or
 * a boss special with its own look needs Bailey's yes first: the pick names
 * the six elements, the heal and the hit only).
 */
export const ABILITY_FX: Readonly<Record<string, SpellFxId>> = Object.freeze({
  // FFX black magic
  fire: 'fire',
  fira: 'fire',
  firaga: 'fire',
  blizzard: 'ice',
  blizzara: 'ice',
  blizzaga: 'ice',
  thunder: 'thunder',
  thundara: 'thunder',
  thundaga: 'thunder',
  water: 'water',
  watera: 'water',
  waterga: 'water',
  // FFX white magic
  holy: 'holy',
  cure: 'cure',
  cura: 'cure',
  curaga: 'cure',
  // FFX-2 Black Mage and White Mage
  'x2-black-mage-fire': 'fire',
  'x2-black-mage-fira': 'fire',
  'x2-black-mage-firaga': 'fire',
  'x2-black-mage-blizzard': 'ice',
  'x2-black-mage-blizzara': 'ice',
  'x2-black-mage-blizzaga': 'ice',
  'x2-black-mage-thunder': 'thunder',
  'x2-black-mage-thundara': 'thunder',
  'x2-black-mage-thundaga': 'thunder',
  'x2-black-mage-water': 'water',
  'x2-black-mage-watera': 'water',
  'x2-black-mage-waterga': 'water',
  'x2-shared-holy': 'holy',
  'x2-white-mage-cure': 'cure',
  'x2-white-mage-cura': 'cure',
  'x2-white-mage-curaga': 'cure',
});

const ELEMENT_FX: Readonly<Record<string, SpellFxId>> = Object.freeze({
  fire: 'fire',
  ice: 'ice',
  lightning: 'thunder',
  thunder: 'thunder',
  water: 'water',
  holy: 'holy',
});

/** The effect an element draws, or null (gravity, none). */
export function elementFx(el: string | undefined): SpellFxId | null {
  return el ? (ELEMENT_FX[el] ?? null) : null;
}

const PHYSICAL_FORMULAS = new Set(['strength', 'piercing-strength']);

/**
 * The effect for an ability (or none), with the event's own element and heal
 * flag as the fallbacks.
 *
 * Order: the id table; a heal draws the Cure motes; a blow (physical damage, or
 * a Strength formula) draws the slash, whatever its element, because a sword
 * with fire on it is still a sword; then the element; then the bloom.
 */
export function resolveSpellFx(ability: AbilityFxShape | undefined, element?: string, heal = false): SpellFxId {
  if (ability) {
    const byId = ABILITY_FX[ability.id];
    if (byId) return byId;
    if (ability.heals) return 'cure';
    if (ability.damageType === 'physical' || PHYSICAL_FORMULAS.has(ability.formula ?? '')) return 'hit';
    for (const el of ability.element) {
      const fx = elementFx(el);
      if (fx) return fx;
    }
  }
  if (heal) return 'cure';
  return elementFx(element) ?? 'bloom';
}
