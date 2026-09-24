// @vitest-environment jsdom
/**
 * FFX only, Chapter IX only: Auron's first-time line must not cover Yojimbo's
 * Zanmato gauge panel (commits e6748398 + 300f87d2). Measured on the shipped
 * code before this repair, in Chapter IX via `__pyrefly.gotoChapter` with real
 * Enter presses: the line covered the panel by 184x47 px at 1280x720, 130x59
 * at 1600x900, 52x66 at 2000x1012 ("Call the aeon...") and 340x101 on the
 * 390x844 phone (both first decisions).
 *
 * The pure half pins `clearOfPanels` on those live boxes. The DOM half pins
 * the wiring in `CoachMark`: with no gauge on screen (every other chapter) the
 * line is not touched, and an FFX-2 line never runs the solve at all.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AVOID_GAP, clearOfPanels, overlaps, slidePast, type Rect } from '../../src/ui/coach/coachAvoid.ts';
import { CoachMark } from '../../src/ui/coach/CoachMark.ts';
import { marksFor } from '../../src/ui/coach/coachCopy.ts';

/** `[x, y, w, h]`, the way the live measurement printed them. */
function box([x, y, w, h]: readonly [number, number, number, number]): Rect {
  return { left: x, top: y, right: x + w, bottom: y + h };
}

interface Frame {
  vp: [number, number];
  mark: Rect;
  gauge: Rect;
  soft: Rect[];
  side: Rect[];
}

/** Chapter IX, "Call the aeon..." (the phone row is the first decision), measured live before the repair. */
const FRAMES: Record<string, Frame> = {
  '1280x720': {
    vp: [1280, 720],
    mark: box([358, 79, 400, 146]),
    gauge: box([574, 9, 407, 117]),
    // guide, guide toggle, turn list, party rows, Sensor plate, advisor chip
    soft: [[43, 88, 264, 112], [40, 66, 118, 21], [1124, 100, 117, 301], [805, 517, 428, 179], [870, 332, 85, 19], [666, 647, 135, 21]].map((b) => box(b as [number, number, number, number])),
    // command stack, its help strip
    side: [box([60, 356, 375, 313]), box([56, 270, 328, 38])],
  },
  '1600x900': {
    vp: [1600, 900],
    mark: box([448, 99, 400, 146]),
    gauge: box([718, 11, 509, 147]),
    soft: [[53, 110, 330, 140], [51, 83, 148, 26], [1405, 124, 146, 377], [1007, 646, 536, 224], [1087, 415, 107, 24], [832, 811, 142, 24]].map((b) => box(b as [number, number, number, number])),
    side: [box([76, 445, 469, 391]), box([70, 337, 410, 48])],
  },
  '2000x1012': {
    vp: [2000, 1012],
    mark: box([560, 111, 400, 146]),
    gauge: box([908, 12, 572, 165]),
    soft: [[160, 124, 371, 157], [157, 93, 166, 30], [1680, 140, 165, 423], [1232, 726, 602, 252], [1323, 467, 120, 27], [1003, 918, 147, 21]].map((b) => box(b as [number, number, number, number])),
    side: [box([185, 500, 527, 440]), box([180, 379, 461, 54])],
  },
  '390x844': {
    vp: [390, 844],
    mark: box([25, 68, 340, 160]),
    gauge: box([12, 30, 366, 139]),
    soft: [[13, 339, 80, 34], [12, 332, 36, 6], [342, 343, 36, 92], [245, 470, 131, 55], [265, 413, 26, 6], [202, 498, 116, 17]].map((b) => box(b as [number, number, number, number])),
    side: [box([18, 421, 114, 95]), box([17, 395, 100, 12])],
  },
};

function stageOf([w, h]: [number, number]): Rect {
  return { left: 0, top: 0, right: w, bottom: h };
}

