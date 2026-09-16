/**
 * Chapter 2 party build — Zanarkand Dome, The Beyond (Lady Yunalesca).
 *
 * Build point: after the Chamber of the Fayth, immediately following the
 * Spectral Keeper. Source: `research/ffx-yunalesca.md` §11 (party preset)
 * and §12 (aeon stats, Ultimania N=270-299 battle-count band — a normal
 * first playthrough reaches this fight at roughly that many battles).
 * Equipment is loadout **B** from `research/ffx-seymour-flux.md` §7.7.2,
 * which is defined as a diff against the Gagazet loadout — see
 * `./gagazet.ts` for the base. All numbers are `[estimate]` in the
 * research's own sense (an authored story-progress snapshot); components
 * (ability grid locations, equipment abilities, catalyst costs) are
 * `[verified]`/`[decompiled]`.
 *
 * **Do not equip Zombieproof and do not stock a blanket Zombie cure as the
 * obvious answer** [§ffx-yunalesca.md intro]: the encounter's lesson is
 * entering Form III with at least one member still Zombie-afflicted so
 * they survive Mega Death. Zombie Ward (carried over from Mt. Gagazet,
 * since abilities can never be removed once added) stays at ~49.5% land
 * rate against Hellbiter — Holy Water must be *available*, not automatic.
 */

