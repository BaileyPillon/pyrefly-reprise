// @vitest-environment jsdom
/**
 * fb2-0929-onboard: two first-run defects of the coach line, found by walking
 * the live build (release 31a) on a fresh profile by mouse at 1600x900 and by
 * taps at 390x844 (docs/handoff/fb2-0929-onboard.md).
 *
 * 1. **A pointer press on the menu is an answer (both games).** A keyboard
 *    player who moves the cursor and confirms takes the line down with that
 *    confirm, and the press reaches the menu (PR-0182 / PR-0190). A mouse or
 *    touch player had no equivalent: tapping ATTACK went straight to targeting
 *    with Auron's line still up, and on a phone the line then covered the enemy
 *    being aimed at, its reticle and its name (measured: line 25,128 340x160,
 *    target name 165,136). The first pointer press outside the line now takes it
 *    down and is let through; a press on the line itself still confirms it.
 * 2. **No key-only copy on a touch screen (both games' holding line, i.e. FFX).**
 *    The line's foot read ENTER CONTINUE on a phone. The briefing already swaps
 *    its key labels for TAP on a coarse pointer (PR-0073); the line now carries
 *    both wordings and the same pure-CSS swap.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { CoachMark } from '../../src/ui/coach/CoachMark.ts';
import { marksFor } from '../../src/ui/coach/coachCopy.ts';

const COACH_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/coach');
const COACH_CSS = ['coach.css', 'coach-taps.css'].map((f) => readFileSync(join(COACH_DIR, f), 'utf8')).join('\n');

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(game: 'ffx' | 'ffx2'): { line: CoachMark; attack: HTMLElement; clicks: () => number } {
  const host = document.createElement('div');
  let n = 0;
  host.innerHTML = '<div class="ffxhud"><div class="ig-cmd" data-row="attack">ATTACK</div></div><div class="coach-layer"></div>';
  document.body.appendChild(host);
  const attack = host.querySelector('.ig-cmd') as HTMLElement;
  attack.addEventListener('pointerdown', () => {
    n += 1;
  });
  const layer = host.querySelector('.coach-layer') as HTMLElement;
  const line = new CoachMark({
    root: layer,
    mark: marksFor(game)[0]!,
    game,
    reduceMotion: true,
    setTimer: () => 0,
    clearTimer: () => undefined,
  });
  return { line, attack, clicks: () => n };
}

function pointerdown(target: Element): void {
  // jsdom has no PointerEvent constructor in every version; a MouseEvent of type
  // 'pointerdown' travels the same capture/bubble path.
  target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, composed: true }));
}

describe('a pointer press on the menu answers the coach line (both games)', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    it(`${game}: pressing ATTACK takes the line down and still reaches ATTACK`, async () => {
      const { line, attack, clicks } = mount(game);
      const settled = line.show();
      expect(line.el.isConnected).toBe(true);
      pointerdown(attack);
      expect(line.finished).toBe(true);
      expect(line.el.isConnected).toBe(false);
      expect(clicks()).toBe(1);
      if (game === 'ffx') await expect(settled).resolves.toBe('confirmed');
    });
  }

  it('a press on the line itself does not count as a press elsewhere (its own click confirms it)', async () => {
    const { line } = mount('ffx');
    const settled = line.show();
    pointerdown(line.el);
    expect(line.finished).toBe(false);
    line.el.click();
    await expect(settled).resolves.toBe('confirmed');
  });

  it('after the line is down, pointer presses are nobody’s business but the page’s', () => {
    const { line, attack, clicks } = mount('ffx');
    void line.show();
    line.dismiss();
    pointerdown(attack);
    pointerdown(attack);
    expect(clicks()).toBe(2);
  });

  it('a line whose HUD was torn down claims nothing', () => {
    const { line, attack } = mount('ffx');
    void line.show();
    line.el.remove();
    pointerdown(attack);
    expect(line.finished).toBe(false);
  });
});

describe('the holding line has a tap wording for touch screens (FFX)', () => {
  it('the foot carries both the key and the tap label', () => {
    const { line } = mount('ffx');
    const foot = line.el.querySelector('.coach-mark__foot') as HTMLElement;
    expect(foot.querySelector('.coach-mark__key')?.textContent).toBe('Enter');
    expect(foot.querySelector('.coach-mark__tap')?.textContent).toBe('Tap');
  });

  it('the coach CSS hides the tap label by default and swaps the two on a coarse pointer', () => {
    expect(COACH_CSS).toMatch(/\.coach-mark__tap\s*\{[^}]*display:\s*none/);
    const coarse = COACH_CSS.split('@media (pointer: coarse)').slice(1).join('\n');
    expect(coarse).toMatch(/\.coach-mark__foot \.coach-mark__key\s*\{\s*display:\s*none;?\s*\}/);
    expect(coarse).toMatch(/\.coach-mark__foot \.coach-mark__tap\s*\{\s*display:\s*inline;?\s*\}/);
  });
});
