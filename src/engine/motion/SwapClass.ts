/**
 * WHICH SWAP IS THIS? (motion-fluidity pass, lane L1; items MF-05 and MF-06 of the fluidity plan; pure: no `three`, no DOM, no clock; both games.)
 *
 * A pose change is classed by the pair of paintings it trades, because each pair arrives at ONE moment of the presenter's script and that moment is what covers it: the cut to `follow` is
 * `ContactBeat.meetContact` (the hit-stop, the contact flash), the cut to `hurt` is the blow's own flash and shake (`recoil` is called by `damage` in the same breath), the cut to `cast` is the glow
 * (`actionStart` sets the pose and lights the glow in one call), the cut to `item` is the toss. The return home, the end of a cast or an item and the recovery from a hit have no cover (a figure
 * at rest changes drawing): those are the classes `pick` gives the three-frame blend (`SwapSwitch.COVERED`).
 *
 * Reading the class off the pair (and not asking the presenter to name it at each call) keeps every caller as it is: the strike's marks, the flinch's own timer, the run's `close`, the menu.
 * The classes are the plan's (`MF-06`); the knock-out, a twirl and a victory are not here (the smear leaves them alone, `SmearPlan.SKIP`).
 */
import type { SwapClass } from './SwapSwitch.ts';

/** Paintings no class touches: the knock-out has its own cut, a twirl is the spherechange's own sequence. */
const OWN_CUT = /^(ko|dead|twirl-.+)$/;

/** The class of a change from painting `from` to painting `to`, or null (a change MF-06 does not name: it plays as it does today). */
export function swapClassOf(from: string, to: string): SwapClass | null {
  if (from === to || OWN_CUT.test(from) || OWN_CUT.test(to)) return null;
  if (to === 'hurt') return 'hit';
  if (to === 'critical') return 'critical';
  if (from === 'critical') return 'criticalOut';
  if (from === 'hurt') return 'recover';
  if (to === 'follow' && (from === 'attack' || from === 'ready')) return 'contact';
  if (from === 'follow' && to === 'idle') return 'home';
  if (to === 'cast') return 'glow';
  if (from === 'cast') return 'castEnd';
  if (to === 'item') return 'toss';
  if (from === 'item') return 'itemEnd';
  return null;
}

/**
 * The change into and out of the ready stance that MF-05 is about: `up` into it (the menu opens on whatever she was showing: the idle, or the drawing of her last spell, item or blow; the wind-up),
 * `down` out of it to the idle (the turn start's drop, the end of a turn). `ready` to an action's own drawing (the strike, the cast, the item) is not the stance: those are the cause classes.
 * Null for any other pair, and for a knock-out or a twirl, which have their own cut.
 */
export function stanceKindOf(from: string, to: string): 'up' | 'down' | null {
  if (from === to || OWN_CUT.test(from) || OWN_CUT.test(to)) return null;
  if (to === 'ready') return 'up';
  if (from === 'ready' && to === 'idle') return 'down';
  return null;
}
