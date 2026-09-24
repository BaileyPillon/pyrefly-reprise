// @vitest-environment jsdom
/**
 * Yojimbo's Zanmato gauge as an obstacle (FFX only, Chapter IX only): the
 * damage numerals and the intent slab must keep off its panel and banner.
 *
 * The repair this guards: the banner goes up on the very hit that fills the
 * gauge, and that hit's numeral printed across the banner's subtitle
 * (`docs/screenshots/yojimbo-gauge/side-1600-full-banner.jpg`, "69") because
 * `ffx/DamageNumbers.ts` did not list either box.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { DamageNumbers } from '../../src/ui/ffx/DamageNumbers.ts';
import { INTENT_AVOID_SELECTORS, ZANMATO_GAUGE_SELECTORS, rectsOf } from '../../src/ui/ffx/hudAvoidSelectors.ts';

type Box = { left: number; top: number; right: number; bottom: number };

/** An element jsdom will report as laid out, at `box`. */
function laidOut(className: string, box: Box, parent: HTMLElement): HTMLElement {
  const el = document.createElement('div');
  el.className = className;
  el.getBoundingClientRect = () =>
    ({ ...box, x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top, toJSON: () => ({}) }) as DOMRect;
  Object.defineProperty(el, 'offsetParent', { get: () => (el.hidden ? null : parent) });
  parent.append(el);
  return el;
}

const PANEL: Box = { left: 900, top: 60, right: 1260, bottom: 170 };
const BANNER: Box = { left: 980, top: 190, right: 1300, bottom: 270 };

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the damage numerals dodge the Zanmato panel and banner', () => {
  function layerIn(): { host: HTMLElement; panelRects: () => Box[] } {
    const host = document.createElement('div');
    host.className = 'ffxhud';
    document.body.append(host);
    const dn = new DamageNumbers();
    host.append(dn.el);
    // The layer's own avoid source, exactly as the shared core calls it every frame.
    const panelRects = (): Box[] => (dn as unknown as { panelRects(): Box[] }).panelRects();
    return { host, panelRects };
  }

  it('lists both boxes while the banner is up', () => {
    const { host, panelRects } = layerIn();
    laidOut('ffx-zg__panel', PANEL, host);
    laidOut('ffx-zg__banner', BANNER, host);
    expect(panelRects()).toEqual(expect.arrayContaining([PANEL, BANNER]));
  });

  it('drops the banner once it hides, keeps the panel', () => {
    const { host, panelRects } = layerIn();
    laidOut('ffx-zg__panel', PANEL, host);
    laidOut('ffx-zg__banner', BANNER, host).hidden = true;
    expect(panelRects()).toEqual([PANEL]);
  });

  it('lists nothing of the gauge in a battle without it', () => {
    const { panelRects } = layerIn();
    expect(panelRects()).toEqual([]);
  });
});

describe('the intent slab dodges the Zanmato panel and banner', () => {
  it('names both boxes by their solid children, never the inset-0 wrapper', () => {
    for (const s of ZANMATO_GAUGE_SELECTORS) expect(INTENT_AVOID_SELECTORS).toContain(s);
    expect(INTENT_AVOID_SELECTORS).not.toContain('.ffx-zg');
    expect(INTENT_AVOID_SELECTORS).not.toContain('.ffx-zg__frame');
  });

  it('measures laid-out boxes and skips a zero-size one', () => {
    const root = document.createElement('div');
    document.body.append(root);
    laidOut('ffx-zg__panel', PANEL, root);
    laidOut('ffx-zg__banner', { left: 0, top: 0, right: 0, bottom: 0 }, root);
    expect(rectsOf(root, INTENT_AVOID_SELECTORS)).toEqual([PANEL]);
  });
});
