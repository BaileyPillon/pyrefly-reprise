/**
 * The presenter's half of the item gesture: an item use draws the game's own picture, not a flask. Two cases, one per game (AGENTS.md rule 14); the chapter's deps say which (`itemGesture`).
 *
 * **FFX only: `'orb'`** (`research/re-ffx-party-motion-timing.md` section 6, label [M], read frame by frame on the Steam copy on 2026-10-19): the game draws no flask and no object when an item is used. The gesture depends on
 * the TARGET, not the character: on an ally a green orb of light rises from the user's hand, the user tosses it overhand, and sparkles fall on the target; on the user a green glow gathers around the user. The painted item
 * pose of the party holds a glass flask, so in an FFX chapter the user stands in a stance with no flask in it (`ItemGestureTable.ts`) and the stage draws the orb (`VfxPort.itemToss`) or the glow (`VfxPort.itemGlow`).
 * Timing: the orb forms over the hand for {@link ITEM_ORB}`.formMs` and flies for `flightMs`, and the action holds for both (what today's 380 ms `actionStart` wait held for the item pose); the heal's own
 * effect and numeral then begin as the sparkles burst, exactly where they began before. On the user the action holds `selfWaitMs` and the glow keeps rising under the heal.
 *
 * **FFX-2 only: `'spark'`** (the RE session's live check of the real FFX-2, label [M], driver decision 147): the camera stays wide, the user makes a short gesture toward the target; on an ally a small object is seen
 * landing near the target (a quick short toss), on the user a quick self gesture; either way it ends in a white-blue sparkle burst on the target. No green orb. So the stage tosses a small white-blue spark in half the
 * orb's flight with no trail (or, on the user, only bursts), the pose is the one the action always had (a dressphere's item painting falls to its idle, D-179) and the wait is today's 380 ms: nothing is added.
 *
 * FF7 and a stage with no `itemStance` (a test fake, the 3D hidden chapter's) keep what they had. The engine is untouched: this is only how long the presenter's own `actionStart` waits, and nothing here draws a random number.
 *
 * No `three`, no DOM, ports only (hard rule 1).
 */

import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { ITEM_ORB, ITEM_SPARK } from './ItemGestureTable.ts';

type ActionStart = Extract<BattleEvent, { type: 'action-start' }>;

/** What an FFX item use plays. */
export interface ItemGesture {
  /** The pose the user holds: FFX, one with no flask in it; FFX-2, the one the action always had. */
  readonly pose: string;
  /** `orb`: FFX's; `spark`: FFX-2's. */
  readonly style: 'orb' | 'spark';
  /** `toss`: an orb (a spark) to the ally (or the foe); `self`: a glow around the user (a burst on the user). */
  readonly kind: 'toss' | 'self';
  /** Who the orb flies to (`toss` only). */
  readonly targets: readonly CombatantId[];
  /** Green for an ally, amber for a foe. */
  readonly tone: 'heal' | 'foe';
  /** True when the stage draws the light (false under REDUCE MOTION, at `'skip'` speed, or on a stage that cannot draw it: only the stance changes). */
  readonly fx: boolean;
  /** Milliseconds (presenter pace) the action holds before the heal's own effect begins; null: the usual `actionStart` wait. */
  readonly waitMs: number | null;
}

/** The gesture an `action-start` plays, or null: not an FFX item use of a party member, or a stage with no hand for this figure (it draws as before). */
export function itemGestureFor(ctx: EventCtx, event: ActionStart): ItemGesture | null {
  const style = ctx.deps.itemGesture;
  if (event.command.kind !== 'item' || (style !== 'orb' && style !== 'spark')) return null;
  if (ctx.stage.sideOf(event.actorId) !== 'party') return null;
  const pose = style === 'orb' ? ctx.stage.itemStance?.(event.actorId) : 'item'; // FFX: no flask (and none at all where the stage has no hand for the figure); FFX-2: the pose it always had
  if (pose === undefined) return null;
  const targets = event.targets;
  const self = targets.length > 0 && targets.every((id) => id === event.actorId);
  const draws = ctx.moments?.reducedMotion !== true && ctx.speed() !== 'skip' && (self ? ctx.stage.vfx.itemGlow : ctx.stage.vfx.itemToss) !== undefined && targets.length > 0;
  const tone = ctx.stage.sideOf(targets[0] ?? '') === 'enemy' ? 'foe' : 'heal';
  const waitMs = !draws || style === 'spark' ? null : self ? ITEM_ORB.selfWaitMs : ITEM_ORB.formMs + ITEM_ORB.flightMs; // FFX-2's spark is over inside today's wait: nothing is added
  return { pose, style, kind: self ? 'self' : 'toss', targets, tone, fx: draws, waitMs };
}

/** Start the light (the stage clocks it itself; the presenter only waits `waitMs`). */
export function startItemGesture(ctx: EventCtx, event: ActionStart, g: ItemGesture): void {
  if (!g.fx) return;
  const spark = g.style === 'spark';
  if (g.kind === 'self') ctx.stage.vfx.itemGlow?.(event.actorId, { formMs: spark ? ITEM_SPARK.selfFormMs : ITEM_ORB.selfFormMs, ...(spark ? { style: 'spark' as const } : {}) });
  else ctx.stage.vfx.itemToss?.(event.actorId, g.targets, { formMs: spark ? ITEM_SPARK.formMs : ITEM_ORB.formMs, flightMs: spark ? ITEM_SPARK.flightMs : ITEM_ORB.flightMs, tone: g.tone, ...(spark ? { style: 'spark' as const } : {}) });
}
