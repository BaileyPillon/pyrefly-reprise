/**
 * Party build — **Macalania Temple**, the antechamber (Seymour + Anima).
 *
 * Build point: Yuna has just received Shiva in the Chamber of the Fayth;
 * Tromell's gifts are in the party's hands and O'aka has already set up in the
 * Temple Hall. Source: `research/ffx-seymour-anima-macalania.md` §8.
 *
 * **Game case: FFX only** [AGENTS.md rule 14] — an FFX party for an FFX
 * encounter.
 *
 * Same construction and the same caveats as `./gagazet.ts`: an authored
 * story-progress preset, `[estimate]` in the research's own sense, with
 * `[verified]` / `[decompiled]` components underneath. Stats are the **midpoint
 * of each published range** in §8.3.
 *
 * **The Yuna row is better than an estimate.** §8.4 reproduces the FF Wiki's
 * published Shiva stat-growth table from this very row through
 * `ffx-combat-core` §6.4's aeon derivation, matching **seven of nine** stats
 * exactly. An authored preset that reproduces a published table it was not
 * built from is `[derived]`, not a guess — so is §8.4's whole aeon block.
 *
 * Equipment model note, identical to `gagazet.ts` [§7.7.1 of the Flux
 * research]: FFX weapons and armour grant **no stats**, only auto-ability
 * slots. Only `hp-N`/`mp-N` move a `StatBlock` field. Everything else is a
 * damage-time multiplier, so the numbers below are raw Sphere Grid values.
 *
 * ---
 *
 * ## Three properties of this loadout are load-bearing
 *
 * 1. **Nobody has an elemental ward, and that is correct** (§8.8). Seymour
 *    cycles all four elements; warding one would be strictly worse than the
 *    **Nul spells**, which are free, retargetable and the thing the chapter is
 *    teaching.
 * 2. **Nobody has Confuse protection**, because it does not exist yet (§8.7):
 *    the Confuse Ward catalyst is 16× Musk and Musk's only pre-airship source
 *    is a Floating Eye bribe at ~56,000 gil. Shremedy's Confusion has to be
 *    eaten and cured.
 * 3. **Rikku's Shell Targe comes from Tromell** (§8.7) — the one piece of the
 *    answer the player did not buy was handed to them by the enemy's own
 *    retainer, an hour before he disowns them.
 *
 * ## Two rules this file must not "helpfully" improve
 *
 * - **Yuna does not have Dispel here** (§8.5). The answer to Seymour's Shell
 *   is **Ixion's Aerospark**, a free aeon sub-command. Handing the preset
 *   Dispel deletes the lesson.
 * - **Shiva's Overdrive gauge starts at 0, and that is a rule, not a choice**
 *   (§8.6). She was obtained minutes ago and has never been in a battle. Her
 *   arriving empty is the whole reason act two has a shape: the player's
 *   newest, best answer fills over one or two exchanges and only then spends
 *   Diamond Dust.
 *
 * ## Gaps left open rather than guessed [AGENTS.md hard rule 6]
 *
 * - **G-7**: the exact ability strings on the O'aka / Rin armour are `[derived]`
 *   from the naming table, not read off the item pages. The pieces below carry
 *   the *named* ability where the family is unambiguous (`shell` on the Shell
 *   Targe is stated outright) and an empty slot where it is not.
 * - **G-9**: no source reconstructs a Sphere Grid path for this build point, so
 *   `sphereGrid.position` / `activatedNodeIds` / `spheres` are minimal, exactly
 *   as `gagazet.ts` leaves them.
 * - **C-10**: Shiva's growth table is indexed by battles fought. If the chapter
 *   is played standalone — which it is — the research says pick the **180–209**
 *   row and freeze it. We do.
 */

