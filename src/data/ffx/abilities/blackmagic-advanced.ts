/**
 * Lulu's advanced Black Magic: Bio, Demi, Death, Drain, Osmose, Flare, Ultima.
 * Source: `research/ffx-combat-core.md` §7.4. All rows are
 * `[verified: 2 sources]` per §7.4 unless noted otherwise inline.
 *
 * Reflectability: "All single-target Blk Magic is reflectable and
 * Silence-blocked; Demi and Ultima are not reflectable because they target
 * the whole party at once." Bio, Death, Drain, Osmose and Flare are all
 * single-target here, so they carry `reflectable` / `canReflect: true`; Demi
 * and Ultima target `all-enemies` and carry neither.
 *
 * Crit: magic can crit per §2.12 and nothing excludes Black Magic, so every
 * spell below carries `crit-eligible` (harmless on the 0-damage Bio/Death).
 *
 * Death status modeling: this project's `FFXStatusId` union
 * (`battle/common/types.ts` §2) has no `'death'` literal — Death is not a
 * status, it is the instant-KO outcome, i.e. the same `'ko'` status that a
 * depleted HP bar produces. §7.4 gives Death a flat chance-80 roll that is
 * NOT the standard `StatusApplication` resist formula (`chance - resistance
 * > rng % 101`), so it cannot be expressed as a `StatusApplication` entry
 * without misrepresenting how it resolves. Per the coordinating agent's
 * instruction, `death` ships with `statusEffects: []` and the raw chance
 * byte lives at `extra.deathChance: 80`; the engine is expected to roll that
 * byte on its own Death-specific path and apply `'ko'` directly on success,
 * not via the generic status-application pipeline. `duration` has no
 * meaning for an instant KO, so where a duration field would otherwise be
 * required none is emitted (see `extra` above instead).
 *
 * ACCURACY DECISION (2026-09-16, corrected in a second integration pass —
 * see `blackmagic-elemental.ts` for the full reasoning and the corrected
 * citations): `research/ffx-yunalesca.md` §7.2 (line 596) — "Physical
 * accuracy tanks; magic unaffected" — and `research/ffx-bfa-yu-yevon.md`
 * §1.3 (line 99, Jecht Beam: Magic formula, Magical type, "always hits")
 * together show Black Magic always hits and never rolls accuracy.
 * `canMiss: false` is set explicitly on all 7 spells here, citing
 * ffx-yunalesca.md §7.2 + ffx-bfa-yu-yevon.md §1.3 `[verified: 2 sources]`.
 * This includes Bio and Death: both are still `formula: 'magic'` actions, so
 * the same always-hits rule is extended to them by formula family — the
 * research does not separately re-confirm this for 0-damage status casts,
 * so that specific extension is `[estimate]`, one notch softer than the
 * damaging spells' `[verified: 2 sources]`.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  /**
   * §7.4 row 77 [verified: 2 sources]. Pure status spell: 0 damage, applies
   * Poison at chance 254 (always, unless immune) for duration 254 (until end
   * of battle). Reflectability is not explicitly restated for Bio beyond the
   * general single-target Blk Magic rule, so treating it as reflectable is
   * [estimate]: convention used here is "single-target Blk Magic is
   * reflectable unless the source says otherwise," which Bio does not.
   */
  bio: {
    id: 'bio',
    name: 'Bio',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 10,
    rank: 3,
    power: 0,
    formula: 'magic',
    damageType: 'magical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [{ status: 'poison', chance: 254, duration: 254 }],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible'], // reflectable: [estimate], see file header
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-bio-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-bio-hit' },
  },

  /**
   * §7.4 row 78 [verified: 2 sources]. Percentage-Current formula: damage =
   * `targetCurrentHP * DmgCon // 16` with DmgCon 4 = 25% of current HP.
   * Targets the whole enemy formation; explicitly NOT reflectable because it
   * is not a single-target spell.
   */
  demi: {
    id: 'demi',
    name: 'Demi',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 32,
    rank: 3,
    power: 4,
    formula: 'percent-current',
    damageType: 'magical',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-demi-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-demi-hit' },
  },

  /**
   * §7.4 row 79 [verified: 2 sources]. 0 damage; tries to instantly KO the
   * target at a flat chance of 80. See the file header's "Death status
   * modeling" note for why this is `extra.deathChance` rather than a
   * `StatusApplication` entry, and why `statusEffects` is empty.
   */
  death: {
    id: 'death',
    name: 'Death',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 20,
    rank: 3,
    power: 0,
    formula: 'magic',
    damageType: 'magical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [], // Death is not a StatusApplication here — see file header.
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-death-cast',
    messageTemplate: '{user} casts {ability}',
    extra: {
      deathChance: 80, // raw chance byte; engine rolls it on the Death-specific KO path, not the generic status pipeline
      vfxKey: 'vfx-death-hit',
    },
  },

  /**
   * §7.4 row 80 [verified: 2 sources]. Deals Magic-formula damage and adds
   * the amount dealt to the caster's own HP via the `drains` flag.
   */
  drain: {
    id: 'drain',
    name: 'Drain',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 12,
    rank: 2,
    power: 20,
    formula: 'magic',
    damageType: 'magical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['drains', 'reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-drain-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-drain-hit' },
  },

  /**
   * §7.4 row 81 [verified: 2 sources]. As Drain, but the Magic-formula
   * "damage" is applied to the target's MP pool and credited to the
   * caster's MP via the `drains-mp` flag. Notably 0 MP cost.
   *
   * COORDINATOR FIX (integration pass, id collision): the enemy-data agent's
   * `src/data/ffx/enemies/yunalesca-abilities.ts` independently defines a
   * mechanically DIFFERENT enemy-only ability also named "Osmose" (used only
   * against an aeon, flat 100% of max MP, `percent-total` formula, category
   * 'enemy') under the same bare id `'osmose'`, and that record is reused
   * verbatim by `braskas-final-aeon-abilities.ts`. Since both records cannot
   * share one id in the merged lookup, this player-castable Black Magic
   * spell is renamed `osmose-spell` here. The enemy files are owned by a
   * different agent and were left untouched.
   */
  'osmose-spell': {
    id: 'osmose-spell',
    name: 'Osmose',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 0,
    rank: 2,
    power: 10,
    formula: 'magic',
    damageType: 'magical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['drains-mp', 'reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-osmose-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-osmose-hit' },
  },

  /**
   * §7.4 row 82 [verified: 2 sources]. Non-elemental single-target nuke,
   * rank 5. Reflectable per the single-target rule.
   */
  flare: {
    id: 'flare',
    name: 'Flare',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 54,
    rank: 5,
    power: 60,
    formula: 'magic',
    damageType: 'magical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-flare-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-flare-hit' },
  },

  /**
   * §7.4 row 83 [verified: 2 sources]. Non-elemental, all-enemies nuke,
   * rank 6, the strongest Blk Magic spell. Explicitly NOT reflectable
   * because it targets the whole formation at once.
   */
  ultima: {
    id: 'ultima',
    name: 'Ultima',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 90,
    rank: 6,
    power: 70,
    formula: 'magic',
    damageType: 'magical',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-ultima-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-ultima-hit' },
  },
};

export default ABILITIES;