describe('clearOfPanels: the line clears the Zanmato gauge (FFX, Chapter IX)', () => {
  for (const [name, f] of Object.entries(FRAMES)) {
    it(`${name}: reproduces the measured overlap, then clears the gauge and every other panel`, () => {
      expect(overlaps(f.mark, f.gauge)).toBe(true);
      const moved = clearOfPanels(f.mark, [f.gauge], f.soft, f.side, stageOf(f.vp));
      expect(moved).not.toBeNull();
      const m = moved!;
      // Same size.
      expect(m.right - m.left).toBe(f.mark.right - f.mark.left);
      expect(m.bottom - m.top).toBe(f.mark.bottom - f.mark.top);
      // Inside the stage.
      expect(m.left).toBeGreaterThanOrEqual(0);
      expect(m.top).toBeGreaterThanOrEqual(0);
      expect(m.right).toBeLessThanOrEqual(f.vp[0]);
      expect(m.bottom).toBeLessThanOrEqual(f.vp[1]);
      // At least a gap clear of the gauge, and on no other panel.
      const g = f.gauge;
      const clear = m.top >= g.bottom + AVOID_GAP - 1 || m.bottom <= g.top - AVOID_GAP + 1 ||
        m.left >= g.right + AVOID_GAP - 1 || m.right <= g.left - AVOID_GAP + 1;
      expect(clear).toBe(true);
      for (const p of [...f.soft, ...f.side]) expect(overlaps(m, p)).toBe(false);
      // Settled: asked again from where it landed, it stays.
      expect(clearOfPanels(m, [f.gauge], f.soft, f.side, stageOf(f.vp))).toBeNull();
    });
  }

  it('landscape keeps the line in the upper band, just under the panel', () => {
    const f = FRAMES['1600x900']!;
    const m = clearOfPanels(f.mark, [f.gauge], f.soft, f.side, stageOf(f.vp))!;
    expect(m.top).toBe(f.gauge.bottom + AVOID_GAP);
    expect(m.left).toBe(f.mark.left);
  });

  it('1280x720: under the panel it would graze the help strip, so it also slides right of it', () => {
    const f = FRAMES['1280x720']!;
    const m = clearOfPanels(f.mark, [f.gauge], f.soft, f.side, stageOf(f.vp))!;
    expect(m.top).toBe(f.gauge.bottom + AVOID_GAP);
    expect(m.left).toBe(f.side[1]!.right + AVOID_GAP);
  });

  it('390x844: the top band is the gauge, so the line takes the empty band under the grid', () => {
    const f = FRAMES['390x844']!;
    const m = clearOfPanels(f.mark, [f.gauge], f.soft, f.side, stageOf(f.vp))!;
    const lowest = Math.max(...[...f.soft, ...f.side].map((p) => p.bottom));
    expect(m.top).toBeGreaterThanOrEqual(lowest);
  });

  it('also clears the advisor card when both are hard boxes', () => {
    const f = FRAMES['1600x900']!;
    const card = box([448, 160, 300, 180]); // sits exactly where "under the gauge" would land
    const m = clearOfPanels(f.mark, [f.gauge, card], f.soft, f.side, stageOf(f.vp))!;
    expect(overlaps(m, f.gauge)).toBe(false);
    expect(overlaps(m, card)).toBe(false);
  });

  it('never moves a line that is already clear, and never to somewhere worse', () => {
    const stage = stageOf([1600, 900]);
    const gauge = box([718, 11, 509, 147]);
    const clear = box([448, 300, 400, 146]);
    expect(clearOfPanels(clear, [gauge], [], [], stage)).toBeNull();
    // Nowhere inside the stage clears the gauge: leave the line alone.
    const huge = box([0, 0, 1600, 900]);
    expect(clearOfPanels(clear, [huge], [], [], stage)).toBeNull();
  });

  it("slides past the help strip even when the gauge is not in play (Chapter IX's first decision)", () => {
    // Measured at 1280x720: the line under the card grazed "Physical damage" by 26x38.
    const mark = box([358, 242, 400, 146]);
    const hard = [box([574, 9, 407, 117]), box([327, 101, 228, 129])];
    const side = [box([60, 409, 361, 259]), box([56, 270, 328, 38])];
    const m = clearOfPanels(mark, hard, [], side, stageOf([1280, 720]))!;
    expect(m.top).toBe(242);
    expect(m.left).toBe(384 + AVOID_GAP);
  });
});

