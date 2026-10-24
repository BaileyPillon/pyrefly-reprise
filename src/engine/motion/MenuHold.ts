/**
 * "Is an FFX-2 command menu open right now?" for the actor-side new looks (conference demo, motion pass, lane "core"; review fix MAJOR-3, decision D-357: "keep the FFX-2 rule that
 * nothing plays over an open command menu"). Pure: no `three`, no DOM.
 *
 * The presenter knows (`KeySlots.menuBlocks(ctx)`: FFX-2 only, and only while a menu is pending); a figure deciding in its own `setPose` whether to cut a pose change inside a smear has no
 * presenter context. The presenter hands this module the question once as it is built ({@link setMenuHold}) and the actor-side looks ask it ({@link menuHolds}) at the moment they would
 * START: the smear's cut and flash (a painting set's and a rig's), the knock-out's cut and its landing rebound. Under a menu they keep today's plain blend. Like the run-in and the skill
 * travel (`MotionGate.ts`), the question is asked when a look begins, not while it runs: nothing already in flight is pulled down when a menu opens, which would make a figure bob with every
 * menu open and close under Active ATB.
 *
 * Game case: FFX-2 only in effect (`menuBlocks` is false in an FFX battle); the plumbing is shared. With no probe set (every unit test, FF7) nothing holds.
 */

let probe: (() => boolean) | null = null;

/** The presenter hands in the question (`() => menuBlocks(ctx)`), and `null` when the battle ends. */
export function setMenuHold(fn: (() => boolean) | null): void {
  probe = fn;
}

/** True while a command menu holds the new looks back. A probe that throws holds nothing. */
export function menuHolds(): boolean {
  if (!probe) return false;
  try {
    return probe() === true;
  } catch {
    return false;
  }
}
