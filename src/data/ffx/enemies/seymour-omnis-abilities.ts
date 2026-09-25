/**
 * Boss-only `AbilityDef`s for **Seymour Omnis** (`m131`, bestiary #178), the
 * Garden of Pain inside Sin — Chapter XII.
 *
 * Every row is read off `research/ffx-seymour-omnis.md` §3.1, the decompiled
 * action rows, cross-checked against the FF Wiki enemy-ability table
 * (revid 4008011) `[verified: 2 sources]` unless a row says otherwise.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. *X-2* has no Seymour fight
 * (research §0.3); nothing here is imported by `src/battle/ffx2/**`.
 *
 * ## What the research settles, and what each row does about it
 *
 * - **No tier-1 spell and no physical attack** (§3.1 `[decompiled]` +
 *   3 sources): all-different discs give four **-ra**, never a tier-1 spell.
 * - **The scripted Ultima is 6:240 (DC 64, type Other)**, not the menu's
 *   3:83 (DC 70, Magical) (§3.1). Shell does not apply, Focus stacks and an
 *   aeon's Shield do (`formulas.ts`: Shell only for `'magical'`).
 * - **Dispel hits the whole party** and is not reflectable (§3.1 3:61); its
 *   removal list is `statuses.ts#DISPEL_REMOVES`, which matches the row.
 * - **Accuracy**: magic always hits [AGENTS.md hard rule 5]; the engine reads
 *   only `canMiss === false`, so every row sets it.
 * - **MP cost** is never read for an enemy (`abilities.ts#mpCostFor`): 0.
 * - **Rank 3** on every row (§3.1 `[decompiled]`).
 *
 * ## The volley row (ours, not the game's)
 *
 * {@link OMNIS_VOLLEY} is not a game row. It is the engine's seam for "four
 * spells in one turn" (`src/battle/ffx/volley.ts`, plan O-G3): the AI submits
 * it, and the Chapter XII planner (`src/battle/ffx/ai/seymour-omnis.ts`) turns
 * it into the four real rows below, one per disc. Its `damageType` is
 * `'magical'` so the party's Magic Counter and Auto-Potion answer it exactly
 * as they answer any spell. Its name is a **placeholder** label for the intent
 * slab until the O-4 read (B14 = c) is built.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

type Element4 = 'fire' | 'ice' | 'lightning' | 'water';

/** Ids, mirrored by `src/battle/ffx/ai/seymour-omnis-rules.ts` (the tests pin them equal). */
export const OMNIS_FIRA = 'omnis-fira';
export const OMNIS_BLIZZARA = 'omnis-blizzara';
export const OMNIS_THUNDARA = 'omnis-thundara';
export const OMNIS_WATERA = 'omnis-watera';
export const OMNIS_FIRAGA = 'omnis-firaga';
export const OMNIS_BLIZZAGA = 'omnis-blizzaga';
export const OMNIS_THUNDAGA = 'omnis-thundaga';
export const OMNIS_WATERGA = 'omnis-waterga';
export const OMNIS_DISPEL = 'omnis-dispel';
export const OMNIS_ULTIMA = 'omnis-ultima';
export const OMNIS_VOLLEY = 'omnis-volley';

/**
 * Rows **3:69-72** (-ra, DC 24) and **3:73-76** (-ga, DC 42): Magic, one
 * character per cast, magical, elemental, rank 3, **reflectable**, **10 %
 * shatter** on a petrified target [§3.1 decompiled + wiki "24" / "42",
 * verified: 2 sources]. Aimed by the planner (B12 = a), so `single-enemy`.
 */
function spell(id: string, name: string, element: Element4, power: 24 | 42): AbilityDef {
  return {
    id,
    name,
    game: 'ffx',
    category: 'enemy',
    mpCost: 0, // unread for an enemy — see the file header
    rank: 3, // §3.1 [decompiled]
    power, // §3.1 [verified: 2 sources]
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'shatter'],
    shatterChance: 10, // §3.1 [decompiled]
    canReflect: true,
    canMiss: false,
    messageTemplate: `{user} casts ${name}`,
  };
}

