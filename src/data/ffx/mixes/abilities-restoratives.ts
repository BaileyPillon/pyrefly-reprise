/**
 * Rikku's Mix — restorative result abilities (HP/MP pool effects).
 * Source: `research/ffx-combat-core.md` §5.9 `[verified: 2 sources]`.
 *
 * See the **P0 resolution-order warning** in `mixes/abilities.ts` (the file
 * that assembles this module into the final catalog) before touching Super
 * Elixir, Final Elixir or Ultra Cure — all three remove Zombie and then
 * STILL kill that character because the heal amount was computed from the
 * pre-action state.
 *
 * Blanket rules applied to every entry below (not repeated per-row):
 * - `game: 'ffx'`, `category: 'overdrive'`, `mpCost: 0`.
 * - `rank: 6` — the in-battle CTB preview shows rank 5 for Mix, but the
 *   decompile's actual recovery uses rank 6 for every resolved mix result
 *   [ffx-combat-core §5.9].
 * - `damageType: 'other'`, `element: []`, `hits: 1`, `canReflect: false`,
 *   `minigame: null` (only the top-level `mix` selector carries the
 *   `rikku-mix` minigame key).
 * - `flags` always includes `'ignores-armored'` and (except where noted)
 *   `'never-break-damage-limit'` [ffx-combat-core §5.9].
 */

import type { AbilityDef, StatusId } from '../../../battle/common/types.ts';

/**
 * The 10-status cleanse list shared by Panacea, Ultra Cure, Super Elixir and
 * Final Elixir [ffx-combat-core §5.9].
 */
export const MIX_CLEANSE_STATUSES: StatusId[] = [
  'zombie',
  'petrify',
  'poison',
  'confuse',
  'berserk',
  'sleep',
  'silence',
  'darkness',
  'slow',
  'curse',
];

export const RESTORATIVE_MIX_ABILITIES: Record<string, AbilityDef> = {
  // §5.9 — Potion + Potion. All-allies, percent-total DmgCon 16 = full HP.
  // ASSUMPTION: the source row lists only `never-break-damage-limit` in its
  // "extra flags" column, but a percent-total formula computes as DAMAGE
  // unless inverted — every sibling full-restore mix (Elixir, Megalixir,
  // Mega Phoenix...) carries `'heals'`, so it is added here too as the only
  // reading that makes the ability actually heal. Flagged as a gap in the
  // report.
  'mix-ultra-potion': {
    id: 'mix-ultra-potion',
    name: 'Ultra Potion',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 16,
    formula: 'percent-total',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'heals', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-ultra-potion' },
  },

  // §5.9 — Remedy + Remedy. All-allies cleanse, no HP change at all
  // (formula 'none' — this is why it is the ONLY safe cleanse mix; see the
  // resolution-order warning in `mixes/abilities.ts`).
  'mix-panacea': {
    id: 'mix-panacea',
    name: 'Panacea',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [...MIX_CLEANSE_STATUSES],
    flags: ['ignores-armored', 'removes-statuses', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-panacea' },
  },

  // §5.9 — Power Distiller + Sleeping Powder. All-allies, percent-total
  // DmgCon 8 = 50% max HP, plus the same 10-status cleanse. UNSAFE on a
  // Zombie — see the resolution-order warning.
  'mix-ultra-cure': {
    id: 'mix-ultra-cure',
    name: 'Ultra Cure',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 8,
    formula: 'percent-total',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [...MIX_CLEANSE_STATUSES],
    flags: ['ignores-armored', 'heals', 'removes-statuses', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-ultra-cure', resolutionOrderWarning: 'kills a Zombie ally — see mixes/abilities.ts header' },
  },

  // §5.9 — Phoenix Down + Phoenix Down. All-allies revive at 100% max HP;
  // fails (misses) on anyone already alive.
  'mix-mega-phoenix': {
    id: 'mix-mega-phoenix',
    name: 'Mega Phoenix',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 16,
    formula: 'percent-total',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'heals', 'misses-if-target-alive', 'can-target-dead', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-mega-phoenix' },
  },

  // §5.9 — Mega Phoenix + Mega Phoenix. All-allies revive AND top up the
  // living to full — unlike Mega Phoenix it does NOT miss on a living target.
  'mix-final-phoenix': {
    id: 'mix-final-phoenix',
    name: 'Final Phoenix',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 16,
    formula: 'percent-total',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'heals', 'can-target-dead', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-final-phoenix' },
  },

  // §5.9 — Antidote + Power Sphere. ONE random ally, full HP + full MP.
  'mix-elixir': {
    id: 'mix-elixir',
    name: 'Elixir',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 16,
    formula: 'percent-total',
    damageType: 'other',
    element: [],
    targeting: 'random-ally',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'heals', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-elixir', restoresPool: 'both' },
  },

  // §5.9 — Potion + Elixir. All-allies, full HP + full MP.
  'mix-megalixir': {
    id: 'mix-megalixir',
    name: 'Megalixir',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 16,
    formula: 'percent-total',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'heals', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-megalixir', restoresPool: 'both' },
  },

  // §5.9 — Potion + Megalixir. All-allies, full HP + full MP + the 10-status
  // cleanse. UNSAFE on a Zombie — see the resolution-order warning.
  'mix-super-elixir': {
    id: 'mix-super-elixir',
    name: 'Super Elixir',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 16,
    formula: 'percent-total',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [...MIX_CLEANSE_STATUSES],
    flags: ['ignores-armored', 'heals', 'removes-statuses', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-super-elixir', restoresPool: 'both', resolutionOrderWarning: 'kills a Zombie ally — see mixes/abilities.ts header' },
  },

  // §5.9 — Potion + Dark Matter. All-allies: full HP + full MP (restores
  // beyond the 999 MP cap) + the 10-status cleanse + revives the KO'd.
  // `always-break-damage-limit`, NOT `never-break-damage-limit` — this is
  // one of only two exceptions to the blanket rule (the other is Sunburst).
  // UNSAFE on a Zombie — see the resolution-order warning.
  'mix-final-elixir': {
    id: 'mix-final-elixir',
    name: 'Final Elixir',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 16,
    formula: 'percent-total',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [...MIX_CLEANSE_STATUSES],
    flags: ['ignores-armored', 'heals', 'removes-statuses', 'can-target-dead', 'always-break-damage-limit'],
    breaksDamageLimit: true,
    canReflect: false,
    minigame: null,
    extra: {
      vfxKey: 'vfx-mix-final-elixir',
      restoresPool: 'both',
      mpRestoreExceedsCap: true,
      resolutionOrderWarning: 'kills a Zombie ally even though it can-target-dead — see mixes/abilities.ts header',
    },
  },
};
