/**
 * Boss-only `AbilityDef`s for **Overdrive Sin** (`m140` "Sin", bestiary #172),
 * link 4 of the assault from the *Fahrenheit*: the head, over Bevelle.
 *
 * Every row is read off `research/ffx-sin.md` §3.4, the decompiled action table
 * (`ffx_monmagic2` rows 6:41 and 6:156 to 6:160), with the tag the research
 * gives it. **Game case: FFX only** [AGENTS.md rule 14; research §0.3]: CTB,
 * aeons, a turn clock ending in a scripted Game Over; nothing here is imported
 * by `src/battle/ffx2/**`.
 *
 * ## Accuracy
 *
 * §3 (all rows): hit chance formula "Always hits" `[decompiled]`, so every row
 * carries `canMiss: false` explicitly [AGENTS.md hard rule 5; the engine reads
 * only `canMiss === false`].
 *
 * ## Rank
 *
 * No rank byte is recorded for these rows in the research; every row ships the
 * engine's default rank 3, labelled `[estimate]` (the same default Evrae's and
 * Yojimbo's rows use).
 *
 * ## What is NOT a row
 *
 * - **"Open mouth"** (turns 4 to the last): §3.4 "*no row in the decompiled
 *   action assignments*: a scripted pose, not an action" `[single source: wiki]`.
 *   The AI passes those turns and publishes the clock instead
 *   (`src/battle/ffx/ai/overdrive-sin-rules.ts`).
 * - **The Game Over after Giga-Graviton** is the script, not the row: the row
 *   alone would only KO the party (§3.4, `[verified: 4 sources]` for the Game
 *   Over). The engine ends the battle on the flag the AI raises.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

/**
 * §3.4 row 6:41 **"Drawn to Sin."** — turns 1 to 3, no damage, pulls the ship in
 * `[decompiled]` + wiki + Gestahl + SinirothX + bover_87 `[verified: 5 sources]`.
 * The name is a decompiled system string and is kept verbatim (§9.2 note).
 */
export const drawnToSin: AbilityDef = {
  id: 'overdrive-sin-drawn',
  name: 'Drawn to Sin.',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate] — no rank byte recorded
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 0, // the game's record has no hit record (re-parity AI lane C): the pull raises no hit event on Sin
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false, // §3 "Always hits" [decompiled]
  messageTemplate: 'Drawn to Sin.',
};

/**
 * The three party Gazes share everything but the status. §3.4 rows 6:158 /
 * 6:159 / 6:157: Magic formula (Sin's MAG 30), base **20**, whole party,
 * **Special** type ("Shell does not halve it" — `'other'` in this contract), one
 * status at **30** `[decompiled]` + wiki + bover_87. §5.4: "the whole party
 * takes the damage and the same one status" `[verified: 3 sources]`.
 *
 * Any Ward blocks it completely: resistance is subtracted from the chance, and
 * 30 − 50 < 0 (§5.4 `[derived]` + bover_87 + wiki). The engine's own status
 * roll does that; nothing here special-cases it.
 */
function gaze(id: string, status: 'petrify' | 'confuse' | 'zombie', row: string): AbilityDef {
  return {
    id,
    name: 'Gaze',
    game: 'ffx',
    category: 'enemy',
    mpCost: 0,
    rank: 3, // [estimate]
    power: 20, // §3.4 [decompiled]; the row number is in `extra.decompiledRow`
    formula: 'magic',
    damageType: 'other', // §3.4 "Special (Shell does not halve it)" [decompiled]
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    // §3.4 [decompiled]: chance byte 30. Duration: Petrify and Zombie are
    // until-cured (254, the house convention for both, e.g. Evrae's Stone Gaze);
    // Confuse's duration is not recorded in the research: 254, [estimate], the
    // convention Yunalesca's Confuse rows use.
    statusEffects: [{ status, chance: 30, duration: 254 }],
    removesStatuses: [],
    flags: ['is-counter'],
    canMiss: false, // §3 "Always hits" [decompiled]
    extra: { decompiledRow: row },
    messageTemplate: '{user} uses {ability}',
  };
}

/** §3.4 row 6:158 — Gaze (Petrify 30). */
export const gazePetrify: AbilityDef = gaze('overdrive-sin-gaze-petrify', 'petrify', '6:158');
/** §3.4 row 6:159 — Gaze (Confuse 30). */
export const gazeConfuse: AbilityDef = gaze('overdrive-sin-gaze-confuse', 'confuse', '6:159');
/** §3.4 row 6:157 — Gaze (Zombie 30). */
export const gazeZombie: AbilityDef = gaze('overdrive-sin-gaze-zombie', 'zombie', '6:157');

/**
 * §3.4 row 6:160 — **Gaze against an aeon**: Magic, base **50**, the aeon, Special,
 * no status `[decompiled]` + wiki (the "A version", power 50). Aimed at whatever
 * is on the party's side of the field, which while an aeon holds it is the aeon.
 */
export const gazeAeon: AbilityDef = {
  id: 'overdrive-sin-gaze-aeon',
  name: 'Gaze',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 50, // §3.4 row 6:160 [decompiled]
  formula: 'magic',
  damageType: 'other', // Special [decompiled]
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['is-counter'],
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:160' },
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.4 row 6:156 — **Giga-Graviton**: Percentage Total 16/16 = **100 % of max
 * HP**, whole party, Magical, always Break Damage Limit, **Death 255**
 * `[decompiled]` + wiki + bover_87 + Gestahl + SinirothX `[verified: 5 sources]`.
 *
 * The row alone only KOs whoever it hits. **The Game Over is the script** and it
 * ignores Auto-Life and an aeon on the field (§3.4, `[verified: 4 sources]`):
 * `ai/overdrive-sin-rules.ts` raises the engine's scripted-Game-Over flag on
 * the same turn. It is Sin's 12th turn (S-1, settled by the script: re-parity AI lane C, D-31).
 */
export const gigaGraviton: AbilityDef = {
  id: 'overdrive-sin-giga-graviton',
  name: 'Giga-Graviton',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 16, // §3.4 [decompiled] — 16/16 of max HP
  formula: 'percent-total',
  damageType: 'magical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'ko', chance: 255, duration: 0 }], // §3.4 Death 255 [decompiled]; duration moot for an instant status
  removesStatuses: [],
  flags: ['always-break-damage-limit'],
  breaksDamageLimit: true,
  canMiss: false, // §3 "Always hits" [decompiled]
  extra: { decompiledRow: '6:156', scriptedGameOver: true },
  messageTemplate: '{user} uses {ability}',
};

/** Every Overdrive Sin row, keyed by id. */
export const OVERDRIVE_SIN_ABILITIES: Record<string, AbilityDef> = Object.fromEntries(
  [drawnToSin, gazePetrify, gazeConfuse, gazeZombie, gazeAeon, gigaGraviton].map((a) => [a.id, a]),
);
