/**
 * The Experiment, FFX-2 Chapter 5, Djose Temple: the Machine Faction's weapon prototype (our hidden chapter "The Experiment", mission Masterpiece Theatre). **FFX-2 only**
 * [AGENTS.md rule 14].
 *
 * **The game's own two-act Rematch** (the driver's pick, 2026-10-10, concept B of the research's `concepts.md`): two formations chained by `nextGroupId`, one boss at two
 * strengths. **Act I** is the machine at Attack 1, Defense 1, Special 1 (the first test: a plain strike every action, Defense 1, nearly unlosable, the game's own on-ramp);
 * **Act II** is the full weapon at 5 / 5 / 5 (the seven-action loop of volley, strike, volley, strike, Lifeslicer, Annihilator, strike), a **retry checkpoint** that restores the party:
 * a loss reopens Act II and skips Act I and the seam between them. HP (18,324), Agility (68) and the level (50) are the same in both. There is no chosen-levels path (`./experiment-levels.ts`).
 *
 * Numbers: the public sources, reconciled with the game's own monster row (`[game rows]`, `research/re-ffx2-experiment.md`), which `attachMonsterRecords` lays on each enemy (ACC, the
 * resist bytes, the steal byte). Nothing is tuned (rule 6).
 *
 * The two bodies have their own combatant ids (`x2-experiment-prototype`, `x2-experiment`) so a mid-battle trigger on Act I's fall (the seam) cannot fire again on Act II's, and their own
 * painting subjects (`ffx2-experiment-proto`, `ffx2-experiment`): the game's own look changes with the levels (research §7).
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import { DEF_MDEF_MOD_IMMUNITY, STANDARD_AILMENT_IMMUNITY, STAT_MOD_IMMUNITY_5 } from './vegnagun-shared.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import {
  ACT_I_LEVELS,
  ACT_II_LEVELS,
  ATTACK_TRACK,
  DEFENSE_TRACK,
  experimentActionIds,
  experimentScriptId,
  type ExperimentLevels,
} from './experiment-levels.ts';

/** The two formations (the Djose Temple fights) and the two combatants. */
export const DJOSE_EXPERIMENT_1 = 'ffx2-djose-experiment-1';
export const DJOSE_EXPERIMENT_2 = 'ffx2-djose-experiment-2';
/** Act I's body: the prototype at 1 / 1 / 1. */
export const EXPERIMENT_PROTOTYPE_ID = 'x2-experiment-prototype';
/** Act II's body: the full weapon at 5 / 5 / 5. */
export const EXPERIMENT_ENEMY_ID = 'x2-experiment';
/** Both bodies, in act order. */
export const EXPERIMENT_BODY_IDS: readonly string[] = [EXPERIMENT_PROTOTYPE_ID, EXPERIMENT_ENEMY_ID];
/** The paintings: new subjects (`public/art/characters/`), PROVISIONAL until Bailey approves one. */
export const EXPERIMENT_PROTOTYPE_SPRITE = 'ffx2-experiment-proto'; // the art brief's subject names: ffx2-experiment (the Overbuilt) and ffx2-experiment-proto (the Prototype)
export const EXPERIMENT_SPRITE = 'ffx2-experiment';

/** HP is the same at every level `[verified: 7 sources]`. */
export const EXPERIMENT_HP = 18324;
/** Level 50, Agility 68 `[verified: 2 sources]`. */
export const EXPERIMENT_LEVEL = 50;
export const EXPERIMENT_AGI = 68;

/**
 * The status list: Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, Slow, Stop, Doom, Delay and Interrupt, and every stat Up and Down (Strength, Magic,
 * Defense, Magic Defense, Accuracy, Evasion, Luck), so no Break lands `[SinirothX; Split_Infinity: verified: 2 sources]`; the wiki's strategy paragraph disagrees on the Breaks
 * (research G-4), the data wins. The game's own bytes replace these (`attachMonsterRecords`).
 */
const EXPERIMENT_IMMUNE: StatusImmunities = { ...STANDARD_AILMENT_IMMUNITY, ...STAT_MOD_IMMUNITY_5, ...DEF_MDEF_MOD_IMMUNITY, stop: 255, slow: 255 };

