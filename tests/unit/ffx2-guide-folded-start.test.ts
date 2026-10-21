// @vitest-environment jsdom
/**
 * **A scene may start the FFX-2 strategy guide folded to its chip (the hidden Wind Waker chapter; FFX-2 only; polish 1).**
 *
 * `SceneStaging.guideFolded` was FFX's alone (Chapters I and III: `FFXBattleHud.startGuideFolded`). At the Wind Waker chapter's target shot the girls' heads stand under the guide sheet's least height (the sheet
 * is never drawn shorter than 56 grid px and the boss strip leaves less room than that above Yuna), so an open sheet covered the top of Yuna's hair. The chapter asks for the guide folded; the FFX-2 HUD
 * starts its guide the same way FFX's does (`StrategyGuide.startFolded`: a starting state, nothing written to `Settings.guideVisible`, `G` opens it).
 *
 * The scene -> HUD wiring is `BattleScreen` -> `createHud(game, field, engine, artNamespace, advisorCap, intentRoof, guideFolded)`.
 */
import { describe, expect, it } from 'vitest';
import { createHud } from '../../src/app/screens/BattleScreenWiring.ts';
import { EXP_WINDWAKER_SLOTS } from '../../src/scenes/exp-windwaker-stage.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';

function ffx2HudIn(hud: unknown): FFX2BattleHud {
  let h = hud as { inner?: unknown } | undefined;
  for (let i = 0; i < 10 && h && !(h instanceof FFX2BattleHud); i++) h = h.inner as { inner?: unknown } | undefined;
  expect(h, 'an FFX2BattleHud inside the wrappers').toBeInstanceOf(FFX2BattleHud);
  return h as FFX2BattleHud;
}
const foldPending = (h: FFX2BattleHud): boolean => (h.strategyGuide as unknown as { foldPending: boolean }).foldPending;

describe('starting the FFX-2 guide folded', () => {
  it('is asked for by the Wind Waker scene and by no other FFX-2 scene row we read here', () => {
    expect(EXP_WINDWAKER_SLOTS.guideFolded).toBe(true);
  });

  it('createHud starts the FFX-2 guide folded when the scene asks, and leaves it as it was when it does not', () => {
    const on = ffx2HudIn(createHud('ffx2', undefined, null, undefined, undefined, undefined, true));
    expect(foldPending(on)).toBe(true);
    const off = ffx2HudIn(createHud('ffx2', undefined, null, undefined, undefined, undefined, undefined));
    expect(foldPending(off)).toBe(false);
    const no = ffx2HudIn(createHud('ffx2', undefined, null, undefined, undefined, undefined, false));
    expect(foldPending(no)).toBe(false);
  });

  it('does not touch the FFX HUD path (it has its own start) and does not throw for it', () => {
    expect(() => createHud('ffx', undefined, null, undefined, undefined, undefined, true)).not.toThrow();
  });
});
