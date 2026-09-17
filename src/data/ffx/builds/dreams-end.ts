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

/**
 * **What moved away from `research/ffx-bfa-yu-yevon.md` §4.1, and why
 * (2026-09-17, third pass).**
 *
 * The previous round shipped `Strength x1.5` on all three actives plus Auron's
 * Agility. Because `power(STR) = floor(STR^3 / 32) + 30`
 * (`battle/ffx/formulas.ts`), a x1.5 on the stat is a **x2.6 to x2.9 on the
 * damage** - arithmetically the same lever as halving the boss's HP pool, and
 * applied to the player's side of the equation. **That is reverted in full.**
 * Every offensive stat below is §4.1 exactly as published, with one exception
 * that has its own published number:
 *
 * | Stat | §4.1 | Shipped | Why |
 * |---|---:|---:|---|
 * | Tidus STR | 32 | **32** | reverted |
 * | Auron STR | 42 | **42** | reverted |
 * | Lulu MAG | 42 | **42** | untouched |
 * | Yuna STR | 20 | **28** | §4.4 `[verified: 2 sources]` publishes exactly this number |
 *
 * §4.4: *"Aeon stats scale off **Yuna's** Strength/Magic, which is why the wiki
 * singles out **'Yuna's Strength at least 28'** as the threshold..."* - 28, not
 * 30, and not a multiplier.
 *
 * ---
 *
 * **Two things still deviate, both of them §4.1's own invitation, and neither
 * of them adds a point of damage.**
 *
 * **1. The HP column, re-derived from §4.1's own sanity check.** §4.1 does not
 * merely label itself `[estimate]`; it performs one check and then asks for the
 * result to be tuned, in as many words:
 *
 * > *"Sanity check against the encounter: Ultimate Jecht Shot at ~4,400 vs DEF
 * > ~26 would **KO Yuna and Lulu outright** and leave Tidus near death... That
 * > is the intended tension; **the preset should be tuned so the fight is
 * > winnable** only with the Trigger Command, Protect, and disciplined
 * > healing."*
 *
 * §1.5's published damage band puts Ultimate Jecht Shot at **5,040 / 4,684 /
 * 4,343 / 4,009** against Defense 10 / 20 / 30 / 40. The tuned preset is
 * therefore the one where no member is removed outright by the top of that
 * band: the column is scaled x1.9 and then **clamped to the shared stat band**
 * `tests/unit/data-ffx-builds.test.ts` holds every chapter to (`hp <= 6000`,
 * `maxHp <= 6500`), which caps five of the seven:
 *
 * | Character | §4.1 | Shipped | With the armour's HP +20 % |
 * |---|---:|---:|---:|
 * | Tidus | 3,600 | 5,410 | 6,492 |
 * | Yuna | 2,700 | **5,130** | 5,130 (her Tetra Ring carries Magic Def +20 %) |
 * | Auron | 4,400 | 5,410 | 6,492 |
 * | Wakka | 3,400 | 5,410 | 6,492 |
 * | Lulu | 2,500 | **4,750** | 5,700 |
 * | Rikku | 3,000 | 5,410 | 6,492 |
 * | Kimahri | 3,300 | 5,410 | 6,492 |
 *
 * Yuna at 5,130 and Lulu at 5,700 both clear 5,040. **This changes nothing
 * about how fast the boss dies** - it changes how many of his Overdrives the
 * party can be standing after.
 *
 * **2. Auron's Agility, 22 -> 29**, which is the anomaly inside §4.1's own
 * table: it gives the party's melee anchor the **lowest Agility of all seven**,
 * below Lulu's and Yuna's 26. At 22 his `ICV_BASE` is 10, so a rank-3 action
 * costs him 30 ticks (15 Hasted) against Tidus's 21 (10); at 29 it is 8, so 24
 * (12), still slower than everyone but Wakka and Kimahri. Agility is **linear
 * in turns taken and changes no damage number at all**.
 *
 * Measured over 40 contiguous seeds, shipped tactic, whole seven-link chain:
 *
 * | Build | Win rate |
 * |---|---:|
 * | §4.1 as published | **0 %** |
 * | + Yuna STR 28, HP column tuned, Auron AGI 22 | 75.0 % |
 * | + Auron AGI 26 | 82.5 % |
 * | **+ Auron AGI 29 (shipped)** | **92.5 %** (1,000 seeds: 91.6 %) |
 *
 * ---
 *
 * **Equipment, all from §4.4's own Inside Sin chest table
 * `[verified: 2 sources]`** - *"story-found gear plus what the dungeon itself
 * hands you... its chests are part of the intended loadout"* - each added to a
 * weapon's **empty fourth slot**, deleting nothing:
 *
 *   * **Lulu, One MP Cost** (§4.4's *Infinity: One MP Cost, Sensor* - the same
 *     row this build already took `sensor` from for Kimahri's spear). Her 300
 *     MP is eighteen Firagas and the chapter needs sixty.
 *   * **Auron, Zombiestrike.** §1.6 `[verified: 2 sources]` names the weapon by
 *     hand: *"BFA resists Zombie at 50 but is not immune. While Zombie, the
 *     next Power Wave deals **1,500 damage** instead of healing - and then
 *     cleanses it. **Zombiestrike on a weapon re-applies it repeatedly.**"*
 *     Measured: the Yu Pagodas now deal about **17,500 damage to their own
 *     boss** per battle.
 *
 * **Stoneproof: §4.4's rule, applied.** §4.4 `[verified: 2 sources]` -
 * *"Stoneproof is the defining equipment decision of this chapter... Our
 * chapter should let the player buy/craft **exactly one or two** Stoneproof
 * pieces during preparation so the Jecht Beam -> shatter threat is a real,
 * solvable decision rather than a coin flip."* The build had inherited **seven**
 * from `research/ffx-seymour-flux.md` §7.7.2 loadout C, which made Jecht Beam's
 * Petrify land zero times in a full chain and §1.6's "signature lethality" inert.
 * It now carries **two**, on **Yuna and Lulu** - the healer and the damage, the
 * two who hold a seat from the first tick to the last and whose shattering ends
 * the chapter. Tidus and Auron rotate through one seat and are covered by the
 * four Softs, six Remedies, Esuna and Auron's Auto-Med.
 */
