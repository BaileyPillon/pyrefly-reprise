/**
 * FF7's own data shapes: abilities, items, Materia, equipment and the registry
 * the engine is handed (the engine never imports `src/data`, layering rule 1).
 *
 * Engine-owned, not a contract file: nothing outside the FF7 engine and
 * `src/data/ff7/**` reads these. The shared `AbilityDef` is FFX-shaped (CTB rank,
 * FFX formula keys); FF7's formulas, hit rules and power units are its own, so
 * they get their own record instead of meanings smuggled through `extra`.
 *
 * Units follow `research/ff7-battle-core.md` ("core"):
 * - `power` for `physical` / `magical` is in sixteenths of Base (Attack = 16,
 *   "1 3/4x Base" = 28) [core §4.1];
 * - for `cure` it is the constant's multiplier (`Base + 22 * power`) [core §4.3];
 * - for `item` it is `16 * power` before Defense, for `fixed` it is `power * 20`,
 *   for `hp-percent` / `max-hp-percent` it is thirty-seconds [core §4.4].
 *
 * `canMiss` keeps the common field's meaning: only `canMiss === false` means
 * "always hits"; absent means the hit formula runs (AGENTS.md rule 5's guard
 * shape, applied to FF7's own hit rules, core §3).
 *
 * Game case (AGENTS.md rule 14): **FF7 only.**
 */

import type { Ff7EquipmentDef, Ff7EnemyFields } from '../common/types-ff7.ts';

/** FF7's damage formulas [core §4.1 to §4.4]. `none` = no damage (Search Scope, Raise Tail). */
export type Ff7Formula = 'physical' | 'magical' | 'cure' | 'item' | 'fixed' | 'hp-percent' | 'max-hp-percent' | 'none';

/**
 * The magical elements and the hidden physical ones [core §6.1, verified: 2 sources].
 * `restorative` makes an action heal.
 */
export type Ff7Element =
  | 'fire' | 'ice' | 'lightning' | 'earth' | 'poison' | 'gravity' | 'water' | 'wind' | 'holy' | 'restorative'
  | 'cut' | 'hit' | 'punch' | 'shoot' | 'shout';

/** An affinity level [core §6.2]; mirrors `Ff7EnemyFields.elements`. */
export type Ff7Affinity = NonNullable<Ff7EnemyFields['elements']>[string];

/** Targets, relative to the user (so one table serves the party and the boss). */
export type Ff7Targeting = 'one-opponent' | 'all-opponents' | 'one-ally' | 'all-allies' | 'self';

/**
 * How an action rolls to hit [core §3.1, §3.2].
 * - `physical`: `[Dex / 4] + At% + Df% - TargetDf%`; `atPct: 'weapon'` reads the
 *   user's weapon At% (the Attack command), a number is the action's own PAt%.
 * - `magical`: `MAt% + Lvl - [TargetLvl / 2] - 1`; 255 is an automatic hit.
 */
export type Ff7HitRule = { kind: 'physical'; atPct: number | 'weapon' } | { kind: 'magical'; matPct: number };

/** Which menu an action lives under [core §9]. */
export type Ff7ActionKind = 'attack' | 'magic' | 'limit' | 'item' | 'enemy';

/** One FF7 action. Every record carries its research cite and tag in `cite`. */
export interface Ff7AbilityDef {
  id: string;
  /** Display name as the help line prints it. */
  name: string;
  kind: Ff7ActionKind;
  formula: Ff7Formula;
  /** See the unit note at the top of this file. 0 for `none`. */
  power: number;
  /** Absent for `canMiss: false` actions and for `none` animations. */
  hit?: Ff7HitRule;
  /** `false` = always hits. Only `=== false` is read. */
  canMiss?: boolean;
  mpCost: number;
  targeting: Ff7Targeting;
  /** Magic that toggles between one and all targets: only such magic splits on several targets [core §4.5 step 8]. */
  canToggleAll?: boolean;
  /** Elements carried; `'weapon'` = the user's weapon element (the Attack command). */
  element: ReadonlyArray<Ff7Element> | 'weapon';
  /** Ignores the row check [core §5.1]; `'weapon'` = the user's weapon decides. */
  longRange?: boolean | 'weapon';
  reflectable?: boolean;
  /**
   * Heals instead of harming although no Restorative element is sourced for it
   * (Potion). Cure heals through its Restorative element [core §8.4].
   */
  heals?: boolean;
  /** Raise Tail / Drop Tail: the form this action switches the user to (0-based). */
  toForm?: number;
  /** Phoenix Down: revive, restoring `[MaxHP / hpDivisor]` [core §8.6]. */
  revive?: { hpDivisor: number };
  /** Only ever used as a counter (Tail Laser) [gs §4]. */
  counterOnly?: boolean;
  /** Research section and tag, e.g. `"core §8.4 [single source: Fergusson PM §2.6]"`. */
  cite: string;
}

/** A consumable [core §8.6]. `effect` is the id of an {@link Ff7AbilityDef} with `kind: 'item'`. */
export interface Ff7ItemDef {
  id: string;
  name: string;
  effect: string;
  usableInBattle: boolean;
  cite: string;
}

/** One Materia [core §8.3, §8.4]. */
export interface Ff7MateriaDef {
  id: string;
  name: string;
  kind: 'magic' | 'support' | 'command' | 'independent' | 'summon';
  /** Spells granted at the Materia's current level (the slice has level 1 only). */
  spells: readonly string[];
  /** Percent changes to Max HP / Max MP, summed across Materia then applied once [core §8.5 derived]. */
  hpPct: number;
  mpPct: number;
  /** Flat primary-stat changes. */
  stat: Partial<Record<'str' | 'vit' | 'mag' | 'spr' | 'dex' | 'lck', number>>;
  /** AP needed for level 2. */
  apToLevel2: number;
  cite: string;
}

/** The Limit numbers per character: LNum by Limit Level 1 to 4 [core §7.1]. */
export interface Ff7LimitTable {
  lnum: readonly [number, number, number, number];
  cite: string;
}

/** Everything the FF7 engine needs from `src/data/ff7`, handed in by the app. */
export interface Ff7Registry {
  abilities: Readonly<Record<string, Ff7AbilityDef>>;
  items: Readonly<Record<string, Ff7ItemDef>>;
  materia: Readonly<Record<string, Ff7MateriaDef>>;
  equipment: Readonly<Record<string, Ff7EquipmentDef>>;
  /** Character id -> Limit table. */
  limits: Readonly<Record<string, Ff7LimitTable>>;
}
