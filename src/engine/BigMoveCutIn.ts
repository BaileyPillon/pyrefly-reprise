/**
 * The portrait that shows a BIG MOVE (Bailey, 2026-11-07, "A: only on big moves"; the list per game is `BigMoves.ts`, the switch `CutInMode.ts`), on the presenter's side. The same approved Ink & Gold slab as the turn cut-in
 * (`ui/inkgold/cutin.ts`: the portrait, the gold stripe, the ghost of the name, the slam in from the left), with the move's name where "YOUR TURN" was and its owner and kind above it ("TIDUS · OVERDRIVE").
 *
 * How often: the first time a member does a big move in a fight, the full slam (the slab's 180 ms entrance and its 450 ms hold); after that, a quick flash (the slam and the way out, a 110 ms hold). The real games do the same with
 * their own big animations: the first time in full, short after (`research/ffx-vs-ffx2-presentation.md` sections 6 and 7). Keyed per member, not per move. A retry starts a new battle, so the full slam comes back with it.
 *
 * It never delays input and never waits for the action (the presenter starts it and goes on), except where an Overdrive's opening takes it in place of its own name slab (`BattleMomentsHeld.overdriveStart`): the portrait names the move
 * there, so the opening does not name it twice.
 *
 * Who it is for: a party member's or an aeon's move only (a fiend's big move keeps its banner, `BattlePresenterStaging.ts`); never at SKIP speed (nobody is watching); never over an open FFX-2 command menu (D-357, `KeySlots.menuBlocks`: "nothing
 * plays over it"). Pure: no DOM, no `three` (hard rule 1); it reads the live state and calls the port.
 */
import type { BattleEvent, BattleState } from '../battle/common/types.ts';
import type { MomentsPort, PlaybackSpeed } from './BattlePresenterPorts.ts';
import { SPEED_SCALE } from './BattlePresenterUtil.ts';
import { bigMoveOf, dressUpMoveOf, type BigMove } from './BigMoves.ts';
import { portraitMode } from './CutInMode.ts';
import { CUT_IN_HOLD_MS } from './TurnCutIn.ts';

/** The hold of a repeat's flash, ms at normal speed: the slam and the way out with no pause between. */
export const CUT_IN_QUICK_HOLD_MS = 110;

/** The request the layer plays (`MomentsPort.turnCutIn`'s argument): the slab, with the move's own line and tag. */
export type BigMoveCut = Parameters<NonNullable<MomentsPort['turnCutIn']>>[0];

export interface BigMoveDeps {
  moments?: MomentsPort | null;
  speed(): PlaybackSpeed;
  /** The live battle state (names, the game), or null when the battle has none yet. */
  state(): BattleState | null;
  /** Which team a staged combatant fights for. */
  sideOf(id: string): 'party' | 'enemy' | 'aeon' | undefined;
  /** An FFX-2 command menu is open right now. */
  menuOpen?(): boolean;
}

/** One per battle: remembers who has already had their full slam. */
export class BigMoveBeat {
  private readonly slammed = new Set<string>();

  constructor(private readonly deps: BigMoveDeps) {}

  /** Forget the battle (a new battle on the same presenter). */
  reset(): void {
    this.slammed.clear();
  }

  /**
   * The cut-in for this action, or null when it earns none. Records the member as slammed, so the next one of theirs is the flash: call it once per action, and only when the cut-in will be played.
   */
  decide(event: Extract<BattleEvent, { type: 'action-start' }>): BigMoveCut | null {
    const state = this.open(event.actorId);
    if (!state) return null;
    const who = state.combatants[event.actorId];
    const move = bigMoveOf({
      game: state.game,
      command: event.command,
      abilityId: event.abilityId,
      abilityName: event.abilityName,
      actorId: event.actorId,
      actorName: who?.name ?? event.actorId,
      aeonName: event.command.kind === 'summon' ? state.combatants[event.command.id]?.name : undefined,
    });
    if (!move) return null;
    return this.request(move, state);
  }

  /** FFX-2: the change into a special dressphere, which the engine reports as a `spherechange` event carrying `special` (no `action-start` is emitted for a dress change). */
  decideDressUp(event: Extract<BattleEvent, { type: 'spherechange' }>): BigMoveCut | null {
    const state = this.open(event.who);
    if (!state) return null;
    const move = dressUpMoveOf(state.game, { id: event.who, name: state.combatants[event.who]?.name ?? event.who }, event.to, event.special);
    return move ? this.request(move, state) : null;
  }

  /** The live state when a portrait may play for this actor now (the mode, the port, the speed, the actor's side, an open FFX-2 menu), else null. */
  private open(actorId: string): BattleState | null {
    if (portraitMode() !== 'big' || !this.deps.moments?.turnCutIn) return null;
    if (SPEED_SCALE[this.deps.speed()] <= 0) return null; // 'skip' is e2e and the critic's bots: nobody is watching
    const state = this.deps.state();
    if (!state) return null;
    if (this.deps.sideOf(actorId) === 'enemy') return null; // a fiend's big move has its own banner
    if (state.game === 'ffx2' && this.deps.menuOpen?.() === true) return null; // D-357: nothing plays over an open FFX-2 command menu
    return state;
  }

  private request(move: BigMove, state: BattleState): BigMoveCut {
    const scale = SPEED_SCALE[this.deps.speed()];
    const quick = this.slammed.has(move.portraitId);
    this.slammed.add(move.portraitId);
    return {
      actorId: move.portraitId,
      name: move.who,
      game: state.game === 'ffx2' ? 'ffx2' : 'ffx',
      label: move.tag,
      side: 'left',
      holdMs: Math.round((quick ? CUT_IN_QUICK_HOLD_MS : CUT_IN_HOLD_MS) * scale),
      move: { title: move.title, tag: move.tag },
      quick,
    };
  }
}
