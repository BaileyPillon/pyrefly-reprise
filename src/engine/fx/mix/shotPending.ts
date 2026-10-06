/**
 * The MAX mix (D-316), DRESSPHERE SHOT's trigger (round 21, PR-0314; FFX-2 only: only FFX-2 has a spherechange and the shot): a change
 * WAITS for a clean moment instead of being tried on one frame.
 *
 * Until round 21 the shot was decided on the single frame in which a party figure's painted subject changed (the new outfit loaded), and
 * any gate that happened to be closed on that frame (a leftover tween on someone, the master not planned, a panel sliding across the girl's
 * head, a menu closing) lost the shot for good, with no trace of which gate it was (the critic had to write "gate not traced" on
 * PR-0314 for three rounds). Now the change is kept for `PENDING_S` (the twirl keys last 0.64 s), tried again each frame for the cheap
 * gates and at most `MAX_SEARCHES` times, `RETRY_S` apart, for the framing search (20 to 40 ms when it finds nothing), and every outcome is
 * written down with the gate that ended it (`HeldShots.decisions`, read through `fx.mix.snapshot().shots.decisions`).
 *
 * The RULES are the ones D-316, R19-FN-01 and D-357 set and are not loosened: never over an open command menu, never while anyone else is
 * acting (an enemy's hit would land inside the shot with the enemy off camera), the strict framing rules, the placeholder rule. What changes
 * is that a closed gate is waited out for up to 0.6 s instead of being final (1.0 s while an enemy's action in flight is what holds it, B3). Pure: no DOM, no `three`.
 */

/** How long a change waits for a clean moment, seconds (the twirl keys play for 0.64 s, `twirl.ts`). */
export const PENDING_S = 0.6;
/**
 * How long a change waits while what holds it up is an ENEMY's action already in flight (an enemy spell or strike that began before, or just
 * after, the change), seconds. Release 39.1, B3 (Bailey, 2026-10-05, "all of your recommendations"; FFX-2 only: only FFX-2 has the shot): 4 of 24
 * changes lost the close-up to a spell in flight that ended a moment after the 0.6 s were up. Only this wait is longer; the other gates (a menu,
 * the framing, a teammate's action) keep {@link PENDING_S}, nothing is held back (no enemy action is delayed: ATB timing is untouched).
 */
export const PENDING_FOE_S = 1.0;
/** Between two framing searches while a change waits, seconds. */
export const RETRY_S = 0.12;
/** The most framing searches one change gets (each is one frame's hitch when nothing passes). */
export const MAX_SEARCHES = 3;

/** Why a change got no shot, or what it is waiting on. */
export type Gate = 'off' | 'menu' | 'not-ready' | 'acting' | 'placeholder' | 'no-frame' | 'expired';

/** A change waiting for its shot. */
export interface Pending<A> {
  who: A;
  /** `HeldShots`' clock when the change was first seen, seconds. */
  since: number;
  /** Not before this clock may the framing be searched again. */
  nextTry: number;
  searches: number;
  /** The gate that held it up on the last frame it was waiting. */
  last: Gate | null;
  /** On that frame the 'acting' gate was an enemy's action (B3: such a wait runs to {@link PENDING_FOE_S}). Absent reads as false. */
  foe?: boolean;
}

/** What the gates read on this frame. */
export interface PendingIn {
  time: number;
  /** DRESSPHERE SHOT plays (its switches, REDUCE MOTION and the device allow it). */
  scOn: boolean;
  /** A girl's command menu is up (D-357: never a shot over it). */
  menu: boolean;
  /** CHAPTER FRAMING has planned its master and the rig's intro is done. */
  ready: boolean;
  master: boolean;
  /** Anyone but the girl is acting (R19-FN-01). */
  acting: boolean;
  /** An enemy is acting (a subset of `acting`; B3). Absent reads as false. */
  foeActing?: boolean;
}

export type PendingStep = { kind: 'wait'; gate: Gate } | { kind: 'drop'; gate: Gate } | { kind: 'search' };

/** How long this change may wait: {@link PENDING_FOE_S} while an enemy's action is what holds it, else {@link PENDING_S}. */
export function waitFor(p: Pick<Pending<unknown>, 'last' | 'foe'>): number {
  return p.last === 'acting' && p.foe === true ? PENDING_FOE_S : PENDING_S;
}

/** What a waiting change does on this frame. Pure on its input. */
export function stepPending(p: Pending<unknown>, i: PendingIn): PendingStep {
  const age = i.time - p.since;
  if (!i.scOn) return { kind: 'drop', gate: 'off' };
  if (age > waitFor(p)) return { kind: 'drop', gate: p.last ?? 'expired' };
  // A menu that is up now may be the changer's own, still closing; one that stays up for the whole wait ends it as a drop above.
  if (i.menu) return { kind: 'wait', gate: 'menu' };
  if (!i.master || !i.ready) return { kind: 'wait', gate: 'not-ready' };
  if (i.acting) return { kind: 'wait', gate: 'acting' };
  if (p.searches >= MAX_SEARCHES) return { kind: 'drop', gate: 'no-frame' };
  if (i.time < p.nextTry) return { kind: 'wait', gate: 'no-frame' };
  return { kind: 'search' };
}

/** One recorded outcome, for `fx.mix.snapshot().shots.decisions` (the last {@link DECISIONS_KEPT}). */
export interface Decision {
  /** `HeldShots`' clock, seconds. */
  at: number;
  who: string;
  outcome: 'full' | 'push' | 'skipped';
  /** The gate that ended a skipped change; null for a shot. */
  gate: Gate | null;
  /** How long the change waited, ms. */
  waitedMs: number;
  searches: number;
  /** The framing search's last note, or what refused it. */
  note: string;
}

export const DECISIONS_KEPT = 16;
