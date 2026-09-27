/**
 * A game's own motion around an action's house beats: the port and the two
 * calls the beats make (`BattlePresenterBeats.ts` `actionStart` / `actionEnd`).
 *
 * Shared plumbing (both + FF7), additive: a presenter with no `actionMotion`
 * in its deps (every FFX and FFX-2 chapter) plays exactly as before. FF7 is the
 * one game that supplies it (`src/app/screens/BattleScreenFf7Motion.ts`): a
 * melee attacker runs to the target before the blow and back after it, and the
 * boss's physical moves get a lunge or a recoil.
 *
 * Like the rest of the presenter this imports no `three` and no DOM (hard rule 1).
 */

import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import type { BattleStage, PlaybackSpeed } from './BattlePresenterPorts.ts';

export type ActionStartEvent = Extract<BattleEvent, { type: 'action-start' }>;

/** What a motion step may use: the field, the playback speed, the presenter's clock. */
export interface MotionCtx {
  readonly stage: BattleStage;
  readonly speed: PlaybackSpeed;
  sleep(ms: number): Promise<void>;
}

/** A game's motion around each action. Both calls may resolve at once (nothing to do). */
export interface ActionMotionPort {
  /** At `action-start`, after the pose is set and before the house wind-up: e.g. run to the strike point. */
  open(event: ActionStartEvent, ctx: MotionCtx): Promise<void> | void;
  /** At `action-end`, before the frame returns to neutral: e.g. run back home. */
  close(actorId: CombatantId, ctx: MotionCtx): Promise<void> | void;
  /** True when this action's wind-up is the game's own (painted key poses): the house lunge and squash stay out. */
  ownsWindUp?(event: ActionStartEvent): boolean;
  /** The game's own victory moment in place of the house `victory` pose (FF7's D1 win poses and hold). */
  victory?(ctx: MotionCtx): Promise<void>;
  /** The game's own wipe-out moment after the party's KO poses (FF7's G1 pan up). */
  defeat?(ctx: MotionCtx): Promise<void>;
}

/** How long a game's victory or defeat moment may take before playback moves on without it, ms (a guard). */
export const MOMENT_GUARD_MS = 9_000;

/** How long a motion step may take before playback moves on without it, ms (a guard, never the timing). */
export const MOTION_GUARD_MS = 1_600;

/** Real milliseconds for a step of `ms` at this playback speed (`'skip'` lands at once). */
export function motionMs(ms: number, speed: PlaybackSpeed): number {
  if (speed === 'skip') return 1;
  return Math.max(1, Math.round(ms * (speed === 'fast' ? 0.32 : 1)));
}