/** The Experiment at one state of its levels. `who` picks the body: the prototype of Act I or the full weapon of Act II (the id and the painting; the numbers follow `levels`). */
export function experimentEnemy(levels: ExperimentLevels, who: 'prototype' | 'full' = 'full'): EnemyDef {
  const atk = ATTACK_TRACK[levels.attack];
  const def = DEFENSE_TRACK[levels.defense];
  const sprite = who === 'prototype' ? EXPERIMENT_PROTOTYPE_SPRITE : EXPERIMENT_SPRITE;
  return {
    id: who === 'prototype' ? EXPERIMENT_PROTOTYPE_ID : EXPERIMENT_ENEMY_ID,
    name: 'Experiment',
    spriteKey: sprite,
    slot: 0,
    stats: {
      hp: EXPERIMENT_HP,
      mp: 0,
      maxHp: EXPERIMENT_HP,
      maxMp: 0,
      str: atk.str,
      mag: atk.mag,
      def: def.def,
      mdef: def.mdef,
      agi: EXPERIMENT_AGI,
      eva: 0,
      luck: 0,
      acc: 0, // the row's ACC replaces it (`attachMonsterRecords`)
    },
    hp: EXPERIMENT_HP,
    mp: 0,
    level: EXPERIMENT_LEVEL,
    affinities: { gravity: 'immune' }, // Gravity immune, every element else neutral [verified: 3 sources: SinirothX, Split_Infinity, KeyBlade999]; the wiki infobox's Lightning Absorb is the one dissent (research G-3)
    immunities: { ...EXPERIMENT_IMMUNE },
    immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'], // the special word 0x7c3: percent formulas and ATB damage (Delay) do nothing to it
    forms: [{ name: 'Experiment', spriteKey: sprite, hp: EXPERIMENT_HP }],
    aiScriptId: experimentScriptId(levels.special),
    rewards: {
      ap: 40, // EXP / AP / Gil / Pilfer Gil 0 / 40 / 0 / 5,000 [verified: 6 sources]; each fight pays it
      apOverkill: 40,
      gil: 0,
      stolenGil: 5000,
      exp: 0,
      overkillThreshold: 0,
      drops: [{ itemId: 'x2-elixir', count: 1 }], // drop and rare drop, 100 percent both: Elixir [verified: 5 sources]
      steal: {
        baseChance: 100,
        stealRate: 255, // the row's chance byte: a steal always succeeds once (the rare item on one success in eight)
        common: { itemId: 'x2-turbo-ether', count: 1 }, // Turbo Ether, rare Turbo Ether x2 [SinirothX + Jegged: verified: 2 sources; the wiki prints x2 for both, StrategyWiki x1 for both: G-6]
        rare: { itemId: 'x2-turbo-ether', count: 2 },
      },
    },
    abilityIds: experimentActionIds(levels.special),
    flags: { isBoss: true },
    sensorText: 'Its parts decide what it can do. Read what it is built from.',
    scanText: 'A Weapon Prototype designed to take on Vegnagun.', // [SinirothX + wiki]
  };
}

/** Music: the house FFX-2 cues, no new audio. Act I is the lighter bed, Act II the mechanised cue (`docs/audio/THEMES.md` rows 17 and 18). Bailey's call by ear (rule 13). */
const ACT_I_CUE = [{ at: 'start' as const, track: 'boss-ffx2-aeon' as const, fadeMs: 800 }];
const ACT_II_CUE = [{ at: 'start' as const, track: 'boss-vegnagun' as const, fadeMs: 1400 }];

/** Act I: the prototype at 1 / 1 / 1. It chains to Act II. */
export const experimentActOneGroup: EnemyGroupDef = attachMonsterRecords({
  id: DJOSE_EXPERIMENT_1,
  game: 'ffx2',
  enemies: [experimentEnemy(ACT_I_LEVELS, 'prototype')],
  canEscape: false,
  musicCues: ACT_I_CUE,
  nextGroupId: DJOSE_EXPERIMENT_2,
});

/**
 * Act II: the full weapon at 5 / 5 / 5, and the chapter's **retry checkpoint**. `restoresPartyOnEntry` is the Save Sphere's rule (the party enters at full HP and MP, a girl
 * KO'd in Act I stands up, items spent stay spent) and marks the link as the checkpoint (`app/screens/BattleChainCheckpoint.ts#checkpointAt`): a loss in Act II reopens Act II, never
 * Act I or the seam. The sourced shape is the game's (hours of digging and a repair between the two fights restore the party). There is no Save Sphere at Djose, so the link sets
 * `noSaveSphereCard` (the driver's call, 2026-10-10): the engine restores and the retry checkpoint stands, the flow re-stages plainly with no card, and the seam's last narration
 * lines say the girls rested (`story/scripts/ffx2-experiment.ts`). Drop `restoresPartyOnEntry` as well and the carried state stands, with no restore and no checkpoint.
 */
export const experimentActTwoGroup: EnemyGroupDef = attachMonsterRecords({
  id: DJOSE_EXPERIMENT_2,
  game: 'ffx2',
  enemies: [experimentEnemy(ACT_II_LEVELS, 'full')],
  canEscape: false,
  musicCues: ACT_II_CUE,
  restoresPartyOnEntry: true,
  noSaveSphereCard: true,
});

export const experimentGroups: readonly EnemyGroupDef[] = [experimentActOneGroup, experimentActTwoGroup];

/**
 * A one-off formation of the full weapon at any state of its levels, for the unit tests and the benches that play every level (the chapter itself plays only 1 / 1 / 1 and
 * 5 / 5 / 5). It carries Act II's id, so the game's monster row lays on it as on the real thing; it is never registered and never chained.
 */
export function experimentFormationAt(levels: ExperimentLevels): EnemyGroupDef {
  return attachMonsterRecords({ id: DJOSE_EXPERIMENT_2, game: 'ffx2', enemies: [experimentEnemy(levels, 'full')], canEscape: false });
}
