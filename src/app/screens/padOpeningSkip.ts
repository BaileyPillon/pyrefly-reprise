/**
 * A gamepad's A or Start ends the battle's opening sweep, as Enter does (release 62, PR-0481, the conference booth; BOTH games: shared presenter and input plumbing, FFX Chapter I and FFX-2 Chapter IV
 * are the demo's two fights).
 *
 * ## What was wrong
 *
 * The opening (`BattleMoments.battleStart`, about 6.6 s of camera sweep after the 1.9 s boss card on the booth's two fights) ends early on the player's first Confirm press
 * (`engine/OpeningSkip.ts`). That press was read from the KEYBOARD only (`ui/common/transitions/confirmPress.ts`: a `keydown` listener): the gamepad is polled by `app/Input.ts`, which the
 * presenter's ports cannot reach. So a visitor with a pad, the booth's recommended device, could dismiss the card with A and then had to sit out the sweep; round 28's deep review of release 61
 * timed the pad visitor's A press to the first command at 12 to 14 s.
 *
 * ## What this does
 *
 * `BattleScreen.handleInput` already owns the frame's `Input` snapshot, so it hands the pad's press to the one object that holds the opening's watch (`MomentOverlay.pressConfirm`). The press is taken
 * from the snapshot (`consume`): Start is also the pad's pause button, and the boss card above already treats it the same way (any confirm, cancel or start press takes the card down and nothing else
 * sees it). Only a PAD press counts (`lastDevice`): a keyboard press already reached the watch through its own listener, and E / C, which `Input` maps to `start`, belong to the enemy-move slab.
 * Nothing else about the opening changes: the same hurry, the same snap to the idle shot, the same collapse of every wait left.
 */

import type { InputSnapshot } from '../Input.ts';

/** The slice of `MomentOverlay` this needs. */
export interface OpeningWatch {
  readonly confirmWaiting: boolean;
  pressConfirm(): boolean;
}

/** True when a pad press ended the opening this frame. Takes the A / Start edge from the snapshot only while an opening is waiting for one. */
export function padEndsOpening(input: Pick<InputSnapshot, 'lastDevice' | 'consume'>, watch: OpeningWatch | null | undefined): boolean {
  if (!watch?.confirmWaiting || input.lastDevice !== 'gamepad') return false;
  const confirm = input.consume('confirm');
  const start = input.consume('start'); // both are taken: A and Start together must not leave Start to open the pause
  if (!confirm && !start) return false;
  return watch.pressConfirm();
}
