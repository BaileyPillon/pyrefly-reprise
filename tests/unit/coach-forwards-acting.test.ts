// @vitest-environment jsdom
// iter2 B6, A-15 / PR-0157: the presenter's acting signal (`HudPort.setActing`, B2) must reach the
// HUD through the coach wrapper. Live, `withCoach` wraps both HUDs, and `CoachedHud` had no
// `setActing`, so the FFX-2 action fade never heard an action (0 fades over 638 samples, Chapter IV,
// 1600x900). Game case: both (the shared wrapper; FFX's fade, B5, needs the same forward).
import { describe, expect, it } from 'vitest';
import { withCoach } from '../../src/ui/coach/CoachLayer.ts';
import type { ActingSignal, HudPort } from '../../src/engine/HudPort.ts';

function spyHud(seen: ActingSignal[]): HudPort {
  return {
    mount: () => undefined,
    unmount: () => undefined,
    sync: () => undefined,
    chooseCommand: () => new Promise(() => undefined),
    onEvent: () => undefined,
    openMinigame: () => new Promise(() => undefined),
    setVisible: () => undefined,
    setProjector: () => undefined,
    setActing: (s: ActingSignal) => void seen.push(s),
  } as unknown as HudPort;
}

describe('the coach wrapper forwards the acting signal', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    it(`${game}: action-start and action-end reach the wrapped HUD`, () => {
      const seen: ActingSignal[] = [];
      const hud = withCoach(game, spyHud(seen));
      expect(typeof hud.setActing).toBe('function');
      hud.setActing?.({ phase: 'action-start', actorId: 'yuna', targets: ['bahamut'] });
      hud.setActing?.({ phase: 'action-end', actorId: 'yuna' });
      expect(seen.map((s) => s.phase)).toEqual(['action-start', 'action-end']);
    });
  }

  it('a wrapped HUD without the hook is left alone', () => {
    const bare = spyHud([]);
    delete (bare as { setActing?: unknown }).setActing;
    const hud = withCoach('ffx2', bare);
    expect(() => hud.setActing?.({ phase: 'cancel', actorId: 'yuna' })).not.toThrow();
  });
});
