/**
 * Boss-only `AbilityDef`s for **the Left Fin and the Right Fin** (`m136` / `m137`,
 * bestiary #168 / #169), links 1 and 2 of the assault from the *Fahrenheit*.
 *
 * Every row is read off `research/ffx-sin.md` §3.1, the decompiled action table
 * (`ffx_monmagic2` rows 6:144 to 6:188), with the tag the research gives it. The
 * two Fins share every row but the Gravija pair (6:144 / 6:166 on the Left,
 * 6:182 / 6:184 on the Right), which are identical in every field this contract
 * reads, so one record serves both and names both rows in `extra`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research §0.3]: CTB, the airship
 * range, Cid's Trigger Command; nothing here is imported by `src/battle/ffx2/**`.
 *
 * ## Accuracy
 *
 * §3 (all rows): hit chance formula "Always hits" `[decompiled]`, so every row
 * carries `canMiss: false` explicitly [AGENTS.md hard rule 5; the engine reads
 * only `canMiss === false`].
 *
 * ## Rank
 *
 * §3: "All rows: rank 3" `[decompiled]`.
 *
 * ## Which row fires when is the AI's, not the data's
 *
 * Ram at NEAR, Smack at FAR, the charge and its Gravija (or the FAR whiff), and
 * Negation as a counter on being targeted are `src/battle/ffx/ai/sin-fins*.ts`
 * (package F). The two dummied rows "Sin draws back." / "Sin draws closer."
 * (6:142 / 6:143) are **not built**: they are in the menu list but assigned to
 * no script (§3.1, S-10).
 */

import type { AbilityDef, StatusId } from '../../../battle/common/types.ts';

/**
 * §3.1 "Negation's removal list" (both rows, chance 255) `[decompiled]` + wiki
 * `[verified: 2 sources]`: **24 statuses** (REVIEW must-change 7: the list, not a
 * count). Not Death, Doom, Curse, Auto-Life, Eject, nor the Cheer and Focus
 * stacks. A permanent status (stack 255) survives: the removal is a dispel.
 * Duplicated in `src/battle/ffx/ai/sin-negation.ts#NEGATION_REMOVES` (the battle
 * layer does not import data); the test pins the two equal.
 */
export const SIN_NEGATION_LIST: readonly StatusId[] = [
  'zombie', 'petrify', 'poison',
  'power-break', 'magic-break', 'armor-break', 'mental-break',
  'confuse', 'berserk', 'provoke', 'threaten', 'sleep', 'silence', 'darkness',
  'shell', 'protect', 'reflect',
  'nulblaze', 'nulfrost', 'nulshock', 'nultide',
  'regen', 'haste', 'slow',
];

/** A no-damage, self-targeted system line (a telegraph or a skipped turn). */
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
    messageTemplate: name, // a decompiled system string, kept verbatim (§3.1)
  };
}

/**
 * §3.1 row 6:146 **Ram** (italic, a code name): NEAR, Strength, base **28**,
 * whole party, Physical, **strong Delay**, `long_range = false` `[decompiled]` +
 * wiki ("Delay (Strong): Infinite") `[verified: 2 sources]`.
 */
export const finRam: AbilityDef = {
  id: 'sin-fin-ram',
  name: 'Ram',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 28, // §3.1 [decompiled]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['strong-delay'],
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:146' },
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.1 row 6:147 **Smack** (italic, a code name): FAR, Strength, base **34**,
 * whole party, Physical, `long_range = true` `[decompiled]` + wiki `[verified: 2
 * sources]`. Harder than Ram, and no Delay (S-9, resolved).
 */
export const finSmack: AbilityDef = {
  id: 'sin-fin-smack',
  name: 'Smack',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 34, // §3.1 [decompiled]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['long-range'],
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:147' },
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.1 rows 6:144 (Left) / 6:182 (Right) **Gravija**: NEAR, the turn after the
 * charge. **Percentage Current, 12/16 = 75 %**, whole party, Magical, always
 * Break Damage Limit `[decompiled]` + wiki + bover_87 + SinirothX `[verified: 4
 * sources]`. It **cannot kill**: `percent-current` floors, so a quarter always
 * stays and 1 HP takes 0 (§3.1 `[derived]`). The Right Fin's 6:182 carries
 * `long_range = true` where 6:144 does not; nothing reads it (§3.1, recorded).
 */
export const finGravija: AbilityDef = {
  id: 'sin-fin-gravija',
  name: 'Gravija',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 12, // §3.1 [decompiled] — 12/16 of current HP
  formula: 'percent-current',
  damageType: 'magical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['always-break-damage-limit'],
  breaksDamageLimit: true,
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:144 / 6:182' },
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.1 rows 6:166 (Left) / 6:184 (Right) **Gravija (long range)**: a charged
 * Gravija that resolves at FAR. **No damage**, `long_range = true`
 * `[decompiled]`; Gestahl and Haunter12O say it does nothing at range
 * `[verified: 3 sources]`. The Fins' dodge, as Evrae's "Out of breath range.".
 */
export const finGravijaFar: AbilityDef = {
  id: 'sin-fin-gravija-far',
  name: 'Gravija',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 0, // §3.1 [decompiled] — no damage
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['long-range'],
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:166 / 6:184' },
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.1 row 6:145 **Negation (near)**: no damage, removes the 24 statuses of
 * {@link SIN_NEGATION_LIST}, target **"All" (both sides)**, Magical
 * `[decompiled]` + wiki "Everyone" version. A counter on being targeted (§5.1.3,
 * `[verified: 3 sources]`; S-11), so it carries `is-counter`.
 */
export const finNegation: AbilityDef = {
  id: 'sin-fin-negation',
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
  extra: { decompiledRow: '6:145' },
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.1 row 6:167 **Negation (far)**: the same removal list, target **Self**,
 * `long_range = true` `[decompiled]` + wiki ("it will not target the party")
 * `[verified: 2 sources]`. Only while the Fin has Mental Break (§5.1.3, the AI's).
 */
export const finNegationFar: AbilityDef = {
  id: 'sin-fin-negation-far',
  name: 'Negation',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3 [decompiled]
  power: 0,
  formula: 'none',
  damageType: 'magical',
  element: ['none'],
  targeting: 'self',
  hits: 1,
  statusEffects: [],
  removesStatuses: [...SIN_NEGATION_LIST],
  flags: ['removes-statuses', 'is-counter', 'long-range'],
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:167' },
  messageTemplate: '{user} uses {ability}',
};

/** §3.1 rows 6:168 (Left) / 6:186 (Right) — **"Core gathers energy."**, the Gravija telegraph (NEAR only) `[decompiled]` + wiki + SinirothX. */
export const finGathers: AbilityDef = systemLine('sin-fin-gathers', 'Core gathers energy.', '6:168 / 6:186');

/** §3.1 row 6:188 — **"Sin remains motionless."**, a skipped turn `[decompiled]` + wiki + Gestahl + SinirothX. */
export const finMotionless: AbilityDef = systemLine('sin-motionless', 'Sin remains motionless.', '6:188');

/** Every Fin row, keyed by id. */
export const SIN_FINS_ABILITIES: Record<string, AbilityDef> = Object.fromEntries(
  [finRam, finSmack, finGravija, finGravijaFar, finNegation, finNegationFar, finGathers, finMotionless].map((a) => [a.id, a]),
);
