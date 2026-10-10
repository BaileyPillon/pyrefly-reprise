/**
 * The kernel inputs of one strike, built from the engine's units (re-parity W3; **FFX-2 only**).
 *
 * Every field names the byte or word of the game's character record it stands for (`Chr+0x...`), and where the engine
 * keeps the number. `docs/handoff/re-parity-w3.md` section 1 is the table of all of them, with what the engine cannot
 * supply and why each is the value it is. Nothing here draws a random number and nothing here changes a unit.
 */

import type { StatBlock } from '../../common/types.ts';
import type { Ffx2Unit } from '../internal.ts';
import { isChained } from '../chain.ts';
import type { HitAttacker, HitTarget } from '../kernel/hit.ts';
import type { PipelineAttacker, PipelineTarget } from '../kernel/pipeline-types.ts';
import { STATUS_COUNT, initialStatusResult, type StatusAttacker, type StatusResult, type StatusTarget } from '../kernel/statusTypes.ts';
import {
  accuracyStage,
  affinityBytes,
  atbPool,
  evasionStage,
  group2Counters,
  group2Permanent,
  has,
  luckStage,
  protectMask,
  resistTables,
  specialWord,
  speciesMask,
  stage,
  statusWord1,
} from './words.ts';

/** The game keeps a stat in a byte. */
export function statByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * One kernel slot id (0 to 30) per unit, unique and in the game's order: the party first (slots 0 to 14), the enemies
 * after (monster slots 15 to 30), each side by its own slot and then by position. The ids decide the order the hit
 * determination visits targets (ascending) and which targets count as monsters (15 and up) in the Petrify rule.
 */
export function assignSlotIds(units: readonly Ffx2Unit[]): Map<Ffx2Unit, number> {
  const ids = new Map<Ffx2Unit, number>();
  for (const side of ['party', 'enemy'] as const) {
    const base = side === 'party' ? 0 : 15;
    const limit = side === 'party' ? 14 : 30;
    const ranked = units
      .map((unit, index) => ({ unit, index }))
      .filter((u) => u.unit.side === side)
      .sort((a, b) => a.unit.slot - b.unit.slot || a.index - b.index);
    ranked.forEach((u, rank) => ids.set(u.unit, Math.min(limit, base + rank)));
  }
  return ids;
}

const ZEROS: readonly number[] = Object.freeze(new Array<number>(STATUS_COUNT).fill(0));

/** `Chr+0x380`: the level, 1 when the unit has none. */
export function levelOf(unit: Ffx2Unit): number {
  return unit.level ?? 1;
}

/** The attacker as the damage pipeline reads it. `breaksLimit` is the girl's Break Damage Limit (`Chr+0x652` bit 0). */
export function pipelineAttacker(user: Ffx2Unit, id: number, breaksLimit: boolean): PipelineAttacker {
  const stats: StatBlock = user.stats;
  return {
    id,
    hp: user.hp,
    maxHp: stats.maxHp,
    mp: user.mp,
    maxMp: stats.maxMp,
    str: statByte(stats.str),
    strStage: stage(user, 'str-up', 'str-down'),
    mag: statByte(stats.mag),
    magStage: stage(user, 'mag-up', 'mag-down'),
    level: levelOf(user),
    status1: statusWord1(user),
    autoAbilities650: 0, // Booster, Medicine, Element Master, Non-Element Master: the engine models none of them
    autoAbilities652: breaksLimit ? 1 : 0,
    weaponElement: 0, // the engine has no weapon element
  };
}

