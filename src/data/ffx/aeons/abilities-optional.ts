/**
 * FFX Aeon actions — two of the three optional aeons: Anima and Yojimbo.
 * **The Magus Sisters and the three shared sub-commands (Shield/Boost/
 * Dismiss) continue in `aeons/abilities-optional-2.ts`**, split to stay
 * under this project's ~380-line data file guideline (both files merge
 * into one logical "optional aeons" ability set). Sibling files
 * `aeons/abilities-core.ts` + `abilities-core-2.ts` cover the five
 * mandatory aeons. `aeons/index.ts` owns the 8 aeon catalog records,
 * stat-scaling coefficients and canonical stat blocks.
 *
 * Source: `research/ffx-combat-core.md` §6.2 (sub-commands) and §6.3
 * (aeon abilities/Overdrives), both `[verified: 2 sources]` unless an
 * individual entry says otherwise.
 *
 * Deviations from the general core-aeon rules, called out explicitly by
 * §6.3's per-aeon table and quoted here so they aren't mistaken for typos:
 * - **Anima's Attack** DOES carry an ACC multiplier (x1.5, same family as
 *   Ifrit/Ixion/Bahamut) even though Anima isn't one of the five
 *   "mandatory" aeons — the multiplier list in the contract notes is
 *   "Ifrit/Ixion/Bahamut/Anima Attack = ACCx1.5".
 * - **Anima's Pain** (Special) uses `special-magic`, not `strength` —
 *   the one core-formula exception among aeon Specials — and its
 *   `damageType` is `'magical'`, not `'physical'`/`'other'`.
 * - **Anima's Oblivion** and the Magus Sisters' **Delta Attack**
 *   (Overdrives) both use `formula:'strength'`, not the usual
 *   `'special-magic'` — §6.3 states this explicitly for both ("Int/HD
 *   version" multi-hit variants), so it is not a copy-paste error.
 * - **Yojimbo** has no "Special" ability at all — his catalog record's
 *   `specialAbilityId` is `null` and he instead has 4 Attack variants
 *   (Daigoro/Kozuka/Wakizashi-ST/Wakizashi-MT). §6.3 gives no ACC
 *   multiplier for any of them, so `extra.accuracyMultiplier` is omitted.
 * - **Zanmato** and **Pain**'s Death riders are modelled as
 *   `extra: { deathChance, ... }`, matching this codebase's established
 *   non-status modelling for instant-death effects (there is no `'death'`
 *   status id or ActionFlag in the closed sets) — `statusEffects: []`.
 * - **Shield/Boost** apply the like-named status to the user (self);
 *   duration is modelled as `1` (a placeholder meaning "until the aeon's
 *   next turn", per `StatusId` doc comment for `shield`/`boost` in
 *   `battle/common/types.ts`) since `StatusApplication` has no dedicated
 *   "until next turn" duration enum.
 * - **Dismiss**'s raw rank byte is `0`; per `AbilityDef.rank`'s doc
 *   comment ("A raw rank byte of 0 falls back to 3"), it is stored here
 *   as `0` rather than pre-resolved to 3, so the engine's own fallback
 *   logic is exercised.
 * - `minigame: null` on every entry — aeon abilities never open a minigame.
 *
 * ACCURACY DECISION (2026-09-16): see `abilities-core.ts` for the full
 * reasoning and citations (`ffx-bfa-yu-yevon.md` §1.3, lines 101/107/108).
 * `canMiss: false` is set explicitly on Oblivion (`strength` formula) and
 * Zanmato (`none` formula, a Death-chance effect) — both `category:
 * 'overdrive'`, `damageType: 'other'`. Oblivion matches the verified
 * Strength+Other Overdrive pattern directly; Zanmato's `none` formula is an
 * extension by analogy on damage-type/category, `[estimate]`. Yojimbo's 4
 * Attack variants and Anima's Attack/Pain above are untouched and still
 * roll accuracy normally (Anima's Attack explicitly carries an ACC×1.5
 * multiplier, which would be meaningless if it always hit).
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  // ---------------------------------------------------------------------
  // Anima — optional aeon (Baaj Temple). ACCx1.5 Attack. Pain carries a
  // guaranteed Death; Oblivion is a 16-hit Strength-formula Overdrive that
  // innately breaks the damage limit.
  // ---------------------------------------------------------------------

  'anima-attack': {
    id: 'anima-attack',
    name: 'Attack',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 1, // [estimate] — not itemized in §6.3's table; standard base-Attack rank.
    power: 16, // DmgCon 16 [ffx-combat-core §6.3, verified: 2 sources]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    // "aeon weapons except Valefor" carry Piercing on their Attack.
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack',
    sfxKey: 'sfx-aeon-attack',
    messageTemplate: '{user} attacks {target}',
    minigame: null,
    extra: { accuracyMultiplier: 1.5, vfxKey: 'vfx-anima-attack' },
  },

  pain: {
    id: 'pain',
    name: 'Pain',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 6,
    power: 20, // DmgCon 20
    // Exception: Anima's Special uses Special Magic, not Strength.
    formula: 'special-magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-special-anima',
    sfxKey: 'sfx-pain',
    messageTemplate: '{user} uses Pain on {target}',
    minigame: null,
    // Rider: Death, chance 100 — non-status modelling, matching e.g.
    // `enemies/seymour-flux-abilities.ts`'s Death-effect convention.
    extra: { deathChance: 100, vfxKey: 'vfx-pain' },
  },

  oblivion: {
    id: 'oblivion',
    name: 'Oblivion',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 8,
    power: 4, // DmgCon 4 per hit (Int/HD 16-hit version)
    // Exception: Oblivion uses Strength, not the usual Special Magic Overdrive formula.
    formula: 'strength',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // [estimate] — not restated beyond DmgCon in §6.3.
    hits: 16,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'always-break-damage-limit'],
    breaksDamageLimit: true,
    animationKey: 'aeon-overdrive-anima',
    sfxKey: 'sfx-oblivion',
    messageTemplate: '{user} uses Oblivion on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-oblivion' },
  },

  // ---------------------------------------------------------------------
  // Yojimbo — optional aeon (Cavern of the Stolen Fayth). No "Special";
  // 4 Attack variants instead. Zanmato is a guaranteed (chance 255,
  // ignores all resistance) instant-death Overdrive.
  // ---------------------------------------------------------------------

  daigoro: {
    id: 'daigoro',
    name: 'Daigoro',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 3,
    power: 10, // DmgCon 10
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack-yojimbo',
    sfxKey: 'sfx-yojimbo-slash',
    messageTemplate: '{user} uses Daigoro on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-yojimbo-daigoro' },
  },

  kozuka: {
    id: 'kozuka',
    name: 'Kozuka',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 3,
    power: 13, // DmgCon 13
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack-yojimbo',
    sfxKey: 'sfx-yojimbo-throw',
    messageTemplate: '{user} uses Kozuka on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-yojimbo-kozuka' },
  },

  'wakizashi-single': {
    id: 'wakizashi-single',
    name: 'Wakizashi',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 3,
    power: 18, // DmgCon 18 (single-target variant)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack-yojimbo',
    sfxKey: 'sfx-yojimbo-slash',
    messageTemplate: '{user} uses Wakizashi on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-yojimbo-wakizashi' },
  },

  'wakizashi-multi': {
    id: 'wakizashi-multi',
    name: 'Wakizashi',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 3,
    power: 18, // DmgCon 18 (all-enemies variant)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack-yojimbo',
    sfxKey: 'sfx-yojimbo-slash',
    messageTemplate: '{user} uses Wakizashi',
    minigame: null,
    extra: { vfxKey: 'vfx-yojimbo-wakizashi' },
  },

  zanmato: {
    id: 'zanmato',
    name: 'Zanmato',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    // Death is non-status (see file header); no ordinary flags apply to a
    // pure-formula-'none' instant-death effect.
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    animationKey: 'aeon-overdrive-yojimbo',
    sfxKey: 'sfx-zanmato',
    messageTemplate: '{user} uses Zanmato on {target}',
    minigame: null,
    // Death at chance 255 ignores ALL resistance, including Aeon Ribbon/Deathproof.
    extra: { deathChance: 255, ignoresAllResistance: true, vfxKey: 'vfx-zanmato' },
  },
};

export default ABILITIES;
