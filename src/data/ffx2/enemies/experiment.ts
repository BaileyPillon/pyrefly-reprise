/**
 * The Experiment, FFX-2 Chapter 5, Djose Temple: the Machine Faction's weapon prototype (our hidden chapter "The Experiment"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * One boss, one link. The three upgrade tracks (`./experiment-levels.ts`) change its Strength and Magic (Attack), its Defense and Magic Defense (Defense) and its
 * action pattern (Special); HP, Agility and the row's other fields are the same at every level. `experimentGroup(levels)` builds the formation for a choice and
 * memoises it per choice, so the engine, the preload and the card all read one object for one choice; `experimentDefaultGroup` is the formation the registry
 * (`ENEMY_GROUPS_BY_ID`) and the debug API know by id.
 *
 * Numbers: the public sources (`[public]`, FF Wiki and Jegged) reconciled with the game's own monster row (`[game rows]`, `research/re-ffx2-experiment.md`),
 * which `attachMonsterRecords` lays on the enemy (ACC, the resist bytes, the steal byte). Nothing is tuned (rule 6).
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import { STANDARD_AILMENT_IMMUNITY } from './vegnagun-shared.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import {
  ATTACK_TRACK,
  DEFAULT_EXPERIMENT_LEVELS,
  DEFENSE_TRACK,
  experimentActionIds,
  experimentScriptId,
  levelsKey,
  type ExperimentLevels,
} from './experiment-levels.ts';

/** The formation id (the Djose Temple fight) and the combatant id. */
export const DJOSE_EXPERIMENT = 'ffx2-djose-experiment';
export const EXPERIMENT_ENEMY_ID = 'x2-experiment';
/** The Experiment's painting: a new subject (`public/art/characters/ffx2-experiment/`), PROVISIONAL until Bailey approves one. */
export const EXPERIMENT_SPRITE = 'ffx2-experiment';

/** HP is the same at every level `[public]`. */
export const EXPERIMENT_HP = 18324;
/** Level 50, Agility 68 `[public]`. */
export const EXPERIMENT_LEVEL = 50;
export const EXPERIMENT_AGI = 68;

/** Immune to the standard ailments, Stop, Slow, Haste-style statuses and the stat mods the row lists; Lightning absorbed, Gravity immune `[public]`; the row's bytes replace these. */
const EXPERIMENT_IMMUNE: StatusImmunities = { ...STANDARD_AILMENT_IMMUNITY, stop: 255, slow: 255 };

/** The Experiment as it stands at one choice of levels. */
export function experimentEnemy(levels: ExperimentLevels): EnemyDef {
  const atk = ATTACK_TRACK[levels.attack];
  const def = DEFENSE_TRACK[levels.defense];
  return {
    id: EXPERIMENT_ENEMY_ID,
    name: 'Experiment',
    spriteKey: EXPERIMENT_SPRITE,
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
    affinities: { lightning: 'absorb', gravity: 'immune' },
    immunities: { ...EXPERIMENT_IMMUNE },
    immunityFlags: ['boss', 'immune-to-percentage-damage'],
    forms: [{ name: 'Experiment', spriteKey: EXPERIMENT_SPRITE, hp: EXPERIMENT_HP }],
    aiScriptId: experimentScriptId(levels.special),
    rewards: {
      ap: 40, // [public]
      apOverkill: 40,
      gil: 0, // [game rows] pending
      stolenGil: 5000, // [public]
      exp: 0, // [game rows] pending
      overkillThreshold: 0,
      drops: [{ itemId: 'x2-elixir', count: 1 }], // drop and rare drop: Elixir x1 [public]
      steal: {
        baseChance: 50,
        stealRate: 128,
        common: { itemId: 'x2-turbo-ether', count: 2 }, // Turbo Ether x2 both slots [public]
        rare: { itemId: 'x2-turbo-ether', count: 2 },
      },
    },
    abilityIds: experimentActionIds(levels.special),
    flags: { isBoss: true },
    sensorText: 'A prototype built to take on Vegnagun. Its parts decide what it can do.',
    scanText: 'A Weapon Prototype designed to take on Vegnagun.',
  };
}

/** Music: the house FFX-2 boss cue, the field bed the FFX-2 chapters share (no new audio). */
const BOSS_CUE = [{ at: 'start' as const, track: 'boss-ffx2-aeon' as const, fadeMs: 800 }];

function buildGroup(levels: ExperimentLevels): EnemyGroupDef {
  const group: EnemyGroupDef = {
    id: DJOSE_EXPERIMENT,
    game: 'ffx2',
    enemies: [experimentEnemy(levels)],
    canEscape: false,
    musicCues: BOSS_CUE,
  };
  return attachMonsterRecords(group);
}

const memo = new Map<string, EnemyGroupDef>();

/** The formation for a choice of levels: one object per choice. */
export function experimentGroup(levels: ExperimentLevels): EnemyGroupDef {
  const key = levelsKey(levels);
  let group = memo.get(key);
  if (!group) {
    group = buildGroup(levels);
    memo.set(key, group);
  }
  return group;
}

/** The formation at the default choice: the one the registry holds. */
export const experimentDefaultGroup: EnemyGroupDef = experimentGroup(DEFAULT_EXPERIMENT_LEVELS);

export const experimentGroups: readonly EnemyGroupDef[] = [experimentDefaultGroup];
