/**
 * Win/lose conditions and the `BattleResult`.
 *
 * Two X-2-specific rules live here:
 *
 * - **Parts never gate victory.** The Leg's three Nodes carry 300,000 HP each
 *   and are *not meant to be killed* — the Leg is the win condition
 *   [ffx2-vegnagun-shuyin §3.2]. Same for the Bulwarks and the Redoubts, which
 *   are levers rather than targets. So only enemies without `flags.isPart`
 *   count.
 * - **The engine never advances a chained encounter.** On a victory it copies
 *   `EnemyGroupDef.nextGroupId` onto the result and stops; the BattleScreen
 *   re-inits for the next link (CONTRACT-CHANGES, orchestrator decision 6).
 */

import type { BattleResult, BattleState } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';

/** Deterministic actor order: party by slot, then enemies by slot. */
export function actorOrder(units: readonly Ffx2Unit[]): Ffx2Unit[] {
  return [...units].sort((a, b) => {
    if (a.side !== b.side) return a.side === 'party' ? -1 : 1;
    return a.slot - b.slot;
  });
}

/** An empty shell, so `state()` is safe to call before `init`. */
export function emptyState(): BattleState {
  return {
    game: 'ffx2',
    combatants: {},
    activeIds: [],
    reserveIds: [],
    enemyIds: [],
    aeonId: null,
    turn: 0,
    ticks: 0,
    log: [],
    nextSeq: 0,
    triggers: [],
    firedTriggerIds: [],
    result: null,
    seed: 0,
    flags: {},
  };
}

/**
 * Has the battle ended? Returns the outcome, or `null` to keep playing.
 *
 * `flags.badEnding` is the Vegnagun head's cannon fail clock: when Shuyin's
 * seventh line fires, Spira is destroyed and the run ends in the bad ending —
 * mechanically a defeat [ffx2-vegnagun-shuyin §4.2].
 */
export function battleOutcome(
  units: readonly Ffx2Unit[],
  state: BattleState,
): BattleResult['outcome'] | null {
  const partyAlive = units.some((u) => u.side === 'party' && u.alive && !u.removed);
  const bossesAlive = units.some((u) => u.side === 'enemy' && !u.flags.isPart && u.alive && !u.removed);

  if (state.flags['badEnding'] === true || !partyAlive) return 'defeat';
  if (!bossesAlive) return 'victory';
  return null;
}

/** Build the result record, including the chain link when there is one. */
export function buildResult(
  units: readonly Ffx2Unit[],
  state: BattleState,
  outcome: BattleResult['outcome'],
  elapsedMs: number,
): BattleResult {
  const won = outcome === 'victory';
  const rewards = units.filter((u) => u.side === 'enemy' && u.enemy).map((u) => u.enemy?.rewards);

  const result: BattleResult = {
    outcome,
    turns: state.turn,
    elapsedTicks: Math.round(state.ticks),
    elapsedMs: Math.round(elapsedMs),
    // FFX-2 pays EXP, not Sphere Levels; `ap` is still per-dressphere AP.
    ap: won ? rewards.reduce((sum, r) => sum + (r?.ap ?? 0), 0) : 0,
    exp: won ? rewards.reduce((sum, r) => sum + (r?.exp ?? 0), 0) : 0,
    gil: won ? rewards.reduce((sum, r) => sum + (r?.gil ?? 0), 0) : 0,
    drops: won ? rewards.flatMap((r) => r?.drops ?? []) : [],
    // X-2 has no Overkill; the field stays empty rather than being faked.
    overkilled: [],
    sphereLevelsGained: {},
    levelsGained: {},
  };

  const next = state.flags['nextGroupId'];
  if (won && typeof next === 'string') result.nextGroupId = next;
  return result;
}
