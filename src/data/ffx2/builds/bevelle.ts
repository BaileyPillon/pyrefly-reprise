/**
 * Chapter 4 party build — Bevelle Underground (FFX-2 Bahamut).
 *
 * Build point: **Chapter 2, Limbo** in story terms — three independent sources
 * put the encounter there, against ARCHITECTURE.md's single "Ch. 3" line
 * [writing-bible §0.3]. The chapter *label* stays 4; write the build and the
 * dialogue to Chapter 2 knowledge. Party level band **20–28**, not ~32
 * [ffx2-bahamut §0 C1, §4].
 *
 * The single most important stat fact: **a girl's combat stats are a function
 * of (dressphere x level) only** [ffx2-combat-core §5.1]. Yuna, Rikku and Paine
 * are identical in the same dressphere at the same level; Trainer and Mascot
 * are the only per-girl exceptions. So the build is `level + dressphere +
 * garment grid + accessories + learned abilities`, and the engine derives the
 * stats.
 *
 * TODO(data-agent): replace every placeholder below.
 *   - `ffx2-bahamut.md` §4 gives the typical Chapter 2 party.
 *   - `ffx2-combat-core.md` §5.1b has per-level tables for the Lv 20–30 band,
 *     §5.4 the realistic accessory loadouts, §4.3 the Garment Grids available
 *     by this point.
 *   - Design constraint from §1.2: Bahamut's **Def 160 / MDef 10** makes raw
 *     physical attacks near-worthless. The build must make a magic or
 *     defense-ignoring route reachable without handing it to the player.
 *   - Thief's Evasion 19 is the only dressphere that meaningfully dodges him.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';

export const bevelleBuild: FFX2PartyBuild = {
  game: 'ffx2',
  members: [
    {
      id: 'yuna',
      name: 'Yuna',
      spriteKey: 'yuna-gunner',
      portraitKey: 'yuna-x2-face',
      level: 24, // TODO(data-agent): §4 — band is 20–28.
      currentDressphere: 'gunner',
      owned: ['gunner'], // TODO(data-agent): §4
      garmentGrid: {
        id: 'first-steps', // TODO(data-agent): §4.3
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {}, // TODO(data-agent): §3.1 etc., keyed by dressphere id
      accessories: [], // TODO(data-agent): §5.4, max 2
    },
    {
      id: 'rikku',
      name: 'Rikku',
      spriteKey: 'rikku-thief',
      portraitKey: 'rikku-x2-face',
      level: 24, // TODO(data-agent)
      currentDressphere: 'thief',
      owned: ['thief'], // TODO(data-agent)
      garmentGrid: {
        id: 'first-steps', // TODO(data-agent)
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
      level: 24, // TODO(data-agent)
      currentDressphere: 'warrior',
      owned: ['warrior'], // TODO(data-agent)
      garmentGrid: {
        id: 'first-steps', // TODO(data-agent)
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {}, // TODO(data-agent)
      accessories: [], // TODO(data-agent)
    },
  ],
  inventory: [], // TODO(data-agent): §5.5
  gil: 0, // TODO(data-agent)
};

export default bevelleBuild;
