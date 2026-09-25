/**
 * Chapter XIII party build — Cloister 100 of the Via Infinito (Paragon, then Trema).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Research `research/ffx2-trema.md` §5; plan
 * `docs/plans/chapter-trema-review.md` §3, with Bailey's picks (2026-09-25, "I'll go with all
 * your recommendations"):
 *
 * - **Level 99** `[verified: 3 sources, counting Kolar once]`, far above the Chapter V band.
 *   The stats come from the Lv 99 rows in `dressphere-stats.ts` (plan TR-G1, `[single source]`).
 * - **TR10 = a**: Yuna and Paine as Dark Knights, Rikku as an Alchemist: the clear three
 *   sources use (two Dark Knights on Darkness, a healer) `[verified: 3 sources]`, and the three
 *   paintings on disk (`yuna-dark-knight`, `paine-dark-knight`, `rikku-alchemist`).
 * - **TR11 = a**: only the kit the engine models, counts `[estimate]`: Crystal Bangle
 *   (+100 % max HP) and Rabite's Foot (+100 Luck), The End's Break Damage Limit, Megalixir,
 *   Light and Lunar Curtains, Remedy. Valiant Lustre, Higher Power and Stamina Tonic are not
 *   in the engine and are not here.
 * - **TR9**: Darkness keeps `canMiss: true` (no second source for a change); the build is (b),
 *   **Rabite's Feet on the Dark Knights**, so Darkness lands on Trema's Evasion 99 at 91 %
 *   (Acc 105 + Luck 111 against Eva 99 + Luck 26, `[derived]`), and at 100 % while his chain
 *   window is open (`chain.ts#cannotEvade`, the plan Review's correction 4).
 *
 * **Beyond the §3 list, flagged to Bailey:** Phoenix Downs. Rikku's Stash revives for free,
 * but nobody revives Rikku herself without one. Count `[estimate]`.
 *
 * **Garment Grids.** The End on Paine (TR11). Yuna keeps the Chapter V preset's Tempered Will
 * and Rikku wears First Steps, a gateless grid, so her Gunner node (for Target MP, the
 * sourced "drain his MP first" line) sits one link away with no gate on it. Both `[estimate]`.
 * Grid topology is itself an engine `[estimate]` (`garment-grids.ts`).
 *
 * **Abilities.** At Lv 99 every dressphere the line uses is mastered `[estimate]`: Dark Knight
 * and Alchemist in full, and Rikku's Gunner in full for Target MP.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';

const DARK_KNIGHT_MASTERED = [
  'x2-dark-knight-attack', 'x2-dark-knight-darkness', 'x2-dark-knight-charon', 'x2-dark-knight-drain',
  'x2-dark-knight-demi', 'x2-dark-knight-confuse', 'x2-dark-knight-break', 'x2-dark-knight-bio',
  'x2-dark-knight-doom', 'x2-dark-knight-death', 'x2-dark-knight-black-sky',
  'x2-dark-knight-poisonproof', 'x2-dark-knight-stoneproof', 'x2-dark-knight-curseproof',
];

const OWNED = [
  'gunner', 'thief', 'warrior', 'songstress', 'white-mage', 'black-mage', 'dark-knight',
  'gun-mage', 'alchemist', 'samurai', 'berserker', 'lady-luck', 'trainer', 'mascot',
];

/** `current` first, then the rest: node 0 holds `current`, node 1 the next one (`setup.ts`). */
function ownedWith(current: string, next: string, special: string): string[] {
  return [current, next, ...OWNED.filter((d) => d !== current && d !== next), special];
}

export const viaInfinitoBuild: FFX2PartyBuild = {
  game: 'ffx2',
  members: [
    {
      id: 'yuna',
      name: 'Yuna',
      spriteKey: 'yuna-dark-knight',
      portraitKey: 'yuna',
      level: 99,
      currentDressphere: 'dark-knight',
      owned: ownedWith('dark-knight', 'white-mage', 'floral-fallal'),
      garmentGrid: { id: 'tempered-will', nodePosition: 0, passedGates: [], wornThisBattle: [] },
      abilitiesLearned: { 'dark-knight': { learned: [...DARK_KNIGHT_MASTERED], ap: 0 } },
      accessories: ['crystal-bangle', "rabite's-foot"], // TR9 b, TR11 a
    },
    {
      id: 'rikku',
      name: 'Rikku',
      spriteKey: 'rikku-alchemist',
      portraitKey: 'rikku',
      level: 99,
      currentDressphere: 'alchemist',
      owned: ownedWith('alchemist', 'gunner', 'machina-maw'),
      garmentGrid: { id: 'first-steps', nodePosition: 0, passedGates: [], wornThisBattle: [] },
      abilitiesLearned: {
        alchemist: {
          learned: [
            'x2-alchemist-attack', 'x2-alchemist-mix', 'x2-alchemist-stash-potion', 'x2-alchemist-stash-hi-potion',
            'x2-alchemist-stash-mega-potion', 'x2-alchemist-stash-x-potion', 'x2-alchemist-stash-remedy',
            'x2-alchemist-stash-phoenix-down', 'x2-alchemist-stash-ether', 'x2-alchemist-stash-elixir',
            'x2-alchemist-items-lv2', 'x2-alchemist-chemist', 'x2-alchemist-elementalist',
          ],
          ap: 0,
        },
        gunner: {
          learned: [
            'x2-gunner-attack', 'x2-gunner-trigger-happy', 'x2-gunner-potshot', 'x2-gunner-cheap-shot',
            'x2-gunner-enchanted-ammo', 'x2-gunner-target-mp', 'x2-gunner-quarter-pounder', 'x2-gunner-on-the-level',
            'x2-gunner-burst-shot', 'x2-gunner-table-turner', 'x2-gunner-scattershot', 'x2-gunner-scatterburst',
            'x2-gunner-darkproof', 'x2-gunner-sleepproof', 'x2-gunner-trigger-happy-lv2', 'x2-gunner-trigger-happy-lv3',
          ],
          ap: 0,
        },
      },
      accessories: ['crystal-bangle', "rabite's-foot"], // TR11 a; the Luck also dodges Mist, Mire and Moon (§5)
    },
    {
      id: 'paine',
      name: 'Paine',
      spriteKey: 'paine-dark-knight',
      portraitKey: 'paine',
      level: 99,
      currentDressphere: 'dark-knight',
      owned: ownedWith('dark-knight', 'warrior', 'full-throttle'),
      garmentGrid: { id: 'the-end', nodePosition: 0, passedGates: [], wornThisBattle: [] }, // TR11: Break Damage Limit
      abilitiesLearned: { 'dark-knight': { learned: [...DARK_KNIGHT_MASTERED], ap: 0 } },
      accessories: ['crystal-bangle', "rabite's-foot"], // TR9 b, TR11 a
    },
  ],
  // TR11 a, counts `[estimate]`; Phoenix Down is the flagged addition (see the header).
  inventory: [
    { itemId: 'x2-megalixir', count: 10 },
    { itemId: 'x2-light-curtain', count: 10 }, // Protect
    { itemId: 'x2-lunar-curtain', count: 10 }, // Shell: Meteor is magical (TR3 = a)
    { itemId: 'x2-remedy', count: 10 },
    { itemId: 'x2-phoenix-down', count: 20 },
  ],
  gil: 200000,
};

export default viaInfinitoBuild;
