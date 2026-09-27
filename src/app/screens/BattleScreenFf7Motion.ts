/**
 * **FF7's action motion** (FF7 only): the `actionMotion` port the presenter's
 * beats call around each action (`src/engine/BattlePresenterMotion.ts`).
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Built only for a chapter whose
 * game is `'ff7'` (`BattleScreenGameDeps.ts`); FFX and FFX-2 get no motion port.
 *
 * What it does (the FF7 purist review, 2026-09-27, items 4 and 5):
 * - **The melee run.** A party member whose weapon is not Long Range (Cloud's
 *   Buster Sword; Barret's Gatling Gun is Long Range, gs §8.3) runs to a strike
 *   point in front of the target for a physical action (Attack, Braver), the
 *   house wind-up strikes there, and after the action they run back to their
 *   own spot, still facing the enemy. A Long Range attacker fires from where
 *   they stand. The rule is ours, from FF7's battle animations as the review
 *   describes them ("a melee attacker runs to the target, strikes and runs
 *   back"); no research file sources animation. Distances and timings are
 *   **our estimate**.
 * - **The boss's physical moves**, until their options round (rule 9): Rifle
 *   kicks the body back as it fires, Scorpion Tail lunges forward, Tail Laser
 *   braces back. Stand-ins, **our estimate**; Search Scope, Raise Tail and Drop
 *   Tail move nothing here (the lock-on line and the painting swap carry them).
 */

import type { CombatantId } from '../../battle/common/types.ts';
import type { Ff7PartyBuild } from '../../battle/common/types-ff7.ts';
import type { Point3 } from '../../engine/BattlePresenterPorts.ts';
import { motionMs, type ActionMotionPort, type ActionStartEvent, type MotionCtx } from '../../engine/BattlePresenterMotion.ts';
import { FF7_ABILITIES } from '../../data/ff7/abilities.ts';
import { SECTOR1_HEIGHTS } from '../../scenes/sector1-reactor-staging.ts';

/** The run to the strike point and the run back, ms at normal speed. Our estimate. */
export const FF7_RUN_MS = 460;
export const FF7_RUN_BACK_MS = 400;

/** How far in front of a target's centre the strike point is, per unit of its height. Our estimate (the boss: 4.0, about 1.1 in front of its painting's edge). */
export const FF7_REACH_PER_HEIGHT = 1.22;
/** The strike point stands this much nearer the camera than the target, so the attacker is drawn in front of it. */
export const FF7_STRIKE_DZ = 0.5;

/** The boss's stand-in moves by ability: a signed lunge distance (negative = back) and its length. Our estimate. */
export const FF7_ENEMY_MOVES: Readonly<Record<string, { distance: number; ms: number }>> = {
  rifle: { distance: -0.35, ms: 300 },
  'scorpion-tail': { distance: 1.1, ms: 440 },
  'tail-laser': { distance: -0.5, ms: 520 },
};

/** Whether the action is a physical blow on the enemy side (the FF7 ability's formula). */
export function ff7PhysicalAction(abilityId: string | undefined): boolean {
  return abilityId !== undefined && FF7_ABILITIES[abilityId]?.formula === 'physical';
}

export class Ff7ActionMotion implements ActionMotionPort {
  private readonly home = new Map<CombatantId, Point3>();

  constructor(
    /** Party members who run to strike: their weapon is not Long Range. */
    private readonly runners: ReadonlySet<CombatantId>,
    /** A target's world height (the scene's own heights), for the strike point. */
    private readonly heightOf: (id: CombatantId) => number = (id) => (SECTOR1_HEIGHTS as Record<string, number>)[id] ?? 2,
  ) {}

  /** Members of `build` whose weapon is not Long Range. */
  static forBuild(build: Ff7PartyBuild): Ff7ActionMotion {
    return new Ff7ActionMotion(new Set(build.members.filter((m) => m.weapon.longRange !== true).map((m) => m.id)));
  }

  async open(event: ActionStartEvent, ctx: MotionCtx): Promise<void> {
    const actor = ctx.stage.actor(event.actorId);
    if (!actor) return;
    const side = ctx.stage.sideOf(event.actorId);
    if (side === 'enemy') {
      const move = FF7_ENEMY_MOVES[event.abilityId ?? ''];
      if (move) await actor.lunge(move.distance, motionMs(move.ms, ctx.speed));
      return;
    }
    if (side !== 'party' || !this.runners.has(event.actorId) || !ff7PhysicalAction(event.abilityId)) return;
    const targetId = event.targets.find((id) => ctx.stage.sideOf(id) === 'enemy');
    const target = targetId ? ctx.stage.actor(targetId) : undefined;
    if (!target || !targetId) return;
    const from = { x: actor.position.x, y: actor.position.y, z: actor.position.z };
    this.home.set(event.actorId, from);
    const dir = from.x >= target.position.x ? 1 : -1; // strike from the attacker's own side of the target
    const to = { x: target.position.x + dir * FF7_REACH_PER_HEIGHT * this.heightOf(targetId), y: from.y, z: target.position.z + FF7_STRIKE_DZ };
    await actor.moveTo(to, motionMs(FF7_RUN_MS, ctx.speed));
  }

  async close(actorId: CombatantId, ctx: MotionCtx): Promise<void> {
    const home = this.home.get(actorId);
    if (!home) return;
    this.home.delete(actorId);
    await ctx.stage.actor(actorId)?.moveTo(home, motionMs(FF7_RUN_BACK_MS, ctx.speed));
  }

  /** Whether `id` is away from home mid-action (tests, the harness). */
  away(id: CombatantId): boolean {
    return this.home.has(id);
  }
}
