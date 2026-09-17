/**
 * Boss-only `AbilityDef`s for the Lady Yunalesca encounter (Zanarkand Dome).
 * Source: `research/ffx-yunalesca.md` §3, §5.
 *
 * Her **Cura / Curaga / Regen** are deliberately *not* here — the research is
 * explicit that they are "literally the player's Cura / Curaga / Regen
 * records" [§3.1], same MP cost, same power, same `affected_by_reflect`.
 * Reference the shared ids `'cura'`, `'curaga'`, `'regen'` from the abilities
 * catalog (owned by the abilities data agent) instead of duplicating them
 * here. Everything below either has no player equivalent (Dispelling Slap,
 * Absorb, Hellbiter, Mind Blast, Mega Death) or a boss-only status-counter
 * shape (Blind/Silence/Sleep) that no player-castable spell shares.
 *
 * `extra` keys used in this file, consumed by the engine's AI script:
 *   - `counterOnly: true` — on `blind-counter` / `silence-counter` /
 *     `sleep-counter`. These are **never** scheduled turns; they fire from
 *     the AI's `onHit` hook (an action landing on Yunalesca in Form I) and
 *     cost 0 CTB. The category mapping is physical -> Blind, magic ->
 *     Silence, everything else -> Sleep [§5.1].
 *   - `formIGateQuirk: true` — on `blind-counter` and `silence-counter`
 *     only. The original game gates these on the status *Yunalesca's own
 *     last target* already carries, not the attacker's — an apparent
 *     original-game bug, reproduced deliberately. Sleep has no such gate.
 *     Ship it behind `yunalesca.formI.counterGateQuirk` [§5.1, single source].
 *   - `formsIIandIIICounter: true` — on `dispelling-slap`. In Forms II/III
 *     this fires from `onHit` (Form II: 49% of eligible hits; Form III:
 *     every eligible hit) at 0 CTB. Only the **Form I scheduled** use
 *     consumes a real turn (see `rank` below).
 *   - `slapRankLiteral: true` — on `dispelling-slap`. Rank byte is a
 *     decompiled `0`. Ship it literally (Form I's Slap<->Absorb toggle makes
 *     a 0-recovery Slap structurally safe: it is always followed by a
 *     rank-3 Absorb). Keep a `yunalesca.formI.slapRank` config of `0 | 3` in
 *     the engine so footage can flip it later [§5.3, §14.8].
 *   - `absorbTargetsHighestCurrentHp: true` — on `absorb`. AI targeting rule,
 *     not a data field: pick the active party/aeon member with the highest
 *     **current** HP (not max HP) [§5.1, decompiled offset 02AB].
 *   - `transformsToForm: 1 | 2` — on `metamorphosis-1` / `metamorphosis-2`.
 *     Fires together with the form's entry attack (Hellbiter / Mega Death)
 *     on one CTB turn: her delay is zeroed and every active party member's
 *     delay is incremented by 1 before the cutscene, per §14.13 — that CTB
 *     surgery is an engine concern, documented here for reference.
 *
 * **Edit note (2026-09-16, FFX engine agent, at the coordinator's request).**
 * `canMiss: false` added to every record below that left it unset: `absorb`,
 * `osmose`, `mind-blast`, `mind-blast-aeon`, `mega-death`, `metamorphosis-1`
 * and `metamorphosis-2`. Magical and status actions always hit; only physical
 * Strength attacks roll against the action's own accuracy byte, and Enemy
 * Accuracy is never read [ffx-combat-core §2.11; ffx-yunalesca §3, §16
 * "Absorb ... every time, no variance"]. Her two physical attacks
 * (`dispelling-slap`, `hellbiter`) and the three counters already carried it.
 * The engine enforces the same rule on its own (an enemy action with no
 * accuracy byte uses ALWAYS), so this is belt-and-braces documentation, not
 * the behavioural fix.
 *
 * **`mega-death` is deliberately unchanged otherwise.** `ko` *is* Death in
 * this contract (there is no separate `death` status — docs/CONTRACTS.md,
 * "Vocabulary notes"), and chance 100 is §5.3's figure. Its Zombie exception
 * lives in the engine's status roll, where a living Zombie's Death resistance
 * is raised to 255. The Chapter 2 inversion was three engine bugs, not this
 * record: a landed `ko` attached a marker without killing, a KO'd Zombie could
 * never be revived, and the transformation entry actions never fired.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

/**
 * §3, §5.1, §5.3 [decompiled, `command.bin 607Ch` + `ffx_monmagic2.csv` byte
 * 36, verified: 2 sources]. Strips Shell/Protect/Haste (`removes-statuses`,
 * chance 255 each — unconditional). Rank byte is literally 0; see
 * `slapRankLiteral` above. Not reflectable. Bonus crit +10.
 */
