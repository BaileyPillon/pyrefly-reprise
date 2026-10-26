/**
 * Painted key poses around an attack: the wind-up and the follow-through (D-313, Bailey 2026-10-01
 * "all your recommendations"; both games, presentation only, ports only: no `three`, no DOM, no
 * engine state, no RNG).
 *
 * A figure's wind-up painting is installed as its `ready` pose, which the presenter already shows
 * while that member's command menu is open (`BattlePresenter.ts`, `setPose('ready')`). An attack
 * then plays its keys in order:
 *
 * 1. **wind-up** (`ready`) from the action's start until the lunge reaches its apex;
 * 2. **impact** (`attack`, which falls back to `ready` for a figure with no attack painting) at the apex;
 * 3. **follow-through** (`follow`) when the hit lands (`ContactBeat.meetContact`), held at full reach
 *    for {@link FOLLOW_BEAT_MS} before the strike goes home; `actionEnd` returns it to `idle`.
 *
 * Each step happens only when the figure has its **own** painting for it (`BattleStage.paints`),
 * so a figure without the new keys plays exactly as before. REDUCE MOTION keeps today's behaviour:
 * no wind-up lead, no follow-through beat.
 */
import type { CombatantId } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import type { LungeContact } from './ContactBeat.ts';
import { poseForAction } from './EnemyActionPose.ts';
import { isFfx2, odApex, odKeyHolds } from './KeySlots.ts';
import { curvesOn } from './motion/CurvesSwitch.ts'; // motion pass (lane "core")

/** How long the follow-through holds at full reach before the strike goes home, ms at timeScale 1. */
export const FOLLOW_BEAT_MS = 180;

/** A ctx built without moments or a stage (a unit test's) has no keys to play. */
function keysOn(ctx: EventCtx): boolean {
  return ctx.moments?.reducedMotion === false;
}

/** Does this attack open on the wind-up painting? Only an attack, only with a painted `ready`. */
export function windUpLeads(ctx: EventCtx, actorId: CombatantId, pose: string): boolean {
  return pose === 'attack' && keysOn(ctx) && ctx.stage?.paints?.(actorId, 'ready') === true;
}

/**
 * **FFX-2 only** (the ATB; post-conference motion plan, step 2, "the flicker"). A girl's own command menu has put her on `ready` (`BattlePresenter.chooseCommand`); her answer comes back as one burst,
 * `turn-start, action-start, ...` (`FFX2Engine.submit`: `beginTurn`, then `performCommand`). When the very next event is her own attack and that attack opens on the wind-up painting anyway
 * (`actionStart`: `windUp`, the same two terms as there: no port owns the wind-up and {@link windUpLeads}), the turn start must not drop her to `idle` for the 90 ms before the action puts `ready` back:
 * ready, idle, ready, lunge was Chapter IV's flicker, 22 times in 6.3 minutes and 295 of the chapter's 931 see-through frames. True means the turn start leaves her pose alone: the figure holds the painting
 * it already shows and is about to show, so nothing about what the player sees is new (the idle blip is gone; every painting that follows is the one that followed before).
 *
 * Not for FFX (its turn start is a burst of its own, before the menu, with nothing behind it), not for a foe (the menu's `ready` is a party figure's), not for a figure that is not showing `ready`
 * (it gets today's `idle` request), not under REDUCE MOTION or without the wind-up painting (`windUpLeads`), not for a cast, an item or a defend (those open on their own pose, so `ready, idle, cast`
 * stays today's sequence: a separate and smaller blip, left for its own decision), and not when the turn start is played alone (no burst: tests, the demo reel). FFX-2's Overdrive key
 * (`odOpensAction`) never opens an action (it is FFX's), so it is not asked here.
 */