import type { AeonBuild, FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';

/** §7.7.1 of the Flux research — every character's default weapon carries this. */
const BASE_WEAPON_BONUS_CRIT = 3;

function tidus(): FFXMemberBuild {
  return {
    id: 'tidus',
    name: 'Tidus',
    spriteKey: 'tidus',
    portraitKey: 'tidus',
    // §8.3 [estimate] — midpoint of 900-1,400 / 40-70 / 18-24 / ...
    stats: {
      hp: 1150,
      mp: 55,
      str: 21,
      def: 13,
      mag: 11,
      mdef: 11,
      agi: 21,
      luck: 18,
      eva: 17,
      acc: 17,
      maxHp: 1265, // Seeker's Shield HP +10%
      maxMp: 55,
    },
    hp: 1265,
    mp: 55,
    // §8.5 [estimate]. Haste is borderline but the wiki's own strategy assumes
    // it. No Hastega, no Slow, no Quick Hit.
    // `talk` is the **Trigger Command**: §5.5 gives Tidus a line worth
    // **+10 Strength** for this battle [verified: 2 sources].
    learnedAbilityIds: ['cheer', 'provoke', 'haste', 'delay-attack', 'flee', 'talk'],
    equipment: {
      // §8.8 — Rin's Travel Agency, Lake Macalania: Strength +5% + 1 empty slot, 825 gil.
      weapon: { name: 'Baroque Sword', slots: 2, autoAbilities: ['strength-5'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: "Seeker's Shield", slots: 2, autoAbilities: ['hp-10'] },
    },
    overdrive: {
      gauge: 42, // §8.6 [estimate] midpoint of 35-50%
      mode: 'warrior',
      unlockedModes: ['stoic', 'warrior'],
      unlockedOverdriveIds: ['spiral-cut'], // §8.6 — Slice & Dice is borderline; omitted
    },
    sphereGrid: { position: 'tidus-sphere-18', activatedNodeIds: [], sLv: 18, ap: 0, spheres: {} },
  };
}

function yuna(): FFXMemberBuild {
  return {
    id: 'yuna',
    name: 'Yuna',
    spriteKey: 'yuna',
    portraitKey: 'yuna',
    // §8.3 [DERIVED, not estimate] — §8.4's aeon-derivation reproduction
    // validates this row against a published table it was not built from.
    stats: {
      hp: 1075,
      mp: 180,
      str: 9,
      def: 9,
      mag: 29,
      mdef: 31,
      agi: 12,
      luck: 17,
      eva: 33,
      acc: 5,
      maxHp: 1182, // Seeker's Ring HP +10% -> 1,075 * 1.10
      maxMp: 180,
    },
    hp: 1182,
    mp: 180,
    // §8.5 [estimate]. **No Dispel** — see the file header; it is the whole
    // reason Ixion's Aerospark is the answer to Seymour's Shell.
    learnedAbilityIds: [
      'cure',
      'cura',
      'life',
      'nulblaze',
      'nulfrost',
      'nulshock',
      'nultide',
      'esuna',
      'scan',
      'pray',
      'shell',
      'protect',
      // §5.5 [verified: 2 sources] — Yuna's Talk line is +10 Magic Defense.
      'talk',
    ],
    equipment: {
      weapon: { name: 'Ductile Rod', slots: 2, autoAbilities: ['magic-5'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: "Seeker's Ring", slots: 2, autoAbilities: ['hp-10'] },
    },
    overdrive: {
      gauge: 37, // §8.6 [estimate] midpoint of 30-45%
      mode: 'healer',
      unlockedModes: ['stoic', 'healer'],
      unlockedOverdriveIds: ['grand-summon'],
    },
    sphereGrid: { position: 'yuna-sphere-18', activatedNodeIds: [], sLv: 18, ap: 0, spheres: {} },
  };
}

function rikku(): FFXMemberBuild {
  return {
    id: 'rikku',
    name: 'Rikku',
    spriteKey: 'rikku',
    portraitKey: 'rikku',
    // §8.3 [estimate].
    stats: {
      hp: 850,
      mp: 105,
      str: 15,
      def: 11,
      mag: 13,
      mdef: 11,
      agi: 23, // the fastest character in the party at this point
      luck: 18,
      eva: 9,
      acc: 9,
      maxHp: 850,
      maxMp: 105,
    },
    hp: 850,
    mp: 105,
    // §8.5 [estimate]. **Steal is the command the chapter is named for** — she
    // joined two areas back, which is exactly why this is the fight to teach it
    // in. Mug is borderline and omitted; Luck is not yet reachable.
    learnedAbilityIds: ['steal', 'use', 'mix', 'flee'],
    equipment: {
      weapon: { name: 'Devastator', slots: 2, autoAbilities: ['strength-5'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §8.7 [single source: wiki] — Tromell's gift, carrying SOS Shell.
      armor: { name: 'Shell Targe', slots: 1, autoAbilities: ['sos-shell'] },
    },
    overdrive: {
      gauge: 37, // §8.6 [estimate] midpoint of 30-45%
      mode: 'comrade',
      unlockedModes: ['stoic', 'comrade'],
      unlockedOverdriveIds: ['mix'],
    },
    // §8.3's note: Rikku carries a +25 starting S.Lv offset, folded in here.
    sphereGrid: { position: 'rikku-sphere-40', activatedNodeIds: [], sLv: 40, ap: 0, spheres: {} },
  };
}

function wakka(): FFXMemberBuild {
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

function auron(): FFXMemberBuild {
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

function lulu(): FFXMemberBuild {
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

function kimahri(): FFXMemberBuild {
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

/**
 * §8.4 — the **180–209 battles** row of the FF Wiki's published stat-growth
 * table, frozen per **C-10** because this chapter is played standalone.
 *
 * Shiva's row is quoted verbatim from the wiki table and independently
 * reproduced by `ffx-combat-core` §6.4's derivation to within 1–2 points on
 * seven of nine stats; Valefor / Ifrit / Ixion are that derivation's own tier-5
 * output `[derived]`. Luck has no published figure at any story point and is
 * held at a flat `[estimate]`, exactly as `gagazet.ts` does.
 *
 * `affinities` is set only where the aeon's **hidden default armour** carries
 * an elemental eater. Shiva's carries **Ice Eater** [§8.4, verified: 2 sources],
 * which is what makes §7 row 13 work — and what makes Seymour's Blizzaga step
 * *heal* a summoned Shiva, because he uses the -ga tier on aeons regardless of
 * absorption (§5.2). One turn in four, the boss tops up your aeon. Keep it.
 * The engine applies it from `setup.ts#AEON_INNATE_AFFINITIES`.
 */
function aeon(
  id: AeonBuild['id'],
  name: string,
  hp: number,
  mp: number,
  str: number,
  def: number,
  mag: number,
  mdef: number,
  agi: number,
  eva: number,
  acc: number,
  abilityIds: string[],
  overdriveIds: string[],
  overdriveGauge: number,
): AeonBuild {
  return {
    id,
    name,
    spriteKey: id,
    stats: { hp, mp, str, def, mag, mdef, agi, luck: 5, eva, acc, maxHp: hp, maxMp: mp }, // luck [estimate]
    hp,
    mp,
    overdriveGauge,
    abilityIds: [...abilityIds, 'shield', 'boost'],
    overdriveIds,
  };
}

export const macalaniaBuild: FFXPartyBuild = {
  game: 'ffx',
  // §8.1 [verified: 2 sources] — all seven are available here.
  members: [tidus(), yuna(), rikku(), wakka(), auron(), lulu(), kimahri()],
  // §8's active three. Tidus and Yuna carry two of the three Talk bonuses,
  // Yuna owns both the Nul spells and the summon, and **Rikku owns Steal** —
  // act one cannot be taught without her.
  activeSlots: ['tidus', 'yuna', 'rikku'],
  // All four are named routes in §7, so every one of them is a real switch:
  // Wakka's third Talk bonus, Auron's Magic Break / Threaten / Banishing Blade,
  // Lulu's Fury past Shell, Kimahri's Stone Breath.
  reserve: ['wakka', 'auron', 'lulu', 'kimahri'],
  aeons: [
    // §8.4 [derived] tier-5 rows. Bahamut is NOT owned (Bevelle is chapters
    // away) and Anima is NOT owned — the Destruction Sphere in *this temple's*
    // Cloister is one of her prerequisites, which is the chapter's best piece
    // of dramatic irony.
    aeon('valefor', 'Valefor', 1146, 38, 27, 35, 31, 37, 15, 24, 17, ['sonic-wings'], ['energy-ray'], 90),
    aeon('ifrit', 'Ifrit', 1515, 36, 29, 46, 30, 32, 13, 12, 17, ['meteor-strike'], ['hellfire'], 60),
    // Ixion's Aerospark is the answer to Seymour's Shell, because this Yuna
    // does not have Dispel (§8.5).
    aeon('ixion', 'Ixion', 1513, 40, 31, 40, 30, 46, 11, 13, 19, ['aerospark'], ['thors-hammer'], 60),
    // **0 is a rule, not a choice** (§8.6): Shiva was obtained minutes ago.
    aeon('shiva', 'Shiva', 1342, 40, 25, 23, 34, 38, 22, 39, 13, ['heavenly-strike'], ['diamond-dust'], 0),
  ],
  // §8.9 [estimate], midpoints. **Petrify Grenade and Poison Fang are the two
  // consumables that change this fight** and both come from a Basilisk on the
  // Djose Highroad, which the player has been fighting for two regions — §7
  // rows 2 and 8 are unreachable without them. X-Potion x2 and Remedy are
  // found in this temple; Remedy is *the* Confusion answer (§8.7).
  inventory: [
    { itemId: 'potion', count: 30 },
    { itemId: 'hi-potion', count: 10 },
    { itemId: 'x-potion', count: 2 },
    { itemId: 'phoenix-down', count: 17 },
    { itemId: 'remedy', count: 3 },
    { itemId: 'ether', count: 3 },
    { itemId: 'elixir', count: 1 },
    { itemId: 'antidote', count: 10 },
    { itemId: 'eye-drops', count: 10 },
    { itemId: 'echo-screen', count: 10 },
    { itemId: 'soft', count: 10 },
    { itemId: 'grenade', count: 10 },
    { itemId: 'petrify-grenade', count: 4 },
    { itemId: 'silence-grenade', count: 2 },
    { itemId: 'poison-fang', count: 2 },
  ],
  gil: 12000, // §8.9 [estimate] midpoint of 5,000-20,000
  sphereInventory: {}, // [estimate] — assumed spent building the stat blocks above
};

export default macalaniaBuild;
