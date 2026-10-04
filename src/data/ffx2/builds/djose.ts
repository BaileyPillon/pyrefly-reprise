/**
 * The party at Djose Temple, the end of FFX-2 Chapter 3 (our unlisted chapter "Ixion at Djose").
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: dresspheres, Garment Grids, FFX-2 items.
 *
 * Source: `research/ffx2-ixion-djose.md` §5. What is sourced and what is ours:
 *
 * - **Party:** Yuna, Rikku and Paine, fixed `[verified]`.
 * - **Levels 32 / 33 / 34 are our estimate** (IX-14): no guide gives a level at Djose. The research's band is
 *   Lv 30-36, Paine >= Rikku >= Yuna (Ixion is Lv 28; the Chapter 3 Valefor and Ifrit are Lv 22 and 23
 *   `[SinirothX]`; the Chapter 2 preset `./bevelle.ts` is 23 / 24 / 25). These sit in the middle of it.
 * - **Dresspheres owned:** the Chapter 2 list (`./bevelle.ts`, from `ffx2-bahamut.md` §4.3) plus **Samurai**,
 *   which is certain by Djose (Kilika Temple, Chapter 3) `[verified: 3 sources]`, plus **Lady Luck** (Bailey,
 *   D-361, 2026-10-03): the Luca Sphere Break against Shinra is a Chapter 3 event and Djose is the end of Chapter 3
 *   (`research/ffx2-lady-luck-availability.md`), so the girls *could* own her here, **if Shinra was beaten**: the
 *   preset is the party that did. Not added, each labelled in §5: Berserker (only if the Lake Macalania mission
 *   was done), Trainer (only if Yuna answered Kimahri correctly in Chapter 2). Mascot: **no** (endgame).
 *   **Where Lady Luck sits is ours** `[estimate]` (no source says what a girl sets on her grid): node 1 of every
 *   ring, the first row of the Change menu and Gunner's node (Gunner is off the grid, still owned; no line here uses
 *   it). The Chapter XVI guide page says Water hurts him (Watera and Waterga are the Black Mage's, Liquid Steel the
 *   Warrior's, `research/ffx2-ixion-djose.md` section 4), so Black Mage stays on the last node of Yuna's and Rikku's
 *   five-node rings, one link from node 0, and the Warrior on the last node of Paine's four-node Stonehewn, whose four
 *   Breaks she has learned (the guides' line). (r381-lady-luck, Bailey's recommendation after the independent check: the
 *   first build took Black Mage's node from Yuna and Rikku.)
 * - **Dresspheres worn:** Yuna White Mage, Rikku and Paine Dark Knight: Split_Infinity's line ("two Dark
 *   Knights and a White Mage", research §4.5); every guide's party uses Dark Knight as the damage with a White
 *   Mage or Alchemist healing. This is the line the guides report, not a solved party: Darkness ignores his
 *   Def 106, and nothing in it answers his Water weakness.
 * - **Garment Grids:** the Chapter 2 preset's, carried forward, `[estimate]` (combat-core §4.3 lists them as
 *   Chapter 1-2 grids). **Thunder Spawn** (Lightning Eater; the grid the wiki names for this fight) is not
 *   worn: it is a bench option (`docs/plans/ixion-bench.md`). **Unwavering Guard is the reward, so it is not
 *   in the preset** (§5).
 * - **Abilities, accessories and the bag** are the Chapter 2 preset's plus a chapter's worth of AP and
 *   Mega-Potions (Paradisio's line uses them), `[estimate]`: no source records a Chapter 3 inventory.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';

/** Chapter 2's list (`./bevelle.ts`) plus Samurai (Kilika, Chapter 3) `[verified: 3 sources]`. */
const OWNED_CORE = ['gunner', 'thief', 'warrior', 'black-mage', 'white-mage', 'songstress', 'dark-knight', 'gun-mage', 'alchemist', 'samurai'] as const;

/**
 * `OWNED_CORE` with Lady Luck first and Gunner last: the order is the node layout (`setup.ts#gridNodeContents`, the worn
 * dressphere on node 0 then this list), so Lady Luck takes node 1, the first Change row and Gunner's node, and Gunner is
 * off the grid (still owned). Black Mage keeps node 4, the last node of the five-node rings Yuna and Rikku wear here (one
 * link from node 0; the guide's Water spells need it), and on Paine's four-node Stonehewn (Dark Knight, Lady Luck, Thief,
 * Warrior) the last node is the Warrior whose Breaks she has learned. Chapter XVI has no Itchy and so no autopilot Change:
 * the first Change row is read by nothing here (the baseline run has no spherechange event in 200 seeds; measured again in
 * r381-lady-luck, `docs/handoff/r381-lady-luck.md`).
 */
