// @vitest-environment jsdom
/**
 * U4 (PR-0305, FFX-2 only): the command-help band follows BATTLE HELP and the highlight on every frame, and a
 * hidden band never keeps a sentence for the phone's foot line to read.
 */

import { describe, expect, it } from 'vitest';
import { CommandHelp } from '../../src/ui/ffx2/commandHelpSync.ts';

function band(): { el: HTMLElement; label: () => string; text: () => string } {
  const el = document.createElement('div');
  el.innerHTML = '<span data-role="label"></span><span data-role="text"></span>';
  el.hidden = true;
  return { el, label: () => el.querySelector('[data-role="label"]')!.textContent ?? '', text: () => el.querySelector('[data-role="text"]')!.textContent ?? '' };
}

describe('CommandHelp (U4)', () => {
  it('shows the highlighted row\'s sentence and re-parks the band only when it appears', () => {
    const b = band();
    let placed = 0;
    const help = new CommandHelp(b.el, () => true, () => placed++);
    help.set('ATTACK', 'Physical damage');
    expect(b.el.hidden).toBe(false);
    expect([b.label(), b.text()]).toEqual(['ATTACK', 'Physical damage']);
    help.set('SKILL', 'Open the Skill menu.');
    expect(b.text()).toBe('Open the Skill menu.');
    expect(placed).toBe(1);
  });

  it('hides the band on the first frame after BATTLE HELP goes off, and clears its text', () => {
    const b = band();
    let on = true;
    const help = new CommandHelp(b.el, () => on, () => undefined);
    help.set('ATTACK', 'Physical damage');
    on = false; // the pause's OPTIONS row: no highlight moved
    help.sync();
    expect(b.el.hidden).toBe(true);
    expect([b.label(), b.text()]).toEqual(['', '']);
  });

  it('brings the current row\'s sentence back when help is turned on again mid-menu', () => {
    const b = band();
    let on = false;
    const help = new CommandHelp(b.el, () => on, () => undefined);
    help.set('WHITE MAGIC', 'Open the White Magic menu.');
    expect(b.el.hidden).toBe(true);
    help.set('ATTACK', 'Physical damage'); // the next actor's menu, help still off
    on = true;
    help.sync();
    expect(b.el.hidden).toBe(false);
    expect(b.text()).toBe('Physical damage'); // the actor's own row, never the earlier menu's
  });

  it('a closing menu (empty sentence) hides and clears the band', () => {
    const b = band();
    const help = new CommandHelp(b.el, () => true, () => undefined);
    help.set('ATTACK', 'Physical damage');
    help.set('', '');
    expect(b.el.hidden).toBe(true);
    expect(b.text()).toBe('');
  });
});
