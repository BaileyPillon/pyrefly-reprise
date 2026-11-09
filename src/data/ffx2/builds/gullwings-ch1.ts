/**
 * The party in FFX-2 Chapter 1's hotspot missions (the hidden chapter "Gullwings, Chapter 1", `../../chapter-ffx2-gullwings-ch1.ts`): Yuna a Gunner, Rikku a Thief, Paine a Warrior, with the Songstress, Black Mage and White
 * Mage owned. **FFX-2 only** [AGENTS.md rule 14]: dresspheres, Garment Grids, FFX-2 items.
 *
 * **No source gives the girls' levels, kit or bag at any of the four fights** (`research/re-ffx2-gullwings-chapter1.md` §2: "No source gives the girls' levels or kit at these four fights"; the anchor table of
 * `src/battle/ffx2/dressphere-stats.ts` begins at Lv 20, and the dressphere definitions' growth formulas carry the girls below it). The one sourced party in the repo nearest to Chapter 1 is the Chapter 2 preset (Yuna 23,
 * Rikku 24, Paine 25), which is **above** this chapter, and the Château build (Lv 20 / 21 / 22, `./chateau.ts`) is the start of Chapter 2. So this is a **new build**, and every number below that is not a sourced fact is
 * `[estimate]` (DR2, the driver's pick under Bailey's blanket yes; the alternative is the Chapter 2 preset as a measured what-if, not shipped):
 *
 * - **Levels 12 / 13 / 14** `[estimate]`, Paine ahead as in every preset (separate EXP pools: Paine's curve is the fastest, Yuna's the slowest). They sit between the first bosses' levels (Boris 8, YSLS-Zero 11, the Flame Dragon 16,
 *   the Guardian Beast 18) and are the one lever the bench may move (`tests/unit/chapters/gullwings-ch1-bench.test.ts`): never a boss number.
 * - **Dresspheres**: Gunner, Thief and Warrior are the girls' starting spheres (the Chapter 1 guides); the **Songstress** is owned from the start (the guides' Chapter 1 kit: Gunner, Warrior, Thief, Songstress); the **Black Mage**
 *   is given after Boris and the **White Mage** after the Flame Dragon (Jegged Chapter 1; `research/re-ffx2-gullwings-chapter1.md` §2) and both are owned here, so the chain is one build (DR3: one build for the chain; the
 *   alternative is a per-link build override, +3 h and a contract entry). No Lady Luck, Samurai, Gun Mage, Alchemist, Berserker or Trainer (Chapter 2 and 3 acquisitions; the Gun Mage the guides recommend against YSLS-Zero is not
 *   owned: U4). The `owned` order is the girl's own node layout (`setup.ts::gridNodeContents` fills the grid from the worn sphere followed by `owned`), put so that each girl's useful second roles are one link from her node.
 * - **Garment Grid**: First Steps (six nodes, no gates), the grid of the start of the game (`ffx2-combat-core.md` §4.3, `[verified: 2 sources]`); Protection Halo (given with the Flame Dragon) is not worn.
 * - **Accessories**: none. The Chapter 1 guides' Red Ring and White Ring are not in the engine's accessory stat table (`battle/ffx2/accessories.ts`), and a worn accessory the table does not know is a silent no-op, a counter on the
 *   sheet that does nothing (the Château build's own reasoning).
 * - **Bag** `[estimate]`: Potions, Hi-Potions, Phoenix Downs, Remedies (the answer to Boris's Stop), Holy Water (the answer to the Guardian Beast's Curse), Antidotes and Eye Drops; 3,000 gil. The counts are ours.
 * - **Abilities**: the free ones the menu offers (the Black Mage's four Level 1 spells, the White Mage's Pray and Cure, the Warrior's and Gunner's starting commands); nothing is pre-learned, so the bench measures the kit the
 *   girls have for nothing.
 *
 * It is built from nothing but data (no spread of another chapter's build), so no chapter's preset can ever mutate another's. **Measured, not tuned**: if Bailey wants the chapter easier or harder the honest options are a
 * measured round with different levels, never boss numbers (`boss-side-fix-needs-measured-options`).
 */

import type { FFX2PartyBuild, GarmentGridState } from '../../../battle/common/types.ts';

/** The first-steps grid a Chapter 1 girl wears: six nodes, no gates; `nodePosition: 0` is her worn sphere. */
const firstSteps = (): GarmentGridState => ({ id: 'first-steps', nodePosition: 0, passedGates: [], wornThisBattle: [] });

export const gullwingsCh1Build: FFX2PartyBuild = {
  game: 'ffx2',
  members: [
    {
      id: 'yuna',
      name: 'Yuna',
      spriteKey: 'yuna-gunner',
      portraitKey: 'yuna-x2',
      level: 12, // [estimate]: no source gives a level below the Chapter 2 preset's 23
      currentDressphere: 'gunner',
      owned: ['gunner', 'white-mage', 'songstress', 'thief', 'warrior', 'black-mage'], // the White Mage and the Black Mage are the one link either side of her Gunner node
      garmentGrid: firstSteps(),
      abilitiesLearned: {},
      accessories: [],
    },
    {
      id: 'rikku',
      name: 'Rikku',
      spriteKey: 'rikku-thief',
      portraitKey: 'rikku-x2',
      level: 13, // [estimate]
      currentDressphere: 'thief',
      owned: ['thief', 'black-mage', 'gunner', 'warrior', 'white-mage', 'songstress'],
      garmentGrid: firstSteps(),
      abilitiesLearned: {},
      accessories: [],
    },
    {
      id: 'paine',
      name: 'Paine',
      spriteKey: 'paine-warrior',
      portraitKey: 'paine',
      level: 14, // [estimate]
      currentDressphere: 'warrior',
      owned: ['warrior', 'white-mage', 'gunner', 'songstress', 'thief', 'black-mage'],
      garmentGrid: firstSteps(),
      abilitiesLearned: {},
      accessories: [],
    },
  ],
  // [estimate]: no source records a canonical Chapter 1 inventory. A Stop answer for Boris (Remedy), the healing a Gunner and a Thief have no spells for (Potion, Hi-Potion), the raise (Phoenix Down).
  inventory: [
    { itemId: 'x2-potion', count: 30 },
    { itemId: 'x2-hi-potion', count: 8 },
    { itemId: 'x2-phoenix-down', count: 6 },
    { itemId: 'x2-remedy', count: 4 },
    { itemId: 'x2-holy-water', count: 3 },
    { itemId: 'x2-antidote', count: 4 },
    { itemId: 'x2-eye-drops', count: 4 },
  ],
  gil: 3000,
};

export default gullwingsCh1Build;
