/**
 * The recoil record of an absorb command: Drain, Osmose, Lancet and the two Furies of those (re-parity RC10, lane FFX hit order; **FFX only**).
 *
 * What the game does (FFX.exe 0x007892e0 steps 3, 5 and 6, 0x0078a240; private note FFX-H01 sections 3.4 and 7 row 7): a command whose record carries the absorb bit claims a
 * result record **on its user** before the targets are visited, skips the user's own slot if it is targeted, and when every target has been calculated appends **one**
 * recoil record to it, carrying the running sums of the hits' HP, MP and CTB amounts:
 *
 * - the action-wide **landed-hit counter** is non-zero (some hit was neither evaded nor nullified): the record is appended with flag 0 and the sums;
 * - otherwise, if the user's own slot was targeted: the record is appended with flag 1, an **empty class mask** (it changes nothing);
 * - otherwise the record is cancelled.
 *
 * The record is applied like any hit record, so the user gains what the targets lost in one change, after all the targets were calculated; the engine used to heal the user
 * hit by hit. Pure and deterministic, no DOM, no engine types (AGENTS.md rule 1). The record's own arithmetic (0x0078a240) was compared only at its arguments and call
 * position (note, open question 3): this module restates the choice among the three answers and takes the sums as the hit pipeline leaves them. A net HP or MP sum at or below 0
 * (the targets together gained) is not modelled: the game's result there is unread, so the user is left alone.
 */

/** The running figures an absorb command's calculation leaves. Positive amounts are what the targets lost. */
export interface RecoilSums {
  /** The sum of the HP amounts of the hits that landed (signed: a hit that healed its target counts negative). */
  hp: number;
  /** The sum of the MP the targets actually lost. */
  mp: number;
  /** How many hits landed: neither evaded nor nullified. */
  landed: number;
  /** The user's own slot was one of the action's targets (and was skipped). */
  userTargeted: boolean;
}

/** A fresh set of sums. */
export function newRecoilSums(): RecoilSums {
  return { hp: 0, mp: 0, landed: 0, userTargeted: false };
}

/** The three answers of the game's append step. */
export type RecoilRecord =
  | { kind: 'cancelled' }
  /** Flag 1: the user was a target and nothing landed. An empty class mask. */
  | { kind: 'empty' }
  /** Flag 0: the sums. */
  | { kind: 'sums'; hp: number; mp: number };

/** The record the append step leaves for these sums. */
export function recoilRecord(sums: Readonly<RecoilSums>): RecoilRecord {
  if (sums.landed > 0) return { kind: 'sums', hp: sums.hp, mp: sums.mp };
  if (sums.userTargeted) return { kind: 'empty' };
  return { kind: 'cancelled' };
}

/** What the user gains from a record: HP and MP, each only when its sum is positive. Nothing from an empty or cancelled record. */
export function recoilGain(record: Readonly<RecoilRecord>): { hp: number; mp: number } {
  if (record.kind !== 'sums') return { hp: 0, mp: 0 };
  return { hp: record.hp > 0 ? record.hp : 0, mp: record.mp > 0 ? record.mp : 0 };
}
