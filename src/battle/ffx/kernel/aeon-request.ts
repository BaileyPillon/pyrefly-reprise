/**
 * FFX aeon special-action requests: which of an aeon's commands the executor hands to a battle script
 * (`FUN_007b2980`, called by the action executor `0x00792210` as an action starts; re-parity lane FFX-K, **FFX only**).
 *
 * **Game case: FFX only** (FFX-2 has no aeons in this sense; its Yojimbo is a mission boss with its own rules). Source: FFX.exe, Steam
 * build 25501027, SHA-256 0537B2A1...686D; note `FFX-G08` section 2, 3.1 step 3 and 6.1 (our words here). Proven against the game's own
 * machine code: 60,000 vectors, 0 mismatches (`tests/unit/parity-ffx-aeon-request.test.ts` replays a stratified subset of them from
 * `tests/fixtures/parity/ffx/aeon_requests.json`).
 *
 * The rule, for an action whose source type is 0 (a command picked from a menu; every other source type is passed over) and the two command
 * ids of the sub-action in progress, tried in order:
 *
 * - **Yojimbo** (character 0xE): his Dismiss `0x3057` requests script event 10 (no action entry is handed on, the request's fifth argument is
 *   2, and `Chr+0xdf4` is left as it was); Pay `0x3123` requests event 9 with the entry and sets `Chr+0xdf4` to 1.
 * - **A Magus Sister** (0xF, 0x10, 0x11): the eight order commands `0x3124..0x312B` request events 13 to 20 (`0x3124` is 13), with the entry,
 *   and set `Chr+0xdf4` to 1.
 * - everything else: not handled (the executor goes on with an ordinary action).
 *
 * Pure and deterministic; no DOM, no `three`, no engine import (AGENTS.md rule 1).
 */

/** Yojimbo's own commands the requester knows. */
export const YOJIMBO_PAY = 0x3123;
export const YOJIMBO_DISMISS = 0x3057;

/** The eight Magus Sisters order commands, `0x3124..0x312B`. */
export const ORDER_FIRST = 0x3124;
export const ORDER_LAST = 0x312b;

/** The script event kinds. */
export const EventKind = {
  /** Yojimbo's free attack at the start of a turn (`FFX-G08` 3.3). */
  FreeAttack: 0,
  Pay: 9,
  Dismiss: 10,
  /** Yojimbo knocked out or Petrified while he is out (requested by the wipe branch, not by this function). */
  Wipe: 11,
  /** The Sisters' menu builder (requested at each aeon turn start, not by this function). */
  SistersMenu: 12,
  /** The first order event: `0x3124` is 13, `0x312B` is 20. */
  FirstOrder: 13,
} as const;

/** What the requester hands the request starter for a command it handles. */
export interface AeonRequest {
  /** The script event kind (9, 10 or 13..20). */
  kind: number;
  /** The request's fifth argument: 2 for Yojimbo's Dismiss, else 0. */
  fifth: number;
  /** The sub-action entry is handed on (false for Yojimbo's Dismiss, which passes none). */
  withEntry: boolean;
  /** `Chr+0xdf4` becomes 1 ("a special action is pending"). */
  pending: boolean;
}

/**
 * `FUN_007b2980(chr id, ..., source type, entry)`: the request for the sub-action in progress, or `null` when the game passes it over
 * (it returns -1). `commands` are the two command ids of the sub-action.
 */
export function aeonSpecialRequest(chrId: number, sourceType: number, commands: readonly [number, number]): AeonRequest | null {
  if (sourceType !== 0) return null;
  if (chrId === 0xe) {
    for (const c of commands) {
      if (c === YOJIMBO_DISMISS) return { kind: EventKind.Dismiss, fifth: 2, withEntry: false, pending: false };
      if (c === YOJIMBO_PAY) return { kind: EventKind.Pay, fifth: 0, withEntry: true, pending: true };
    }
    return null;
  }
  if (chrId >= 0xf && chrId <= 0x11) {
    for (const c of commands) {
      if (c >= ORDER_FIRST && c <= ORDER_LAST) return { kind: EventKind.FirstOrder + (c - ORDER_FIRST), fifth: 0, withEntry: true, pending: true };
    }
  }
  return null;
}
