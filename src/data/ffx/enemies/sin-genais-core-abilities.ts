/**
 * Boss-only `AbilityDef`s for **Sinspawn Genais** (`m139`, bestiary #170) and
 * **Sin's Core** (`m138` "Sin", bestiary #171), link 3 of the assault from the
 * *Fahrenheit*, on Sin's back.
 *
 * Every row is read off `research/ffx-sin.md` §3.2 and §3.3 (the decompiled
 * `ffx_monmagic1` / `ffx_monmagic2` rows), with the tag the research gives it.
 * Which row fires when (the shell, the counters, the Core's charge) is the AI's:
 * `src/battle/ffx/ai/sin-genais-core*.ts` (package G).
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research §0.3].
 *
 * ## Accuracy, rank, Silence
 *
 * - §3: every row "Always hits" `[decompiled]`, so `canMiss: false` on each
 *   [AGENTS.md hard rule 5]. Every row is rank 3 `[decompiled]`.
 * - **Silenceable rows** (Waterga, Cura, the Core's four elements, §3.2 / §3.3)
 *   carry the Blk or Wht Magic category, the Seymour Flux precedent
 *   (`seymour-flux-abilities.ts#flareSelf`): the engine's Silence rule
 *   (`abilities.ts#blockedBySilence`) blocks those categories. The AI consults
 *   it; nothing blocks an enemy row by itself.
 * - **Counter rows** carry `is-counter` (a counter never triggers another).
 *
 * ## Not built
 *
 * Curaga (3:45) and Watera (3:72) are in Genais's menu list and assigned to no
 * script `[decompiled]`: unused, the Yojimbo Y-4 rule (§3.2).
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { SIN_NEGATION_LIST } from './sin-fins-abilities.ts';

/** A no-damage, self-targeted system line, its name a decompiled string kept verbatim. */
function systemLine(id: string, name: string, row: string): AbilityDef {
  return {
    id,
    name,
    game: 'ffx',
    category: 'enemy',
    mpCost: 0,
    rank: 3, // §3 [decompiled]
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false, // §3 "Always hits" [decompiled]
    extra: { decompiledRow: row },
    messageTemplate: name,
  };
}

// ---------------------------------------------------------------------------
// Sinspawn Genais (m139) — §3.2
// ---------------------------------------------------------------------------

/**
 * §3.2 row 6:151 **Venom**: out of the shell, turns 1 and 2 of 3. **Magic**
 * formula (MAG 35), base **32**, one random character, **Physical** type
 * (Protect halves it; **can crit**, REVIEW must-change 11), **Poison 100 %**
 * `[decompiled]` + wiki + SinirothX + Gestahl. S-3: Poison only (bover_87's Slow
 * is not so). The Poison's duration is not in the row: 254 (until cured), the
 * house convention for Poison (Evrae's Poison Breath), **our estimate**.
 */
