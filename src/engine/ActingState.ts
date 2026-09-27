/**
 * The acting-state signal the HUD hears (iteration 2 B2 part 1; PR-0157's
 * hook, both games: shared presenter plumbing, CHK-020).
 *
 * While an action plays, the camera frames the actor and the target, and the
 * HUD's cards can sit over them (round 13, PR-0157; the FFX-2 half is A-15).
 * The fix is the HUD's to make (a fade module beside each HUD, B5 and B6);
 * this module only tells it when an action is on screen:
 *
 * - `action-start` when an action begins to play, with its actor and targets;
 * - `action-end` when it finishes;
 * - `cancel` when it never finishes on screen: the burst stops on a minigame,
 *   the battle ends inside it, the screen aborts, or a new turn or action
 *   starts under it. A HUD that stepped back is never left stepped back.
 *
 * A HUD without `setActing` hears nothing: the no-op default, so every mock
 * screen and test double plays exactly as before. No DOM, no `three`.
 */

import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import type { HudPort } from './HudPort.ts';

export class ActingState {
  private open: CombatantId | null = null;

  constructor(private readonly hud: () => HudPort | null | undefined) {}

  /** Who is acting on screen right now, or null. */
  get acting(): CombatantId | null {
    return this.open;
  }

  /** Called with each event just before it plays. */
  observe(event: BattleEvent): void {
    switch (event.type) {
      case 'action-start':
        this.cancel();
        this.open = event.actorId;
        this.send({ phase: 'action-start', actorId: event.actorId, targets: [...(event.targets ?? [])] });
        return;
      case 'action-end': {
        const id = this.open;
        if (id === null) return;
        this.open = null;
        this.send({ phase: 'action-end', actorId: id });
        return;
      }
      case 'turn-start':
      case 'victory':
      case 'defeat':
        this.cancel();
        return;
      default:
        return;
    }
  }

  /** The open action will not finish on screen: tell the HUD, once. */
  cancel(): void {
    const id = this.open;
    if (id === null) return;
    this.open = null;
    this.send({ phase: 'cancel', actorId: id });
  }

  private send(signal: Parameters<NonNullable<HudPort['setActing']>>[0]): void {
    try {
      this.hud()?.setActing?.(signal);
    } catch (err) {
      // A HUD's fade must never stop playback.
      console.warn('[presenter] HudPort.setActing threw; carrying on', err);
    }
  }
}