export function readyCarriesIntoWindUp(ctx: EventCtx, actorId: CombatantId): boolean {
  if (!isFfx2(ctx) || ctx.stage.sideOf(actorId) !== 'party') return false;
  const shows = (ctx.stage.actor(actorId) as { pose?: string } | undefined)?.pose;
  if (shows !== 'ready') return false;
  const burst = ctx.burst;
  const next = burst?.events[burst.at + 1];
  if (!next || next.type !== 'action-start' || next.actorId !== actorId) return false;
  const pose = poseForAction(next, ctx.stage.sideOf(actorId), ctx.deps.abilityFacts, (p) => ctx.stage.paints?.(actorId, p) === true);
  return !ctx.deps.actionMotion?.ownsWindUp?.(next) && windUpLeads(ctx, actorId, pose);
}

/**
 * The pose the blow lands in while the wind-up (`ready`) is still up, for the reach solver (`motion/StrikeReach.ts`, r391-reach): the impact painting, the blow's key
 * frame, which goes up at the lunge's apex as the hit lands (`impactAtApex`); the follow-through that holds after it carries on from there, a little further in. `undefined`
 * without a wind-up: the pose showing is the one the blow lands in.
 */
export function blowPose(windUp: boolean): string | undefined {
  return windUp ? 'attack' : undefined;
}

/**
 * The lunge's contact, with the impact painting put up at the apex (after the wind-up). Only while
 * the action is still on: a lunge is never awaited, so its apex can come after `actionEnd` when the
 * playback runs ahead (seen in Chapter IV under the ATB), and the figure must not stay on its impact.
 */
export function impactAtApex(ctx: EventCtx, actorId: CombatantId, contact: LungeContact): LungeContact {
  const impact = (): void => {
    // r37 slot (FFX-2): a move with its own key painting puts that up at the apex instead of the impact painting.
    if (ctx.actingId === actorId && !odApex(ctx, actorId)) ctx.stage.actor(actorId)?.setPose('attack');
  };
  // Motion pass (lane "core"): the sampled strike reaches its contact with the blow already landing on it, so a painting put up AT the contact would be replaced by the follow-through in
  // the same frame and never be seen. It goes up on the strike's `travelPeak` mark instead (the fastest frame, where a swap is hidden best), and `reached` only marks the contact. Step 2: the
  // way out is a swap on a mark too: the impact painting is held through the blow and the 0.2 s hold, and goes to the follow-through (or the idle) on the `settlePeak` mark, the fastest frame home.
  if (curvesOn()) {
    // FFX-2 (Chapter IV): a girl who has run in runs home herself, and `BattleScreenRunIn.close` puts the idle up as she sets off, before the strike's `settlePeak` (seen on the real 120 Hz
    // recording: attack, idle, then a follow-through painted over the run home). Her follow-through stays at the blow, as in the live game; only the impact painting moves to its mark.
    if (ctx.deps?.actionMotion?.lungeFor?.(actorId) !== undefined) return { hold: contact.hold, reached: contact.reached, impact };
    const token = ++armed;
    marksSwaps(ctx).set(actorId, { token, followed: false });
    return { hold: contact.hold, reached: contact.reached, impact, settle: () => settleSwap(ctx, actorId, token), done: () => settleDone(ctx, actorId, token) };
  }
  return {
    hold: contact.hold,
    reached: () => {
      contact.reached();
      impact();
    },
  };
}

/**
 * The hit has landed: put up the attacker's follow-through painting. Returns how long the strike
 * should stay at full reach for it (0 when there is no painting or REDUCE MOTION is on).
 */
export function followThrough(ctx: EventCtx, attackerId: CombatantId): number {
  if (marksSwaps(ctx).has(attackerId)) return 0; // motion pass, step 2: the way out is swapped on the strike's `settlePeak` mark (below), not at the blow
  if (!keysOn(ctx) || ctx.stage?.paints?.(attackerId, 'follow') !== true) return 0;
  if (odKeyHolds(ctx, attackerId)) return 0; // r37 slot: the move's own key painting stays up
  ctx.stage.actor(attackerId)?.setPose('follow');
  return FOLLOW_BEAT_MS;
}

// ------------------------------------------------------------------ motion pass, step 2: the way out, swapped on a mark

