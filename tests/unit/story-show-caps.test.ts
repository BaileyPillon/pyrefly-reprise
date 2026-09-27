// @vitest-environment jsdom
/**
 * PR-0194: Chapter V's Farplane voice shows at most twice per battle.
 *
 * Game case: FFX-2 only for the cap (Chapter V's Leg); both for the counter
 * (shared mid-battle plumbing).
 */

import { describe, expect, it } from 'vitest';

import { createMidBattleCutscenes } from '../../src/app/screens/BattleScreenCutscenes.ts';
import type { BattleStage } from '../../src/engine/BattlePresenterPorts.ts';
import { setPose } from '../../src/story/dsl.ts';
import { MID_SCRIPT_SHOW_CAPS, createShowCounter } from '../../src/story/showCaps.ts';
import { ffx2VegnagunShuyinScripts } from '../../src/story/scripts/ffx2-vegnagun-shuyin.ts';

describe('mid-battle show caps', () => {
  it('caps the Farplane voice at two showings, and leaves other names alone', () => {
    expect(MID_SCRIPT_SHOW_CAPS['farplane-voice']).toBe(2);
    expect(ffx2VegnagunShuyinScripts.midScripts['farplane-voice']).toBeDefined();
    const c = createShowCounter();
    expect([1, 2, 3, 4, 5, 6].map(() => c.admit('farplane-voice'))).toEqual([true, true, false, false, false, false]);
    expect([1, 2, 3].map(() => c.admit('shuyin-taunt'))).toEqual([true, true, true]);
    expect(c.admit(undefined)).toBe(true);
  });

  it('the battle runner plays a capped beat at most twice in one battle (six emits, as in the round-12 run)', async () => {
    const posed: string[] = [];
    const stage = {
      camera: { moveTo: () => Promise.resolve(), snapTo: () => {}, shake: () => {} },
      vfx: { play: () => Promise.resolve(), screenFlash: () => {} },
      actor: (id: string) => ({ setPose: (s: string) => posed.push(`${id}:${s}`) }),
    } as unknown as BattleStage;
    const cutscenes = createMidBattleCutscenes({ root: document.createElement('div'), stage, sleep: () => Promise.resolve() });
    cutscenes.setAutoAdvance(true, { instant: true });
    for (let i = 0; i < 6; i++) await cutscenes.play([setPose('jecht', 'victory')], { midBattle: true, name: 'farplane-voice' });
    expect(posed).toHaveLength(2);
    cutscenes.dispose();
  });
});