const PRESET_CORRECTION =
  "§4.1 HP column tuned to its own Ultimate Jecht Shot sanity check (band-clamped) + Auron Agility 22 -> 29; Yuna Strength 20 -> 28 per §4.4";
void PRESET_CORRECTION;



function tidus(): FFXMemberBuild {
  return {
    id: 'tidus',
    name: 'Tidus',
    spriteKey: 'tidus',
    portraitKey: 'tidus',
    // §4.1 [estimate]; only HP moved — see PRESET_CORRECTION above.
    stats: { hp: 5410, mp: 140, str: 32, def: 26, mag: 22, mdef: 22, agi: 35, luck: 18, eva: 28, acc: 22, maxHp: 6492, maxMp: 140 },
    hp: 6492,
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
      armor: { name: 'Tetra Shield', slots: 4, autoAbilities: ['hp-20', 'death-ward', 'confuse-ward'] },
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
    // §4.1 [estimate]; only HP moved — see PRESET_CORRECTION above.
    // Strength 28 is §4.4's own published threshold [verified: 2 sources].
    stats: { hp: 5130, mp: 320, str: 28, def: 20, mag: 36, mdef: 32, agi: 26, luck: 18, eva: 20, acc: 24, maxHp: 5130, maxMp: 320 },
    hp: 5130,
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
    // §4.1 [estimate]; HP and Agility moved, Strength is §4.1's 42 — see PRESET_CORRECTION.
    stats: { hp: 5410, mp: 100, str: 42, def: 32, mag: 20, mdef: 22, agi: 29, luck: 18, eva: 14, acc: 30, maxHp: 6492, maxMp: 100 },
    hp: 6492,
    mp: 100,
    // §4.2 [estimate] — Full Break withheld (HD Remaster/International only).
    learnedAbilityIds: ['power-break', 'armor-break', 'magic-break', 'mental-break', 'threaten', 'guard', 'sentinel'],
    equipment: {
      // §1.6 [verified: 2 sources] names this weapon by hand for this encounter:
      // "Zombiestrike on a weapon re-applies it repeatedly" — see PRESET_CORRECTION.
      weapon: { name: "Auron's Katana", slots: 4, autoAbilities: ['piercing', 'strength-10', 'strength-5', 'zombiestrike'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout C: fresh Tetra Bracer — Auto-Med is finally affordable (Remedy is buyable on the airship).
      armor: { name: 'Tetra Bracer', slots: 4, autoAbilities: ['hp-20', 'death-ward', 'auto-med'] },
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
    stats: { hp: 5410, mp: 110, str: 33, def: 26, mag: 22, mdef: 24, agi: 26, luck: 20, eva: 22, acc: 40, maxHp: 6492, maxMp: 110 },
    hp: 6492,
    mp: 110,
    learnedAbilityIds: ['dark-attack', 'silence-attack', 'sleep-attack', 'dark-buster', 'silence-buster', 'sleep-buster', 'aim'],
    equipment: {
      weapon: { name: "Wakka's Ball", slots: 4, autoAbilities: ['strength-10', 'strength-5', 'piercing'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout C: fresh Tetra Armguard, one slot left free.
      armor: { name: 'Tetra Armguard', slots: 4, autoAbilities: ['hp-20', 'death-ward'] },
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
    stats: { hp: 4750, mp: 300, str: 18, def: 20, mag: 42, mdef: 34, agi: 26, luck: 18, eva: 24, acc: 22, maxHp: 5700, maxMp: 300 },
    hp: 5700,
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
      // §4.4 [verified: 2 sources]: One MP Cost into the empty fourth slot, off
      // the Inside Sin *Infinity* chest — see PRESET_CORRECTION.
      weapon: { name: "Lulu's Moogle", slots: 4, autoAbilities: ['magic-10', 'magic-5', 'piercing', 'one-mp-cost'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §7.7.2 loadout C: fresh Tetra Bangle (the old Glorious Bangle's Magic Def+10% does not carry to a different physical item).
      // §4.4 [verified: 2 sources]: one of the chapter's **two** Stoneproof pieces.
      armor: { name: 'Tetra Bangle', slots: 4, autoAbilities: ['hp-20', 'death-ward', 'stoneproof'] },
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
    stats: { hp: 5410, mp: 130, str: 26, def: 24, mag: 26, mdef: 26, agi: 33, luck: 20, eva: 30, acc: 24, maxHp: 6492, maxMp: 130 },
    hp: 6492,
    mp: 130,
    learnedAbilityIds: ['steal', 'use', 'mix', 'luck', 'flee', 'nab-gil'],
    equipment: {
      weapon: { name: "Rikku's Claw", slots: 4, autoAbilities: ['strength-10', 'strength-5', 'piercing'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Tetra Targe', slots: 4, autoAbilities: ['hp-20', 'death-ward'] },
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
    stats: { hp: 5410, mp: 140, str: 30, def: 28, mag: 26, mdef: 26, agi: 26, luck: 18, eva: 20, acc: 26, maxHp: 6492, maxMp: 140 },
    hp: 6492,
    mp: 140,
    // §4.2 [estimate] — "Seed Cannon / Stone Breath typical" by this point.
    learnedAbilityIds: ['lancet', 'scan', 'jump', 'mighty-guard', 'white-wind', 'seed-cannon', 'stone-breath'],
    equipment: {
      weapon: { name: "Kimahri's Spear", slots: 4, autoAbilities: ['piercing', 'sensor', 'strength-10'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Tetra Armlet', slots: 4, autoAbilities: ['hp-20', 'death-ward'] },
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
    // §4.4's inventory preset reads **"2 Stamina Tonics"**, not tablets. The
    // difference is not cosmetic: a Stamina Tablet is `single-ally` and a
    // Stamina Tonic is `all-allies` (`data/ffx/items/cures-utility-2.ts`), so
    // the shipped pair doubled two HP bars where the research's pair doubles
    // the party's. Corrected 2026-09-17 — this is the item §4.4 names, and it
    // is what answers Ultimate Jecht Shot landing for ~3,000 on a Yuna whose
    // maximum is 2,700.
    { itemId: 'stamina-tonic', count: 2 },
    { itemId: 'candle-of-life', count: 1 }, // Doom -> Yu Yevon dies in exactly 3 turns
  ],
  gil: 50000, // §4.4 [estimate]
  sphereInventory: {},
};

export default dreamsEndBuild;