/** What a strike whose key poses are swapped on its marks still owes its attacker (the new curves are on and the wind-up painting led), per playback and attacker. */
interface Owed {
  /** Which arming it is: a later attack by the same figure (or the net below) takes over from an earlier one. */
  token: number;
  /** `follow` is up since the `settlePeak` mark and the strike's `end` mark owes the idle. */
  followed: boolean;
}
const onMarks = new WeakMap<EventCtx, Map<CombatantId, Owed>>();
let armed = 0;
function marksSwaps(ctx: EventCtx): Map<CombatantId, Owed> {
  let s = onMarks.get(ctx);
  if (!s) onMarks.set(ctx, (s = new Map()));
  return s;
}

/** How long `actionEnd` lets a strike's own marks do the swaps before it does the idle itself, ms at timeScale 1 (a strike taken over by another never reaches them). */
export const MARKS_NET_MS = 900;

/**
 * The strike has turned for home (its `settlePeak` mark, the fastest frame of the way back): the impact painting goes to the follow-through when the figure has one (D-313), else to the
 * idle. It may fall after `actionEnd` (the action ends about 0.1 s before the fastest frame of the way home, measured in Chapter I), which is why `actionEnd` waits for it ({@link idleAtEnd}).
 * Not when the move's own key painting (an Overdrive's) is what holds the figure.
 */
export function settleSwap(ctx: EventCtx, actorId: CombatantId, token?: number): void {
  const owed = marksSwaps(ctx).get(actorId);
  if (!owed || owed.followed || (token !== undefined && owed.token !== token)) return;
  const actor = ctx.stage.actor(actorId) as { setPose(n: string): void; pose?: string } | undefined;
  // not over a painting the figure has taken since (a hurt, an idle another motion put up): only the strike's own painting is swapped
  if (odKeyHolds(ctx, actorId) || (actor?.pose !== undefined && actor.pose !== 'attack' && actor.pose !== 'ready')) {
    marksSwaps(ctx).delete(actorId);
    return;
  }
  const follow = keysOn(ctx) && ctx.stage?.paints?.(actorId, 'follow') === true;
  actor?.setPose(follow ? 'follow' : 'idle');
  if (follow) owed.followed = true; // the strike's `end` mark (home, at rest) owes the idle
  else marksSwaps(ctx).delete(actorId);
}

/** The strike is home (its `end` mark): the figure that stood in the follow-through goes to the idle, by the plain blend (it is at rest). */
export function settleDone(ctx: EventCtx, actorId: CombatantId, token?: number): void {
  const owed = marksSwaps(ctx).get(actorId);
  if (!owed || !owed.followed || (token !== undefined && owed.token !== token)) return;
  marksSwaps(ctx).delete(actorId);
  const actor = ctx.stage.actor(actorId) as { setPose(n: string): void; pose?: string } | undefined;
  if (actor && (actor.pose === undefined || actor.pose === 'follow')) actor.setPose('idle'); // not over a menu's ready or a new action's painting
}

/**
 * `actionEnd`'s idle. With the new curves the strike's own marks owe the way out (`follow` on `settlePeak`, `idle` at the `end`): the action usually ends a little BEFORE the fastest frame of
 * the way home, and an idle put up then would skip the follow-through and cut at 60 percent of the peak speed. So the swap waits for the marks, and the net ({@link MARKS_NET_MS}) does it when they
 * never come. Everything else (today's game, a figure with no strike) is the immediate idle it always was.
 */
export function idleAtEnd(ctx: EventCtx, actor: { setPose(n: string): void } | undefined, id: CombatantId | null | undefined): void {
  const owed = id ? marksSwaps(ctx).get(id) : undefined;
  if (!id || !owed) {
    actor?.setPose('idle');
    return;
  }
  void ctx.sleep(MARKS_NET_MS).then(() => {
    if (marksSwaps(ctx).get(id) !== owed) return; // the marks did it, or a later attack took over
    marksSwaps(ctx).delete(id);
    actor?.setPose('idle');
  });
}
