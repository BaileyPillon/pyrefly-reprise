// @vitest-environment jsdom
/**
 * The strategy guide on the upright phone is a scrolling sheet, and nothing is fitted to it.
 *
 * `phone-battle.css` opens the guide as a sheet behind the GUIDE chip, 15 px type, `overflow-y: auto`.
 * But `StrategyGuide.layout()` still solved the desktop rail against the desktop's anchors, which mean
 * nothing there: measured in headless Chromium at 390x844 the fit left **one block** (the title) in a
 * sheet that had the whole screen to scroll, so most of the guide was never reachable on a phone.
 * On the phone the content is now all there, at full length, and the sheet scrolls.
 *
 * **Game case: both** [AGENTS.md rule 14]: the sheet is shared plumbing for both HUDs.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';
import { stubGuideLayout } from './helpers/guideLayoutStub.ts';

function boxed(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  return el;
}

function mounted(): { stage: HTMLElement; guide: StrategyGuide } {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const guide = new StrategyGuide({
    game: 'ffx',
    anchors: { below: () => boxed(20, 24), above: () => boxed(240, 80), top: 44, bottom: 34 },
    readVisible: () => true,
    writeVisible: () => undefined,
  });
  guide.mount(stage);
  guide.sync(makeFakeBattleState());
  return { stage, guide };
}

describe('the phone sheet', () => {
  const originalGetClientRects = Range.prototype.getClientRects;
  afterEach(() => {
    Range.prototype.getClientRects = originalGetClientRects;
    delete document.documentElement.dataset['phoneBattle'];
    document.body.innerHTML = '';
  });

  it('on the desktop the same board is cut to the rail: blocks are hidden and MORE is up', () => {
    const { stage, guide } = mounted();
    stubGuideLayout(stage, { scale: 1, unitHeight: 20, glyphSlack: 2, bodyTop: 5, chrome: 11 });
    guide.update(0.016);
    expect(stage.querySelectorAll('.sgd__u--out').length).toBeGreaterThan(0);
    expect(stage.querySelector<HTMLElement>('[data-role="strategy-guide-more"]')!.hidden).toBe(false);
    guide.unmount();
  });

  it('on the phone every block is shown at full length, nothing is paged, and the body is not clamped', () => {
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    const { stage, guide } = mounted();
    stubGuideLayout(stage, { scale: 1, unitHeight: 20, glyphSlack: 2, bodyTop: 5, chrome: 11 });
    guide.update(0.016);
    expect(stage.querySelectorAll('.sgd__u--out').length).toBe(0);
    expect(stage.querySelector('.sgd')!.className).not.toMatch(/sgd--compact|sgd--fit/);
    expect(stage.querySelector<HTMLElement>('[data-role="strategy-guide-more"]')!.hidden).toBe(true);
    expect(stage.querySelector<HTMLElement>('.sgd__body')!.style.height).toBe('');
    // every written block is there to scroll to: the boss's header, its stat lines, the advice and the loot lists
    const text = stage.textContent ?? '';
    expect(text).toContain('Seymour Flux');
    expect(text).toContain('Boss Battle');
    expect(text).toMatch(/Total Annihilation is the dangerous one/);
    expect(text).toContain('Lv. 4 Key Sphere');
    guide.unmount();
  });

  it('undoes a desktop fit when the window becomes a phone', () => {
    const { stage, guide } = mounted();
    stubGuideLayout(stage, { scale: 1, unitHeight: 20, glyphSlack: 2, bodyTop: 5, chrome: 11 });
    guide.update(0.016);
    expect(stage.querySelectorAll('.sgd__u--out').length).toBeGreaterThan(0);
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    guide.update(0.016);
    expect(stage.querySelectorAll('.sgd__u--out').length).toBe(0);
    guide.unmount();
  });
});
