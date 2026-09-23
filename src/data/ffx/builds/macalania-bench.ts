/**
 * The Macalania build's four reserve members (Wakka, Auron, Lulu, Kimahri),
 * split out of `./macalania.ts` for the 400-line house rule (AGENTS.md rule
 * 7). **FFX only** [AGENTS.md rule 14]; every number is sourced where it
 * stands, exactly as it was in `./macalania.ts`.
 */

import type { FFXMemberBuild } from '../../../battle/common/types.ts';

/** §7.7.1 of the Flux research — every character's default weapon carries this. */
export const BASE_WEAPON_BONUS_CRIT = 3;

export function wakka(): FFXMemberBuild {
  return {
    id: 'wakka',
    name: 'Wakka',
    spriteKey: 'wakka',
    portraitKey: 'wakka',
    stats: {
      hp: 1250,
      mp: 42,
      str: 22,
      def: 14,
      mag: 13,
      mdef: 9,
      agi: 11,
      luck: 19,
      eva: 8,
      acc: 35, // §8.3 — the accuracy outlier
      maxHp: 1375, // Seeker's Armguard HP +10%
      maxMp: 42,
    },
    hp: 1375,
    mp: 42,
    // §8.5 [estimate]. §5.5 [verified: 2 sources] — Wakka's Talk line is the
    // third +10 Magic Defense, which is why he is a real switch and not scenery.
    learnedAbilityIds: ['dark-attack', 'silence-attack', 'aim', 'talk'],
    equipment: {
      weapon: { name: 'Switch Hitter', slots: 2, autoAbilities: ['strength-5'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: "Seeker's Armguard", slots: 2, autoAbilities: ['hp-10'] },
    },
    overdrive: {
      gauge: 42, // §8.6 [estimate]
      mode: 'warrior',
      unlockedModes: ['stoic', 'warrior'],
      unlockedOverdriveIds: ['element-reels'], // §8.6 — Attack/Status Reels need blitzball prizes
    },
    sphereGrid: { position: 'wakka-sphere-18', activatedNodeIds: [], sLv: 18, ap: 0, spheres: {} },
  };
}

export function auron(): FFXMemberBuild {
  return {
    id: 'auron',
    name: 'Auron',
    spriteKey: 'auron',
    portraitKey: 'auron',
    stats: {
      hp: 1900,
      mp: 50,
      str: 31, // §8.3 — by far the strongest swing in the party
      def: 21,
      mag: 8,
      mdef: 9,
      agi: 10,
      luck: 17,
      eva: 8,
      acc: 7,
      maxHp: 1900,
      maxMp: 50,
    },
    hp: 1900,
    mp: 50,
    // §8.5 [estimate]. Magic Break and Threaten are borderline and both are
    // named routes in §7 (rows 3 and 7), so the preset carries them; Mental
    // Break and Sentinel are explicitly "probably not yet".
    learnedAbilityIds: ['power-break', 'armor-break', 'magic-break', 'threaten', 'guard'],
    equipment: {
      weapon: { name: "Auron's Katana", slots: 1, autoAbilities: ['piercing'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // O'aka, Temple Hall (§8.7). **G-7**: the "Soft / Echo / Seeker's"
      // ability families are `[derived]` from the naming table, not read off
      // the item pages — and the Ward family has no member of `AutoAbilityId`
      // at all, so there is nothing to write. Left empty rather than guessed
      // [AGENTS.md hard rule 6]; the slot count is what the shop table gives.
      armor: { name: 'Soft Bracer', slots: 1, autoAbilities: [] },
    },
    overdrive: {
      gauge: 62, // §8.6 [estimate] midpoint of 55-70% — he takes the hits
      mode: 'stoic',
      unlockedModes: ['stoic'],
      // §8.6 [verified: 2 sources]: Shooting Star is unlocked by defeating
      // Spherimorph, which is **mandatory** one region back. Banishing Blade
      // is reachable from three Jecht Spheres and the wiki names it for this
      // fight — §7 row 7 depends on it (all four Breaks at chance 254, which
      // bypasses Seymour's 50 Magic Break resistance entirely).
      unlockedOverdriveIds: ['dragon-fang', 'shooting-star', 'banishing-blade'],
    },
    sphereGrid: { position: 'auron-sphere-18', activatedNodeIds: [], sLv: 18, ap: 0, spheres: {} },
  };
}

export function lulu(): FFXMemberBuild {
  return {
    id: 'lulu',
    name: 'Lulu',
    spriteKey: 'lulu',
    portraitKey: 'lulu',
    stats: {
      hp: 850,
      mp: 205,
      str: 7,
      def: 11,
      mag: 34,
      mdef: 36,
      agi: 9,
      luck: 17,
      eva: 42,
      acc: 5,
      maxHp: 850,
      maxMp: 205,
    },
    hp: 850,
    mp: 205,
    // §8.5 [estimate] — the full -ra tier is borderline but the wiki's own
    // strategy assumes it. No Bio, no -ga tier, no Doublecast, no Demi.
    learnedAbilityIds: ['fire', 'fira', 'blizzard', 'blizzara', 'thunder', 'thundara', 'water', 'watera', 'focus', 'scan'],
    equipment: {
      weapon: { name: 'Variable Mog', slots: 2, autoAbilities: ['magic-5'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Echo Bangle', slots: 1, autoAbilities: [] }, // O'aka, Temple Hall (§8.7) — see G-7 on Auron's armour
    },
    overdrive: {
      gauge: 37, // §8.6 [estimate]
      mode: 'stoic',
      unlockedModes: ['stoic'],
      // §8.6: Fury bypasses Reflect and Shell, ignores Silence and costs no MP
      // — a real counter to Seymour's opening Shell.
      unlockedOverdriveIds: ['fury'],
    },
    sphereGrid: { position: 'lulu-sphere-18', activatedNodeIds: [], sLv: 18, ap: 0, spheres: {} },
  };
}

export function kimahri(): FFXMemberBuild {
  return {
    id: 'kimahri',
    name: 'Kimahri',
    spriteKey: 'kimahri',
    portraitKey: 'kimahri',
    stats: {
      hp: 1200,
      mp: 100,
      str: 21,
      def: 17,
      mag: 19,
      mdef: 9,
      agi: 11,
      luck: 18,
      eva: 9,
      acc: 9,
      maxHp: 1200,
      maxMp: 100,
    },
    hp: 1200,
    mp: 100,
    learnedAbilityIds: ['lancet', 'jump'],
    equipment: {
      weapon: { name: "Kimahri's Spear", slots: 2, autoAbilities: ['piercing', 'sensor'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Echo Armlet', slots: 1, autoAbilities: [] }, // O'aka, Temple Hall (§8.7) — see G-7 on Auron's armour
    },
    overdrive: {
      gauge: 47, // §8.6 [estimate] midpoint of 40-55%
      mode: 'stoic',
      unlockedModes: ['stoic'],
      // §8.5 [verified: 2 sources] — Stone Breath is Lancet'd from a Basilisk
      // on the Djose Highroad, two regions back, and it is §7 row 2's answer
      // to the Guardians.
      unlockedOverdriveIds: ['jump', 'stone-breath'],
    },
    sphereGrid: { position: 'kimahri-sphere-18', activatedNodeIds: [], sLv: 18, ap: 0, spheres: {} },
  };
}
