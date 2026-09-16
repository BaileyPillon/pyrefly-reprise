/**
 * Chapter 4 party build — Bevelle Underground (FFX-2 Bahamut).
 *
 * Build point: **Chapter 2, Limbo** in story terms — three independent sources
 * put the encounter there, against ARCHITECTURE.md's single "Ch. 3" line
 * [writing-bible §0.3]. The chapter *label* stays 4; write the build and the
 * dialogue to Chapter 2 knowledge. Levels 23/24/25 follow `ffx2-bahamut.md`
 * §4.1's own worked example ("Paine 25 / Rikku 24 / Yuna 23"), reflecting
 * Paine's faster EXP curve.
 *
 * **The single most important stat fact**: a girl's combat stats are a
 * function of (dressphere x level) only [ffx2-combat-core §5.1]. So the build
 * is `level + dressphere + garment grid + accessories + learned abilities`;
 * the engine derives the numbers from `src/data/ffx2/dresspheres/**`.
 *
 * **Design constraint from §1.2**: Bahamut's Def 160 / MDef 10 makes raw
 * physical attacks near-worthless. The build routes around it two ways
 * without pre-selecting a "solved" party: Rikku already knows **Darkness**
 * (ignores Defense entirely, `x2-dark-knight-darkness`, learned at 0 AP) and
 * Yuna already knows **Shell** (`x2-white-mage-shell`, halves both Impulse
 * and Mega Flare — "Essential", `ffx2-bahamut.md` §3.3, §2.4). Thief's
 * Evasion 19 (Rikku's `owned` list includes Thief) is the only dressphere
 * that meaningfully dodges his physical Attack [§1.1].
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';

export const bevelleBuild: FFX2PartyBuild = {
  game: 'ffx2',
  members: [
    {
      id: 'yuna',
      name: 'Yuna',
      spriteKey: 'yuna-white-mage',
      portraitKey: 'yuna',
      level: 23, // ffx2-bahamut.md §4.1 — band 20-28
      currentDressphere: 'white-mage',
      // §4.3 ownership table: Gunner/Thief/Warrior (defaults) + Black Mage/White Mage/Songstress = Yes;
      // Dark Knight = Yes (this dungeon); Gun Mage/Alchemist = Likely; Floral Fallal = Likely (Djose Highroad).
      owned: ['gunner', 'thief', 'warrior', 'black-mage', 'white-mage', 'songstress', 'dark-knight', 'gun-mage', 'alchemist', 'floral-fallal'],
      garmentGrid: {
        id: 'protection-halo', // Def +5, MDef +5 equip — Ch.1, Besaid [ffx2-combat-core §4.3]
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {
        // ~190 AP invested [§6.7 "150-400 AP per dressphere" for a Ch.2/3 party] — the White Mage substitute
        // for the "Alchemist + Dark Knight + Warrior" canonical party [ffx2-bahamut §3.1].
        'white-mage': {
          learned: [
            'x2-white-mage-cure', 'x2-white-mage-shell', 'x2-white-mage-protect',
            'x2-white-mage-esuna', 'x2-white-mage-cura', 'x2-white-mage-vigor', 'x2-white-mage-dispel',
          ],
          ap: 40, // banked toward Curaga (80 AP)
        },
      },
      accessories: ['circlet', 'mythril-gloves'], // Mag+10/MDef+10, Def+20
    },
    {
      id: 'rikku',
      name: 'Rikku',
      spriteKey: 'rikku-dark-knight',
      portraitKey: 'rikku',
      level: 24,
      currentDressphere: 'dark-knight',
      owned: ['gunner', 'thief', 'warrior', 'black-mage', 'white-mage', 'songstress', 'dark-knight', 'gun-mage', 'alchemist', 'machina-maw'],
      garmentGrid: {
        id: 'hour-of-need', // Def +10, MDef +10 — Ch.2, beat Ormi at Bikanel Oasis [ffx2-combat-core §4.3]
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {
        // ~120 AP invested. Darkness is initial (0 AP) and is the whole point of this loadout
        // [ffx2-bahamut §3.2] — ignores Defense, long range, all-enemy, costs HP not MP.
        'dark-knight': {
          learned: [
            'x2-dark-knight-darkness', 'x2-dark-knight-charon', 'x2-dark-knight-drain',
            'x2-dark-knight-demi', 'x2-dark-knight-poisonproof', 'x2-dark-knight-stoneproof',
          ],
          ap: 20, // banked toward Curseproof (30 AP)
        },
      },
      accessories: ['muscle-belt', 'iron-bangle'], // Str+10/Def+10, max HP +20% — more room to pay Darkness's HP cost
    },
    {
      id: 'paine',
      name: 'Paine',
      spriteKey: 'paine-warrior',
      portraitKey: 'paine',
      level: 25,
      currentDressphere: 'warrior',
      owned: ['gunner', 'thief', 'warrior', 'black-mage', 'white-mage', 'songstress', 'dark-knight', 'gun-mage', 'alchemist'],
      garmentGrid: {
        id: 'stonehewn', // Def +10 equip, +15 per gate — Ch.2, beat Logos on Gagazet [ffx2-combat-core §4.3]
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {
        // ~140 AP invested — all four Breaks plus Sentinel. Ranked per ffx2-bahamut.md §3.3: Magic Break is
        // the highest-value (caps Mega Flare at x0.167), Power Break the lowest (neutralises the weakest threat).
        warrior: {
          learned: [
            'x2-warrior-power-break', 'x2-warrior-armor-break', 'x2-warrior-magic-break',
            'x2-warrior-mental-break', 'x2-warrior-sentinel',
          ],
          ap: 30, // banked toward Flametongue or Assault
        },
      },
      accessories: ['power-wrist', 'titanium-bangle'], // Str+20, max HP +40%
    },
  ],
  // §4.7 [estimate] — a defensible Chapter 2 baseline; no source records a canonical inventory snapshot.
  // Lunar Curtain (Shell) and Light Curtain (Protect) back up the White Mage's own spells [ffx2-bahamut §3.3].
  inventory: [
    { itemId: 'x2-potion', count: 60 },
    { itemId: 'x2-hi-potion', count: 20 },
    { itemId: 'x2-phoenix-down', count: 20 },
    { itemId: 'x2-ether', count: 10 },
    { itemId: 'x2-remedy', count: 8 },
    { itemId: 'x2-holy-water', count: 5 },
    { itemId: 'x2-lunar-curtain', count: 4 },
    { itemId: 'x2-light-curtain', count: 3 },
  ],
  gil: 10000,
};

export default bevelleBuild;
