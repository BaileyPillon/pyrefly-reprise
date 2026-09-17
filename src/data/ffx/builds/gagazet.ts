/**
 * Chapter 1 party build — Mt. Gagazet, the Prominence (Seymour Flux).
 *
 * Build point: post-Ronso, pre-summit. Source:
 * `research/ffx-seymour-flux.md` §7 (the authored "average non-grinding
 * player" preset) and §7.7/§7.7.1/§7.7.2 (the equipment model and the named
 * Mt. Gagazet loadout). Every number in this file is `[estimate]` in the
 * research's own sense — an authored story-progress snapshot, not a
 * measured population average — with the underlying components (ability
 * names, equipment slot counts/abilities, catalyst costs, base stat
 * formulas) independently `[verified]` or `[decompiled]`. See §7's opening
 * note for the full methodology.
 *
 * Equipment model note [§7.7.1]: FFX weapons/armour grant **no stats**,
 * only auto-ability slots; the only auto-abilities that change a
 * `StatBlock` field at all are `hp-N`/`mp-N` (they raise `maxHp`/`maxMp`).
 * Every other auto-ability (Strength+%, Magic Def+%, ...) is a damage-time
 * multiplier the engine applies at steps 8/9 of the modifier order, not a
 * stat change — so `stats.str`/`stats.mdef`/etc. below are the character's
 * raw Sphere Grid values, unmodified by gear.
 *
 * Sphere Grid note: §7.3 gives a *range* of Sphere Levels spent (~28-40)
 * per character but not an exact node path, and no source reconstructs one
 * for this build point. `sphereGrid.position`/`activatedNodeIds`/`spheres`
 * below are therefore left minimal (`[estimate]`, flagged inline) — the
 * headline numbers that matter for combat (stats, abilities, Overdrive
 * gauges) are fully sourced; exact grid traversal is not.
 *
 * The pre-battle Talk trigger (Kimahri +10 STR, Yuna +10 MDEF, §4.7) is a
 * `TriggerCommand`, not a build stat — deliberately not baked in here.
 */

