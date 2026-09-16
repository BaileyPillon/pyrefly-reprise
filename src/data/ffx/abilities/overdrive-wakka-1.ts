/**
 * Wakka's Slots Overdrives — reel-set commands (1/2).
 *
 * Source: `research/ffx-combat-core.md` §5.6 (reel sets and resolved shots)
 * and §5.2 (timed-input bonus). All rows `[verified: 2 sources]`.
 *
 * This file holds the 4 player-selectable reel-set commands
 * (`element-reels`, `attack-reels`, `status-reels`, `aurochs-reels`) — what
 * appears in the Overdrive menu and opens the `wakka-reels` minigame. They
 * deal no damage themselves (`formula: 'none'`, `power: 0`, `hits: 0`); the
 * engine reads the spun symbols and resolves to one of the 10 "shot"
 * sub-abilities in `overdrive-wakka-2.ts`, on 1 random enemy or all enemies
 * depending on the match. `extra.reelSymbols`/`resolvesToShots`/
 * `noMatchFallback` describe that resolution table for the engine.
 *
 * Timed-input bonus (§5.2): `timerMs = 20000` for Wakka, same runtime
 * formula as Tidus/Auron, driven by the 20-second reel-spin window. Marked
 * via `extra.timedInputBonus: true` here, where the timer actually runs; the
 * resolved shots in `overdrive-wakka-2.ts` inherit the already-computed
 * bonus from the engine and do not carry the flag themselves.
 *
 * Crit: "Wakka's Slots... never crit" — nothing in this file carries
 * `crit-eligible`.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  /**
   * §5.6 [verified: 2 sources]. Rank 3. Reel symbols Fire/Ice/Water/Thunder.
   * 2-of-a-kind -> matching shot on 1 random enemy; 3-of-a-kind -> matching
   * shot on all enemies; no match -> Power Shot.
   */
  'element-reels': {
    id: 'element-reels',
    name: 'Element Reels',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 0,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-wakka-reels',
    sfxKey: 'sfx-wakka-reels-spin',
    messageTemplate: '{user} uses {ability}',
    minigame: 'wakka-reels',
    extra: {
      timedInputBonus: true,
      reelSymbols: ['fire', 'ice', 'water', 'thunder'],
      resolvesToShots: ['fire-shot', 'ice-shot', 'water-shot', 'thunder-shot', 'power-shot'],
      noMatchFallback: 'power-shot',
    },
  },

  /**
   * §5.6 [verified: 2 sources]. Rank 3. Reel symbols 1 Hit/2 Hit/Miss;
   * always resolves to `attack-reels-hit` with a variable hit count (see
   * that ability's own `extra.hitCountRule`) — there is no separate
   * no-match fallback because every symbol combination still resolves to
   * the same sub-ability, just with a smaller `n`.
   */
  'attack-reels': {
    id: 'attack-reels',
    name: 'Attack Reels',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 0,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-wakka-reels',
    sfxKey: 'sfx-wakka-reels-spin',
    messageTemplate: '{user} uses {ability}',
    minigame: 'wakka-reels',
    extra: {
      timedInputBonus: true,
      reelSymbols: ['1-hit', '2-hit', 'miss'],
      resolvesToShots: ['attack-reels-hit'],
    },
  },

  /**
   * §5.6 [verified: 2 sources]. Rank 3. Reel symbols Skull/Down-Arrow/
   * Egg-Timer -> Havoc/Break/Time Shot respectively (2-of-a-kind = 1 random
   * enemy, 3-of-a-kind = all enemies); no match -> Power Shot.
   */
  'status-reels': {
    id: 'status-reels',
    name: 'Status Reels',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 0,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-wakka-reels',
    sfxKey: 'sfx-wakka-reels-spin',
    messageTemplate: '{user} uses {ability}',
    minigame: 'wakka-reels',
    extra: {
      timedInputBonus: true,
      reelSymbols: ['skull', 'down-arrow', 'egg-timer'],
      resolvesToShots: ['havoc-shot', 'break-shot', 'time-shot', 'power-shot'],
      noMatchFallback: 'power-shot',
    },
  },

  /**
   * §5.6 [verified: 2 sources]. Rank 3. Reel carries the Element and Status
   * symbols plus a dedicated Aurochs symbol. 3 Aurochs -> Aurochs Shot on
   * all enemies; otherwise resolves like whichever Element/Status symbol
   * matched; no match -> Power Shot.
   */
  'aurochs-reels': {
    id: 'aurochs-reels',
    name: 'Aurochs Reels',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 0,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-wakka-reels',
    sfxKey: 'sfx-wakka-reels-spin',
    messageTemplate: '{user} uses {ability}',
    minigame: 'wakka-reels',
    extra: {
      timedInputBonus: true,
      reelSymbols: ['fire', 'ice', 'water', 'thunder', 'skull', 'down-arrow', 'egg-timer', 'aurochs'],
      resolvesToShots: [
        'aurochs-shot',
        'fire-shot',
        'ice-shot',
        'water-shot',
        'thunder-shot',
        'havoc-shot',
        'break-shot',
        'time-shot',
        'power-shot',
      ],
      noMatchFallback: 'power-shot',
    },
  },
};

export default ABILITIES;
