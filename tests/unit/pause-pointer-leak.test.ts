// @vitest-environment jsdom
/**
 * **The pause screen is deaf-proof for the mouse too.**
 *
 * Found on Evrae (Chapter 8, 2026-09-23, by real input): with the pause screen
 * up, mouse clicks still reached the battle HUD underneath. Clicking the
 * Orders row and then "Pull back" spent Tidus's turn while the game was
 * paused (`airship.order` became `far`, the log grew from 1 to 4 events). The
 * leak predates the chapter: Chapter 1's Items submenu opened under the pause
 * the same way. The keyboard was already claimed (`Input.claimKeyboard`) and
 * the pad watchers muted (`setRawInputSuspended`); the mouse was not.
 *
 * The fix is at the one switch every pause already throws:
 * `setRawInputSuspended(true, battleRoot)` also swallows pointer input aimed
 * at the battle's own DOM until it is released. **Both games**: the pause and
 * the HUD roots are shared plumbing (CHK-020).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { rawInputSuspended, setRawInputSuspended, wireClicks } from '../../src/ui/ffx/rawInput.ts';

function hud(): { root: HTMLElement; button: HTMLElement; outside: HTMLElement } {
  document.body.innerHTML = '';
  const root = document.createElement('div');
  const button = document.createElement('button');
  button.dataset['uiAction'] = 'pull-back';
  root.appendChild(button);
  const outside = document.createElement('button');
  outside.dataset['uiAction'] = 'resume';
  document.body.append(root, outside);
  return { root, button, outside };
}

afterEach(() => setRawInputSuspended(false));

describe('pause: the battle HUD does not hear the mouse', () => {
  it('a click on a HUD row while paused does nothing, and works again after resume', () => {
    const { root, button } = hud();
    const heard: string[] = [];
    wireClicks(root, (a) => heard.push(a));
    // Photo mode (opened from the pause) orbits off document.body's pointerdown.
    let orbit = 0;
    document.body.addEventListener('pointerdown', () => (orbit += 1));

    setRawInputSuspended(true, root);
    expect(rawInputSuspended()).toBe(true);
    button.click();
    button.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    button.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(heard).toEqual([]);
    expect(orbit).toBe(1);

    setRawInputSuspended(false);
    button.click();
    expect(heard).toEqual(['pull-back']);
  });

  it('leaves everything outside the battle root alone (the pause menu, photo mode)', () => {
    const { root, outside } = hud();
    const heard: string[] = [];
    wireClicks(document.body, (a) => heard.push(a));
    setRawInputSuspended(true, root);
    outside.click();
    expect(heard).toEqual(['resume']);
  });

  it('a second suspend moves the guard rather than stacking two', () => {
    const a = hud().root;
    const b = document.createElement('div');
    const row = document.createElement('button');
    row.dataset['uiAction'] = 'attack';
    b.appendChild(row);
    document.body.appendChild(b);
    const heard: string[] = [];
    wireClicks(a, (x) => heard.push(x));
    wireClicks(b, (x) => heard.push(x));
    setRawInputSuspended(true, a);
    setRawInputSuspended(true, b);
    (a.querySelector('button') as HTMLElement).click();
    row.click();
    expect(heard).toEqual(['pull-back']);
    setRawInputSuspended(false);
    row.click();
    expect(heard).toEqual(['pull-back', 'attack']);
  });
});