import type { AeonBuild, FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';

/** §7.7.1 — every character's default weapon carries this. */
const BASE_WEAPON_BONUS_CRIT = 3;

function tidus(): FFXMemberBuild {
  return {
    id: 'tidus',
    name: 'Tidus',
    spriteKey: 'tidus',
    portraitKey: 'tidus',
    // §7.3 [estimate] — midpoint of the published range.
    stats: {
      hp: 2200,
      mp: 115,
      str: 31,
      def: 20,
      mag: 16,
      mdef: 18,
      agi: 30,
      luck: 18,
      eva: 22,
      acc: 24,
      maxHp: 2420, // §7.7.2 [verified: 2 sources] Glorious Shield's HP+10% -> hp * 1.10
      maxMp: 115,
    },
    hp: 2420,
    mp: 115,
    // §7.4 [estimate] — no Quick Hit (end of his own grid section).
    learnedAbilityIds: ['cheer', 'provoke', 'haste', 'hastega', 'slow', 'delay-attack', 'delay-buster', 'flee', 'talk'],
    equipment: {
      weapon: { name: 'Baroque Sword', slots: 3, autoAbilities: ['strength-10'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Glorious Shield', slots: 3, autoAbilities: ['hp-10', 'zombie-ward'] },
    },
    overdrive: {
      gauge: 50, // §7.9.2 [estimate] ~5 Attacks landed en route (Warrior, 10%/hit)
      mode: 'warrior',
      unlockedModes: ['stoic', 'warrior'],
      unlockedOverdriveIds: ['spiral-cut'],
    },
    sphereGrid: {
      position: 'tidus-sphere-30', // [estimate] — exact node id not sourced; ~30 S.Lv into his own path
      activatedNodeIds: [], // [estimate] — not reconstructed; see file header
      sLv: 30, // §7.3 [estimate] within the 28-40 band
      ap: 0,
      spheres: {},
    },
  };
}

function yuna(): FFXMemberBuild {
  return {
    id: 'yuna',
    name: 'Yuna',
    spriteKey: 'yuna',
    portraitKey: 'yuna',
    stats: {
      hp: 1500,
      mp: 270,
      str: 15,
      def: 13,
      mag: 37,
      mdef: 39,
      agi: 15,
      luck: 17,
      eva: 33,
      acc: 11,
      maxHp: 1500, // §7.7.2 — Blessed Ring has no HP auto-ability
      maxMp: 270,
    },
    hp: 1500,
    mp: 270,
    // §7.4 [estimate] — no Full-Life (Rikku's grid section) or Auto-Life (late).
    learnedAbilityIds: [
      'cure',
      'cura',
      'curaga',
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
      'reflect',
      'dispel',
      'haste',
    ],
    equipment: {
      weapon: { name: "Yuna's Staff", slots: 1, autoAbilities: [], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Blessed Ring', slots: 4, autoAbilities: ['magic-def-10', 'magic-def-5', 'zombie-ward'] },
    },
    overdrive: {
      gauge: 40, // §7.9.2 [estimate] ~2.5 full-bar heals' worth of curing en route
      mode: 'healer',
      unlockedModes: ['stoic', 'healer'],
      unlockedOverdriveIds: ['grand-summon'],
    },
    sphereGrid: {
      position: 'yuna-sphere-32',
      activatedNodeIds: [],
      sLv: 32,
      ap: 0,
      spheres: {},
    },
  };
}

function kimahri(): FFXMemberBuild {
  return {
    id: 'kimahri',
    name: 'Kimahri',
    spriteKey: 'kimahri',
    portraitKey: 'kimahri',
    stats: {
      hp: 2100,
      mp: 130,
      str: 26,
      def: 22,
      mag: 22,
      mdef: 16,
      agi: 18,
      luck: 18,
      eva: 14,
      acc: 14,
      maxHp: 2310, // §7.7.2 — Glorious Armlet HP+10%
      maxMp: 130,
    },
    hp: 2310,
    mp: 130,
    // §6.1, §7.4 [verified: 2 sources] — Mighty Guard and White Wind newly
    // learnable from Biran/Yenke Ronso on this very mountain via Lancet.
    learnedAbilityIds: ['lancet', 'jump', 'mighty-guard', 'white-wind', 'self-destruct'],
    equipment: {
      weapon: { name: "Kimahri's Spear", slots: 2, autoAbilities: ['piercing', 'sensor'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Glorious Armlet', slots: 3, autoAbilities: ['hp-10'] },
    },
    overdrive: {
      // §7.9.2 [single source, RULE not an estimate]: "If Kimahri learns a
      // new Overdrive using Lancet, his Overdrive meter automatically
      // fills." He learns Mighty Guard from Biran Ronso minutes before this
      // fight, so the canonical route arrives with a full gauge.
      gauge: 100,
      mode: 'stoic',
      unlockedModes: ['stoic'],
      unlockedOverdriveIds: ['jump', 'mighty-guard', 'white-wind'],
    },
    sphereGrid: {
      position: 'kimahri-sphere-25', // routed toward the Auron/Tidus junction, per §7.3's recommendation
      activatedNodeIds: [],
      sLv: 25,
      ap: 0,
      spheres: {},
    },
  };
}

function auron(): FFXMemberBuild {
  return {
    id: 'auron',
    name: 'Auron',
    spriteKey: 'auron',
    portraitKey: 'auron',
    stats: {
      hp: 3100,
      mp: 75,
      str: 40,
      def: 28,
      mag: 11,
      mdef: 14,
      agi: 15,
      luck: 17,
      eva: 11,
      acc: 11,
      maxHp: 3410, // §7.7.2 — Blessed Bracer HP+10%
      maxMp: 75,
    },
    hp: 3410,
    mp: 75,
    learnedAbilityIds: ['power-break', 'armor-break', 'magic-break', 'mental-break', 'threaten', 'guard', 'sentinel'],
    equipment: {
      weapon: { name: "Auron's Katana", slots: 1, autoAbilities: ['piercing'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Blessed Bracer', slots: 4, autoAbilities: ['hp-10', 'zombie-ward'] },
    },
    overdrive: {
      // §7.9.2 [estimate, derived from §7.9.1's extracted formulas]: "Auron |
      // Stoic | **70%** | Auron eats the hits: ~2.3x his own max HP in absorbed
      // damage (70 / 30). Highest gauge in the party, which is correct — he is
      // the one the preset expects to open with Dragon Fang."
      //
      // Corrected from 0 on 2026-09-17. The old value came with the note
      // "reserve member — untouched by the approach fights", which is a
      // reasonable-sounding inference that §7.9.2 contradicts by name: its
      // table is per-character and does not distinguish the active three from
      // the bench, and character gauges **persist between battles** (§7.9.2's
      // opening note), so a benched Auron carries in whatever he walked out of
      // the Ronso duel with.
      gauge: 70,
      mode: 'stoic',
      unlockedModes: ['stoic'],
      unlockedOverdriveIds: ['dragon-fang'],
    },
    sphereGrid: { position: 'auron-sphere-35', activatedNodeIds: [], sLv: 35, ap: 0, spheres: {} },
  };
}

function wakka(): FFXMemberBuild {
  return {
    id: 'wakka',
    name: 'Wakka',
    spriteKey: 'wakka',
    portraitKey: 'wakka',
    stats: {
      hp: 2300,
      mp: 90,
      str: 29,
      def: 20,
      mag: 17,
      mdef: 16,
      agi: 17,
      luck: 19,
      eva: 13,
      acc: 46,
      maxHp: 2530, // §7.7.2 — Glorious Armguard HP+10%
      maxMp: 90,
    },
    hp: 2530,
    mp: 90,
    // §7.4 [estimate] — Triple Foul borderline, omitted; Drain not by default.
    learnedAbilityIds: ['dark-attack', 'silence-attack', 'sleep-attack', 'dark-buster', 'silence-buster', 'sleep-buster', 'aim'],
    equipment: {
      weapon: { name: "Wakka's Ball", slots: 1, autoAbilities: [], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Glorious Armguard', slots: 3, autoAbilities: ['hp-10'] },
    },
    // §7.9.2 [estimate]: "Wakka | Warrior | **30%** | ~3 Attacks; Wakka is the
    // likeliest bench-warmer on a Ronso-heavy stretch." Corrected from 0 —
    // see the note on Auron's gauge above.
    overdrive: { gauge: 30, mode: 'warrior', unlockedModes: ['stoic', 'warrior'], unlockedOverdriveIds: ['element-reels'] },
    sphereGrid: { position: 'wakka-sphere-30', activatedNodeIds: [], sLv: 30, ap: 0, spheres: {} },
  };
}

function lulu(): FFXMemberBuild {
  return {
    id: 'lulu',
    name: 'Lulu',
    spriteKey: 'lulu',
    portraitKey: 'lulu',
    stats: {
      hp: 1250,
      mp: 290,
      str: 13,
      def: 15,
      mag: 43,
      mdef: 45,
      agi: 13,
      luck: 17,
      eva: 45,
      acc: 11,
      maxHp: 1375, // §7.7.2 — Glorious Bangle HP+10%
      maxMp: 290,
    },
    hp: 1375,
    mp: 290,
    // §7.4 [estimate] — -aga tier and Demi/Flare/Ultima not by default.
    learnedAbilityIds: ['fire', 'fira', 'blizzard', 'blizzara', 'thunder', 'thundara', 'water', 'watera', 'bio', 'focus', 'scan'],
    equipment: {
      weapon: { name: "Lulu's Moogle", slots: 1, autoAbilities: ['magic-10'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Glorious Bangle', slots: 3, autoAbilities: ['hp-10', 'magic-def-10'] },
    },
    // §7.9.2 [estimate]: "Lulu | Stoic | **45%** | 1.5x her (low) max HP
    // absorbed — low HP means Stoic fills fast on her." Corrected from 0 — see
    // the note on Auron's gauge above.
    overdrive: { gauge: 45, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['fury'] },
    sphereGrid: { position: 'lulu-sphere-30', activatedNodeIds: [], sLv: 30, ap: 0, spheres: {} },
  };
}

function rikku(): FFXMemberBuild {
  return {
    id: 'rikku',
    name: 'Rikku',
    spriteKey: 'rikku',
    portraitKey: 'rikku',
    stats: {
      hp: 1400,
      mp: 115,
      str: 21,
      def: 15,
      mag: 17,
      mdef: 15,
      agi: 32,
      luck: 18,
      eva: 13,
      acc: 13,
      maxHp: 1540, // §7.7.2 — Glorious Targe HP+10%
      maxMp: 115,
    },
    hp: 1540,
    mp: 115,
    learnedAbilityIds: ['steal', 'use', 'mix', 'luck', 'flee'],
    equipment: {
      weapon: { name: "Rikku's Claw", slots: 1, autoAbilities: [], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Glorious Targe', slots: 3, autoAbilities: ['hp-10'] },
    },
    // §7.9.2 [estimate]: "Rikku | Comrade | **35%** | ~1.75 ally-HP-bars of
    // party damage watched from the bench." Corrected from 0 — see the note on
    // Auron's gauge above.
    overdrive: { gauge: 35, mode: 'comrade', unlockedModes: ['stoic', 'comrade'], unlockedOverdriveIds: ['mix'] },
    // Rikku starts with an S.Lv offset (§7.2 decompiled: +25); folded into the higher starting sLv here.
    sphereGrid: { position: 'rikku-sphere-42', activatedNodeIds: [], sLv: 42, ap: 0, spheres: {} },
  };
}

/**
 * §7.3, §7.6, §7.7.1 [estimate scaling over a verified anchor]. §7.3's own
 * aeon row is a single flat "4,000-7,000 HP" band for all five aeons,
 * authored without the Ultimania battle-count cross-reference that
 * `research/ffx-yunalesca.md` §12 later applies — cross-checking the two
 * documents shows §7.3's band is **higher** than Yunalesca §12's decoded
 * N=270-299 table (1,341-2,542 HP) despite Mt. Gagazet coming chronologically
 * *earlier* in the game, which cannot be right (aeon stats only grow with
 * battle count). This file resolves the conflict in favour of the
 * Ultimania-anchored source: each aeon's Gagazet stats are the §12
 * N=270-299 figure scaled to roughly an early-game battle count (~0.55x HP/MP,
 * ~0.8x everything else, rounded), which keeps every stat monotonically
 * increasing from Mt. Gagazet -> Zanarkand Dome -> Dream's End as the real
 * growth curve requires. Luck has no published figure at any story point
 * and is held at a flat `[estimate]`.
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
    // §7.9.2, "Aeon gauges — the part §7.9 omitted entirely" [estimate for the
    // six values; the mechanisms verified: 2 sources]. Corrected from a flat 0
    // on 2026-09-17. The old value's note — "Seymour Banishes a summon after
    // one turn, so the aeon list mostly matters for that beat" — is the exact
    // reading §7.9.2 exists to overturn: because Banish leaves the aeon
    // **exactly one turn**, a full gauge is the difference between a summon
    // that Overdrives and a summon that does nothing but stall, and §6 row 15
    // ("summon every aeon with a full Overdrive gauge") is one of the three
    // named win conditions. §7.9.2 also fixes the budget the encounter is to
    // be balanced against — "2 full aeon Overdrives + 1 full character
    // Overdrive (Kimahri's Mighty Guard) + ~3 more aeon Overdrives reachable
    // inside the fight" — which a party of five empty aeons cannot produce.
    // Aeon gauges persist between battles and reset only when that aeon is
    // defeated (§7.9.2 opening note).
    overdriveGauge,
    abilityIds: [...abilityIds, 'shield', 'boost'],
    overdriveIds,
  };
}

export const gagazetBuild: FFXPartyBuild = {
  game: 'ffx',
  members: [tidus(), yuna(), kimahri(), auron(), wakka(), lulu(), rikku()],
  activeSlots: ['tidus', 'yuna', 'kimahri'],
  reserve: ['auron', 'wakka', 'lulu', 'rikku'],
  // §7.6 [verified: 2 sources] — all five mandatory aeons available; Yojimbo/Anima/Magus Sisters assumed not yet obtained.
  aeons: [
    aeon('valefor', 'Valefor', 738, 24, 22, 31, 34, 34, 15, 22, 12, ['sonic-wings'], ['energy-ray'], 100), // §7.9.2 "the oldest aeon, used casually since Besaid... Full by default."
    aeon('ifrit', 'Ifrit', 988, 23, 23, 38, 33, 30, 14, 11, 12, ['meteor-strike'], ['hellfire'], 75), // §7.9.2 "used regularly on the Gagazet approach"
    aeon('ixion', 'Ixion', 983, 25, 24, 34, 32, 42, 12, 12, 13, ['aerospark'], ['thors-hammer'], 60), // §7.9.2
    aeon('shiva', 'Shiva', 878, 26, 22, 22, 37, 34, 22, 35, 12, ['heavenly-strike'], ['diamond-dust'], 50), // §7.9.2
    aeon('bahamut', 'Bahamut', 1398, 35, 26, 35, 29, 41, 15, 23, 12, ['impulse'], ['mega-flare'], 100), // §7.9.2 "authored as full on purpose" — the only native Break Damage Limit in the chapter
  ],
  // §7.8 [estimate] — typical inventory, includes the two Mega-Potions found on the mountain.
  inventory: [
    { itemId: 'potion', count: 45 },
    { itemId: 'hi-potion', count: 30 },
    { itemId: 'x-potion', count: 4 },
    { itemId: 'mega-potion', count: 4 },
    { itemId: 'phoenix-down', count: 30 },
    { itemId: 'mega-phoenix', count: 2 },
    { itemId: 'holy-water', count: 7 },
    { itemId: 'remedy', count: 3 },
    { itemId: 'soft', count: 10 },
    { itemId: 'antidote', count: 10 },
    { itemId: 'eye-drops', count: 10 },
    { itemId: 'echo-screen', count: 10 },
    { itemId: 'ether', count: 5 },
    { itemId: 'turbo-ether', count: 1 },
    { itemId: 'elixir', count: 2 },
    { itemId: 'al-bhed-potion', count: 17 },
    { itemId: 'grenade', count: 17 },
    { itemId: 'frag-grenade', count: 4 },
    { itemId: 'fire-gem', count: 10 },
    { itemId: 'ice-gem', count: 10 },
    { itemId: 'lightning-gem', count: 10 },
    { itemId: 'water-gem', count: 10 },
    { itemId: 'poison-fang', count: 5 },
    { itemId: 'light-curtain', count: 6 },
    { itemId: 'lunar-curtain', count: 6 },
    { itemId: 'star-curtain', count: 6 },
    { itemId: 'healing-water', count: 4 },
  ],
  gil: 27000, // §7.8 [estimate] midpoint of 15,000-40,000, includes the 20,000 found on the mountain
  sphereInventory: {}, // [estimate] — assumed fully spent building the stat blocks above
};

export default gagazetBuild;
