/**
 * Non-buff, non-Rikku Special utility commands: Pray, Entrust, Guard,
 * Sentinel, Provoke, Threaten, Scan, Lancet, Spare Change.
 * Source: `research/ffx-combat-core.md` §7.1, §7.3, §7.5, §7.6.
 *
 * CATEGORY CONVENTION: every ability here uses `category: 'special'`, never
 * `'skill'` — see `special-buffs.ts` for the full rationale (this project
 * resolves the `AbilityCategory` ambiguity by putting every non-Attack/
 * non-magic/non-Overdrive command in `'special'`; `'skill'` is reserved for
 * FFX-2 dressphere abilities).
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  // ffx-combat-core §7.1 — row 25, rank 3, MP 0. Small party heal. Formula
  // 'healing', DmgCon 8. Research explicitly gives damageType 'Other' here
  // (unlike White Magic's Cure, which is 'magical' — deliberately not
  // copying that convention per the coordinator's instruction).
  pray: {
    id: 'pray',
    name: 'Pray',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 3,
    power: 8,
    formula: 'healing',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['heals'],
    canMiss: false,
    animationKey: 'special-pray',
    sfxKey: 'sfx-pray',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-pray' },
  },

  // GAP: ffx-combat-core documents only Entrust's command row (39, rank 3,
  // MP 0) and its Sphere Grid unlock node (774) — the decompile tables cited
  // by the research file do not describe its actual effect anywhere.
  // [estimate — not in the decompiled tables cited by ffx-combat-core.md;
  // standard FFX series behavior used instead]: Entrust transfers a portion
  // of the caster's own Overdrive gauge to one ally's gauge. The exact
  // percent/logic is NOT modeled here; it is left for the engine to decide
  // and flagged via `extra.gap`. See report for a prominent flag of this gap.
  entrust: {
    id: 'entrust',
    name: 'Entrust',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'single-ally',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    animationKey: 'special-entrust',
    sfxKey: 'sfx-entrust',
    messageTemplate: '{user} uses {ability}',
    extra: {
      vfxKey: 'vfx-entrust',
      grantsOverdrivePercent:
        'estimate: transfers up to the casters current gauge to the target, exact percent not in research — engine must decide',
      gap: true,
    },
  },

  // ffx-combat-core §7.3 — row 34, rank 3, MP 0, self. Applies the `guard`
  // status (the user intercepts single-target physical attacks aimed at the
  // other two party members). Research does not print an explicit
  // chance/duration byte for this self-applied status; [estimate] chance 254
  // (always applies to self, no resistance check) and duration 1, modeled
  // the same way the coordinator modeled Threaten's "until the user's own
  // next turn" window — `battle/common/types.ts` documents guard/sentinel's
  // duration model as "until the user's next turn" rather than a fixed-turn
  // countdown, so the engine's own turn-boundary logic is expected to clear
  // it regardless of this raw duration value.
  guard: {
    id: 'guard',
    name: 'Guard',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 1,
    statusEffects: [{ status: 'guard', chance: 254, duration: 1 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    animationKey: 'special-guard',
    sfxKey: 'sfx-guard',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-guard' },
  },

  // ffx-combat-core §7.3 — row 35, rank 3, MP 0, self. Applies `sentinel`
  // (Guard + halved physical damage received). Same [estimate] duration
  // reasoning as Guard above — no explicit byte in research.
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 1,
    statusEffects: [{ status: 'sentinel', chance: 254, duration: 1 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    animationKey: 'special-sentinel',
    sfxKey: 'sfx-sentinel',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-sentinel' },
  },

  // ffx-combat-core §7.3 — row 38, rank 3, MP 4, single-enemy. Strength
  // formula, DmgCon 0 (deals no real damage), damageType 'other'. Provoke
  // status chance 254 duration 254; also clears Berserk/Confuse on the
  // target as a side effect (not a `removesStatuses` list, since Provoke
  // both applies AND clears — flagged via `extra.clearsOnHit` instead, per
  // the coordinator's instruction). "Always hits" -> `canMiss: false`.
  // [estimate] `flags: []`: research does not call out
  // 'inherits-weapon-properties'/'adds-equipment-crit'/'crit-eligible' for
  // Provoke the way it does for the Auron Breaks and Wakka's status
  // attacks, and with DmgCon 0 those flags would be inconsequential anyway,
  // so none were added rather than guessed.
  provoke: {
    id: 'provoke',
    name: 'Provoke',
    game: 'ffx',
    category: 'special',
    mpCost: 4,
    rank: 3,
    power: 0,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'provoke', chance: 254, duration: 254 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    animationKey: 'special-provoke',
    sfxKey: 'sfx-provoke',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-provoke', clearsOnHit: ['berserk', 'confuse'] },
  },

  // ffx-combat-core §7.3 — row 37, rank 3, MP 12, single-enemy, no damage.
  // Threaten's success chance comes from the enemy's OWN `threatenChance`
  // field [ffx-combat-core §4.4], not the normal chance/resistance path, so
  // the raw byte here is a placeholder (255 = "this field is not the real
  // gate") and the real model is flagged via `extra`.
  threaten: {
    id: 'threaten',
    name: 'Threaten',
    game: 'ffx',
    category: 'special',
    mpCost: 12,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'threaten', chance: 255, duration: 1 }],
    removesStatuses: [],
    flags: [],
    animationKey: 'special-threaten',
    sfxKey: 'sfx-threaten',
    messageTemplate: '{user} uses {ability}',
    extra: {
      vfxKey: 'vfx-threaten',
      usesThreatenChanceModel: true,
      note: 'actual success chance comes from the enemys own threatenChance field per ffx-combat-core §4.4, not this raw chance byte',
    },
  },

  // ffx-combat-core §7.5 — row 50, rank 3, MP 1, single-enemy. Applies
  // `scan` status, chance 254, duration 254. [estimate] `canMiss: false`:
  // research does not explicitly say "always hits" for Scan the way it does
  // for Provoke/Lancet, but Scan is a pure information action with no
  // separate accuracy roll documented, so it is modeled the same way as the
  // project's other no-roll utility commands.
  scan: {
    id: 'scan',
    name: 'Scan',
    game: 'ffx',
    category: 'special',
    mpCost: 1,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'scan', chance: 254, duration: 254 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    animationKey: 'special-scan',
    sfxKey: 'sfx-scan',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-scan' },
  },

  // ffx-combat-core §7.7 — row 32, rank 2, MP 0, single-enemy. Magic
  // formula, DmgCon 6, damageType 'other'. COORDINATOR FIX (integration
  // pass): the sub-agent that authored this file literally transcribed
  // research's "Magic formula" wording; `battle/common/types.ts` FormulaKey
  // has a purpose-built `'lancet'` case ("drains both HP and MP pools,
  // damage type other, ignores Armored") that matches Lancet's semantics
  // exactly and is clearly the intended key, so it is used here instead,
  // with the `ignores-armored` flag it implies. Drains both HP and MP
  // (`drains` + `drains-mp`); always hits. Also teaches Kimahri a Ronso
  // Rage — that mechanic belongs to the engine, only flagged here via
  // `extra.learnsRonsoRage`.
  lancet: {
    id: 'lancet',
    name: 'Lancet',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 2,
    power: 6,
    formula: 'lancet',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['drains', 'drains-mp', 'ignores-armored'],
    canMiss: false,
    animationKey: 'special-lancet',
    sfxKey: 'sfx-lancet',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-lancet', learnsRonsoRage: true },
  },

  // ffx-combat-core §7.6 — row 36, rank 3, MP 0, all-enemies. Gil formula,
  // DmgCon 1: damage = gilSpent // 10. Never breaks the damage limit, and
  // can shatter a Petrified target at a flat 100% chance.
  'spare-change': {
    id: 'spare-change',
    name: 'Spare Change',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 3,
    power: 1,
    formula: 'gil',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    // 'gil' is the FormulaKey, not an ActionFlag — the gil cost lives in `formula`.
    flags: ['never-break-damage-limit', 'shatter'],
    shatterChance: 100,
    animationKey: 'special-spare-change',
    sfxKey: 'sfx-spare-change',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-spare-change' },
  },
};
