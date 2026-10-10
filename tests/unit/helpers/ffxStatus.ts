/**
 * Two ways for an FFX test to put a status on a combatant (re-parity W2; **FFX only**).
 *
 * The engine no longer has an `applyStatus(...)` of its own: a status lands through the game's infliction step, inside a hit
 * (`adapt/status.ts`, the kernels). Tests used the old entry as a setup helper and to check landing rules, which are two different
 * needs:
 *
 * - {@link giveStatus} puts the status on by hand: no roll, no event. For SETUP, where the test is about something else.
 * - {@link inflict} runs the application as a command of its own through the engine's real hit and status steps
 *   (`resolveOneHit`, the hit of an action on one target, so it reaches a target that is not on the field), exactly as an
 *   ability that carries it would. For tests ABOUT landing.
 */

import type { AbilityDef, FFXCombatant, StatusApplication, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import type { Ctx } from '../../../src/battle/ffx/index.ts';
import { drawsOf } from '../../../src/battle/ffx/adapt/draws.ts';
import { type HitScope, newRecordBook, resolveOneHit } from '../../../src/battle/ffx/hit-apply.ts';

/** Put `status` on `target` by hand: a plain instance (254 turns, "until removed"), overridable. */
export function giveStatus(target: FFXCombatant, status: StatusId, over: Partial<StatusInstance> = {}): StatusInstance {
  const inst: StatusInstance = { id: status, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, ...over };
  target.statuses[status] = inst;
  return inst;
}

/** An ability that carries only this application, resolved as the game resolves any command: no hit roll, no damage. */
export function statusAbility(app: StatusApplication, id = 'test-inflict'): AbilityDef {
  return {
    id,
    name: id,
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'single-any',
    hits: 1,
    statusEffects: [{ ...app }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
  };
}

/**
 * Run `app` on `target` as a command of `user` (the target itself when none is given: a self-cast), through the real hit
 * and status steps. Returns true when the status is on the target afterwards and was not, or gained a stack.
 */
export function inflict(ctx: Ctx, user: FFXCombatant | undefined, target: FFXCombatant, app: StatusApplication, abilityId?: string): boolean {
  const before = target.statuses[app.status];
  const stacksBefore = before?.stacks ?? 0;
  const def = statusAbility(app, abilityId);
  const scope: HitScope = {
    ctx,
    user: user ?? target,
    def,
    options: {},
    draws: drawsOf(ctx.rng),
    primaryElement: 'none',
    totalHits: 1,
    hitIndex: 0,
    totalDealt: 0,
    rank: 3,
    records: newRecordBook(),
    touched: new Map(),
  };
  resolveOneHit(scope, target);
  const after = target.statuses[app.status];
  if (!after) return false;
  return before === undefined || after.stacks > stacksBefore;
}
