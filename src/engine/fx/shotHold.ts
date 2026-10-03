/**
 * How long the presenter should hold the next decision so the MAX mix's DRESSPHERE SHOT can run its minimum (round 19,
 * PR-0313 and PR-0314; FFX-2 only in use: only FFX-2 has a spherechange and the shot).
 *
 * D-316 gives the shot at least 1.6 s. But the presenter plays a command's burst in about half a second and the engine has
 * already worked out what follows: in Active ATB the gauges are fast-forwarded to the next girl who is ready or the next enemy's
 * move, so the next menu or the next enemy action starts almost at once after the burst. Measured (round 19 gap pass, then
 * here): the gauges on screen are frozen during the burst and jump to full when it ends (Rikku 48 % to 100 % in 40 ms), so
 * nothing the HUD draws can say whether a menu is due, and the shot was handed back after 0.47 s in 5 of 12 changes. It could not
 * be predicted away, so the presenter holds: after a burst, it waits for the time the shot still needs (the same kind of beat
 * `settleForMenu` and the callouts are), and the next decision (a menu, an enemy's action) comes after the shot, not inside it.
 *
 * The mix registers the provider; the presenter reads it after each burst. With no mix, no shot or none up, it is 0 (nothing
 * changes). Pure: no DOM, no `three`; the presenter stays free of both (hard rule 1).
 */

let hold: (() => number) | null = null;

/** The mix: say how many ms of its shot are still to run (0 when none is up); null to clear. */
export function setShotHold(fn: (() => number) | null): void {
  hold = fn;
}

/** The presenter, after a burst: how long to wait (ms) before the next decision. Never negative, never throws. */
export function shotHoldMs(): number {
  try {
    const ms = hold?.() ?? 0;
    return Number.isFinite(ms) && ms > 0 ? ms : 0;
  } catch {
    return 0;
  }
}
