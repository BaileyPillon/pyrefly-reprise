/**
 * The moments' numbers and their dependencies: the authored timings, the push fractions, the attack roll, the heartbeat tempo, the ports a battle hands the
 * shot picker (`BattleMoments.ts` re-exports all of it, so every import keeps working).
 *
 * Split out of `BattleMoments.ts` by a pure move (ChatGPT's point 8b, 2026-10-28; both games): nothing here changed.
 */

import type { AudioPort, BattleStage, MomentsPort, PlaybackSpeed } from './BattlePresenterPorts.ts';
import type { StagingPort } from './pro/staging/StagingPort.ts';

/** Authored durations, in ms at `speed: 'normal'`. The one place to tune. */
export const MOMENT_TIMING = {
  /** Battle start: the party's slide-in, then the hold before the boss push. */
  openSlide: 520,
  openHold: 240,
  /** Boss reveal: how long the slow push on the boss runs, and its name plate. */
  revealPush: 1500,
  revealSlab: 1400,
  /** Per action. */
  actionIn: 300,
  /** A spell holds on its caster before the cut; a sword swing does not. */
  castHold: 420,
  returnOut: 620,
  /** Overdrive. */
  odLetterbox: 260,
  odSlab: 1250,
  odPush: 900,
  odOut: 520,
  /** Boss charge telegraph. */
  telegraphZoom: 1200,
  telegraphSlab: 1200,
  /** Form change: the hold on the boss around the flash. */
  formHold: 900,
  /** Victory. */
  victoryIn: 900,
} as const;

/** How far each moment dollies in, as a fraction of the subject distance. */
export const MOMENT_PUSH = {
  action: 0.06,
  /** Spec "Motion & camera": 8deg push-in on Overdrive — a dolly, not an FOV
   * change (the texel ratio has to stay put, visual-bible §6.3), so it is
   * expressed here as the distance fraction that subtends the same amount. */
  overdrive: 0.14,
  telegraph: 0.1,
  reveal: 0.12,
} as const;

/** Spec "Motion & camera": "-4deg roll on every attack". */
export const ATTACK_ROLL_DEG = -4;

/**
 * The heartbeat a charge telegraph throbs at, per stage. Stage 2 — the attack
 * lands next turn — is a frightened pulse.
 *
 * Lives here rather than with the banner because two surfaces beat on it and
 * they must agree: this module's vignette ({@link BattleMoments.telegraph})
 * and the HUD's screen border (`src/ui/ffx/TelegraphBanner.ts`, which imports
 * it). They were the same two numbers written out twice until the drift was
 * obvious enough to fix.
 */
export const TELEGRAPH_BPM: Readonly<Record<1 | 2, number>> = { 1: 84, 2: 132 };

export interface MomentDeps {
  stage: BattleStage;
  moments?: MomentsPort | null;
  /** Lane "pro-staging": the staging's layer, which takes the Overdrive's opening (a small name, a light change) in place of the banner when its `opening` piece is on. */
  staging?: StagingPort | null;
  audio?: AudioPort | null;
  /**
   * The battle HUD, for the *one* thing a moment does to it: the opening keeps
   * it down until the encounter has established itself (see
   * {@link BattleMoments.battleStart}). Optional like every other port.
   */
  hud?: { setVisible(visible: boolean): void } | null;
  /** Speed-scaled sleep. The presenter's own, so a moment obeys fast/skip. */
  sleep(ms: number): Promise<void>;
  /** Live playback speed — read per call, because it can change mid-battle. */
  speed(): PlaybackSpeed;
}

/** A rig change shorter than this is indistinguishable from a cut. */
export const CUT_THRESHOLD_MS = 24;
