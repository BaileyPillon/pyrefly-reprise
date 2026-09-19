// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { solidPanelRects } from '../../src/ui/common/panel-rects.ts';

/**
 * The instrument that was dead.
 *
 * Both HUDs handed the *roots* of their panels to `PaintedStage.setPanels`,
 * and two of those roots — the move advisor's `.mad` and the strategy guide's
 * `.sgd`, each `position:absolute; inset:0` — are full-viewport **transparent
 * wrappers**. Measured live at 1600x900 they reported 0,0,1600,900, so
 * `window.__pyrefly.targeting()` said `visibleInFrame: 0` for every combatant
 * in every FFX chapter, Tidus standing in the open included, and the
 * formation's panel clause could never tell one fiend from another.
 *
 * GAME-AWARE (AGENTS.md rule 14): **both games**. Shared measurement plumbing
 * behind a defect (critic CHK-020), so FFX and FFX-2 get the same fix; the
 * FFX-2 case is asserted at the bottom.
 */

/** jsdom has no layout, so each element is told where it is. */
function box(el: HTMLElement, x: number, y: number, w: number, h: number): HTMLElement {
  el.getBoundingClientRect = () =>
    ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON: () => ({}) }) as DOMRect;
  return el;
}

function div(cls: string, style: string): HTMLElement {
  const el = document.createElement('div');
  el.className = cls;
  el.setAttribute('style', style);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('a wrapper that paints nothing hides nothing', () => {
  it('descends the advisor’s inset:0 wrapper and reports its card', () => {
    const wrapper = box(div('mad', 'position:absolute;inset:0'), 0, 0, 1600, 900);
    const card = box(
      div('mad__card', 'background-color: rgba(11, 10, 18, 0.92)'),
      1180,
      620,
      380,
      210,
    );
    wrapper.append(card);
    document.body.append(wrapper);

    const rects = solidPanelRects([wrapper]);
    expect(rects).toEqual([{ x: 1180, y: 620, w: 380, h: 210 }]);
    // The defect: the whole 1600x900 viewport reported as a panel.
    expect(rects.some((r) => r.w >= 1600 && r.h >= 900)).toBe(false);
  });

  it('reports both children when a wrapper holds two painted panels', () => {
    const wrapper = box(div('sgd', 'position:absolute;inset:0'), 0, 0, 1600, 900);
    const panel = box(div('sgd__panel', 'background-color: rgb(20, 18, 30)'), 40, 200, 260, 400);
    const toggle = box(div('sgd__toggle', 'background-color: rgb(20, 18, 30)'), 40, 120, 90, 40);
    wrapper.append(panel, toggle);
    document.body.append(wrapper);

    expect(solidPanelRects([wrapper])).toEqual([
      { x: 40, y: 200, w: 260, h: 400 },
      { x: 40, y: 120, w: 90, h: 40 },
    ]);
  });

  it('takes a painted root as it stands', () => {
    const list = box(div('ig-ctb', 'background-color: rgba(11, 10, 18, 0.85)'), 1300, 40, 280, 520);
    document.body.append(list);
    expect(solidPanelRects([list])).toEqual([{ x: 1300, y: 40, w: 280, h: 520 }]);
  });

  it('counts a panel drawn as an outline only — the Ink & Gold rails', () => {
    const rail = box(div('ig-rail', 'border: 2px solid rgb(242, 194, 30)'), 10, 10, 200, 60);
    document.body.append(rail);
    expect(solidPanelRects([rail])).toHaveLength(1);
  });

  it('skips a hidden panel, a collapsed one and a null root', () => {
    const hidden = box(div('p', 'background-color: rgb(0,0,0); display: none'), 0, 0, 200, 200);
    const collapsed = box(div('p', 'background-color: rgb(0,0,0)'), 0, 0, 200, 0);
    const faded = box(div('p', 'background-color: rgb(0,0,0); opacity: 0.02'), 0, 0, 200, 200);
    document.body.append(hidden, collapsed, faded);
    expect(solidPanelRects([hidden, collapsed, faded, null, undefined])).toEqual([]);
  });

  it('reports nothing at all for an empty transparent overlay', () => {
    const fence = box(div('fence', 'position:absolute;inset:0'), 0, 0, 1600, 900);
    document.body.append(fence);
    expect(solidPanelRects([fence])).toEqual([]);
  });

  it('FFX-2 gets the same answer — shared plumbing, both games', () => {
    const wrapper = box(div('mad', 'position:absolute;inset:0'), 0, 0, 1280, 720);
    const card = box(div('mad__card', 'background-color: rgba(11,10,18,0.9)'), 900, 500, 300, 160);
    wrapper.append(card);
    const command = box(div('ffx2-cmd', 'background-color: rgba(11,10,18,0.9)'), 60, 420, 320, 240);
    document.body.append(wrapper, command);

    const rects = solidPanelRects([command, wrapper]);
    expect(rects).toHaveLength(2);
    expect(rects.some((r) => r.w >= 1280)).toBe(false);
  });
});
