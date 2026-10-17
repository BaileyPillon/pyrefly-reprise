/**
 * The offering screen's model (the hidden Last Summoning; **FFX only**): which cards there are, which are still held, which one is focused, and the move and the give. Pure: no DOM, no clock, so
 * `tests/unit/chapters/last-summoning-offering.test.ts` drives every rule without a browser, and `OfferingScreen.ts` only draws what this says.
 *
 * The rules (`research/re-ffx-last-summoning.md` section 2): **any held aeon may be chosen first** (no order is forced), nothing already taken can be chosen again, the cursor opens on the first held aeon
 * in the list's order (the likely start is inferred, RE 9 item 2), and a choice is final: the screen has no back and no skip.
 */

import { OFFERING_KEYS, type OfferingKey } from '../../../data/ffx/last-summoning-ids.ts';
import { OFFERING_NAMES, type OfferingPanel, panelFor } from './offeringText.ts';

/** One card of the row. */
export interface OfferingCard {
  key: OfferingKey;
  name: string;
  /** `'held'`: the player still has it (it can be chosen); `'taken'`: Yu Yevon already has it (greyed, crossed, inert). */
  state: 'held' | 'taken';
}

/** The whole screen's state. */
export interface OfferingState {
  /** All eight, in the game's list order. */
  cards: readonly OfferingCard[];
  /** The focused card's key (always a held one). */
  focus: OfferingKey;
}

/** The screen for a roster: `owned` are the aeons the party holds at all, `taken` the ones Yu Yevon has already. A card for an aeon the party never owned is not drawn. */
export function openOffering(owned: readonly OfferingKey[], taken: readonly OfferingKey[]): OfferingState | null {
  const cards = OFFERING_KEYS.filter((k) => owned.includes(k)).map((key): OfferingCard => ({ key, name: OFFERING_NAMES[key], state: taken.includes(key) ? 'taken' : 'held' }));
  const first = cards.find((c) => c.state === 'held');
  return first === undefined ? null : { cards, focus: first.key };
}

/** The held keys, in the list's order. */
export function heldOf(state: OfferingState): OfferingKey[] {
  return state.cards.filter((c) => c.state === 'held').map((c) => c.key);
}

/** Move the focus to the next (`+1`) or previous (`-1`) held card, wrapping; taken cards are skipped. */
export function moveFocus(state: OfferingState, dir: 1 | -1): OfferingState {
  const held = heldOf(state);
  if (held.length <= 1) return state;
  const at = held.indexOf(state.focus);
  const next = held[(at + dir + held.length) % held.length] as OfferingKey;
  return { ...state, focus: next };
}

/** Focus a card by tapping or clicking it: a taken card does nothing. */
export function focusCard(state: OfferingState, key: OfferingKey): OfferingState {
  return heldOf(state).includes(key) ? { ...state, focus: key } : state;
}

/** Is this the last aeon the player holds? (The headline then says so.) */
export function isLast(state: OfferingState): boolean {
  return heldOf(state).length === 1;
}

/** The panel under the row for the focused card, given what is still held. */
export function panelOf(state: OfferingState): OfferingPanel {
  return panelFor(state.focus, heldOf(state));
}

/** The abstract buttons the screen answers (`app/Input.ts`: the keyboard's arrows and A, D, W, S, Enter, Space and Z, and the pad's d-pad and cross, all arrive as these). */
export type OfferingButton = 'left' | 'right' | 'up' | 'down' | 'confirm';

/**
 * What a button does: `'move'` (the state changes) or `'give'` (the player has chosen `state.focus`). Up and Down read as the previous and the next card, so the phone's two-row grid
 * and the pad's d-pad both work.
 */
export function pressOf(state: OfferingState, button: OfferingButton): { kind: 'move'; state: OfferingState } | { kind: 'give'; key: OfferingKey } {
  if (button === 'confirm') return { kind: 'give', key: state.focus };
  return { kind: 'move', state: moveFocus(state, button === 'left' || button === 'up' ? -1 : 1) };
}
