/**
 * A battle that opens hurried (PR-0061; **both games**: the opening card and sweep are shared presenter plumbing,
 * CHK-020; chapters 1-3 are FFX, 4 and 5 FFX-2).
 *
 * The round-19 finding: a player who holds Confirm to skip the pre-scene still waits 11 to 12 s from the scene's start
 * for the first menu, because the battle then plays its whole authored opening: the swirl and load, the card (1.9 s) and
 * the sweep (3.8 s at the original camera, 6.0 s with the calm camera and steady pacing). The same file already says
 * who the sweep is for: "A first-time player is meant to see all of it; a returning player should not have to"
 * (`engine/OpeningSkip.ts`), and a Confirm press ends it. A player who has just skipped the scene has said the same
 * thing without a second press: the press is made for them, once, at the start of the **first** link's opening.
 *
 * What hurried means, and what it leaves alone:
 *
 * - the card still shows (it is the chapter's name and the loading cover), but for {@link HURRIED_CARD_HOLD_MS}
 *   instead of 1.9 s; a press still dismisses it at once;
 * - the sweep is the one a Confirm press produces: the camera cuts to `idle`, any held push is let go, the name plate
 *   comes down, every wait left in the opening collapses (`BattleMoments.hurry`);
 * - the fight itself is untouched (CTB order, ATB fill, an enemy that acts first still acts), and so is every chained
 *   link's opening after the first (a seam keeps its authored opening; PR-0301 is Bailey's call);
 * - a player who plays the scene through, or reaches the battle with no scene (a retry, the debug `gotoChapter`), gets
 *   the full opening exactly as before.
 *
 * One-shot: {@link OpeningHurry.take} answers true once and then false.
 */

/** How long the battle-start card holds when the opening is hurried (the full card holds `BATTLE_START_HOLD_MS`, 1.9 s). */
export const HURRIED_CARD_HOLD_MS = 700;

export class OpeningHurry {
  private armed = false;

  /** Ask for the next opening to run hurried. */
  arm(on = true): void {
    this.armed = on;
  }

  /** Is the opening hurried? Read without using it up (the card asks before the opening does). */
  get pending(): boolean {
    return this.armed;
  }

  /** Is the opening hurried? True once; the answer is used up. */
  take(): boolean {
    const was = this.armed;
    this.armed = false;
    return was;
  }
}
