import { describe, expect, it } from 'vitest';
import {
  CLOISTER_DESIGN_ASPECT,
  CLOISTER_PHONE_RIGS,
  CLOISTER_WIDE_RIGS,
  cloisterRenderAspect,
  cloisterRigsFor,
} from '../../../src/scenes/cloister-100-rigs.ts';
import { PHONE_BATTLE_QUERY } from '../../../src/ui/common/phoneBattle.ts';

/**
 * FOC16-05 (release 16 focused review): on an upright phone the Cloister 100
 * camera left the fighters small. The phone battle HUD (option B, Bailey
 * 2026-09-25) draws the canvas as the 16:9 render at the field's height, but
 * the scene picked its rigs by the *window's* aspect, so the portrait rigs
 * (pulled back, fov 40, solved for a full-window portrait canvas) were drawn
 * into a 16:9 canvas. The scene now picks by the render's aspect.
 *
 * **Game case: FFX-2 only** (Chapter XIII's scene). The phone HUD's rules and
 * its framing slide (`phoneFraming.ts`, commit 0da9ce72) are unchanged.
 */
const win = (w: number, h: number, phoneHud: boolean) => ({
  innerWidth: w,
  innerHeight: h,
  matchMedia: (q: string) => ({ matches: phoneHud && q === PHONE_BATTLE_QUERY }) as MediaQueryList,
});

describe('Cloister 100 picks its rigs by the render, not the window (FOC16-05)', () => {
  it('an upright phone under the phone battle HUD renders 16:9, so it takes the wide rigs', () => {
    const aspect = cloisterRenderAspect(win(390, 844, true));
    expect(aspect).toBe(CLOISTER_DESIGN_ASPECT);
    expect(cloisterRigsFor(aspect)['idle']).toEqual(CLOISTER_WIDE_RIGS['idle']);
    expect(cloisterRigsFor(cloisterRenderAspect(win(360, 780, true)))['trema-link']).toEqual(CLOISTER_WIDE_RIGS['trema-link']);
  });

  it('a portrait window the phone HUD does not take keeps the portrait rigs', () => {
    const aspect = cloisterRenderAspect(win(768, 1024, false));
    expect(aspect).toBeCloseTo(0.75, 5);
    expect(cloisterRigsFor(aspect)['idle']).toEqual(CLOISTER_PHONE_RIGS['idle']);
  });

  it('desktop windows are unchanged: the window aspect, the wide rigs', () => {
    for (const [w, h] of [[1600, 900], [2000, 1012], [1280, 720]] as const) {
      const aspect = cloisterRenderAspect(win(w, h, false));
      expect(aspect).toBeCloseTo(w / h, 6);
      expect(cloisterRigsFor(aspect)['idle']).toEqual(CLOISTER_WIDE_RIGS['idle']);
    }
    expect(cloisterRenderAspect(undefined)).toBe(CLOISTER_DESIGN_ASPECT);
  });
});
