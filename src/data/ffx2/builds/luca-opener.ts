/**
 * The party on the docks of Luca, the first fights of FFX-2's Chapter 1 (the hidden chapter "The Luca Opener", `../../chapter-ffx2-luca-opener.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: dresspheres, Garment Grids, FFX-2 items.
 *
 * **No source gives the girls' levels or bag at Luca** (`research/re-ffx2-luca-opener.md` §2, open item U1 `[gap]`, so every level and count here is `[estimate]`; the fallback stat table of `battle/ffx2/dressphere-stats.ts` starts at Lv 20, and the lowest sourced party in
 * the repo is the Chateau Leblanc build's Lv 20 to 22). What the sources do say: the dresspheres at this point are the three the girls start in (Yuna's Gunner, Rikku's Thief, Paine's Warrior) and the Songstress, which Yuna "gets
 * back" after the Logos and Ormi fight, together with the First Steps Garment Grid (Jegged, FFX-2 Chapter 1, "Luca"). The Black Mage and the White Mage arrive later (after Boris and the Flame Dragon: plan row 51). So, the picks
 * (LO2, the driver's, under Bailey's blanket yes; **every level and count below is `[estimate]`, measured and never tuned** by `tests/unit/chapters/luca-opener-bench.test.ts`, with the Chapter 2 party as the harder what-if):
 *
 * - **Levels 2, 2 and 3** (Yuna, Rikku, Paine): the opener's enemies are Lv 2, 2 and 5, and Paine's EXP curve is the fastest (as in the Bevelle preset). The stat table extrapolates below its first anchor, which is the engine's
 *   estimate of a Lv 2 girl, not a sourced figure.
 * - **Act 1 (`lucaOpenerBuild`)**: Yuna a Gunner, Rikku a Thief, Paine a Warrior, each owning only her own dressphere, on the First Steps grid (the game's start-of-game grid). Free abilities only: Trigger Happy, Steal and
 *   Power Break (the three the dressphere tables mark free; a build that names no list would be offered the whole ladder).
 * - **Act 2 (`lucaOpenerSongstressBuild`, LO3)**: the same girls, but **Yuna wears the Songstress and owns nothing else, with Darkness Dance (a free ability) as her only command**: the game holds her to it in this fight
 *   (Jegged: "a short tutorial on changing dresspheres in battle; Yuna is held to the Songstress with one command (Darkness Dance), Rikku has time to steal"). The group carries this template (`EnemyGroupDef.partyBuildRef`, an
 *   additive field: `docs/CONTRACT-CHANGES.md`), because a chain otherwise carries the party's build from link to link. How the game itself holds her (a scripted event) is unread (research U3).
 * - **The bag** `[estimate]`: ten Potions and three Phoenix Downs, and 1,000 gil (no source gives any of the three figures).
 *
 * Both are deep copies, so no chapter's preset can ever mutate another's.
 */

import type { FFX2MemberBuild, FFX2PartyBuild } from '../../../battle/common/types.ts';

/** The First Steps grid, "start of game" (`../garment-grids/early.ts`). */
const firstSteps = (): FFX2MemberBuild['garmentGrid'] => ({ id: 'first-steps', nodePosition: 0, passedGates: [], wornThisBattle: [] });

/** Act 1: the three girls in the dresspheres they start in. */
export const lucaOpenerBuild: FFX2PartyBuild = {
  game: 'ffx2',
  members: [
    {
      id: 'yuna',
      name: 'Yuna',
      spriteKey: 'yuna-gunner',
      portraitKey: 'yuna-x2',
      level: 2, // [estimate] (LO2)
      currentDressphere: 'gunner',
      owned: ['gunner'],
      garmentGrid: firstSteps(),
      abilitiesLearned: { gunner: { learned: ['x2-gunner-trigger-happy'], ap: 0 } },
      accessories: [],
    },
    {
      id: 'rikku',
      name: 'Rikku',
      spriteKey: 'rikku-thief',
      portraitKey: 'rikku-x2',
      level: 2, // [estimate]
      currentDressphere: 'thief',
      owned: ['thief'],
      garmentGrid: firstSteps(),
      abilitiesLearned: { thief: { learned: ['x2-thief-steal'], ap: 0 } },
      accessories: [],
    },
    {
      id: 'paine',
      name: 'Paine',
      spriteKey: 'paine-warrior',
      portraitKey: 'paine',
      level: 3, // [estimate]
      currentDressphere: 'warrior',
      owned: ['warrior'],
      garmentGrid: firstSteps(),
      abilitiesLearned: { warrior: { learned: ['x2-warrior-power-break'], ap: 0 } }, // the one the dressphere table marks free; an empty list would offer the whole ladder
      accessories: [],
    },
  ],
  // [estimate] (LO2): no source records a canonical bag at Luca.
  inventory: [
    { itemId: 'x2-potion', count: 10 },
    { itemId: 'x2-phoenix-down', count: 3 },
  ],
  gil: 1000, // [estimate] (LO2): no source gives the purse either; no shop in the chapter reads it
};

/** Act 2: Yuna in the Songstress, held to Darkness Dance (LO3); Rikku and Paine as they were. A deep copy of act 1 with one member changed, so the bag is the same bag. */
export const lucaOpenerSongstressBuild: FFX2PartyBuild = structuredClone(lucaOpenerBuild);
{
  const yuna = lucaOpenerSongstressBuild.members[0];
  yuna.spriteKey = 'yuna-songstress';
  yuna.currentDressphere = 'songstress';
  yuna.owned = ['songstress'];
  yuna.abilitiesLearned = { songstress: { learned: ['x2-songstress-darkness-dance'], ap: 0 } };
}

export default lucaOpenerBuild;
