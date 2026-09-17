/**
 * Rikku's Mix — offensive result abilities (grenade line, fire line, and the
 * two percent-current / deal-9999 nukes).
 * Source: `research/ffx-combat-core.md` §5.9 `[verified: 2 sources]`.
 *
 * Blanket rules (see `mixes/abilities-restoratives.ts` header for the full
 * list): `game: 'ffx'`, `category: 'overdrive'`, `mpCost: 0`, `rank: 6`,
 * `damageType: 'other'`, `canReflect: false`, `minigame: null`, and
 * `flags` always includes `'ignores-armored'` and — except Sunburst, the
 * file's one exception — `'never-break-damage-limit'`.
 *
 * `power` below is the DmgCon column; the flat damage number in each comment
 * is DmgCon's `fixed`-formula readout (`DmgCon * 50` at average variance) or,
 * for Sunburst, the exact `deal-9999` result.
 *
 * ACCURACY DECISION (2026-09-16, corrected in a second integration pass):
 * see `mixes/abilities.ts` for the full reasoning and citations
 * (`ffx-bfa-yu-yevon.md` §1.3, lines 101/107/108). `canMiss: false` is set
 * explicitly on every record here, citing that source `[estimate]` (analogy
 * by damage-type/category, not an exact formula match — see the header
 * note) — Firestorm/Burning Soul/Abaddon Flame's multiple hits are each
 * unconditional, the same as every other `Other`-damage-type Overdrive
 * action in this data set.
 */

import type { AbilityDef, StatusApplication } from '../../../battle/common/types.ts';

/** The four Break statuses, reused by Chaos Grenade and Abaddon Flame. */
const ALL_FOUR_BREAKS = ['power-break', 'magic-break', 'armor-break', 'mental-break'] as const;

