/**
 * The amount panel's model for the player's Yojimbo (FFX only; the hidden Last Summoning, `docs/plans/ch-last-summoning-review.md` section 4): what the player is paying him, in gil, from 0 to what the party holds.
 * Pure: no DOM, no clock, so `tests/unit/yojimbo-pay-panel.test.ts` drives every rule without a browser and `YojimboPayWidget.ts` only draws it.
 *
 * **The game's payment is a number the player types, 0 to the party's gil** (`battle/ffx/aeon-commands.ts`: Pay is `{ kind: 'ability', id: 'yojimbo-pay', targets: [], gilSpent }`, 0 being the "pay nothing" branch, where he
 * leaves and his compatibility falls by 20). Here it is edited a digit at a time (the cursor picks a place, up and down change it), with two shortcuts. **This panel is provisional**: no target for it was approved (rule 9; the
 * approved frame is the offering screen's), it is the one new input the engine's Pay needs, and a mockup of it is awaiting Bailey.
 */

/** The most places a payment has: the engine's purse is a whole number below 100,000,000. */
export const MAX_PLACES = 8;

/** The panel's state. */
export interface PayState {
  /** What the party holds: the ceiling of a payment. */
  purse: number;
  /** The payment now, 0 to `purse`. */
  amount: number;
  /** Which digit the cursor is on: 0 is the units, 1 the tens, and so on. */
  place: number;
  /** How many digits the panel draws: those of the purse (at least 1, at most {@link MAX_PLACES}). */
  places: number;
}

/** The panel for a purse, opening on `suggested` (clamped to the purse) with the cursor on the units' neighbour of the leading digit. */
export function openPay(purse: number, suggested: number): PayState {
  const held = Math.max(0, Math.min(10 ** MAX_PLACES - 1, Math.trunc(purse)));
  const places = Math.max(1, Math.min(MAX_PLACES, String(held).length));
  const amount = Math.max(0, Math.min(held, Math.trunc(suggested)));
  return { purse: held, amount, place: Math.max(0, String(amount).length - 1), places };
}

/** The payment's digits, most significant first, `places` of them (leading zeros included). */
export function digitsOf(s: PayState): number[] {
  const text = String(s.amount).padStart(s.places, '0').slice(-s.places);
  return [...text].map(Number);
}

/** Move the cursor to the next digit to the left (`'left'`, a bigger place) or to the right (`'right'`, a smaller one); it stops at the ends. */
export function movePlace(s: PayState, dir: 'left' | 'right'): PayState {
  const place = Math.max(0, Math.min(s.places - 1, s.place + (dir === 'left' ? 1 : -1)));
  return place === s.place ? s : { ...s, place };
}

/** Put the cursor on a place by the digit's index from the left (a tap on it). */
export function placeAtIndex(s: PayState, indexFromLeft: number): PayState {
  const place = s.places - 1 - Math.max(0, Math.min(s.places - 1, indexFromLeft));
  return place === s.place ? s : { ...s, place };
}

/** Change the digit under the cursor by one, wrapping 9 to 0 and 0 to 9, then keep the payment inside the purse. */
export function nudge(s: PayState, dir: 1 | -1, place: number = s.place): PayState {
  const unit = 10 ** place;
  const digit = Math.floor(s.amount / unit) % 10;
  const next = (digit + dir + 10) % 10;
  const amount = Math.max(0, Math.min(s.purse, s.amount + (next - digit) * unit));
  return { ...s, amount, place };
}

/** Pay everything the party holds. */
export function allIn(s: PayState): PayState {
  return { ...s, amount: s.purse };
}

/** Half of what is paid now (rounded down). */
export function halve(s: PayState): PayState {
  return { ...s, amount: Math.floor(s.amount / 2) };
}

/** Double what is paid now, up to the purse. */
export function double(s: PayState): PayState {
  return { ...s, amount: Math.min(s.purse, s.amount * 2) };
}

/** `50000` as `50,000`. */
export function gil(n: number): string {
  return Math.trunc(n).toLocaleString('en-US');
}

/** The line under the digits: what the payment means, in our words. */
export function payNote(s: PayState): string {
  if (s.purse === 0) return 'The party holds nothing to pay with.';
  if (s.amount === 0) return 'Pay nothing and he leaves.';
  if (s.amount >= s.purse) return 'Everything the party holds.';
  return 'Pay more and he strikes harder. Each doubling counts.';
}
