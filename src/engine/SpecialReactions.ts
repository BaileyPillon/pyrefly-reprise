/**
 * How a Special's one connected figure answers the engine's events, as a pure table (FFX-2 only: the three Special dresspheres exist only in FFX-2; pure, no port,
 * no DOM, and nothing reads it while the switch `specialDressUp` is OFF).
 *
 * The figure is ONE painting with three HUD plates (main, right part, left part). An event aimed at a part is shown on its plate; the figure answers only where this
 * table says so. Two readers use it: the figure's handle (step C1) decides what each member of {@link ActorHandle} does when it is called for a part, and the presenter's
 * guards (step C2) decide what an event does to the figure. The replay of a recorded burst through both is C1's and C2's.
 *
 * Game case: FFX-2 only in what is seen (a Special is an FFX-2 dressphere). `[ours]` in this file: the table itself (the game shows no per-part reaction we could read) and the green flash.
 */

import type { BattleEvent } from '../battle/common/types.ts';
import type { ActorHandle } from './BattlePresenterPorts.ts';

/**
 * What a handle member does when a PART's handle is asked: `forward` goes to the one figure, `swallow` does nothing (a part never fades, dissolves, stones or lies down
 * the figure), `source` answers a position (from the stub under the part mark `(b)`, from the figure under `(a)`).
 */
export type MemberRule = 'forward' | 'swallow' | 'source';

/**
 * Every member of {@link ActorHandle}, by rule. A `Record` over `keyof ActorHandle` is the type-level count: a member added to the handle breaks the build here until it is classed,
 * and a name that is not a member is an error. 16 forward, 10 swallow, 3 source = 29. `noteStatus` (added to the handle on 2026-11-09, after this table was specified at 28) is
 * `swallow`: it shows a status on the figure like `setStone` and `setBrightness`, and a status on a PART never touches the figure (`reactionOf` answers `none` for it), so the part's handle
 * holds it even if a call site forgets the guard; the MAIN's actor (`createHitGatedActor`, an empty swallow set) still forwards it to the figure.
 */
export const HANDLE_MEMBERS: Readonly<Record<keyof ActorHandle, MemberRule>> = {
  setPose: 'forward',
  flash: 'forward',
  shake: 'forward',
  recoil: 'forward',
  hitReact: 'forward',
  squash: 'forward',
  hop: 'forward',
  liftTo: 'forward',
  liftRelease: 'forward',
  lunge: 'forward',
  waitMs: 'forward',
  strikeHeft: 'forward',
  moveTo: 'forward',
  leap: 'forward',
  strike: 'forward',
  setFacing: 'forward',
  fadeTo: 'swallow',
  setAlpha: 'swallow',
  dissolveTo: 'swallow',
  setDissolve: 'swallow',
  setStone: 'swallow',
  setBrightness: 'swallow',
  lieDown: 'swallow',
  ramp: 'swallow',
  standDown: 'swallow',
  noteStatus: 'swallow',
  position: 'source',
  centerPoint: 'source',
  headPoint: 'source',
};

/** An event is aimed at the main body (the girl's own id) or at one of the two parts. */
export type EventRole = 'main' | 'part';

/**
 * What the figure and the plate do with one event.
 * `figure`: `forward` = the presenter's ordinary handling reaches the figure (with `pose` and `flash` where named); `none` = nothing for the figure; `guard` = the ordinary handling is HELD
 * (no pose change, no lie-down, no stand-up). `plate`: the combatant's own HUD plate shows this event (its acting mark, its HP, MP or status tags, its knock-out).
 */
export type Reaction = { readonly figure: 'forward' | 'none' | 'guard'; readonly pose?: 'cast' | 'hurt-once' | 'idle'; readonly flash?: number; readonly plate: boolean };

/** The pyrefly green, the colour of the heal flash, the revive flash and the exit's dissolve. */
export const PYREFLY_GREEN = 0x9dffc4;

const FORWARD_PLATE: Reaction = { figure: 'forward', plate: true };
const NO_FIGURE_PLATE: Reaction = { figure: 'none', plate: true };
const GUARD_PLATE: Reaction = { figure: 'guard', plate: true };
const UNRELATED: Reaction = { figure: 'none', plate: false };

/**
 * The table, one row per event type. A `damage` is one hurt pose on the figure once per enemy action however many of the three plates it hit: this table holds the label,
 * the mechanism is the handle's hit gate (step C1) set per event by the presenter (step C2). Any event type not named here is `none` and no plate.
 */
export function reactionOf(type: BattleEvent['type'], role: EventRole, info: { status?: string; allPartsPetrified?: boolean; cause?: string } = {}): Reaction {
  switch (type) {
    case 'action-start':
      return role === 'main' ? FORWARD_PLATE : { figure: 'forward', pose: 'cast', plate: true }; // a part never makes the figure attack; it casts
    case 'turn-start':
    case 'action-end':
      return { figure: 'forward', pose: 'idle', plate: false };
    case 'damage':
      return { figure: 'forward', pose: 'hurt-once', plate: true };
    case 'heal':
      return { figure: 'forward', flash: PYREFLY_GREEN, plate: true }; // a flash, no hurt pose
    case 'miss':
      return { figure: 'forward', plate: false }; // the ordinary miss: a hop
    case 'mp-damage':
    case 'mp-heal':
      return NO_FIGURE_PLATE;
    case 'status-add':
    case 'status-remove':
      if (role === 'part') return NO_FIGURE_PLATE;
      // the figure stones only when all three parts are Petrified; a Petrify on the main alone shows on her plate
      return info.status === 'petrify' && info.allPartsPetrified !== true ? NO_FIGURE_PLATE : FORWARD_PLATE;
    case 'ko':
      return GUARD_PLATE; // a part: no pose change, no lie-down. The main: the figure holds until the fall beat (the tracker's `fall`) plays it
    case 'revive':
      // a part: nothing stands up. The main (Auto-Life, cause 'auto-life'): the existing revive flash in the pyrefly green. Any other cause on the main gets the same: her figure never lay down [inferred]
      return role === 'part' ? GUARD_PLATE : { figure: 'forward', flash: PYREFLY_GREEN, plate: true };
    default:
      return UNRELATED;
  }
}
