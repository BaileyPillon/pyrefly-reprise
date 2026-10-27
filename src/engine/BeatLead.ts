/**
 * THE LEAD OF A CONTINUATION (MF-08 / TB-04, motion-fluidity pass lane L3; game case: both games, shared presentation timebase).
 *
 * The presenter's moves are chains: wait a beat, start a tween, await it, wait the next beat. A frame clock resolves each wait or tween on the first frame that reaches its end, which is
 * up to a whole frame AFTER its end, and the code that was waiting runs a microtask later and starts the next piece "now". Each link therefore loses up to a frame (8 ms on average at
 * 60 Hz, 3.5 ms at 144 Hz): the same chain is longer on a slow screen, and two moves started a few ms apart land on one frame.
 *
 * The lead is how long ago, in clock seconds, the thing the code was waiting for actually ended. `BeatClock.tick` and an awaited tween (`TweenGroup.toAsync`) note it when they resolve
 * something; a beat started afterwards subtracts it from its length and a tween born afterwards is credited it on its first update, so the chain keeps its true length at any frame
 * rate. It is valid for the turn of the event loop that follows the frame (the continuations run as microtasks of the same task) and is cleared by the next tick or by the first
 * macrotask after the frame, whichever comes first; it is never more than {@link MAX_LEAD_SEC} (a hitch cannot make a tween jump).
 *
 * Inert unless a screen has {@link claimLead}ed it (the battle screen): the title screen's tweens, the tests and every other user of `Tween` read 0 and note nothing. Pure: no DOM, no three.
 */

/** Never more than 50 ms: a frame is at most 1/40 s on the animation clock, and a lead is less than a frame. */
export const MAX_LEAD_SEC = 0.05;

let owner: object | null = null;
let lead = Infinity;
let epoch = 0;
let wall: boolean | null = null;

/**
 * `?beats=wall` puts the presenter's waits back on `setTimeout` (the way they ran before MF-08) and takes the lead away: the one-build A/B for the frame-clock measures, and a way back if a
 * machine ever misbehaves. Anything else, and no word, is the frame clock. Tests force it with {@link setBeatsWall}.
 */
export function beatsWall(): boolean {
  if (wall !== null) return wall;
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('beats')?.trim().toLowerCase() === 'wall';
  } catch {
    return false;
  }
}

/** Tests and tools: force the word (`null` reads the address again). */
export function setBeatsWall(on: boolean | null): void {
  wall = on;
}

/** A screen takes the lead (the last claimant wins; a retry's new screen takes over from the one being torn down). Not in wall mode: there is no frame clock for it to correct. */
export function claimLead(who: object): void {
  if (beatsWall()) return;
  owner = who;
  lead = Infinity;
}

/** The screen lets go; a release by anyone but the owner changes nothing. */
export function releaseLead(who: object): void {
  if (owner !== who) return;
  owner = null;
  lead = Infinity;
}

/** The frame clock starts a new frame: nothing has resolved yet. */
export function resetLead(): void {
  lead = Infinity;
  epoch++;
}

/** Something the code was waiting for ended `sec` ago (clock seconds). The smallest of a frame's notes stands: it can only under-credit, never run a move ahead. */
export function noteLead(sec: number): void {
  if (owner === null) return;
  const v = Number.isFinite(sec) ? Math.min(Math.max(sec, 0), MAX_LEAD_SEC) : 0;
  if (lead === Infinity) {
    const mine = epoch;
    if (typeof setTimeout === 'function') {
      setTimeout(() => {
        if (epoch === mine) lead = Infinity; // the continuations of the frame have run; later code is not owed a frame's leftover
      }, 0);
    }
  }
  if (v < lead) lead = v;
}

/** Seconds a piece of code started now should count as already elapsed: 0 outside a battle screen, before anything resolved and after the frame's microtasks. */
export function leadNow(): number {
  return owner !== null && lead !== Infinity ? lead : 0;
}
