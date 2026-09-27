// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { withCoach } from '../../src/ui/coach/CoachLayer.ts';
import type { ActingSignal, HudPort } from '../../src/engine/HudPort.ts';

/**
 * B2's acting signal reaches the real HUD through the coach wrapper (PR-0157 FFX, A-15 FFX-2):
 * `BattleScreen` hands the presenter the `withCoach` wrapper, so a wrapper that leaves `setActing`
 * out hides it (found live in iteration 2 B5: the FFX fade never fired). Both games.
 */
describe('the coach wrapper forwards setActing', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    it(`${game}: every signal reaches the inner HUD`, () => {
      const seen: ActingSignal[] = [];
      const inner = { setActing: (s: ActingSignal) => seen.push(s) } as unknown as HudPort;
      const hud = withCoach(game, inner);
      hud.setActing?.({ phase: 'action-start', actorId: 'tidus', targets: [] });
      hud.setActing?.({ phase: 'cancel', actorId: 'tidus' });
      expect(seen.map((s) => s.phase)).toEqual(['action-start', 'cancel']);
    });
  }
});
