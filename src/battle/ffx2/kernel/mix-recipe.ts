/**
 * FFX-2 Mix recipe kernel: the two items a girl picks, in the order she picks them, make one of 53 result rows (re-parity RC9, lane X2-G; **FFX-2 only**).
 *
 * **Game case: FFX-2 only** (FFX's Mix is Rikku's Overdrive over its own 112 x 112 chart: `../../ffx/kernel/mix.ts`; nothing here is read from FFX). Source: FFX-2.exe, Steam
 * build 25501027 (SHA-256 6EA7F142...CD69); spec: the checked note FFX2-G06 sections 1 (item 6), 3.8 and 4.2 to 4.4 (5,009 harness vectors, 0 mismatches, **0 random
 * draws**). Pure and deterministic; no engine types. Reached by the engine through `../adapt/mix.ts`. Vectors: `tests/fixtures/parity/ffx2/mix_recipe.json`.
 *
 * Exe addresses (live build): 0x0075A470 the recipe function {@link mixRecipe} (it runs in the HUD, before the command is queued); 0x00D61978 the blend matrix
 * {@link MIX_BLEND}; 0x00D61ABE the result words {@link MIX_RESULT_WORDS}; the item table is `battle/kernel/item.bin` (68 rows of 160 bytes), whose bytes +0x86 and +0x87
 * are each item's class and level {@link MIX_ITEM_ROWS}. The three copies of the table in the Steam build (the original and the two HD overrides) agree on every data field.
 *
 * The rule, in the note's words made short:
 * - Each item's row is read from the item table by the low 12 bits of its id (the nibble is ignored); an id whose low 12 bits are outside 0 to 67 reads row 0, the first.
 * - The pair's two classes index the 18 x 18 signed matrix, the first item's class as the row. A byte of 99 means the classes do not blend: then the item with the
 *   **higher level** supplies the result (its class is the result row, its level the level) and the **first item** wins a tie. Any other byte is the result row, and the level is
 *   the higher of the two levels.
 * - The result is the word at index `level + 4 x row` of the result table (word 0 is never read): one of 53 command ids, `0x3183` to `0x31B8` except `0x31AD`.
 * - There is **no failure outcome**: every pair, in either order, makes a row. The function is **order dependent** in 496 of the 2,278 unordered pairs of distinct items
 *   (the first-item tie rule alone makes 494 of them). Of the 4,624 ordered pairs of the 68 items 1,060 go through the matrix, 992 are ties settled for the first item and 2,572
 *   are won by the higher level [E 5,009: all 68 x 68 ordered pairs plus 385 pairs with out-of-range ids].
 *
 * The wiki's Priority and Type prose reproduces this on 4,622 of the 4,624 ordered pairs (Priority is 5 minus the level, Type is the class); the two it misses are the Hero Drink
 * first with the Poison Fang or the Candle of Life, where the game has no blend entry and the tie goes to the first item (FFX2-G06 section 8). Port from these tables, not the prose.
 */

/** The number of rows in the exe's item table (item ids 0x2000 to 0x2043). */
export const MIX_ITEM_COUNT = 68;

/** The blend matrix byte that means "these two classes do not blend". */
export const MIX_NO_BLEND = 99;

/**
 * Each item's class (0 to 17) and level (1 to 4), by table row: `item.bin` +0x86 and +0x87 [D]. Classes by position against the research table
 * (`research/ffx2-combat-core.md` 3.11 Step 5, [I]): 0 Fire, 1 Ice, 2 Lightning, 3 Water, 4 Gravity, 5 Holy, 6 Restorative, 7 Reviving, 8 Curative, 9 Curtain, 10 Star Curtain,
 * 11 Haste, 12 Spring, 13 Stamina, 14 Mana, 15 Status, 16 Damage, 17 Hero Drink and Dark Matter.
 */
export const MIX_ITEM_ROWS: ReadonlyArray<readonly [number, number]> = [
  [ 6, 1], [ 6, 2], [ 6, 3], [ 6, 3],
  [ 6, 2], [ 6, 3], [ 7, 1], [ 7, 2],
  [ 6, 3], [ 6, 4], [ 8, 1], [ 8, 1],
  [ 8, 1], [ 8, 1], [ 5, 1], [ 8, 2],
  [16, 1], [16, 2], [16, 3], [16, 2],
  [16, 2], [15, 2], [15, 2], [15, 2],
  [15, 2], [ 0, 1], [ 0, 2], [ 0, 3],
  [ 1, 1], [ 1, 2], [ 1, 3], [ 2, 1],
  [ 2, 2], [ 2, 3], [ 3, 1], [ 3, 2],
  [ 3, 3], [ 4, 2], [16, 3], [ 5, 3],
  [16, 4], [15, 1], [15, 2], [15, 3],
  [15, 1], [15, 2], [17, 4], [11, 2],
  [11, 4], [ 9, 2], [ 9, 2], [10, 2],
  [ 6, 3], [12, 1], [12, 1], [12, 2],
  [ 8, 3], [13, 3], [14, 3], [13, 4],
  [14, 4], [ 4, 3], [ 4, 3], [17, 1],
  [ 6, 2], [ 6, 2], [ 6, 2], [ 6, 2],
];