export const omnisFira = spell(OMNIS_FIRA, 'Fira', 'fire', 24);
export const omnisBlizzara = spell(OMNIS_BLIZZARA, 'Blizzara', 'ice', 24);
export const omnisThundara = spell(OMNIS_THUNDARA, 'Thundara', 'lightning', 24);
export const omnisWatera = spell(OMNIS_WATERA, 'Watera', 'water', 24);
export const omnisFiraga = spell(OMNIS_FIRAGA, 'Firaga', 'fire', 42);
export const omnisBlizzaga = spell(OMNIS_BLIZZAGA, 'Blizzaga', 'ice', 42);
export const omnisThundaga = spell(OMNIS_THUNDAGA, 'Thundaga', 'lightning', 42);
export const omnisWaterga = spell(OMNIS_WATERGA, 'Waterga', 'water', 42);

/**
 * Row **3:61**, Dispel on **the whole party** (tracker target "Characters'
 * Party"): removes Shell, Protect, Reflect, the four Nuls, Regen, Haste, the
 * four Breaks and Curse; magical, rank 3, **not reflectable**
 * [§3.1 decompiled + wiki, verified: 2 sources]. The list is the player row's
 * (`whitemagic-cure.ts#dispel`) and `statuses.ts#DISPEL_REMOVES`.
 */
export const omnisDispel: AbilityDef = {
  id: OMNIS_DISPEL,
  name: 'Dispel',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.1 [decompiled]
  power: 0,
  formula: 'none',
  damageType: 'magical', // §3.1 "Magical"
  element: [],
  targeting: 'all-enemies', // the party, from his side
  hits: 1,
  statusEffects: [],
  removesStatuses: [
    'power-break',
    'magic-break',
    'armor-break',
    'mental-break',
    'shell',
    'protect',
    'reflect',
    'nulblaze',
    'nulfrost',
    'nulshock',
    'nultide',
    'regen',
    'haste',
    'curse',
  ],
  flags: ['removes-statuses'],
  canReflect: false,
  canMiss: false,
  messageTemplate: '{user} casts Dispel',
};

/**
 * Row **6:240**, Ultima: Magic **DC 64**, **the whole party**, type **Other**,
 * non-elemental, rank 3, **not reflectable** [§3.1 decompiled + wiki "64
 * instead of 70", "special damage" + GamerGuides + LP, verified: 4 sources].
 * About 89.4 % of a normal Ultima (§3.2 `[derived]`). Shell does not reduce it
 * (type Other), Focus stacks and an aeon's Shield do (§5 row 6).
 */
export const omnisUltima: AbilityDef = {
  id: OMNIS_ULTIMA,
  name: 'Ultima',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.1 [decompiled]
  power: 64, // §3.1 [verified: 4 sources]
  formula: 'magic',
  damageType: 'other', // §3.1 "Other" — Shell does not apply
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canReflect: false,
  canMiss: false,
  messageTemplate: '{user} casts Ultima',
};

/**
 * **The volley** — not a game row; see the file header. `formula: 'none'`:
 * the row itself resolves nothing, its planner's four casts do.
 */
export const omnisVolley: AbilityDef = {
  id: OMNIS_VOLLEY,
  name: 'Mortiphasm Spells', // PLACEHOLDER label (B14 = c's intent line is not built)
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // the turn's rank: every row it casts is rank 3 (§3.1)
  power: 0,
  formula: 'none',
  damageType: 'magical',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canReflect: false,
  canMiss: false,
  extra: { volley: true },
  messageTemplate: '{user} casts four spells',
};

/** Every Chapter XII boss row, keyed by id, for `src/data/ffx/index.ts`. */
export const SEYMOUR_OMNIS_ABILITIES: Readonly<Record<string, AbilityDef>> = {
  [OMNIS_FIRA]: omnisFira,
  [OMNIS_BLIZZARA]: omnisBlizzara,
  [OMNIS_THUNDARA]: omnisThundara,
  [OMNIS_WATERA]: omnisWatera,
  [OMNIS_FIRAGA]: omnisFiraga,
  [OMNIS_BLIZZAGA]: omnisBlizzaga,
  [OMNIS_THUNDAGA]: omnisThundaga,
  [OMNIS_WATERGA]: omnisWaterga,
  [OMNIS_DISPEL]: omnisDispel,
  [OMNIS_ULTIMA]: omnisUltima,
  [OMNIS_VOLLEY]: omnisVolley,
};