describe('slidePast', () => {
  const stage = stageOf([1280, 720]);
  it('is null with nothing to pass, off the stage, or into a hard margin', () => {
    const strip = box([56, 270, 328, 38]);
    expect(slidePast(box([400, 242, 400, 146]), [strip], [], stage)).toBeNull();
    expect(slidePast(box([358, 242, 400, 146]), [box([56, 270, 900, 38])], [], stage)).toBeNull();
    expect(slidePast(box([358, 242, 400, 146]), [strip], [box([700, 100, 100, 135])], stage)).toBeNull();
    // Exactly the gap clear of a hard box is allowed.
    expect(slidePast(box([358, 242, 400, 146]), [strip], [box([700, 100, 100, 130])], stage)).not.toBeNull();
  });
});

// ---------------------------------------------------------------- the wiring

const rects = new Map<Element, Rect>();
const realRect = Element.prototype.getBoundingClientRect;

function place(el: Element, r: Rect): void {
  rects.set(el, r);
}

function rectOf(el: Element): DOMRect {
  let r = rects.get(el);
  if (el instanceof HTMLElement && el.classList.contains('coach-mark')) {
    // The line's box follows its inline top/left, the way layout would.
    const base = rects.get(el)!;
    const top = parseFloat(el.style.top);
    const left = parseFloat(el.style.left);
    r = { left, top, right: left + (base.right - base.left), bottom: top + (base.bottom - base.top) };
  }
  const b = r ?? { left: 0, top: 0, right: 0, bottom: 0 };
  return { x: b.left, y: b.top, left: b.left, top: b.top, right: b.right, bottom: b.bottom,
    width: b.right - b.left, height: b.bottom - b.top, toJSON: () => b } as DOMRect;
}

function panel(host: HTMLElement, cls: string, r: Rect): HTMLElement {
  const el = document.createElement('div');
  el.className = cls;
  host.appendChild(el);
  place(el, r);
  return el;
}

function mountLine(game: 'ffx' | 'ffx2', withGauge: boolean): { host: HTMLElement; line: CoachMark } {
  const f = FRAMES['1600x900']!;
  const host = document.createElement('div');
  document.body.appendChild(host);
  place(host, stageOf(f.vp));
  const layer = document.createElement('div');
  layer.className = 'coach-layer';
  host.appendChild(layer);
  panel(host, 'ig-cmd-stack', f.side[0]!);
  panel(host, 'ffx-cmd-info', f.side[1]!);
  panel(host, 'sgd__panel', f.soft[0]!);
  if (withGauge) panel(host, 'ffx-zg__panel', f.gauge);
  const line = new CoachMark({ root: layer, mark: marksFor(game)[0]!, game, reduceMotion: true, setTimer: () => 0, clearTimer: () => undefined });
  // What coach.css would compute for `left: 28%; top: 11%` at 1600x900.
  line.el.style.left = `${f.mark.left}px`;
  line.el.style.top = `${f.mark.top}px`;
  place(line.el, f.mark);
  return { host, line };
}

describe('CoachMark wiring', () => {
  beforeEach(() => {
    Element.prototype.getBoundingClientRect = function (this: Element) {
      return rectOf(this);
    };
  });
  afterEach(() => {
    Element.prototype.getBoundingClientRect = realRect;
    rects.clear();
    document.body.innerHTML = '';
  });

  it('FFX, gauge on screen: the line moves under the panel', () => {
    const { line } = mountLine('ffx', true);
    void line.show();
    expect(line.el.style.top).toBe(`${11 + 147 + AVOID_GAP}px`);
    expect(line.el.style.left).toBe('448px');
    line.recheckPosition();
    expect(line.el.style.top).toBe(`${11 + 147 + AVOID_GAP}px`);
    line.dismiss();
  });

  it('FFX, no gauge (every other chapter): the line is not touched', () => {
    const { line } = mountLine('ffx', false);
    void line.show();
    line.recheckPosition();
    expect(line.el.style.top).toBe('99px');
    expect(line.el.style.left).toBe('448px');
    line.dismiss();
  });

  it('FFX-2 never runs the solve, gauge or not', () => {
    const { line } = mountLine('ffx2', true);
    void line.show();
    line.recheckPosition();
    expect(line.el.style.top).toBe('99px');
    expect(line.el.style.left).toBe('448px');
    line.dismiss();
  });
});
