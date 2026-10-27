/**
 * THE READY STANCE, WITH OR WITHOUT THE READY PAINTING (motion-fluidity pass, lane L1; MF-05 `?stance=`; both games; ports only: no `three`, no DOM, no engine state, no RNG).
 *
 * Today the command menu puts a figure on `ready`, which is two things: a STATE (the weight on the front foot, the lean, the turn ring: `BattlePresenterActors.lifeStateForPose`) and a PAINTING
 * (a crouched drawing that shares 0.08 to 0.42 of its outline with the idle: Kimahri's overlap is 0.17, Paine's two drawings are different costumes, PR-0517). The real game has no such pose:
 * the actor stays in its idle loop while the menu is open (`motion-from-game.json` `turnStartReady`, PROVEN for both games). Under `v1a` and `v1b` the state stays and the painting does not change:
 * `setPose('ready', { paint: 'idle' })` (`PaintedActor.setPose`). `v1a` still shows the ready painting as an attack's wind-up (one idle-to-ready change per strike, at the action's start); `v1b` plays the
 * wind-up on the idle painting too (no ready painting anywhere). `v3` keeps both paintings and makes the change a 50 ms blend (`SmearDirector`).
 *
 * This module owns the one fact the turn start needs under `v1a` and `v1b`: the figure IS on the ready stance although the painting it shows is the idle (`KeyPoses.readyCarriesIntoWindUp`).
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { EventCtx } from '../BattlePresenterEvents.ts';
import { noteReason } from './SwapLog.ts';
import { menuKeepsIdle, windUpOnIdle } from './SwapSwitch.ts';

/** Who stands on the ready stance with the idle painting, per playback. */
const onIdle = new WeakMap<EventCtx, Set<CombatantId>>();

function stanceSet(ctx: EventCtx): Set<CombatantId> {
  let s = onIdle.get(ctx);
  if (!s) onIdle.set(ctx, (s = new Set()));
  return s;
}

/** True when the figure is on the ready stance by `v1a` / `v1b` (the painting it shows is the idle). */
export function stanceOnIdle(ctx: EventCtx, id: CombatantId): boolean {
  return onIdle.get(ctx)?.has(id) === true;
}

/** The stance is over for this figure (its turn start took it to the idle, or its action opened). */
export function stanceDone(ctx: EventCtx, id: CombatantId): void {
  onIdle.get(ctx)?.delete(id);
}

/** The command menu opens on `id`: `ready`, with the ready painting (today, `v3`) or the idle painting (`v1a`, `v1b`). */
export function menuStance(ctx: EventCtx, id: CombatantId): void {
  const actor = ctx.stage.actor(id);
  if (!actor) return;
  if (menuKeepsIdle()) {
    stanceSet(ctx).add(id);
    actor.setPose('ready', { paint: 'idle' });
    noteReason(id, 'ready', 'menu', 'idle');
    return;
  }
  stanceDone(ctx, id);
  actor.setPose('ready');
  noteReason(id, 'ready', 'menu');
}

/** What `pose` an action opens on, and why (the harness's split of the stance swaps). */
function reasonOf(pose: string, windUp: boolean): 'wind-up' | 'cast' | 'item' | 'attack' {
  return windUp ? 'wind-up' : pose === 'cast' ? 'cast' : pose === 'item' ? 'item' : 'attack';
}

/**
 * The action opens: `pose` is what `actionStart` asked for (`ready` when the attack opens on its wind-up painting). Under `v1b` that wind-up is played on the idle painting: the stance is kept, the
 * painting is not changed. Everything else is the plain request it always was.
 */
export function openingPose(ctx: EventCtx, id: CombatantId, pose: string, windUp: boolean): void {
  const actor = ctx.stage.actor(id);
  stanceDone(ctx, id);
  if (!actor) return;
  if (windUp && windUpOnIdle()) {
    actor.setPose('ready', { paint: 'idle' });
    noteReason(id, 'ready', 'wind-up', 'idle');
    return;
  }
  actor.setPose(pose);
  noteReason(id, pose, reasonOf(pose, windUp));
}
