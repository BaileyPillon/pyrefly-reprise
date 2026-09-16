/**
 * Building a {@link BattleResult}.
 *
 * The engine never advances groups itself: on a victory it copies
 * `EnemyGroupDef.nextGroupId` into the result and stops, and the BattleScreen
 * re-inits for the next link with the party's carried-over state and
 * `BattleSetup.chained = true` [docs/CONTRACT-CHANGES.md, orchestrator
 * decision 6].
 */

import type { BattleResult, CombatantId, ItemDrop } from '../common/types.ts';
import { type Ctx, isAlive, tryActor } from './state.ts';
import { payVictorGauge } from './overdrive.ts';
import { idiv } from './math.ts';

/** `apForLevel(sLv) = min(5*(sLv+1) + floor(sLv^3/50), 22000)` [ffx-combat-core §10.1]. */
export function apForLevel(sLv: number): number {
  return Math.min(5 * (sLv + 1) + idiv(sLv * sLv * sLv, 50), 22000);
}

/** Total the rewards of every defeated enemy, rolling each drop's chance. */
function collectRewards(ctx: Ctx): { ap: number; gil: number; drops: ItemDrop[] } {
  let ap = 0;
  let gil = 0;
  const drops: ItemDrop[] = [];
  for (const id of ctx.state.enemyIds) {
    const enemy = tryActor(ctx, id);
    const rewards = enemy?.enemy?.rewards;
    if (!enemy || !rewards || isAlive(enemy)) continue;
    ap += ctx.rt.overkilled.includes(id) ? rewards.apOverkill : rewards.ap;
    gil += rewards.gil;
    for (const drop of rewards.drops) {
      if (drop.chance === undefined || ctx.rng.int(1, 100) <= drop.chance) drops.push({ ...drop });
    }
  }
  return { ap, gil, drops };
}

/** Sphere Levels each active member's banked AP plus this battle's AP buys. */
function sphereLevels(ctx: Ctx, ap: number): Record<CombatantId, number> {
  const out: Record<CombatantId, number> = {};
  for (const id of ctx.state.activeIds) {
    const member = tryActor(ctx, id);
    const grid = member?.sphereGrid;
    if (!member || !grid) continue;
    let banked = grid.ap + ap;
    let levels = 0;
    while (banked >= apForLevel(grid.sLv + levels) && levels < 255) {
      banked -= apForLevel(grid.sLv + levels);
      levels += 1;
    }
    out[id] = levels;
  }
  return out;
}

/** Assemble the result for a finished battle. */
export function buildBattleResult(
  ctx: Ctx,
  outcome: BattleResult['outcome'],
  nextGroupId: string | undefined,
): BattleResult {
  const { ap, gil, drops } = outcome === 'victory' ? collectRewards(ctx) : { ap: 0, gil: 0, drops: [] };
  if (outcome === 'victory') payVictorGauge(ctx, ctx.state.activeIds);

  const result: BattleResult = {
    outcome,
    turns: ctx.state.turn,
    elapsedTicks: ctx.state.ticks,
    elapsedMs: ctx.rt.elapsedMs,
    ap,
    exp: 0,
    gil,
    drops,
    overkilled: [...ctx.rt.overkilled],
    sphereLevelsGained: sphereLevels(ctx, ap),
  };
  if (outcome === 'victory' && nextGroupId !== undefined) result.nextGroupId = nextGroupId;
  return result;
}