export const ORDNANCE_MIX_ABILITIES: Record<string, AbilityDef> = {
  // §5.9 — Fire Gem + Ice Gem. All enemies, fixed DmgCon 7 (~350 base).
  'mix-grenade': {
    id: 'mix-grenade',
    name: 'Grenade',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 7,
    formula: 'fixed',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit', 'crit-eligible'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-grenade' },
  },

  // §5.9 — Power Sphere + Power Sphere. All enemies, fixed DmgCon 16
  // (~800 base) plus an Armor Break application.
  'mix-frag-grenade': {
    id: 'mix-frag-grenade',
    name: 'Frag Grenade',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 16,
    formula: 'fixed',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [{ status: 'armor-break', chance: 254, duration: 254 }],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit', 'crit-eligible'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-frag-grenade' },
  },

  // §5.9 — Map + Map. All enemies, fixed DmgCon 54 (~2700 base).
  'mix-potato-masher': {
    id: 'mix-potato-masher',
    name: 'Potato Masher',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 54,
    formula: 'fixed',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit', 'crit-eligible'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-potato-masher' },
  },

  // §5.9 — Fire Gem + Shining Gem. All enemies, fixed DmgCon 100 (~5000 base).
  'mix-cluster-bomb': {
    id: 'mix-cluster-bomb',
    name: 'Cluster Bomb',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 100,
    formula: 'fixed',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit', 'crit-eligible'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-cluster-bomb' },
  },

  // §5.9 — Grenade + Door to Tomorrow. All enemies, fixed DmgCon 180
  // (~9000 base).
  'mix-tallboy': {
    id: 'mix-tallboy',
    name: 'Tallboy',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 180,
    formula: 'fixed',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit', 'crit-eligible'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-tallboy' },
  },

  // §5.9 — Grenade + Teleport Sphere. All enemies, fixed DmgCon 146
  // (~7300 base) plus Poison, all four Breaks, Slow, and Sleep/Silence/Dark.
  //
  // COUNT DISCREPANCY (flagged, not silently resolved): the source row's own
  // parenthetical says "7 statusEffects total", but the effect list it gives
  // — Poison (1) + all 4 Breaks (4) + Slow (1) + Sleep/Silence/Darkness (3) —
  // is 9 distinct StatusApplication entries. All 9 are encoded below; see the
  // report for this gap.
  'mix-chaos-grenade': {
    id: 'mix-chaos-grenade',
    name: 'Chaos Grenade',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 146,
    formula: 'fixed',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [
      { status: 'poison', chance: 254, duration: 254 },
      ...ALL_FOUR_BREAKS.map((status): StatusApplication => ({ status, chance: 150, duration: 254 })),
      { status: 'slow', chance: 254, duration: 254 },
      { status: 'sleep', chance: 254, duration: 8 },
      { status: 'silence', chance: 254, duration: 8 },
      { status: 'darkness', chance: 254, duration: 8 },
    ],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-chaos-grenade', sourceCountDiscrepancy: 'row says "7 statusEffects total" but lists 9 distinct statuses' },
  },

  // §5.9 — Antidote + Fire Gem. One random enemy, Fire element, fixed
  // DmgCon 14 (~700 base) x6 hits.
  'mix-firestorm': {
    id: 'mix-firestorm',
    name: 'Firestorm',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 14,
    formula: 'fixed',
    damageType: 'other',
    element: ['fire'],
    targeting: 'random-enemy',
    hits: 6,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-firestorm' },
  },

  // §5.9 — Fire Gem + Hypello Potion. One random enemy, Fire element, fixed
  // DmgCon 18 (~900 base) x3 hits, plus Poison, all four Breaks (lower
  // chance than Chaos Grenade), and Sleep/Silence/Dark.
  'mix-abaddon-flame': {
    id: 'mix-abaddon-flame',
    name: 'Abaddon Flame',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 18,
    formula: 'fixed',
    damageType: 'other',
    element: ['fire'],
    targeting: 'random-enemy',
    hits: 3,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [
      { status: 'poison', chance: 254, duration: 254 },
      ...ALL_FOUR_BREAKS.map((status): StatusApplication => ({ status, chance: 50, duration: 254 })),
      { status: 'sleep', chance: 254, duration: 3 },
      { status: 'silence', chance: 254, duration: 3 },
      { status: 'darkness', chance: 254, duration: 3 },
    ],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-abaddon-flame' },
  },

  // §5.9 — Fire Gem + Lv.1 Key Sphere. One random enemy, Fire element,
  // fixed DmgCon 18 (~900 base) x9 hits. No status payload.
  'mix-burning-soul': {
    id: 'mix-burning-soul',
    name: 'Burning Soul',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 18,
    formula: 'fixed',
    damageType: 'other',
    element: ['fire'],
    targeting: 'random-enemy',
    hits: 9,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-burning-soul' },
  },

  // §5.9 — Power Distiller + Shadow Gem. All enemies, percent-current
  // DmgCon 12 = 75% of each enemy's CURRENT HP.
  'mix-nega-burst': {
    id: 'mix-nega-burst',
    name: 'Nega Burst',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 12,
    formula: 'percent-current',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-nega-burst' },
  },

  // §5.9 — Shadow Gem + Door to Tomorrow. All enemies, percent-current
  // DmgCon 15 = 93.75% of each enemy's current HP.
  'mix-black-hole': {
    id: 'mix-black-hole',
    name: 'Black Hole',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 15,
    formula: 'percent-current',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-black-hole' },
  },

  // §5.9 — Fire Gem + Dark Matter. All enemies, deal-9999 DmgCon 2 = a flat
  // 19 998 to each. `always-break-damage-limit` INSTEAD of
  // `never-break-damage-limit` — the file's other exception besides Final
  // Elixir (`mixes/abilities-restoratives.ts`).
  'mix-sunburst': {
    id: 'mix-sunburst',
    name: 'Sunburst',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 2,
    formula: 'deal-9999',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'always-break-damage-limit'],
    breaksDamageLimit: true,
    canReflect: false,
    minigame: null,
    extra: { vfxKey: 'vfx-mix-sunburst' },
  },
};
