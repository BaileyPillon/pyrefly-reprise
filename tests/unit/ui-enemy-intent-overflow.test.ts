// @vitest-environment jsdom
/**
 * The enemy-intent panel's MORE affordance (`src/ui/common/enemy-intent-overflow.ts`),
 * round 09 PR-0010.
 *
 * The panel half this drives — `EnemyIntent.ts`'s `layout()` lifting the body's
 * `max-height` while {@link EnemyIntentOverflow.expanded} is true — is exercised
 * end to end in `tests/unit/ui-enemy-intent.test.ts` and in a real browser
 * (`docs/screenshots/fix10b/`). What belongs here is the piece with no layout
 * engine underneath it: the row-counting math and the chip's own state machine.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  EnemyIntentOverflow,
  OVERFLOW_KEY,
  OVERFLOW_PAD_BUTTON,
  countHiddenRows,
} from '../../src/ui/common/enemy-intent-overflow.ts';

// ------------------------------------------------------------------ helpers

/** jsdom reports 0 for every layout property; stub the two `countHiddenRows` reads. */
function stubBox(el: HTMLElement, top: number, height: number): void {
  Object.defineProperty(el, 'offsetTop', { configurable: true, value: top });
  Object.defineProperty(el, 'offsetHeight', { configurable: true, value: height });
}

function keydown(code: string, extra: Partial<KeyboardEventInit> = {}): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, ...extra }));
}

function keyup(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { code }));
}

let padButtons: Array<{ pressed: boolean }> = [];
let padPluggedIn = false;

beforeEach(() => {
  padButtons = Array.from({ length: 8 }, () => ({ pressed: false }));
  padPluggedIn = false;
  Object.defineProperty(navigator, 'getGamepads', {
    configurable: true,
    writable: true,
    value: () => (padPluggedIn ? [{ connected: true, buttons: padButtons, axes: [0, 0] }] : []),
  });
});

// ------------------------------------------------------------- countHiddenRows

describe('countHiddenRows', () => {
  it('counts a row that is entirely below the cap', () => {
    const body = document.createElement('div');
    stubBox(body, 0, 0);
    const rows = [10, 40, 70].map((top) => {
      const li = document.createElement('li');
      stubBox(li, top, 20); // each row is 20px tall
      body.append(li);
      return li;
    });
    void rows;
    // Rows at [10,30), [40,60), [70,90). Cap 35 leaves the second and third
    // rows with part of themselves past it.
    expect(countHiddenRows(body, 35)).toBe(2);
  });

  it('counts a row cut mid-glyph — any part past the cap, not just a fully hidden row', () => {
    const body = document.createElement('div');
    stubBox(body, 0, 0);
    const li = document.createElement('li');
    stubBox(li, 10, 20); // spans [10, 30)
    body.append(li);
    // The cap lands inside the row (20 < 30): round 09's exact defect shape.
    expect(countHiddenRows(body, 20)).toBe(1);
  });

  it('reports zero when every row fits', () => {
    const body = document.createElement('div');
    stubBox(body, 0, 0);
    const li = document.createElement('li');
    stubBox(li, 5, 10);
    body.append(li);
    expect(countHiddenRows(body, 100)).toBe(0);
  });

  it('measures relative to the body\'s own offsetTop, not the document', () => {
    const body = document.createElement('div');
    stubBox(body, 200, 0); // the body itself starts 200px down the panel
    const li = document.createElement('li');
    stubBox(li, 210, 20); // 10px into the body, same as the first test's first row
    body.append(li);
    expect(countHiddenRows(body, 35)).toBe(0);
  });
});

// -------------------------------------------------------------- EnemyIntentOverflow

describe('EnemyIntentOverflow', () => {
  let overflow: EnemyIntentOverflow;

  beforeEach(() => {
    overflow = new EnemyIntentOverflow();
  });

  afterEach(() => {
    overflow.detach();
  });

  it('starts hidden and collapsed', () => {
    expect(overflow.el.hidden).toBe(true);
    expect(overflow.expanded).toBe(false);
  });

  it('hides the chip when the body does not overflow, whatever the row count would be', () => {
    const body = document.createElement('div');
    stubBox(body, 0, 0);
    overflow.sync(body, 100, false, false);
    expect(overflow.el.hidden).toBe(true);
  });

  it('shows the chip with the hidden-row count when the body overflows', () => {
    const body = document.createElement('div');
    stubBox(body, 0, 0);
    const li = document.createElement('li');
    stubBox(li, 40, 20); // fully past a cap of 30
    body.append(li);
    overflow.sync(body, 30, true, false);
    expect(overflow.el.hidden).toBe(false);
    expect(overflow.el.textContent).toContain('1');
    expect(overflow.el.textContent).toMatch(/more/i);
  });

  it('names the keyboard key when no pad is connected, the pad label when one is', () => {
    const body = document.createElement('div');
    stubBox(body, 0, 0);
    overflow.sync(body, 30, true, false);
    expect(overflow.el.innerHTML).toContain('J');
    overflow.sync(body, 30, true, true);
    expect(overflow.el.innerHTML).toContain('L2');
  });

  it('expands only while the bound key is held, and collapses on release', () => {
    overflow.attach();
    expect(overflow.expanded).toBe(false);
    keydown(OVERFLOW_KEY);
    expect(overflow.expanded).toBe(true);
    keyup(OVERFLOW_KEY);
    expect(overflow.expanded).toBe(false);
  });

  it('ignores the key with a modifier held, same guard every other panel toggle uses', () => {
    overflow.attach();
    keydown(OVERFLOW_KEY, { ctrlKey: true });
    expect(overflow.expanded).toBe(false);
  });

  it('ignores every other key', () => {
    overflow.attach();
    keydown('KeyE');
    expect(overflow.expanded).toBe(false);
  });

  it('does nothing once detached', () => {
    overflow.attach();
    overflow.detach();
    keydown(OVERFLOW_KEY);
    expect(overflow.expanded).toBe(false);
  });

  it('expands from the pad button once polled, and collapses once it is released', () => {
    padPluggedIn = true;
    padButtons[OVERFLOW_PAD_BUTTON] = { pressed: true };
    overflow.pollPad();
    expect(overflow.expanded).toBe(true);
    padButtons[OVERFLOW_PAD_BUTTON] = { pressed: false };
    overflow.pollPad();
    expect(overflow.expanded).toBe(false);
  });

  it('reports the collapsed hidden count even while expanded, not zero', () => {
    const body = document.createElement('div');
    stubBox(body, 0, 0);
    const li = document.createElement('li');
    stubBox(li, 40, 20);
    body.append(li);
    overflow.attach();
    keydown(OVERFLOW_KEY);
    overflow.sync(body, 30, true, false);
    expect(overflow.expanded).toBe(true);
    expect(overflow.el.textContent).not.toMatch(/\+1 more/);
    expect(overflow.el.textContent).toMatch(/showing all/i);
  });
});
