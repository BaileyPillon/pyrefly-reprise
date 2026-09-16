/**
 * Chapter 3 party build — Dream's End / Inside Sin (Braska's Final Aeon ->
 * possessed aeons -> Yu Yevon).
 *
 * Build point: endgame, explicitly **no superboss grinding**. Source:
 * `research/ffx-bfa-yu-yevon.md` §4 (party preset, an authored estimate —
 * "no published statistical average... exists for this point") and
 * `research/ffx-seymour-flux.md` §7.7.2 loadout **C**, a diff against
 * loadout B in `./zanarkand.ts`. Aeon stats have no dedicated table in the
 * BFA/Yu Yevon research; this file steps one Ultimania battle-count bracket
 * up from `./zanarkand.ts`'s N=270-299 band to N=300-329
 * (`research/ffx-yunalesca.md` §12), which is `[verified: 2 sources]` for
 * the numbers themselves and `[estimate]` only in being the right bracket
 * for this later story point.
 *
 * The party at battle start is **forced to Tidus / Yuna / Auron**; reserve
 * swapping still works normally [§1]. The `aeons` array below is
 * simultaneously the party's summon roster **and** the template the engine
 * mirrors into each possessed-aeon `EnemyDef` in
 * `./braskas-final-aeon.ts` — see that file's `possessedAeonEnemyDef` doc
 * comment. Anima, Yojimbo and the Magus Sisters are intentionally **absent**
 * here (§4.4: "assume... absent for the default preset") even though their
 * possessed-aeon data ships in `braskas-final-aeon-abilities.ts` for a
 * player who does own them.
 *
 * From the possessed-aeon fights onward the whole party carries a
 * permanent, non-consumable Auto-Life granted by the fayth — modelled as an
 * encounter flag by the engine, not as an equipped auto-ability here
 * [§2.3]. Braska's Final Aeon is Regen-immune, so no Regen trick is baked
 * into this build.
 */

