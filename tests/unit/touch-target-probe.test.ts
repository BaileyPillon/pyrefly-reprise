// @vitest-environment jsdom
/**
 * `tools/touch-target-probe.mjs` (release 68, lane ui-input): the in-page walk the phone sweep runs. jsdom has no layout, so the
 * boxes are stubbed; what is under test is which elements it counts, which it skips and how it judges a size.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// @ts-expect-error a plain .mjs tool with no declaration file
import { touchTargetProbe } from '../../tools/touch-target-probe.mjs';

interface Hit {
  el: string;
  h: number;
  inView: boolean;
  bigAlias: boolean;
  nested: boolean;
}

function box(el: Element, w: number, h: number, x = 0, y = 0): void {
  (el as HTMLElement).getBoundingClientRect = () => ({ x, y, width: w, height: h, top: y, left: x, right: x + w, bottom: y + h, toJSON: () => ({}) }) as DOMRect;
}

function add(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

const head = (a: Hit): string => a.el.split(' ')[0] ?? '';

const realComputedStyle = window.getComputedStyle.bind(window);

beforeEach(() => {
  // jsdom answers a pseudo-element with a "not implemented" warning; none of these controls grows a hit area with one.
  window.getComputedStyle = ((el: Element, pseudo?: string | null) =>
    pseudo ? ({ content: 'none', position: 'static', pointerEvents: 'auto' } as CSSStyleDeclaration) : realComputedStyle(el)) as typeof window.getComputedStyle;
});

afterEach(() => {
  window.getComputedStyle = realComputedStyle;
  document.body.innerHTML = '';
});

describe('touchTargetProbe', () => {
  it('flags a control with a side under 44 and passes one at 44', () => {
    const host = add('<div class="a" role="button" data-action="a">A</div><button class="b">B</button><span class="c" role="tab">C</span>');
    box(host.querySelector('.a')!, 200, 35.2);
    box(host.querySelector('.b')!, 44, 44);
    box(host.querySelector('.c')!, 43, 60);
    const out = touchTargetProbe({ min: 44 });
    expect(out.n).toBe(3);
    expect(out.under.map(head)).toEqual(['div.a', 'span.c']);
    expect(out.under[0].h).toBe(35.2);
  });

  it('skips what a finger cannot press: hidden, disabled, pointer-events none, zero-size', () => {
    const host = add(
      '<button class="gone" style="display:none">x</button><button class="off" disabled>x</button>' +
        '<button class="ghost" style="pointer-events:none">x</button><button class="zero">x</button>' +
        '<div aria-hidden="true"><button class="aria">x</button></div><button class="ok">x</button>',
    );
    for (const c of ['gone', 'off', 'ghost', 'aria', 'ok']) box(host.querySelector(`.${c}`)!, 10, 10);
    box(host.querySelector('.zero')!, 0, 0);
    const out = touchTargetProbe({ min: 44 });
    expect(out.all.map(head)).toEqual(['button.ok']);
  });

  it('does not call a whole-plate pointer alias a small target, and says which controls are nested', () => {
    const host = add('<div class="plate" data-action="confirm"><span class="chip" role="button" data-action="confirm">Go</span></div>');
    box(host.querySelector('.plate')!, 390, 844);
    box(host.querySelector('.chip')!, 160, 30);
    const out = touchTargetProbe({ min: 44 });
    const plate = out.all.find((a: Hit) => a.el.startsWith('div.plate')) as Hit;
    expect(plate.bigAlias).toBe(true);
    expect(plate.nested).toBe(true);
    expect(out.under.map(head)).toEqual(['span.chip']);
  });

  it('measures a control below the fold all the same, and says it is not in view', () => {
    const host = add('<div class="card" role="button">x</div>');
    box(host.querySelector('.card')!, 390, 35, 0, 2000);
    const out = touchTargetProbe({ min: 44 });
    expect(out.all[0].inView).toBe(false);
    expect(out.underCount).toBe(1);
  });
});
