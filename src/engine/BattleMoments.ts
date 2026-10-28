/**
 * The *moments*: every camera choreography the battle plays, in one place.
 *
 * FFX's battles are not one locked-off camera — they are a string of short,
 * named shots. The party slides in behind a swirl, the boss gets a slow push
 * and a name plate, every action punches in on the attacker and **cuts** to
 * the target on impact, a charged attack rides a slow zoom under a heartbeat
 * vignette, an Overdrive earns a letterbox and a slab, and the victory pose
 * gets its own rig before the results wipe.
 *
 * This module is the only thing that decides *which shot*. The handlers in
 * `BattlePresenterBeats.ts` used to carry three scattered `camera.moveTo`
 * calls and a boolean (`onActionRig`); everything camera-shaped has moved
 * here so a shot can be read, tuned and unit-tested as a whole.
 *
 * **Same rules as the rest of the presenter**: imports no `three` and touches
 * no DOM. The camera is a {@link CameraPort}, the letterbox/slab/vignette are
 * a {@link MomentsPort}, and both are optional — with neither wired the whole
 * module degrades to nothing happening, which is exactly what the headless
 * tests and `speed: 'skip'` want.
 *
 * ## Skipping
 *
 * Everything here is skippable, because the presenter's playback speed scales
 * every duration through {@link MomentDeps.speed}:
 *
 * - `'normal'` — authored timing.
 * - `'fast'` — 0.32x. Rig moves still happen (the frame would jump without
 *   them) but nothing *blocks*: slabs and letterbox holds resolve immediately.
 * - `'skip'` — no chrome at all, and every rig change becomes a hard snap, so
 *   a whole chapter resolves in milliseconds for e2e and the critic.
 */

import { MOMENT_TIMING } from './BattleMomentsConfig.ts';
import { BattleMomentsHeld } from './BattleMomentsHeld.ts';

// The numbers and the ports live in `BattleMomentsConfig.ts` (a pure move, 2026-10-28); every import of them from here keeps working.
export { ATTACK_ROLL_DEG, MOMENT_PUSH, MOMENT_TIMING, TELEGRAPH_BPM } from './BattleMomentsConfig.ts';
export type { MomentDeps } from './BattleMomentsConfig.ts';

/**
 * Picks and plays the shots. One instance per battle, owned by the presenter's
 * {@link import('./BattlePresenterEvents.ts').EventCtx}.
 */
export class BattleMoments extends BattleMomentsHeld {
  /**
   * The action is over: back to the neutral framing.
   *
   * A charge telegraph outlives the action it was raised in — that is the
   * whole point of it — so its vignette is only dropped once a *later* action
   * has ended, which mirrors the rule `FFXBattleHud` uses for the screen
   * border it raises from the same `charge` event.
   */
  async actionClose(): Promise<void> {
    this.rollOwed = false;
    const asked = this.ask((d) => d.actionClose?.({ ...this.shotCtx(), actor: this.open?.actor, action: this.open?.action }));
    const directed = asked instanceof Promise ? await asked : asked === true; // the director brings the frame back: the letterbox and the vignette still come down, with no release of ours
    if (this.overdriveOpen) await this.overdriveEnd(directed);
    if (this.telegraphOpen && this.actions > this.telegraphAtAction) await this.telegraphEnd(directed);
    this.open = null;
    if (directed) this.onActionRig = false;
    else await this.settle();
  }

  // ---------------------------------------------------------------- victory

  /** The party pose, on its own rig, under the fanfare. */
  async victory(): Promise<void> {
    this.onActionRig = false;
    const asked = this.ask((d) => d.victory?.(this.shotCtx()));
    const directed = asked instanceof Promise ? await asked : asked === true; // the director has the victory rig: an open telegraph's and Overdrive's chrome still comes down
    await this.telegraphEnd(directed);
    await this.overdriveEnd(directed);
    const rig = this.pick('victory', 'party', 'idle');
    if (this.skipping) {
      if (!directed) this.cut(rig);
      return;
    }
    if (directed) return;
    void this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
    await this.move(rig, MOMENT_TIMING.victoryIn);
  }

  /** Drop every layer this battle put up. Called when the screen leaves. */
  clear(): void {
    this.overdriveOpen = false;
    this.telegraphOpen = false;
    this.telegraphDirected = false;
    this.formDirected = false;
    this.open = null;
    this.revealed.clear();
    this.deps.moments?.clear();
    // An abort during the opening skips `battleStart`'s own restore, and a HUD
    // left hidden would follow the player into the next battle on this screen.
    this.setHudVisible(true);
  }
}
