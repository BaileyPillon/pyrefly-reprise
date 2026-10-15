// @vitest-environment jsdom
/**
 * **The shape of what the player sees** (`windowAspectOf`, `src/scenes/exp-fayth-world.ts`; FFX only; FOC46-05): the aspect the hidden Fayth chapter's camera is framed for. On a desktop or tablet window the
 * render fills the window and it is the camera's own aspect; on an upright phone the canvas is the 16:9 render at the field's height (924 by 520 at 390 by 844, `ui/common/phone-battle.css`) and the window shows a
 * slice of it, so what the player sees is 390 by 520, 3:4, while the camera's own aspect says 16:9 (`ui/common/phoneSlice.ts` says the same share for the phone's query).
 *
 * Pins: with nothing laid out (no `#game`, or a box with no size: jsdom's) it is the camera's own aspect, and 16:9 before the camera is bound; on a window the render fills it is that window's shape; on the phone
 * it is the slice, 390 over 520, whichever way the canvas is slid (the slide moves the box, not the part of it that shows); a canvas smaller than the window is shown whole; the layout is read when the camera's
 * aspect or the window's size changes and not on every frame (a frame must not force a layout).
 *
 * Game case: FFX only.
 */
import type { PerspectiveCamera } from 'three';
import { afterEach, describe, expect, it } from 'vitest';

import { windowAspectOf } from '../../../src/scenes/exp-fayth-world.ts';

const camera = (aspect: number): PerspectiveCamera => ({ aspect }) as unknown as PerspectiveCamera;

/** Put a `#game` box on the page whose rectangle is `box` (change `box` to move it); `reads` counts how many times the page measured it. */
function game(initial: { left: number; top: number; right: number; bottom: number } | null): { box: { left: number; top: number; right: number; bottom: number }; reads: number } {
  document.body.innerHTML = '';
  const out = { box: { left: 0, top: 0, right: 0, bottom: 0, ...initial }, reads: 0 };
  if (initial) {
    const el = document.createElement('div');
    el.id = 'game';
    el.getBoundingClientRect = () => {
      out.reads++;
      const r = out.box;
      return { ...r, width: r.right - r.left, height: r.bottom - r.top, x: r.left, y: r.top, toJSON: () => ({}) } as DOMRect;
    };
    document.body.appendChild(el);
  }
  return out;
}

function windowSize(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

afterEach(() => {
  document.body.innerHTML = '';
  windowSize(1024, 768);
});

describe('the window\'s shape', () => {
  it('is the camera\'s own aspect when nothing is laid out (no #game, or a box with no size), and 16:9 before the camera is bound', () => {
    windowSize(1920, 1080);
    game(null);
    expect(windowAspectOf(() => camera(2))()).toBe(2);
    expect(windowAspectOf(() => null)()).toBeCloseTo(16 / 9, 12);
    game({ left: 0, top: 0, right: 0, bottom: 0 });
    expect(windowAspectOf(() => camera(1.5))()).toBe(1.5);
  });

  it('is the window\'s shape where the render fills the window: a desktop, an upright tablet, a phone held sideways', () => {
    for (const [w, h] of [[1920, 1080], [768, 1024], [844, 390]] as const) {
      windowSize(w, h);
      game({ left: 0, top: 0, right: w, bottom: h });
      expect(windowAspectOf(() => camera(w / h))(), `${w}x${h}`).toBeCloseTo(w / h, 12);
    }
  });

  it('is the slice on an upright phone: 390 of the 924 by 520 canvas, 3:4, wherever the canvas is slid', () => {
    windowSize(390, 844);
    for (const left of [-267, -400, -534, 0]) {
      game({ left, top: 0, right: left + 924, bottom: 520 });
      expect(windowAspectOf(() => camera(924 / 520))(), `slid to ${left}`).toBeCloseTo(390 / 520, 12);
    }
  });

  it('shows a canvas smaller than the window whole', () => {
    windowSize(1920, 1080);
    game({ left: 100, top: 50, right: 500, bottom: 350 });
    expect(windowAspectOf(() => camera(4 / 3))()).toBeCloseTo(400 / 300, 12);
  });

  it('is read when the camera\'s aspect or the window\'s size changes, and not on every frame', () => {
    windowSize(390, 844);
    const g = game({ left: -267, top: 0, right: 657, bottom: 520 });
    let aspect = 924 / 520;
    const shape = windowAspectOf(() => camera(aspect));
    for (let i = 0; i < 20; i++) expect(shape()).toBeCloseTo(390 / 520, 12);
    expect(g.reads).toBe(1);
    g.box.bottom = 600; // the layout changes under the same window and camera: the frame does not look (nothing it keys on changed)
    expect(shape()).toBeCloseTo(390 / 520, 12);
    expect(g.reads).toBe(1);
    aspect = 1; // the camera's own aspect changed (a resize: the phone layout arriving): it looks again
    expect(shape()).toBeCloseTo(390 / 600, 12);
    expect(g.reads).toBe(2);
    windowSize(412, 915); // another window size: it looks again
    expect(shape()).toBeCloseTo(412 / 600, 12);
    expect(g.reads).toBe(3);
  });
});