/** The 18 x 18 blend matrix (exe 0x00D61978), signed bytes: row = the first item's class, column = the second's; 99 = no blend, else the result row [E 5,009]. */
export const MIX_BLEND: ReadonlyArray<readonly number[]> = [
  [ 0, 16, 99, 99, 99,  5, 99, 99, 99, 99, 99, 99, 99, 99, 99, 18, 99, 99],
  [16,  1, 99, 99, 99,  5, 99, 99, 99, 99, 99, 99, 99, 99, 99, 19, 99, 99],
  [99, 99,  2, 16, 99,  5, 99, 99, 99, 99, 99, 99, 99, 99, 99, 20, 99, 99],
  [99, 99, 16,  3, 99,  5, 99, 99, 99, 99, 99, 99, 99, 99, 99, 21, 99, 99],
  [99, 99, 99, 99,  4,  5, 99, 99, 99, 99, 99, 99, 99, 99, 99, 22, 99, 99],
  [ 5,  5,  5,  5,  5,  5, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99,  6,  7, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99,  7,  7, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99,  8, 99, 99, 99, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99, 99,  9, 99, 99, 99, 99, 99, 15, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 10, 99, 99, 99, 99, 15, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 11, 99, 99, 99, 15, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 12, 99, 99, 15, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 13, 12, 15, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 12, 14, 15, 99, 99],
  [18, 19, 20, 21, 22, 99, 99, 99, 99, 15, 15, 15, 15, 15, 15, 15, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 16, 99],
  [99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 17],
];

/** The result words (exe 0x00D61ABE): index = level + 4 x row, so row r at levels 1 to 4 is words 4r + 1 to 4r + 4; word 0 is never read (the table holds 23 rows) [E 5,009]. */
export const MIX_RESULT_WORDS: readonly number[] = [
  0x0000, 0x3189, 0x318a, 0x318b,
  0x318b, 0x318e, 0x318f, 0x3190,
  0x3190, 0x3193, 0x3194, 0x3195,
  0x3195, 0x3198, 0x3199, 0x319a,
  0x319a, 0x319d, 0x319d, 0x319e,
  0x319e, 0x31a1, 0x31a1, 0x31a2,
  0x31a2, 0x31a9, 0x31aa, 0x31ab,
  0x31ac, 0x31a6, 0x31a7, 0x31a7,
  0x31a8, 0x31a3, 0x31a4, 0x31a5,
  0x31a5, 0x31b1, 0x31b1, 0x31b2,
  0x31b3, 0x31b2, 0x31b2, 0x31b3,
  0x31b3, 0x31ae, 0x31ae, 0x31ae,
  0x31b3, 0x31af, 0x31af, 0x31b0,
  0x31b0, 0x31b4, 0x31b4, 0x31b4,
  0x31b5, 0x31b6, 0x31b6, 0x31b6,
  0x31b5, 0x3187, 0x3187, 0x3188,
  0x3188, 0x3183, 0x3184, 0x3185,
  0x3186, 0x31b7, 0x31b7, 0x31b7,
  0x31b8, 0x318c, 0x318c, 0x318d,
  0x318d, 0x3191, 0x3191, 0x3192,
  0x3192, 0x3196, 0x3196, 0x3197,
  0x3197, 0x319b, 0x319b, 0x319c,
  0x319c, 0x319f, 0x319f, 0x31a0,
  0x31a0,
];

/** The 53 distinct result command ids, ascending: `0x3183` to `0x31B8` except `0x31AD`. */
export const MIX_RESULT_COMMANDS: readonly number[] = [...new Set(MIX_RESULT_WORDS.slice(1))].sort((a, b) => a - b);

/** The table row an item id reads (exe 0x0075A470): the low 12 bits of the id, or row 0 when they are past the table's last row. */
export function mixRowOf(item: number): number {
  const low = (item >>> 0) & 0xfff;
  return low < MIX_ITEM_COUNT ? low : 0;
}

/** An item's class and level, by its id (the id's row, {@link mixRowOf}). */
export function mixClassLevel(item: number): readonly [number, number] {
  return MIX_ITEM_ROWS[mixRowOf(item)] as readonly [number, number];
}

/**
 * The result row of picking `first` and then `second` (exe 0x0075A470): the command id the HUD queues. Both ids are item ids (`0x2000 + n`); the answer is always one of
 * {@link MIX_RESULT_COMMANDS}. The order of the arguments is the order of the picks and changes the answer for 496 unordered pairs.
 */
export function mixRecipe(first: number, second: number): number {
  const [classA, levelA] = mixClassLevel(first);
  const [classB, levelB] = mixClassLevel(second);
  const blend = (MIX_BLEND[classA] as readonly number[])[classB] as number;
  let index: number;
  if (blend === MIX_NO_BLEND) {
    // no blend: the higher level supplies the result, the first item winning a tie
    index = levelA >= levelB ? levelA + 4 * classA : levelB + 4 * classB;
  } else {
    index = Math.max(levelA, levelB) + 4 * blend;
  }
  return MIX_RESULT_WORDS[index] as number;
}
