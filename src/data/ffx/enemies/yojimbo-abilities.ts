/**
 * Boss-only `AbilityDef`s for **Yojimbo** (`m288`) and **Daigoro** (`m266`
 * "Koma Inu"), Lady Ginnem's aeon in the Cavern of the Stolen Fayth.
 *
 * Every row is read off `research/ffx-yojimbo.md` §3.1, the decompiled action
 * table (`ffx_monmagic1`, file 4), cross-checked against the wiki's enemy
 * ability table `[verified: 2 sources]` except where a row says otherwise.
 * The PS2 and HD records are byte-identical (§0.2 step 3).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. FFX-2's Yojimbo has different
 * rows under the same names — its Kozuka drains 25 % MP and poisons, its
 * Zanmato drops the party to 1 HP / 1 MP (§8.2) — so nothing here may be
 * reused for an FFX-2 chapter.
 *
 * ## What the research leaves open, and what each row does about it
 *
 * - **Rank.** No rank byte is given for any of these rows. Every row carries
 *   `rank: 3`, the engine's documented rank-0 fallback — `[estimate]`, as on
 *   every Evrae row (`evrae-abilities.ts`).
 * - **Accuracy.** §3.1 prints no accuracy byte. An enemy action without one
 *   takes the ALWAYS-hit branch (`accuracy.ts`, "Enemy Accuracy is never
 *   read"), so the three physical rows below never miss. Recorded, not tuned.
 * - **Zanmato is `damageType: 'other'`**, not "special": the engine's
 *   `DamageType` is `physical | magical | other`, and "Sp" is the wiki's label
 *   (preflight review). Protect therefore does not reduce it; Shield (÷4) does
 *   (§4.3, wiki).
 * - **Row 4:132** (a Magic-formula Wakizashi, DC 24) is in his menu list but
 *   assigned to nobody and cited by no source (§9 Y-4): not shipped.
 * - **Rows 4:144 "Summon" and 4:120 "Die"** are the entrance and the death
 *   script (§3.1). Presentation, not actions: not shipped.
 *
 * ## Accuracy of the hit rule
 *
 * Magic and every Overdrive always hit [AGENTS.md hard rule 5]; the engine
 * reads only `canMiss === false`, so it is set explicitly on Zanmato and on the
 * no-damage order row.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

/** Ids, mirrored by `src/battle/ffx/ai/yojimbo-rules.ts` (the test suite pins them equal). */
export const YOJIMBO_DAIGORO_ORDER = 'yojimbo-daigoro';
export const YOJIMBO_KOZUKA = 'yojimbo-kozuka';
export const YOJIMBO_WAKIZASHI = 'yojimbo-wakizashi';
export const YOJIMBO_ZANMATO = 'yojimbo-zanmato';
export const DAIGORO_ATTACK = 'daigoro-attack';

// ---------------------------------------------------------------------------
// Yojimbo (m288) — §3.1 [decompiled]
// ---------------------------------------------------------------------------

/**
 * Row **4:134**, "Daigoro" as Yojimbo's own action: **no damage, target slot
 * M3** — an order to the dog [§3.1 decompiled]. The dog's attack is row 4:177
 * below, resolved with the dog's own Strength by `orders.ts`.
 *
 * Named "Daigoro" because that is the row's name. The presentation track may
 * choose not to banner both the order and the bite; the engine emits both.
 */
const daigoroOrder: AbilityDef = {
  id: YOJIMBO_DAIGORO_ORDER,
  name: 'Daigoro',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate] — no rank byte in the research; the engine's rank-0 fallback
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
  messageTemplate: '{user} uses {ability}',
  extra: {
    // `orders.ts` — the engine seam this row exists for [§2.5: "Yojimbo's
    // 'Daigoro' row is an order to slot M3. The dog record then acts with its
    // own attack."]
    ordersActor: 'daigoro',
    orderedAbility: DAIGORO_ATTACK,
  },
};

/**
 * Row **4:130**: Strength, DmgCon **16**, one random character, physical, no
 * crit, no status [§3.1, `[decompiled]` + wiki "16", verified: 2 sources].
 * Opens at 25 % gauge (§4.1).
 */
const kozuka: AbilityDef = {
  id: YOJIMBO_KOZUKA,
  name: 'Kozuka',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 16,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  messageTemplate: '{user} uses {ability}',
};

/**
 * Row **4:131**: Strength, DmgCon **28**, **one random character** (§9 Y-2
 * resolved: decompile + wiki "One ally"; GameFAQs' party-wide reading loses).
 * Physical, no crit [§3.1, verified: 2 sources]. Opens at 50 % gauge (§4.1).
 */
const wakizashi: AbilityDef = {
  id: YOJIMBO_WAKIZASHI,
  name: 'Wakizashi',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 28,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  messageTemplate: '{user} uses {ability}',
};

/**
 * Row **4:133**: **Fixed, no variance, DmgCon 200** → 200 × 50 = 10,000,
 * capped at **9,999** (no Break Damage Limit flag, so `damageCapFor` holds it
 * at 9,999), **whole party** [§3.1, `[decompiled]` + wiki + GameFAQs + EIP,
 * verified: 4 sources].
 *
 * **Not instant death**: the Death-at-255 Zanmato is the *player's* Yojimbo
 * (`3:226`, §3.2, §7.2). Type `'other'` (see the file header): Protect does not
 * apply, Shield does. While an aeon holds the field it is the only target
 * (`state.ts#friendlies`), which is strategy 3 of §5.3.
 */
const zanmato: AbilityDef = {
  id: YOJIMBO_ZANMATO,
  name: 'Zanmato',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 200,
  formula: 'fixed-no-variance',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} uses {ability}',
};

// ---------------------------------------------------------------------------
// Daigoro (m266, "Koma Inu") — §2.5, §3.1 [decompiled]
// ---------------------------------------------------------------------------

/**
 * Row **4:177**, the dog's only action: Strength, DmgCon **20**, one random
 * character, physical, **can crit with a bonus of +20**, shatter **10 %**
 * [§3.1, `[decompiled]` + wiki "20", crit, "10 % PDR", verified: 2 sources].
 *
 * Resolved with the **dog's** Strength 25, never Yojimbo's 34: the dog is the
 * acting combatant (`orders.ts`).
 */
const daigoroAttack: AbilityDef = {
  id: DAIGORO_ATTACK,
  name: 'Daigoro',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate] — moot: the dog owns no CTB counter to charge
  power: 20,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['crit-eligible', 'shatter'],
  bonusCrit: 20, // §3.1 [decompiled] "bonus crit +20"
  shatterChance: 10, // §3.1 [decompiled] "shatter 10 %"
  messageTemplate: '{user} uses {ability}',
};

/** Every row this encounter ships, keyed by id. */
export const YOJIMBO_ABILITIES: Record<string, AbilityDef> = {
  [daigoroOrder.id]: daigoroOrder,
  [kozuka.id]: kozuka,
  [wakizashi.id]: wakizashi,
  [zanmato.id]: zanmato,
  [daigoroAttack.id]: daigoroAttack,
};

export default YOJIMBO_ABILITIES;
