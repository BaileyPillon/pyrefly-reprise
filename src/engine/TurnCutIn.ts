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
/**
 * PR-0104 (FFX-2 only): the longest a cut-in waits for a charging party
 * action to resolve and play, the effect's beat included. The plan's item
 * says "at most 0.8 s": the menu opens about 0.6 s after the cut-in would
 * have, so a longer wait lands the slab over a menu the girl is already
 * reading (iter2-b2 check CHK-B2-1: 2 to 2.8 s into Paine's menu at 5 s).
 */
export const CUT_IN_WAIT_CAP_MS = 800;
const CUT_IN_WAIT_STEP_MS = 60;
/**
 * After the charge clears, the beat its effect gets before the slab covers
 * it (inside the cap): the status numerals and the row tags land in this
 * window (measured: Shell's SHL tag shows in the same frame the charge clears).
 */
export const CUT_IN_EFFECT_READ_MS = 300;

export interface TurnCutInDeps {
  moments?: MomentsPort | null;
  speed(): PlaybackSpeed;
  /**
   * PR-0104 (FFX-2 only), all optional: the presenter's own wait (paused by
   * the pause), whether an action is playing on screen now, and whose command
   * menu is up. Without them the cut-in plays at once, as before.
   */
  sleep?(ms: number): Promise<void>;
  acting?(): boolean;
  menuFor?(): CombatantId | null;
}

/** An FFX-2 party member other than `actorId` whose confirmed command is still charging. */
function partyCharging(state: BattleState, actorId: CombatantId): boolean {
  if (state.game !== 'ffx2') return false;
  return state.activeIds.some((id) => {
    if (id === actorId) return false;
    const c = state.combatants[id] as { atb?: { charging?: unknown } } | undefined;
    return !!c?.atb?.charging;
  });
}

/** One per battle: remembers who has already had their cut-in. */
export class TurnCutInBeat {
  private readonly shown = new Set<CombatantId>();
  /** PR-0104: members whose cut-in was moved to their next turn once already. */
  private readonly moved = new Set<CombatantId>();
  /** PR-0104: commands each member has submitted this battle ({@link acted}). */
  private readonly turns = new Map<CombatantId, number>();
  /** PR-0104: a moved cut-in plays once its member has submitted more commands than this. */
  private readonly retryAfter = new Map<CombatantId, number>();

  constructor(private readonly deps: TurnCutInDeps) {}

  /**
   * The presenter reports every submitted command. A menu re-asked within the
   * same turn (an abandoned FFX-2 menu) is not a next turn: a moved cut-in
   * waits for a submission, so it never lands on a menu already being read.
   */
  acted(actorId: CombatantId): void {
    this.turns.set(actorId, (this.turns.get(actorId) ?? 0) + 1);
    const after = this.retryAfter.get(actorId);
    if (after !== undefined && this.turns.get(actorId)! > after) {
      this.retryAfter.delete(actorId);
      this.shown.delete(actorId);
    }
  }

  /** Whether `actorId` would get a cut-in if their turn began now. */
  wants(state: BattleState, actorId: CombatantId): boolean {
    if (this.shown.has(actorId)) return false;
    if (!state.activeIds.includes(actorId)) return false;
    if (state.game === 'ff7') return false; // FF7: no cut-in until its options round (audit)
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
    // PR-0104 (FFX-2 only): a girl's confirmed spell charges while the next
    // girl's menu opens. Her cut-in waits for that charge to resolve and its
    // action to play, so the effect or the status tag reads first, for at
    // most 0.8 s; past that it moves to her next turn (once). The menu itself
    // never waits (this beat is not awaited).
    if (!(await this.waitForCharge(state, actorId))) return;
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

  /**
   * False when the cut-in should not play now: the charge was still running at
   * the cap, or her menu was answered while it waited. Then it moves to her
   * next turn, once; moved already, it plays at the cap regardless, so the
   * approved slab is not lost for the battle.
   */
  private async waitForCharge(state: BattleState, actorId: CombatantId): Promise<boolean> {
    const { sleep, acting, menuFor } = this.deps;
    if (!sleep || state.game !== 'ffx2') return true;
    // The confirm plays its own step forward (an action-start and -end) at
    // once; the effect lands when the charge clears, as status and damage
    // events of its own, so the charge is what is waited on.
    const busy = (): boolean => partyCharging(state, actorId) || acting?.() === true;
    if (!busy()) return true;
    const turnAtStart = this.turns.get(actorId) ?? 0;
    let waited = 0;
    while (busy() && waited < CUT_IN_WAIT_CAP_MS) {
      const step = Math.min(CUT_IN_WAIT_STEP_MS, CUT_IN_WAIT_CAP_MS - waited);
      await sleep(step);
      waited += step;
    }
    const cleared = !busy();
    if (cleared && waited < CUT_IN_WAIT_CAP_MS) {
      await sleep(Math.min(CUT_IN_EFFECT_READ_MS, CUT_IN_WAIT_CAP_MS - waited));
    }
    const stillHers = !menuFor || menuFor() === actorId;
    if (cleared && stillHers) return true;
    if (this.moved.has(actorId)) return stillHers;
    this.moved.add(actorId);
    // Her next turn: the one after the command she submits on this menu.
    if ((this.turns.get(actorId) ?? 0) > turnAtStart) this.shown.delete(actorId);
    else this.retryAfter.set(actorId, turnAtStart);
    return false;
  }
}
