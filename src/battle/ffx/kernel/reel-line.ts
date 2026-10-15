/**
 * Wakka's Reels, the game's line classifier: what one line of three symbols makes.
 *
 * **Game case: FFX only** (FFX-2's Lady Luck is a different machine with its own pay table). Source: FFX.exe, Steam build 25501027,
 * SHA-256 0537B2A1...686D; the private note `FFX-G01` section 7. The classifier is VA 0x007B1710 (with the symbol counter 0x007B1E40),
 * called four times, once for each of the four lines of the reel result entry `MsSetReelResult` (0x007B1B50). Proven against the game's
 * own machine code run in an emulator (`tests/unit/parity-ffx-minigames.test.ts`, vectors in `tests/fixtures/parity/ffx/reel_line.json`:
 * every triple of 17 symbol numbers, plus random lines; 10,913 lines and 24,000 counter calls were run, 0 mismatches).
 *
 * The classifier works on symbol NUMBERS, in this order (the first test that holds wins):
 *  - a line holding symbol 0xFF is nothing: result 0, no hit;
 *  - three of symbol 10: result 15 (the Aurochs shot). A PAIR of 10 is not a match;
 *  - three of symbol 0, 1, 2 or 3: result 2, 4, 6 or 8 (the all-enemies shot of Fire, Ice, Water, Thunder);
 *  - a pair of 0, 1, 2 or 3: result 1, 3, 5 or 7 (the single-target shot);
 *  - three of symbol 7, 8 or 9: result 10, 12 or 14; a pair: 9, 11 or 13 (Havoc, Time, Break);
 *  - then the Attack Reels: three of symbol 6 is result 17 with 12 hits; three of 5, result 17 with 6 hits; no 5 and no 6, result 16
 *    (Power Shot), 1 hit; otherwise result 17 with `count(5) + 2 * count(6)` hits.
 * Every other result carries 1 hit. Result ids 1 to 17 map to command records `0x30EF` onward (see the note); what the symbols 4
 * and "Miss" are, which numbers the pictures carry, and what the Wakka script passes as the four lines are NOT established (note,
 * open questions 1 to 3), so this module is not yet wired to the reel overlay.
 *
 * Pure, DOM-free, deterministic.
 */

/** The symbol a line carries when a reel never stopped (an invalid line). */
export const REEL_NONE = 0xff;

/** What a line makes: the result id (0 to 17) and its hit count. */
export interface ReelLine {
  result: number;
  hits: number;
}

function count(line: readonly number[], symbol: number): number {
  let n = 0;
  for (const s of line) if (s === symbol) n += 1;
  return n;
}

/** The result id and hit count of one line of three symbol numbers (bytes). */
export function classifyReelLine(line: readonly [number, number, number]): ReelLine {
  if (count(line, REEL_NONE) !== 0) return { result: 0, hits: 0 };
  if (count(line, 10) > 2) return { result: 15, hits: 1 };
  for (let i = 0; i < 4; i++) if (count(line, i) > 2) return { result: 2 * (i + 1), hits: 1 };
  for (let i = 0; i < 4; i++) if (count(line, i) > 1) return { result: 2 * i + 1, hits: 1 };
  for (let s = 7; s <= 9; s++) if (count(line, s) > 2) return { result: 10 + 2 * (s - 7), hits: 1 };
  for (let s = 7; s <= 9; s++) if (count(line, s) > 1) return { result: 9 + 2 * (s - 7), hits: 1 };
  const fives = count(line, 5);
  const sixes = count(line, 6);
  if (sixes > 2) return { result: 17, hits: 12 };
  if (fives > 2) return { result: 17, hits: 6 };
  if (fives < 1 && sixes < 1) return { result: 16, hits: 1 };
  return { result: 17, hits: fives + sixes * 2 };
}
