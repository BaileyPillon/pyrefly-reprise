/**
 * The FFX CTB base table: one record per Agility, as the game reads it.
 *
 * **Game case: FFX only** (FFX-2 times its turns with its own ATB gauge). Source: FFX.exe, Steam build 25501027,
 * SHA-256 0537B2A1...686D. The exe reads this table at run time from the game's battle kernel data file
 * (ctb_base.bin: 255 records of 2 bytes, one section covering record numbers 0 to 254); the record reader is
 * 0x007ab870 and its two callers are 0x007909c0 (byte 0, the tick speed) and 0x00790990 (a pointer to the record,
 * whose byte 1 is read by the initial-CTB function 0x0078ded0). The record number is `clamp(AGI, 1, 255) - 1`,
 * so Agility 0 reads the record of Agility 1.
 *
 * The numbers below were read back through the exe's own code for every Agility from 1 to 255 (the emulator
 * run described in research/re-ffx-ctb-status.md section 0) and agree with the data file. They are game data,
 * kept as plain constants so a build does not need the data file. Nothing here is invented or smoothed.
 */

/** Byte 0 of each record: the tick speed for Agility `index + 1` (CTB ticks per rank point of an action). */
export const CTB_TICK_SPEED: readonly number[] = [
  28, 26, 24, 20, 16, 16, 15, 15, 15, 14, 14, 13, 13, 13, 12, 12, 11, 11, 10, 10, 10, 10, 9, 9,
  9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
];

/**
 * Byte 1 of each record: the inclusive bound of the opening jitter for Agility `index + 1`. A party member or
 * aeon starts a normal battle with `3 * tickSpeed - (draw % (bound + 1))`.
 */
export const CTB_ICV_BONUS: readonly number[] = [
  1, 1, 1, 1, 1, 2, 1, 2, 3, 1, 2, 1, 2, 3, 1, 2, 1, 2, 1, 2, 3, 4, 1, 2,
  3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 1, 2, 2, 3,
  3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3,
  3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9,
  9, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3,
  3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6,
  6, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9,
  9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6,
];
