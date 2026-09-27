/**
 * The FFX-2 enemy-move slab waits for the battle's opening (critic round 13
 * PR-0146).
 *
 * The HUD is mounted and synced before the presenter plays the battle-start
 * moment, so the slab rendered over the scene-to-battle crossfade (Chapter IV:
 * "Curse" over the fading title card at 363 ms). No new presenter hook is
 * needed: the moment already takes the HUD down and hands it back
 * (`BattleMoments.setHudVisible`), and the first decision arrives through
 * `chooseCommand`. The slab is held until the first of those two, and the
 * pause screen's own suspension (PR-0122) is folded in so a pause during the
 * opening cannot release it early.
 *
 * **Game case: FFX-2 only** (the FFX-2 HUD's slab).
 */
export class IntentOpeningHold {
  private held = true;
  private sawHidden = false;
  private paused = false;

  constructor(private readonly apply: (suspended: boolean) => void) {}

  /** Mount: the slab starts held. */
  start(): void {
    this.push();
  }

  /** The HUD's `setVisible`: released when the HUD is handed back after the moment took it down. */
  visible(on: boolean): void {
    if (!on) this.sawHidden = true;
    else if (this.sawHidden) this.release();
  }

  /** The first command menu opened: the opening is over whatever else happened. */
  decision(): void {
    this.release();
  }

  /** The pause screen's suspension (`setIntentSuspended`). */
  pause(on: boolean): void {
    this.paused = on;
    this.push();
  }

  private release(): void {
    if (!this.held) return;
    this.held = false;
    this.push();
  }

  private push(): void {
    this.apply(this.held || this.paused);
  }
}