export const dispellingSlap: AbilityDef = {
  id: 'dispelling-slap',
  name: 'Dispelling Slap',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 0, // §5.3, §14.8 [verified: 2 sources] — literal, see slapRankLiteral
  power: 16,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['shell', 'protect', 'haste'],
  flags: ['removes-statuses', 'crit-eligible'],
  bonusCrit: 10,
  accuracy: 255,
  canMiss: false,
  extra: { formsIIandIIICounter: true, slapRankLiteral: true },
  messageTemplate: '{user} uses Dispelling Slap on {target}',
};

/**
 * §3, §3.1, §4.5 [decompiled, verified: 3 sources]. Exactly
 * `floor(target.maxHP / 2)`, no variance (Percentage Total skips the RNG
 * step). `drains` credits the same amount to Yunalesca. Not reflectable.
 */
export const absorb: AbilityDef = {
  id: 'absorb',
  name: 'Absorb',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 8,
  formula: 'percent-total',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['drains'],
  canMiss: false,
  extra: { absorbTargetsHighestCurrentHp: true },
  messageTemplate: '{user} uses Absorb on {target}',
};

/**
 * §3, §4.5 [decompiled, single source]. Used only against an aeon (Forms II
 * and III aeon sub-cycles). 100% of the target's maximum MP, ignores
 * Armored. Not reflectable.
 */
export const osmose: AbilityDef = {
  id: 'osmose',
  name: 'Osmose',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 16,
  formula: 'percent-total',
  damageType: 'magical',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['drains-mp', 'ignores-armored'],
  canMiss: false,
  messageTemplate: '{user} uses Osmose on {target}',
};

/**
 * §3, §3.1 [decompiled, verified: 2 sources]. Whole active party, 100%
 * Zombie. Records 128 (Form II) and 209 (Form III) are byte-identical in
 * every gameplay field; implemented as one ability. Not reflectable.
 */
export const hellbiter: AbilityDef = {
  id: 'hellbiter',
  name: 'Hellbiter',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 16,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'zombie', chance: 100, duration: 254 }],
  removesStatuses: [],
  flags: ['crit-eligible'],
  accuracy: 255, // §3 [decompiled] hit formula "Always"
  canMiss: false,
  messageTemplate: '{user} uses Hellbiter',
};

/** §3 [decompiled]. Whole active party, Confuse 50 chance. Not reflectable. */
export const mindBlastParty: AbilityDef = {
  id: 'mind-blast',
  name: 'Mind Blast',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 16,
  formula: 'magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'confuse', chance: 50, duration: 254 }],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} uses Mind Blast',
};

/**
 * §3, §5.3 [decompiled, mm2 record 246]. The aeon-cycle variant: same
 * damage, same Confuse 50, plus a guaranteed Curse (a no-RNG status flag —
 * chance 255 signals "ignores ordinary resistance", matching the aeon
 * having no Curse resistance at all).
 */
export const mindBlastAeon: AbilityDef = {
  id: 'mind-blast-aeon',
  name: 'Mind Blast',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 16,
  formula: 'magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [
    { status: 'confuse', chance: 50, duration: 254 },
    { status: 'curse', chance: 255, duration: 254 },
  ],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} uses Mind Blast on {target}',
};