export const genaisVenom: AbilityDef = {
  id: 'sin-genais-venom',
  name: 'Venom',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 32, // §3.2 [decompiled]
  formula: 'magic',
  damageType: 'physical', // §3.2 [decompiled] — "Physical (Protect halves it; can crit)"
  element: ['none'],
  targeting: 'single-enemy', // one random character: an empty aim resolves to a random party member
  hits: 1,
  statusEffects: [{ status: 'poison', chance: 100, duration: 254 }], // §3.2 Poison 100 [decompiled]; 254 our estimate
  removesStatuses: [],
  flags: ['crit-eligible'],
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:151' },
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.2 row 6:152 **Thrashing**: out of the shell, turn 3 of 3. Strength, base
 * **32**, whole party, Physical, **can crit** `[decompiled]` + wiki + SinirothX
 * + Gestahl `[verified: 4 sources]`.
 */
export const genaisThrashing: AbilityDef = {
  id: 'sin-genais-thrashing',
  name: 'Thrashing',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 32, // §3.2 [decompiled]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['crit-eligible'],
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:152' },
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.2 row 6:150 **Sigh**: in the shell, every turn. Magic, base **24**, whole
 * party, Magical, **Darkness 100 % for 3 turns** `[decompiled]` + wiki +
 * SinirothX + Gestahl `[verified: 4 sources]`.
 */
export const genaisSigh: AbilityDef = {
  id: 'sin-genais-sigh',
  name: 'Sigh',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 24, // §3.2 [decompiled]
  formula: 'magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'darkness', chance: 100, duration: 3 }], // §3.2 [decompiled]
  removesStatuses: [],
  flags: [],
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:150' },
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.2 row 3:76 **Waterga**: the **counter** to magic aimed at Genais, out of
 * the shell, on **the caster**. Magic, base **42**, Magical, Water, reflectable,
 * silenceable, shatter 10 `[decompiled]` + wiki + bover_87 + SinirothX
 * `[verified: 4 sources]`. The aim is the collector's (`SinCounter.targets`).
 */
export const genaisWaterga: AbilityDef = {
  id: 'sin-genais-waterga',
  name: 'Waterga',
  game: 'ffx',
  category: 'blackmagic', // silenceable (see the header)
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 42, // §3.2 [decompiled]
  formula: 'magic',
  damageType: 'magical',
  element: ['water'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['reflectable', 'shatter', 'is-counter'],
  shatterChance: 10, // §3.2 [decompiled]
  canReflect: true,
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '3:76', silenceable: true },
  messageTemplate: '{user} casts {ability}',
};

/**
 * §3.2 row 3:44 **Cura**: the **counter** to any hit while Genais is in its
 * shell, on **itself** ("Counter Self"). Healing, base **40**, Magical,
 * reflectable `[decompiled]` + 4 guides (about 1,480 a cast, §6).
 */
export const genaisCura: AbilityDef = {
  id: 'sin-genais-cura',
  name: 'Cura',
  game: 'ffx',
  category: 'whitemagic', // silenceable (see the header)
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 40, // §3.2 [decompiled]
  formula: 'healing',
  damageType: 'magical',
  element: ['none'],
  targeting: 'self',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['heals', 'reflectable', 'is-counter'],
  canReflect: true,
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '3:44', silenceable: true },
  messageTemplate: '{user} casts {ability}',
};

/** §3.2 row 6:154 — **"Enters shell."** (the shell toggles Armored and percentage immunity) `[decompiled]` + wiki. */
export const genaisShellIn: AbilityDef = systemLine('sin-genais-shell-in', 'Enters shell.', '6:154');
/** §3.2 row 6:153 — **"Exits shell."** `[decompiled]` + wiki. */
export const genaisShellOut: AbilityDef = systemLine('sin-genais-shell-out', 'Exits shell.', '6:153');
/** §3.2 row 6:155 — **"Magic absorbed."**: a spell aimed at the Core while Genais lives; the Core takes nothing `[verified: 4 sources]`. */
export const magicAbsorbed: AbilityDef = systemLine('sin-magic-absorbed', 'Magic absorbed.', '6:155');

// ---------------------------------------------------------------------------
// Sin's Core (m138) — §3.3
// ---------------------------------------------------------------------------

/** §3.3 row 6:189 — **"Core is inactive."**, while Genais is out of its shell `[decompiled]` + wiki + SinirothX. */
export const coreInactive: AbilityDef = systemLine('sin-core-inactive', 'Core is inactive.', '6:189');
/** §3.3 row 6:196 — **"Core gathers energy."**, the charge turn `[decompiled]` + wiki. */
export const coreGathers: AbilityDef = systemLine('sin-core-gathers', 'Core gathers energy.', '6:196');

/**
 * §3.3 row 6:148 **Gravija**: the turn after the charge. Percentage Current
 * **12** (75 %), the whole party **and Genais when it is out of its shell**
 * `[decompiled]` + wiki enemy-ability table + Gestahl. Targeting `all`: Genais's
 * shell makes it percentage-immune, and the Core is percentage-immune itself, so
 * it never hurts the Core (S-14, resolved).
 */
export const coreGravija: AbilityDef = {
  id: 'sin-core-gravija',
  name: 'Gravija',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 12, // §3.3 [decompiled]
  formula: 'percent-current',
  damageType: 'magical',
  element: ['none'],
  targeting: 'all',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['always-break-damage-limit'],
  breaksDamageLimit: true,
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:148' },
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.3 row 6:197 **Negation**: the **counter** when the Core is targeted, taking
 * priority; "Counter All" (both sides) `[decompiled]` + wiki + bover_87. The same
 * removal list as the Fins' (§3.1).
 */
export const coreNegation: AbilityDef = {
  id: 'sin-core-negation',
  name: 'Negation',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 0,
  formula: 'none',
  damageType: 'magical',
  element: ['none'],
  targeting: 'all',
  hits: 1,
  statusEffects: [],
  removesStatuses: [...SIN_NEGATION_LIST],
  flags: ['removes-statuses', 'is-counter'],
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:197' },
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.3 rows 6:57 to 6:60 **Fire / Blizzard / Thunder / Water**: the **counter**
 * cycle when targeted, in that order. Magic (MAG 30), base **16**, **whole
 * party**, reflectable, silenceable `[decompiled]` + wiki + bover_87 (order)
 * `[verified: 3 sources]`. S-13: the decompile's party and 16, not SinirothX's
 * single target and 12.
 */
function coreElement(id: string, name: string, element: 'fire' | 'ice' | 'lightning' | 'water', row: string): AbilityDef {
  return {
    id,
    name,
    game: 'ffx',
    category: 'blackmagic', // silenceable (see the header)
    mpCost: 0,
    rank: 3, // §3 [decompiled]
    power: 16, // §3.3 [decompiled]
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'is-counter'],
    canReflect: true,
    canMiss: false, // §3 "Always hits" [decompiled]
    extra: { decompiledRow: row, silenceable: true },
    messageTemplate: '{user} casts {ability}',
  };
}

export const coreFire: AbilityDef = coreElement('sin-core-fire', 'Fire', 'fire', '6:57');
export const coreBlizzard: AbilityDef = coreElement('sin-core-blizzard', 'Blizzard', 'ice', '6:58');
export const coreThunder: AbilityDef = coreElement('sin-core-thunder', 'Thunder', 'lightning', '6:59');
export const coreWater: AbilityDef = coreElement('sin-core-water', 'Water', 'water', '6:60');

/** Every Genais and Core row, keyed by id. */
export const SIN_GENAIS_CORE_ABILITIES: Record<string, AbilityDef> = Object.fromEntries(
  [
    genaisVenom, genaisThrashing, genaisSigh, genaisWaterga, genaisCura, genaisShellIn, genaisShellOut, magicAbsorbed,
    coreInactive, coreGathers, coreGravija, coreNegation, coreFire, coreBlizzard, coreThunder, coreWater,
  ].map((a) => [a.id, a]),
);
