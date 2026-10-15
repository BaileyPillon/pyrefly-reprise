/**
 * Auron's Bushido, the game's controller: an exact button sequence against a time limit, one frame at a time.
 *
 * **Game case: FFX only** (FFX-2 has no Bushido). Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D; the private note
 * `FFX-G01` sections 6.1 and 6.3. The controller is VA 0x00890F70 (set-up 0x00897970 and 0x00898AD0, sequences at 0x00C86B70, limits at
 * 0x00C86B60, limit timer 0x00891AC0, see `./minigame-timer.ts`). Proven against the game's own machine code run in an emulator over
 * scripted presses (`tests/unit/parity-ffx-minigames.test.ts`, vectors in `tests/fixtures/parity/ffx/minigame_bushido.json`: 1,984 scripts,
 * with and without the PAL tick rate, 0 mismatches against an independent model).
 *
 * What the game does, per frame (the frame counter starts at 1 on the first frame the controller is in its input state):
 *  1. The timer runs first. If the value before this frame's tick is not above 0 the move FAILS (grade 0, A = 0).
 *  2. If the pad's pressed-edge word of the newest sample is not 0 it is compared AS A WHOLE WORD with the sequence's word at the current
 *     index. Equal: the index goes up by one, and when it reaches the sequence length the move SUCCEEDS (grade 1, A = the timer value
 *     after this frame's tick, `limit - frame / 30`). Not equal (two buttons at once included): a sound plays and the index goes back
 *     to 0 while the timer keeps running. The wrong press is NOT tried as the first input. There is no other penalty; one press is
 *     taken a frame.
 *
 * The words are the pad bits of the PS2 layout the game keeps (`Pad`): 0x10 Triangle, 0x20 Circle, 0x40 Cross, 0x80 Square, 0x04 L1,
 * 0x08 R1, 0x1000 Up, 0x2000 Right, 0x4000 Down, 0x8000 Left. On the Steam PC build the live pad word is that bit in both 16-bit halves,
 * and the keys behind them were read (2026-10-13, `docs/handoff/re-parity-rc9-ffx-overdrives.md`): the order of the sequences is what
 * the game checks, whichever key a port binds to a bit.
 *
 * The four sequences (category byte `Cmd+0x58`): Shooting Star 0x22 (7 inputs, 4 s), Dragon Fang 0x32 (8, 4 s), Banishing Blade 0x42
 * (7, 4 s), Tornado 0x52 (6, 3 s).
 *
 * Pure, DOM-free, deterministic.
 */

import { timerA } from './minigame-timer.ts';

/** The pad bits the sequences use (the PS2 pad layout the game's pad word keeps). */
export const Pad = {
  L1: 0x04,
  R1: 0x08,
  Triangle: 0x10,
  Circle: 0x20,
  Cross: 0x40,
  Square: 0x80,
  Up: 0x1000,
  Right: 0x2000,
  Down: 0x4000,
  Left: 0x8000,
} as const;

/** The Overdrive family byte of the four Bushido moves. */
export const BushidoCategory = { ShootingStar: 0x22, DragonFang: 0x32, BanishingBlade: 0x42, Tornado: 0x52 } as const;

/** One Bushido: its time limit (seconds) and the pad words in order. */
export interface BushidoMove {
  limit: number;
  words: readonly number[];
}

const P = Pad;

/** The sequences at 0x00C86B70 and the limits at 0x00C86B60, read from the game's tables. */
const MOVES: Readonly<Record<number, BushidoMove>> = {
  [BushidoCategory.ShootingStar]: { limit: 4.0, words: [P.Triangle, P.Cross, P.Square, P.Circle, P.Left, P.Right, P.Circle] },
  [BushidoCategory.DragonFang]: { limit: 4.0, words: [P.Down, P.Left, P.Up, P.Right, P.L1, P.R1, P.Cross, P.Circle] },
  [BushidoCategory.BanishingBlade]: { limit: 4.0, words: [P.Up, P.L1, P.Down, P.R1, P.Right, P.Left, P.Triangle] },
  [BushidoCategory.Tornado]: { limit: 3.0, words: [P.Circle, P.Right, P.R1, P.Left, P.L1, P.Triangle] },
};

/** The four categories, in the game's table order. */
export const BUSHIDO_CATEGORIES: readonly number[] = [0x22, 0x32, 0x42, 0x52];

/** One move's limit and sequence (`category` 0x22, 0x32, 0x42 or 0x52). */
export function bushidoMove(category: number): BushidoMove {
  const m = MOVES[category];
  if (!m) throw new RangeError(`not a Bushido category: ${category}`);
  return m;
}

/** The controller's state between frames. */
export interface BushidoState {
  /** Frames processed so far (the next frame is `frame + 1`). */
  frame: number;
  /** How many inputs of the sequence are done: the index of the word the next press must be. */
  index: number;
  /** Wrong presses so far. */
  wrong: number;
}

/** What one frame decided. */
export type BushidoFrame =
  | { done: false; wrong: boolean }
  | {
      done: true;
      /** 1 for a finished sequence, 0 for the limit running out. */
      grade: 0 | 1;
      /** The timer value `A` passed with the result (float32 seconds): 0 on a fail. */
      a: number;
      frame: number;
    };

/** The state before the first frame. */
export function bushidoStart(): BushidoState {
  return { frame: 0, index: 0, wrong: 0 };
}

/**
 * One frame. `word` is the pad's pressed-edge word this frame (0 when nothing was pressed; two buttons at once is the OR of both bits).
 * Changes `state` in place. `wrong` on a pending frame says this frame's press was wrong (the index is already back at 0).
 */
export function bushidoFrame(state: BushidoState, move: BushidoMove, word: number, pal = false): BushidoFrame {
  state.frame += 1;
  const frame = state.frame;
  if (!(timerA(move.limit, frame - 1, pal) > 0)) return { done: true, grade: 0, a: 0, frame };
  if (word === 0) return { done: false, wrong: false };
  if (word === move.words[state.index]) {
    state.index += 1;
    if (state.index >= move.words.length) return { done: true, grade: 1, a: timerA(move.limit, frame, pal), frame };
    return { done: false, wrong: false };
  }
  state.wrong += 1;
  state.index = 0;
  return { done: false, wrong: true };
}
