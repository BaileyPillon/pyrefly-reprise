// @vitest-environment jsdom
/**
 * PR-0119: a coach mark waits while a mid-battle dialogue card is up.
 *
 * Game case: observed in FFX-2 (Chapter VI's Act I seam, the chain mark over
 * Rikku's line); the hold is shared plumbing (both), because a beat's card can
 * cover a coach mark in either game.
 *
 * `BattleScreenCutscenes` puts `battle-midbeat` on the battle root for the
 * length of every beat, seams included. The coach layer lives in the same
 * root, so it can see the card is up without asking anyone.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import type { BattleEvent, BattleState, CombatantId, Command, MinigameKind, MinigameResult, TurnPreview, AtbSnapshot } from '../../src/battle/common/types.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { MIDBEAT_CLASS } from '../../src/app/screens/BattleScreenCutscenes.ts';
import { withCoach } from '../../src/ui/coach/CoachLayer.ts';
import { MIDBEAT_CLASS as COACH_MIDBEAT_CLASS } from '../../src/ui/coach/coachHold.ts';
import { resetCoach, setCoachingEnabled } from '../../src/ui/coach/coachState.ts';

class QuietHud implements HudPort {
  mount(): void {}
  unmount(): void {}
  sync(_s: BattleState, _p: TurnPreview[] | AtbSnapshot): void {}
  chooseCommand(): Promise<Command> {
    return Promise.resolve({ kind: 'attack', actor: 'a' as CombatantId, targets: [] } as Command);
  }
  onEvent(): void {}
  openMinigame(_k: MinigameKind, _p: Record<string, unknown>): Promise<MinigameResult> {
    return Promise.resolve({} as MinigameResult);
  }
  setVisible(): void {}
  setProjector(): void {}
}

const chain = { type: 'chain', targetId: 'ormi-entrance' as CombatantId, count: 3, multiplier: 1.55 } as BattleEvent;
const mark = (root: HTMLElement): HTMLElement | null => root.querySelector('[data-role="coach-mark"]');

describe('PR-0119: coach marks hold while a beat card is up', () => {
  let root: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    root = document.createElement('div');
    document.body.appendChild(root);
    resetCoach();
    setCoachingEnabled(true);
  });

  it('reads the same class the battle runner sets', () => {
    expect(COACH_MIDBEAT_CLASS).toBe(MIDBEAT_CLASS);
  });

  it('a mark due during a beat waits for the beat to end, then shows', () => {
    const hud = withCoach('ffx2', new QuietHud(), { reduceMotion: true });
    hud.mount(root);
    root.classList.add(MIDBEAT_CLASS);
    hud.onEvent(chain);
    hud.update?.(1 / 60);
    expect(mark(root), 'no mark over the card').toBeNull();
    root.classList.remove(MIDBEAT_CLASS);
    hud.update?.(1 / 60);
    expect(mark(root)?.dataset['mark']).toBe('ffx2-chain');
  });

  it('a mark already up when a beat starts steps aside, and comes back after', () => {
    const hud = withCoach('ffx2', new QuietHud(), { reduceMotion: true });
    hud.mount(root);
    hud.onEvent(chain);
    expect(mark(root)?.dataset['mark']).toBe('ffx2-chain');
    root.classList.add(MIDBEAT_CLASS); // the seam's card goes up
    hud.update?.(1 / 60);
    expect(mark(root), 'the mark leaves the card alone').toBeNull();
    root.classList.remove(MIDBEAT_CLASS);
    hud.update?.(1 / 60);
    expect(mark(root)?.dataset['mark']).toBe('ffx2-chain');
  });
});
