/**
 * The numbers on the FFX Sensor plate (FOC54-005, release 55; FFX only).
 *
 * Yu Yevon's plate read `99999 / 99999`: five digits with no separator, wider than the 100 px plate. Every number now prints in the house style (thousands
 * separators, whole numbers, as `ui/common/resultsMath.ts#formatNumber` prints gil and AP), and a read-out too long for the plate is set a size smaller by
 * the `ffx-sensor__num--long` class (`ffx-hud.css`) instead of running out of it.
 */

/** A plate number in the house style. */
export function plateNumber(n: number): string {
  return Math.max(0, Math.round(n)).toLocaleString('en-US');
}

/** `' ffx-sensor__num--long'` for a read-out that would not fit the plate at its normal size (more than 13 characters, like `99,999 / 99,999`), else `''`. */
export function longClass(text: string): string {
  return text.length > 13 ? ' ffx-sensor__num--long' : '';
}
