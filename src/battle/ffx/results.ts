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
import { type Ctx, has, isAlive, tryActor } from './state.ts';
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

/**
 * Whether this party member earned this battle's AP at all.
 *
 * ffx-combat-core.md §10.1/AP: "Every party member who took at least one full
 * turn earns AP at the end of a battle. Characters switched out during their
 * first turn, KO'd, or petrified at the end earn nothing." (§1.7 is Switch and
 * carries only the narrower switched-out-on-your-first-turn line; round 04's
 * PR-0025 caught this file citing it instead of §10.1, where the AP rule
 * actually lives.) `ActorRuntime.
 * turnsTaken` only increments at `onTurnEnd` (`engine.ts`), so a member
 * switched out mid-turn via the `switch` command's `handOffTo` never reaches
 * it for that interrupted turn — exactly "switched out during their first
 * turn" when it is their only turn so far. A member switched out *after*
 * completing at least one earlier turn keeps the `turnsTaken` from those, so
 * this reads as eligible regardless of whether they are on the field or
 * benched when the battle ends — `isAlive` alone cannot be used here because
 * it requires `onField`, which a benched member never satisfies even when
 * perfectly healthy.
 */
function earnedAp(ctx: Ctx, id: CombatantId): boolean {
  const member = tryActor(ctx, id);
  if (!member || !member.alive || has(member, 'ko') || has(member, 'petrify')) return false;
  return (ctx.rt.actors.get(id)?.turnsTaken ?? 0) > 0;
}

/**
 * Sphere Levels every AP-eligible member's banked AP plus this battle's AP
 * buys — every party member (active or benched) who {@link earnedAp}, not
 * only whoever is standing in the active slots when the battle ends. See
 * {@link earnedAp}'s doc for the sourced rule and why the active-only set was
 * wrong: it both denied AP to a member switched out after acting, and never
 * excluded one KO'd in an active slot at the very end.
 */
function sphereLevels(ctx: Ctx, ap: number): Record<CombatantId, number> {
  const out: Record<CombatantId, number> = {};
  for (const id of [...ctx.state.activeIds, ...ctx.state.reserveIds]) {
    if (!earnedAp(ctx, id)) continue;
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
