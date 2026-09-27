// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { groupLabelPanels } from '../../src/ui/ffx/groupLabelFit.ts';

/**
 * PR-0193, FFX half: the "ALL ENEMIES" / "ALL ALLIES" label scales with the stage
 * with a 14 px floor, and steps off the enemy-intent card as well as the HUD's
 * panels (FFX-2's `allLabelClear.ts`, reused). FFX only.
 */
function box(el: HTMLElement, x: number, y: number, w: number, h: number): void {
  el.getBoundingClientRect = () => ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON: () => ({}) }) as DOMRect;
}

describe('groupLabelPanels', () => {
  it('adds every visible intent card to the HUD panels', () => {
    const root = document.createElement('div');
    const card = document.createElement('div');
    card.className = 'eint__panel';
    box(card, 900, 120, 300, 160);
    const hidden = document.createElement('div');
    hidden.className = 'eint__panel';
    hidden.hidden = true;
    box(hidden, 10, 10, 50, 50);
    root.append(card, hidden);
    const out = groupLabelPanels(root, [{ x: 0, y: 600, w: 400, h: 200 }]);
    expect(out).toEqual([
      { x: 0, y: 600, w: 400, h: 200 },
      { x: 900, y: 120, w: 300, h: 160 },
    ]);
  });
});

describe('the label type floor', () => {
  it('scales with the letterbox and never renders under 14 px', () => {
    const css = readFileSync('src/ui/ffx/ffx-hud.css', 'utf8');
    expect(css).toMatch(/\.ffxhud \.ffx-target__all span \{[^}]*font-size: max\(14px, calc\(5\.6px \* var\(--lb-scale, 2\.5\)\)\)/);
  });
});
