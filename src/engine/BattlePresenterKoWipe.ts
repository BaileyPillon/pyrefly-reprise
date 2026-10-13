/**
 * A status the KO wipe takes in the action that landed it is never shown.
 *
 * Re-parity RC5 (lane FFX-D, FFX only) runs the game's death check after the target's LAST hit of an action and takes the dying
 * character's statuses in the same instant (`battle/ffx/statuses.ts#clearStatusesOnKo`: one `status-remove` with reason `ko` per
 * status). A status that LANDED in that action on a target who dies in it therefore arrives as a `status-add` and, a few events
 * later, the `status-remove` that takes it: 145 pairs over 440 seeded runs of the FFX chapters, against 12 before RC5. Played as
 * events, each add is a violet flash, the status cue, a one-line message ("Kimahri is cursed", `statusMessageLine.ts`), an icon on the
 * party row and 220 ms, and each removal is 88 ms: Chapter III's Curse (Yu Pagoda, in the Yu Yevon link) on a party member the death
 * check takes played five pairs, about 1.5 s, before the fayth's Auto-Life revive (or a KO). The game never lets the player see those
 * statuses; they are gone at the moment of death.
 *
 * {@link koWipedStatuses} names, for one burst, the events that play no beat: every `status-add` of a status on a target that the
 * same action's KO wipe then takes, and the `status-remove` (reason `ko`) that takes it. `BattlePresenter.playBurst` skips them: no
 * flash, cue, message line, wait or icon, and the HUD is not told. It still rolls the removal into the shown rows (a status that was
 * on the target BEFORE the action must not stay on a dead character's row), and it still puts both events in the trace, so
 * `PlayResult.dropped` and the order of everything else are unchanged. The engine's events are not touched.
 *
 * The rule, for a `status-remove` of status S on target T with reason `ko`:
 * - Walk back from it to the start of its action. The window ends at an `action-start`, an `action-end` or a `turn-start`, the way
 *   `motion/StrikeReach.ts#blowTargets` bounds "the action's own events"; the burst's start ends it too. A status that landed in an
 *   earlier action, or between turns, was on screen for a real stretch of the fight and keeps its beats, and so does its removal.
 * - Every `status-add` of S on T inside the window is quiet, unless another `status-remove` of S on T sits between it and the wipe
 *   (that removal ended whatever landed before it; the add after it, if any, is the one the wipe takes).
 * - The wipe itself is quiet only when at least one add was found. A `ko` removal of a status that predates the action (Protect on a
 *   character who dies) is not part of a pair and plays as it did.
 * - Nothing here looks at which status it is: `critical` (the dynamic low-HP status) follows the same rule if it ever pairs, though
 *   RC5's engine never lands it ahead of the death check (0 of the 145).
 * - `status-remove` with any other reason (cured, expired, dispelled, consumed, overwritten) is never quiet, and neither is an add
 *   it ends: those are statuses the player saw come and go.
 *
 * Game case: **both** (shared presenter plumbing, `critic/CHECKS.md` CHK-020). Today only FFX's death check emits the pair; FFX-2's
 * engine takes a KO'd unit's statuses without an event, and FF7's engine emits no status events. Pure: no DOM, no `three`, no timers
 * (AGENTS.md hard rule 1).
 */

import type { BattleEvent } from '../battle/common/types.ts';

/** Does this event open or close an action's window (nothing before it pairs with a wipe after it)? */
function endsWindow(event: BattleEvent): boolean {
  return event.type === 'action-start' || event.type === 'action-end' || event.type === 'turn-start';
}

/**
 * The indices into `events` of the events that play no beat: the adds the same action's KO wipe takes, and the wipes that take them.
 * An empty set (the usual burst) means every event plays.
 */
export function koWipedStatuses(events: readonly BattleEvent[]): ReadonlySet<number> {
  const quiet = new Set<number>();
  for (let j = 0; j < events.length; j++) {
    const wipe = events[j]!;
    if (wipe.type !== 'status-remove' || wipe.reason !== 'ko') continue;
    let landed = false;
    for (let i = j - 1; i >= 0; i--) {
      const earlier = events[i]!;
      if (endsWindow(earlier)) break;
      if (earlier.type !== 'status-add' && earlier.type !== 'status-remove') continue;
      if (earlier.targetId !== wipe.targetId || earlier.status !== wipe.status) continue;
      if (earlier.type === 'status-remove') break; // that removal ended whatever landed before it
      quiet.add(i);
      landed = true;
    }
    if (landed) quiet.add(j);
  }
  return quiet;
}
