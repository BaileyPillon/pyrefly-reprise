/**
 * Chapter 5 party build — Heart of the Farplane (Vegnagun chain -> Shuyin).
 *
 * Build point: Chapter 5, level band **43–52** (~48)
 * [ffx2-vegnagun-shuyin §6; ffx2-combat-core §5.1b].
 *
 * Reminder: **stats are a function of (dressphere x level) only**
 * [ffx2-combat-core §5.1]. The build is level + dressphere + garment grid +
 * accessories + learned abilities; the engine derives the numbers.
 *
 * TODO(data-agent): replace every placeholder below.
 *   - `ffx2-vegnagun-shuyin.md` §6 gives the party at the final battle.
 *   - `ffx2-combat-core.md` §5.1b has the Lv 43–52 per-level tables, §5.4 the
 *     late accessory loadouts, §4.3 the Chapter 5 Garment Grids.
 *   - A Chapter 5 party can plausibly have **mastered 2–4 dresspheres per
 *     girl** [ffx2-combat-core §3.0]; give them room without giving them
 *     everything.
 *   - Recommended Chapter 5 Grids [§4.3]: Tempered Will (Double HP + Double
 *     MP), Chaos Maelstrom / Pride of the Sword (+60 STR or MAG across four
 *     gates plus the skillset), Flash of Steel, Font of Power (One MP Cost), or
 *     Unerring Path when the plan is to reach a special dressphere on turn 3.
 *   - The chain is four Vegnagun battles then Shuyin with **no menu between**,
 *     so the inventory has to carry all five fights.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';

export const farplaneBuild: FFX2PartyBuild = {
  game: 'ffx2',
  members: [
    {
      id: 'yuna',
      name: 'Yuna',
      spriteKey: 'yuna-gunner',
      portraitKey: 'yuna-x2-face',
      level: 48, // TODO(data-agent): §6 — band is 43–52.
      currentDressphere: 'gunner',
      owned: ['gunner'], // TODO(data-agent): §6
      garmentGrid: {
        id: 'tempered-will', // TODO(data-agent): §4.3
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {}, // TODO(data-agent)
      accessories: [], // TODO(data-agent): §5.4, max 2
    },
    {
      id: 'rikku',
      name: 'Rikku',
      spriteKey: 'rikku-thief',
      portraitKey: 'rikku-x2-face',
      level: 48, // TODO(data-agent)
      currentDressphere: 'thief',
      owned: ['thief'], // TODO(data-agent)
      garmentGrid: {
        id: 'highroad-winds', // TODO(data-agent)
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {}, // TODO(data-agent)
      accessories: [], // TODO(data-agent)
    },
    {
      id: 'paine',
      name: 'Paine',
      spriteKey: 'paine-warrior',
      portraitKey: 'paine-face',
      level: 48, // TODO(data-agent)
      currentDressphere: 'warrior',
      owned: ['warrior'], // TODO(data-agent)
      garmentGrid: {
        id: 'pride-of-the-sword', // TODO(data-agent)
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {}, // TODO(data-agent)
      accessories: [], // TODO(data-agent)
    },
  ],
  inventory: [], // TODO(data-agent): §5.5 — must carry all five battles.
  gil: 0, // TODO(data-agent)
};

export default farplaneBuild;
