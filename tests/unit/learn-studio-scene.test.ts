/**
 * Site B's stage geometry (`learn/studio/scene.ts`).
 *
 * The one thing a screenshot cannot prove is that nothing ends up under the
 * chrome — a pin hidden behind the detail card looks fine in a picture taken
 * with that card closed. Site A shipped exactly that defect, so the check
 * lives here: every authored box, in both states, inside `FREE_STAGE`.
 */

import { describe, expect, it } from 'vitest';
import { ASSEMBLED, PINS, SEPARATED, STEPS, figureBox, sceneBoxes, toWorld, wx, wy } from '../../learn/studio/scene.ts';
import { FREE_STAGE, ORIGIN, contains, overlaps } from '../../learn/shared/region.ts';
import { STUDIO_COMPONENTS } from '../../learn/studio/rules.ts';

/** `FREE_STAGE` is origin-relative; the scene authors in canvas pixels, so compare in canvas pixels. */
const FREE_CANVAS = {
  x: FREE_STAGE.x + ORIGIN.x,
  y: FREE_STAGE.y + ORIGIN.y,
  w: FREE_STAGE.w,
  h: FREE_STAGE.h,
};

describe('scene: nothing under the chrome', () => {
  it('keeps every authored box inside the chrome-free stage', () => {
    const outside = sceneBoxes().filter((box) => !contains(FREE_CANVAS, box));
    expect(outside).toEqual([]);
  });

  it('keeps every step card of the burst inside it too', () => {
    for (const step of STEPS) {
      expect(contains(FREE_CANVAS, { x: step.x, y: step.y, w: step.w, h: step.h })).toBe(true);
    }
  });
});

describe('scene: the eight components each get exactly one pin and one step card', () => {
  it('covers every component once, in panel order', () => {
    const ids = STUDIO_COMPONENTS.map((c) => c.id);
    expect(PINS.map((p) => p.component).sort()).toEqual([...ids].sort());
    expect(STEPS.map((s) => s.component)).toEqual(ids);
  });

  it('numbers them 01 to 08 in the same order as the panel', () => {
    expect(STEPS.map((s) => s.badge)).toEqual(['01', '02', '03', '04', '05', '06', '07', '08']);
    for (const pin of PINS) {
      const step = STEPS.find((s) => s.component === pin.component);
      expect(pin.badge).toBe(step?.badge);
    }
  });
});

describe('scene: the step cards do not sit on each other', () => {
  it('has no overlapping pair', () => {
    for (let i = 0; i < STEPS.length; i += 1) {
      for (let j = i + 1; j < STEPS.length; j += 1) {
        const a = STEPS[i];
        const b = STEPS[j];
        if (a === undefined || b === undefined) continue;
        expect(overlaps({ x: a.x, y: a.y, w: a.w, h: a.h }, { x: b.x, y: b.y, w: b.w, h: b.h })).toBe(false);
      }
    }
  });

  it('leaves the middle clear for the figures', () => {
    for (const figure of SEPARATED.figures) {
      const box = figureBox(figure);
      for (const step of STEPS) {
        expect(overlaps(box, { x: step.x, y: step.y, w: step.w, h: step.h })).toBe(false);
      }
    }
  });
});

describe('scene: the turn list sits clear of the figures it is about', () => {
  it('does not land on a painted cutout in the assembled state', () => {
    const turn = PINS.find((pin) => pin.component === 'turn');
    expect(turn).toBeDefined();
    if (turn === undefined) return;
    const list = { x: turn.body.x, y: turn.body.y, w: turn.width, h: turn.height };
    for (const figure of ASSEMBLED.figures) {
      expect(overlaps(list, figureBox(figure))).toBe(false);
    }
  });
});

describe('scene: canvas pixels to world units', () => {
  it('puts the canvas centre at the world origin', () => {
    expect(wx(ORIGIN.x)).toBe(0);
    expect(wy(ORIGIN.y)).toBe(0);
    expect(toWorld({ x: ORIGIN.x + 40, y: ORIGIN.y - 12 })).toEqual({ x: 40, y: -12 });
  });
});
