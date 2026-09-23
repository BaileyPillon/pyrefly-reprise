/**
 * Two field rules the event table was missing, kept out of
 * `BattlePresenterEvents.ts` so that file does not grow further past the house
 * limit. Like the rest of the presenter this imports no `three` and no DOM
 * [AGENTS.md hard rule 1]. Shared plumbing, so the game case is **both**
 * [AGENTS.md rule 14; critic/CHECKS.md CHK-020].
 *
 * 1. **An enemy that arrives mid-battle is staged.** `forms.ts#revealEnemy`
 *    emits `part-restored` for a combatant that began `flags.hidden`, which the
 *    stage deliberately never built (Anima at Macalania Temple). Fading
 *    `stage.actor(id)` did nothing for an actor that did not exist, so she
 *    fought all of act two invisible. {@link restorePart} hands such a reveal
 *    to `BattleStage.arrive`, which stages her and plays the scene's arrival.
 *
 *    The arrival is **held** until the next event that is not a mid-battle
 *    beat, or the end of the burst. The engine emits the reveal and then the
 *    `script-trigger` for the chapter's line about it; the line is meant to be
 *    spoken first ("An aeon. He is summoning an aeon." before the player sees
 *    her; `docs/handoff/chapter-macalania-scene.md` §4).
 *
 * 2. **A shattered or ejected enemy leaves the field.** `hp.ts#ejectActor`
 *    (Eject, Banish, and the petrified-monster shatter) emits
 *    `status-add eject` and never a `ko`, so a shattered Guado Guardian stood
 *    on the field at full colour for the rest of the fight.
 */

import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { cue, settled, TIMING } from './BattlePresenterEvents.ts';

/**
 * The longest an arrival may hold playback before the guard lets the battle
 * carry on. Macalania's is 6.3 s (`ANIMA_ARRIVAL_MS.end`); this is the cap,
 * not the length.
 */
export const ARRIVAL_CAP_MS = 9_000;

/** Stone grey: the petrify flash, and the colour a petrified fiend comes apart in. */
const STONE = 0xb9b4aa;

type PartRestored = Extract<BattleEvent, { type: 'part-restored' }>;
type StatusAdd = Extract<BattleEvent, { type: 'status-add' }>;

/** `part-restored`: fade a staged part back in, or queue the arrival of one that never was. */
export async function restorePart(ctx: EventCtx, event: PartRestored): Promise<void> {
  const a = ctx.stage.actor(event.partId);
  if (!a && ctx.stage.arrive) {
    if (!ctx.pendingArrivals.includes(event.partId)) ctx.pendingArrivals.push(event.partId);
    return;
  }
  a?.setDissolve(0);
  a?.setAlpha(0);
  await settled(ctx, a?.fadeTo(1, TIMING.revive), TIMING.revive);
}

/** Play every held arrival, in the order the engine revealed them. */
export async function flushArrivals(ctx: EventCtx): Promise<void> {
  const arrive = ctx.stage.arrive?.bind(ctx.stage);
  while (ctx.pendingArrivals.length > 0) {
    const id = ctx.pendingArrivals.shift()!;
    if (!arrive || ctx.stage.actor(id)) continue;
    const clock = { sleep: ctx.sleep, instant: ctx.speed() === 'skip' };
    await settled(ctx, arrive(id, clock).then(() => undefined), ARRIVAL_CAP_MS);
  }
}

/** Ids the presenter has seen petrified, so their shatter reads as stone. */
const stoneIds = new WeakMap<EventCtx, Set<CombatantId>>();

/** `status-add`: the generic flash, plus the two statuses that change the field. */
export async function statusAdded(ctx: EventCtx, event: StatusAdd): Promise<void> {
  const a = ctx.stage.actor(event.targetId);
  if (event.status === 'eject' && a && ctx.stage.sideOf(event.targetId) === 'enemy') {
    const stone = stoneIds.get(ctx)?.has(event.targetId) === true;
    cue(ctx, stone ? 'petrify-shatter' : 'status', { volume: 0.7 });
    if (stone) ctx.stage.camera.shake(0.1, 260);
    await settled(ctx, a.dissolveTo(1, TIMING.ko, stone ? STONE : 0x9dffc4), TIMING.ko);
    ctx.stage.removeCombatant(event.targetId);
    return;
  }
  if (event.status === 'petrify') {
    let set = stoneIds.get(ctx);
    if (!set) stoneIds.set(ctx, (set = new Set()));
    set.add(event.targetId);
    a?.flash(STONE, 320, 0.85);
    a?.setBrightness(0.72);
  } else {
    a?.flash(0xc9a6ff, 260, 0.5);
  }
  cue(ctx, 'status', { volume: 0.5 });
  return ctx.sleep(TIMING.status);
}