import type { AeonBuild, FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';

const BASE_WEAPON_BONUS_CRIT = 3;

function tidus(): FFXMemberBuild {
  return {
    id: 'tidus',
    name: 'Tidus',
    spriteKey: 'tidus',
    portraitKey: 'tidus',
    // §11.1 [estimate].
    stats: { hp: 3100, mp: 170, str: 34, def: 24, mag: 20, mdef: 22, agi: 33, luck: 18, eva: 24, acc: 20, maxHp: 3410, maxMp: 170 },
    hp: 3410,
    mp: 170,
    learnedAbilityIds: ['cheer', 'provoke', 'haste', 'hastega', 'slow', 'delay-attack', 'delay-buster', 'flee', 'talk'],
    equipment: {
      weapon: { name: 'Baroque Sword', slots: 3, autoAbilities: ['strength-10'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout B: the 3rd slot fills with Death Ward.
      armor: { name: 'Glorious Shield', slots: 3, autoAbilities: ['hp-10', 'zombie-ward', 'death-ward'] },
    },
    overdrive: { gauge: 35, mode: 'stoic', unlockedModes: ['stoic', 'warrior'], unlockedOverdriveIds: ['spiral-cut', 'slice-and-dice'] },
    sphereGrid: { position: 'tidus-sphere-46', activatedNodeIds: [], sLv: 46, ap: 0, spheres: {} },
  };
}

function yuna(): FFXMemberBuild {
  return {
    id: 'yuna',
    name: 'Yuna',
    spriteKey: 'yuna',
    portraitKey: 'yuna',
    stats: { hp: 2450, mp: 290, str: 16, def: 20, mag: 38, mdef: 36, agi: 26, luck: 18, eva: 18, acc: 18, maxHp: 2450, maxMp: 290 },
    hp: 2450,
    mp: 290,
    // §11.2, §11.3 [estimate] — Full-Life/Auto-Life/Holy withheld: "Full-Life
    // requires crossing into Rikku's section", not granted by default.
    learnedAbilityIds: [
      'cure',
      'cura',
      'curaga',
      'esuna',
      'life',
      'nulblaze',
      'nulfrost',
      'nulshock',
      'nultide',
      'scan',
      'protect',
      'shell',
      'reflect',
      'dispel',
      'regen',
      'pray',
    ],
    equipment: {
      weapon: { name: "Yuna's Staff", slots: 1, autoAbilities: [], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout B: the 4th slot fills with Death Ward.
      armor: { name: 'Blessed Ring', slots: 4, autoAbilities: ['magic-def-10', 'magic-def-5', 'zombie-ward', 'death-ward'] },
    },
    overdrive: { gauge: 45, mode: 'healer', unlockedModes: ['stoic', 'healer'], unlockedOverdriveIds: ['grand-summon'] },
    sphereGrid: { position: 'yuna-sphere-44', activatedNodeIds: [], sLv: 44, ap: 0, spheres: {} },
  };
}

function auron(): FFXMemberBuild {
  return {
    id: 'auron',
    name: 'Auron',
    spriteKey: 'auron',
    portraitKey: 'auron',
    stats: { hp: 4000, mp: 110, str: 44, def: 32, mag: 16, mdef: 22, agi: 21, luck: 18, eva: 12, acc: 26, maxHp: 4400, maxMp: 110 },
    hp: 4400,
    mp: 110,
    learnedAbilityIds: ['power-break', 'armor-break', 'magic-break', 'mental-break', 'threaten', 'guard', 'sentinel'],
    equipment: {
      weapon: { name: "Auron's Katana", slots: 1, autoAbilities: ['piercing'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout B: 3rd slot -> Death Ward, 4th -> Stone Ward.
      armor: { name: 'Blessed Bracer', slots: 4, autoAbilities: ['hp-10', 'zombie-ward', 'death-ward', 'stone-ward'] },
    },
    overdrive: { gauge: 55, mode: 'warrior', unlockedModes: ['stoic', 'warrior'], unlockedOverdriveIds: ['dragon-fang', 'shooting-star'] },
    sphereGrid: { position: 'auron-sphere-48', activatedNodeIds: [], sLv: 48, ap: 0, spheres: {} },
  };
}

function wakka(): FFXMemberBuild {
  return {
    id: 'wakka',
    name: 'Wakka',
    spriteKey: 'wakka',
    portraitKey: 'wakka',
    stats: { hp: 3200, mp: 140, str: 38, def: 26, mag: 18, mdef: 22, agi: 29, luck: 18, eva: 20, acc: 34, maxHp: 3520, maxMp: 140 },
    hp: 3520,
    mp: 140,
    learnedAbilityIds: ['dark-attack', 'silence-attack', 'sleep-attack', 'dark-buster', 'silence-buster', 'sleep-buster', 'aim'],
    equipment: {
      weapon: { name: "Wakka's Ball", slots: 1, autoAbilities: [], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout B: 2nd slot -> Death Ward, 3rd left empty.
      armor: { name: 'Glorious Armguard', slots: 3, autoAbilities: ['hp-10', 'death-ward'] },
    },
    overdrive: { gauge: 30, mode: 'victor', unlockedModes: ['stoic', 'warrior', 'victor'], unlockedOverdriveIds: ['element-reels'] },
    sphereGrid: { position: 'wakka-sphere-44', activatedNodeIds: [], sLv: 44, ap: 0, spheres: {} },
  };
}

function lulu(): FFXMemberBuild {
  return {
    id: 'lulu',
    name: 'Lulu',
    spriteKey: 'lulu',
    portraitKey: 'lulu',
    stats: { hp: 2300, mp: 300, str: 12, def: 20, mag: 44, mdef: 40, agi: 22, luck: 18, eva: 22, acc: 18, maxHp: 2530, maxMp: 300 },
    hp: 2530,
    mp: 300,
    // §11.2 [estimate] — "-ara tier plus first -aga"; Doublecast held back as borderline.
    learnedAbilityIds: ['fire', 'fira', 'firaga', 'blizzard', 'blizzara', 'thunder', 'thundara', 'water', 'watera', 'bio', 'focus', 'scan'],
    equipment: {
      weapon: { name: "Lulu's Moogle", slots: 1, autoAbilities: ['magic-10'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout B: 3rd slot -> Death Ward.
      armor: { name: 'Glorious Bangle', slots: 3, autoAbilities: ['hp-10', 'magic-def-10', 'death-ward'] },
    },
    overdrive: { gauge: 40, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['fury'] },
    sphereGrid: { position: 'lulu-sphere-44', activatedNodeIds: [], sLv: 44, ap: 0, spheres: {} },
  };
}

function rikku(): FFXMemberBuild {
  return {
    id: 'rikku',
    name: 'Rikku',
    spriteKey: 'rikku',
    portraitKey: 'rikku',
    stats: { hp: 2600, mp: 150, str: 26, def: 22, mag: 24, mdef: 24, agi: 36, luck: 20, eva: 28, acc: 22, maxHp: 2860, maxMp: 150 },
    hp: 2860,
    mp: 150,
    learnedAbilityIds: ['steal', 'use', 'mix', 'luck', 'flee', 'nab-gil'],
    equipment: {
      weapon: { name: "Rikku's Claw", slots: 1, autoAbilities: [], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout B: 2nd slot -> Death Ward, 3rd left empty.
      armor: { name: 'Glorious Targe', slots: 3, autoAbilities: ['hp-10', 'death-ward'] },
    },
    overdrive: { gauge: 25, mode: 'stoic', unlockedModes: ['stoic', 'comrade'], unlockedOverdriveIds: ['mix'] },
    sphereGrid: { position: 'rikku-sphere-42', activatedNodeIds: [], sLv: 42, ap: 0, spheres: {} },
  };
}

function kimahri(): FFXMemberBuild {
  return {
    id: 'kimahri',
    name: 'Kimahri',
    spriteKey: 'kimahri',
    portraitKey: 'kimahri',
    stats: { hp: 3000, mp: 160, str: 32, def: 28, mag: 26, mdef: 26, agi: 26, luck: 18, eva: 18, acc: 22, maxHp: 3300, maxMp: 160 },
    hp: 3300,
    mp: 160,
    learnedAbilityIds: ['lancet', 'scan', 'jump', 'mighty-guard', 'white-wind'],
    equipment: {
      weapon: { name: "Kimahri's Spear", slots: 2, autoAbilities: ['piercing', 'sensor'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout B: 2nd slot -> Death Ward, 3rd left empty.
      armor: { name: 'Glorious Armlet', slots: 3, autoAbilities: ['hp-10', 'death-ward'] },
    },
    overdrive: { gauge: 35, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['jump', 'mighty-guard', 'white-wind'] },
    sphereGrid: { position: 'kimahri-sphere-42', activatedNodeIds: [], sLv: 42, ap: 0, spheres: {} },
  };
}

/** §12 [verified: 2 sources — Ultimania N=270-299 battle-count table]. */
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
    stats: { hp, mp, str, def, mag, mdef, agi, luck: 5, eva, acc, maxHp: hp, maxMp: mp }, // luck [estimate] — not published
    hp,
    mp,
    overdriveGauge,
    abilityIds: [...abilityIds, 'shield', 'boost'],
    overdriveIds,
  };
}

export const zanarkandBuild: FFXPartyBuild = {
  game: 'ffx',
  members: [tidus(), yuna(), auron(), wakka(), lulu(), rikku(), kimahri()],
  activeSlots: ['tidus', 'yuna', 'auron'],
  reserve: ['wakka', 'lulu', 'kimahri', 'rikku'],
  // §12, §17 [Addendum note appended to §7.9.2 in ffx-bfa-yu-yevon.md,
  // recommending the exact per-aeon gauge values used here] — the party has
  // just spent aeons on the Spectral Keeper and the Dome fiends, so uptime
  // is lower than the Gagazet preset's.
  aeons: [
    aeon('valefor', 'Valefor', 1341, 43, 28, 39, 42, 42, 19, 27, 15, ['sonic-wings'], ['energy-ray'], 60),
    aeon('ifrit', 'Ifrit', 1797, 41, 29, 47, 41, 37, 17, 14, 15, ['meteor-strike'], ['hellfire'], 40),
    aeon('ixion', 'Ixion', 1787, 45, 30, 43, 40, 52, 15, 15, 16, ['aerospark'], ['thors-hammer'], 40),
    aeon('shiva', 'Shiva', 1596, 48, 28, 27, 46, 43, 27, 44, 15, ['heavenly-strike'], ['diamond-dust'], 55),
    aeon('bahamut', 'Bahamut', 2542, 63, 33, 44, 36, 51, 19, 29, 15, ['impulse'], ['mega-flare'], 30),
  ],
  // §11.4 [estimate].
  inventory: [
    { itemId: 'holy-water', count: 4 },
    { itemId: 'phoenix-down', count: 18 },
    { itemId: 'mega-phoenix', count: 1 },
    { itemId: 'hi-potion', count: 28 },
    { itemId: 'x-potion', count: 5 },
    { itemId: 'mega-potion', count: 4 },
    { itemId: 'potion', count: 30 },
    { itemId: 'remedy', count: 4 },
    { itemId: 'al-bhed-potion', count: 15 },
    { itemId: 'ether', count: 9 },
    { itemId: 'elixir', count: 1 },
    { itemId: 'eye-drops', count: 10 },
    { itemId: 'echo-screen', count: 10 },
    { itemId: 'soft', count: 5 },
    { itemId: 'antidote', count: 8 },
    { itemId: 'light-curtain', count: 2 },
    { itemId: 'lunar-curtain', count: 2 },
  ],
  gil: 40000, // [estimate] — not given exactly by the research; modest growth from the Gagazet preset's 27,000
  sphereInventory: {},
};

export default zanarkandBuild;
