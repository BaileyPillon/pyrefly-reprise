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
 *
 * **Lady Luck is on every girl's grid** (Bailey, D-361, 2026-10-03; FFX-2 only; sources:
 * `research/ffx2-lady-luck-availability.md`): she is a Chapter 3 or Chapter 5 pickup (Sphere
 * Break against Shinra in Luca), so a Chapter 5 party can own her, and the guides show her for
 * all three girls (`[verified: 3 sources]`). The `owned` order is the node layout
 * (`setup.ts#gridNodeContents`: the worn dressphere on node 0, then this list), and the sources
 * do not say which dresspheres a girl has set on her grid, so where Lady Luck sits is ours
 * `[estimate]`: Black Mage's node on each ring (the shipped line never changes to a Black Mage), and
 * node 1, the first row of the Change menu, is untouched on all three girls: the autopilot's Itchy
 * answer takes the first row (`BattlePresenterStrategies.ts`, `overdriveOrAttack`), so the shipped
 * line, Chapter XI's Anima and Chapter XV (the same preset) play exactly as before (digests identical,
 * `docs/handoff/r38-lady-luck-grid.md`, `docs/handoff/r381-lady-luck.md`).
 *   - Yuna's and Rikku's five-node rings: Black Mage sat on node 4, the last node, so Lady Luck is one
 *     link from node 0 (a Change away, the second row of the Change menu).
 *   - Paine's six-node ring: Black Mage sat on node 4 and White Mage on node 5, the last node. White Mage
 *     **stays** (r381-lady-luck, Bailey's recommendation after the independent check): the Chapter 5 guide
 *     page (Jegged, Heart of the Farplane, Core and Bulwarks: "if Memento Mori is coming, swap a White
 *     Mage in for Shell just before it", `research/jegged-encounter-guides-ffx2.md` section 3) names a
 *     White Mage to switch to, and Paine's grid is the only one where a Dark Knight has one a Change away
 *     (Yuna is the White Mage; Rikku's ring never held one). So Lady Luck takes Black Mage's node 4, and
 *     Paine reaches her by two Changes (Dark Knight, White Mage, Lady Luck).
 * The dressphere that sat on Lady Luck's node is off the grid, still owned; the line names none of them.
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
      // Tempered Will has 5 nodes: White Mage, Gunner, Thief, Warrior, **Lady Luck** (node 4, one link from White Mage);
      // Black Mage, which sat on node 4, is off the grid.
      owned: [
        'gunner', 'thief', 'warrior', 'lady-luck', 'black-mage', 'white-mage', 'songstress', 'dark-knight',
        'gun-mage', 'alchemist', 'samurai', 'berserker', 'floral-fallal',
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
      // Flash of Steel has 5 nodes: Dark Knight, Gunner, Thief, Warrior, **Lady Luck** (node 4, one link from Dark Knight);
      // Black Mage, which sat on node 4, is off the grid.
      owned: [
        'gunner', 'thief', 'warrior', 'lady-luck', 'black-mage', 'white-mage', 'songstress', 'dark-knight',
        'gun-mage', 'alchemist', 'samurai', 'berserker', 'machina-maw',
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
      // Pride of the Sword has 6 nodes: Dark Knight, Gunner, Thief, Warrior, **Lady Luck** (node 4), White Mage (node 5, one
      // link from Dark Knight, where it always was); Black Mage, which sat on node 4, is off the grid. The guide page tells a
      // Dark Knight to swap a White Mage in before Memento Mori, and Paine's is the grid that holds one a Change away, so it
      // stays; Lady Luck is two Changes from Dark Knight here (header).
      owned: [
        'gunner', 'thief', 'warrior', 'lady-luck', 'white-mage', 'black-mage', 'songstress', 'dark-knight',
        'gun-mage', 'alchemist', 'samurai', 'berserker', 'full-throttle',
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
      // §6.7 "Recommended 'typical' loadout to model: each girl wears **Crystal Bangle + Hyper Wrist**
      // (attackers)", and §6.3's reference party gives Paine exactly "Hyper Wrist (+30 Str)". Black Belt
      // (Str +20 / Def +20) was the near miss: Darkness is `piercing-strength`, so its whole damage term
      // is Strength and the Def half is dead weight against a chain whose moveset is magic-type or
      // fractional (§1.2). One slot, one citation.
      accessories: ['crystal-bangle', 'hyper-wrist'], // max HP +100%, Str +30
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
