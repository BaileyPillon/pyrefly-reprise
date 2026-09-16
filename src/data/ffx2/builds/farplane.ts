/**
 * Chapter 5 party build — Heart of the Farplane (Vegnagun chain -> Shuyin).
 *
 * Build point: Chapter 5, level band 43-52 (~48)
 * [ffx2-vegnagun-shuyin §6; ffx2-combat-core §5.1b]. Levels 46/48/50 keep
 * Paine ahead of Rikku ahead of Yuna, matching their EXP curves.
 *
 * **The canonical clear** [ffx2-vegnagun-shuyin §7.1, verified: 2 sources]:
 * two Dark Knights spamming **Darkness** (ignores Defense — Shuyin's Def 132
 * and the Right Redoubt's Def 133 stop mattering; long range — reaches the
 * Nodes; all-enemy — one action hits Head + both Redoubts, or Core + both
 * Bulwarks), one White Mage or Alchemist healing. Rikku and Paine both run
 * Dark Knight here; Yuna keeps White Mage, matching §6.3's reference build
 * ("White Mage -> Gun Mage swap"). The chain is five battles with **no menu
 * between**, so the inventory below has to carry all of them [§6.8].
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';

export const farplaneBuild: FFX2PartyBuild = {
  game: 'ffx2',
  members: [
    {
      id: 'yuna',
      name: 'Yuna',
      spriteKey: 'yuna-white-mage',
      portraitKey: 'yuna',
      level: 46, // §6.1 — band 43-52; Yuna has the slowest EXP curve of the three
      currentDressphere: 'white-mage',
      // §6.4 "2-4 mastered dresspheres per girl" — Gunner/Thief/Warrior/Black Mage/White Mage/Songstress/
      // Dark Knight/Gun Mage/Alchemist/Samurai/Berserker/Lady Luck all realistically reachable by Ch.5, plus
      // her own special dressphere [§6.5].
      owned: [
        'gunner', 'thief', 'warrior', 'black-mage', 'white-mage', 'songstress', 'dark-knight',
        'gun-mage', 'alchemist', 'samurai', 'berserker', 'lady-luck', 'floral-fallal',
      ],
      garmentGrid: {
        id: 'tempered-will', // Double HP, Double MP — doubles survivability against Vegnagun's all-magic moveset
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {
        // Full White Mage mastery (750 AP) [§6.4].
        'white-mage': {
          learned: [
            'x2-white-mage-pray', 'x2-white-mage-vigor', 'x2-white-mage-shell', 'x2-white-mage-protect',
            'x2-white-mage-cure', 'x2-white-mage-cura', 'x2-white-mage-curaga', 'x2-white-mage-esuna',
            'x2-white-mage-dispel', 'x2-white-mage-life', 'x2-white-mage-full-life', 'x2-white-mage-reflect',
            'x2-white-mage-regen', 'x2-white-mage-full-cure', 'x2-white-mage-lv2', 'x2-white-mage-lv3',
          ],
          ap: 0,
        },
        // Partial Gun Mage, for Mighty Guard (party Shell+Protect in one action) and White Wind — the
        // standard openers for the Body and Head fights [§6.4, §7.2].
        'gun-mage': {
          learned: ['x2-gun-mage-attack', 'x2-gun-mage-scan', 'x2-gun-mage-mighty-guard', 'x2-gun-mage-white-wind'],
          ap: 0,
        },
      },
      accessories: ['crystal-bangle', 'mystery-veil'], // max HP +100%, MDef +40
    },
    {
      id: 'rikku',
      name: 'Rikku',
      spriteKey: 'rikku-dark-knight',
      portraitKey: 'rikku',
      level: 48,
      currentDressphere: 'dark-knight',
      owned: [
        'gunner', 'thief', 'warrior', 'black-mage', 'white-mage', 'songstress', 'dark-knight',
        'gun-mage', 'alchemist', 'samurai', 'berserker', 'lady-luck', 'machina-maw',
      ],
      garmentGrid: {
        id: 'flash-of-steel', // Str +20, Mag +20 equip — scales Darkness's Str-based damage directly
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {
        // Full Dark Knight mastery — the cheapest dressphere to master (490 AP) [§6.4].
        'dark-knight': {
          learned: [
            'x2-dark-knight-attack', 'x2-dark-knight-darkness', 'x2-dark-knight-charon', 'x2-dark-knight-drain',
            'x2-dark-knight-demi', 'x2-dark-knight-confuse', 'x2-dark-knight-break', 'x2-dark-knight-bio',
            'x2-dark-knight-doom', 'x2-dark-knight-death', 'x2-dark-knight-black-sky',
            'x2-dark-knight-poisonproof', 'x2-dark-knight-stoneproof', 'x2-dark-knight-curseproof',
          ],
          ap: 0,
        },
        // Partial Alchemist, for a Mix/Stash sustain fallback if the White Mage is busy or KO'd.
        alchemist: {
          learned: [
            'x2-alchemist-attack', 'x2-alchemist-mix', 'x2-alchemist-stash-potion',
            'x2-alchemist-stash-hi-potion', 'x2-alchemist-stash-remedy', 'x2-alchemist-stash-phoenix-down',
          ],
          ap: 0,
        },
      },
      accessories: ['crystal-bangle', 'hyper-wrist'], // max HP +100%, Str +30
    },
    {
      id: 'paine',
      name: 'Paine',
      spriteKey: 'paine-dark-knight',
      portraitKey: 'paine',
      level: 50, // fastest EXP curve of the three
      currentDressphere: 'dark-knight',
      owned: [
        'gunner', 'thief', 'warrior', 'black-mage', 'white-mage', 'songstress', 'dark-knight',
        'gun-mage', 'alchemist', 'samurai', 'berserker', 'lady-luck', 'full-throttle',
      ],
      garmentGrid: {
        id: 'pride-of-the-sword', // Str +15 per gate passed (up to +60), scales Darkness directly
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {
        'dark-knight': {
          learned: [
            'x2-dark-knight-attack', 'x2-dark-knight-darkness', 'x2-dark-knight-charon', 'x2-dark-knight-drain',
            'x2-dark-knight-demi', 'x2-dark-knight-confuse', 'x2-dark-knight-break', 'x2-dark-knight-bio',
            'x2-dark-knight-doom', 'x2-dark-knight-death', 'x2-dark-knight-black-sky',
            'x2-dark-knight-poisonproof', 'x2-dark-knight-stoneproof', 'x2-dark-knight-curseproof',
          ],
          ap: 0,
        },
        // Partial Warrior, her natural fit, as a Sentinel/Break fallback.
        warrior: {
          learned: ['x2-warrior-attack', 'x2-warrior-sentinel', 'x2-warrior-power-break', 'x2-warrior-armor-break'],
          ap: 0,
        },
      },
      accessories: ['crystal-bangle', 'black-belt'], // max HP +100%, Str +20 / Def +20
    },
  ],
  // §6.8 [estimate] — sized to carry all five battles with no menu between.
  inventory: [
    { itemId: 'x2-potion', count: 40 },
    { itemId: 'x2-hi-potion', count: 30 },
    { itemId: 'x2-x-potion', count: 20 },
    { itemId: 'x2-mega-potion', count: 15 },
    { itemId: 'x2-elixir', count: 5 },
    { itemId: 'x2-megalixir', count: 4 },
    { itemId: 'x2-turbo-ether', count: 6 },
    { itemId: 'x2-phoenix-down', count: 25 },
    { itemId: 'x2-mega-phoenix', count: 5 },
    { itemId: 'x2-remedy', count: 15 },
    { itemId: 'x2-light-curtain', count: 12 }, // Protect — the Shuyin answer [§7.2]
    { itemId: 'x2-lunar-curtain', count: 12 }, // Shell — the Vegnagun answer [§7.2]
    { itemId: 'x2-chocobo-feather', count: 10 },
  ],
  gil: 200000,
};

export default farplaneBuild;
