/**
 * The Ink & Gold turn cut-in, on the presenter's side (PR-0005).
 *
 * The approved "Turn cut-in" tile (`docs/target/targets.json`, presentation
 * group, `docs/screenshots/mockups/A-turn-cut-in.jpg`) is *"the character
 * cut-in when a party member's turn begins"*. It was built as
 * `ui/inkgold/cutin.ts` and never called. This module decides **when** it
 * plays and hands the DOM half (`MomentsPort.turnCutIn`, implemented by
 * `ui/common/transitions/TurnCutInLayer.ts`) what to draw.
 *
 * How often: the tile does not say, and Bailey never named a frequency. Every
 * turn would put ~0.8 s in front of every command menu, which is exactly the
 * wait PR-0061 complains about, so it plays **on the first turn of each party
 * member in each battle** (the orchestrator's stated default for an unnamed
 * frequency) and never again in that battle.
 *
 * How long: the spec gives only the entrance (*"slams in from the left in
 * 180ms"*, `docs/handoff/presentation-ink-and-gold.md`, Motion & camera).
 * {@link CUT_IN_HOLD_MS} is this module's own choice, short enough to read a
 * name and a face and no longer; a Confirm press ends it early.
 *
 * It never delays input (PR-0061): the presenter starts it and does **not**
 * wait for it, so the command menu opens (and takes keys) while the slab is
 * still up, as in the approved picture, where the slab and a live menu share
 * the frame. A Confirm press both answers the menu and ends the slab's hold.
 * (Until release 10's repair it was awaited, which put ~0.8 s between the
 * turn starting and the first usable menu.)
 *
 * GAME-AWARE (AGENTS.md rule 14): **both games.** The tile is an Ink & Gold
 * chrome addition that neither game has. The per-game differences are the
 * gauge word in the label (CTB in FFX, ATB in FFX-2, the two games' own turn
 * systems) and FFX-2's pink accent. Both slam in from the **left**, as the one
 * approved picture does: the spec's "Not mocked yet" FFX-2 cut-in *"from the
 * right"* has no mockup or approval, and `cutin.ts`'s `side: 'right'` mirror
 * misplaces the slab and label today (it feeds a mirrored left coordinate to
 * `right:`), so it is not used.
 *
 * Pure: no DOM, no `three` (hard rule 1). It reads a `BattleState` and calls a port.
 */

import type { BattleState, CombatantId } from '../battle/common/types.ts';
import type { MomentsPort, PlaybackSpeed } from './BattlePresenterPorts.ts';
import { SPEED_SCALE } from './BattlePresenterUtil.ts';

/** How long the settled slab stays up, at normal speed. Not in the spec; see the header. */
export const CUT_IN_HOLD_MS = 450;

export interface TurnCutInDeps {
  moments?: MomentsPort | null;
  speed(): PlaybackSpeed;
}

/** One per battle: remembers who has already had their cut-in. */
export class TurnCutInBeat {
  private readonly shown = new Set<CombatantId>();

  constructor(private readonly deps: TurnCutInDeps) {}

  /** Whether `actorId` would get a cut-in if their turn began now. */
  wants(state: BattleState, actorId: CombatantId): boolean {
    if (this.shown.has(actorId)) return false;
    if (!state.activeIds.includes(actorId)) return false;
    return !!this.deps.moments?.turnCutIn;
  }

  /**
   * Play the cut-in for `actorId` if this is their first turn of the battle.
   * Resolves once it is off the screen (at once when nothing is to be shown).
   */
  async play(state: BattleState, actorId: CombatantId): Promise<void> {
    if (!this.wants(state, actorId)) return;
    this.shown.add(actorId);
    const scale = SPEED_SCALE[this.deps.speed()];
    // 'skip' is e2e and the critic's bots: nobody is watching.
    if (scale <= 0) return;
    const c = state.combatants[actorId];
    if (!c) return;
    const ffx2 = state.game === 'ffx2';
    const slot = state.activeIds.indexOf(actorId) + 1;
    try {
      await this.deps.moments!.turnCutIn!({
        actorId,
        name: c.name,
        game: ffx2 ? 'ffx2' : 'ffx',
        label: `${ffx2 ? 'ATB' : 'CTB'} ${slot} OF ${state.activeIds.length}`,
        side: 'left',
        holdMs: Math.round(CUT_IN_HOLD_MS * scale),
      });
    } catch {
      /* chrome is never worth losing a turn over */
    }
  }
}
