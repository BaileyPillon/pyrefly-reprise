/**
 * The presenter's half of the spell effects (B1 option B, Bailey 2026-09-26):
 * remember which ability is on screen, and hold a blow's numeral until the
 * effect has landed, so the number appears when the fire column rises or the
 * bolt strikes and not before.
 *
 * Game case: both. Same rules as the rest of the presenter: no `three`, no
 * DOM, ports only (`VfxPort.land`, which a stage may leave out).
 */

import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { SPECIAL_HOLD_CAP_MS } from './spellfx/SpellFxSpecials.ts';

/** The action whose effects are playing. */
export interface ActingAction {
  serial: number;
  actorId: CombatantId;
  abilityId?: string;
  targets: readonly CombatantId[];
}

/**
 * The longest a numeral waits for its spell, at normal speed: the outer guard.
 * Each effect caps its own wait (`FxSpec.holdCapMs`): 900 ms for a spell
 * (FFX-2 Holy's first strike is 550 ms in), 1.5 s for D-233's special moments,
 * which land about 1.45 s in.
 */
export const SPELL_WAIT_CAP_MS = SPECIAL_HOLD_CAP_MS;

const serials = new WeakMap<EventCtx, number>();
/**
 * Each combatant's latest action. FFX-2's ATB overlaps actions, so the blow
 * that lands now is often from an action that started before the one on
 * screen; it resolves by its own striker's action.
 */
const byActor = new WeakMap<EventCtx, Map<CombatantId, ActingAction>>();

export function beginSpellAction(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>): void {
  const serial = (serials.get(ctx) ?? 0) + 1;
  serials.set(ctx, serial);
  ctx.acting = { serial, actorId: event.actorId, ...(event.abilityId ? { abilityId: event.abilityId } : {}), targets: event.targets };
  let m = byActor.get(ctx);
  if (!m) byActor.set(ctx, (m = new Map()));
  m.set(event.actorId, ctx.acting);
}

export function endSpellAction(ctx: EventCtx): void {
  ctx.acting = undefined;
}

/**
 * Start (or find) the effect for this blow and wait until it lands. The camera
 * cuts to the target first, so the spell is seen arriving rather than only its
 * aftermath. A blow is matched to its striker's latest action; one from a
 * combatant that has not acted (a counter) resolves by its element alone.
 */
export async function awaitSpellLanding(ctx: EventCtx, event: Extract<BattleEvent, { type: 'damage' }>, heal: boolean): Promise<void> {
  const vfx = ctx.stage.vfx;
  if (!vfx.land) return;
  const a = event.sourceId === undefined ? ctx.acting : byActor.get(ctx)?.get(event.sourceId);
  const ours = a !== undefined;
  const ms = vfx.land(event.targetId, {
    ...(ours && a.abilityId ? { abilityId: a.abilityId } : {}),
    element: event.element,
    heal,
    hitIndex: event.hitIndex,
    ...(ours ? { targets: a.targets, action: a.serial, sourceId: a.actorId } : {}),
    ...(event.crit ? { crit: true } : {}),
  });
  if (ms <= 0) return;
  ctx.moments.impact(event.targetId, { hitIndex: event.hitIndex });
  await ctx.sleep(Math.min(ms, SPELL_WAIT_CAP_MS));
}
