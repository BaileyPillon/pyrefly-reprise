/**
 * FFX Aeon actions — continuation of `aeons/abilities-core.ts` (Shiva and
 * Bahamut), split out to stay under this project's ~380-line data file
 * guideline. See `abilities-core.ts`'s header for the full set of shared
 * rules quoted from `research/ffx-combat-core.md` §6.3 `[verified: 2
 * sources]` — summary:
 * - Attack: `formula:'strength'`, `damageType:'physical'`,
 *   `targeting:'single-enemy'`, `flags:['crit-eligible','piercing']`
 *   (every aeon *except Valefor* carries Piercing on its Attack), ACC
 *   multiplier at `extra.accuracyMultiplier`, `accuracy` left undefined,
 *   `rank: 1` `[estimate]` (not itemized in §6.3's table).
 * - Special: Strength formula against the target's Defense,
 *   `flags:['crit-eligible']` plus any rider, `damageType:'physical'`
 *   unless noted otherwise.
 * - Overdrive: `category:'overdrive'`, `formula:'special-magic'`,
 *   `damageType:'other'`, `flags:['crit-eligible']` plus extras; only
 *   Bahamut's Mega Flare and Anima's Oblivion innately break the 9999
 *   limit. Overdrive `targeting` is not restated beyond DmgCon in §6.3, so
 *   `'single-enemy'` is used here and marked `[estimate]`.
 * - `minigame: null` on every entry.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  // ---------------------------------------------------------------------
  // Shiva — Macalania aeon. Absorbs Ice. ACCx2.5 Attack. Heavenly Strike
  // carries a guaranteed (chance 100) Threaten application.
  // ---------------------------------------------------------------------

  'shiva-attack': {
    id: 'shiva-attack',
    name: 'Attack',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 1, // [estimate] — see abilities-core.ts header.
    power: 14, // DmgCon 14 [ffx-combat-core §6.3, verified: 2 sources]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack',
    sfxKey: 'sfx-aeon-attack',
    messageTemplate: '{user} attacks {target}',
    minigame: null,
    extra: { accuracyMultiplier: 2.5, vfxKey: 'vfx-shiva-attack' },
  },

  'heavenly-strike': {
    id: 'heavenly-strike',
    name: 'Heavenly Strike',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 4,
    power: 17, // DmgCon 17
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    // Rider: guaranteed Threaten (chance 100, duration 1 user-turn) per §6.3/§4.2.
    statusEffects: [{ status: 'threaten', chance: 100, duration: 1 }],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-special-shiva',
    sfxKey: 'sfx-heavenly-strike',
    messageTemplate: '{user} uses Heavenly Strike on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-heavenly-strike' },
  },

  'diamond-dust': {
    id: 'diamond-dust',
    name: 'Diamond Dust',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 8,
    power: 60, // DmgCon 60
    formula: 'special-magic',
    damageType: 'other',
    element: ['ice'],
    targeting: 'single-enemy', // [estimate] — see abilities-core.ts header.
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-overdrive-shiva',
    sfxKey: 'sfx-diamond-dust',
    messageTemplate: '{user} uses Diamond Dust on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-diamond-dust' },
  },

  // ---------------------------------------------------------------------
  // Bahamut — Zanarkand aeon. ACCx1.5 Attack. Impulse hits all enemies.
  // Mega Flare innately breaks the 9999 damage limit.
  // ---------------------------------------------------------------------

  'bahamut-attack': {
    id: 'bahamut-attack',
    name: 'Attack',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 1, // [estimate] — see abilities-core.ts header.
    power: 16, // DmgCon 16
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack',
    sfxKey: 'sfx-aeon-attack',
    messageTemplate: '{user} attacks {target}',
    minigame: null,
    extra: { accuracyMultiplier: 1.5, vfxKey: 'vfx-bahamut-attack' },
  },

  impulse: {
    id: 'impulse',
    name: 'Impulse',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 6,
    power: 16, // DmgCon 16
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-special-bahamut',
    sfxKey: 'sfx-impulse',
    messageTemplate: '{user} uses Impulse',
    minigame: null,
    extra: { vfxKey: 'vfx-impulse' },
  },

  'mega-flare': {
    id: 'mega-flare',
    name: 'Mega Flare',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 8,
    power: 72, // DmgCon 72
    formula: 'special-magic',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // [estimate] — see abilities-core.ts header.
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'always-break-damage-limit'],
    breaksDamageLimit: true,
    animationKey: 'aeon-overdrive-bahamut',
    sfxKey: 'sfx-mega-flare',
    messageTemplate: '{user} uses Mega Flare on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-mega-flare' },
  },
};

export default ABILITIES;
