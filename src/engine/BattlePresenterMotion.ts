/**
 * A game's own motion around an action's house beats: the port and the two
 * calls the beats make (`BattlePresenterBeats.ts` `actionStart` / `actionEnd`).
 *
 * Shared plumbing (both + FF7), additive: a presenter with no `actionMotion`
 * in its deps (every FFX chapter) plays exactly as before. FF7 supplies it
 * (`src/app/screens/BattleScreenFf7Motion.ts`): a melee attacker runs to the
 * target before the blow and back after it, and the boss's physical moves get a
 * lunge or a recoil. FFX-2 supplies a smaller one since r38-motion (RUN-IN,
 * `src/app/screens/BattleScreenRunIn.ts`: `strike`, `close`, `lungeFor`,
 * `longRange` only; sourced for FFX-2, none for FFX).
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
  /**
   * Play nothing: REDUCE MOTION is on or, FFX-2 only, a command menu is open (r38-motion, `motion/MotionGate.ts`).
   * A step that still has to happen (the run home) snaps instead of playing. Absent reads as false.
   */
  readonly still?: boolean;
}

/** A game's motion around each action. Both calls may resolve at once (nothing to do). */
export interface ActionMotionPort {
  /** At `action-start`, after the pose is set and before the house wind-up: e.g. run to the strike point. */
  open(event: ActionStartEvent, ctx: MotionCtx): Promise<void> | void;
  /** At `action-end`, before the frame returns to neutral: e.g. run back home. */
  close(actorId: CombatantId, ctx: MotionCtx): Promise<void> | void;
  /**
   * RUN-IN (r38-motion, FFX-2 only): at `action-start`, after the shot has opened and before the house strike, the
   * figure runs to its target. Called only when the presenter's gate allows the look (`motion/MotionGate.ts`);
   * `pose` is the pose the action drew. Optional: FFX and FF7 have none.
   */
  strike?(event: ActionStartEvent, ctx: MotionCtx, pose: string): Promise<void> | void;
  /**
   * How far the house strike's lunge carries `actorId` now, world units, when she has run in and only the blow is
   * left (`undefined` = she has not: the lunge is today's 1.4 from where she stands).
   */
  lungeFor?(actorId: CombatantId): number | undefined;
  /**
   * Does `actorId` fire from where she stands? FFX-2: a long-range dressphere (Gunner, Gun Mage, Lady Luck,
   * Alchemist, Trainer; `research/ffx2-combat-core.md` section 1), so her shot flies instead of her running in
   * (`motion/SkillTravel.ts`).
   */
  longRange?(actorId: CombatantId): boolean;
  /** True when this action's wind-up is the game's own (painted key poses): the house lunge and squash stay out. */
  ownsWindUp?(event: ActionStartEvent): boolean;
  /** The game's own victory moment in place of the house `victory` pose (FF7's D1 win poses and hold). */
  victory?(ctx: MotionCtx): Promise<void>;
  /** The game's own wipe-out moment after the party's KO poses (FF7's G1 pan up). */
  defeat?(ctx: MotionCtx): Promise<void>;
  /** An enemy's KO in place of the house dissolve (FF7's boss death, repair item 8). Resolves when it has gone. */
  sendOff?(id: CombatantId, ctx: MotionCtx): Promise<void>;
  /** A party member's KO, after the house `ko` pose: FF7 lays the fighter down at once (repair item 4). */
  ko?(id: CombatantId, ctx: MotionCtx): Promise<void> | void;
  /** True: a boss's form change swaps its painting under the flash with no see-through fade (FF7's raised tail). */
  readonly opaqueForms?: boolean;
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