const LADY_FIRST: string[] = ['lady-luck', ...OWNED_CORE.filter((d) => d !== 'gunner'), 'gunner'];

const DARK_KNIGHT = {
  learned: [
    'x2-dark-knight-attack', 'x2-dark-knight-darkness', 'x2-dark-knight-charon', 'x2-dark-knight-drain',
    'x2-dark-knight-demi', 'x2-dark-knight-poisonproof', 'x2-dark-knight-stoneproof',
  ],
  ap: 0,
};

export const djoseBuild: FFX2PartyBuild = {
  game: 'ffx2',
  members: [
    {
      id: 'yuna',
      name: 'Yuna',
      spriteKey: 'yuna-white-mage',
      portraitKey: 'yuna',
      level: 32, // [estimate] inside §5's band 30-36
      currentDressphere: 'white-mage',
      owned: [...LADY_FIRST, 'floral-fallal'], // Protection Halo, 5 nodes: White Mage, Lady Luck, Thief, Warrior, Black Mage
      garmentGrid: { id: 'protection-halo', nodePosition: 0, passedGates: [], wornThisBattle: [] }, // Def +5, MDef +5 (Ch.1)
      abilitiesLearned: {
        // Chapter 2's White Mage (`./bevelle.ts`) plus Pray, Curaga and Life: a chapter of AP, [estimate].
        'white-mage': {
          learned: [
            'x2-white-mage-pray', 'x2-white-mage-cure', 'x2-white-mage-shell', 'x2-white-mage-protect',
            'x2-white-mage-esuna', 'x2-white-mage-cura', 'x2-white-mage-vigor', 'x2-white-mage-dispel',
            'x2-white-mage-curaga', 'x2-white-mage-life',
          ],
          ap: 0,
        },
      },
      accessories: ['circlet', 'mythril-gloves'], // Chapter 2's, [estimate]
    },
    {
      id: 'rikku',
      name: 'Rikku',
      spriteKey: 'rikku-dark-knight',
      portraitKey: 'rikku',
      level: 33,
      currentDressphere: 'dark-knight',
      owned: [...LADY_FIRST, 'machina-maw'], // Hour of Need, 5 nodes: Dark Knight, Lady Luck, Thief, Warrior, Black Mage
      garmentGrid: { id: 'hour-of-need', nodePosition: 0, passedGates: [], wornThisBattle: [] }, // Def +10, MDef +10 (Ch.2)
      abilitiesLearned: { 'dark-knight': DARK_KNIGHT },
      accessories: ['muscle-belt', 'iron-bangle'], // Chapter 2's, [estimate]
    },
    {
      id: 'paine',
      name: 'Paine',
      spriteKey: 'paine-dark-knight',
      portraitKey: 'paine',
      level: 34,
      currentDressphere: 'dark-knight',
      owned: [...LADY_FIRST], // Stonehewn, 4 nodes: Dark Knight, Lady Luck, Thief, Warrior (see LADY_FIRST)
      garmentGrid: { id: 'stonehewn', nodePosition: 0, passedGates: [], wornThisBattle: [] }, // Def +10 (Ch.2)
      abilitiesLearned: {
        'dark-knight': DARK_KNIGHT,
        warrior: {
          learned: ['x2-warrior-power-break', 'x2-warrior-armor-break', 'x2-warrior-magic-break', 'x2-warrior-mental-break', 'x2-warrior-sentinel'],
          ap: 0,
        },
      },
      accessories: ['power-wrist', 'titanium-bangle'], // Chapter 2's, [estimate]
    },
  ],
  // [estimate]: Chapter 2's bag (`./bevelle.ts`) plus Mega-Potions; no source records a Chapter 3 inventory.
  inventory: [
    { itemId: 'x2-potion', count: 60 },
    { itemId: 'x2-hi-potion', count: 20 },
    { itemId: 'x2-mega-potion', count: 5 },
    { itemId: 'x2-phoenix-down', count: 20 },
    { itemId: 'x2-ether', count: 10 },
    { itemId: 'x2-remedy', count: 8 },
    { itemId: 'x2-holy-water', count: 5 },
    { itemId: 'x2-lunar-curtain', count: 4 },
    { itemId: 'x2-light-curtain', count: 3 },
  ],
  gil: 20000,
};

export default djoseBuild;
