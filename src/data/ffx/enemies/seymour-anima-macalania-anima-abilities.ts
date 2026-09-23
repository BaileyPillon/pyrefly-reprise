/**
 * Anima's own abilities at Macalania Temple (m125), split out of
 * `./seymour-anima-macalania-abilities.ts` for the 400-line house rule
 * (AGENTS.md rule 7) and re-exported from there, so every import is
 * unchanged. **FFX only** [AGENTS.md rule 14]. Every number is
 * `research/ffx-seymour-anima-macalania.md`'s, section cited on the field.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Anima (m125) — §4.3 [decompiled]
// ---------------------------------------------------------------------------

/**
 * Boost — she takes ×1.5 damage and healing until her next turn [§3.4].
 *
 * The duration is carried by the engine's own "until the user's next turn"
 * rule (`statuses.ts#clearUntilNextTurnStatuses`, which drops `boost` at the
 * *start* of the holder's next turn), so the byte here is a long one rather
 * than a turn count.
 *
 * **Boost does not accelerate her gauge**, and the engine already gets that
 * right without a special case: `overdrive.ts#addGauge` applies Boost's ×1.5
 * only for `side === 'aeon'`, and she is `side === 'enemy'`. Do not "fix" it.
 */
export const animaBoost: AbilityDef = {
  id: 'anima-boost',
  name: 'Boost',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 1,
  statusEffects: [{ status: 'boost', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} uses Boost',
};

/**
 * **The boss's Pain — monmagic2 #222, DmgCon 28.** See the file header.
 *
 * Special Magic ignores the target's Magic Defense entirely, so the damage is
 * flat across the whole party: **459–518, never more, never less**, before
 * Shell. The rider is a **100 % Death flag**, so on a party member it is not
 * "500 damage", it is a kill.
 *
 * On an aeon it is 500 damage and nothing else — and that needs **no engine
 * exception**: aeons carry the hidden Aeon Ribbon, which
 * `src/battle/ffx/setup.ts#AEON_INNATE_IMMUNITIES` already implements as
 * `ko: 255`. That single asymmetry is the entire reason act two is an aeon
 * duel [§4.3, §5.1, verified: 2 sources].
 */
export const animaPainBoss: AbilityDef = {
  id: 'anima-pain-boss',
  name: 'Pain',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 28, // §4.3 [decompiled] monmagic2 #222 — NOT the aeon `pain` row's 20
  formula: 'special-magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [{ status: 'ko', chance: 100, duration: 0 }], // §4.3 Death @ 100 %
  removesStatuses: [],
  flags: ['ignores-armored'],
  canMiss: false,
  extra: { notPlayerAeonPain: 'monmagic2 #222 (DmgCon 28); the aeon row `pain` is #220 (DmgCon 20)' },
  messageTemplate: '{user} uses Pain on {target}',
};

/**
 * Oblivion, her Overdrive — **16 separate hits** in the INT/PAL/HD build,
 * which is this project's declared baseline; power 4 per hit against the
 * original NA build's single 75 [§4.3, verified: 2 sources].
 *
 * Mitigated by the target's Defense. Unshielded it kills the whole party
 * outright at this story point (~1,750–1,950 total); Shielded, Shiva eats it
 * for ~440 and keeps going (§6.3). That comparison is the whole lesson of the
 * aeon sub-command menu.
 */
export const animaOblivion: AbilityDef = {
  id: 'anima-oblivion',
  name: 'Oblivion',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 4, // §4.3 [decompiled] INT/PAL 16-hit version
  formula: 'strength',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 16, // §4.3 [decompiled] `n_of_hits = 16`
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'always-break-damage-limit'],
  breaksDamageLimit: true,
  canMiss: false, // every Overdrive always hits [AGENTS.md hard rule 5]
  messageTemplate: '{user} uses Oblivion',
};
