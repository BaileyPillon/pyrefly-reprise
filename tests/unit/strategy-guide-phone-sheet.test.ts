// @vitest-environment jsdom
/**
 * The strategy guide on the upright phone is a scrolling sheet, and nothing is fitted to it.
 *
 * `phone-battle.css` opens the guide as a sheet behind the GUIDE chip, 15 px type, `overflow-y: auto`.
 * Nothing is fitted to it: the content is all there, at full length, and the sheet scrolls. R38 (2026-10-03) made
 * the desktop's guide a scrolling reading sheet too (`strategy-guide-sheet.test.ts`); the two share the document
 * and the opening on the boss that is standing, and this file pins that the phone's own sheet is what it was.
 *
 * **Game case: both** [AGENTS.md rule 14]: the sheet is shared plumbing for both HUDs.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';
import { stubSheetLayout } from './helpers/guideSheetStub.ts';

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
  afterEach(() => {
    delete document.documentElement.dataset['phoneBattle'];
    document.body.innerHTML = '';
  });

  it('on the phone every block is shown at full length, nothing is paged, and the body is not clamped', () => {
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    const { stage, guide } = mounted();
    stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 10, clientHeight: 300 });
    guide.update(0.016);
    expect(stage.querySelectorAll('[hidden]').length).toBe(0);
    expect(stage.querySelector('.sgd')!.className).not.toMatch(/sgd--compact|sgd--fit/);
    expect(stage.querySelector('[data-role="strategy-guide-more"]')).toBeNull();
    expect(stage.querySelector<HTMLElement>('.sgd__body')!.style.height).toBe('');
    // every written block is there to scroll to: the boss's header, its stat lines, the advice and the loot lists
    const text = stage.textContent ?? '';
    expect(text).toContain('Seymour Flux');
    expect(text).toContain('Boss Battle');
    expect(text).toMatch(/Total Annihilation is the dangerous one/);
    expect(text).toContain('Lv. 4 Key Sphere');
    guide.unmount();
  });
});
