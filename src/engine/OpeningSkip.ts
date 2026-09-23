/**
 * A Confirm press cuts the battle's opening sweep short (PR-0061).
 *
 * ## The intended length of the opening beat
 *
 * At `speed: 'normal'` the opening (`BattleMoments.battleStart`, authored in
 * `MOMENT_TIMING`) is meant to run about **3.8 s**: the party slides in
 * (`openSlide` 520 ms, the last of three members 140 ms later), the frame
 * settles on `idle` (`openHold` 240), the camera moves onto the boss
 * (`revealPush` x 0.55 = 825) and holds on the name plate (`revealSlab` 1400
 * plus its 260 ms exit), then eases back out (`returnOut` 620 for the release
 * and 620 for the move home). It follows the battle-start card, which a press
 * already dismisses (`BattleStartBanner`, 1.9 s at most). A first-time player
 * is meant to see all of it; a returning player should not have to.
 *
 * ## What a press does
 *
 * The same thing the cutscene skip does for a cutscene: it ends the beat.
 * The camera cuts to `idle` and any held push is let go, the reveal plate
 * comes down, and every wait left in the opening collapses to zero
 * (`BattleMoments.hurry`), so the fight goes straight on to its first decision.
 * The FFX CTB order and the FFX-2 ATB fill are untouched: the battle is not
 * made to start any sooner than the engine says, only the presentation stops.
 *
 * Pure like the rest of the presenter (hard rule 1): the key watch is the
 * `MomentsPort.confirmPress` port, implemented in `ui/common/transitions/`.
 * Presenter plumbing, so **both games** (CHK-020).
 */

import type { EventCtx } from './BattlePresenterEvents.ts';

/** Run the opening moment `run`, ending it early on the player's first Confirm press. */
export async function playOpening(ctx: EventCtx, run: () => Promise<void>): Promise<void> {
  const port = ctx.deps.moments;
  const press = ctx.speed() === 'skip' ? null : (port?.confirmPress?.() ?? null);
  if (!press) return run();

  let skipped = false;
  const opening = run();
  void press.pressed.then(() => {
    if (skipped) return;
    skipped = true;
    ctx.moments.hurry = true;
    const idle = ctx.moments.pick('idle');
    if (idle) ctx.stage.camera.snapTo(idle);
    void ctx.stage.camera.release?.(0);
    port?.clear();
  });
  try {
    await opening;
  } finally {
    press.dispose();
    ctx.moments.hurry = false;
  }
}