/** The target as the damage pipeline reads it. `chain` is the counter before this hit (`Chr+0x5ad`). */
export function pipelineTarget(target: Ffx2Unit, id: number, chain: number): PipelineTarget {
  const stats: StatBlock = target.stats;
  return {
    id,
    hp: target.hp,
    maxHp: stats.maxHp,
    mp: target.mp,
    maxMp: stats.maxMp,
    def: statByte(stats.def),
    defStage: stage(target, 'def-up', 'def-down'),
    mdef: statByte(stats.mdef),
    mdefStage: stage(target, 'mdef-up', 'mdef-down'),
    status1: statusWord1(target),
    affinities: affinityBytes(target),
    shell: has(target, 'shell') ? 1 : 0,
    protect: has(target, 'protect') ? 1 : 0,
    immunePhysical: has(target, 'null-physical') ? 1 : 0,
    immuneMagical: has(target, 'null-magic') ? 1 : 0,
    invincible: has(target, 'invincible') ? 1 : 0,
    special: specialWord(target),
    species: speciesMask(target),
    chain,
    inBattle: target.removed ? 0 : 1,
    dead: target.alive ? 0 : 1,
    flag5ac: 0, // meaning not pinned in the game's code; 0 never blocks a target
    atb: atbPool(target),
  };
}

/** The attacker as the hit determination reads it. */
export function hitAttacker(user: Ffx2Unit, id: number): HitAttacker {
  return {
    id,
    level: levelOf(user),
    luck: statByte(user.stats.luck),
    acc: statByte(user.stats.acc),
    accStage: accuracyStage(user),
    luckStage: luckStage(user),
    darkness: has(user, 'darkness'),
  };
}

/**
 * The target as the hit determination reads it. A target inside its chain window counts as in hit reaction: the game's
 * chain counter lives exactly while the target reacts to a hit (`Chr+0xd98`/`+0xd58`), and the engine has no reaction
 * state, so its chain window stands in for it (an open item in `docs/handoff/re-parity-w3.md`).
 */
export function hitTarget(target: Ffx2Unit, id: number): HitTarget {
  const { resist1 } = resistTables(target);
  return {
    id,
    level: levelOf(target),
    luck: statByte(target.stats.luck),
    eva: statByte(target.stats.eva),
    evaStage: evasionStage(target),
    luckStage: luckStage(target),
    asleep: has(target, 'sleep'),
    petrified: has(target, 'petrify'),
    stopped: has(target, 'stop'),
    evadesPhysical: false, // the Evade & Counter auto-ability is not modelled
    inHitReaction: isChained(target),
    aided: false,
    maxHp: target.stats.maxHp,
    accumulated: target.bribeAccumulated ?? 0,
    bribeImmune: (specialWord(target) & 0x200) !== 0,
    resistEject: resist1[10] ?? 0,
    resistDeath: resist1[0] ?? 0,
    resistPetrify: resist1[1] ?? 0,
    resistSextic: target.enemy?.ffx2Record?.zantetsu ?? 0,
  };
}

/** The attacker as the status rolls read it (no weapon tables: the engine has no weapon statuses). */
export function statusAttacker(user: Ffx2Unit, id: number): StatusAttacker {
  return { id, level: levelOf(user), weaponChance1: ZEROS, weaponChance2: ZEROS, weaponAmount2: ZEROS };
}

/**
 * The target as the status rolls read it. `actionState` is 0: the meaning of its bits (petrified or Stopped, mid-action)
 * is not pinned in the game's code, and the engine has no matching state, so no target counts as acting.
 */
export function statusTarget(target: Ffx2Unit, id: number): StatusTarget {
  const { resist1, resist2 } = resistTables(target);
  return {
    id,
    level: levelOf(target),
    status1: statusWord1(target),
    resist1,
    resist2,
    protectMask: protectMask(target),
    actionState: 0,
    activeBytes: group2Counters(target),
    layerB: group2Permanent(target),
    layerD: ZEROS,
  };
}

/** The result buffer a status roll starts from for this target (`pp_result_init`). `skipCopy` is the row's flags_misc 0x800. */
export function startStatusResult(target: Ffx2Unit, skipCopy: boolean): StatusResult {
  return initialStatusResult(
    { appliedSet: statusWord1(target), counters: group2Counters(target), secondarySet: 0, secondaryBytes: ZEROS },
    skipCopy,
    false,
  );
}

