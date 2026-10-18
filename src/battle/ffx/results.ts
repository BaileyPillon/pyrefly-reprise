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
import { type Ctx, has, tryActor } from './state.ts';
import { gaugeOnVictory } from './gauge.ts';
import { idiv } from './math.ts';
import { victoryBonusAp } from './aeon-duel.ts';
import { itemIdOf, memberTotals } from './adapt/loot.ts';

/** `apForLevel(sLv) = min(5*(sLv+1) + floor(sLv^3/50), 22000)` [ffx-combat-core §10.1]. */
export function apForLevel(sLv: number): number {
  return Math.min(5 * (sLv + 1) + idiv(sLv * sLv * sLv, 50), 22000);
}

/**
 * An overkill doubles the item drops of the enemy it killed (PR-0258; FFX only).
 *
 * Sourced twice over: `research/ffx-vs-ffx2-presentation.md` §9 (Overkill "doubles AP and item drops ... does not
 * affect gil or equipment drops", [verified: 2 sources], FF Wiki *Battle Results* and *Overkill*), and each
 * chapter file's own drop row, e.g. Anima and the Guardians "Ability Sphere x1 (x2 on overkill)"
 * (`ffx-seymour-anima-macalania.md` §1.4, §2.5), Flux, Evrae, Yojimbo and Natus (x2 normal, x4 overkill),
 * Omnis (x1 / x2, then x2 / x4). Gil, steals and equipment are untouched. A stack still caps at 99
 * (`ItemDrop.count`, 1-99). FFX-2 has no Overkill, and its engine never reaches this.
 *
 * Since re-parity RC9 a shipped monster's overkill list is its own record's (`data/ffx/loot/records.ts`: every shipped record's list is the normal one at double the quantity, so the
 * rule above still holds for all of them); this multiplier is now only how a hand-built enemy with no record is turned into one (`adapt/loot.ts`).
 */
export { OVERKILL_DROP_MULTIPLIER } from './adapt/loot.ts';

/**
 * A battle's kill rewards, as the deaths paid them (re-parity RC9; `adapt/loot.ts#payKill`, called from `hp.ts` at each monster's death): the game's reward struct is
 * read once, here, when the battle is won. The gil is the struct's (a Gillionaire wearer doubled it at each kill), the AP is what the monsters were worth, and the items are its stacks
 * (equal items stacked, at most eight stacks of 99). Nothing is rolled here.
 */
function collectRewards(ctx: Ctx): { ap: number; gil: number; drops: ItemDrop[] } {
  const ledger = ctx.rt.rewards;
  if (ledger === undefined) return { ap: 0, gil: 0, drops: [] };
  return { ap: ledger.baseAp, gil: ledger.list.gil, drops: ledger.list.items.map((stack) => ({ itemId: itemIdOf(ledger, stack.id), count: stack.qty })) };
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
  if (member.guest) return false; // a guest in the party (`FFXGuestSpec`) earns nothing: he is lent, not owned
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
function sphereLevels(ctx: Ctx, won: boolean, bonus: number): Record<CombatantId, number> {
  const out: Record<CombatantId, number> = {};
  // Each member's own running total from the kills (a Double or Triple AP wearer's is more, a No AP wearer's none); the settle of the exit (`kernel/drops.ts#settleAp`: a member who never
  // acted, or is dead or Petrified at the end, goes back to the AP he started with) is `earnedAp` below.
  const totals = won ? memberTotals(ctx) : new Map<CombatantId, number>();
  for (const id of [...ctx.state.activeIds, ...ctx.state.reserveIds]) {
    if (!earnedAp(ctx, id)) continue;
    const member = tryActor(ctx, id);
    const grid = member?.sphereGrid;
    if (!member || !grid) continue;
    let banked = grid.ap + (totals.get(id) ?? 0) + bonus;
    let levels = 0;
    while (banked >= apForLevel(grid.sLv + levels) && levels < 255) {
      banked -= apForLevel(grid.sLv + levels);
      levels += 1;
    }
    out[id] = levels;
  }
  return out;
}

/**
 * Every party member (active or benched) who completed at least one full
 * turn, mapped to how many — independent of {@link earnedAp}'s AP-eligibility
 * rule, which also excludes anyone KO'd or petrified at the end. This is the
 * "did they act" question `sphereLevelsGained` cannot answer on its own: a
 * reserve member switched in, who fought and was KO'd before the battle
 * ended, has real `turnsTaken` here but no `sphereLevelsGained` entry.
 * `resultsMath.ts` reads this to decide who gets a results row at all,
 * separately from what AP/Sphere Level that row shows (round 04 PR-0003,
 * second pass — see `docs/handoff/builda1-truthwording.md`).
 */
function turnParticipation(ctx: Ctx): Record<CombatantId, number> {
  const out: Record<CombatantId, number> = {};
  for (const id of [...ctx.state.activeIds, ...ctx.state.reserveIds]) {
    if (tryActor(ctx, id)?.guest) continue; // a guest has no results row (`FFXGuestSpec`)
    const taken = ctx.rt.actors.get(id)?.turnsTaken ?? 0;
    if (taken > 0) out[id] = taken;
  }
  return out;
}

/** Assemble the result for a finished battle. */
export function buildBattleResult(
  ctx: Ctx,
  outcome: BattleResult['outcome'],
  nextGroupId: string | undefined,
): BattleResult {
  const earned = outcome === 'victory' ? collectRewards(ctx) : { ap: 0, gil: 0, drops: [] };
  const { gil, drops } = earned;
  // A formation-level reward no enemy carries (Chapter XIV's 5,000 AP, B13 = a); 0 elsewhere.
  const ap = earned.ap + (outcome === 'victory' ? victoryBonusAp(ctx) : 0);
  gaugeOnVictory(ctx); // `pp_BtlOdOnVictory` (0x007b1540) runs for EVERY result, not only a victory [FFX-G10 3.5; RC8, FFX only]: every party member in the battle, dead or not, runs the Victor counter, and a living Victor free of Curse and Petrify gains 20

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
    sphereLevelsGained: sphereLevels(ctx, outcome === 'victory', outcome === 'victory' ? victoryBonusAp(ctx) : 0),
    turnsTaken: turnParticipation(ctx),
  };
  if (outcome === 'victory' && nextGroupId !== undefined) result.nextGroupId = nextGroupId;
  return result;
}

/**
 * **A scripted Game Over** (`state.flags`), raised by an AI script whose action
 * ends the battle as a loss whatever the field looks like afterwards. Overdrive
 * Sin's Giga-Graviton is the only user: "even using an Aeon to shield it won't
 * save you", and Auto-Life does not either (`research/ffx-sin.md` §3.4,
 * `[verified: 4 sources]`). `engine.ts#checkEnd` reads it; unset in every other
 * battle. FFX only.
 */
export const SCRIPTED_GAME_OVER_FLAG = 'battle.scriptedGameOver';

/** True once a script has declared this battle lost. */
export function scriptedGameOver(ctx: Ctx): boolean {
  return ctx.state.flags[SCRIPTED_GAME_OVER_FLAG] === true;
}