/**
 * §3, §3.1, §5.3 [decompiled, verified: 6 sources]. Whole active party,
 * **0 HP damage** — purely a 100-chance `ko` application. Spares Zombies
 * (raised Death resistance), Deathproof, and Auto-Life saves the target
 * after the fact. Not reflectable.
 */
export const megaDeath: AbilityDef = {
  id: 'mega-death',
  name: 'Mega Death',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'magical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'ko', chance: 100, duration: 0 }], // duration is moot for an instant status; StatusApplication.duration is non-nullable
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} uses Mega Death',
};

/**
 * §5.1 [decompiled + single source for the exact stack duration]. Form I
 * only, fired from `onHit` against a physical attacker. See `extra` above
 * for the counter-gate quirk. Reflectable: bounces onto the counter's own
 * source, and Yunalesca is Dark-immune, so a reflecting party neutralises it.
 */
export const blindCounter: AbilityDef = {
  id: 'blind-counter',
  name: 'Blind',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [{ status: 'darkness', chance: 100, duration: 3 }],
  removesStatuses: [],
  flags: ['reflectable', 'is-counter'],
  canReflect: true,
  canMiss: false,
  extra: { counterOnly: true, formIGateQuirk: true },
  messageTemplate: '{user} counters with Blind',
};

/** §5.1 [decompiled]. Form I only, fired against a magic attacker. */
export const silenceCounter: AbilityDef = {
  id: 'silence-counter',
  name: 'Silence',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [{ status: 'silence', chance: 100, duration: 3 }],
  removesStatuses: [],
  flags: ['reflectable', 'is-counter'],
  canReflect: true,
  canMiss: false,
  extra: { counterOnly: true, formIGateQuirk: true },
  messageTemplate: '{user} counters with Silence',
};

/** §5.1 [decompiled]. Form I only, fired against anything else (Skill/Special/Item/Overdrive/Use/Mix). No gate quirk. */
export const sleepCounter: AbilityDef = {
  id: 'sleep-counter',
  name: 'Sleep',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [{ status: 'sleep', chance: 100, duration: 3 }],
  removesStatuses: [],
  flags: ['reflectable', 'is-counter'],
  canReflect: true,
  canMiss: false,
  extra: { counterOnly: true },
  messageTemplate: '{user} counters with Sleep',
};

/** §5.1 [decompiled]. Self-targeted, no damage. Form I -> II transformation cue, fires together with the entry Hellbiter. */
export const metamorphosis1: AbilityDef = {
  id: 'metamorphosis-1',
  name: 'Metamorphosis',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 0,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  extra: { transformsToForm: 1 },
  messageTemplate: '{user} transforms',
};

/** §5.2, §5.3 [decompiled]. Form II -> III transformation cue, fires together with the entry Mega Death. */
export const metamorphosis2: AbilityDef = {
  id: 'metamorphosis-2',
  name: 'Metamorphosis',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 0,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  extra: { transformsToForm: 2 },
  messageTemplate: '{user} transforms',
};

/** All Yunalesca-encounter-only abilities, keyed by id, for lookups and tests. */
export const YUNALESCA_ABILITIES: Record<string, AbilityDef> = {
  [dispellingSlap.id]: dispellingSlap,
  [absorb.id]: absorb,
  [osmose.id]: osmose,
  [hellbiter.id]: hellbiter,
  [mindBlastParty.id]: mindBlastParty,
  [mindBlastAeon.id]: mindBlastAeon,
  [megaDeath.id]: megaDeath,
  [blindCounter.id]: blindCounter,
  [silenceCounter.id]: silenceCounter,
  [sleepCounter.id]: sleepCounter,
  [metamorphosis1.id]: metamorphosis1,
  [metamorphosis2.id]: metamorphosis2,
};

export default YUNALESCA_ABILITIES;