import type { AeonBuild, FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';

const BASE_WEAPON_BONUS_CRIT = 3;

function tidus(): FFXMemberBuild {
  return {
    id: 'tidus',
    name: 'Tidus',
    spriteKey: 'tidus',
    portraitKey: 'tidus',
    // §4.1 [estimate].
    stats: { hp: 3600, mp: 140, str: 32, def: 26, mag: 22, mdef: 22, agi: 35, luck: 18, eva: 28, acc: 22, maxHp: 4320, maxMp: 140 },
    hp: 4320,
    mp: 140,
    // §4.2 [estimate] — Quick Hit withheld (end of his own grid section).
    learnedAbilityIds: ['cheer', 'provoke', 'haste', 'hastega', 'slow', 'delay-attack', 'delay-buster', 'flee', 'talk'],
    equipment: {
      // §4.4 [verified: 2 sources]: Calm Lands post-airship stock, Strength +10/+5% + Piercing added where missing.
      weapon: {
        name: 'Baroque Sword',
        slots: 4,
        autoAbilities: ['strength-10', 'strength-5', 'piercing'],
        bonusCrit: BASE_WEAPON_BONUS_CRIT,
      },
      // §7.7.2 loadout C: swaps to a fresh Tetra Shield (4 empty slots).
      armor: { name: 'Tetra Shield', slots: 4, autoAbilities: ['hp-20', 'stoneproof', 'death-ward', 'confuse-ward'] },
    },
    overdrive: { gauge: 40, mode: 'stoic', unlockedModes: ['stoic', 'warrior'], unlockedOverdriveIds: ['spiral-cut', 'slice-and-dice', 'energy-rain'] },
    sphereGrid: { position: 'tidus-sphere-180', activatedNodeIds: [], sLv: 180, ap: 0, spheres: {} },
  };
}

function yuna(): FFXMemberBuild {
  return {
    id: 'yuna',
    name: 'Yuna',
    spriteKey: 'yuna',
    portraitKey: 'yuna',
    stats: { hp: 2700, mp: 320, str: 20, def: 20, mag: 36, mdef: 32, agi: 26, luck: 18, eva: 20, acc: 24, maxHp: 2700, maxMp: 320 },
    hp: 2700,
    mp: 320,
    // §4.2 [estimate] — Auto-Life deliberately withheld (the preset's own
    // recommendation: "make Auto-Life a coin-flip the preset explicitly
    // does not grant" so the Talk trigger and disciplined healing matter).
    // Holy, Full-Life withheld too.
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
      weapon: { name: "Yuna's Staff", slots: 4, autoAbilities: ['magic-10', 'magic-5', 'piercing'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout C: fresh Tetra Ring.
      armor: { name: 'Tetra Ring', slots: 4, autoAbilities: ['magic-def-20', 'stoneproof', 'death-ward', 'confuse-ward'] },
    },
    overdrive: { gauge: 50, mode: 'healer', unlockedModes: ['stoic', 'healer'], unlockedOverdriveIds: ['grand-summon'] },
    sphereGrid: { position: 'yuna-sphere-175', activatedNodeIds: [], sLv: 175, ap: 0, spheres: {} },
  };
}

function auron(): FFXMemberBuild {
  return {
    id: 'auron',
    name: 'Auron',
    spriteKey: 'auron',
    portraitKey: 'auron',
    stats: { hp: 4400, mp: 100, str: 42, def: 32, mag: 20, mdef: 22, agi: 22, luck: 18, eva: 14, acc: 30, maxHp: 5280, maxMp: 100 },
    hp: 5280,
    mp: 100,
    // §4.2 [estimate] — Full Break withheld (HD Remaster/International only).
    learnedAbilityIds: ['power-break', 'armor-break', 'magic-break', 'mental-break', 'threaten', 'guard', 'sentinel'],
    equipment: {
      weapon: { name: "Auron's Katana", slots: 4, autoAbilities: ['piercing', 'strength-10', 'strength-5'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout C: fresh Tetra Bracer — Auto-Med is finally affordable (Remedy is buyable on the airship).
      armor: { name: 'Tetra Bracer', slots: 4, autoAbilities: ['hp-20', 'stoneproof', 'death-ward', 'auto-med'] },
    },
    overdrive: { gauge: 60, mode: 'warrior', unlockedModes: ['stoic', 'warrior'], unlockedOverdriveIds: ['dragon-fang', 'shooting-star'] },
    sphereGrid: { position: 'auron-sphere-180', activatedNodeIds: [], sLv: 180, ap: 0, spheres: {} },
  };
}

function wakka(): FFXMemberBuild {
  return {
    id: 'wakka',
    name: 'Wakka',
    spriteKey: 'wakka',
    portraitKey: 'wakka',
    stats: { hp: 3400, mp: 110, str: 33, def: 26, mag: 22, mdef: 24, agi: 26, luck: 20, eva: 22, acc: 40, maxHp: 4080, maxMp: 110 },
    hp: 4080,
    mp: 110,
    learnedAbilityIds: ['dark-attack', 'silence-attack', 'sleep-attack', 'dark-buster', 'silence-buster', 'sleep-buster', 'aim'],
    equipment: {
      weapon: { name: "Wakka's Ball", slots: 4, autoAbilities: ['strength-10', 'strength-5', 'piercing'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout C: fresh Tetra Armguard, one slot left free.
      armor: { name: 'Tetra Armguard', slots: 4, autoAbilities: ['hp-20', 'stoneproof', 'death-ward'] },
    },
    overdrive: { gauge: 35, mode: 'victor', unlockedModes: ['stoic', 'warrior', 'victor'], unlockedOverdriveIds: ['element-reels'] },
    sphereGrid: { position: 'wakka-sphere-165', activatedNodeIds: [], sLv: 165, ap: 0, spheres: {} },
  };
}

function lulu(): FFXMemberBuild {
  return {
    id: 'lulu',
    name: 'Lulu',
    spriteKey: 'lulu',
    portraitKey: 'lulu',
    stats: { hp: 2500, mp: 300, str: 18, def: 20, mag: 42, mdef: 34, agi: 26, luck: 18, eva: 24, acc: 22, maxHp: 3000, maxMp: 300 },
    hp: 3000,
    mp: 300,
    // §4.2 [verified: 2 sources] — the recommendation explicitly grants
    // Doublecast + Firaga/Thundaga at this point. Flare/Ultima withheld.
    learnedAbilityIds: [
      'fire',
      'fira',
      'firaga',
      'blizzard',
      'blizzara',
      'blizzaga',
      'thunder',
      'thundara',
      'thundaga',
      'water',
      'watera',
      'waterga',
      'bio',
      'focus',
      'doublecast',
      'scan',
    ],
    equipment: {
      weapon: { name: "Lulu's Moogle", slots: 4, autoAbilities: ['magic-10', 'magic-5', 'piercing'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout C: fresh Tetra Bangle (the old Glorious Bangle's Magic Def+10% does not carry to a different physical item).
      armor: { name: 'Tetra Bangle', slots: 4, autoAbilities: ['hp-20', 'stoneproof', 'death-ward'] },
    },
    overdrive: { gauge: 45, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['fury'] },
    sphereGrid: { position: 'lulu-sphere-170', activatedNodeIds: [], sLv: 170, ap: 0, spheres: {} },
  };
}

function rikku(): FFXMemberBuild {
  return {
    id: 'rikku',
    name: 'Rikku',
    spriteKey: 'rikku',
    portraitKey: 'rikku',
    stats: { hp: 3000, mp: 130, str: 26, def: 24, mag: 26, mdef: 26, agi: 33, luck: 20, eva: 30, acc: 24, maxHp: 3600, maxMp: 130 },
    hp: 3600,
    mp: 130,
    learnedAbilityIds: ['steal', 'use', 'mix', 'luck', 'flee', 'nab-gil'],
    equipment: {
      weapon: { name: "Rikku's Claw", slots: 4, autoAbilities: ['strength-10', 'strength-5', 'piercing'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Tetra Targe', slots: 4, autoAbilities: ['hp-20', 'stoneproof', 'death-ward'] },
    },
    overdrive: { gauge: 30, mode: 'stoic', unlockedModes: ['stoic', 'comrade'], unlockedOverdriveIds: ['mix'] },
    sphereGrid: { position: 'rikku-sphere-160', activatedNodeIds: [], sLv: 160, ap: 0, spheres: {} },
  };
}

function kimahri(): FFXMemberBuild {
  return {
    id: 'kimahri',
    name: 'Kimahri',
    spriteKey: 'kimahri',
    portraitKey: 'kimahri',
    stats: { hp: 3300, mp: 140, str: 30, def: 28, mag: 26, mdef: 26, agi: 26, luck: 18, eva: 20, acc: 26, maxHp: 3960, maxMp: 140 },
    hp: 3960,
    mp: 140,
    // §4.2 [estimate] — "Seed Cannon / Stone Breath typical" by this point.
    learnedAbilityIds: ['lancet', 'scan', 'jump', 'mighty-guard', 'white-wind', 'seed-cannon', 'stone-breath'],
    equipment: {
      weapon: { name: "Kimahri's Spear", slots: 4, autoAbilities: ['piercing', 'sensor', 'strength-10'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Tetra Armlet', slots: 4, autoAbilities: ['hp-20', 'stoneproof', 'death-ward'] },
    },
    overdrive: { gauge: 40, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['jump', 'mighty-guard', 'white-wind', 'seed-cannon', 'stone-breath'] },
    sphereGrid: { position: 'kimahri-sphere-150', activatedNodeIds: [], sLv: 150, ap: 0, spheres: {} },
  };
}

/**
 * `research/ffx-yunalesca.md` §12, N=300-329 battle-count band
 * [verified: 2 sources] — one bracket up from `./zanarkand.ts`'s N=270-299,
 * appropriate for this later story point [estimate: which bracket applies].
 * This same array is the template the engine mirrors into each
 * possessed-aeon fight — see `./braskas-final-aeon.ts`.
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
    stats: { hp, mp, str, def, mag, mdef, agi, luck: 5, eva, acc, maxHp: hp, maxMp: mp }, // luck [estimate] — not published
    hp,
    mp,
    overdriveGauge,
    abilityIds: [...abilityIds, 'shield', 'boost'],
    overdriveIds,
  };
}

export const dreamsEndBuild: FFXPartyBuild = {
  game: 'ffx',
  members: [tidus(), yuna(), auron(), wakka(), lulu(), rikku(), kimahri()],
  activeSlots: ['tidus', 'yuna', 'auron'], // §1 [verified: 2 sources] — forced at battle start; reserve swapping still works
  reserve: ['wakka', 'lulu', 'kimahri', 'rikku'],
  // §4.4 [verified: 2 sources] — all five mandatory aeons; Anima/Yojimbo/
  // Magus Sisters assumed absent for the default, non-grinding preset (their
  // possessed-aeon data still ships in braskas-final-aeon-abilities.ts).
  aeons: [
    aeon('valefor', 'Valefor', 1465, 46, 30, 44, 42, 46, 21, 28, 15, ['sonic-wings'], ['energy-ray'], 60),
    aeon('ifrit', 'Ifrit', 2007, 44, 31, 57, 41, 41, 18, 14, 15, ['meteor-strike'], ['hellfire'], 55),
    aeon('ixion', 'Ixion', 1981, 48, 32, 50, 41, 58, 16, 16, 16, ['aerospark'], ['thors-hammer'], 50),
    aeon('shiva', 'Shiva', 1760, 51, 30, 31, 46, 47, 32, 44, 15, ['heavenly-strike'], ['diamond-dust'], 55),
    aeon('bahamut', 'Bahamut', 2840, 67, 35, 54, 36, 56, 21, 29, 15, ['impulse'], ['mega-flare'], 70),
  ],
  // §4.4 [estimate] — includes the Candle of Life doom-kill route on Yu Yevon.
  inventory: [
    { itemId: 'hi-potion', count: 20 },
    { itemId: 'x-potion', count: 10 },
    { itemId: 'al-bhed-potion', count: 8 },
    { itemId: 'phoenix-down', count: 10 },
    { itemId: 'mega-phoenix', count: 2 },
    { itemId: 'remedy', count: 6 },
    { itemId: 'soft', count: 4 },
    { itemId: 'holy-water', count: 4 },
    { itemId: 'ether', count: 3 },
    { itemId: 'turbo-ether', count: 2 },
    { itemId: 'elixir', count: 1 },
    { itemId: 'light-curtain', count: 2 },
    { itemId: 'lunar-curtain', count: 2 },
    { itemId: 'stamina-tablet', count: 2 },
    { itemId: 'candle-of-life', count: 1 }, // Doom -> Yu Yevon dies in exactly 3 turns
  ],
  gil: 50000, // §4.4 [estimate]
  sphereInventory: {},
};

export default dreamsEndBuild;
