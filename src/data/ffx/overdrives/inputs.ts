/**
 * What the player is asked to press for each Bushido (**FFX only**: Auron's Bushido exists only in FFX; FFX-2 has none).
 *
 * ## The game's order (re-parity RC9, lane FFX-A; Bailey 2026-10-11 "all your recommendations", plan question Q1, D-763)
 *
 * The four sequences are the game's own: `FFX-G01` section 6.3 reads them from the exe's table (VA 0x00C86B70) and the game's controller
 * (VA 0x00890F70) was run over scripted presses in an emulator, 1,984 scripts, 0 mismatches (`tests/unit/parity-ffx-minigames.test.ts`). The
 * kernel (`battle/ffx/kernel/minigame-bushido.ts`) holds them as the pad words of the PS2 layout the game keeps (0x10 Triangle, 0x20 Circle, 0x40
 * Cross, 0x80 Square, 0x04 L1, 0x08 R1, 0x1000 Up, 0x2000 Right, 0x4000 Down, 0x8000 Left); this file names the same buttons the way the overlay
 * does (`src/ui/ffx/rawInput.ts`: `confirm` is Cross, `cancel` is Circle), and `parity-ffx-engine-minigames.test.ts` pins every input of the
 * four sequences against the note's own table.
 *
 * | Bushido | Length | The game's order |
 * |---|---:|---|
 * | Shooting Star | 7 | Triangle, Cross, Square, Circle, Left, Right, Circle |
 * | Dragon Fang | 8 | Down, Left, Up, Right, L1, R1, Cross, Circle |
 * | Banishing Blade | 7 | Up, L1, Down, R1, Right, Left, Triangle |
 * | Tornado | 6 | Circle, Right, R1, Left, L1, Triangle |
 *
 * Three of the four changed from the GameFAQs order Bailey picked on 2026-10-03: Dragon Fang's last two inputs are swapped, Shooting Star's
 * second and seventh inputs are Cross and Circle (they were Circle and Cross), and Tornado opens with Circle (it opened with Cross).
 * Banishing Blade was the same in every source and still is. The exe settles what the guides disagreed on (the "International" order of
 * FW-BU and XU) once its bits are read in the PS2 layout; on the Steam PC build the live pad word was measured on 2026-10-13 (Circle is the
 * Enter or C key there, Cross Backspace or X), so the order is what the game checks, whichever key a port binds to a bit.
 *
 * A wrong press sends the progress back to the first input, the timer keeps running, and the wrong press is not tried as the first input
 * (the kernel, `FFX-G01` section 6.3). The lengths are the sourced 8 / 7 / 7 / 6.
 */

import { Pad, BushidoCategory, bushidoMove } from '../../../battle/ffx/kernel/minigame-bushido.ts';

/** A Bushido input, in the overlay's own button names. */
export type BushidoInput = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'triangle' | 'square' | 'l1' | 'r1';

/** The overlay's button name of each pad word a sequence uses (`confirm` is Cross, `cancel` is Circle). */
export const BUSHIDO_INPUT_OF_WORD: Readonly<Record<number, BushidoInput>> = {
  [Pad.Up]: 'up',
  [Pad.Down]: 'down',
  [Pad.Left]: 'left',
  [Pad.Right]: 'right',
  [Pad.Cross]: 'confirm',
  [Pad.Circle]: 'cancel',
  [Pad.Triangle]: 'triangle',
  [Pad.Square]: 'square',
  [Pad.L1]: 'l1',
  [Pad.R1]: 'r1',
};

function sequenceOf(category: number): readonly BushidoInput[] {
  return bushidoMove(category).words.map((w) => BUSHIDO_INPUT_OF_WORD[w] as BushidoInput);
}

/** Bushido sequences by ability id: the game's, read from the kernel's pad words. */
export const BUSHIDO_SEQUENCES: Readonly<Record<string, readonly BushidoInput[]>> = {
  'dragon-fang': sequenceOf(BushidoCategory.DragonFang),
  'shooting-star': sequenceOf(BushidoCategory.ShootingStar),
  'banishing-blade': sequenceOf(BushidoCategory.BanishingBlade),
  tornado: sequenceOf(BushidoCategory.Tornado),
};
