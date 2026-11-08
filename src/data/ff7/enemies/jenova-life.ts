/**
 * Jenova LIFE, the altar of the Forgotten Capital: the formation of hidden chapter 44.
 *
 * Game case (AGENTS.md rule 14): **FF7 only** (the original 1997 boss at the end of Disc 1; the Remake and Rebirth
 * fights are different and unused). Numbers cite `research/ff7-jenova-life.md` ("jl") with its tags. The FF7 engine
 * reads `ff7` (the FF7 stat block) and nothing else; `stats`, `affinities` and `rewards` are the shared shapes'
 * **mirrors** for shared UI, filled from the same sourced numbers, never read by an FF7 formula
 * (`battle/common/types-ff7.ts`).
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import type { Ff7EnemyId, Ff7ItemId, Ff7JenovaAbilityId } from '../ids.ts';

const ID: Ff7EnemyId = 'jenova-life';
const DROP: Ff7ItemId = 'wizard-bracelet';
/** jl §4 [verified: 3 sources each]. */
const ABILITIES: readonly Ff7JenovaAbilityId[] = ['blue-light', 'blue-flame', 'aqualung', 'jenova-reflect'];

/** jl §3 [verified: 3 to 4 sources each unless noted]. */
const LEVEL = 50;
const HP = 10_000;
const MP = 300;
/** Attack 128 (she has no physical attack, so it is never read) and Magic attack 40: M = 6 * (40 + 50) = 540. */
const ATT = 128;
const MAT = 40;
/** Internal Defense 110 (the wiki's 55 is the displayed half) and Magic defense 290. */
const DEF = 110;
const MDF = 290;
const DF_PCT = 10;
const DEX = 140;
const LCK = 40;

export const jenovaLife: EnemyDef = {
  id: ID,
  name: 'Jenova LIFE',
  spriteKey: 'ff7-film-jenova-life', // painted (the art-ff7 kit, installed in the release 78 art mirror; docs/handoff/r78-integration.md); a tree whose art mirror predates it draws the stage's fallback figure
  slot: 0,
  // Mirrors (display only): str = Att, def, mag = MAt, mdef = MDf, agi = Dex, luck, eva = Df%. FF7 enemies have no accuracy stat: acc 0.
  stats: {
    hp: HP, mp: MP, maxHp: HP, maxMp: MP,
    str: ATT, def: DEF, mag: MAT, mdef: MDF, agi: DEX, luck: LCK, eva: DF_PCT, acc: 0,
  },
  hp: HP,
  mp: MP,
  // Absorbs Water [verified: 3 sources], void Gravity [verified: 4 sources]; weak to Earth (the shared ElementId has no Earth, so only the FF7 block carries it).
  affinities: { water: 'absorb', gravity: 'immune' },
  immunities: {}, // FFX byte table: not FF7's; the list is `ff7.statusImmune`
  immunityFlags: [],
  forms: [{ name: 'Jenova LIFE', spriteKey: 'ff7-film-jenova-life', hp: HP }],
  aiScriptId: ID,
  rewards: {
    ap: 350, // jl §3 [verified: 3 sources]
    apOverkill: 350, // FF7 has no overkill: same as `ap`
    gil: 1500,
    overkillThreshold: 99_999, // FF7 has no overkill: above any hit, so a shared reader never shows one
    drops: [{ itemId: DROP, count: 1 }], // certain [jl §3, verified: 2 sources]; LE's 63/255 is the class misread (jl §8 item 2)
    exp: 4000,
  },
  abilityIds: [...ABILITIES],
  flags: { isBoss: true },
  level: LEVEL,
  ff7: {
    level: LEVEL,
    stats: {
      maxHp: HP, maxMp: MP, att: ATT, def: DEF, dfPct: DF_PCT, mat: MAT, mdf: MDF, dex: DEX, lck: LCK,
    },
    exp: 4000,
    ap: 350,
    gil: 1500,
    drops: [{ itemId: DROP, count: 1, chanceClass: 63 }], // class 63 = certain [jl §3, verified: 2 sources]
    // Water absorbs, Earth is weak (x2), Gravity is void [jl §3, verified: 3 / 4 / 4 sources].
    elements: { water: 'absorb', earth: 'weak', gravity: 'void' },
    // jl §3 [verified: 2 sources: Gamer Corner, LE]; Peerless and Seizure [single source: LE]. Not immune, by absence: Paralysed, Darkness, Slow, Sadness, Fury.
    statusImmune: [
      'sleep', 'small', 'confusion', 'silence', 'frog', 'stop', 'berserk', 'poison', 'petrify',
      'slow-numb', 'manipulate', 'death', 'death-sentence', 'peerless', 'seizure',
    ],
  },
};

/** The fixed story formation: one enemy, no escape [jl §2: "Escape: cannot be escaped", Gamer Corner]. */
export const jenovaLifeGroup: EnemyGroupDef = {
  id: 'ff7-jenova-life',
  game: 'ff7',
  enemies: [jenovaLife],
  canEscape: false,
};
