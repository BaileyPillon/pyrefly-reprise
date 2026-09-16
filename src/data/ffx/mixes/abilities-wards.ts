/**
 * Rikku's Mix — ward/buff result abilities (Nul-All and Mighty G families).
 * Source: `research/ffx-combat-core.md` §5.9 `[verified: 2 sources]`.
 *
 * Blanket rules (see `mixes/abilities-restoratives.ts` header for the full
 * list): `game: 'ffx'`, `category: 'overdrive'`, `mpCost: 0`, `rank: 6`,
 * `damageType: 'other'`, `element: []`, `hits: 1`, `formula: 'none'`,
 * `power: 0` (pure status effects, no damage/heal component),
 * `flags: ['ignores-armored', 'never-break-damage-limit']`,
 * `canReflect: false`, `minigame: null`.
 *
 * The four Nul statuses use `duration: 1` to encode "one charge" on
 * `StatusApplication` — there is no dedicated charge field on that
 * interface, and this mirrors the existing convention in
 * `abilities/whitemagic-protect.ts` (the NulBlaze/NulFrost/NulShock/NulTide
 * spells use the identical `{ chance: 254, duration: 1 }` shape).
 */

import type { AbilityDef, StatusApplication } from '../../../battle/common/types.ts';

/** One charge each of the four Nul statuses [ffx-combat-core §5.9]. */
const NUL_QUARTET: StatusApplication[] = [
  { status: 'nulblaze', chance: 254, duration: 1 },
  { status: 'nulfrost', chance: 254, duration: 1 },
  { status: 'nulshock', chance: 254, duration: 1 },
  { status: 'nultide', chance: 254, duration: 1 },
];

export const WARD_MIX_ABILITIES: Record<string, AbilityDef> = {
  // §5.9 — Potion + Fire Gem. One random ally, one charge of each Nul status.
  'mix-nul-all': {
    id: 'mix-nul-all',
    name: 'NulAll',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'random-ally',
    hits: 1,
    statusEffects: [...NUL_QUARTET],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-nul-all' },
  },

  // §5.9 — Hi-Potion + Fire Gem. As NulAll, party-wide.
  'mix-mega-nul-all': {
    id: 'mix-mega-nul-all',
    name: 'Mega NulAll',
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
    statusEffects: [...NUL_QUARTET],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-mega-nul-all' },
  },

  // §5.9 — Lunar Curtain + Mana Spring. Party-wide four Nuls, plus Cheer x5
  // and Focus x5.
  'mix-hyper-nul-all': {
    id: 'mix-hyper-nul-all',
    name: 'Hyper NulAll',
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
    statusEffects: [
      ...NUL_QUARTET,
      { status: 'cheer', chance: 254, duration: 254, stacks: 5 },
      { status: 'focus', chance: 254, duration: 254, stacks: 5 },
    ],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-hyper-nul-all' },
  },

  // §5.9 — Healing Spring + Hypello Potion. Party-wide four Nuls, plus
  // Cheer/Aim/Focus/Reflex all at x5.
  'mix-ultra-nul-all': {
    id: 'mix-ultra-nul-all',
    name: 'Ultra NulAll',
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
    statusEffects: [
      ...NUL_QUARTET,
      { status: 'cheer', chance: 254, duration: 254, stacks: 5 },
      { status: 'aim', chance: 254, duration: 254, stacks: 5 },
      { status: 'focus', chance: 254, duration: 254, stacks: 5 },
      { status: 'reflex', chance: 254, duration: 254, stacks: 5 },
    ],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-ultra-nul-all' },
  },

  // §5.9 — Antidote + Lunar Curtain. Party-wide Protect + Shell.
  'mix-mighty-wall': {
    id: 'mix-mighty-wall',
    name: 'Mighty Wall',
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
    statusEffects: [
      { status: 'protect', chance: 254, duration: 254 },
      { status: 'shell', chance: 254, duration: 254 },
    ],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-mighty-wall' },
  },

  // §5.9 — Remedy + Lunar Curtain. Mighty Wall plus Haste.
  'mix-mighty-g': {
    id: 'mix-mighty-g',
    name: 'Mighty G',
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
    statusEffects: [
      { status: 'protect', chance: 254, duration: 254 },
      { status: 'shell', chance: 254, duration: 254 },
      { status: 'haste', chance: 254, duration: 254 },
    ],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-mighty-g' },
  },

  // §5.9 — Fire Gem + Lunar Curtain. Mighty G plus Regen for 20 turns
  // (double the normal 10-turn baseline).
  'mix-super-mighty-g': {
    id: 'mix-super-mighty-g',
    name: 'Super Mighty G',
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
    statusEffects: [
      { status: 'protect', chance: 254, duration: 254 },
      { status: 'shell', chance: 254, duration: 254 },
      { status: 'haste', chance: 254, duration: 254 },
      { status: 'regen', chance: 254, duration: 20 },
    ],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-super-mighty-g' },
  },

  // §5.9 — Chocobo Wing + Door to Tomorrow. Super Mighty G plus Auto-Life.
  // The best mix in the game.
  'mix-hyper-mighty-g': {
    id: 'mix-hyper-mighty-g',
    name: 'Hyper Mighty G',
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
    statusEffects: [
      { status: 'protect', chance: 254, duration: 254 },
      { status: 'shell', chance: 254, duration: 254 },
      { status: 'haste', chance: 254, duration: 254 },
      { status: 'regen', chance: 254, duration: 20 },
      { status: 'auto-life', chance: 254, duration: 255 },
    ],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-hyper-mighty-g' },
  },
};
