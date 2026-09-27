/**
 * Guard Scorpion, the No. 1 Reactor core: the formation of the hidden FF7
 * experiment.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Numbers cite
 * `research/ff7-guard-scorpion.md` ("gs") with its tags. The FF7 engine reads
 * `ff7` (the FF7 stat block) and nothing else; `stats`, `affinities` and
 * `rewards` are the shared shapes' **mirrors** for shared UI (HP bar, Sensor
 * lines), filled from the same sourced numbers, never read by an FF7 formula
 * (`battle/common/types-ff7.ts`). Where a shared field has no FF7 meaning its
 * value says so in a comment; it is not game data.
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import type { Ff7EnemyAbilityId, Ff7EnemyId, Ff7ItemId } from '../ids.ts';

const ID: Ff7EnemyId = 'guard-scorpion';
const DROP: Ff7ItemId = 'assault-gun';
/** gs §4 [verified: 2 to 3 sources each]. */
const ABILITIES: readonly Ff7EnemyAbilityId[] = ['search-scope', 'rifle', 'scorpion-tail', 'tail-laser', 'raise-tail', 'drop-tail'];

/** gs §2.1 [verified: 3 sources unless noted]. */
const LEVEL = 12;
const HP = 800;
const MP = 0;
const ATT = 30;
const MAT = 15;
const DEF_TAIL_DOWN = 40;
const DEF_TAIL_UP = 255;
/** Not the listed 300: Setup sets 256, the raised tail 384 [gs §2.2]. */
const MDF_TAIL_DOWN = 256;
const MDF_TAIL_UP = 384;
const DF_PCT = 0;
const DEX = 60;
const LCK = 1;

export const guardScorpion: EnemyDef = {
  id: ID,
  name: 'Guard Scorpion',
  spriteKey: ID,
  slot: 0,
  // Mirrors (display only): str = Att, def, mag = MAt, mdef = MDf, agi = Dex, luck, eva = Df%.
  // FF7 enemies have no accuracy stat (each action carries its own hit%, gs §4): acc 0.
  stats: {
    hp: HP, mp: MP, maxHp: HP, maxMp: MP,
    str: ATT, def: DEF_TAIL_DOWN, mag: MAT, mdef: MDF_TAIL_DOWN, agi: DEX, luck: LCK, eva: DF_PCT, acc: 0,
  },
  hp: HP,
  mp: MP,
  // Weak: Lightning; Void: Gravity [gs §3, verified: 3 and 2 sources].
  affinities: { lightning: 'weak', gravity: 'immune' },
  immunities: {}, // FFX byte table: not FF7's; the list is `ff7.statusImmune`
  immunityFlags: [],
  // Tail down, tail up: the raise is a form change [gs §2.1, §5.1]; the form keys are the plan's (§1.4).
  forms: [
    { name: 'Guard Scorpion', spriteKey: 'guard-scorpion', hp: HP },
    { name: 'Guard Scorpion', spriteKey: 'guard-scorpion-tail-up', hp: HP },
  ],
  aiScriptId: ID,
  rewards: {
    ap: 10, // gs §12
    apOverkill: 10, // FF7 has no overkill: same as `ap`
    gil: 100, // gs §12
    overkillThreshold: 99_999, // FF7 has no overkill: above any hit, so a shared reader never shows one
    drops: [{ itemId: DROP, count: 1 }], // certain [gs §2.2, verified: 2 sources]
    exp: 100, // gs §12
  },
  abilityIds: [...ABILITIES],
  flags: { isBoss: true },
  level: LEVEL,
  ff7: {
    level: LEVEL,
    stats: {
      maxHp: HP, maxMp: MP, att: ATT, def: DEF_TAIL_DOWN, dfPct: DF_PCT, mat: MAT, mdf: MDF_TAIL_DOWN, dex: DEX, lck: LCK,
    },
    formStats: [{}, { def: DEF_TAIL_UP, mdf: MDF_TAIL_UP }],
    exp: 100,
    ap: 10,
    gil: 100,
    drops: [{ itemId: DROP, count: 1, chanceClass: 63 }], // class 63 = certain [gs §2.2]
    elements: { lightning: 'weak', gravity: 'void' },
    // gs §3 [verified: 3 sources].
    statusImmune: [
      'death', 'sleep', 'poison', 'sadness', 'fury', 'confusion', 'silence', 'frog', 'small',
      'slow-numb', 'petrify', 'death-sentence', 'manipulate', 'berserk', 'paralysed', 'darkness',
    ],
  },
};

/** The fixed story formation: one enemy, no escape [gs §1: "Escape: Not possible"]. */
export const guardScorpionGroup: EnemyGroupDef = {
  id: 'ff7-guard-scorpion',
  game: 'ff7',
  enemies: [guardScorpion],
  canEscape: false,
};
