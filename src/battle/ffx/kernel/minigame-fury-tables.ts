/**
 * Lulu's Fury, the game's tables: how many rotations each cast costs, by spell and by Magic.
 *
 * **Game case: FFX only** (FFX-2 has no Fury). Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D; the private note
 * `FFX-G01` section 6.4. The 17 digit rows are at VA 0x00B7B7F4 (20-byte stride, 16 digits each); the row is chosen by the spell and by
 * Lulu's current Magic byte in 0x00A5CC70, and 0x0089A2F0 turns the row into 16 cumulative thresholds. The limit is 4 seconds for every
 * spell (0x00A5CB10). Proven against the game's own machine code run in an emulator over all 19 spells x 256 Magic values
 * (`tests/unit/parity-ffx-minigames.test.ts`, vectors in `tests/fixtures/parity/ffx/minigame_fury.json`, 4,864 vectors, 0 mismatches
 * against an independent model of the bracket chain).
 *
 * A spell's variant is its command id minus 0x3078 (Blizzard Fury 0 ... Ultima Fury 18). Digit `k` (k = 1 to 15, counting from 0) of a
 * row is how many rotations cast `k + 1` costs; the first cast is free (a Fury always casts at least once). `T[0]` is 1 and `T[k]` is the
 * running sum of the digits up to and including digit `k`: the progress counter starts at `T[0]` and every rotation adds 1, and the
 * casts go up by one each time the counter reaches `T[casts]`. So after `r` rotations the casts are 1 plus the number of `T[k]`, k = 1 to
 * 15, that are at most `1 + r`, 16 at the most.
 *
 * Pure, DOM-free, deterministic.
 */

/** The command id of the first Fury record (Blizzard Fury); a Fury's variant is its command id minus this. */
export const FURY_FIRST_COMMAND = 0x3078;
/** The number of Fury spells (variants 0 to 18). */
export const FURY_VARIANTS = 19;
/** The most casts a Fury reaches. */
export const FURY_MAX_CASTS = 16;
/** The time limit of every Fury, in seconds (`0x00A5CB10` returns this constant for all 19 spells). */
export const FURY_LIMIT_SECONDS = 4.0;

/** The 17 digit rows at 0x00B7B7F4: rotations that casts 1 to 16 cost (digit 0 is the free first cast). */
export const FURY_ROWS: readonly string[] = [
  '1122333344444444',
  '1111222222233333',
  '1111122222222222',
  '1111111122222222',
  '1111111111111222',
  '1111111111111111',
  '1123444444445555',
  '1123334444445555',
  '1346666666666666',
  '1245555555555555',
  '1244445555555555',
  '1233334444555555',
  '1122333344445555',
  '1357777777777777',
  '1356666666666666',
  '1345566666666666',
  '1344555666666666',
];

/** A Magic bracket: Magic below `below` takes `row` (a bound of 256 is the last bracket, which takes the rest). */
type Bracket = readonly [below: number, row: number];

/** The bracket chains of 0x00A5CC70, one per spell group. The edges are "less than": Magic 255 is its own bracket where one is listed. */
const GROUP_A: readonly Bracket[] = [[35, 0], [60, 1], [100, 2], [200, 3], [255, 4], [256, 5]]; // Blizzard, Fire, Thunder, Water Fury
const GROUP_B: readonly Bracket[] = [[25, 6], [45, 0], [90, 1], [200, 2], [255, 3], [256, 5]]; // Fira, Blizzara, Thundara, Watera
const GROUP_C: readonly Bracket[] = [[40, 6], [75, 0], [100, 1], [200, 2], [256, 3]]; // Firaga, Blizzaga, Thundaga, Waterga, Bio, Demi, Death
const GROUP_D: readonly Bracket[] = [[30, 7], [50, 0], [100, 1], [200, 2], [255, 3], [256, 5]]; // Drain, Osmose
const GROUP_E: readonly Bracket[] = [[50, 8], [75, 9], [100, 10], [255, 11], [256, 12]]; // Flare
const GROUP_F: readonly Bracket[] = [[40, 13], [75, 14], [150, 8], [255, 15], [256, 16]]; // Ultima

function groupOf(variant: number): readonly Bracket[] {
  if (variant <= 3) return GROUP_A;
  if (variant <= 7) return GROUP_B;
  if (variant <= 14) return GROUP_C;
  if (variant <= 16) return GROUP_D;
  return variant === 17 ? GROUP_E : GROUP_F;
}

/** The variant (0 to 18) of a Fury command id, or `undefined` for any other id. */
export function furyVariantOfCommand(commandId: number): number | undefined {
  const v = commandId - FURY_FIRST_COMMAND;
  return Number.isInteger(v) && v >= 0 && v < FURY_VARIANTS ? v : undefined;
}

/** Which of the 17 rows a spell's variant takes at this Magic (0 to 255; anything outside is clamped, as a byte). */
export function furyRowIndex(variant: number, magic: number): number {
  if (!Number.isInteger(variant) || variant < 0 || variant >= FURY_VARIANTS) throw new RangeError(`not a Fury variant: ${variant}`);
  const m = Math.max(0, Math.min(255, Math.trunc(magic)));
  for (const [below, row] of groupOf(variant)) if (m < below) return row;
  throw new Error('unreachable');
}

/** The 16 cumulative thresholds `T[0..15]` a spell has at this Magic (`T[0]` is 1). */
export function furyThresholds(variant: number, magic: number): number[] {
  const digits = FURY_ROWS[furyRowIndex(variant, magic)] as string;
  const out: number[] = [];
  let sum = 0;
  for (const ch of digits) {
    sum += Number(ch);
    out.push(sum);
  }
  return out;
}

/**
 * The casts a Fury reaches after `rotations` full rotations of the stick (an analog pad, or twice as many digital steps): the free first
 * cast plus one for every threshold the counter has reached, 16 at the most. A negative or fractional count is floored to a whole number.
 */
export function furyCastsAfterRotations(thresholds: readonly number[], rotations: number): number {
  const counter = (thresholds[0] as number) + Math.max(0, Math.floor(rotations));
  let casts = 1;
  for (let k = 1; k < FURY_MAX_CASTS; k++) if ((thresholds[k] as number) <= counter) casts = k + 1;
  return casts;
}

/** Casts after `rotations` for a spell and a Magic: the table lookup the engine uses to score a rotation count. */
export function furyCasts(variant: number, magic: number, rotations: number): number {
  return furyCastsAfterRotations(furyThresholds(variant, magic), rotations);
}
